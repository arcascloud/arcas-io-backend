import {
  Injectable, BadRequestException, NotFoundException,
  ForbiddenException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TPosCajaSesion } from './entities/poscajasesion.entity';
import { TPosCajaMovimiento } from './entities/poscajamovimiento.entity';
import { TPosCajaCorte } from './entities/poscajacorte.entity';
import { AbrirCajaSesionDto, CerrarCajaSesionDto, CreateCajaMovimientoDto, GenerarCorteDto } from './dto/caja-sesion.dto';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { Cxccajero } from '../cxc/entities/cxccajero.entity';
import { TusuarioCaja } from '../parametros/entities/usuario-caja.entity';

/**
 * Roles que pueden abrir turno en una caja distinta a la asignada en
 * `tusuarios_caja` (cobertura de turnos, caja ajena).
 */
export const ROLES_CAJA_LIBRE = ['admin', 'supervisor'];

/** Caja que el usuario autenticado puede operar */
export interface CajaDisponible {
  cajaId: number;
  usuario: string;
  nombre: string;
  /** true si viene de `tusuarios_caja` (asignación formal), false si es titular en `cxccajeros` */
  asignada: boolean;
}

@Injectable()
export class CajaSesionService {
  constructor(
    @InjectRepository(TPosCajaSesion)
    private readonly sesionRepo: Repository<TPosCajaSesion>,
    @InjectRepository(TPosCajaMovimiento)
    private readonly movimientoRepo: Repository<TPosCajaMovimiento>,
    @InjectRepository(TPosCajaCorte)
    private readonly corteRepo: Repository<TPosCajaCorte>,
    @InjectRepository(Cxccajero)
    private readonly cajeroRepo: Repository<Cxccajero>,
    @InjectRepository(TusuarioCaja)
    private readonly usuarioCajaRepo: Repository<TusuarioCaja>,
    private readonly fechaSistemaService: FechaSistemaService,
  ) {}

  /**
   * Cajas que el usuario puede operar.
   *
   * Orden de resolución:
   *   1. `tusuarios_caja` (usuario + empresaId + sn_activo='S') → asignación formal
   *   2. fallback `cxccajeros.usuario`                          → titular histórico
   *   3. admin/supervisor sin asignación                        → todas las cajas activas
   *
   * Solo se devuelven cajas activas (`cxccajeros.sn_activo='S'`).
   */
  async cajasDisponibles(
    empresaId: number,
    usuario: string,
    roles: string[] = [],
  ): Promise<CajaDisponible[]> {
    const activas = await this.cajeroRepo.find({
      where: { empresaId, sn_activo: 'S' },
      order: { cajaId: 'ASC' },
    });

    if (activas.length === 0) return [];

    const asignaciones = await this.usuarioCajaRepo.find({
      where: { usuario, empresaId, sn_activo: 'S' },
      order: { id: 'ASC' },
    });

    let ids = asignaciones.map((a) => Number(a.cajaId)).filter((id) => id > 0);

    if (ids.length === 0) {
      ids = activas.filter((c) => c.usuario === usuario).map((c) => c.cajaId);
    }

    const privilegiado = roles.some((r) => ROLES_CAJA_LIBRE.includes(r));
    if (ids.length === 0 && privilegiado) {
      ids = activas.map((c) => c.cajaId);
    }

    return activas
      .filter((c) => ids.includes(Number(c.cajaId)))
      .map((c) => ({
        cajaId: Number(c.cajaId),
        usuario: c.usuario,
        nombre: `Caja ${c.cajaId} · ${c.usuario}`,
        asignada: asignaciones.some((a) => Number(a.cajaId) === Number(c.cajaId)),
      }));
  }

