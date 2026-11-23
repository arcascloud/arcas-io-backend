import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral, DataSource, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TCaiAutorizado } from './entities/cai-autorizado.entity';
import { TPosFacMae } from './entities/posfacmae.entity';
import { TPosFacDet } from './entities/posfacdet.entity';
import { TPosFacMaeAnul } from './entities/posfacmaeanul.entity';
import { TPosFacDetAnul } from './entities/posfacdetanul.entity';
import { TPosCotMae } from './entities/poscotmae.entity';
import { TPosCotDet } from './entities/poscotdet.entity';
import { TPosPedMae } from './entities/pospedmae.entity';
import { TPosPedDet } from './entities/pospeddet.entity';
import { TPosCboMae } from './entities/poscbomae.entity';
import { TPosCboDet } from './entities/poscbodet.entity';
import { TPosPrecioVtas } from './entities/tpospreciovtas.entity';
import { TPosDescuentos } from './entities/tposdescuentos.entity';
import { TPosFacCaja } from './entities/posfaccaja.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { CxcCliente } from '../cxc/entities/cxccliente.entity';
import {
  CreatePosFacMaeDto, UpdatePosFacMaeDto,
  CreatePosCotMaeDto, UpdatePosCotMaeDto,
  CreatePosPedMaeDto, UpdatePosPedMaeDto,
  CheckoutTiendaDto,
  CheckoutPedidoDto,
  CrearRondaDto,
} from './dto/facturacion.dto';
import { CxcService } from '../cxc/cxc.service';
import { KardexService } from '../inventario/kardex.service';
import { ContabilidadLogicaService } from '../contabilidad/contabilidad-logica.service';
import { Tempresas } from '../companies/entities/empresa.entity';
import { TempresasDet } from '../companies/entities/empresasdet.entity';
import { TImpresora } from '../companies/entities/impresoras.entity';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TproductoImg } from '../inventario/entities/producto-img.entity';
import { TtipoImpuesto } from '../parametros/entities/impuesto.entity';
import { TtipoGestor } from '../parametros/entities/gestor.entity';
import { TinvExistencia } from '../inventario/entities/existencia.entity';
import { Tusuarios } from '../users/entities/usuario.entity';
import { TusuarioInfo } from '../users/entities/usuario-info.entity';
import { TusuarioCaja } from '../parametros/entities/usuario-caja.entity';
import { Tsucursal } from '../sucursales/entities/sucursal.entity';
import { TCai } from '../companies/entities/tcai.entity';
import { FechaSistemaService, TABLAS_FECHAREGISTRO } from '../../shared/fecha-sistema.service';
import { CorrelativosService } from '../../shared/correlativos.service';
import { CajaSesionService } from './caja-sesion.service';
import { TPosCajaSesion } from './entities/poscajasesion.entity';
import { getTransporter, getMailFrom } from '../../config/mail';

/** ttipoformapago.formapagoId del catálogo base (Efectivo / Tarjeta / Transferencia) */
const FORMAPAGO_EFECTIVO = 1;
const FORMAPAGO_TARJETA = 2;
const FORMAPAGO_TRANSFERENCIA = 3;
/** ttipoformapago.formapagoId de 'TodoPagoLink' (pago por link — se confirma vía /todopago/confirmar) */
const FORMAPAGO_TODOPAGO = 6;

/**
 * Restaurante: rangos de puestos (espejo del front: NUM_MESAS=20 en
 * restaurante.models.ts, NUM_KIOSKOS=20 en mesero.models.ts). Los kioskos se
 * guardan en nromesa como 100 + n → 101..120, sin chocar con las mesas 1..20.
 */
const RESTAURANTE_NUM_MESAS = 20;
const RESTAURANTE_NUM_KIOSKOS = 20;

