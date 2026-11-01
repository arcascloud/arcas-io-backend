import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tfecma } from './entities/fecma.entity';
import { Tfecdet } from './entities/fecdet.entity';
import { Tusuarios } from '../users/entities/usuario.entity';
import { RolesService, ROLES_FECHAS } from '../users/roles.service';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import {
  CreateFecmaDto, UpdateFecmaDto, CreateFecdetDto, UpdateFecdetDto,
} from './dto/fec.dto';

/** Respuesta del chequeo de autorización para escribir en una fecha dada. */
export interface AutorizacionFec {
  autorizado: boolean;
  motivo: string;
  fecmaeId?: number;
  fec_vig_desde?: Date;
  fec_vig_hasta?: Date;
}

/**
 * Fechas autorizadas (tfecma / tfecdet).
 *
 * Regla de negocio: un usuario puede registrar datos en una fecha (por lo
 * general un período ya cerrado) SOLO si:
 *   1. existe un maestro de la empresa cuyo rango [fec_vig_desde, fec_vig_hasta]
 *      contiene la fecha consultada, y
 *   2. ese usuario aparece en el detalle (tfecdet) de ese maestro con
 *      sn_permitido = 'S'.
 *
 * La administración del módulo (CRUD) está reservada a los roles admin,
 * supervisor y contador (ROLES_FECHAS).
 */
@Injectable()
export class FecService {
  constructor(
    @InjectRepository(Tfecma) private readonly fecmaRepo: Repository<Tfecma>,
    @InjectRepository(Tfecdet) private readonly fecdetRepo: Repository<Tfecdet>,
    @InjectRepository(Tusuarios) private readonly usuariosRepo: Repository<Tusuarios>,
    private readonly rolesService: RolesService,
    private readonly fechaSistema: FechaSistemaService,
    private readonly dataSource: DataSource,
  ) {}

  // ══════════════════════════ Guardas de rol ══════════════════════════

  /**
   * Lanza 403 si el usuario no es admin/supervisor/contador para la empresa.
   * Se invoca en TODOS los endpoints de escritura del módulo.
   */
  private async exigirRolFechas(usuario: string, empresaId: number): Promise<void> {
    const ok = await this.rolesService.esRolFechas(usuario, empresaId);
    if (!ok) {
      throw new ForbiddenException(
        `Acceso restringido: solo los roles ${ROLES_FECHAS.join(', ')} pueden administrar fechas autorizadas`,
      );
    }
  }

  // ══════════════════════════ Validaciones de datos ══════════════════════════

  /** Valida coherencia del rango de fechas (comparación en fecha local). */
  private validarRango(desde: Date | string, hasta: Date | string): void {
    const d = this.parseFechaLocal(desde);
    const h = this.parseFechaLocal(hasta);
    if (isNaN(d.getTime()) || isNaN(h.getTime())) {
      throw new BadRequestException('Fechas de vigencia inválidas');
    }
    if (d > h) {
      throw new BadRequestException('La fecha "desde" no puede ser mayor que la fecha "hasta"');
    }
  }

  /** Valida que los usuarios del detalle existan en tunuarios (evita violar FK). */
  private async validarUsuariosDetalle(usuarios: string[], empresaId: number): Promise<void> {
    const unicos = [...new Set(usuarios)];
    if (unicos.length !== usuarios.length) {
      throw new BadRequestException('El detalle contiene usuarios duplicados');
    }
    if (unicos.length === 0) return;
    const encontrados = await this.usuariosRepo.find({
      where: unicos.map((usuario) => ({ usuario } as any)),
    });
    const faltantes = unicos.filter(
      (u) => !encontrados.some((e) => e.usuario === u),
    );
    if (faltantes.length) {
      throw new BadRequestException(
        `Usuario(s) no existente(s) en el sistema: ${faltantes.join(', ')}`,
      );
    }
    // FK_tfecdet_tempresas: la empresa debe existir para insertar el detalle
    const existeEmpresa = await this.dataSource.query(
      'SELECT 1 FROM tempresas WHERE empresaId = ? LIMIT 1',
      [empresaId],
    );
    if (!existeEmpresa.length) {
      throw new BadRequestException(`La empresa ${empresaId} no existe`);
    }
  }

  // ══════════════════════════ Lectura (maestro) ══════════════════════════

  /** Lista los maestros con su detalle, ordenados por vigencia descendente. */
  async findAllFecma(empresaId: number): Promise<(Tfecma & { detalles: Tfecdet[] })[]> {
    const maestros = await this.fecmaRepo.find({
      where: { empresaId },
      order: { fec_vig_desde: 'DESC', tfecmaId: 'DESC' },
    });
    if (!maestros.length) return [];

    const detalles = await this.fecdetRepo.find({
      where: { empresaId },
      order: { fecdetId: 'ASC' },
    });

    return maestros.map((m) => ({
      ...m,
      detalles: detalles.filter((d) => d.fecmaeId === m.tfecmaId),
    }));
  }