  /**
   * Determina la caja del turno a abrir.
   *
   * - `cajaIdSolicitado` debe estar entre las cajas autorizadas → si no, 403.
   * - Sin `cajaId` y una sola caja autorizada → se usa esa (regla: 1 usuario = 1 caja).
   * - Sin `cajaId` y varias (solo admin/supervisor) → la que tiene como titular,
   *   si no la primera por `cajaId`.
   */
  private async resolverCajaAutorizada(
    empresaId: number,
    usuario: string,
    roles: string[],
    cajaIdSolicitado?: number,
  ): Promise<CajaDisponible> {
    const disponibles = await this.cajasDisponibles(empresaId, usuario, roles);

    if (disponibles.length === 0) {
      throw new ForbiddenException(
        `El usuario ${usuario} no tiene ninguna caja asignada. Solicite la asignación en Configuración → Usuarios de Caja.`,
      );
    }

    const solicitado = cajaIdSolicitado != null ? Number(cajaIdSolicitado) : 0;
    if (solicitado > 0) {
      const caja = disponibles.find((c) => c.cajaId === solicitado);
      if (!caja) {
        throw new ForbiddenException(
          `El usuario ${usuario} no está autorizado para operar la caja #${solicitado}`,
        );
      }
      return caja;
    }

    if (disponibles.length === 1) return disponibles[0];

    return disponibles.find((c) => c.usuario === usuario) ?? disponibles[0];
  }

  /**
   * Abre un turno de caja.
   *
   * Reglas aplicadas:
   *  - R1: el usuario solo opera cajas de su `tusuarios_caja` (o `cxccajeros.usuario`);
   *        admin/supervisor pueden usar cualquier caja activa.
   *  - R2: una caja = un turno ABIERTO a la vez.
   *  - R3: un usuario = un turno ABIERTO a la vez.
   *  - R6: caja inactiva (`sn_activo='N'`) no puede abrir turno.
   *
   * `empresaId` / `usuarioId` salen del JWT, nunca del body.
   */
  async abrirSesion(dto: AbrirCajaSesionDto, currentUser: any): Promise<TPosCajaSesion> {
    const usuario: string = currentUser?.usuario;
    const empresaId = Number(currentUser?.empresaId);
    const usuarioId = Number(currentUser?.usuarioId);

    if (!usuario || !empresaId || !usuarioId) {
      throw new BadRequestException('No se pudo identificar el usuario autenticado');
    }

    const roles: string[] = Array.isArray(currentUser?.roles) ? currentUser.roles : [];

    const caja = await this.resolverCajaAutorizada(empresaId, usuario, roles, dto.cajaId);

    // R2 — una caja, un turno abierto
    const sesionCaja = await this.sesionRepo.findOne({
      where: { empresaId, cajaId: caja.cajaId, estado: 'ABIERTA' },
    });
    if (sesionCaja) {
      throw new ConflictException(
        `La caja #${caja.cajaId} ya tiene un turno abierto (ID: ${sesionCaja.id}). Debe cerrarse antes de abrir otro.`,
      );
    }

    // R3 — un usuario, un turno abierto
    const sesionUsuario = await this.sesionRepo.findOne({
      where: { empresaId, usuarioId, estado: 'ABIERTA' },
    });
    if (sesionUsuario) {
      throw new ConflictException(
        `Ya tiene un turno abierto en la caja #${sesionUsuario.cajaId} (ID: ${sesionUsuario.id}). Ciérrelo antes de abrir otro turno.`,
      );
    }

    const fechaApertura = await this.fechaSistemaService.getFecha(empresaId);

    const nuevaSesion = this.sesionRepo.create({
      empresaId,
      cajaId: caja.cajaId,
      usuarioId,
      estado: 'ABIERTA',
      fecha_apertura: fechaApertura,
      monto_apertura: dto.monto_apertura,
      usuarioCreated: usuario,
    });

    const sesionGuardada = await this.sesionRepo.save(nuevaSesion);

    const movApertura = this.movimientoRepo.create({
      empresaId,
      sesionId: sesionGuardada.id,
      tipo: 'APERTURA',
      signo: 1,
      monto: dto.monto_apertura,
      metodo_pago: 'EFECTIVO',
      motivo: `Apertura de turno — ${caja.nombre}`,
      usuarioCreated: usuario,
    });

    await this.movimientoRepo.save(movApertura);

    return this.obtenerSesionConDetalle(sesionGuardada.id);
  }

