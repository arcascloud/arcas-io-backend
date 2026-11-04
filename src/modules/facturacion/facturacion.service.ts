import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
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
import { Tusuarios } from '../users/entities/usuario.entity';
import { TusuarioInfo } from '../users/entities/usuario-info.entity';
import { TusuarioCaja } from '../parametros/entities/usuario-caja.entity';
import { Tsucursal } from '../sucursales/entities/sucursal.entity';
import { TCai } from '../companies/entities/tcai.entity';
import { FechaSistemaService, TABLAS_FECHAREGISTRO } from '../../shared/fecha-sistema.service';
import { CorrelativosService } from '../../shared/correlativos.service';
import { getTransporter, getMailFrom } from '../../config/mail';

/** ttipoformapago.formapagoId de 'TodoPagoLink' (pago por link — se confirma vía /todopago/confirmar) */
const FORMAPAGO_TODOPAGO = 6;

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
    @Inject(forwardRef(() => CxcService)) private readonly cxcService: CxcService,
    @Inject(forwardRef(() => KardexService)) private readonly kardexService: KardexService,
    @Inject(forwardRef(() => ContabilidadLogicaService)) private readonly contabilidadService: ContabilidadLogicaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly fechaSistema: FechaSistemaService,
    private readonly correlativos: CorrelativosService,
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

    // ----- Cajero (tusuarios) + TPV (tusuarios_caja.codigo) del usuario que emitió -----
    const usuarioTicket = factura.usuarioCreated || null;
    const cajeroRow = usuarioTicket
      ? await this.usuariosRepo.findOne({ where: { usuario: usuarioTicket } as unknown as FindOptionsWhere<Tusuarios> })
      : null;
    const cajaRow = usuarioTicket
      ? await this.usuarioCajaRepo.findOne({
          where: { usuario: usuarioTicket, empresaId } as unknown as FindOptionsWhere<TusuarioCaja>,
          order: { id: 'ASC' } as any,
        })
      : null;

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
      tpv: cajaRow?.codigo ?? null,
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

  async createFactura(dto: CreatePosFacMaeDto, currentUser: string) {
    // Validar que el período esté abierto
    const fechaDoc = await this.fechaSistema.getFecha(dto.empresaId);
    await this.contabilidadService.validarPeriodoAbierto(dto.empresaId, fechaDoc);

    // Bodega por defecto: la sucursal del usuario (tsucursal.bodegaId); si no, parámetro con fallback
    if (!dto.bodegaId) {
      dto.bodegaId =
        (await this.getBodegaPorUsuario(currentUser, dto.empresaId)) ??
        (await this.getParamDefecto(dto.empresaId, 'bodegaId', 1));
    }
    // Caja por defecto: parámetro de facturación con fallback (checkout hace lo mismo)
    if (!dto.cajaId) dto.cajaId = await this.getParamDefecto(dto.empresaId, 'cajaId', 1);

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

    if (dto.tipofactura === 'C') {
      try {
        await this.cxcService.generarMovimientoDesdeFactura(factura, currentUser);
      } catch (error) {
        console.error('Error generando movimiento CXC:', error);
      }
    }

    // Integración contable automática (se ejecuta después del kardex)
    // Se llama desde procesarKardexFactura porque necesita que el inventario esté procesado

    this.eventEmitter.emit('factura.creada', { factura, currentUser });

    return { ...factura, ...caiInfo };
  }

  async procesarKardexFactura(facturaId: number, currentUser: string): Promise<{ procesados: number; errores: string[] }> {
    const detalles = await this.facDetRepo.find({
      where: { facturaId } as FindOptionsWhere<TPosFacDet>,
    });

    console.log(`[procesarKardex] facturaId=${facturaId}, detalles encontrados: ${detalles.length}`);

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
          nroreferencia: facturaId.toString(),
          moduloId: 1,
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
    // Se ejecuta después de procesar kardex porque necesita que el inventario esté actualizado
    if (errores.length === 0) {
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

    if (facturaOriginal.sn_anulada === 'S') {
      throw new BadRequestException('La factura ya esta anulada');
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
        moduloId: 1,
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

    await this.createEntity(this.facCajaRepo, {
      facturaId: factura.facturaId,
      formapagoId: dto.formapagoId,
      tarjetacreditoId: dto.tarjetacreditoId || null,
      nrotarjeta: dto.nrotarjeta || null,
      nroautorizacion: dto.nroautorizacion || null,
      factordecambio: 1,
      importe_efectivo: dto.efectivo_recibido || total,
      importe_otros: 0,
      importe_cambio: (dto.efectivo_recibido || total) - total,
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

  async findAllPedidos(empresaId: number, currentUser?: string) {
    if (currentUser && currentUser !== 'SYSTEM' && currentUser !== 'admin') {
      const userInfo = await this.usuarioInfoRepo.findOne({ where: { usuario: currentUser } });
      if (userInfo && userInfo.sn_cliente === 'S') {
        return this.pedMaeRepo.find({
          where: { empresaId, usuarioCreated: currentUser } as any,
          order: { fecharegistro: 'DESC' },
        });
      }
    }
    return this.findAllByEmpresaOrdered(this.pedMaeRepo, empresaId, 'fecharegistro');
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

    const det = await this.createEntity(this.pedDetRepo, dto, currentUser);
    await this.recalcularTotalesPedido(mae.pospedmaeId, mae.empresaId, currentUser);
    await this.sincronizarEntregadoPedido(mae.pospedmaeId, mae.empresaId, currentUser);
    return det;
  }

  async updatePedidoDet(pospeddetId: number, empresaId: number, dto: any, currentUser: string) {
    const det = await this.findOneById(this.pedDetRepo, 'pospeddetId', pospeddetId, empresaId, 'Detalle Pedido');
    const mae = await this.exigirPedidoModificable(det.pospedmaeId, empresaId);
    if (dto?.empresaId != null && dto.empresaId !== mae.empresaId) {
      throw new BadRequestException('El detalle no pertenece a la misma empresa que el pedido');
    }
    const actualizado = await this.updateEntity(this.pedDetRepo, 'pospeddetId', pospeddetId, empresaId, dto, currentUser, 'Detalle Pedido');
    // Un toggle de entrega no mueve dinero: si el único campo útil del payload es
    // sn_entregado se omite el recálculo de totales (campos de contexto
    // inyectados por el frontend se ignoran para decidirlo).
    const meta = new Set(['empresaId', 'Idsucursal', 'usuarioCreated', 'fecharegistro']);
    const llaves = Object.keys(dto ?? {}).filter((k) => !meta.has(k));
    const soloCambioEntrega = llaves.length === 1 && llaves[0] === 'sn_entregado';
    if (!soloCambioEntrega) {
      await this.recalcularTotalesPedido(mae.pospedmaeId, mae.empresaId, currentUser);
    }
    await this.sincronizarEntregadoPedido(mae.pospedmaeId, mae.empresaId, currentUser);
    return actualizado;
  }

  async findPedidoDetByPedidoId(pospedmaeId: number, empresaId: number) {
    const detalles = await this.pedDetRepo.find({
      where: { pospedmaeId } as unknown as FindOptionsWhere<TPosPedDet>,
    });
    return detalles;
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
    return { deleted: true };
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
    const cajaId = Number(pedido.cajaId) || (await getParamPedido('cajaId', 1));

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
    const esCredito = (pedido.tipofactura || 'E') === 'C';

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
      importe_cambio: esCredito ? 0 : (dto.efectivo_recibido || total) - total,
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
            importe_efectivo: p.esEfectivo ? importePago : 0,
            importe_otros: p.esEfectivo ? 0 : importePago,
            importe_cambio: 0,
            cajaId,
            empresaId,
          }, currentUser);
        }
      } else if (!conLink) {
        await this.createEntity(this.facCajaRepo, {
          facturaId: factura.facturaId,
          formapagoId: dto.formapagoId,
          tarjetacreditoId: dto.tarjetacreditoId || null,
          nrotarjeta: dto.nrotarjeta || null,
          nroautorizacion: dto.nroautorizacion || null,
          factordecambio: 1,
          importe_efectivo: dto.efectivo_recibido || total,
          importe_otros: 0,
          importe_cambio: (dto.efectivo_recibido || total) - total,
          cajaId,
          empresaId,
        }, currentUser);
      }
      // conLink sin pagos no-TP → ninguna fila de caja hasta confirmar el link
    }

    await this.procesarKardexFactura(factura.facturaId, currentUser);

    const fechaUpd = await this.fechaSistema.getFecha(empresaId);
    // El pedido queda facturado + trazabilidad del nro. de factura. Se actualiza
    // por QueryBuilder para tocar SOLO columnas no decimales (subTotal/impuesto/
    // descuento/total ya fueron recalculados y no deben re-escriturarse).
    await this.pedMaeRepo.createQueryBuilder()
      .update()
      .set({
        sn_facturado: 'S',
        sn_pagada: esCredito || conLink ? 'N' : 'S',
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
    return this.createEntity(this.facCajaRepo, dto, currentUser);
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