  /** Obtiene un maestro con su detalle. */
  async findFecma(id: number, empresaId: number) {
    const maestro = await this.fecmaRepo.findOne({ where: { tfecmaId: id, empresaId } });
    if (!maestro) throw new NotFoundException(`Fecha autorizada ${id} no encontrada`);
    const detalles = await this.fecdetRepo.find({
      where: { fecmaeId: id },
      order: { fecdetId: 'ASC' },
    });
    return { ...maestro, detalles };
  }

  /** Indica si el rango está vigente respecto a la fecha del sistema. */
  esVigente(maestro: Tfecma, hoy: Date = new Date()): boolean {
    const desde = new Date(maestro.fec_vig_desde);
    const hasta = new Date(maestro.fec_vig_hasta);
    const t = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
    return t >= new Date(desde.getFullYear(), desde.getMonth(), desde.getDate()).getTime()
      && t <= new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate()).getTime();
  }

  // ══════════════════════════ Escritura (maestro + detalle) ══════════════════════════

  /**
   * Crea el maestro y TODAS sus líneas de detalle dentro de UNA transacción.
   * Si cualquier línea falla, no se persiste nada.
   */
  async createFecma(dto: CreateFecmaDto, usuario: string, empresaId: number) {
    await this.exigirRolFechas(usuario, empresaId);
    this.validarRango(dto.fec_vig_desde, dto.fec_vig_hasta);
    const usuariosDetalle = (dto.detalles ?? []).map((d) => d.usuario);
    await this.validarUsuariosDetalle(usuariosDetalle, empresaId);

    const ahora = await this.fechaSistema.getFecha(empresaId);
    const detalles = dto.detalles ?? [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const maestro = await queryRunner.manager.save(Tfecma, {
        // Fecha contable elegida en el form; si no viene, la Fecha del Sistema
        fechasistema: dto.fechasistema || ahora,
        fec_vig_desde: dto.fec_vig_desde,
        fec_vig_hasta: dto.fec_vig_hasta,
        empresaId,
        usuarioCreated: usuario,
        fechaCreated: ahora,
        usuarioUpdate: '0',
        fechaUpdate: ahora,
      } as any);

      if (detalles.length) {
        await queryRunner.manager.insert(
          Tfecdet,
          detalles.map((d) => ({
            fecmaeId: maestro.tfecmaId,
            usuario: d.usuario,
            sn_permitido: d.sn_permitido || 'S',
            empresaId,
            usuarioCreated: usuario,
            fechaCreated: ahora,
            usuarioUpdate: '0',
            fechaUpdate: ahora,
          })),
        );
      }

      await queryRunner.commitTransaction();
      return this.findFecma(maestro.tfecmaId, empresaId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Actualiza el maestro y REEMPLAZA su detalle completo dentro de UNA
   * transacción (borra las líneas previas y da de alta las nuevas).
   */
  async updateFecma(id: number, dto: UpdateFecmaDto, usuario: string, empresaId: number) {
    await this.exigirRolFechas(usuario, empresaId);

    const actual = await this.fecmaRepo.findOne({ where: { tfecmaId: id, empresaId } });
    if (!actual) throw new NotFoundException(`Fecha autorizada ${id} no encontrada`);

    const nuevoDesde = dto.fec_vig_desde ?? actual.fec_vig_desde;
    const nuevoHasta = dto.fec_vig_hasta ?? actual.fec_vig_hasta;
    this.validarRango(nuevoDesde, nuevoHasta);

    const reemplazar = dto.detalles !== undefined;
    if (reemplazar) {
      await this.validarUsuariosDetalle(
        (dto.detalles ?? []).map((d) => d.usuario), empresaId,
      );
    }

    const ahora = await this.fechaSistema.getFecha(empresaId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.update(Tfecma, { tfecmaId: id, empresaId }, {
        fec_vig_desde: nuevoDesde,
        fec_vig_hasta: nuevoHasta,
        ...(dto.fechasistema ? { fechasistema: dto.fechasistema } : {}),
        usuarioUpdate: usuario,
        fechaUpdate: ahora,
      } as any);

      if (reemplazar) {
        await queryRunner.manager.delete(Tfecdet, { fecmaeId: id });
        const detalles = dto.detalles ?? [];
        if (detalles.length) {
          await queryRunner.manager.insert(
            Tfecdet,
            detalles.map((d) => ({
              fecmaeId: id,
              usuario: d.usuario,
              sn_permitido: d.sn_permitido || 'S',
              empresaId,
              usuarioCreated: usuario,
              fechaCreated: ahora,
              usuarioUpdate: '0',
              fechaUpdate: ahora,
            })),
          );
        }
      }

      await queryRunner.commitTransaction();
      return this.findFecma(id, empresaId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /** Elimina el maestro y (por FK ON DELETE CASCADE) sus líneas. */
  async removeFecma(id: number, usuario: string, empresaId: number) {
    await this.exigirRolFechas(usuario, empresaId);
    const actual = await this.fecmaRepo.findOne({ where: { tfecmaId: id, empresaId } });
    if (!actual) throw new NotFoundException(`Fecha autorizada ${id} no encontrada`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Borra el detalle primero: la FK es RESTRICT para el detalle→tusuarios
      // y CASCADE para detalle→maestro; lo explícito evita depender del modo.
      await queryRunner.manager.delete(Tfecdet, { fecmaeId: id });
      await queryRunner.manager.delete(Tfecma, { tfecmaId: id, empresaId });
      await queryRunner.commitTransaction();
      return { eliminado: true, tfecmaId: id };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ══════════════════════════ Lectura (detalle) ══════════════════════════

  async findAllFecdet(empresaId: number, fecmaeId?: number) {
    const where: any = { empresaId };
    if (fecmaeId != null) where.fecmaeId = fecmaeId;
    return this.fecdetRepo.find({ where, order: { fecdetId: 'ASC' } });
  }

  async findFecdet(id: number, empresaId: number) {
    const found = await this.fecdetRepo.findOne({ where: { fecdetId: id, empresaId } });
    if (!found) throw new NotFoundException(`Detalle de fecha ${id} no encontrado`);
    return found;
  }

  // ══════════════════════════ Escritura (detalle) ══════════════════════════

  async createFecdet(dto: CreateFecdetDto, usuario: string, empresaId: number) {
    await this.exigirRolFechas(usuario, empresaId);
    const mae = await this.fecmaRepo.findOne({
      where: { tfecmaId: dto.fecmaeId, empresaId },
    });
    if (!mae) throw new NotFoundException(`Fecha autorizada ${dto.fecmaeId} no encontrada`);

    await this.validarUsuariosDetalle([dto.usuario], empresaId);
    const ahora = await this.fechaSistema.getFecha(empresaId);

    const linea = await this.fecdetRepo.save({
      fecmaeId: dto.fecmaeId,
      usuario: dto.usuario,
      sn_permitido: dto.sn_permitido || 'S',
      empresaId,
      usuarioCreated: usuario,
      fechaCreated: ahora,
      usuarioUpdate: '0',
      fechaUpdate: ahora,
    } as any);
    return linea;
  }

  async updateFecdet(id: number, dto: UpdateFecdetDto, usuario: string, empresaId: number) {
    await this.exigirRolFechas(usuario, empresaId);
    const actual = await this.findFecdet(id, empresaId);

    const nuevoUsuario = dto.usuario ?? actual.usuario;
    if (nuevoUsuario !== actual.usuario) {
      await this.validarUsuariosDetalle([nuevoUsuario], empresaId);
    }
    if (dto.fecmaeId != null && dto.fecmaeId !== actual.fecmaeId) {
      const mae = await this.fecmaRepo.findOne({
        where: { tfecmaId: dto.fecmaeId, empresaId },
      });
      if (!mae) throw new NotFoundException(`Fecha autorizada ${dto.fecmaeId} no encontrada`);
    }

    const ahora = await this.fechaSistema.getFecha(empresaId);
    Object.assign(actual, {
      fecmaeId: dto.fecmaeId ?? actual.fecmaeId,
      usuario: nuevoUsuario,
      sn_permitido: dto.sn_permitido ?? actual.sn_permitido,
      usuarioUpdate: usuario,
      fechaUpdate: ahora,
    });
    return this.fecdetRepo.save(actual);
  }

  async removeFecdet(id: number, usuario: string, empresaId: number) {
    await this.exigirRolFechas(usuario, empresaId);
    const actual = await this.findFecdet(id, empresaId);
    await this.fecdetRepo.delete(actual.fecdetId);
    return { eliminado: true, fecdetId: id };
  }

  // ══════════════════════════ Regla de negocio ══════════════════════════

  /**
   * ¿Puede `usuario` registrar datos en `fecha`?
   *
   * Devuelve `autorizado: true` si la fecha cae dentro del rango de algún
   * maestro de la empresa Y el usuario está en su detalle con sn_permitido='S'.
   * Si `fecha` no se indica, usa `tempresas.fechasistema`.
   *
   * Es la consulta que deben invocar los demás módulos (facturación,
   * contabilidad, inventario) antes de permitir una escritura sobre un
   * período cerrado.
   */
  async autorizar(usuario: string, empresaId: number, fecha?: string | Date): Promise<AutorizacionFec> {
    const fechaRef = fecha ? this.parseFechaLocal(fecha) : await this.fechaSistema.getFecha(empresaId);
    if (isNaN(fechaRef.getTime())) {
      throw new BadRequestException('Fecha inválida para el chequeo de autorización');
    }

    // Normaliza a fecha pura (sin hora) para comparar contra el rango
    const dia = new Date(fechaRef.getFullYear(), fechaRef.getMonth(), fechaRef.getDate());

    const maestros = await this.fecmaRepo.find({ where: { empresaId } });
    const candidatos = maestros.filter((m) => {
      const d = new Date(m.fec_vig_desde);
      const h = new Date(m.fec_vig_hasta);
      const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const hh = new Date(h.getFullYear(), h.getMonth(), h.getDate());
      return dia >= dd && dia <= hh;
    });

    if (!candidatos.length) {
      return {
        autorizado: false,
        motivo: `No existe un rango de fechas autorizadas que contenga el ${this.fmt(dia)}`,
      };
    }

    for (const mae of candidatos) {
      const linea = await this.fecdetRepo.findOne({
        where: { fecmaeId: mae.tfecmaId, usuario, sn_permitido: 'S' },
      });
      if (linea) {
        return {
          autorizado: true,
          motivo: `Usuario habilitado en el rango ${this.fmt(new Date(mae.fec_vig_desde))} al ${this.fmt(new Date(mae.fec_vig_hasta))}`,
          fecmaeId: mae.tfecmaId,
          fec_vig_desde: mae.fec_vig_desde,
          fec_vig_hasta: mae.fec_vig_hasta,
        };
      }
    }

    return {
      autorizado: false,
      motivo: `El usuario "${usuario}" no está habilitado en el detalle del rango que contiene el ${this.fmt(dia)}`,
      fecmaeId: candidatos[0].tfecmaId,
      fec_vig_desde: candidatos[0].fec_vig_desde,
      fec_vig_hasta: candidatos[0].fec_vig_hasta,
    };
  }

  // ════════════════════════ Fecha del Sistema del ERP ════════════════════════

  /**
   * Estado de `tempresas.fechasistema` frente a `CURDATE()` de MySQL.
   * Es la consulta que el frontend usa para saber si el sistema est� desalineado.
   */
  async getEstadoFechaSistema(empresaId: number) {
    return this.fechaSistema.getEstado(empresaId);
  }

  /**
   * Cambia la Fecha del Sistema del ERP (`tempresas.fechasistema`).
   *
   * - Solo roles admin / supervisor / contador (ROLES_FECHAS).
   * - Endpoint EXENTO del bloqueo por fecha desalineada: sin �l no habr�a
   *   forma de corregirla (circuito cerrado).
   *
   * @param fecha `YYYY-MM-DD`
   */
  async actualizarFechaSistema(fecha: string, usuario: string, empresaId: number) {
    await this.exigirRolFechas(usuario, empresaId);

    const estado = await this.fechaSistema.getEstado(empresaId);
    if (!estado.fechaSistema) {
      throw new NotFoundException(
        `No existe registro de la empresa ${empresaId} en tempresas; no se puede asignar la Fecha del Sistema`,
      );
    }

    // DATE directo en SQL: evita cualquier corrimiento de zona horaria al serializar un Date.
    // LEFT(?,20) por el ancho real de `tempresas.usuarioUpdated` (varchar(20)).
    await this.dataSource.query(
      `UPDATE tempresas
          SET fechasistema = ?,
              usuarioUpdated = LEFT(?, 20),
              fechaUpdated   = NOW()
        WHERE empresaId = ?`,
      [`${fecha} 00:00:00`, usuario, empresaId],
    );

    return this.fechaSistema.getEstado(empresaId);
  }

  /**
   * Parsea una fecha **como fecha local**, evitando el corrimiento de un d�a
   * que produce `new Date('2026-10-06')` (que se interpreta como medianoche
   * UTC y en UTC-6 cae el 05/10).
   *
   * Acepta `'YYYY-MM-DD'`, `'YYYY-MM-DDTHH:mm:ss'`, ISO con zona y objetos Date.
   */
  private parseFechaLocal(valor: string | Date): Date {
    if (valor instanceof Date) return valor;
    const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());
    if (soloFecha) {
      return new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]));
    }
    // Con hora: usa los componentes locales para no desplazar el día
    const conHora = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(valor.trim());
    if (conHora) {
      return new Date(
        Number(conHora[1]), Number(conHora[2]) - 1, Number(conHora[3]),
        Number(conHora[4]), Number(conHora[5]), Number(conHora[6] || '0'),
      );
    }
    return new Date(valor);
  }

  /** Etiqueta legible dd/mm/aaaa (sin `new Date()` en templates). */
  private fmt(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }
}