  /** Sesión ABIERTA del usuario autenticado (fuente del cajaId transaccional). */
  async obtenerSesionActivaDeUsuario(empresaId: number, usuarioId: number): Promise<TPosCajaSesion | null> {
    return this.sesionRepo.findOne({
      where: { empresaId, usuarioId, estado: 'ABIERTA' },
      relations: ['movimientos', 'cortes'],
      order: { fecha_apertura: 'DESC' },
    });
  }

  async obtenerSesionActiva(empresaId: number, cajaId?: number, usuarioId?: number): Promise<TPosCajaSesion | null> {
    const where: any = { empresaId, estado: 'ABIERTA' };
    if (cajaId) where.cajaId = cajaId;
    if (usuarioId) where.usuarioId = usuarioId;

    return this.sesionRepo.findOne({
      where,
      relations: ['movimientos', 'cortes'],
      order: { fecha_apertura: 'DESC' },
    });
  }

  async listarSesiones(empresaId: number, cajaId?: number, estado?: string): Promise<TPosCajaSesion[]> {
    const where: any = { empresaId };
    if (cajaId) where.cajaId = cajaId;
    if (estado) where.estado = estado;

    return this.sesionRepo.find({
      where,
      relations: ['movimientos', 'cortes'],
      order: { fecha_apertura: 'DESC' },
    });
  }

  async obtenerSesionConDetalle(id: number): Promise<TPosCajaSesion> {
    const sesion = await this.sesionRepo.findOne({
      where: { id },
      relations: ['movimientos', 'cortes'],
    });

    if (!sesion) {
      throw new NotFoundException(`Sesión de caja con ID ${id} no encontrada`);
    }

    return sesion;
  }

  async registrarMovimiento(dto: CreateCajaMovimientoDto, usuario: string): Promise<TPosCajaMovimiento> {
    const sesion = await this.sesionRepo.findOne({ where: { id: dto.sesionId, empresaId: dto.empresaId } });
    if (!sesion) {
      throw new NotFoundException(`Sesión #${dto.sesionId} no encontrada`);
    }
    if (sesion.estado !== 'ABIERTA') {
      throw new BadRequestException(`No se pueden registrar movimientos en una sesión cerrada`);
    }

    const movimiento = this.movimientoRepo.create({
      empresaId: dto.empresaId,
      sesionId: dto.sesionId,
      tipo: dto.tipo,
      signo: dto.signo,
      monto: dto.monto,
      metodo_pago: dto.metodo_pago,
      referencia_tipo: dto.referencia_tipo,
      referencia_id: dto.referencia_id,
      motivo: dto.motivo,
      autorizado_por: dto.autorizado_por,
      usuarioCreated: usuario,
    });

    return this.movimientoRepo.save(movimiento);
  }

  async calcularTotales(sesionId: number) {
    const sesion = await this.obtenerSesionConDetalle(sesionId);
    const movimientos = sesion.movimientos || [];

    let totalEntradasEfectivo = 0;
    let totalSalidasEfectivo = 0;
    let totalOtrosMedios = 0;

    for (const mov of movimientos) {
      const monto = Number(mov.monto) || 0;
      const signo = Number(mov.signo) || 0;

      if (mov.metodo_pago === 'EFECTIVO') {
        if (signo === 1 && mov.tipo !== 'APERTURA') {
          totalEntradasEfectivo += monto;
        } else if (signo === -1) {
          totalSalidasEfectivo += monto;
        }
      } else {
        if (signo === 1) {
          totalOtrosMedios += monto;
        }
      }
    }

    const fondoInicial = Number(sesion.monto_apertura) || 0;
    const saldoEfectivoSistema = fondoInicial + totalEntradasEfectivo - totalSalidasEfectivo;

    return {
      fondo_inicial: fondoInicial,
      total_entradas_efectivo: totalEntradasEfectivo,
      total_salidas_efectivo: totalSalidasEfectivo,
      saldo_efectivo_sistema: saldoEfectivoSistema,
      total_otros_medios: totalOtrosMedios,
    };
  }

