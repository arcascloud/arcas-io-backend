import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trasaviblidad } from './entities/trasaviblidad.entity';
import { Copdamae } from './entities/copdamae.entity';
import { Tmodulos } from '../modules/entities/modulo.entity';
import { Tsucursal } from '../sucursales/entities/sucursal.entity';
import { Tusuarios } from '../users/entities/usuario.entity';
import { Tempresas } from '../companies/entities/empresa.entity';
import { CreateTrasaviblidadDto, BulkTrasaviblidadDto } from './dto/trasaviblidad.dto';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';

/**
 * Tablas transaccionales cuyo ID maestro se registra en `trasaviblidad`
 * (central de transacciones) y su módulo dueño.
 */
export const TABLAS_TRAZABLES: { tabla: string; moduloId: number; modulo: string }[] = [
  { tabla: 'invmovmae', moduloId: 2, modulo: 'INVENTARIOS' },
  { tabla: 'invfismae', moduloId: 2, modulo: 'INVENTARIOS' },
  { tabla: 'invreqmae', moduloId: 2, modulo: 'INVENTARIOS' },
  { tabla: 'invtrasmae', moduloId: 2, modulo: 'INVENTARIOS' },
  { tabla: 'posfacmae', moduloId: 3, modulo: 'FACTURACION' },
  { tabla: 'posfacmaeanul', moduloId: 3, modulo: 'FACTURACION' },
  { tabla: 'posfacmov', moduloId: 3, modulo: 'FACTURACION' },
  { tabla: 'posfaccaja', moduloId: 3, modulo: 'FACTURACION' },
  { tabla: 'poscotmae', moduloId: 3, modulo: 'FACTURACION' },
  { tabla: 'pospedmae', moduloId: 3, modulo: 'FACTURACION' },
  { tabla: 'cxccajamae', moduloId: 4, modulo: 'CXC' },
  { tabla: 'cxcmovimientos', moduloId: 4, modulo: 'CXC' },
  { tabla: 'cxpcomprasmae', moduloId: 5, modulo: 'CXP' },
  { tabla: 'cxpmovimientos', moduloId: 5, modulo: 'CXP' },
  { tabla: 'bcosmovimientos', moduloId: 6, modulo: 'BANCOS' },
  { tabla: 'copdamae', moduloId: 7, modulo: 'CONTABILIDAD' },
  { tabla: 'cocierremae', moduloId: 7, modulo: 'CONTABILIDAD' },
  { tabla: 'pleplamae', moduloId: 8, modulo: 'PLANILLA' },
];

@Injectable()
export class TrasaviblidadService {
  constructor(
    @InjectRepository(Trasaviblidad)
    private readonly repo: Repository<Trasaviblidad>,
    @InjectRepository(Copdamae)
    private readonly partidaRepo: Repository<Copdamae>,
    @InjectRepository(Tmodulos)
    private readonly moduloRepo: Repository<Tmodulos>,
    @InjectRepository(Tsucursal)
    private readonly sucursalRepo: Repository<Tsucursal>,
    @InjectRepository(Tusuarios)
    private readonly usuarioRepo: Repository<Tusuarios>,
    @InjectRepository(Tempresas)
    private readonly empresaRepo: Repository<Tempresas>,
    private readonly fechaSistema: FechaSistemaService,
  ) {}

  // ===== Catálogo de tablas trazables =====

  findTablas() {
    return TABLAS_TRAZABLES;
  }

  // ===== Consulta =====

  async findAll(
    empresaId: number,
    filtros: { moduloId?: number; partidaId?: number; referenciaId?: number; limit?: number },
  ) {
    const where: any = { empresaId };
    if (filtros.moduloId != null) where.moduloId = filtros.moduloId;
    if (filtros.partidaId != null) where.partidaId = filtros.partidaId;
    if (filtros.referenciaId != null) where.referenciaId = filtros.referenciaId;
    const take = Math.min(Math.max(Number(filtros.limit) || 500, 1), 5000);
    return this.repo.find({ where, order: { id: 'DESC' }, take });
  }

  async findOne(id: number, empresaId: number) {
    const row = await this.repo.findOne({ where: { id, empresaId } });
    if (!row) throw new NotFoundException(`Registro de trazabilidad #${id} no encontrado`);
    return row;
  }

  /** Todos los registros maestros que apuntan a una partida contable */
  porPartida(partidaId: number, empresaId: number) {
    return this.repo.find({
      where: { partidaId, empresaId },
      order: { id: 'ASC' },
    });
  }

  /** Traza de un documento maestro: a qué partida contable quedó integrado */
  porReferencia(moduloId: number, referenciaId: number, empresaId: number) {
    return this.repo.find({
      where: { moduloId, referenciaId, empresaId },
      order: { id: 'ASC' },
    });
  }

  // ===== Escritura =====