@Injectable()
export class FacturacionService {
  constructor(
    @InjectRepository(TCaiAutorizado) private readonly correlativosRepo: Repository<TCaiAutorizado>,
    @InjectRepository(TPosFacMae) private readonly facMaeRepo: Repository<TPosFacMae>,
    @InjectRepository(TPosFacDet) private readonly facDetRepo: Repository<TPosFacDet>,
    @InjectRepository(TPosFacMaeAnul) private readonly facMaeAnulRepo: Repository<TPosFacMaeAnul>,
    @InjectRepository(TPosFacDetAnul) private readonly facDetAnulRepo: Repository<TPosFacDetAnul>,
    @InjectRepository(TPosCotMae) private readonly cotMaeRepo: Repository<TPosCotMae>,
    @InjectRepository(TPosCotDet) private readonly cotDetRepo: Repository<TPosCotDet>,
    @InjectRepository(TPosPedMae) private readonly pedMaeRepo: Repository<TPosPedMae>,
    @InjectRepository(TPosPedDet) private readonly pedDetRepo: Repository<TPosPedDet>,
    @InjectRepository(TPosCboMae) private readonly cboMaeRepo: Repository<TPosCboMae>,
    @InjectRepository(TPosCboDet) private readonly cboDetRepo: Repository<TPosCboDet>,
    @InjectRepository(TPosPrecioVtas) private readonly precioVtasRepo: Repository<TPosPrecioVtas>,
    @InjectRepository(TPosDescuentos) private readonly descuentosRepo: Repository<TPosDescuentos>,
    @InjectRepository(TPosFacCaja) private readonly facCajaRepo: Repository<TPosFacCaja>,
    @InjectRepository(TCoTipoDocumentoFiscal) private readonly tipoDocFiscalRepo: Repository<TCoTipoDocumentoFiscal>,
    @InjectRepository(CxcCliente) private readonly clienteRepo: Repository<CxcCliente>,
    @InjectRepository(Tempresas) private readonly empresaRepo: Repository<Tempresas>,
    @InjectRepository(TempresasDet) private readonly empresaDetRepo: Repository<TempresasDet>,
    @InjectRepository(TImpresora) private readonly impRepo: Repository<TImpresora>,
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TproductoImg) private readonly productoImgRepo: Repository<TproductoImg>,
    @InjectRepository(TtipoImpuesto) private readonly impuestoRepo: Repository<TtipoImpuesto>,
    @InjectRepository(Tusuarios) private readonly usuariosRepo: Repository<Tusuarios>,
    @InjectRepository(TusuarioInfo) private readonly usuarioInfoRepo: Repository<TusuarioInfo>,
    @InjectRepository(TusuarioCaja) private readonly usuarioCajaRepo: Repository<TusuarioCaja>,
    @InjectRepository(Tsucursal) private readonly sucursalRepo: Repository<Tsucursal>,
    @InjectRepository(TCai) private readonly caiRepo: Repository<TCai>,
    @InjectRepository(TinvExistencia) private readonly existenciaRepo: Repository<TinvExistencia>,
    @InjectRepository(TtipoGestor) private readonly gestorRepo: Repository<TtipoGestor>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => CxcService)) private readonly cxcService: CxcService,
    @Inject(forwardRef(() => KardexService)) private readonly kardexService: KardexService,
    @Inject(forwardRef(() => ContabilidadLogicaService)) private readonly contabilidadService: ContabilidadLogicaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly fechaSistema: FechaSistemaService,
    private readonly correlativos: CorrelativosService,
    private readonly cajaSesionService: CajaSesionService,
  ) {}

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
    });
  }

  private async findAllByEmpresaOrdered<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number, orderField: string) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
      order: { [orderField]: 'DESC' } as any,
    });
  }

  private async findOneById<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const where = { [idField]: id, empresaId } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} ${id} no encontrado`);
    return found;
  }

  private async createEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    dto: any,
    currentUser: string,
  ): Promise<T> {
    const datos: any = { ...dto, usuarioCreated: currentUser };
    // Reglas 1 y 4: en las tablas afectadas (posfacmae, posfacdet,
    // posfacdetanul, posfaccaja, posfacmov, posfacmaeanul, poscotmae,
    // poscotdet, pospedmae, pospeddet), `fecharegistro` lo impone el backend
    // (snapshot tfecma.fechasistema con rango vigente, o tempresas.fechasistema
    // sin él). tcai_autorizado, poscbomae/det, tpospreciovtas, tposdescuentos
    // no están en la lista → el if no entra.
    if (TABLAS_FECHAREGISTRO.has(repo.metadata.tableName)) {
      datos.fecharegistro = await this.fechaSistema.obtenerFechaRegistro(
        currentUser,
        dto.empresaId,
      );
    }
    const entity = repo.create(datos);
    const saved = await repo.save(entity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  private async updateEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    const { fecharegistro, ...cambios } = dto ?? {}; // nunca se re-estampa en un PUT
    const now = await this.fechaSistema.getFecha(empresaId);
    Object.assign(entity, cambios, {
      usuarioUpdated: currentUser,
      fechaUpdated: now,
    });
    return repo.save(entity);
  }

  private async softDelete<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    const now2 = await this.fechaSistema.getFecha(empresaId);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: now2,
    });
    return repo.save(entity);
  }

  async findAllCorrelativos(empresaId: number) {
    return this.findAllByEmpresa(this.correlativosRepo, empresaId);
  }

  async findCorrelativo(caiAutorizadoId: number, empresaId: number) {
    return this.findOneById(this.correlativosRepo, 'caiAutorizadoId', caiAutorizadoId, empresaId, 'Correlativo');
  }

  async createCorrelativo(dto: any, currentUser: string) {
    // tcai_autorizado.caiId es NOT NULL: asignar el CAI activo de la empresa si no viene
    if (dto && !dto.caiId && dto.empresaId) {
      const caiActivo = await this.caiRepo.findOne({
        where: { empresaId: dto.empresaId, sn_activo: 'S' } as unknown as FindOptionsWhere<TCai>,
        order: { caiId: 'DESC' } as any,
      });
      if (!caiActivo) throw new BadRequestException('La empresa no tiene un CAI activo (tcai)');
      dto.caiId = caiActivo.caiId;
    }
    return this.createEntity(this.correlativosRepo, dto, currentUser);
  }

  async updateCorrelativo(caiAutorizadoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.correlativosRepo, 'caiAutorizadoId', caiAutorizadoId, empresaId, dto, currentUser, 'Correlativo');
  }

  async findAllFacturas(empresaId: number, usuario?: string) {
    const qb = this.facMaeRepo.createQueryBuilder('f')
      .where('f.empresaId = :empresaId', { empresaId });
    if (usuario) {
      qb.andWhere('f.usuarioCreated = :usuario', { usuario });
    }
    return qb.orderBy('f.fecharegistro', 'DESC').getMany();
  }

  async findFactura(facturaId: number, empresaId: number) {
    const factura = await this.findOneById(this.facMaeRepo, 'facturaId', facturaId, empresaId, 'Factura');

    if (!factura.nombrecliente && (factura as any).clienteId) {
      const cliente = await this.clienteRepo.findOne({
        where: { clienteId: (factura as any).clienteId, empresaId } as unknown as FindOptionsWhere<CxcCliente>,
      });
      if (cliente) {
        (factura as any).nombrecliente = `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim();
      }
    }

    return factura;
  }

  async findFacturaTicket(facturaId: number, empresaId: number) {
    const factura = await this.findFactura(facturaId, empresaId);
    const detallesRaw = await this.findFacturaDetByFacturaId(facturaId, empresaId);
    const pagos = await this.findFacCajaByFactura(facturaId, empresaId);

    const productoIds = [...new Set(detallesRaw.map((d) => d.productoId).filter(Boolean))];
    const productos = productoIds.length
      ? await this.productoRepo.find({ where: productoIds.map((id) => ({ produtoId: id, empresaId } as any)) })
      : [];
    const productosMap = new Map(productos.map((p) => [p.produtoId, p]));

    const detalles = detallesRaw.map((d) => ({
      ...d,
      descripcion: productosMap.get(d.productoId)?.descripcion || d.codbarra || `#${d.productoId}`,
    }));

    // ----- Desglose fiscal por tasa (tproducto.impuestoId -> ttipoimpuestos.porcentaje) -----
    // Regla (2026-10): gravado15/gravado18 = SUMA DEL ISV cobrado por tasa (cuadra con
    // Subtotal + gravado = Total); excento = base (subTotal - impuesto) de líneas con tasa 0;
    // exonerado = IVA calculado NO cobrado cuando sn_excenta='S'.
    const catImpuestos = await this.impuestoRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<TtipoImpuesto>,
    });
    const tasaPorImpuesto = new Map<number, number>(
      catImpuestos.map((i) => [i.impuestoId, Number(i.porcentaje) || 0]),
    );
    const r2 = (x: number) => Math.round(x * 100) / 100;
    const excenta = factura.sn_excenta === 'S';
    let exonerado = 0;
    let excento = 0;
    let gravado15 = 0;
    let gravado18 = 0;
    for (const d of detallesRaw) {
      const imp = Number(d.impuesto) || 0;
      const base = (Number(d.subTotal) || 0) - imp;
      const impId = productosMap.get(d.productoId)?.impuestoId;
      let tasa = impId != null && tasaPorImpuesto.has(Number(impId)) ? tasaPorImpuesto.get(Number(impId))! : -1;
      if (tasa < 0) tasa = imp > 0 ? 15 : 0; // sin catálogo: clasificar por el ISV de la línea
      if (tasa === 0) {
        excento += base;
      } else if (excenta) {
        exonerado += (base * tasa) / 100;
      } else if (Math.round(tasa) >= 18) {
        gravado18 += imp;
      } else {
        gravado15 += imp;
      }
    }

    const empresa = await this.empresaRepo.findOne({ where: { empresaId } });
    const empresaDet = await this.empresaDetRepo.find({ where: { empresaId, sn_activo: 'S' } });

    const rtn = empresaDet.find((d) => d.tipo === 'RTN')?.descripcion || null;
    const telefono = empresaDet.find((d) => d.tipo === 'TELEFONO')?.descripcion || null;
    const direccion = empresaDet.find((d) => d.tipo === 'DIRECCION')?.descripcion || null;
    const correo = empresaDet.find((d) => d.tipo === 'CORREO')?.descripcion || null;

    // Buscar correlativo CAI (tcai_autorizado): PRIMERO por el ID congelado en la
    // factura (trazabilidad exacta del rango usado al emitir); fallback al vigente de la sucursal
    let corr: TCaiAutorizado | null = null;
    if (factura.caiAutorizadoId) {
      corr = await this.correlativosRepo.findOne({
        where: { caiAutorizadoId: factura.caiAutorizadoId } as unknown as FindOptionsWhere<TCaiAutorizado>,
      });
    }
    if (!corr) {
      corr = await this.correlativosRepo.findOne({
        where: { empresaId, Idsucursal: factura.Idsucursal || 0 } as unknown as FindOptionsWhere<TCaiAutorizado>,
        order: { caiAutorizadoId: 'DESC' },
      });
    }

    // CAI desde tcai (control independiente; fallback tempresasdet legacy tipo='CAI')
    let caiCodigo: string | null = null;
    if (corr?.caiId) {
      const caiRow = await this.caiRepo.findOne({ where: { caiId: corr.caiId } as unknown as FindOptionsWhere<TCai> });
      caiCodigo = caiRow?.cai || null;
    }
    if (!caiCodigo) {
      const caiActivo = await this.caiRepo.findOne({
        where: { empresaId, sn_activo: 'S' } as unknown as FindOptionsWhere<TCai>,
        order: { caiId: 'DESC' } as any,
      });
      caiCodigo = caiActivo?.cai || null;
    }
    if (!caiCodigo) {
      caiCodigo = empresaDet.find((d) => d.tipo === 'CAI')?.descripcion || null;
    }

    // ----- Cajero (tusuarios) + terminal/TPV (tusuarios_caja) del usuario que emitió -----
    // `tpv` = tusuarios_caja.id (terminal del usuario), NO cxccajeros.cajaId.
    const usuarioTicket = factura.usuarioCreated || null;
    const cajeroRow = usuarioTicket
      ? await this.usuariosRepo.findOne({ where: { usuario: usuarioTicket } as unknown as FindOptionsWhere<Tusuarios> })
      : null;
    // La terminal se resuelve por (usuario, cajaId) de la factura. Si el usuario
    // no tiene fila para esa caja se cae a la primera asignación histórica
    // (compatibilidad con facturas emitidas antes de este cambio).
    let cajaRow: TusuarioCaja | null = null;
    if (usuarioTicket) {
      const base = { usuario: usuarioTicket, empresaId } as unknown as FindOptionsWhere<TusuarioCaja>;
      if (factura.cajaId) {
        cajaRow = await this.usuarioCajaRepo.findOne({
          where: { ...(base as any), cajaId: Number(factura.cajaId) },
        });
      }
      if (!cajaRow) {
        cajaRow = await this.usuarioCajaRepo.findOne({
          where: base,
          order: { id: 'ASC' } as any,
        });
      }
    }

    // ----- Sucursal de la factura (tsucursal: descripción, dirección, teléfonos) -----
    const sucursalRow = factura.Idsucursal
      ? await this.sucursalRepo.findOne({
          where: { idsucursal: factura.Idsucursal, empresaId } as unknown as FindOptionsWhere<Tsucursal>,
        })
      : null;

    return {
      factura,
      detalles,
      pagos,
      cajero: cajeroRow
        ? {
            usuario: cajeroRow.usuario,
            nombre: cajeroRow.nombre || '',
            apellidos: cajeroRow.apellidos || '',
          }
        : null,
      tpv: cajaRow?.id ?? null,
      impuestos: {
        exonerado: r2(exonerado),
        excento: r2(excento),
        gravado15: r2(gravado15),
        gravado18: r2(gravado18),
      },
      empresa: {
        nombre: empresa?.descripcion || 'EMPRESA',
        rtn,
        telefono,
        direccion,
        correo,
        mensajeFactura: empresa?.msjfactura || '',
        mensajeDevolucion: empresa?.msjdevfactura || '',
      },
      sucursal: sucursalRow
        ? {
            descripcion: sucursalRow.descripcion || '',
            direccion: sucursalRow.direccion || '',
            telefono1: sucursalRow.telefono1 || '',
            telefono2: sucursalRow.telefono2 || '',
          }
        : null,
      correlativo: corr ? {
        cai: caiCodigo || '',
        rangoDesde: corr.rangoDesde || '',
        rangoHasta: corr.rangoHasta || '',
        fechaLimite: corr.fechaLimite || null,
      } : (caiCodigo ? {
        cai: caiCodigo,
        rangoDesde: '',
        rangoHasta: '',
        fechaLimite: null,
      } : null),
    };
  }

  /**
   * Método de pago para poscajamovimiento — se deriva de `formapagoId`
   * (catálogo ttipoformapago), NO de importe_efectivo/importe_otros ni de
   * flags del frontend: esos campos pueden venir desincronizados del pago real.
   */
  private resolverMetodoCaja(
    formapagoId: number | string | null | undefined,
    tarjetacreditoId?: number | string | null,
  ): { metodo: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO'; tipo: string } {
    const id = Number(formapagoId) || 0;
    if (id === FORMAPAGO_EFECTIVO) return { metodo: 'EFECTIVO', tipo: 'VENTA_EFECTIVO' };
    if (id === FORMAPAGO_TARJETA) return { metodo: 'TARJETA', tipo: 'COBRO_TARJETA' };
    if (id === FORMAPAGO_TRANSFERENCIA) return { metodo: 'TRANSFERENCIA', tipo: 'COBRO_TRANSFERENCIA' };
    if (id === FORMAPAGO_TODOPAGO) return { metodo: 'OTRO', tipo: 'COBRO_TRANSFERENCIA' };
    // Compatibilidad con pedidos legacy que no envían formapagoId
    if (tarjetacreditoId != null && Number(tarjetacreditoId) > 0) {
      return { metodo: 'TARJETA', tipo: 'COBRO_TARJETA' };
    }
    return { metodo: 'OTRO', tipo: 'COBRO_TRANSFERENCIA' };
  }

  /**
   * Parámetro por defecto de facturación (bodega/caja) desde ttipoparametros.
   * Busca primero en módulo 3 (facturación); si no existe, en cualquier módulo
   * de la empresa (bodegaId vive en módulo 1, cajaId en módulo 4). Fallback numérico.
   */
  private async getParamDefecto(empresaId: number, field: string, def: number): Promise<number> {
    try {
      const base = { empresaId, field, sn_activo: 'S' } as any;
      let row = await this.tipoParametroRepo.findOne({ where: { ...base, moduloId: 3 } });
      if (!row) row = await this.tipoParametroRepo.findOne({ where: base });
      return row ? Number(row.valor) || def : def;
    } catch {
      return def;
    }
  }

  /**
   * Bodega por defecto del usuario (regla de negocio):
   * tusuario (usuario + empresaId) → Idsucursal → tsucursal (Idsucursal + empresaId) → bodegaId
   */
  private async getBodegaPorUsuario(usuario: string, empresaId: number): Promise<number | null> {
    try {
      const user = await this.usuariosRepo.findOne({ where: { usuario, empresaId } as any });
      if (!user?.Idsucursal) return null;
      const suc = await this.sucursalRepo.findOne({
        where: { idsucursal: user.Idsucursal, empresaId } as any,
      });
      return suc?.bodegaId ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Caja transaccional (R4): la del turno ABIERTO del usuario autenticado.
   * El parámetro `cajaId` de ttipoparametros queda solo como respaldo cuando
   * el usuario no tiene sesión abierta (ej. facturas de crédito / tienda virtual).
   */
  private async resolverCajaIdDesdeSesion(empresaId: number, usuario: string): Promise<number | null> {
    try {
      if (!empresaId || !usuario) return null;
      const u = await this.usuariosRepo.findOne({ where: { usuario, empresaId } as any });
      if (!u?.usuarioId) return null;
      const sesion = await this.cajaSesionService.obtenerSesionActivaDeUsuario(empresaId, Number(u.usuarioId));
      return sesion ? Number(sesion.cajaId) : null;
    } catch (error) {
      console.error('Error resolviendo caja desde la sesión activa:', error);
      return null;
    }
  }

  /**
   * Turno ABIERTO del usuario autenticado (R3). Obligatorio para la emisión
   * sin cobro del POS de asesor: sin sesión no se asigna correlativo ni se factura.
   */
  private async exigirSesionCajaAbierta(empresaId: number, usuario: string): Promise<TPosCajaSesion> {
    let usuarioId: number | null = null;
    try {
      const u = await this.usuariosRepo.findOne({ where: { usuario, empresaId } as any });
      usuarioId = u?.usuarioId ? Number(u.usuarioId) : null;
    } catch (error) {
      console.error('Error resolviendo usuario para exigir sesión de caja:', error);
    }

    const sesion = usuarioId
      ? await this.cajaSesionService.obtenerSesionActivaDeUsuario(empresaId, usuarioId)
      : null;
    if (!sesion) {
      throw new BadRequestException(
        'No hay una sesión de caja abierta para su usuario. Abra la caja en Facturación → Caja antes de emitir facturas.',
      );
    }
    return sesion;
  }

  async createFactura(dto: CreatePosFacMaeDto, currentUser: string) {
    // Emisión de asesor (sin cobro): solo asigna correlativo y persiste posfacmae.
    // El flag NO se persiste (no existe columna); se usa para exigir el turno
    // del usuario, forzar sn_pagada='N' y evitar movimientos CxC.
    const soloEmision = (dto as any).sn_solo_emision === 'S';
    delete (dto as any).sn_solo_emision;

    // Validar que el período esté abierto
    const fechaDoc = await this.fechaSistema.getFecha(dto.empresaId);
    await this.contabilidadService.validarPeriodoAbierto(dto.empresaId, fechaDoc);

    // Bodega por defecto: la sucursal del usuario (tsucursal.bodegaId); si no, parámetro con fallback
    if (!dto.bodegaId) {
      dto.bodegaId =
        (await this.getBodegaPorUsuario(currentUser, dto.empresaId)) ??
        (await this.getParamDefecto(dto.empresaId, 'bodegaId', 1));
    }
    // Caja: la del turno ABIERTO del usuario (R4). El parámetro solo es respaldo
    // si no hay sesión abierta (crédito, tienda virtual, operaciones sin caja).
    const cajaIdSesion = await this.resolverCajaIdDesdeSesion(dto.empresaId, currentUser);
    if (cajaIdSesion) dto.cajaId = cajaIdSesion;
    else if (!dto.cajaId) dto.cajaId = await this.getParamDefecto(dto.empresaId, 'cajaId', 1);

    if (soloEmision) {
      const sesion = await this.exigirSesionCajaAbierta(dto.empresaId, currentUser);
      dto.cajaId = Number(sesion.cajaId);
      dto.sn_pagada = 'N';
      dto.sn_anulada = 'N';
      dto.sn_contabilizada = 'N';
      dto.efectivo_recibido = 0;
      dto.importe_cambio = 0;
      if (!dto.Idsucursal) {
        const u = await this.usuariosRepo.findOne({
          where: { usuario: currentUser, empresaId: dto.empresaId } as any,
        });
        dto.Idsucursal = Number(u?.Idsucursal) || 1;
      }
    } else if (dto.tipofactura !== 'C') {
      const sesionActiva = await this.cajaSesionService.obtenerSesionActiva(dto.empresaId, dto.cajaId);
      if (!sesionActiva) {
        throw new BadRequestException(`La caja #${dto.cajaId} no tiene ninguna sesión (turno) abierta. Debe abrir turno antes de facturar.`);
      }
    }

    let caiInfo: { rangoDesde?: string; rangoHasta?: string; disponible?: number; alerta?: string } | undefined;
    if (!dto.nrofactura) {
      const result = await this.asignarCorrelativo(dto.empresaId, dto.Idsucursal!, currentUser);
      dto.nrofactura = result.nrofactura;
      // Trazabilidad: registrar el correlativo CAI del que proviene el número
      if (result.caiAutorizadoId != null) {
        dto.caiAutorizadoId = result.caiAutorizadoId;
      }
      caiInfo = { rangoDesde: result.rangoDesde, rangoHasta: result.rangoHasta, disponible: result.disponible, alerta: result.alerta };
    }
    const factura = await this.createEntity(this.facMaeRepo, dto, currentUser);

    if (!soloEmision && dto.tipofactura === 'C') {
      try {
        await this.cxcService.generarMovimientoDesdeFactura(factura, currentUser);
      } catch (error) {
        console.error('Error generando movimiento CXC:', error);
      }
    }

    // Integración contable automática (se ejecuta después del kardex)
    // Se llama desde procesarKardexFactura porque necesita que el inventario esté procesado.
    // En emisión de asesor se omite para NO contabilizar la factura.
    if (!soloEmision) {
      this.eventEmitter.emit('factura.creada', { factura, currentUser });
    }

    return { ...factura, ...caiInfo };
  }

  async procesarKardexFactura(
    facturaId: number,
    currentUser: string,
    omitirContabilidad = false,
  ): Promise<{ procesados: number; errores: string[] }> {
    const detalles = await this.facDetRepo.find({
      where: { facturaId } as FindOptionsWhere<TPosFacDet>,
    });

    // nroreferencia con patrón legible para el usuario final: FACT-<nrofactura>
    const fact = await this.facMaeRepo.findOne({ where: { facturaId } as FindOptionsWhere<TPosFacMae> });
    const nroReferencia = fact ? `FACT-${fact.nrofactura}` : `FACT-${facturaId}`;

    console.log(`[procesarKardex] facturaId=${facturaId}, nrofactura=${fact?.nrofactura}, detalles encontrados: ${detalles.length}`);

    let procesados = 0;
    const errores: string[] = [];
    for (const det of detalles) {
      try {
        console.log(`[procesarKardex] producto=${det.productoId}, cantidad=${det.cantidad}, bodega=${det.bodegaId}, empresa=${det.empresaId}`);
        await this.kardexService.registrarSalida({
          bodegaId: Number(det.bodegaId) || 1,
          productoId: Number(det.productoId),
          cantidad: Number(det.cantidad) || 1,
          costoUnitario: Number(det.precioventa) || 0,
          nroreferencia: nroReferencia,
          moduloId: 3,
          tipomov: 'S',
          subtipoMov: 'V',
          empresaId: Number(det.empresaId) || 1,
          usuarioCreated: currentUser,
          factordecambio: 1,
          codbarra: det.codbarra || '',
        });
        procesados++;
        console.log(`[procesarKardex] OK producto=${det.productoId}`);
      } catch (error: any) {
        const msg = `Error kardex producto ${det.productoId}: ${error.message || error}`;
        console.error(`[procesarKardex] ${msg}`);
        errores.push(msg);
      }
    }

    // Integración contable automática post-kardex
    // Se ejecuta después de procesar kardex porque necesita que el inventario esté actualizado.
    // `omitirContabilidad` = true para emisión de asesor: rebaja existencia/kardex pero NO contabiliza.
    if (errores.length === 0 && !omitirContabilidad) {
      try {
        const factura = await this.facMaeRepo.findOne({
          where: { facturaId } as FindOptionsWhere<TPosFacMae>,
        });
        if (factura) {
          await this.contabilidadService.contabilizarFactura(
            factura,
            Number(factura.empresaId),
            Number(factura.Idsucursal) || 0,
            currentUser,
          );

          // Después de contabilizar, vincular movimientos CxC con la partida de la factura
          if (factura.tipofactura === 'C') {
            try {
              const refreshFactura = await this.facMaeRepo.findOne({
                where: { facturaId } as FindOptionsWhere<TPosFacMae>,
              });
              if (refreshFactura?.partidaId) {
                await this.cxcService.actualizarPartidaMovimientos(
                  refreshFactura.nrofactura.toString(),
                  refreshFactura.partidaId,
                  Number(refreshFactura.empresaId),
                  currentUser,
                );
                console.log(`[procesarKardex] Movimientos CxC vinculados a partida ${refreshFactura.partidaId}`);
              }
            } catch (e) {
              console.error(`[procesarKardex] Error vinculando CxC con partida: ${e.message}`);
            }
          }
        }
      } catch (error: any) {
        const msg = `Error integración contable: ${error.message || error}`;
        console.error(`[procesarKardex] ${msg}`);
        // No agregamos a errores para no bloquear — la contabilización es complementaria
      }
    }

    if (errores.length > 0) {
      throw new BadRequestException(errores.join(' | '));
    }

    console.log(`[procesarKardex] finalizado: procesados=${procesados}, errores=${errores.length}`);
    return { procesados, errores };
  }

  /**
   * Extrae el número secuencial del rango formateado.
   * Ej: '000-001-01-00120001' → 120001
   */
  private extractRangoNumero(rango: string): number {
    const partes = rango.split('-');
    const ultimo = partes[partes.length - 1];
    return parseInt(ultimo, 10) || 0;
  }

  /**
   * Asigna el número de factura siguiente y retorna info del CAI.
   * - Modo automático ('A'): usa correlativo de tcai_autorizado (valida rango, alerta ≤30)
   * - Modo manual ('M'): incrementa ttipoparametros (field='nroticket') en la columna `valor`.
   *   Usa el contador de TICKET y no el de factura para no contradecer los correlativos
   *   fiscales secuestrados de la SAR.
   * - Sin CAI (rango agotado o modo automático sin autorización) → contador de
   *   ttipoparametros (field='nrofactura'). TODOS los correlativos del ERP se
   *   administran desde ttipoparametros; tcotipodocumentofiscal.nrocorrelativo se eliminó.
   */
  private async asignarCorrelativo(empresaId: number, idsucursal: number, currentUser: string): Promise<{
    nrofactura: number;
    caiAutorizadoId?: number;
    rangoDesde?: string;
    rangoHasta?: string;
    disponible?: number;
    alerta?: string;
  }> {
    // 1. Leer modo_correlativo desde ttipoparametros (field='modo_correlativo', empresa)
    const paramModo = await this.tipoParametroRepo.findOne({
      where: { empresaId, field: 'modo_correlativo', sn_activo: 'S' } as unknown as FindOptionsWhere<TipoParametro>,
    });

    const modo = paramModo?.valor || 'A'; // Default: automático

    // 2. Modo manual ('M') → contador incremental atómico en ttipoparametros (field='nroticket')
    //    (CorrelativosService: UPDATE + LAST_INSERT_ID en la misma conexión.
    //     Se usa el contador de TICKET y no el de factura para no contradecir
    //     los correlativos fiscales secuestrados de la SAR.)
    if (modo === 'M') {
      const siguiente = await this.correlativos.siguiente('nroticket', empresaId, currentUser);

      console.log(`[asignarCorrelativo] Modo manual: ttipoparametros.nroticket → ${siguiente} (empresaId=${empresaId})`);

      // Sin caiAutorizadoId: el número NO proviene de tcai_autorizado
      return { nrofactura: siguiente };
    }

    // 3. Buscar correlativo (CAI) en tcai_autorizado para esta empresa/sucursal
    const corr = await this.correlativosRepo.findOne({
      where: { empresaId, Idsucursal: idsucursal } as unknown as FindOptionsWhere<TCaiAutorizado>,
      order: { caiAutorizadoId: 'DESC' },
    });

    // 4. SI hay correlativo (CAI) → usar nrofactura del CAI
    if (corr) {
      const nroActual = Number(corr.nrofactura) || 0;
      const hasta = this.extractRangoNumero(corr.rangoHasta);

      // Siguiente número
      const siguiente = nroActual + 1;

      // Validar: si el siguiente número supera el rango → BLOQUEAR
      if (siguiente > hasta) {
        throw new BadRequestException(
          `Rango de facturación agotado. Último número: ${nroActual}. Rango autorizado: ${corr.rangoDesde} al ${corr.rangoHasta}. Renueve el CAI ante la SAT.`
        );
      }

      // Calcular disponibles
      const disponible = hasta - siguiente + 1;

      // Alerta si quedan ≤30 facturas
      let alerta: string | undefined;
      if (disponible <= 30) {
        alerta = `La autorización de facturación está próxima a caducar. Quedan solo ${disponible} factura(s) disponibles. Renueve el CAI ante la SAT.`;
        console.warn(`[asignarCorrelativo] ${alerta}`);
      }

      // Incrementar y guardar
      corr.nrofactura = siguiente;
      corr.usuarioUpdated = currentUser;
      corr.fechaUpdated = await this.fechaSistema.getFecha(empresaId);
      await this.correlativosRepo.save(corr);

      console.log(`[asignarCorrelativo] CAI: empresaId=${empresaId}, sucursal=${idsucursal}, nrofactura=${siguiente}, disponible=${disponible}`);

      return {
        nrofactura: siguiente,
        caiAutorizadoId: corr.caiAutorizadoId,
        rangoDesde: corr.rangoDesde,
        rangoHasta: corr.rangoHasta,
        disponible,
        alerta,
      };
    }

    // 5. NO hay correlativo (CAI) → contador de ttipoparametros (field='nrofactura')
    //    Todos los correlativos del ERP se administran desde ttipoparametros;
    //    el fallback a tcotipodocumentofiscal.nrocorrelativo fue eliminado.
    const siguiente = await this.correlativos.siguiente('nrofactura', empresaId, currentUser);
    console.log(`[asignarCorrelativo] Sin CAI → ttipoparametros.nrofactura: empresaId=${empresaId}, nrofactura=${siguiente}`);
    return { nrofactura: siguiente };
  }

  async updateFactura(facturaId: number, empresaId: number, dto: UpdatePosFacMaeDto, currentUser: string) {
    return this.updateEntity(this.facMaeRepo, 'facturaId', facturaId, empresaId, dto, currentUser, 'Factura');
  }

  async findAllFacturaDet(empresaId: number) {
    return this.findAllByEmpresa(this.facDetRepo, empresaId);
  }

  async findFacturaDet(posfacdetId: number, empresaId: number) {
    return this.findOneById(this.facDetRepo, 'posfacdetId', posfacdetId, empresaId, 'Detalle Factura');
  }

  async findFacturaDetByFacturaId(facturaId: number, empresaId: number) {
    return this.facDetRepo.find({
      where: { facturaId, empresaId } as unknown as FindOptionsWhere<TPosFacDet>,
      order: { nrofila: 'ASC' } as any,
    });
  }

  async createFacturaDet(dto: any, currentUser: string) {
    return this.createEntity(this.facDetRepo, dto, currentUser);
  }

  async updateFacturaDet(posfacdetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.facDetRepo, 'posfacdetId', posfacdetId, empresaId, dto, currentUser, 'Detalle Factura');
  }

  async findAllFacturaAnul(empresaId: number) {
    return this.findAllByEmpresaOrdered(this.facMaeAnulRepo, empresaId, 'fecharegistro');
  }

  async findFacturaAnul(posfacmaeanulId: number, empresaId: number) {
    return this.findOneById(this.facMaeAnulRepo, 'posfacmaeanulId', posfacmaeanulId, empresaId, 'Anulacion Factura');
  }

  async createFacturaAnul(dto: any, currentUser: string) {
    const facturaOriginal = await this.facMaeRepo.findOne({
      where: { facturaId: dto.facturaId, empresaId: dto.empresaId } as FindOptionsWhere<TPosFacMae>,
    });

    if (!facturaOriginal) {
      throw new NotFoundException(`Factura ${dto.facturaId} no encontrada`);
    }

    const yaAnulada = await this.facMaeAnulRepo.findOne({
      where: { facturaId: dto.facturaId, empresaId: dto.empresaId } as any,
    });

    if (facturaOriginal.sn_anulada === 'S' || yaAnulada) {
      if (facturaOriginal.sn_anulada !== 'S' && yaAnulada) {
        facturaOriginal.sn_anulada = 'S';
        await this.facMaeRepo.save(facturaOriginal);
      }
      throw new BadRequestException('La factura ya se encuentra anulada');
    }

    if (facturaOriginal.tipofactura === 'C') {
      const pagos = await this.facCajaRepo.find({
        where: { facturaId: dto.facturaId, empresaId: dto.empresaId, sn_anulado: 'N' } as any,
      });
      if (pagos.length > 0) {
        throw new BadRequestException('La factura es al credito y tiene abonos registrados. No se puede anular.');
      }
    }

    const anulacion = await this.createEntity(this.facMaeAnulRepo, dto, currentUser);

    if (facturaOriginal) {
      const detallesOrig = await this.facDetRepo.find({
        where: { facturaId: facturaOriginal.facturaId, empresaId: facturaOriginal.empresaId } as FindOptionsWhere<TPosFacDet>,
      });

      for (const det of detallesOrig) {
        await this.createEntity(this.facDetAnulRepo, {
          posfacmaeanulId: anulacion.posfacmaeanulId,
          bodegaId: det.bodegaId,
          productoId: det.productoId,
          codbarra: det.codbarra,
          cantidad: det.cantidad,
          precio: det.precioventa,
          subTotal: det.subTotal,
          estado: 'S',
          empresaId: facturaOriginal.empresaId,
        }, currentUser);
      }

      facturaOriginal.sn_anulada = 'S';
      // Correlativo atómico nroanulacion (ttipoparametros)
      facturaOriginal.nroanulacion = await this.correlativos.siguiente('nroanulacion', facturaOriginal.empresaId, currentUser);
      facturaOriginal.usuarioUpdated = currentUser;
      facturaOriginal.fechaUpdated = await this.fechaSistema.getFecha(facturaOriginal.empresaId);
      await this.facMaeRepo.save(facturaOriginal);

      try {
        await this.registrarKardexReversa(facturaOriginal, currentUser);
      } catch (error) {
        console.error('Error registrando Kardex reversa:', error);
      }

      try {
        await this.cxcService.anularMovimientoFactura(facturaOriginal.facturaId, facturaOriginal.nrofactura, facturaOriginal.empresaId, currentUser);
      } catch (error) {
        console.error('Error anulando movimiento CXC:', error);
      }

      try {
        await this.cxcService.anularCajaPorFactura(facturaOriginal.facturaId, facturaOriginal.nrofactura, facturaOriginal.empresaId, currentUser);
      } catch (error) {
        console.error('Error anulando Caja por Factura:', error);
      }

      // Descontabilizar si estaba contabilizada
      try {
        await this.contabilidadService.descontabilizarFactura(
          facturaOriginal,
          Number(facturaOriginal.empresaId),
          currentUser,
        );
      } catch (error) {
        console.error('Error descontabilizando factura:', error);
      }
    }

    this.eventEmitter.emit('factura.anulada', { factura: facturaOriginal, anulacion, currentUser });

    return anulacion;
  }

  private async registrarKardexReversa(factura: TPosFacMae, currentUser: string): Promise<void> {
    const detalles = await this.facDetRepo.find({
      where: { facturaId: factura.facturaId, empresaId: factura.empresaId } as FindOptionsWhere<TPosFacDet>,
    });

    for (const det of detalles) {
      await this.kardexService.registrarEntrada({
        bodegaId: factura.bodegaId,
        productoId: det.productoId,
        cantidad: det.cantidad,
        costoUnitario: det.precioventa || 0,
        nroreferencia: `ANUL-${factura.nrofactura}`,
        moduloId: 3,
        tipomov: 'E',
        subtipoMov: 'AN',
        empresaId: factura.empresaId,
        usuarioCreated: currentUser,
        factordecambio: factura.factordecambio || 1,
        codbarra: det.codbarra,
      });
    }
  }

  async updateFacturaAnul(posfacmaeanulId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.facMaeAnulRepo, 'posfacmaeanulId', posfacmaeanulId, empresaId, dto, currentUser, 'Anulacion Factura');
  }

  async findAllFacturaDetAnul(empresaId: number) {
    return this.findAllByEmpresa(this.facDetAnulRepo, empresaId);
  }

  async findFacturaDetAnul(posfacdetanulacionId: number, empresaId: number) {
    return this.findOneById(this.facDetAnulRepo, 'posfacdetanulacionId', posfacdetanulacionId, empresaId, 'Detalle Anulacion');
  }

  async createFacturaDetAnul(dto: any, currentUser: string) {
    return this.createEntity(this.facDetAnulRepo, dto, currentUser);
  }

  async updateFacturaDetAnul(posfacdetanulacionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.facDetAnulRepo, 'posfacdetanulacionId', posfacdetanulacionId, empresaId, dto, currentUser, 'Detalle Anulacion');
  }

  async findAllCotizaciones(empresaId: number) {
    return this.findAllByEmpresaOrdered(this.cotMaeRepo, empresaId, 'fecharegistro');
  }

  async findCotizacion(poscotmaeId: number, empresaId: number) {
    return this.findOneById(this.cotMaeRepo, 'poscotmaeId', poscotmaeId, empresaId, 'Cotizacion');
  }

  async createCotizacion(dto: CreatePosCotMaeDto, currentUser: string) {
    // Canal público (carrito de visitante en tienda online): sin sesión no hay
    // empresaId → se resuelve la empresa default del catálogo.
    if (!dto.empresaId) dto.empresaId = await this.fechaSistema.empresaDefault();
    return this.createEntity(this.cotMaeRepo, dto, currentUser);
  }

  async updateCotizacion(poscotmaeId: number, empresaId: number, dto: UpdatePosCotMaeDto, currentUser: string) {
    return this.updateEntity(this.cotMaeRepo, 'poscotmaeId', poscotmaeId, empresaId, dto, currentUser, 'Cotizacion');
  }

  async deleteCotizacion(poscotmaeId: number, empresaId: number) {
    const entity = await this.findOneById(this.cotMaeRepo, 'poscotmaeId', poscotmaeId, empresaId, 'Cotizacion');
    await this.cotDetRepo.delete({ poscotmaeId, empresaId } as any);
    await this.cotMaeRepo.remove(entity);
    return { deleted: true };
  }

  async findCotizacionDetByMaeId(poscotmaeId: number, empresaId?: number) {
    // Canal público (tienda online): visitante sin sesión → empresa default
    if (!empresaId) empresaId = await this.fechaSistema.empresaDefault();
    return this.cotDetRepo.find({
      where: { poscotmaeId, empresaId } as unknown as FindOptionsWhere<TPosCotDet>,
      order: { poscotdetId: 'ASC' } as any,
    });
  }

  async deleteCotizacionDet(poscotdetId: number, empresaId?: number) {
    // Canal público (tienda online): visitante sin sesión → empresa default
    if (!empresaId) empresaId = await this.fechaSistema.empresaDefault();
    const entity = await this.findOneById(this.cotDetRepo, 'poscotdetId', poscotdetId, empresaId, 'Detalle Cotizacion');
    await this.cotDetRepo.remove(entity);
    return { deleted: true };
  }

  async checkoutTienda(dto: CheckoutTiendaDto, currentUser: string) {
    const carrito = await this.cotMaeRepo.findOne({
      where: { poscotmaeId: dto.poscotmaeId } as unknown as FindOptionsWhere<TPosCotMae>,
    });
    if (!carrito) throw new NotFoundException('Carrito no encontrado');
    if (carrito.sn_estadocarrito === 'F') throw new NotFoundException('El carrito ya fue facturado');

    const empresaId = carrito.empresaId;

    const detalles = await this.cotDetRepo.find({
      where: { poscotmaeId: dto.poscotmaeId } as unknown as FindOptionsWhere<TPosCotDet>,
    });
    if (detalles.length === 0) throw new NotFoundException('El carrito estÃ¡ vacÃ­o');

    const getParam = async (field: string, def: any) => {
      try {
        const row = await this.tipoParametroRepo.findOne({
          where: { empresaId, moduloId: 3, field, sn_activo: 'S' } as any,
        });
        return row ? (row.tipo === 'NUMBER' ? Number(row.valor) : row.valor) : def;
      } catch { return def; }
    };
    // Bodega: sucursal del usuario (tsucursal.bodegaId) → fallback parámetro
    const bodegaId = (await this.getBodegaPorUsuario(currentUser, empresaId)) ?? (await getParam('bodegaId', 1));
    const cajaId = await getParam('cajaId', 1);

    // Sucursal de la factura: la del usuario autenticado
    // (posfacmae.Idsucursal es NOT NULL sin default — mismo criterio que checkoutPedido)
    let idsucursal = 0;
    try {
      const u = await this.usuariosRepo.findOne({ where: { usuario: currentUser, empresaId } as any });
      idsucursal = Number(u?.Idsucursal) || 1;
    } catch {
      idsucursal = 1;
    }

    let subTotal = 0;
    let impuestoTotal = 0;
    for (const det of detalles) {
      subTotal += Number(det.precio) * Number(det.cantidad);
      impuestoTotal += Number(det.subTotal) - (Number(det.precio) * Number(det.cantidad));
    }
    const total = subTotal + impuestoTotal;

    let clienteTienda = await this.clienteRepo.findOne({
      where: { nrocliente: 'TIENDA', empresaId } as unknown as FindOptionsWhere<CxcCliente>,
    });
    if (!clienteTienda) {
      clienteTienda = await this.clienteRepo.save(this.clienteRepo.create({
        nrocliente: 'TIENDA',
        nombres: 'CLIENTE',
        apellidos: 'TIENDA',
        razonsocial: 'CLIENTE TIENDA',
        dni: '0000000000000',
        sexo: 'M',
        estadocivil: 'S',
        limiteCredito: 0,
        diasplazo: 0,
        // diasgracia en BD es NOT NULL sin default (synchronize: false) - setear explícito
        diasgracia: 0,
        interes: 0,
        moratorio: 0,
        sn_activo: 'S',
        categoria: 'A',
        // NOT NULL sin default en BD (synchronize: false) - setear explícito:
        moduloId: 4,
        Idsucursal: 1,
        empresaId,
        usuarioCreated: currentUser,
        // Reglas 1 y 4: cxcclientes está en la lista → fecha del backend
        fecharegistro: await this.fechaSistema.obtenerFechaRegistro(currentUser, empresaId),
      })) as CxcCliente;
    }

    const nrofactura = await this.asignarCorrelativo(empresaId, 1, currentUser);

    const facturaPayload: any = {
      nrofactura: nrofactura.nrofactura,
      caiAutorizadoId: nrofactura.caiAutorizadoId ?? null,
      tipofactura: 'E',
      clienteId: clienteTienda.clienteId,
      nrocliente: clienteTienda.nrocliente,
      nombrecliente: dto.nombrecliente,
      direccion: dto.direccion || '',
      factordecambio: 1,
      subTotal,
      impuesto: impuestoTotal,
      descuento: 0,
      total,
      efectivo_recibido: dto.efectivo_recibido || total,
      importe_cambio: (dto.efectivo_recibido || total) - total,
      diascredito: 0,
      bodegaId,
      cajaId,
      gestorId: carrito.gestorId,
      sn_excenta: 'N',
      sn_pagada: 'S',
      sn_anulada: 'N',
      sn_contabilizada: 'N',
      empresaId,
      Idsucursal: idsucursal,
    };

    const factura = await this.createEntity(this.facMaeRepo, facturaPayload, currentUser);

    let nrofila = 1;
    for (const det of detalles) {
      const precio = Number(det.precio);
      const cantidad = Number(det.cantidad);
      const lineaSubTotal = precio * cantidad;

      await this.createEntity(this.facDetRepo, {
        facturaId: factura.facturaId,
        bodegaId,
        nrofila,
        productoId: Number(det.productoId),
        codbarra: det.codbarra,
        cantidad,
        precioventa: precio,
        impuesto: 0,
        subTotal: lineaSubTotal,
        descuento: 0,
        sn_anulada: 'N',
        empresaId,
      }, currentUser);
      nrofila++;
    }

    const esEfectivoTienda = Number(dto.formapagoId) === FORMAPAGO_EFECTIVO;
    const recibidoTienda = Number(dto.efectivo_recibido) || total;
    await this.createEntity(this.facCajaRepo, {
      facturaId: factura.facturaId,
      formapagoId: dto.formapagoId,
      tarjetacreditoId: dto.tarjetacreditoId || null,
      nrotarjeta: dto.nrotarjeta || null,
      nroautorizacion: dto.nroautorizacion || null,
      factordecambio: 1,
      importe_efectivo: esEfectivoTienda ? recibidoTienda : 0,
      importe_otros: esEfectivoTienda ? 0 : total,
      importe_cambio: esEfectivoTienda ? Math.max(0, recibidoTienda - total) : 0,
      cajaId,
      Idsucursal: idsucursal,
      empresaId,
    }, currentUser);

    await this.procesarKardexFactura(factura.facturaId, currentUser);

    carrito.sn_estadocarrito = 'F';
    carrito.Nombrecliente = dto.nombrecliente;
    carrito.direccion = dto.direccion || '';
    carrito.usuarioUpdated = currentUser;
    carrito.fechaUpdated = await this.fechaSistema.getFecha(carrito.empresaId);
    await this.cotMaeRepo.save(carrito);

    this.eventEmitter.emit('factura.creada', { factura, currentUser });

    // nrofactura.numérico: los 3 consumidores (ERP, tienda, CRM) lo interpolan
    // como "Factura #n" — antes devolvía el objeto de asignarCorrelativo.
    return { facturaId: factura.facturaId, nrofactura: nrofactura.nrofactura, total };
  }

  async findAllCotizacionDet(empresaId: number) {
    return this.findAllByEmpresa(this.cotDetRepo, empresaId);
  }

  async findCotizacionDet(poscotdetId: number, empresaId: number) {
    return this.findOneById(this.cotDetRepo, 'poscotdetId', poscotdetId, empresaId, 'Detalle Cotizacion');
  }

  async createCotizacionDet(dto: any, currentUser: string) {
    // Canal público (carrito de visitante en tienda online): sin sesión no hay
    // empresaId → se resuelve la empresa default del catálogo.
    if (!dto.empresaId) dto.empresaId = await this.fechaSistema.empresaDefault();
    return this.createEntity(this.cotDetRepo, dto, currentUser);
  }

  async updateCotizacionDet(poscotdetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cotDetRepo, 'poscotdetId', poscotdetId, empresaId, dto, currentUser, 'Detalle Cotizacion');
  }

  /**
   * Lista de pedidos con filtros opcionales para la bandeja de caja
   * (GET /facturacion/pedidos?cajaId=&estado=): la caja central (1) ve todos
   * filtrando por su cajaId; Caja 2/3 solo los suyos. El filtro de estado es
   * aditivo (p.ej. estado=LISTO para ver lo pendiente de servir).
   */
  async findAllPedidos(
    empresaId: number,
    currentUser?: string,
    cajaId?: number,
    estado?: string,
  ) {
    const filtros: Record<string, any> = {};
    if (cajaId) filtros.cajaId = cajaId;
    if (estado) filtros.estado = estado;
    if (currentUser && currentUser !== 'SYSTEM' && currentUser !== 'admin') {
      const userInfo = await this.usuarioInfoRepo.findOne({ where: { usuario: currentUser } });
      if (userInfo && userInfo.sn_cliente === 'S') {
        return this.pedMaeRepo.find({
          where: { empresaId, usuarioCreated: currentUser, ...filtros } as any,
          order: { fecharegistro: 'DESC' },
        });
      }
    }
    if (Object.keys(filtros).length) {
      return this.pedMaeRepo.find({
        where: { empresaId, ...filtros } as any,
        order: { fecharegistro: 'DESC' },
      });
    }
    return this.findAllByEmpresaOrdered(this.pedMaeRepo, empresaId, 'fecharegistro');
  }

  /**
   * Leyenda oficial de entrega por línea — MISMO CASE que la consulta de estado
   * del mesero (fuente de verdad frontend + backend):
   *   sn_entregado = 'S'      → 'Entregado'
   *   estado_cocina = 'LISTO' → 'Entregar a mesa'
   *   ELSE                    → 'En preparación'
   * (La variante 'Entregar a kiosko' es solo de UI, según el puesto que atiende el mesero.)
   */
  private leyendaEntrega(det: { sn_entregado?: string | null; estado_cocina?: string | null }): string {
    if (det.sn_entregado === 'S') return 'Entregado';
    if (det.estado_cocina === 'LISTO') return 'Entregar a mesa';
    return 'En preparación';
  }

  /**
   * Líneas de cocina pendientes de HOY para el tablero (GET /pedidos-det/abiertos):
   * estados PENDIENTE / EN_PREPARACION / LISTO, con la descripción del producto
   * resuelta en lote (las tarjetas de cocina no deben cargar el catálogo entero).
   * El front las agrupa por pospedmaeId + ronda_uuid contra su lista de pedidos.
   *
   * Excluye lo que el mesero ya entregó (sn_entregado = 'S'): eso ya no es de
   * cocina. Si el mesero revierte la entrega, la línea vuelve al tablero en el
   * próximo refresco (la cocina pollea cada REFRESCO_MS).
   */
  async findPedidoDetAbiertos(empresaId: number) {
    const dets = await this.pedDetRepo.find({
      where: {
        empresaId,
        estado_cocina: In(['PENDIENTE', 'EN_PREPARACION', 'LISTO']),
        sn_entregado: 'N',
      } as unknown as FindOptionsWhere<TPosPedDet>,
      order: { enviado_at: 'ASC' } as any,
    });
    const prodIds = [...new Set(dets.map((d) => d.productoId).filter((p): p is number => !!p))];
    const prods = prodIds.length
      ? await this.productoRepo.find({
          where: { produtoId: In(prodIds), empresaId } as unknown as FindOptionsWhere<Tproducto>,
        })
      : [];
    const mapa = new Map<number, string>(prods.map((p) => [p.produtoId, p.descripcion]));
    return dets.map((d) => ({
      ...d,
      descripcion: d.productoId ? mapa.get(d.productoId) ?? null : null,
      leyenda: this.leyendaEntrega(d),
    }));
  }

  async findPedido(pospedmaeId: number, empresaId: number, currentUser?: string) {
    const pedido = await this.findOneById(this.pedMaeRepo, 'pospedmaeId', pospedmaeId, empresaId, 'Pedido');
    if (currentUser && currentUser !== 'SYSTEM' && currentUser !== 'admin') {
      const userInfo = await this.usuarioInfoRepo.findOne({ where: { usuario: currentUser } });
      if (userInfo && userInfo.sn_cliente === 'S' && pedido.usuarioCreated !== currentUser) {
        throw new ForbiddenException('No tiene permiso para consultar pedidos de otros clientes');
      }
    }
    return pedido;
  }

  /**
   * Cliente TIENDA genérico (cxcclientes), creado bajo demanda.
   * Lo usan el checkout de tienda y createPedido cuando el pedido no trae
   * clienteId (CRM / pedidos-virtual no envían cliente).
   */
  private async obtenerClienteTienda(empresaId: number, currentUser: string): Promise<CxcCliente> {
    let clienteTienda = await this.clienteRepo.findOne({
      where: { nrocliente: 'TIENDA', empresaId } as unknown as FindOptionsWhere<CxcCliente>,
    });
    if (!clienteTienda) {
      clienteTienda = await this.clienteRepo.save(this.clienteRepo.create({
        nrocliente: 'TIENDA',
        nombres: 'CLIENTE',
        apellidos: 'TIENDA',
        razonsocial: 'CLIENTE TIENDA',
        dni: '0000000000000',
        sexo: 'M',
        estadocivil: 'S',
        limiteCredito: 0,
        diasplazo: 0,
        // diasgracia en BD es NOT NULL sin default (synchronize: false) - setear explícito
        diasgracia: 0,
        interes: 0,
        moratorio: 0,
        sn_activo: 'S',
        categoria: 'A',
        // NOT NULL sin default en BD (synchronize: false) - setear explícito:
        moduloId: 4,
        Idsucursal: 1,
        empresaId,
        usuarioCreated: currentUser,
        // Reglas 1 y 4: cxcclientes está en la lista → fecha del backend
        fecharegistro: await this.fechaSistema.obtenerFechaRegistro(currentUser, empresaId),
      })) as CxcCliente;
    }
    return clienteTienda;
  }

  /**
   * Recalcula los totales del maestro desde el detalle: la cabecera SIEMPRE
   * es Σ de sus líneas (cabecera = detalle).
   *   subTotal = Σ bruto (det.subtotal) · descuento = Σ monto · impuesto = Σ ISV
   *   total = subTotal + impuesto − descuento  (misma fórmula que checkoutPedido)
   * Se usa QueryBuilder().update().set(): los decimals llegan como string y
   * repository.save() no detecta el cambio (lección TypeORM/MySQL).
   */
  private async recalcularTotalesPedido(pospedmaeId: number, empresaId: number, currentUser: string): Promise<void> {
    const dets = await this.pedDetRepo.find({
      where: { pospedmaeId } as unknown as FindOptionsWhere<TPosPedDet>,
    });
    let subTotal = 0;
    let impuesto = 0;
    let descuento = 0;
    for (const det of dets) {
      subTotal += Number(det.subtotal) || 0;
      impuesto += Number(det.impuesto) || 0;
      descuento += Number(det.descuento) || 0;
    }
    const red2 = (n: number) => Math.round(n * 100) / 100;
    subTotal = red2(subTotal);
    impuesto = red2(impuesto);
    descuento = red2(descuento);
    const total = red2(subTotal + impuesto - descuento);

    const fechaUpdated = await this.fechaSistema.getFecha(empresaId);
    await this.pedMaeRepo.createQueryBuilder()
      .update()
      .set({ subTotal, impuesto, descuento, total, usuarioUpdated: currentUser, fechaUpdated })
      .where('pospedmaeId = :pospedmaeId AND empresaId = :empresaId', { pospedmaeId, empresaId })
      .execute();
  }

  /** Pedido bloqueado para edición si ya fue facturado. */
  private async exigirPedidoModificable(pospedmaeId: number, empresaId: number): Promise<TPosPedMae> {
    const pedido = await this.findOneById(this.pedMaeRepo, 'pospedmaeId', pospedmaeId, empresaId, 'Pedido');
    if (pedido.sn_facturado === 'S') {
      throw new BadRequestException('El pedido ya fue facturado y no se puede modificar');
    }
    return pedido;
  }

  /**
   * Control de entrega por ítem (regla aprobada): la cabecera pospedmae.sn_entregado
   * queda en 'S' automáticamente cuando TODOS sus ítems están en 'S' y vuelve a 'N'
   * si queda alguno pendiente (o la orden está vacía). El UPDATE solo escribe cuando
   * el estado cambia (WHERE ... AND sn_entregado <> estado).
   */
  private async sincronizarEntregadoPedido(pospedmaeId: number, empresaId: number, currentUser?: string): Promise<void> {
    const dets = await this.pedDetRepo.find({
      where: { pospedmaeId } as unknown as FindOptionsWhere<TPosPedDet>,
    });
    const estado = dets.length > 0 && dets.every((d) => d.sn_entregado === 'S') ? 'S' : 'N';
    const fechaUpdated = await this.fechaSistema.getFecha(empresaId);
    const cambios: Record<string, any> = { sn_entregado: estado, fechaUpdated };
    if (currentUser) cambios.usuarioUpdated = currentUser;
    await this.pedMaeRepo
      .createQueryBuilder()
      .update()
      .set(cambios)
      .where('pospedmaeId = :pospedmaeId AND empresaId = :empresaId AND sn_entregado <> :estado', {
        pospedmaeId,
        empresaId,
        estado,
      })
      .execute();
  }

  /**
   * Estado de cabecera derivado de sus líneas (ciclo de vida de restaurante):
   * 1. Alguna línea LISTO sin servir → LISTO (hay que servir; prioridad, el
   *    mesero necesita ver que la ronda anterior está lista aunque haya otra
   *    ronda nueva en curso);
   * 2. si no, alguna EN_PREPARACION → EN_PREPARACION; si no, alguna PENDIENTE → ENVIADO;
   * 3. si todas están servidas (sn_entregado 'S') → ENTREGADO; sin líneas → ABIERTO.
   */
  private calcularEstadoPedido(dets: TPosPedDet[]): string {
    if (!dets.length) return 'ABIERTO';
    if (dets.some((d) => d.estado_cocina === 'LISTO' && d.sn_entregado !== 'S')) return 'LISTO';
    if (dets.some((d) => d.estado_cocina === 'EN_PREPARACION')) return 'EN_PREPARACION';
    if (dets.some((d) => d.estado_cocina === 'PENDIENTE')) return 'ENVIADO';
    if (dets.every((d) => d.sn_entregado === 'S')) return 'ENTREGADO';
    return 'ABIERTO';
  }

  /**
   * Recalcula pospedmae.estado desde las líneas. QueryBuilder (solo columnas no
   * decimales) y solo escribe cuando el estado cambia.
   */
  private async recalcularEstadoPedido(pospedmaeId: number, empresaId: number, currentUser?: string): Promise<void> {
    const dets = await this.pedDetRepo.find({
      where: { pospedmaeId } as unknown as FindOptionsWhere<TPosPedDet>,
    });
    const estado = this.calcularEstadoPedido(dets);
    const fechaUpdated = await this.fechaSistema.getFecha(empresaId);
    const cambios: Record<string, any> = { estado, fechaUpdated };
    if (currentUser) cambios.usuarioUpdated = currentUser;
    await this.pedMaeRepo
      .createQueryBuilder()
      .update()
      .set(cambios)
      .where('pospedmaeId = :pospedmaeId AND empresaId = :empresaId', { pospedmaeId, empresaId })
      .andWhere('(estado IS NULL OR estado <> :estado)', { estado })
      .execute();
  }

  /**
   * Configuración de ISV de restaurante, mismo criterio que el front
   * (`restaurante.service.cargarISV`): ttipoparametros módulo 3 → field
   * 'impuestoId' + 'sn_impuestoincluido', con catálogo ttipoimpuestos
   * (fallback: el activo de módulo 3). Devuelve tasa en decimal.
   */
  private async obtenerConfigISV(empresaId: number): Promise<{ tasa: number; incluido: boolean }> {
    try {
      const base = { empresaId, sn_activo: 'S' } as unknown as FindOptionsWhere<TipoParametro>;
      const paramImp = await this.tipoParametroRepo.findOne({ where: { ...base, moduloId: 3, field: 'impuestoId' } as any });
      const paramInc = await this.tipoParametroRepo.findOne({ where: { ...base, moduloId: 3, field: 'sn_impuestoincluido' } as any });
      const impuestos = await this.impuestoRepo.find({
        where: { empresaId } as unknown as FindOptionsWhere<TtipoImpuesto>,
      });
      const impuestoId = Number(paramImp?.valor) || null;
      const activo =
        impuestos.find((i) => impuestoId != null && i.impuestoId === impuestoId && i.sn_activo === 'S') ??
        impuestos.find((i) => Number(i.moduloId) === 3 && i.sn_activo === 'S');
      const pct = Number(activo?.porcentaje) || 0;
      return { tasa: pct > 0 ? pct / 100 : 0, incluido: paramInc?.valor === 'S' };
    } catch {
      return { tasa: 0, incluido: false };
    }
  }

  /**
   * Restaurante: una mesa no puede tener dos órdenes abiertas el mismo día.
   * Solo aplica a pedidos con mesa real (nromesa >= 1); ignora los pedidos
   * huérfanos con mesa 0 heredados de versiones anteriores.
   */
  private async validarMesaLibre(dto: CreatePosPedMaeDto): Promise<void> {
    const nromesa = Number(dto.nromesa) || 0;
    if (nromesa < 1) return;

    const empresaId = dto.empresaId;
    const inicioDia = (await this.fechaSistema.getFecha(empresaId)) as Date;
    inicioDia.setHours(0, 0, 0, 0);

    const ocupada = await this.pedMaeRepo
      .createQueryBuilder('p')
      .where('p.empresaId = :empresaId', { empresaId })
      .andWhere('p.nromesa = :nromesa', { nromesa })
      .andWhere("p.sn_facturado = 'N'")
      .andWhere('p.fecharegistro >= :inicioDia', { inicioDia })
      .getOne();

    if (ocupada) {
      throw new BadRequestException(`La mesa ${nromesa} ya tiene una orden abierta (#${ocupada.pospedmaeId})`);
    }
  }

  async createPedido(dto: CreatePosPedMaeDto, currentUser: string) {
    await this.validarMesaLibre(dto);
    try {
      const empresaId = dto.empresaId;

      // Si el cliente está logueado, debe tener nombre y teléfono sí o sí en tusuariosinfo
      if (currentUser && currentUser !== 'SYSTEM' && currentUser !== 'admin') {
        const userInfo = await this.usuarioInfoRepo.findOne({ where: { usuario: currentUser } });
        const userEntity = await this.usuariosRepo.findOne({ where: { usuario: currentUser, empresaId } as any });

        if (!userInfo || !userInfo.telefono || !userInfo.telefono.trim()) {
          throw new BadRequestException('Su usuario logueado no tiene teléfono registrado en el sistema (tusuariosinfo). Es obligatorio para realizar pedidos.');
        }
        dto.nrotelefono = userInfo.telefono;
        dto.nombrecliente = userEntity?.nombre || userInfo.usuario;
      } else {
        if (!dto.nombrecliente || !dto.nombrecliente.trim() || !dto.nrotelefono || !dto.nrotelefono.trim()) {
          throw new BadRequestException('Nombre del cliente y teléfono son obligatorios.');
        }
      }

      // Cliente: si no viene (CRM / pedidos-virtual), se resuelve el cliente TIENDA.
      // Si viene, se valida que exista y se completa nrocliente.
      if (!dto.clienteId) {
        const tienda = await this.obtenerClienteTienda(empresaId, currentUser);
        dto.clienteId = tienda.clienteId;
        dto.nrocliente = dto.nrocliente || tienda.nrocliente;
      } else {
        const cliente = await this.clienteRepo.findOne({
          where: { clienteId: dto.clienteId, empresaId } as unknown as FindOptionsWhere<CxcCliente>,
        });
        if (!cliente) throw new BadRequestException(`El cliente ${dto.clienteId} no existe en la empresa ${empresaId}`);
        dto.nrocliente = dto.nrocliente || cliente.nrocliente;
      }

      // bodegaId/cajaId/nrotelefono/Idsucursal/empresaId son NOT NULL sin default
      if (!dto.bodegaId) {
        dto.bodegaId =
          (await this.getBodegaPorUsuario(currentUser, empresaId)) ??
          (await this.getParamDefecto(empresaId, 'bodegaId', 1));
      }
      if (!dto.cajaId) dto.cajaId = await this.getParamDefecto(empresaId, 'cajaId', 1);
      if (!dto.Idsucursal) {
        try {
          const u = await this.usuariosRepo.findOne({ where: { usuario: currentUser, empresaId } as any });
          dto.Idsucursal = Number(u?.Idsucursal) || 1;
        } catch {
          dto.Idsucursal = 1;
        }
      }

      // Defaults de negocio: el pedido nace SIN facturar. La BD trae
      // sn_facturado DEFAULT 'S' (peligroso) → se fuerza 'N' siempre.
      dto.sn_facturado = 'N';
      dto.sn_pagada = dto.sn_pagada ?? 'N';
      dto.sn_enviogratis = dto.sn_enviogratis ?? 'N';
      dto.tipofactura = dto.tipofactura ?? 'E';

      const pedido = await this.createEntity(this.pedMaeRepo, dto, currentUser);
      // Cabecera coherente con el detalle desde el primer momento
      await this.recalcularTotalesPedido(pedido.pospedmaeId, empresaId, currentUser);
      return pedido;
    } catch (e) {
      console.error('[createPedido ERROR]', e);
      throw e;
    }
  }

  async updatePedido(pospedmaeId: number, empresaId: number, dto: UpdatePosPedMaeDto, currentUser: string) {
    await this.exigirPedidoModificable(pospedmaeId, empresaId);
    // El flag sn_facturado lo pone ÚNICAMENTE checkoutPedido; un PUT no puede
    // marcarlo como facturado (evita pedidos "fantasma" facturados sin factura).
    if (dto.sn_facturado === 'S') {
      throw new BadRequestException('El pedido se marca como facturado únicamente al facturarlo');
    }
    delete dto.sn_facturado;
    const pedido = await this.updateEntity(this.pedMaeRepo, 'pospedmaeId', pospedmaeId, empresaId, dto, currentUser, 'Pedido');
    // Los totales siempre se derivan del detalle, nunca del payload del cliente
    await this.recalcularTotalesPedido(pospedmaeId, empresaId, currentUser);
    return pedido;
  }

  async findAllPedidoDet(empresaId: number) {
    return this.findAllByEmpresa(this.pedDetRepo, empresaId);
  }

  async findPedidoDet(pospeddetId: number, empresaId: number) {
    return this.findOneById(this.pedDetRepo, 'pospeddetId', pospeddetId, empresaId, 'Detalle Pedido');
  }

  async createPedidoDet(dto: any, currentUser: string) {
    if (!dto?.pospedmaeId) throw new BadRequestException('pospedmaeId es requerido');
    const mae = await this.pedMaeRepo.findOne({
      where: { pospedmaeId: dto.pospedmaeId } as unknown as FindOptionsWhere<TPosPedMae>,
    });
    if (!mae) throw new BadRequestException(`Pedido ${dto.pospedmaeId} no encontrado`);
    if (mae.sn_facturado === 'S') throw new BadRequestException('El pedido ya fue facturado y no se puede modificar');

    // pospeddet.empresaId es NOT NULL y bodegaId viene de la cabecera si no llega
    if (!dto.empresaId) dto.empresaId = mae.empresaId;
    if (dto.empresaId !== mae.empresaId) {
      throw new BadRequestException('El detalle no pertenece a la misma empresa que el pedido');
    }
    if (!dto.bodegaId) dto.bodegaId = mae.bodegaId;

    // Control de entrega por ítem: estado inicial según productos.sn_enviar_a_cocina.
    // 'S' (enviar a cocina) → nace en 'N' (cocina debe despachar);
    // 'N' → nace en 'S' (entrega inmediata: entradas, bebidas, etc.).
    // Sin catálogo o sin productoId → 'N' (conservador: queda pendiente).
    if (dto.sn_entregado !== 'S' && dto.sn_entregado !== 'N') {
      let estado = 'N';
      if (dto.productoId) {
        try {
          const prod = await this.productoRepo.findOne({
            where: { produtoId: dto.productoId, empresaId: dto.empresaId } as unknown as FindOptionsWhere<Tproducto>,
          });
          if (prod) estado = prod.sn_enviar_a_cocina === 'S' ? 'N' : 'S';
        } catch {
          /* sin catálogo → pendiente en cocina */
        }
      }
      dto.sn_entregado = estado;
    }
    // Invariante aprobada: PENDIENTE/EN_PREPARACION ⇒ sn_entregado = 'N'. La
    // línea nace con un estado de cocina coherente con su entrega (sin depender
    // del DEFAULT de la columna, que en BD es PENDIENTE): si nace entregada
    // (producto que no pasa por cocina) su estado es ENTREGADO, nunca PENDIENTE.
    if (!dto.estado_cocina) {
      dto.estado_cocina = dto.sn_entregado === 'S' ? 'ENTREGADO' : 'PENDIENTE';
    }

    const det = await this.createEntity(this.pedDetRepo, dto, currentUser);
    await this.recalcularTotalesPedido(mae.pospedmaeId, mae.empresaId, currentUser);
    await this.sincronizarEntregadoPedido(mae.pospedmaeId, mae.empresaId, currentUser);
    await this.recalcularEstadoPedido(mae.pospedmaeId, mae.empresaId, currentUser);
    return det;
  }

  async updatePedidoDet(pospeddetId: number, empresaId: number, dto: any, currentUser: string) {
    const det = await this.findOneById(this.pedDetRepo, 'pospeddetId', pospeddetId, empresaId, 'Detalle Pedido');
    const mae = await this.exigirPedidoModificable(det.pospedmaeId, empresaId);
    if (dto?.empresaId != null && dto.empresaId !== mae.empresaId) {
      throw new BadRequestException('El detalle no pertenece a la misma empresa que el pedido');
    }
    // Transiciones de cocina validadas en servidor (la usa la tablet de cocina):
    // PENDIENTE → EN_PREPARACION → LISTO → ENTREGADO; repetir el mismo estado es
    // idempotente (dos tablets con la misma pantalla). listo_at se estampa al
    // entrar en LISTO (lo informa el índice idx_pospeddet_cocina).
    if (dto?.estado_cocina != null) {
      const actual = det.estado_cocina ?? 'ENTREGADO';
      const destino = String(dto.estado_cocina);
      const permitido: Record<string, string[]> = {
        PENDIENTE: ['EN_PREPARACION'],
        EN_PREPARACION: ['LISTO'],
        LISTO: ['ENTREGADO'],
        ENTREGADO: ['ENTREGADO'],
      };
      // Envío a cocina desde el escritorio: una línea que llega con su
      // ronda_uuid entra o permanece en PENDIENTE (default de la columna es
      // PENDIENTE; las líneas heredadas en ENTREGADO también entran). Sin
      // ronda no se permite entrar ni retroceder en el ciclo. enviado_at es
      // reloj operativo (ver nota en crearRonda) y solo se estampa en el
      // primer envío.
      if (destino === 'PENDIENTE' && !!dto.ronda_uuid) {
        if (det.sn_entregado === 'S') {
          throw new BadRequestException('La línea ya está entregada: no se puede enviar a cocina');
        }
        if (actual !== 'PENDIENTE' && actual !== 'ENTREGADO') {
          throw new BadRequestException(`Transición de cocina inválida: ${actual} → ${destino}`);
        }
        if (det.enviado_at == null) dto.enviado_at = new Date();
      } else if (destino !== actual && !permitido[actual]?.includes(destino)) {
        throw new BadRequestException(`Transición de cocina inválida: ${actual} → ${destino}`);
      }
      if (destino === 'LISTO' && actual !== 'LISTO') {
        // Reloj operativo de cocina (ver nota en crearRonda): no fechaSistema.
        dto.listo_at = new Date();
      }
    }
    // Entrega por ítem (regla aprobada): sn_entregado solo es modificable — ida o
    // vuelta — cuando la cocina dejó la línea en LISTO. En cualquier otro estado la
    // entrega queda vedada: cocina habilita, el mesero ejecuta (la tablet de cocina
    // y el toggle del mesero no se pisan).
    if (dto?.sn_entregado != null && dto.sn_entregado !== det.sn_entregado) {
      const estadoEntrega = dto?.estado_cocina != null ? String(dto.estado_cocina) : det.estado_cocina;
      if (estadoEntrega !== 'LISTO') {
        throw new BadRequestException(
          `La línea está en "${estadoEntrega ?? 'SIN ESTADO'}": solo se puede cambiar la entrega cuando la cocina la dejó en LISTO`,
        );
      }
    }
    const actualizado = await this.updateEntity(this.pedDetRepo, 'pospeddetId', pospeddetId, empresaId, dto, currentUser, 'Detalle Pedido');
    // Un toggle de entrega / transición de cocina no mueve dinero: si los campos
    // útiles del payload son solo esos, se omite el recálculo de totales (campos
    // de contexto inyectados por el frontend se ignoran para decidirlo).
    const meta = new Set(['empresaId', 'Idsucursal', 'usuarioCreated', 'fecharegistro', 'listo_at', 'enviado_at', 'ronda_uuid']);
    const llaves = Object.keys(dto ?? {}).filter((k) => !meta.has(k));
    const soloCocina =
      llaves.length === 1 && (llaves[0] === 'sn_entregado' || llaves[0] === 'estado_cocina');
    if (!soloCocina) {
      await this.recalcularTotalesPedido(mae.pospedmaeId, mae.empresaId, currentUser);
    }
    await this.sincronizarEntregadoPedido(mae.pospedmaeId, mae.empresaId, currentUser);
    await this.recalcularEstadoPedido(mae.pospedmaeId, mae.empresaId, currentUser);
    return actualizado;
  }

  async findPedidoDetByPedidoId(pospedmaeId: number, empresaId: number) {
    const detalles = await this.pedDetRepo.find({
      where: { pospedmaeId } as unknown as FindOptionsWhere<TPosPedDet>,
      // Orden oficial del mesero: ronda_uuid ASC (NULL primero, igual que MySQL)
      // con desempate por línea dentro de la misma ronda.
      order: { ronda_uuid: 'ASC', pospeddetId: 'ASC' } as any,
    });
    // JOIN de la consulta oficial: productos por codbarra → descripcion, resuelto en lote.
    const barras = [...new Set(detalles.map((d) => d.codbarra).filter((b): b is string => !!b))];
    const prods = barras.length
      ? await this.productoRepo.find({
          where: { codbarra: In(barras), empresaId } as unknown as FindOptionsWhere<Tproducto>,
        })
      : [];
    const mapa = new Map<string, string>(prods.map((p) => [p.codbarra, p.descripcion]));
    return detalles.map((d) => ({
      ...d,
      descripcion: d.codbarra ? mapa.get(d.codbarra) ?? null : null,
      leyenda: this.leyendaEntrega(d),
    }));
  }

  async deletePedido(pospedmaeId: number, empresaId: number) {
    const pedido = await this.exigirPedidoModificable(pospedmaeId, empresaId);
    const detalles = await this.pedDetRepo.find({
      where: { pospedmaeId } as unknown as FindOptionsWhere<TPosPedDet>,
    });
    for (const det of detalles) {
      await this.pedDetRepo.remove(det);
    }
    await this.pedMaeRepo.remove(pedido);
    return { deleted: true };
  }

  async deletePedidoDet(pospeddetId: number, empresaId: number, currentUser?: string) {
    const entity = await this.findOneById(this.pedDetRepo, 'pospeddetId', pospeddetId, empresaId, 'Detalle Pedido');
    const mae = await this.exigirPedidoModificable(entity.pospedmaeId, empresaId);
    await this.pedDetRepo.remove(entity);
    await this.recalcularTotalesPedido(mae.pospedmaeId, mae.empresaId, currentUser || entity.usuarioCreated);
    await this.sincronizarEntregadoPedido(mae.pospedmaeId, mae.empresaId, currentUser || entity.usuarioCreated);
    await this.recalcularEstadoPedido(mae.pospedmaeId, mae.empresaId, currentUser || entity.usuarioCreated);
    return { deleted: true };
  }

  /**
   * Ronda del mesero (POST /facturacion/restaurante/rondas) — mesero → caja/cocina.
   *
   * En UNA transacción (plan 4):
   *  1. Valida puesto en rango, cajaId >= 1, gestorId en ttipogestores (activo),
   *     nombrecliente y líneas; cada producto con tipo_giro 'R' y existencia
   *     (misma regla que /inventario/tienda/productos: SUMA por empresa).
   *  2. Busca la cuenta abierta del puesto (hoy, sn_facturado='N', ≠ ANULADO) con
   *     bloqueo de fila; si no existe, la crea con cajaId, gestorId (mesero),
   *     nombrecliente (cliente) y enviado_at. Si ya existe, se conservan su caja,
   *     su gestor y su cliente (una cuenta se cobra en una sola caja y nace con
   *     un solo mesero).
   *  3. Dedupe por rondaId: si ya hay líneas con ese UUID se devuelve el pedido
   *     tal cual (reintento seguro tras un corte de señal).
   *  4. Inserta una LÍNEA NUEVA por producto (no suma a una existente: cocina ve
   *     cada ronda por separado) con estado_cocina='PENDIENTE'; subtotal/impuesto
   *     calculados en servidor con el mismo criterio que el front.
   *  5. Recalcula totales y estado de la cabecera.
   *
   * A diferencia de createPedido (web/CRM) NO sobreescribe `nombrecliente`:
   * el nombre que manda el mesero es el del cliente de la cuenta.
   */
  async crearRonda(dto: CrearRondaDto, currentUser: string): Promise<TPosPedMae> {
    const empresaId = Number(dto.empresaId) || (await this.fechaSistema.empresaDefault());
    const nromesa = Number(dto.nromesa);
    const enRango =
      (nromesa >= 1 && nromesa <= RESTAURANTE_NUM_MESAS) ||
      (nromesa > 100 && nromesa <= 100 + RESTAURANTE_NUM_KIOSKOS);
    if (!enRango) {
      throw new BadRequestException(`Número de mesa/kiosko fuera de rango: ${nromesa}`);
    }
    if (!dto.cajaId || Number(dto.cajaId) < 1) {
      throw new BadRequestException('La caja es requerida (cajaId >= 1)');
    }
    const nombrecliente = String(dto.nombrecliente ?? '').trim();
    if (!nombrecliente) throw new BadRequestException('El nombre del cliente es requerido');
    if (!dto.lineas?.length) throw new BadRequestException('La ronda no tiene líneas');
    if (dto.gestorId != null) {
      const gestor = await this.gestorRepo.findOne({
        where: {
          gestorId: Number(dto.gestorId),
          empresaId,
          sn_activo: 'S',
        } as unknown as FindOptionsWhere<TtipoGestor>,
      });
      if (!gestor) throw new BadRequestException(`El mesero (gestor ${dto.gestorId}) no existe o no está activo`);
    }

    // Configuración de ISV y validación de líneas (precio + impuesto en servidor)
    const cfg = await this.obtenerConfigISV(empresaId);
    const r2 = (n: number) => Math.round(n * 100) / 100;
    const lineasOk: Array<{
      productoId: number;
      cantidad: number;
      codbarra: string;
      precioventa: number;
      subtotal: number;
      impuesto: number;
    }> = [];
    for (const l of dto.lineas) {
      const cantidad = Number(l.cantidad) || 0;
      if (!(cantidad > 0)) throw new BadRequestException('Cantidad inválida en una línea de la ronda');
      const prod = await this.productoRepo.findOne({
        where: { produtoId: Number(l.productoId), empresaId } as unknown as FindOptionsWhere<Tproducto>,
        relations: ['categoria'],
      });
      if (!prod) throw new BadRequestException(`El producto ${l.productoId} no existe`);
      // Misma regla que las pantallas: solo categorías de giro 'R'
      // (sin categoría → default 'C' → rechazado, igual que el filtro del front)
      if ((prod.categoria?.tipo_giro ?? 'C') !== 'R') {
        throw new BadRequestException(`${prod.descripcion} no es de venta de restaurante (tipo de giro)`);
      }
      const existencias = await this.existenciaRepo.find({
        where: { productoId: prod.produtoId, empresaId } as unknown as FindOptionsWhere<TinvExistencia>,
      });
      const existencia = existencias.reduce((s, e) => s + (Number(e.existencia) || 0), 0);
      // Bajo demanda (sn_solicitado_bajo_demanda='S'): NO se exige existencia —
      // el kardex descuenta igual y puede quedar en negativo (es lo esperado).
      if (cantidad > existencia && prod.sn_solicitado_bajo_demanda !== 'S') {
        throw new BadRequestException(`${prod.descripcion}: solo hay ${existencia} en existencia`);
      }
      const precioventa = Number(prod.precioventa) || 0;
      const subtotal = r2(cantidad * precioventa);
      const impuesto = cfg.incluido ? r2((subtotal * cfg.tasa) / (1 + cfg.tasa)) : r2(subtotal * cfg.tasa);
      lineasOk.push({
        productoId: prod.produtoId,
        cantidad,
        codbarra: prod.codbarra || '',
        precioventa,
        subtotal,
        impuesto,
      });
    }

    // Contexto de cuenta NUEVA (bodega/cliente/sucursal) — fuera de la transacción
    const bodegaId =
      (await this.getBodegaPorUsuario(currentUser, empresaId)) ??
      (await this.getParamDefecto(empresaId, 'bodegaId', 1));
    const tienda = await this.obtenerClienteTienda(empresaId, currentUser);
    let Idsucursal = Number(dto.Idsucursal) || 1;
    if (!dto.Idsucursal) {
      try {
        const u = await this.usuariosRepo.findOne({ where: { usuario: currentUser, empresaId } as any });
        Idsucursal = Number(u?.Idsucursal) || 1;
      } catch {
        Idsucursal = 1;
      }
    }
    const fecharegistro = await this.fechaSistema.obtenerFechaRegistro(currentUser, empresaId);
    const fechaUpd = (await this.fechaSistema.getFecha(empresaId)) as Date;
    const inicioDia = new Date(fechaUpd.getTime());
    inicioDia.setHours(0, 0, 0, 0);
    // enviado_at / listo_at son RELOJ OPERATIVO de cocina (hora de envío y
    // minutos de espera del tablero), no fecha transaccional: NO se usa
    // fechaSistema (medianoche) porque destruiría el cálculo de espera.
    const ahora = new Date();

    return await this.dataSource.transaction(async (em) => {
      // 3) Reintento seguro: si este rondaId ya existe (en cualquier pedido), devolver tal cual
      const yaInsertada = await em.getRepository(TPosPedDet).findOne({
        where: { ronda_uuid: dto.rondaId } as unknown as FindOptionsWhere<TPosPedDet>,
      });
      if (yaInsertada) {
        const previo = await em.getRepository(TPosPedMae).findOne({
          where: { pospedmaeId: yaInsertada.pospedmaeId } as unknown as FindOptionsWhere<TPosPedMae>,
        });
        if (previo) return previo;
      }

      // 2) Cuenta abierta del puesto (hoy) con bloqueo de fila
      let pedido = await em
        .getRepository(TPosPedMae)
        .createQueryBuilder('p')
        .setLock('pessimistic_write')
        .where('p.empresaId = :empresaId', { empresaId })
        .andWhere('p.nromesa = :nromesa', { nromesa })
        .andWhere("p.sn_facturado = 'N'")
        .andWhere("COALESCE(p.estado, 'ABIERTO') <> 'ANULADO'")
        .andWhere('p.fecharegistro >= :inicioDia', { inicioDia })
        .getOne();

      if (!pedido) {
        if (dto.gestorId == null) {
          throw new BadRequestException('Seleccione el mesero para abrir una cuenta nueva.');
        }
        pedido = em.create(TPosPedMae, {
          nombrecliente,
          nrotelefono: 'N/A',
          nromesa,
          sn_entregado: 'N',
          estado: 'ABIERTO',
          enviado_at: ahora,
          cajaId: Number(dto.cajaId),
          gestorId: Number(dto.gestorId),
          clienteId: tienda.clienteId,
          nrocliente: tienda.nrocliente,
          bodegaId,
          Idsucursal,
          // La BD trae sn_facturado DEFAULT 'S' (peligroso) → se fuerza 'N'
          sn_facturado: 'N',
          sn_pagada: 'N',
          sn_enviogratis: 'N',
          tipofactura: 'E',
          empresaId,
          usuarioCreated: currentUser,
          fecharegistro,
        });
        pedido = await em.getRepository(TPosPedMae).save(pedido);
      }

      // 4) Líneas nuevas de la ronda
      const previos = await em.getRepository(TPosPedDet).find({
        where: { pospedmaeId: pedido.pospedmaeId } as unknown as FindOptionsWhere<TPosPedDet>,
      });
      const nrofilaBase = previos.reduce((m, d) => Math.max(m, Number(d.nrofila) || 0), 0);
      const nuevas: TPosPedDet[] = [];
      for (let i = 0; i < lineasOk.length; i++) {
        const l = lineasOk[i];
        const det = em.create(TPosPedDet, {
          pospedmaeId: pedido.pospedmaeId,
          productoId: l.productoId,
          codbarra: l.codbarra,
          cantidad: l.cantidad,
          precioventa: l.precioventa,
          subtotal: l.subtotal,
          descuento: 0,
          p_descuento: 0,
          impuesto: l.impuesto,
          nrofila: nrofilaBase + i + 1,
          bodegaId: pedido.bodegaId,
          // Cada ronda es un ticket nuevo para cocina: línea nace PENDIENTE
          estado_cocina: 'PENDIENTE',
          ronda_uuid: dto.rondaId,
          enviado_at: ahora,
          sn_entregado: 'N',
          empresaId,
          usuarioCreated: currentUser,
          fecharegistro,
        });
        nuevas.push(await em.getRepository(TPosPedDet).save(det));
      }

      // 5) Totales + estado derivados del detalle (decimals vía QueryBuilder)
      const dets = [...previos, ...nuevas];
      let subTotal = 0;
      let impuestoTot = 0;
      let descuentoTot = 0;
      for (const d of dets) {
        subTotal += Number(d.subtotal) || 0;
        impuestoTot += Number(d.impuesto) || 0;
        descuentoTot += Number(d.descuento) || 0;
      }
      subTotal = r2(subTotal);
      impuestoTot = r2(impuestoTot);
      descuentoTot = r2(descuentoTot);
      await em
        .getRepository(TPosPedMae)
        .createQueryBuilder()
        .update()
        .set({
          subTotal,
          impuesto: impuestoTot,
          descuento: descuentoTot,
          total: r2(subTotal + impuestoTot - descuentoTot),
          estado: this.calcularEstadoPedido(dets),
          usuarioUpdated: currentUser,
          fechaUpdated: fechaUpd,
        })
        .where('pospedmaeId = :id AND empresaId = :empresaId', { id: pedido.pospedmaeId, empresaId })
        .execute();

      return (await em.getRepository(TPosPedMae).findOne({
        where: { pospedmaeId: pedido.pospedmaeId } as unknown as FindOptionsWhere<TPosPedMae>,
      }))!;
    });
  }

  async checkoutPedido(dto: CheckoutPedidoDto, currentUser: string) {
    const pedido = await this.pedMaeRepo.findOne({
      where: { pospedmaeId: dto.pospedmaeId } as unknown as FindOptionsWhere<TPosPedMae>,
    });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.sn_facturado === 'S') throw new BadRequestException('El pedido ya fue facturado');

    const empresaId = pedido.empresaId;

    // Mismo criterio que createFactura: no facturar en período contable cerrado
    const fechaDoc = await this.fechaSistema.getFecha(empresaId);
    await this.contabilidadService.validarPeriodoAbierto(empresaId, fechaDoc);

    const detalles = await this.pedDetRepo.find({
      where: { pospedmaeId: dto.pospedmaeId } as unknown as FindOptionsWhere<TPosPedDet>,
    });
    if (detalles.length === 0) throw new BadRequestException('El pedido está vacío');

    const esCredito = (pedido.tipofactura || 'E') === 'C';

    const getParamPedido = async (field: string, def: any) => {
      try {
        const row = await this.tipoParametroRepo.findOne({
          where: { empresaId, moduloId: 3, field, sn_activo: 'S' } as any,
        });
        return row ? (row.tipo === 'NUMBER' ? Number(row.valor) : row.valor) : def;
      } catch { return def; }
    };
    // Bodega/CAJA: las del pedido (ya resueltas en createPedido) → sucursal del
    // usuario (tsucursal.bodegaId) → fallback parámetro
    const bodegaId =
      Number(pedido.bodegaId) ||
      (await this.getBodegaPorUsuario(currentUser, empresaId)) ||
      (await getParamPedido('bodegaId', 1));
    // R4: el turno abierto del usuario manda; el pedido y el parámetro son respaldo.
    const cajaIdSesion = await this.resolverCajaIdDesdeSesion(empresaId, currentUser);
    const cajaId = cajaIdSesion || Number(pedido.cajaId) || (await getParamPedido('cajaId', 1));

    let sesionActiva: any = null;
    if (!dto.esVirtual && !esCredito) {
      sesionActiva = await this.cajaSesionService.obtenerSesionActiva(empresaId, cajaId);
      if (!sesionActiva) {
        throw new BadRequestException(`La caja #${cajaId} no tiene ninguna sesión (turno) abierta. Debe abrir turno antes de facturar.`);
      }
    }

    // Sucursal de la factura: la del usuario autenticado
    // (posfacmae.Idsucursal es NOT NULL sin default — mismo criterio que createFactura)
    let idsucursal = Number(dto.Idsucursal) || 0;
    if (!idsucursal) {
      try {
        const u = await this.usuariosRepo.findOne({ where: { usuario: currentUser, empresaId } as any });
        idsucursal = Number(u?.Idsucursal) || 1;
      } catch {
        idsucursal = 1;
      }
    }

    let subTotal = 0;
    let impuestoTotal = 0;
    let descuentoTotal = 0;
    for (const det of detalles) {
      const precio = Number(det.precioventa);
      const cantidad = Number(det.cantidad);
      const lineaSubTotal = precio * cantidad;
      subTotal += lineaSubTotal;
      impuestoTotal += Number(det.impuesto);
      descuentoTotal += Number(det.descuento);
    }
    const total = subTotal + impuestoTotal - descuentoTotal;
    const cambioPedido = Math.max(0, (Number(dto.efectivo_recibido) || 0) - total);

    // Cliente de la factura: el del pedido si existe (ERP); si no viene o ya no
    // existe en cxcclientes → cliente TIENDA (CRM / pedidos-virtual)
    let clienteFactura: CxcCliente | null = null;
    if (pedido.clienteId) {
      clienteFactura = await this.clienteRepo.findOne({
        where: { clienteId: pedido.clienteId, empresaId } as unknown as FindOptionsWhere<CxcCliente>,
      });
    }
    if (!clienteFactura) clienteFactura = await this.obtenerClienteTienda(empresaId, currentUser);

    const nrofactura = await this.asignarCorrelativo(empresaId, idsucursal, currentUser);

    // Paridad con posfacmae: TODA la cabecera del pedido pasa a la factura
    // (tipo, RTN, exenta/constancia, crédito, gestor, factor de cambio).

    // ── Pagos del checkout: detección de pago por link TodoPago ──────────
    // TodoPagoLink (formapagoId=6): el pago por link NO se registra en
    // posfaccaja al facturar — se inserta recién cuando el link se confirma
    // (POST /todopago/confirmar). La factura nace sn_pagada='N' y el frontend
    // genera el link tras el checkout (mismo flujo que Nueva Factura).
    const pagosTabla = Array.isArray(dto.pagos)
      ? dto.pagos.filter((p: any) => p && Number(p?.importe) > 0)
      : [];
    const pagosNoTP = pagosTabla.filter((p: any) => Number(p?.formapagoId) !== FORMAPAGO_TODOPAGO);
    const conLink =
      !esCredito &&
      (pagosTabla.some((p: any) => Number(p?.formapagoId) === FORMAPAGO_TODOPAGO) ||
        (pagosTabla.length === 0 && Number(dto.formapagoId) === FORMAPAGO_TODOPAGO));
    const sumaPagosNoTP = pagosNoTP.reduce((s: number, p: any) => s + (Number(p?.importe) || 0), 0);

    const facturaPayload: any = {
      nrofactura: nrofactura.nrofactura,
      caiAutorizadoId: nrofactura.caiAutorizadoId ?? null,
      tipofactura: esCredito ? 'C' : 'E',
      clienteId: clienteFactura.clienteId,
      nrocliente: clienteFactura.nrocliente,
      nombrecliente: dto.nombrecliente || pedido.nombrecliente,
      direccion: pedido.direccion_entrega || '',
      rtn_cliente: pedido.rtn_cliente || '',
      factordecambio: Number(pedido.factordecambio) || 1,
      subTotal,
      impuesto: impuestoTotal,
      descuento: descuentoTotal,
      total,
      efectivo_recibido: esCredito ? 0 : (dto.efectivo_recibido || total),
      importe_cambio: esCredito ? 0 : cambioPedido,
      diascredito: esCredito ? Number(pedido.diascredito) || 0 : 0,
      fechavencimiento: esCredito ? pedido.fechavencimiento ?? null : null,
      bodegaId,
      cajaId,
      gestorId: pedido.gestorId ?? null,
      sn_excenta: pedido.sn_excenta || 'N',
      tipoconstancia: pedido.tipoconstancia || 'FNE',
      nroconstancia: pedido.nroconstancia || null,
      importe_excento: Number(pedido.importe_excento) || 0,
      // Con link TodoPago la factura queda pendiente hasta la confirmación
      sn_pagada: esCredito || conLink ? 'N' : 'S',
      sn_anulada: 'N',
      sn_contabilizada: 'N',
      empresaId,
      Idsucursal: idsucursal,
    };

    // Ajuste de efectivo/cambio cuando hay pago por link (el efectivo real es
    // lo no-TP; el link aún no se ha confirmado)
    if (conLink) {
      facturaPayload.efectivo_recibido = sumaPagosNoTP;
      facturaPayload.importe_cambio = 0;
    }

    const factura = await this.createEntity(this.facMaeRepo, facturaPayload, currentUser);
    const motivoFactura = `Factura #${factura.nrofactura || factura.facturaId}`;

    // Crédito: movimiento en CxC (mismo flujo que createFactura →
    // procesarKardexFactura luego vincula el movimiento a la partida)
    if (esCredito) {
      try {
        await this.cxcService.generarMovimientoDesdeFactura(factura, currentUser);
      } catch (error) {
        console.error('Error generando movimiento CXC desde pedido:', error);
      }
    }

    let nrofila = 1;
    for (const det of detalles) {
      await this.createEntity(this.facDetRepo, {
        facturaId: factura.facturaId,
        bodegaId,
        nrofila,
        productoId: Number(det.productoId),
        codbarra: det.codbarra,
        cantidad: Number(det.cantidad),
        precioventa: Number(det.precioventa),
        impuesto: Number(det.impuesto),
        subTotal: Number(det.subtotal),
        descuento: Number(det.descuento),
        sn_anulada: 'N',
        empresaId,
      }, currentUser);
      nrofila++;
    }

    // Formas de pago: SOLO en contado — las facturas a crédito no generan
    // filas de posfaccaja (el abono futuro entra por caja de CxC). Si el
    // frontend envía la tabla de múltiples pagos (igual que Nueva Factura),
    // se crea una fila en posfaccaja por cada uno; si no se envía, se
    // mantiene la fila única legacy (compatible con el CRM / pedidos-virtual).
    // Los pagos TodoPagoLink quedan fuera (ver detección de conLink arriba).
    if (!esCredito) {
      if (pagosNoTP.length > 0) {
        for (const p of pagosNoTP) {
          const importePago = Number(p.importe) || 0;
          await this.createEntity(this.facCajaRepo, {
            facturaId: factura.facturaId,
            formapagoId: Number(p.formapagoId),
            tarjetacreditoId: p.tarjetacreditoId || null,
            nrotarjeta: p.nrotarjeta || null,
            nroautorizacion: p.nroautorizacion || null,
            factordecambio: 1,
            importe_efectivo: Number(p.formapagoId) === FORMAPAGO_EFECTIVO ? importePago : 0,
            importe_otros: Number(p.formapagoId) === FORMAPAGO_EFECTIVO ? 0 : importePago,
            importe_cambio: Number(p.formapagoId) === FORMAPAGO_EFECTIVO ? cambioPedido : 0,
            cajaId,
            empresaId,
          }, currentUser);
        }
      } else if (!conLink) {
        const esEfectivo = Number(dto.formapagoId) === FORMAPAGO_EFECTIVO;
        const recibido = Number(dto.efectivo_recibido) || total;
        await this.createEntity(this.facCajaRepo, {
          facturaId: factura.facturaId,
          formapagoId: dto.formapagoId,
          tarjetacreditoId: dto.tarjetacreditoId || null,
          nrotarjeta: dto.nrotarjeta || null,
          nroautorizacion: dto.nroautorizacion || null,
          factordecambio: 1,
          importe_efectivo: esEfectivo ? recibido : 0,
          importe_otros: esEfectivo ? 0 : total,
          importe_cambio: esEfectivo ? cambioPedido : 0,
          cajaId,
          empresaId,
        }, currentUser);
      }
      // conLink sin pagos no-TP → ninguna fila de caja hasta confirmar el link
    }

    await this.procesarKardexFactura(factura.facturaId, currentUser);

    if (!dto.esVirtual && !esCredito && sesionActiva) {
      if (pagosNoTP.length > 0) {
        for (const p of pagosNoTP) {
          const importePago = Number(p.importe) || 0;
          if (importePago > 0) {
            const { metodo: metodoPago, tipo: tipoMov } = this.resolverMetodoCaja(p.formapagoId, p.tarjetacreditoId);
            await this.cajaSesionService.registrarMovimiento({
              empresaId,
              sesionId: sesionActiva.id,
              tipo: tipoMov,
              signo: 1,
              monto: importePago,
              metodo_pago: metodoPago,
              referencia_tipo: 'FACTURA',
              referencia_id: factura.facturaId,
              motivo: motivoFactura,
            }, currentUser);
          }
        }
      } else if (!conLink) {
        const { metodo: metodoPago, tipo: tipoMov } = this.resolverMetodoCaja(dto.formapagoId, dto.tarjetacreditoId);
        await this.cajaSesionService.registrarMovimiento({
          empresaId,
          sesionId: sesionActiva.id,
          tipo: tipoMov,
          signo: 1,
          monto: total,
          metodo_pago: metodoPago,
          referencia_tipo: 'FACTURA',
          referencia_id: factura.facturaId,
          motivo: motivoFactura,
        }, currentUser);
      }

      if (cambioPedido > 0) {
        await this.cajaSesionService.registrarMovimiento({
          empresaId,
          sesionId: sesionActiva.id,
          tipo: 'DEVOLUCION_EFECTIVO',
          signo: -1,
          monto: cambioPedido,
          metodo_pago: 'EFECTIVO',
          referencia_tipo: 'FACTURA',
          referencia_id: factura.facturaId,
          motivo: motivoFactura,
        }, currentUser);
      }
    }

    const fechaUpd = await this.fechaSistema.getFecha(empresaId);
    // El pedido queda facturado + trazabilidad del nro. de factura. Se actualiza
    // por QueryBuilder para tocar SOLO columnas no decimales (subTotal/impuesto/
    // descuento/total ya fueron recalculados y no deben re-escriturarse).
    await this.pedMaeRepo.createQueryBuilder()
      .update()
      .set({
        sn_facturado: 'S',
        sn_pagada: esCredito || conLink ? 'N' : 'S',
        // Ciclo de vida de restaurante: el cobro cierra la cuenta
        estado: 'COBRADO',
        facturaId: factura.facturaId,
        nrofactura: nrofactura.nrofactura,
        usuarioUpdated: currentUser,
        fechaUpdated: fechaUpd,
      })
      .where('pospedmaeId = :id AND empresaId = :empresaId', { id: pedido.pospedmaeId, empresaId })
      .execute();

    // Trazabilidad en el detalle: cada línea queda vinculada a la factura
    // generada (pospeddet.facturaId → posfacmae) y con su bodega definitiva.
    await this.pedDetRepo.createQueryBuilder()
      .update()
      .set({ facturaId: factura.facturaId, bodegaId, usuarioUpdated: currentUser, fechaUpdated: fechaUpd })
      .where('pospedmaeId = :id AND empresaId = :empresaId', { id: pedido.pospedmaeId, empresaId })
      .execute();

    this.eventEmitter.emit('factura.creada', { factura, currentUser });

    // nrofactura.numérico: los 3 consumidores (ERP, tienda, CRM) lo interpolan
    // como "Factura #n" — antes devolvía el objeto de asignarCorrelativo.
    // conLink: el frontend debe generar el link de pago TodoPago para esta factura.
    return { facturaId: factura.facturaId, nrofactura: nrofactura.nrofactura, total, conLink };
  }

  async findAllComboMae(empresaId: number) {
    return this.findAllByEmpresa(this.cboMaeRepo, empresaId);
  }

  async findComboMae(poscbomaeId: number, empresaId: number) {
    return this.findOneById(this.cboMaeRepo, 'poscbomaeId', poscbomaeId, empresaId, 'Combo');
  }

  async createComboMae(dto: any, currentUser: string) {
    return this.createEntity(this.cboMaeRepo, dto, currentUser);
  }

  async updateComboMae(poscbomaeId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cboMaeRepo, 'poscbomaeId', poscbomaeId, empresaId, dto, currentUser, 'Combo');
  }

  async findAllComboDet(empresaId: number) {
    return this.findAllByEmpresa(this.cboDetRepo, empresaId);
  }

  async findComboDet(poscbodetId: number, empresaId: number) {
    return this.findOneById(this.cboDetRepo, 'poscbodetId', poscbodetId, empresaId, 'Detalle Combo');
  }

  async findComboDetByMae(poscbomaeId: number, empresaId: number) {
    const dets = await this.cboDetRepo.find({
      where: { poscbomaeId, empresaId } as any,
    });
    for (const det of dets) {
      if (det.productoId) {
        try {
          const prod = await this.productoRepo.findOne({
            where: { produtoId: det.productoId, empresaId } as any,
          });
          (det as any).descripcion = prod?.descripcion ?? null;
          const img = await this.productoImgRepo.findOne({
            where: { productoId: det.productoId, empresaId, sn_activo: 'S' } as any,
          });
          (det as any).img = img?.img ?? null;
        } catch {}
      }
    }
    return dets;
  }

  /**
   * Un detalle de combo NUNCA puede venderse por debajo del costo unitario
   * del producto × 1.03 (costo + 3%). Lanza BadRequestException (400).
   */
  private async validarPrecioMinimoCombo(
    productoId: number,
    precioventa: number,
    empresaId: number,
  ) {
    if (!productoId || precioventa == null || !empresaId) return;
    const prod = await this.productoRepo.findOne({
      where: { produtoId: productoId, empresaId } as any,
    });
    if (!prod) return;
    const minimo = Math.round((Number(prod.cstounit) || 0) * 1.03 * 100) / 100;
    const precio = Number(precioventa);
    if (precio < minimo - 0.009) {
      throw new BadRequestException(
        `El precio de venta L ${precio.toFixed(2)} está por debajo del mínimo permitido ` +
          `(costo unitario × 1.03 = L ${minimo.toFixed(2)}) para "${prod.descripcion}"`,
      );
    }
  }

  async createComboDet(dto: any, currentUser: string) {
    await this.validarPrecioMinimoCombo(
      dto.productoId,
      dto.precioventa,
      dto.empresaId,
    );
    return this.createEntity(this.cboDetRepo, dto, currentUser);
  }

  async updateComboDet(poscbodetId: number, empresaId: number, dto: any, currentUser: string) {
    if (dto.precioventa != null) {
      let productoId = dto.productoId;
      if (productoId == null) {
        const actual = await this.cboDetRepo.findOne({
          where: { poscbodetId, empresaId } as any,
        });
        productoId = actual?.productoId;
      }
      if (productoId) {
        await this.validarPrecioMinimoCombo(productoId, dto.precioventa, empresaId);
      }
    }
    return this.updateEntity(this.cboDetRepo, 'poscbodetId', poscbodetId, empresaId, dto, currentUser, 'Detalle Combo');
  }

  async removeComboDet(poscbodetId: number, empresaId: number) {
    return this.cboDetRepo.delete({ poscbodetId, empresaId } as any);
  }

  async removeCombo(poscbomaeId: number, empresaId: number) {
    await this.cboDetRepo.delete({ poscbomaeId, empresaId } as any);
    return this.cboMaeRepo.delete({ poscbomaeId, empresaId } as any);
  }

  /** Productos en oferta/promoción: combo vigente con tipocombo != 'C' */
  async findProductosEnOferta(empresaId: number) {
    const rows = await this.cboDetRepo
      .createQueryBuilder('det')
      .select([
        'det.productoId AS productoId',
        'det.codbarra AS codbarra',
        'det.precioventa AS precioCbo',
        'pro.precioventa AS precioNormal',
        'des.porcentaje AS porcentaje',
        'des.descripcion AS descuentoDesc',
        'mae.tipocombo AS tipocombo',
        'mae.descripcion AS comboDesc',
        'mae.fec_vig_desde AS fecVigDesde',
        'mae.fec_vig_hasta AS fecVigHasta',
      ])
      .innerJoin('tposdescuentos', 'des', 'des.descuentoId = det.descuentoId')
      .innerJoin('productos', 'pro', 'pro.productoId = det.productoId')
      .innerJoin('poscbomae', 'mae', 'mae.poscbomaeId = det.poscbomaeId')
      .where('det.empresaId = :empresaId', { empresaId })
      .andWhere('mae.empresaId = :empresaId', { empresaId })
      .andWhere('DATE(mae.fec_vig_hasta) >= DATE(NOW())')
      .andWhere('DATE(mae.fec_vig_desde) <= DATE(NOW())')
      .andWhere("mae.tipocombo <> 'C'")
      .andWhere('det.descuentoId IS NOT NULL')
      .getRawMany();

    return rows.map(r => ({
      productoId: Number(r.productoId),
      codbarra: r.codbarra,
      precioNormal: Number(r.precioNormal),
      precioConDescuento: Number(r.precioNormal) - (Number(r.precioNormal) * (Number(r.porcentaje) / 100)),
      porcentaje: Number(r.porcentaje),
      descuentoDesc: r.descuentoDesc,
      tipocombo: r.tipocombo,
      comboDesc: r.comboDesc,
      fecVigDesde: r.fecVigDesde,
      fecVigHasta: r.fecVigHasta,
    }));
  }

  async findAllPrecios(empresaId: number) {
    return this.findAllByEmpresa(this.precioVtasRepo, empresaId);
  }

  async findPrecio(preciovtaId: number, empresaId: number) {
    return this.findOneById(this.precioVtasRepo, 'preciovtaId', preciovtaId, empresaId, 'Precio Venta');
  }

  async createPrecio(dto: any, currentUser: string) {
    return this.createEntity(this.precioVtasRepo, dto, currentUser);
  }

  async updatePrecio(preciovtaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.precioVtasRepo, 'preciovtaId', preciovtaId, empresaId, dto, currentUser, 'Precio Venta');
  }

  async removePrecio(preciovtaId: number, empresaId: number) {
    return this.softDelete(this.precioVtasRepo, 'preciovtaId', preciovtaId, empresaId, 'Precio Venta');
  }

  async findAllDescuentos(empresaId: number) {
    return this.findAllByEmpresa(this.descuentosRepo, empresaId);
  }

  async findDescuento(descuentoId: number, empresaId: number) {
    return this.findOneById(this.descuentosRepo, 'descuentoId', descuentoId, empresaId, 'Descuento');
  }

  async createDescuento(dto: any, currentUser: string) {
    return this.createEntity(this.descuentosRepo, dto, currentUser);
  }

  async updateDescuento(descuentoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.descuentosRepo, 'descuentoId', descuentoId, empresaId, dto, currentUser, 'Descuento');
  }

  async removeDescuento(descuentoId: number, empresaId: number) {
    return this.softDelete(this.descuentosRepo, 'descuentoId', descuentoId, empresaId, 'Descuento');
  }

  // ===== FacCaja (formas de pago por factura) =====

  async findAllFacCaja(empresaId: number) {
    return this.findAllByEmpresa(this.facCajaRepo, empresaId);
  }

  async findFacCaja(id: number, empresaId: number) {
    return this.findOneById(this.facCajaRepo, 'posfaccajaId', id, empresaId, 'FacCaja');
  }

  async findFacCajaByFactura(facturaId: number, empresaId: number) {
    return this.facCajaRepo.find({
      where: { facturaId, empresaId } as unknown as FindOptionsWhere<TPosFacCaja>,
    });
  }

  async createFacCaja(dto: any, currentUser: string) {
    const empresaId = Number(dto.empresaId);
    const facMae = await this.facMaeRepo.findOne({
      where: { facturaId: Number(dto.facturaId), empresaId } as FindOptionsWhere<TPosFacMae>,
    });
    const motivoFactura = `Factura #${facMae?.nrofactura ?? dto.facturaId}`;
    // R4: persistir la caja del turno abierto, no la que venga en el payload.
    const cajaIdSesion = await this.resolverCajaIdDesdeSesion(empresaId, currentUser);
    if (cajaIdSesion) dto.cajaId = cajaIdSesion;

    const facCaja = await this.createEntity(this.facCajaRepo, dto, currentUser);

    try {
      const cajaId = Number(dto.cajaId) || 1;
      const sesionActiva = await this.cajaSesionService.obtenerSesionActiva(empresaId, cajaId);
      if (sesionActiva) {
        const monto = (Number(dto.importe_efectivo) || 0) + (Number(dto.importe_otros) || 0);
        const { metodo: metodoPago, tipo: tipoMov } = this.resolverMetodoCaja(dto.formapagoId, dto.tarjetacreditoId);

        if (monto > 0) {
          await this.cajaSesionService.registrarMovimiento({
            empresaId,
            sesionId: sesionActiva.id,
            tipo: tipoMov,
            signo: 1,
            monto,
            metodo_pago: metodoPago,
            referencia_tipo: 'FACTURA',
            referencia_id: dto.facturaId,
            motivo: motivoFactura,
          }, currentUser);
        }

        const cambio = Number(dto.importe_cambio) || 0;
        if (cambio > 0) {
          await this.cajaSesionService.registrarMovimiento({
            empresaId,
            sesionId: sesionActiva.id,
            tipo: 'DEVOLUCION_EFECTIVO',
            signo: -1,
            monto: cambio,
            metodo_pago: 'EFECTIVO',
            referencia_tipo: 'FACTURA',
            referencia_id: dto.facturaId,
            motivo: motivoFactura,
          }, currentUser);
        }
      }
    } catch (err) {
      console.error('Error registrando movimiento de caja desde facCaja:', err);
    }

    return facCaja;
  }

  async updateFacCaja(id: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.facCajaRepo, 'posfaccajaId', id, empresaId, dto, currentUser, 'FacCaja');
  }

  async removeFacCaja(id: number, empresaId: number) {
    return this.softDelete(this.facCajaRepo, 'posfaccajaId', id, empresaId, 'FacCaja');
  }

  async enviarCotizacionPorCorreo(poscotmaeId: number, empresaId: number, email: string) {
    if (!email) throw new BadRequestException('El correo electrónico es requerido');

    const transporter = getTransporter();
    if (!transporter) throw new BadRequestException('Correo no configurado en el servidor');

    const mae = await this.findOneById(this.cotMaeRepo, 'poscotmaeId', poscotmaeId, empresaId, 'Cotización');
    const dets = await this.findCotizacionDetByMaeId(poscotmaeId, empresaId);

    let empresa: any = null;
    try {
      empresa = await this.empresaRepo.findOne({ where: { empresaId } as any });
    } catch {}

    const html = this.generarHtmlCotizacion(mae, dets, empresa);

    await transporter.sendMail({
      from: `"${empresa?.nombre || 'Arcas'}" <${getMailFrom()}>`,
      to: email,
      subject: `Cotización #${poscotmaeId}`,
      html,
    });

    return { success: true, message: `Cotización enviada a ${email}` };
  }

  private generarHtmlCotizacion(mae: any, dets: any[], empresa: any): string {
    const lineas = (dets || []).map((d: any) => `
      <tr>
        <td style="padding:8px;border:1px solid #e2e8f0">${d.codbarra || ''}</td>
        <td style="padding:8px;border:1px solid #e2e8f0">${d.descripcion || d.codbarra || ''}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:center">${Number(d.cantidad)}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:right">L ${Number(d.precio).toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:right">L ${Number(d.subTotal).toFixed(2)}</td>
      </tr>
    `).join('');

    const subtotal = (dets || []).reduce((s: number, d: any) => s + Number(d.subTotal || 0), 0);
    const isv = subtotal * 0.15;
    const total = subtotal + isv;
    const fecha = mae.fecharegistro ? new Date(mae.fecharegistro).toLocaleDateString('es-HN') : '-';

    return `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">
        <h2 style="color:#10b981;margin-bottom:5px">${empresa?.nombre || 'Arcas'}</h2>
        ${empresa?.rtn ? `<p style="color:#64748b;margin:0">RTN: ${empresa.rtn}</p>` : ''}
        <hr style="border:1px solid #e2e8f0">
        <h3 style="margin:10px 0">Cotización #${mae.poscotmaeId}</h3>
        <p><strong>Cliente:</strong> ${mae.Nombrecliente || 'N/A'}</p>
        <p><strong>Dirección:</strong> ${mae.direccion || 'N/A'}</p>
        <p><strong>Atendió:</strong> ${mae.atendio || 'N/A'}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <table style="width:100%;border-collapse:collapse;margin:15px 0">
          <thead>
            <tr style="background:#10b981;color:white">
              <th style="padding:8px;border:1px solid #10b981">Código</th>
              <th style="padding:8px;border:1px solid #10b981">Producto</th>
              <th style="padding:8px;border:1px solid #10b981">Cant</th>
              <th style="padding:8px;border:1px solid #10b981">Precio</th>
              <th style="padding:8px;border:1px solid #10b981">Subtotal</th>
            </tr>
          </thead>
          <tbody>${lineas}</tbody>
        </table>
        <div style="text-align:right">
          <p style="margin:4px 0"><strong>Subtotal:</strong> L ${subtotal.toFixed(2)}</p>
          <p style="margin:4px 0"><strong>ISV 15%:</strong> L ${isv.toFixed(2)}</p>
          <p style="margin:4px 0;font-size:1.2em;color:#10b981"><strong>TOTAL:</strong> L ${total.toFixed(2)}</p>
        </div>
        <hr style="border:1px solid #e2e8f0">
        <p style="color:#64748b;font-size:0.85em;text-align:center">Documento generado electrónicamente</p>
      </div>
    `;
  }

  async enviarFacturaPorCorreo(facturaId: number, empresaId: number, email: string) {
    if (!email) throw new BadRequestException('El correo electronico es requerido');

    const transporter = getTransporter();
    if (!transporter) throw new BadRequestException('Correo no configurado en el servidor');

    const ticket = await this.findFacturaTicket(facturaId, empresaId);
    const html = this.generarHtmlFactura(ticket, facturaId);

    const empName = ticket.empresa?.nombre || 'Arcas';
    const nroFactura = ticket.factura?.nrofactura || facturaId;
    await transporter.sendMail({
      from: empName + " <" + getMailFrom() + ">",
      to: email,
      subject: "Factura #" + nroFactura,
      html,
    });

    return { success: true, message: "Factura enviada a " + email };
  }

  private generarHtmlFactura(ticket: any, fallbackId: number): string {
    const f = ticket.factura;
    const dets = ticket.detalles || [];
    const pagos = ticket.pagos || [];
    const emp = ticket.empresa || {};

    const lineas = dets.map((d: any, i: number) => {
      return '<tr>'
        + '<td style="padding:8px;border:1px solid #e2e8f0;text-align:center">' + (i + 1) + '</td>'
        + '<td style="padding:8px;border:1px solid #e2e8f0">' + (d.descripcion || d.codbarra || '') + '</td>'
        + '<td style="padding:8px;border:1px solid #e2e8f0;text-align:center">' + Number(d.cantidad) + '</td>'
        + '<td style="padding:8px;border:1px solid #e2e8f0;text-align:right">L ' + Number(d.precioventa).toFixed(2) + '</td>'
        + '<td style="padding:8px;border:1px solid #e2e8f0;text-align:right">L ' + Number(d.subTotal).toFixed(2) + '</td>'
        + '</tr>';
    }).join('');

    const pagosHtml = pagos.map((p: any) => {
      return '<p style="margin:2px 0">Efectivo: L ' + Number(p.importe_efectivo || 0).toFixed(2) + ' | Otros: L ' + Number(p.importe_otros || 0).toFixed(2) + '</p>';
    }).join('');

    const fecha = f.fecharegistro ? new Date(f.fecharegistro).toLocaleDateString('es-HN') : '-';
    const tipo = f.tipofactura === 'C' ? 'Credito' : 'Contado';
    const nombre = emp.nombre || 'Arcas';
    const nroFact = f.nrofactura || fallbackId;
    const rtn = emp.rtn || '';
    const dirEmp = emp.direccion || '';
    const tel = emp.telefono || '';
    const cliente = f.nombrecliente || 'N/A';
    const dirCli = f.direccion || 'N/A';
    const sub = Number(f.subTotal || 0).toFixed(2);
    const isv = Number(f.impuesto || 0).toFixed(2);
    const desc = Number(f.descuento || 0).toFixed(2);
    const tot = Number(f.total || 0).toFixed(2);
    const pagosBlock = pagos.length > 0 ? '<hr style="border:1px solid #e2e8f0"><h4>Pagos</h4>' + pagosHtml : '';
    const msjFac = emp.mensajeFactura || '';

    // Info CAI
    const corr = ticket.correlativo;
    const nroFactFmt = corr?.rangoDesde
      ? (() => { const p = corr.rangoDesde.split('-'); return p.length > 1 ? p.slice(0, -1).join('-') + '-' + String(nroFact).padStart(8, '0') : String(nroFact).padStart(8, '0'); })()
      : String(nroFact);

    return '<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">'
      + '<h2 style="color:#10b981;margin-bottom:5px">' + nombre + '</h2>'
      + (rtn ? '<p style="color:#64748b;margin:0">RTN: ' + rtn + '</p>' : '')
      + (dirEmp ? '<p style="color:#64748b;margin:0">' + dirEmp + '</p>' : '')
      + (tel ? '<p style="color:#64748b;margin:0">Tel: ' + tel + '</p>' : '')
      + '<hr style="border:1px solid #e2e8f0">'
      + '<h3 style="margin:10px 0">Factura #' + nroFactFmt + '</h3>'
      + '<p><strong>Cliente:</strong> ' + cliente + '</p>'
      + '<p><strong>Direccion:</strong> ' + dirCli + '</p>'
      + '<p><strong>Fecha:</strong> ' + fecha + '</p>'
      + '<p><strong>Tipo:</strong> ' + tipo + ' | <strong>Estado:</strong> ' + (f.sn_pagada === 'S' ? 'Pagada' : 'Pendiente') + '</p>'
      + (corr ? '<p style="font-size:0.85em;color:#64748b"><strong>Rango Autorizado:</strong> del ' + corr.rangoDesde + ' al ' + corr.rangoHasta + '</p>'
              + '<p style="font-size:0.85em;color:#64748b"><strong>CAI:</strong> ' + corr.cai + '</p>' : '')
      + '<table style="width:100%;border-collapse:collapse;margin:15px 0">'
      + '<thead><tr style="background:#10b981;color:white">'
      + '<th style="padding:8px;border:1px solid #10b981">#</th>'
      + '<th style="padding:8px;border:1px solid #10b981">Producto</th>'
      + '<th style="padding:8px;border:1px solid #10b981">Cant</th>'
      + '<th style="padding:8px;border:1px solid #10b981">Precio</th>'
      + '<th style="padding:8px;border:1px solid #10b981">Subtotal</th>'
      + '</tr></thead>'
      + '<tbody>' + lineas + '</tbody></table>'
      + '<div style="text-align:right">'
      + '<p style="margin:4px 0"><strong>Subtotal:</strong> L ' + sub + '</p>'
      + '<p style="margin:4px 0"><strong>ISV 15%:</strong> L ' + isv + '</p>'
      + '<p style="margin:4px 0"><strong>Descuento:</strong> L ' + desc + '</p>'
      + '<p style="margin:4px 0;font-size:1.2em;color:#10b981"><strong>TOTAL:</strong> L ' + tot + '</p>'
      + '</div>'
      + pagosBlock
      + (msjFac ? '<hr style="border:1px solid #e2e8f0"><p style="color:#64748b;font-size:0.85em;text-align:center;font-style:italic">' + msjFac + '</p>' : '')
      + '<p style="color:#64748b;font-size:0.85em;text-align:center">Documento generado electronicamente</p>'
      + '</div>';
  }
}