  async generarCorteX(sesionId: number, dto: GenerarCorteDto, usuario: string): Promise<TPosCajaCorte> {
    const sesion = await this.sesionRepo.findOne({ where: { id: sesionId, empresaId: dto.empresaId } });
    if (!sesion) {
      throw new NotFoundException(`Sesión #${sesionId} no encontrada`);
    }
    if (sesion.estado !== 'ABIERTA') {
      throw new BadRequestException(`La sesión está cerrada, no se puede generar Corte X`);
    }

    const totales = await this.calcularTotales(sesionId);

    const countCortesX = await this.corteRepo.count({
      where: { sesionId, tipo_corte: 'CORTE_X', empresaId: dto.empresaId },
    });
    const numero_correlativo = countCortesX + 1;

    const fechaCorte = await this.fechaSistemaService.getFecha(dto.empresaId);
    const efectivoContado = dto.efectivo_contado != null ? Number(dto.efectivo_contado) : null;
    const diferencia = efectivoContado != null ? efectivoContado - totales.saldo_efectivo_sistema : null;

    const corte = this.corteRepo.create({
      empresaId: dto.empresaId,
      sesionId,
      tipo_corte: 'CORTE_X',
      numero_correlativo,
      fecha_corte: fechaCorte,
      fondo_inicial: totales.fondo_inicial,
      total_entradas_efectivo: totales.total_entradas_efectivo,
      total_salidas_efectivo: totales.total_salidas_efectivo,
      saldo_efectivo_sistema: totales.saldo_efectivo_sistema,
      total_otros_medios: totales.total_otros_medios,
      efectivo_contado: efectivoContado !== null ? efectivoContado : undefined,
      diferencia: diferencia !== null ? diferencia : undefined,
      observaciones: dto.observaciones,
      usuarioCreated: usuario,
    });

    return this.corteRepo.save(corte);
  }

  async cerrarSesion(sesionId: number, dto: CerrarCajaSesionDto, usuario: string): Promise<TPosCajaSesion> {
    const sesion = await this.sesionRepo.findOne({ where: { id: sesionId, empresaId: dto.empresaId } });
    if (!sesion) {
      throw new NotFoundException(`Sesión #${sesionId} no encontrada`);
    }
    if (sesion.estado !== 'ABIERTA') {
      throw new BadRequestException(`La sesión #${sesionId} ya se encuentra cerrada`);
    }

    const totales = await this.calcularTotales(sesionId);
    const fechaCierre = await this.fechaSistemaService.getFecha(dto.empresaId);

    const montoDeclarado = Number(dto.monto_declarado_cierre);
    const diferencia = montoDeclarado - totales.saldo_efectivo_sistema;

    sesion.estado = 'CERRADA';
    sesion.fecha_cierre = fechaCierre;
    sesion.monto_sistema_cierre = totales.saldo_efectivo_sistema;
    sesion.monto_declarado_cierre = montoDeclarado;
    sesion.diferencia_cierre = diferencia;
    sesion.observacion_cierre = dto.observacion_cierre || null;
    sesion.usuarioUpdated = usuario;
    sesion.fechaUpdated = fechaCierre;

    await this.sesionRepo.save(sesion);

    const countCortesZ = await this.corteRepo.count({
      where: { sesionId, tipo_corte: 'CORTE_Z', empresaId: dto.empresaId },
    });
    const numero_correlativo = countCortesZ + 1;

    const corteZ = this.corteRepo.create({
      empresaId: dto.empresaId,
      sesionId,
      tipo_corte: 'CORTE_Z',
      numero_correlativo,
      fecha_corte: fechaCierre,
      fondo_inicial: totales.fondo_inicial,
      total_entradas_efectivo: totales.total_entradas_efectivo,
      total_salidas_efectivo: totales.total_salidas_efectivo,
      saldo_efectivo_sistema: totales.saldo_efectivo_sistema,
      total_otros_medios: totales.total_otros_medios,
      efectivo_contado: montoDeclarado,
      diferencia,
      observaciones: dto.observacion_cierre || 'Cierre de turno / Corte Z',
      usuarioCreated: usuario,
    });

    await this.corteRepo.save(corteZ);

    return this.obtenerSesionConDetalle(sesionId);
  }
}