  /**
   * Crear una trazabilidad. Es IDEMPOTENTE: si ya existe una fila idéntica
   * (misma empresa, módulo, referencia, partida y sucursal) se devuelve esa
   * en vez de duplicarla — reintentar un proceso no ensucia la central.
   */
  async create(dto: CreateTrasaviblidadDto, usuario: string) {
    await this.validarFks(dto);
    await this.validarUsuario(usuario);
    // `any` porque FindOptionsWhere no acepta null en columnas anulables
    const donde: any = {
      empresaId: dto.empresaId,
      moduloId: dto.moduloId ?? null,
      referenciaId: dto.referenciaId ?? null,
      partidaId: dto.partidaId ?? null,
      Idsucursal: dto.Idsucursal ?? null,
    };
    const existente = await this.repo.findOne({ where: donde });
    if (existente) return existente;
    return this.repo.save(
      this.repo.create({
        referenciaId: dto.referenciaId ?? null,
        moduloId: dto.moduloId ?? null,
        partidaId: dto.partidaId ?? null,
        Idsucursal: dto.Idsucursal ?? null,
        empresaId: dto.empresaId,
        usuarioCreated: usuario || null,
        // Reglas 1 y 4: trasaviblidad está en la lista → fecha del backend
        // (antes caía al default CURRENT_TIMESTAMP = reloj del servidor)
        fecharegistro: await this.fechaSistema.obtenerFechaRegistro(usuario, dto.empresaId),
      }),
    );
  }

  /** Alta masiva (una partida con todos sus documentos, por ejemplo) */
  async createBulk(dto: BulkTrasaviblidadDto, usuario: string) {
    const registros: Trasaviblidad[] = [];
    for (const item of dto.registros) {
      registros.push(await this.create(item, usuario));
    }
    return { total: registros.length, registros };
  }

  /**
   * Asigna/actualiza la partida contable de la traza de un documento maestro.
   * Si aún no hay fila, la crea (el documento se traza al alta, la partida
   * llega después al contabilizar).
   */
  async asignarPartida(
    moduloId: number,
    referenciaId: number,
    partidaId: number,
    empresaId: number,
    idsucursal: number | null,
    usuario: string | null,
  ): Promise<Trasaviblidad | null> {
    if (!partidaId || !referenciaId) return null;
    await this.validarFks({ empresaId, moduloId, referenciaId, partidaId, Idsucursal: idsucursal ?? undefined });
    await this.validarUsuario(usuario);

    const donde: any = { empresaId, moduloId, referenciaId };
    const existente = await this.repo.findOne({ where: donde });

    if (existente) {
      const cambia = existente.partidaId !== partidaId;
      const cambiaSuc = existente.Idsucursal == null && idsucursal != null;
      if (!cambia && !cambiaSuc) return existente;
      if (cambia) existente.partidaId = partidaId;
      if (cambiaSuc) existente.Idsucursal = idsucursal;
      return this.repo.save(existente);
    }

    return this.repo.save(
      this.repo.create({
        empresaId,
        moduloId,
        referenciaId,
        partidaId,
        Idsucursal: idsucursal ?? null,
        usuarioCreated: usuario || null,
        // Reglas 1 y 4: trasaviblidad está en la lista → fecha del backend
        fecharegistro: await this.fechaSistema.obtenerFechaRegistro(usuario ?? undefined, empresaId),
      }),
    );
  }

  async remove(id: number, empresaId: number) {
    const row = await this.findOne(id, empresaId);
    await this.repo.remove(row);
    return { eliminado: true, id };
  }

  // ===== Validaciones (los FK de la BD devuelven 500; acá se convierten en 400) =====

  private async validarFks(dto: CreateTrasaviblidadDto) {
    const problemas: string[] = [];

    if (dto.empresaId != null && !(await this.existe(this.empresaRepo, 'empresaId', dto.empresaId))) {
      problemas.push(`empresaId ${dto.empresaId} no existe en tempresas`);
    }
    if (dto.moduloId != null && !(await this.existe(this.moduloRepo, 'moduloId', dto.moduloId))) {
      problemas.push(`moduloId ${dto.moduloId} no existe en tmodulos`);
    }
    if (dto.partidaId != null && !(await this.existe(this.partidaRepo, 'partidaId', dto.partidaId))) {
      problemas.push(`partidaId ${dto.partidaId} no existe en copdamae`);
    }
    if (dto.Idsucursal != null && !(await this.existe(this.sucursalRepo, 'Idsucursal', dto.Idsucursal))) {
      problemas.push(`Idsucursal ${dto.Idsucursal} no existe en tsucursal`);
    }

    if (problemas.length) throw new BadRequestException(problemas.join(' · '));
  }

  private async existe(repo: Repository<any>, campo: string, valor: any): Promise<boolean> {
    const r = await repo
      .createQueryBuilder('t')
      .select('1', 'x')
      .where(`t.${campo} = :v`, { v: valor })
      .getRawOne();
    return !!r;
  }

  /** Validación del autor (la columna es FK a tusuarios.usuario) */
  async validarUsuario(usuario: string | null | undefined): Promise<void> {
    if (!usuario) return;
    if (!(await this.existe(this.usuarioRepo, 'usuario', usuario))) {
      throw new BadRequestException(`usuarioCreated '${usuario}' no existe en tusuarios`);
    }
  }
}
