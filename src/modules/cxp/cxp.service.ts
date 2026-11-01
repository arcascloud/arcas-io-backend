import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral, Not } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TCxpProveedor } from './entities/proveedor.entity';
import { TCxpCompraMae } from './entities/compra-mae.entity';
import { TCxpCompraDet } from './entities/compra-det.entity';
import { TCxpMovimiento } from './entities/movimiento.entity';
import { TCxpHistorico } from './entities/historico.entity';
import { TCxpSaldoAv } from './entities/saldoav.entity';
import { TCxpCarteraCta } from './entities/carteracta.entity';
import { TCxpProveedorInfo } from './entities/proveedorinfo.entity';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';
import { CreateCarteraCtaDto, UpdateCarteraCtaDto } from './dto/carteracta.dto';
import { CreateProveedorInfoDto, UpdateProveedorInfoDto } from './dto/proveedorinfo.dto';
import { Tcocarteras } from '../contabilidad/entities/tcocarteras.entity';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { KardexService } from '../inventario/kardex.service';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TPosPrecioVtas } from '../facturacion/entities/tpospreciovtas.entity';
import { Tmodulos } from '../modules/entities/modulo.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { ContabilidadLogicaService } from '../contabilidad/contabilidad-logica.service';
import { TrasaviblidadService } from '../contabilidad/trasaviblidad.service';
import { Tcoplantillapdamae } from '../contabilidad/entities/tcoplantillapdamae.entity';
import { Tcoplantillapdadet } from '../contabilidad/entities/tcoplantillapdadet.entity';
import { Coctamov } from '../contabilidad/entities/coctamov.entity';
import { FechaSistemaService, TABLAS_FECHAREGISTRO } from '../../shared/fecha-sistema.service';
import { CorrelativosService } from '../../shared/correlativos.service';

@Injectable()
export class CxpService {
  constructor(
    @InjectRepository(TCxpProveedor) private readonly proveedorRepo: Repository<TCxpProveedor>,
    @InjectRepository(TCxpCompraMae) private readonly compraMaeRepo: Repository<TCxpCompraMae>,
    @InjectRepository(TCxpCompraDet) private readonly compraDetRepo: Repository<TCxpCompraDet>,
    @InjectRepository(TCxpMovimiento) private readonly movimientoRepo: Repository<TCxpMovimiento>,
    @InjectRepository(TCxpHistorico) private readonly historicoRepo: Repository<TCxpHistorico>,
    @InjectRepository(TCxpSaldoAv) private readonly saldoAvRepo: Repository<TCxpSaldoAv>,
    @InjectRepository(TCxpCarteraCta) private readonly carteraCtaRepo: Repository<TCxpCarteraCta>,
    @InjectRepository(TCxpProveedorInfo) private readonly proveedorInfoRepo: Repository<TCxpProveedorInfo>,
    @InjectRepository(Tcocarteras) private readonly cocarterasRepo: Repository<Tcocarteras>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TPosPrecioVtas) private readonly posPrecioVtaRepo: Repository<TPosPrecioVtas>,
    @InjectRepository(Tmodulos) private readonly moduloRepo: Repository<Tmodulos>,
    @InjectRepository(TCoTipoDocumentoFiscal) private readonly tipoDocFiscalRepo: Repository<TCoTipoDocumentoFiscal>,
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
    @InjectRepository(Tcoplantillapdamae) private readonly plantillaMaeRepo: Repository<Tcoplantillapdamae>,
    @InjectRepository(Tcoplantillapdadet) private readonly plantillaDetRepo: Repository<Tcoplantillapdadet>,
    @InjectRepository(Coctamov) private readonly coctamovRepo: Repository<Coctamov>,
    @Inject(forwardRef(() => KardexService)) private readonly kardexService: KardexService,
    @Inject(forwardRef(() => ContabilidadLogicaService)) private readonly contabilidadService: ContabilidadLogicaService,
    private readonly trazaService: TrasaviblidadService,
    private readonly eventEmitter: EventEmitter2,
    private readonly fechaSistema: FechaSistemaService,
    private readonly correlativos: CorrelativosService,
  ) {}

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
      order: { empresaId: 'ASC' } as any,
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
    // Reglas 1 y 4: en las tablas afectadas (proveedor, cxpcomprasmae,
    // cxpcomprasdet, cxpmovimientos, cxpsalfav), `fecharegistro` lo impone el
    // backend (snapshot tfecma.fechasistema con rango vigente, o
    // tempresas.fechasistema sin él) — nunca el reloj del servidor ni el
    // valor del body. cxpcarteracta / cxphisto / proveedorinfo no están en
    // la lista → el if no entra y conservan su comportamiento actual.
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

  async findAllProveedores(empresaId: number) {
    return this.findAllByEmpresa(this.proveedorRepo, empresaId);
  }

  async findProveedoresPag(empresaId: number, page: number, limit: number, q: string) {
    const qb = this.proveedorRepo.createQueryBuilder('p')
      .where('p.empresaId = :empresaId', { empresaId });

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      qb.andWhere('(p.nombres LIKE :q OR p.apellidos LIKE :q OR p.nroproveedor LIKE :q OR p.rtn LIKE :q OR p.dni LIKE :q)', { q: term });
    }

    const total = await qb.getCount();
    const data = await qb
      .orderBy('p.proveedorId', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async findProveedor(proveedorId: number, empresaId: number) {
    return this.findOneById(this.proveedorRepo, 'proveedorId', proveedorId, empresaId, 'Proveedor');
  }

  /**
   * Verifica si un DNI ya existe en proveedores de la empresa (DNI = llave maestra).
   * excluirId permite ignorar el propio registro al editar.
   */
  async verificarDniProveedor(empresaId: number, dni: string, excluirId?: number) {
    const valor = (dni || '').trim();
    if (!valor) return { existe: false, id: null, numero: null, nombre: null };
    const where: any = { empresaId, dni: valor };
    if (excluirId) where.proveedorId = Not(excluirId);
    const found = await this.proveedorRepo.findOne({ where });
    return {
      existe: !!found,
      id: found ? found.proveedorId : null,
      numero: found ? found.nroproveedor : null,
      nombre: found ? `${found.nombres} ${found.apellidos}` : null,
    };
  }

  async createProveedor(dto: CreateProveedorDto, currentUser: string) {
    // DNI = llave maestra: bloquear duplicado por empresa ANTES de consumir correlativo
    const dniEfectivo = (dto.dni || '').trim() || '0000000000000';
    const dupProv = await this.proveedorRepo.findOne({
      where: { empresaId: dto.empresaId, dni: dniEfectivo } as any,
    });
    if (dupProv) {
      throw new ConflictException(
        `DNI ${dniEfectivo} ya esta registrado a nombre de ${dupProv.nombres} ${dupProv.apellidos} (nro. ${dupProv.nroproveedor})`,
      );
    }

    // Correlativo atómico nroproveedor (ttipoparametros) — solo si no trae número propio.
    // (antes: lookup con moduloId=5 que no coincidía con la fila real moduloId=1 → nunca incrementaba)
    const nroproveedor = dto.nroproveedor || (await this.correlativos.siguienteString('nroproveedor', dto.empresaId, currentUser, 6));

    const payload: any = {
      ...dto,
      nroproveedor,
      razonsocial: dto.razonsocial || `${dto.nombres} ${dto.apellidos}`,
      dni: dniEfectivo,
      // Defaults de credito desde ttipoparametros (CxP, moduloId=5) - solo si el dto no los trae
      interes: dto.interes ?? Number(await this.getValorParametro(dto.empresaId, 'cxp_interes', '0')),
      moratorio: dto.moratorio ?? Number(await this.getValorParametro(dto.empresaId, 'cxp_mora', '0')),
      diasplazo: dto.diasplazo ?? Number(await this.getValorParametro(dto.empresaId, 'cxp_diasPlazo', '0')),
      limiteCredito: dto.limiteCredito ?? Number(await this.getValorParametro(dto.empresaId, 'cxp_limitecredito', '0')),
    };

    return this.createEntity(this.proveedorRepo, payload, currentUser);
  }

  async updateProveedor(proveedorId: number, empresaId: number, dto: UpdateProveedorDto, currentUser: string) {
    // DNI = llave maestra: bloquear que otro proveedor adopte el mismo DNI en la edicion
    if (dto.dni && dto.dni.trim()) {
      const dup = await this.proveedorRepo.findOne({
        where: { empresaId, dni: dto.dni.trim(), proveedorId: Not(proveedorId) } as any,
      });
      if (dup) {
        throw new ConflictException(
          `DNI ${dto.dni.trim()} ya esta registrado a nombre de ${dup.nombres} ${dup.apellidos} (nro. ${dup.nroproveedor})`,
        );
      }
    }
    return this.updateEntity(this.proveedorRepo, 'proveedorId', proveedorId, empresaId, dto, currentUser, 'Proveedor');
  }

  async removeProveedor(proveedorId: number, empresaId: number) {
    return this.softDelete(this.proveedorRepo, 'proveedorId', proveedorId, empresaId, 'Proveedor');
  }

  async findAllCompras(empresaId: number) {
    return this.findAllByEmpresa(this.compraMaeRepo, empresaId);
  }

  async findComprasPendientesPago(empresaId: number) {
    return this.compraMaeRepo.createQueryBuilder('c')
      .innerJoin('proveedor', 'p', 'p.proveedorId = c.proveedorId')
      .leftJoin(
        qb => {
          return qb
            .select('m.nroreferencia', 'compraId')
            .addSelect('COALESCE(SUM(m.importe), 0)', 'totalPagado')
            .from('cxpmovimientos', 'm')
            .where('m.tipomov = :tipomov', { tipomov: 'C' })
            .andWhere('m.empresaId = :empresaId', { empresaId })
            .groupBy('m.nroreferencia');
        },
        'pagos',
        'pagos.compraId = c.compraId'
      )
      .select([
        'c.compraId AS compraId',
        'c.nroreferencia AS nroreferencia',
        'c.total AS total',
        'c.proveedorId AS proveedorId',
        'p.nroproveedor AS codproveedor',
        `COALESCE(p.razonsocial, CONCAT(p.nombres, ' ', p.apellidos)) AS proveedorNombre`,
        'COALESCE(pagos.totalPagado, 0) AS totalPagado',
        '(c.total - COALESCE(pagos.totalPagado, 0)) AS saldo',
      ])
      .where('c.empresaId = :empresaId', { empresaId })
      .andWhere('c.sn_pagada = :sn_pagada', { sn_pagada: 'N' })
      .andWhere('c.sn_procesada = :sn_procesada', { sn_procesada: 'S' })
      .andWhere('c.sn_anulada = :sn_anulada', { sn_anulada: 'N' })
      .orderBy('c.compraId', 'ASC')
      .getRawMany();
  }

  async findCompra(compraId: number, empresaId: number) {
    return this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');
  }

  async createCompra(dto: any, currentUser: string) {
    // Validar que el período esté abierto con la MISMA fecha que se graba
    // (obtenerFechaRegistro — reglas 1 y 4), no con el reloj/fechasistema a secas
    const fecha = await this.fechaSistema.obtenerFechaRegistro(currentUser, dto.empresaId);
    await this.contabilidadService.validarPeriodoAbierto(dto.empresaId, fecha);

    // Correlativo atómico nrocompra (ttipoparametros) — solo si no trae número propio
    const nrocompra = dto.nrocompra || (await this.correlativos.siguiente('nrocompra', dto.empresaId, currentUser));

    const compra = await this.createEntity<TCxpCompraMae>(this.compraMaeRepo, {
      TipoCompra: dto.TipoCompra || 'FCO',
      bodegaId: dto.bodegaId,
      proveedorId: dto.proveedorId,
      documentoId: dto.documentoId,
      nrocompra,
      nroreferencia: dto.nroreferencia,
      monedaId: dto.monedaId,
      factorcambio: dto.factorcambio || 1,
      subtotal: 0,
      descuento: 0,
      impuesto: 0,
      total: 0,
      sn_pagada: 'N',
      // cxpcomprasmae.partidaId es NOT NULL en la BD sin default (la columna se
      // completa al contabilizar); sin partida todavía se guarda 0 = "sin partida"
      partidaId: 0,
      sn_contabilizada: 'N',
      sn_anulada: 'N',
      empresaId: dto.empresaId,
    }, currentUser);

    if (dto.detalles && Array.isArray(dto.detalles) && dto.detalles.length > 0) {
      for (let i = 0; i < dto.detalles.length; i++) {
        const det = dto.detalles[i];
        await this.createEntity(this.compraDetRepo, {
          compraId: compra.compraId,
          bodegaId: det.bodegaId || compra.bodegaId,
          nrofila: i + 1,
          codbarra: det.codbarra,
          descripcion: det.descripcion,
          cantidad: det.cantidad,
          precio: det.precio,
          subtotal: det.subtotal || (det.cantidad * det.precio),
          empresaId: compra.empresaId,
        }, currentUser);
      }
      await this.actualizarTotalCompra(compra.compraId, compra.empresaId);
    }

    this.eventEmitter.emit('compra.creada', { compra, currentUser });
    // Central de transacciones: el registro maestro queda trazado al alta
    await this.registrarTraza(5, compra.compraId, compra.empresaId, dto.Idsucursal ?? null, null, currentUser);
    return compra;
  }

  /**
   * Trazabilidad (tabla `trasaviblidad`). Nunca debe romper el alta/proceso
   * de un documento: si falla, solo se registra en consola.
   */
  private async registrarTraza(
    moduloId: number,
    referenciaId: number,
    empresaId: number,
    idsucursal: number | null,
    partidaId: number | null,
    usuario: string,
  ): Promise<void> {
    try {
      await this.trazaService.create(
        {
          empresaId,
          moduloId,
          referenciaId,
          partidaId: partidaId ?? undefined,
          Idsucursal: idsucursal ?? undefined,
        },
        usuario,
      );
    } catch (error: any) {
      console.error(
        `[trasaviblidad] No se registró módulo=${moduloId} ref=${referenciaId}: ${error?.message || error}`,
      );
    }
  }

  private async actualizarTotalCompra(compraId: number, empresaId: number): Promise<void> {
    const detalles = await this.compraDetRepo.find({
      where: { compraId, empresaId } as unknown as FindOptionsWhere<TCxpCompraDet>,
    });
    const subtotal = detalles.reduce((sum, d) => sum + Number(d.subtotal || 0), 0);
    const compra = await this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');
    compra.subtotal = subtotal;
    const descuento = Number(compra.descuento || 0);
    const impuesto = Number(compra.impuesto || 0);
    compra.total = Math.max(0, Number(subtotal) - descuento + impuesto);
    await this.compraMaeRepo.save(compra);
  }

  /**
   * Lee un parámetro de `ttipoparametros` (field/valor) por empresa.
   * Igual que ContabilidadLogicaService.getValorParametro.
   */
  private async getValorParametro(empresaId: number, field: string, defaultValue: string = 'N'): Promise<string> {
    try {
      const param = await this.tipoParametroRepo.findOne({
        where: { empresaId, field, sn_activo: 'S' } as unknown as FindOptionsWhere<TipoParametro>,
      });
      return param ? param.valor : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * VALIDACIÓN DE COMPRA AL CONTADO (TipoCompra = 'FCO')
   * ----------------------------------------------------
   * Regla: antes de procesar o contabilizar una compra de contado, el saldo de la
   * cuenta de HABER (Caja) de la plantilla PDA "compra a proveedor ... contado"
   * (moduloId = 5, descripcion LIKE '%contado%') debe SER MAYOR O IGUAL al total
   * de la compra registrado en `coctamov`.
   *
   * - Se lee el registro más reciente de `coctamov` de esa cuenta con
   *   (anio, periodo) <= período vigente (fechaSistema de la empresa).
   * - Si el saldo no cubre el total → 400: alerta de saldo insuficiente y
   *   sugerencia de registrarla como compra al crédito.
   * - Compras al crédito (FCC) y órdenes (ORC) no se validan.
   */
  private async validarSaldoCompraContado(compra: TCxpCompraMae): Promise<void> {
    const tipo = (compra.TipoCompra || 'FCO').toUpperCase();
    if (tipo !== 'FCO') return;

    const empresaId = compra.empresaId;
    const total = Number(compra.total) || 0;
    if (total <= 0) return;

    // La validación solo aplica cuando la integración contable de CxP está
    // habilitada (mismo parámetro que decide si se genera la partida).
    // Si sn_integrar_cxp <> 'S' no hay asiento contable → no hay saldo que cubrir.
    const integrarCxp = await this.getValorParametro(empresaId, 'sn_integrar_cxp');
    if (integrarCxp !== 'S') return;

    // Plantilla PDA de compra al contado
    const plantillaMae = await this.plantillaMaeRepo
      .createQueryBuilder('mae')
      .where('mae.moduloId = :moduloId', { moduloId: 5 })
      .andWhere('mae.empresaId = :empresaId', { empresaId })
      .andWhere('mae.sn_activo = :activo', { activo: 'S' })
      .andWhere('LOWER(mae.descripcion) LIKE LOWER(:desc)', { desc: '%contado%' })
      .getOne();
    if (!plantillaMae) return;

    // Líneas de HABER de esa plantilla (típicamente Caja)
    const lineas = await this.plantillaDetRepo.find({
      where: {
        tcoplantillapdamaeId: plantillaMae.tcoplantillapdamaeId,
        naturaleza: 'C',
        sn_activo: 'S',
      } as unknown as FindOptionsWhere<Tcoplantillapdadet>,
      order: { nrofila: 'ASC' },
    });
    if (lineas.length === 0) return;

    const fecha = await this.fechaSistema.getFecha(empresaId);
    const anio = new Date(fecha).getFullYear();
    const periodo = new Date(fecha).getMonth() + 1;

    for (const linea of lineas) {
      const mov = await this.coctamovRepo
        .createQueryBuilder('m')
        .where('m.empresaId = :empresaId', { empresaId })
        .andWhere('m.ctacontable = :cta', { cta: linea.ctacontable })
        .andWhere('(m.anio < :anio OR (m.anio = :anio AND m.periodo <= :periodo))', { anio, periodo })
        .orderBy('m.anio', 'DESC')
        .addOrderBy('m.periodo', 'DESC')
        .getOne();

      const saldo = Number(mov?.saldo) || 0;
      if (saldo + 0.005 < total) {
        const cuenta = linea.descripcion
          ? `${linea.ctacontable} de ${linea.descripcion}`
          : linea.ctacontable;
        throw new BadRequestException(
          `Saldo insuficiente en la cuenta de:\n`
          + `${cuenta}, el saldo es: L ${saldo.toFixed(2)}\n`
          + `la compra #${compra.compraId} a pagar por L ${total.toFixed(2)}.\n\n`
          + `El valor no puede cubrirse de contado.\n`
          + `No se puede procesar ni contabilizar.\n\n`
          + `Opción recomendada es: registrarla como compra al crédito.`,
        );
      }
    }
  }

  async procesarCompra(compraId: number, empresaId: number, currentUser: string, idsucursal?: number) {
    const compra = await this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');

    if (compra.sn_anulada === 'S') {
      throw new BadRequestException('La compra está anulada y no se puede procesar');
    }

    const detalles = await this.compraDetRepo.find({
      where: { compraId, empresaId } as unknown as FindOptionsWhere<TCxpCompraDet>,
    });
    if (detalles.length === 0) {
      throw new BadRequestException('La compra no tiene detalles para procesar');
    }

    await this.actualizarTotalCompra(compraId, empresaId);

    const compraActualizada = await this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');
    const sumaDetalles = detalles.reduce((sum, d) => sum + Number(d.subtotal || 0), 0);
    const totalEsperado = Math.max(0, sumaDetalles - Number(compraActualizada.descuento || 0) + Number(compraActualizada.impuesto || 0));
    if (Math.abs(Number(compraActualizada.total) - totalEsperado) > 0.01) {
      throw new BadRequestException(`El total del header (${compraActualizada.total}) no coincide con el total del detalle (${totalEsperado}). El total del detalle debe ser igual al total del header.`);
    }

    // VALIDACIÓN COMPRA AL CONTADO: el saldo de la cuenta de HABER (Caja)
    // en coctamov debe cubrir el total de la compra. Ver detalle en el JSDoc.
    await this.validarSaldoCompraContado(compraActualizada);

    try {
      await this.registrarKardexEntrada(compraId, empresaId, currentUser);
    } catch (error) {
      console.error('Error registrando Kardex entrada compra:', error);
      throw error;
    }

    try {
      await this.crearMovimientoCxP(compra, currentUser, idsucursal);
    } catch (error) {
      console.error('Error creando movimiento CxP compra:', error);
      throw error;
    }

    compra.sn_procesada = 'S';
    await this.compraMaeRepo.save(compra);

    this.eventEmitter.emit('compra.procesada', { compra, currentUser });
    return { message: 'Compra procesada exitosamente', compraId };
  }

  private async registrarKardexEntrada(compraId: number, empresaId: number, currentUser: string): Promise<void> {
    const detalles = await this.compraDetRepo.find({
      where: { compraId, empresaId } as unknown as FindOptionsWhere<TCxpCompraDet>,
    });

    const compra = await this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');

    for (const det of detalles) {
      if (!det.codbarra) continue;
      const prod = await this.productoRepo.findOne({ where: { codbarra: det.codbarra, empresaId } as any });
      if (!prod) continue;
      await this.kardexService.registrarEntrada({
        bodegaId: det.bodegaId,
        productoId: prod.produtoId,
        cantidad: det.cantidad,
        costoUnitario: det.precio,
        nroreferencia: compraId.toString(),
        moduloId: 2,
        tipomov: 'E',
        subtipoMov: 'C',
        empresaId,
        usuarioCreated: currentUser,
        factordecambio: compra.factorcambio || 1,
        codbarra: det.codbarra,
      });
    }
  }

  private async crearMovimientoCxP(compra: TCxpCompraMae, currentUser: string, idsucursal?: number): Promise<void> {
    const proveedor = await this.findOneById(
      this.proveedorRepo, 'proveedorId', compra.proveedorId, compra.empresaId, 'Proveedor',
    );

    const nombreProveedor = proveedor.razonsocial || `${proveedor.nombres} ${proveedor.apellidos}`;
    const tipoCompraLabel: Record<string, string> = { FCO: 'Factura de contado', FCC: 'Factura al crédito', ORC: 'Orden de compra' };
    const tipoLabel = tipoCompraLabel[compra.TipoCompra] || compra.TipoCompra;
    const ref = compra.nroreferencia || compra.compraId.toString();
    // Correlativo atómico cxp_nromovimiento (ttipoparametros)
    const nromovimiento = await this.correlativos.siguiente('cxp_nromovimiento', compra.empresaId, currentUser);

    const saved = await this.createEntity(this.movimientoRepo, {
      nrocuentabco: '',
      moduloId: 5,
      documentoId: compra.documentoId || 1,
      proveedorId: compra.proveedorId,
      codproveedor: proveedor.nroproveedor,
      tipomov: 'D',
      nroreferencia: ref,
      nromovimiento,
      concepto: `Compra realizada a ${nombreProveedor} según ${tipoLabel} - ${ref}`,
      descripcion2: nombreProveedor,
      importe: compra.total,
      sn_chq: 'N',
      sn_chq_anulado: 'N',
      sn_conciliado: 'N',
      sn_contabilizado: 'N',
      sn_doc_anulado: 'N',
      empresaId: compra.empresaId,
      Idsucursal: idsucursal || 1,
    }, currentUser);

    // Central de transacciones: queda trazado el movimiento CxP generado
    await this.registrarTraza(5, saved.bcomovId, compra.empresaId, saved.Idsucursal ?? idsucursal ?? 1, null, currentUser);

    // Emitir evento para contabilización automática
    this.eventEmitter.emit('cxp.movimiento.creado', {
      movimiento: saved,
      origen: 'compra',
      TipoCompra: compra.TipoCompra || 'FCO',
      compraId: compra.compraId,
      empresaId: compra.empresaId,
    });
  }

  /**
   * (Re)contabiliza una compra que ya fue procesada: re-emite el evento
   * `cxp.movimiento.creado` para que ContabilidadLogica genere la partida,
   * enlace compra + movimiento (partidaId / sn_contabilizada) y registre la
   * trazabilidad. Sirve para compras quedadas sin partida por un fallo previo.
   */
  async contabilizarCompra(compraId: number, empresaId: number, currentUser: string, idsucursal?: number) {
    const compra = await this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');
    if (compra.sn_anulada === 'S') {
      throw new BadRequestException('La compra está anulada y no se puede contabilizar');
    }
    if (compra.sn_procesada !== 'S') {
      throw new BadRequestException('La compra debe estar procesada antes de contabilizarla');
    }
    if (compra.sn_contabilizada === 'S' && compra.partidaId) {
      return { message: 'La compra ya está contabilizada', compraId, partidaId: compra.partidaId };
    }

    // VALIDACIÓN COMPRA AL CONTADO: no se contabiliza si el saldo de la cuenta
    // de HABER (Caja) en coctamov no cubre el total de la compra.
    await this.validarSaldoCompraContado(compra);

    const ref = compra.nroreferencia || String(compraId);
    const mov = await this.movimientoRepo.findOne({
      where: { empresaId, nroreferencia: ref, tipomov: 'D', sn_doc_anulado: 'N' } as unknown as FindOptionsWhere<TCxpMovimiento>,
      order: { bcomovId: 'DESC' } as any,
    });
    if (!mov) {
      throw new BadRequestException('La compra no tiene movimiento CxP para contabilizar');
    }

    // emitAsync = esperamos a que el handler termine (partida + enlaces + traza)
    await this.eventEmitter.emitAsync('cxp.movimiento.creado', {
      movimiento: mov,
      origen: 'compra',
      TipoCompra: compra.TipoCompra || 'FCO',
      compraId: compra.compraId,
      empresaId: compra.empresaId,
    });

    const refrescada = await this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');
    return {
      message: refrescada.sn_contabilizada === 'S' ? 'Compra contabilizada' : 'No se generó partida (revisar log del backend)',
      compraId,
      partidaId: refrescada.partidaId || null,
      sn_contabilizada: refrescada.sn_contabilizada,
    };
  }

  async updateCompra(compraId: number, empresaId: number, dto: any, currentUser: string) {
    if (dto.subtotal !== undefined || dto.descuento !== undefined || dto.impuesto !== undefined) {
      const compra = await this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');
      const sub = dto.subtotal !== undefined ? Number(dto.subtotal) : Number(compra.subtotal || 0);
      const desc = dto.descuento !== undefined ? Number(dto.descuento) : Number(compra.descuento || 0);
      const imp = dto.impuesto !== undefined ? Number(dto.impuesto) : Number(compra.impuesto || 0);
      dto.total = Math.max(0, sub - desc + imp);
    }
    return this.updateEntity(this.compraMaeRepo, 'compraId', compraId, empresaId, dto, currentUser, 'Compra');
  }

  async deleteCompra(compraId: number, empresaId: number, currentUser: string) {
    const compra = await this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');
    if (compra.sn_anulada === 'S') {
      throw new BadRequestException('La compra ya está anulada');
    }
    const now = await this.fechaSistema.getFecha(empresaId);
    compra.sn_anulada = 'S';
    compra.usuarioUpdated = currentUser;
    compra.fechaUpdated = now;
    await this.compraMaeRepo.save(compra);

    const detalles = await this.compraDetRepo.find({
      where: { compraId, empresaId } as unknown as FindOptionsWhere<TCxpCompraDet>,
    });

    for (const det of detalles) {
      try {
        if (!det.codbarra) continue;
        const prod = await this.productoRepo.findOne({ where: { codbarra: det.codbarra, empresaId } as any });
        if (!prod) continue;
        await this.kardexService.registrarSalida({
          bodegaId: det.bodegaId,
          productoId: prod.produtoId,
          cantidad: det.cantidad,
          costoUnitario: det.precio,
          nroreferencia: compraId.toString(),
          moduloId: 2,
          tipomov: 'S',
          subtipoMov: 'AN',
          empresaId,
          usuarioCreated: currentUser,
          codbarra: det.codbarra,
        });
      } catch (error) {
        console.error('Error reversando Kardex en anulación de compra:', error);
      }
    }

    try {
      const movimientos = await this.movimientoRepo.find({
        where: {
          proveedorId: compra.proveedorId,
          empresaId,
          nroreferencia: compraId.toString(),
        } as unknown as FindOptionsWhere<TCxpMovimiento>,
      });
      for (const mov of movimientos) {
        mov.sn_doc_anulado = 'S';
        mov.fec_anulacion = now;
        mov.usuarioUpdated = currentUser;
        mov.fechaUpdated = now;
        await this.movimientoRepo.save(mov);
      }
    } catch (error) {
      console.error('Error anulando movimientos CxP:', error);
    }

    return { message: 'Compra anulada exitosamente' };
  }

  async findAllComprasDet(empresaId: number) {
    return this.findAllByEmpresa(this.compraDetRepo, empresaId);
  }

  async findComprasDetByCompra(compraId: number, empresaId: number) {
    return this.compraDetRepo.find({
      where: { compraId, empresaId } as unknown as FindOptionsWhere<TCxpCompraDet>,
      order: { nrofila: 'ASC' } as any,
    });
  }

  async findCompraDet(cxpcomprasdetId: number, empresaId: number) {
    return this.findOneById(this.compraDetRepo, 'cxpcomprasdetId', cxpcomprasdetId, empresaId, 'Detalle Compra');
  }

  async createCompraDet(dto: any, currentUser: string) {
    if (!dto.nrofila) {
      const existentes = await this.compraDetRepo.find({
        where: { compraId: dto.compraId, empresaId: dto.empresaId } as unknown as FindOptionsWhere<TCxpCompraDet>,
      });
      const maxNro = existentes.reduce((max, d) => Math.max(max, d.nrofila || 0), 0);
      dto.nrofila = maxNro + 1;
    }

    // Calcular precioventa desde tpospreciovtas si se envía preciovtaId
    if (dto.preciovtaId && dto.precio) {
      const pvta = await this.posPrecioVtaRepo.findOne({ where: { preciovtaId: dto.preciovtaId, empresaId: dto.empresaId } as any });
      if (pvta && pvta.porcentaje) {
        dto.precioventa = Number(dto.precio) * (1 + pvta.porcentaje / 100);
      }
    }

    const det = await this.createEntity(this.compraDetRepo, dto, currentUser);
    await this.actualizarTotalCompra(dto.compraId, dto.empresaId);
    return det;
  }

  async updateCompraDet(cxpcomprasdetId: number, empresaId: number, dto: any, currentUser: string) {
    // Calcular precioventa desde tpospreciovtas si se envía preciovtaId
    if (dto.preciovtaId && dto.precio) {
      const pvta = await this.posPrecioVtaRepo.findOne({ where: { preciovtaId: dto.preciovtaId, empresaId } as any });
      if (pvta && pvta.porcentaje) {
        dto.precioventa = Number(dto.precio) * (1 + pvta.porcentaje / 100);
      }
    }

    return this.updateEntity(this.compraDetRepo, 'cxpcomprasdetId', cxpcomprasdetId, empresaId, dto, currentUser, 'Detalle Compra');
  }

  async deleteCompraDet(cxpcomprasdetId: number, empresaId: number) {
    const det = await this.findOneById(this.compraDetRepo, 'cxpcomprasdetId', cxpcomprasdetId, empresaId, 'Detalle Compra');
    const compraId = det.compraId;
    await this.compraDetRepo.remove(det);
    await this.actualizarTotalCompra(compraId, empresaId);
    return { message: 'Detalle eliminado' };
  }

  async findAllMovimientos(empresaId: number) {
    return this.findAllByEmpresa(this.movimientoRepo, empresaId);
  }

  async findMovimientosByProveedor(proveedorId: number, empresaId: number) {
    return this.movimientoRepo.find({
      where: { proveedorId, empresaId } as unknown as FindOptionsWhere<TCxpMovimiento>,
      order: { fecharegistro: 'DESC' } as any,
    });
  }

  async findMovimiento(bcomovId: number, empresaId: number) {
    return this.findOneById(this.movimientoRepo, 'bcomovId', bcomovId, empresaId, 'Movimiento');
  }

  async createMovimiento(dto: any, currentUser: string) {
    const saved = await this.createEntity(this.movimientoRepo, dto, currentUser);
    // Emitir evento para contabilización automática
    if (saved && dto.tipomov && (dto.tipomov === 'D' || dto.tipomov === 'C')) {
      this.eventEmitter.emit('cxp.movimiento.creado', { movimiento: saved, origen: 'manual' });
    }
    return saved;
  }

  async updateMovimiento(bcomovId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.movimientoRepo, 'bcomovId', bcomovId, empresaId, dto, currentUser, 'Movimiento');
  }

  async findAllHistoricos(empresaId: number) {
    return this.findAllByEmpresa(this.historicoRepo, empresaId);
  }

  async findHistoricoConFiltros(
    empresaId: number,
    dni?: string,
    proveedor?: string,
    fechaDesde?: string,
    fechaHasta?: string,
  ) {
    const qb = this.movimientoRepo.createQueryBuilder('a')
      .select('a.proveedorId', 'proveedorId')
      .addSelect('a.fecharegistro', 'fecharegistro')
      .addSelect('a.codproveedor', 'nroproveedor')
      .addSelect('b.dni', 'dni')
      .addSelect('b.razonsocial', 'proveedor')
      .addSelect('c.descripcion', 'modulo')
      .addSelect('d.abreviatura', 'abreviatura')
      .addSelect('a.nroreferencia', 'nroreferencia')
      .addSelect('a.tipomov', 'tipomov')
      .addSelect('a.importe', 'importe')
      .addSelect('COALESCE(a.concepto, a.descripcion2, \'\')', 'concepto')
      .addSelect('a.sn_doc_anulado', 'sn_doc_anulado')
      .addSelect('a.sn_contabilizado', 'sn_contabilizado')
      .addSelect('a.bcomovId', 'bcomovId')
      .addSelect('a.documentoId', 'documentoId')
      .innerJoin('proveedor', 'b', 'b.proveedorId = a.proveedorId')
      .innerJoin('tmodulos', 'c', 'c.moduloId = a.moduloId')
      .innerJoin('tcotipodocumentofiscal', 'd', 'd.tipodocumentofiscalId = a.documentoId')
      .where('a.empresaId = :empresaId', { empresaId })
      .orderBy('a.fecharegistro', 'DESC')
      .addOrderBy('a.bcomovId', 'DESC');

    if (dni && dni.trim()) {
      qb.andWhere('b.dni LIKE :dni', { dni: `%${dni.trim()}%` });
    }

    if (proveedor && proveedor.trim()) {
      qb.andWhere('(b.razonsocial LIKE :proveedor OR b.nombres LIKE :proveedor OR b.apellidos LIKE :proveedor)', {
        proveedor: `%${proveedor.trim()}%`,
      });
    }

    if (fechaDesde && fechaDesde.trim()) {
      qb.andWhere('a.fecharegistro >= :fechaDesde', { fechaDesde: `${fechaDesde.trim()} 00:00:00` });
    }

    if (fechaHasta && fechaHasta.trim()) {
      qb.andWhere('a.fecharegistro <= :fechaHasta', { fechaHasta: `${fechaHasta.trim()} 23:59:59` });
    }

    return qb.getRawMany();
  }

  async findHistorico(cxphistoId: number, empresaId: number) {
    return this.findOneById(this.historicoRepo, 'cxphistoId', cxphistoId, empresaId, 'Historico');
  }

  async createHistorico(dto: any, currentUser: string) {
    return this.createEntity(this.historicoRepo, dto, currentUser);
  }

  async updateHistorico(cxphistoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.historicoRepo, 'cxphistoId', cxphistoId, empresaId, dto, currentUser, 'Historico');
  }

  async findAllSaldosAv(empresaId: number) {
    return this.findAllByEmpresa(this.saldoAvRepo, empresaId);
  }

  async findSaldoAv(cxpsalfavId: number, empresaId: number) {
    return this.findOneById(this.saldoAvRepo, 'cxpsalfavId', cxpsalfavId, empresaId, 'Saldo A favor');
  }

  async createSaldoAv(dto: any, currentUser: string) {
    return this.createEntity(this.saldoAvRepo, dto, currentUser);
  }

  async updateSaldoAv(cxpsalfavId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.saldoAvRepo, 'cxpsalfavId', cxpsalfavId, empresaId, dto, currentUser, 'Saldo A favor');
  }

  // ========== Cartera Contable por Proveedor (cxpcarteracta) ==========

  async findAllCarterasCta(empresaId: number) {
    return this.carteraCtaRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<TCxpCarteraCta>,
      order: { proveedorId: 'ASC' } as any,
    });
  }

  async findCarteraCta(id: number, empresaId: number) {
    return this.findOneById(this.carteraCtaRepo, 'id', id, empresaId, 'Cartera contable de proveedor');
  }

  async createCarteraCta(dto: CreateCarteraCtaDto, currentUser: string, idsucursal?: number) {
    // Sucursal: preferir la enviada, si no la del usuario autenticado
    const sucursal = dto.Idsucursal ?? idsucursal;
    if (!sucursal) {
      throw new BadRequestException('La sucursal es requerida');
    }

    // Validar proveedor (FK) — no existe → 400 en vez de 500
    const proveedor = await this.proveedorRepo.findOne({
      where: { proveedorId: dto.proveedorId, empresaId: dto.empresaId } as any,
    });
    if (!proveedor) {
      throw new BadRequestException('El proveedor indicado no existe');
    }

    // Validar cartera contable (FK a tcocarteras)
    const cartera = await this.cocarterasRepo.findOne({
      where: { tcocarteraId: dto.carteractaId } as any,
    });
    if (!cartera) {
      throw new BadRequestException('La cartera contable indicada no existe');
    }

    // Unicidad: (proveedorId, carteractaId, Idsucusal, empresaId)
    const dup = await this.carteraCtaRepo.findOne({
      where: {
        proveedorId: dto.proveedorId,
        carteractaId: dto.carteractaId,
        Idsucursal: sucursal,
        empresaId: dto.empresaId,
      } as any,
    });
    if (dup) {
      throw new BadRequestException('El proveedor ya tiene asignada esta cartera contable');
    }

    return this.createEntity(this.carteraCtaRepo, {
      proveedorId: dto.proveedorId,
      carteractaId: dto.carteractaId,
      Idsucursal: sucursal,
      empresaId: dto.empresaId,
    }, currentUser);
  }

  async updateCarteraCta(id: number, empresaId: number, dto: UpdateCarteraCtaDto, currentUser: string, idsucursal?: number) {
    const entity = await this.findOneById(this.carteraCtaRepo, 'id', id, empresaId, 'Cartera contable de proveedor');

    const nuevoProveedor = dto.proveedorId ?? entity.proveedorId;
    const nuevaCartera = dto.carteractaId ?? entity.carteractaId;
    const nuevaSucursal = dto.Idsucursal ?? entity.Idsucursal ?? idsucursal;

    // Validar FKs solo si cambiaron
    if (dto.proveedorId != null && dto.proveedorId !== entity.proveedorId) {
      const proveedor = await this.proveedorRepo.findOne({
        where: { proveedorId: dto.proveedorId, empresaId } as any,
      });
      if (!proveedor) throw new BadRequestException('El proveedor indicado no existe');
    }
    if (dto.carteractaId != null && dto.carteractaId !== entity.carteractaId) {
      const cartera = await this.cocarterasRepo.findOne({
        where: { tcocarteraId: dto.carteractaId } as any,
      });
      if (!cartera) throw new BadRequestException('La cartera contable indicada no existe');
    }

    // Unicidad excluyendo el propio registro
    const dup = await this.carteraCtaRepo.findOne({
      where: {
        proveedorId: nuevoProveedor,
        carteractaId: nuevaCartera,
        Idsucursal: nuevaSucursal,
        empresaId,
      } as any,
    });
    if (dup && dup.id !== id) {
      throw new BadRequestException('El proveedor ya tiene asignada esta cartera contable');
    }

    const now = await this.fechaSistema.getFecha(empresaId);
    Object.assign(entity, {
      proveedorId: nuevoProveedor,
      carteractaId: nuevaCartera,
      Idsucursal: nuevaSucursal,
      usuarioUpdate: currentUser,
      fechaUpdate: now,
    });
    return this.carteraCtaRepo.save(entity);
  }

  async removeCarteraCta(id: number, empresaId: number) {
    // La tabla NO tiene sn_activo → eliminación física
    const entity = await this.findOneById(this.carteraCtaRepo, 'id', id, empresaId, 'Cartera contable de proveedor');
    await this.carteraCtaRepo.remove(entity);
    return { id, eliminado: true };
  }

  // ========== Info de Proveedores (proveedorinfo) ==========

  async findAllProveedorInfo(empresaId: number) {
    return this.proveedorInfoRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<TCxpProveedorInfo>,
      order: { proveedorId: 'ASC', id: 'ASC' } as any,
    });
  }

  async findProveedorInfoByProveedor(proveedorId: number, empresaId: number) {
    return this.proveedorInfoRepo.find({
      where: { proveedorId, empresaId } as unknown as FindOptionsWhere<TCxpProveedorInfo>,
      order: { id: 'ASC' } as any,
    });
  }

  async findProveedorInfo(id: number, empresaId: number) {
    return this.findOneById(this.proveedorInfoRepo, 'id', id, empresaId, 'Info de proveedor');
  }

  async createProveedorInfo(dto: CreateProveedorInfoDto, currentUser: string) {
    // Validar proveedor (FK a proveedor) — no existe → 400 en vez de 500
    const proveedor = await this.proveedorRepo.findOne({
      where: { proveedorId: dto.proveedorId, empresaId: dto.empresaId } as any,
    });
    if (!proveedor) {
      throw new BadRequestException('El proveedor indicado no existe');
    }

    // Unicidad: (proveedorId, tipo, empresaId) — un solo registro por tipo
    const dup = await this.proveedorInfoRepo.findOne({
      where: {
        proveedorId: dto.proveedorId,
        tipo: dto.tipo,
        empresaId: dto.empresaId,
      } as unknown as FindOptionsWhere<TCxpProveedorInfo>,
    });
    if (dup) {
      throw new BadRequestException('El proveedor ya tiene un registro de este tipo de información');
    }

    return this.createEntity(this.proveedorInfoRepo, {
      proveedorId: dto.proveedorId,
      tipo: dto.tipo,
      descripcion: dto.descripcion ?? null,
      sn_activo: dto.sn_activo ?? 'S',
      empresaId: dto.empresaId,
    }, currentUser);
  }

  async updateProveedorInfo(id: number, empresaId: number, dto: UpdateProveedorInfoDto, currentUser: string) {
    const entity = await this.findOneById(this.proveedorInfoRepo, 'id', id, empresaId, 'Info de proveedor');

    const nuevoProveedor = dto.proveedorId ?? entity.proveedorId;
    const nuevoTipo = dto.tipo ?? entity.tipo;

    // Validar FK solo si cambió
    if (dto.proveedorId != null && dto.proveedorId !== entity.proveedorId) {
      const proveedor = await this.proveedorRepo.findOne({
        where: { proveedorId: dto.proveedorId, empresaId } as any,
      });
      if (!proveedor) throw new BadRequestException('El proveedor indicado no existe');
    }

    // Unicidad excluyendo el propio registro
    const dup = await this.proveedorInfoRepo.findOne({
      where: {
        proveedorId: nuevoProveedor,
        tipo: nuevoTipo,
        empresaId,
      } as unknown as FindOptionsWhere<TCxpProveedorInfo>,
    });
    if (dup && dup.id !== id) {
      throw new BadRequestException('El proveedor ya tiene un registro de este tipo de información');
    }

    const now = await this.fechaSistema.getFecha(empresaId);
    Object.assign(entity, {
      proveedorId: nuevoProveedor,
      tipo: nuevoTipo,
      descripcion: dto.descripcion !== undefined ? dto.descripcion : entity.descripcion,
      sn_activo: dto.sn_activo ?? entity.sn_activo,
      usuarioUpdated: currentUser,
      fechaUpdated: now,
    });
    return this.proveedorInfoRepo.save(entity);
  }

  async removeProveedorInfo(id: number, empresaId: number, currentUser: string) {
    // La tabla tiene sn_activo → desactivación lógica
    const entity = await this.findOneById(this.proveedorInfoRepo, 'id', id, empresaId, 'Info de proveedor');
    const now2 = await this.fechaSistema.getFecha(empresaId);
    Object.assign(entity, {
      sn_activo: 'N',
      usuarioUpdated: currentUser,
      fechaUpdated: now2,
    });
    return this.proveedorInfoRepo.save(entity);
  }
}
