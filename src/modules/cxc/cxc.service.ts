import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral, Like, Not, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnEvent } from '@nestjs/event-emitter';
import { CxcCliente } from './entities/cxccliente.entity';
import { CxccClientesRef } from './entities/cxccclientesref.entity';
import { Cxccajero } from './entities/cxccajero.entity';
import { CxccajaMae } from './entities/cxccajamae.entity';
import { CxccajaDet } from './entities/cxccajadet.entity';
import { CxcMovimiento } from './entities/cxcmovimiento.entity';
import { CxcHistoro } from './entities/cxchisto.entity';
import { CxcSalFav } from './entities/cxcsalfav.entity';
import { TcctDiasCobro } from './entities/tcctdiascobro.entity';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { CxcPrestamo } from './entities/cxcprestamo.entity';
import { CxcPrestamoPP } from './entities/cxcprestamopp.entity';
import { CxcPariente } from './entities/cxcpariente.entity';
import { CxcCarteraCta } from './entities/carteracta.entity';
import { CxcClientesInfo } from './entities/cxccclientesinfo.entity';
import { CxcCategoria } from './entities/cxccategoria.entity';
import { CreateCxcCategoriaDto, UpdateCxcCategoriaDto } from './dto/cxccategoria.dto';
import { Tcocarteras } from '../contabilidad/entities/tcocarteras.entity';
import { TPosFacMae } from '../facturacion/entities/posfacmae.entity';
import { Tempresas } from '../companies/entities/empresa.entity';
import { TempresasDet } from '../companies/entities/empresasdet.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { Tcoplantillapdamae } from '../contabilidad/entities/tcoplantillapdamae.entity';
import { Tcoplantillapdadet } from '../contabilidad/entities/tcoplantillapdadet.entity';
import { TtipoFormaPago } from '../parametros/entities/forma-pago.entity';
import { TtipoTarjetaCredito } from '../parametros/entities/tarjeta-credito.entity';
import { ContabilidadLogicaService } from '../contabilidad/contabilidad-logica.service';
import { ContabilizarPartidaDto, LineaPartidaDto } from '../contabilidad/dto/contabilidad.dto';
import { FechaSistemaService, TABLAS_FECHAREGISTRO } from '../../shared/fecha-sistema.service';
import { CorrelativosService } from '../../shared/correlativos.service';
import {
  CreateCxcClienteDto, UpdateCxcClienteDto,
  CreateCxcMovimientoDto, UpdateCxcMovimientoDto,
  CreateCxcPrestamoDto, UpdateCxcPrestamoDto,
} from './dto/cxc.dto';
import { CreateCxcCarteraCtaDto, UpdateCxcCarteraCtaDto } from './dto/carteracta.dto';
import { CreateCxcClientesInfoDto, UpdateCxcClientesInfoDto } from './dto/clientesinfo.dto';

@Injectable()
export class CxcService {
  [x: string]: any;
  private readonly logger = new Logger(CxcService.name);

  constructor(
    @InjectRepository(CxcCliente) private readonly clienteRepo: Repository<CxcCliente>,
    @InjectRepository(CxccClientesRef) private readonly clienteRefRepo: Repository<CxccClientesRef>,
    @InjectRepository(Cxccajero) private readonly cajeroRepo: Repository<Cxccajero>,
    @InjectRepository(CxccajaMae) private readonly cajaMaeRepo: Repository<CxccajaMae>,
    @InjectRepository(CxccajaDet) private readonly cajaDetRepo: Repository<CxccajaDet>,
    @InjectRepository(CxcMovimiento) private readonly movimientoRepo: Repository<CxcMovimiento>,
    @InjectRepository(CxcHistoro) private readonly historoRepo: Repository<CxcHistoro>,
    @InjectRepository(CxcSalFav) private readonly salFavRepo: Repository<CxcSalFav>,
    @InjectRepository(TcctDiasCobro) private readonly diasCobroRepo: Repository<TcctDiasCobro>,
    @InjectRepository(CxcPrestamo) private readonly prestamoRepo: Repository<CxcPrestamo>,
    @InjectRepository(CxcPrestamoPP) private readonly prestamoPPRepo: Repository<CxcPrestamoPP>,
    @InjectRepository(CxcPariente) private readonly parienteRepo: Repository<CxcPariente>,
    @InjectRepository(CxcCarteraCta) private readonly carteraCtaRepo: Repository<CxcCarteraCta>,
    @InjectRepository(CxcClientesInfo) private readonly clienteInfoRepo: Repository<CxcClientesInfo>,
    @InjectRepository(CxcCategoria) private readonly categoriaRepo: Repository<CxcCategoria>,
    @InjectRepository(Tcocarteras) private readonly cocarterasRepo: Repository<Tcocarteras>,
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
    @InjectRepository(TPosFacMae) private readonly facMaeRepo: Repository<TPosFacMae>,
    @InjectRepository(Tempresas) private readonly empresaRepo: Repository<Tempresas>,
    @InjectRepository(TempresasDet) private readonly empresaDetRepo: Repository<TempresasDet>,
    @InjectRepository(TCoTipoDocumentoFiscal) private readonly tipoDocRepo: Repository<TCoTipoDocumentoFiscal>,
    @InjectRepository(Tcoplantillapdamae) private readonly plantillaMaeRepo: Repository<Tcoplantillapdamae>,
    @InjectRepository(Tcoplantillapdadet) private readonly plantillaDetRepo: Repository<Tcoplantillapdadet>,
    @InjectRepository(TtipoFormaPago) private readonly formaPagoRepo: Repository<TtipoFormaPago>,
    @InjectRepository(TtipoTarjetaCredito) private readonly tarjetaRepo: Repository<TtipoTarjetaCredito>,
    private readonly eventEmitter: EventEmitter2,
    private readonly fechaSistema: FechaSistemaService,
    private readonly correlativos: CorrelativosService,
    @Inject(forwardRef(() => ContabilidadLogicaService))
    private readonly contabilidadService: ContabilidadLogicaService,
  ) {}

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
    });
  }

  /**
   * Genera el siguiente número de correlativo de movimiento CxC desde
   * ttipoparametros (CorrelativosService, patrón atómico por Idsucursal+empresaId):
   * tipomov='D' → field='nro_debito'  (notas/movimientos de débito)
   * tipomov='C' → field='nro_credito' (notas/movimientos de crédito)
   */
  async generarNroMovimiento(empresaId: number, tipomov: 'D' | 'C', currentUser: string): Promise<number> {
    const field = tipomov === 'D' ? 'nro_debito' : 'nro_credito';
    const siguiente = await this.correlativos.siguiente(field, empresaId, currentUser);
    this.logger.log(`Correlativo ${field}: → ${siguiente}`);
    return siguiente;
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

    // Reglas 1 y 4: en las tablas afectadas, `fecharegistro` lo impone el
    // backend (snapshot tfecma.fechasistema con rango vigente, o
    // tempresas.fechasistema sin él) — nunca el reloj del servidor ni el
    // valor que envíe el cliente en el body.
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
    const now = await this.fechaSistema.getFecha(empresaId);
    // `fecharegistro` es inmutable en las tablas afectadas: se estampa al crear
    // y un PUT no debe poder refechar el registro.
    if (TABLAS_FECHAREGISTRO.has(repo.metadata.tableName) && dto) {
      const { fecharegistro: _ignorado, ...resto } = dto;
      dto = resto;
    }
    Object.assign(entity, dto, {
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

  async findAllClientes(empresaId: number, page: number, limit: number, q?: string, moduloId?: number) {
    const whereBase: FindOptionsWhere<CxcCliente> = { empresaId };
    if (moduloId != null) {
      whereBase.moduloId = moduloId;
    }
    
    const [data, total] = await this.clienteRepo.findAndCount({
      where: q 
        ? [
            { ...whereBase, nombres: Like('%' + q + '%') },
            { ...whereBase, apellidos: Like('%' + q + '%') },
            { ...whereBase, nrocliente: Like('%' + q + '%') },
            { ...whereBase, dni: Like('%' + q + '%') },
            { ...whereBase, rtn: Like('%' + q + '%') },
          ]
        : whereBase,
      skip: (page - 1) * limit,
      take: limit,
      order: { clienteId: 'DESC' }
    });
    return { data, total };
  }

  async findCliente(clienteId: number, empresaId: number) {
    return this.findOneById(this.clienteRepo, 'clienteId', clienteId, empresaId, 'Cliente');
  }

  /**
   * Verifica si un DNI ya existe en clientes de la empresa (DNI = llave maestra).
   * excluirId permite ignorar el propio registro al editar.
   */
  async verificarDniCliente(empresaId: number, dni: string, excluirId?: number) {
    const valor = (dni || '').trim();
    if (!valor) return { existe: false, id: null, numero: null, nombre: null };
    const where: any = { empresaId, dni: valor };
    if (excluirId) where.clienteId = Not(excluirId);
    const found: CxcCliente | null = await this.clienteRepo.findOne({ where });
    return {
      existe: !!found,
      id: found ? found.clienteId : null,
      numero: found ? found.nrocliente : null,
      nombre: found ? `${found.nombres} ${found.apellidos}` : null,
    };
  }

  async createCliente(dto: CreateCxcClienteDto, currentUser: string) {
    // DNI = llave maestra: bloquear duplicado por empresa ANTES de consumir correlativo
    const dniEfectivo = (dto.dni || '').trim() || '0000000000000';
    const dupCliente = await this.clienteRepo.findOne({
      where: { empresaId: dto.empresaId, dni: dniEfectivo } as any,
    });
    if (dupCliente) {
      throw new ConflictException(
        `DNI ${dniEfectivo} ya esta registrado a nombre de ${dupCliente.nombres} ${dupCliente.apellidos} (nro. ${dupCliente.nrocliente})`,
      );
    }

    // Leer parámetros de CxC de la tabla unificada ttipoparametros (moduloId=4)
    const getParam = async (field: string, def: any) => {
      try {
        const row = await this.tipoParametroRepo.findOne({
          where: { empresaId: dto.empresaId, moduloId: 4, field, sn_activo: 'S' } as any,
        });
        return row ? (row.tipo === 'NUMBER' ? Number(row.valor) : row.valor) : def;
      } catch { return def; }
    };

    // Correlativo atómico nrocliente (ttipoparametros) — solo si el cliente no trae número propio
    const nrocliente = dto.nrocliente || (await this.correlativos.siguienteString('nrocliente', dto.empresaId, currentUser, 6));
    const now = await this.fechaSistema.getFecha(dto.empresaId);

    const payload: any = {
      ...dto,
      nrocliente,
      moduloId: dto.moduloId ?? 4,
      // cxcclientes.Idsucursal es NOT NULL con FK a tsucursal (solo existen 1,2,3)
      // — fallback 1 (MATRIZ); 0 viola la FOREIGN KEY.
      Idsucursal: dto.Idsucursal ?? 1,
      dni: dniEfectivo,
      razonsocial: dto.razonsocial || `${dto.nombres} ${dto.apellidos}`,
      // fecharegistro: lo estampa createEntity() con obtenerFechaRegistro()
      // (reglas 1 y 4) — el valor del body se ignora.
      fechanacimiento: dto.fechanacimiento || now.toISOString(),
      interes: dto.interes ?? await getParam('cxc_interes', 0),
      moratorio: dto.moratorio ?? await getParam('cxc_mora', 0),
      diasplazo: dto.diasplazo ?? await getParam('cxc_diasPlazo', 0),
      // diasgracia en BD es NOT NULL sin default (synchronize: false) — setear explícito
      diasgracia: (dto as any).diasgracia ?? 0,
      limiteCredito: dto.limiteCredito ?? await getParam('cxc_limitecredito', 0),
    };

    const saved = await this.createEntity(this.clienteRepo, payload, currentUser);

    return saved;
  }

  async updateCliente(clienteId: number, empresaId: number, dto: UpdateCxcClienteDto, currentUser: string) {
    // DNI = llave maestra: bloquear que otro cliente adopte el mismo DNI en la edicion
    if (dto.dni && dto.dni.trim()) {
      const dup = await this.clienteRepo.findOne({
        where: { empresaId, dni: dto.dni.trim(), clienteId: Not(clienteId) } as any,
      });
      if (dup) {
        throw new ConflictException(
          `DNI ${dto.dni.trim()} ya esta registrado a nombre de ${dup.nombres} ${dup.apellidos} (nro. ${dup.nrocliente})`,
        );
      }
    }
    return this.updateEntity(this.clienteRepo, 'clienteId', clienteId, empresaId, dto, currentUser, 'Cliente');
  }

  async removeCliente(clienteId: number, empresaId: number) {
    return this.softDelete(this.clienteRepo, 'clienteId', clienteId, empresaId, 'Cliente');
  }

  async findAllClientesRef(empresaId: number) {
    return this.findAllByEmpresa(this.clienteRefRepo, empresaId);
  }

  async findClientesRefByCliente(clienteId: number, empresaId: number) {
    return this.clienteRefRepo.find({
      where: { clienteId, empresaId } as FindOptionsWhere<CxccClientesRef>,
      order: { referenciaId: 'DESC' },
    });
  }

  async findClienteRef(referenciaId: number, empresaId: number) {
    return this.findOneById(this.clienteRefRepo, 'referenciaId', referenciaId, empresaId, 'Referencia Cliente');
  }

  async createClienteRef(dto: any, currentUser: string) {
    return this.createEntity(this.clienteRefRepo, dto, currentUser);
  }

  async updateClienteRef(referenciaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.clienteRefRepo, 'referenciaId', referenciaId, empresaId, dto, currentUser, 'Referencia Cliente');
  }

  async findAllCajeros(empresaId: number) {
    return this.findAllByEmpresa(this.cajeroRepo, empresaId);
  }

  async findCajero(cajaId: number, empresaId: number) {
    return this.findOneById(this.cajeroRepo, 'cajaId', cajaId, empresaId, 'Cajero');
  }

  async createCajero(dto: any, currentUser: string) {
    return this.createEntity(this.cajeroRepo, dto, currentUser);
  }

  async updateCajero(cajaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cajeroRepo, 'cajaId', cajaId, empresaId, dto, currentUser, 'Cajero');
  }

  async findAllCajaMae(empresaId: number) {
    return this.findAllByEmpresa(this.cajaMaeRepo, empresaId);
  }

  async findCajaMae(cxccajaId: number, empresaId: number) {
    return this.findOneById(this.cajaMaeRepo, 'cxccajaId', cxccajaId, empresaId, 'Caja Maestro');
  }

  async createCajaMae(dto: any, currentUser: string) {
    let payload = dto;

    // Destino = Préstamos: el formulario oculta Tipo Documento / Nro. Documento
    // (no aplica documento fiscal a un cobro de cuotas), pero ambas columnas son
    // NOT NULL en cxccajamae. Se completan aquí:
    //   - documentoId = 13 'Prestamo' de tcotipodocumentofiscal (PPR)
    //   - nrodocumento = nroprestamo del préstamo (trazabilidad del recibo)
    if (Number(dto?.destinoabono) === 2) {
      payload = { ...dto };
      if (!payload.documentoId) payload.documentoId = 13;
      if (!payload.nrodocumento && payload.prestamoId) {
        const prestamo = await this.prestamoRepo.findOne({
          where: { prestamoId: Number(payload.prestamoId), empresaId: Number(payload.empresaId) } as FindOptionsWhere<CxcPrestamo>,
        });
        payload.nrodocumento = prestamo?.nroprestamo ?? '';
      }
      if (!payload.nrodocumento) payload.nrodocumento = '';
    }

    const caja = await this.createEntity<CxccajaMae>(this.cajaMaeRepo, payload, currentUser);
    // NO se genera movimiento aquí. El movimiento real se crea en createCajaDet
    // con el importe correcto de cada forma de pago.
    return caja;
  }

  async updateCajaMae(cxccajaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cajaMaeRepo, 'cxccajaId', cxccajaId, empresaId, dto, currentUser, 'Caja Maestro');
  }

  async findAllCajaDet(empresaId: number) {
    return this.findAllByEmpresa(this.cajaDetRepo, empresaId);
  }

  async findCajaDet(cxccajadetId: number, empresaId: number) {
    return this.findOneById(this.cajaDetRepo, 'cxccajadetId', cxccajadetId, empresaId, 'Detalle Caja');
  }

  async createCajaDet(dto: any, currentUser: string) {
    const cajero = await this.cajeroRepo.findOne({
      where: { usuario: currentUser, empresaId: dto.empresaId, sn_activo: 'S' } as FindOptionsWhere<Cxccajero>,
    });

    const cajaMae = await this.cajaMaeRepo.findOne({
      where: { cxccajaId: dto.cxccajaId, empresaId: dto.empresaId } as FindOptionsWhere<CxccajaMae>,
    });

    const cajaDet = await this.createEntity<CxccajaDet>(this.cajaDetRepo, {
      ...dto,
      // Forzamos 'N' porque el default real de la BD es 'S' (synchronize:false).
      // Sin esto, todo detalle nacería anulado y procesarAbonoCaja no lo vería.
      sn_anulado: 'N',
      cajaId: cajero?.cajaId ?? 0,
      clienteId: cajaMae?.clienteId ?? dto.clienteId,
      nrocliente: cajaMae?.nrocliente ?? dto.nrocliente,
    }, currentUser);

    // NOTA: los movimientos CxC de un cobro ya NO se generan por detalle.
    // Se generan de forma centralizada (sobre el TOTAL, con reparto de cargos vs
    // capital) en procesarAbonoCaja(), invocado por el controller tras guardar.

    return cajaDet;
  }

  async updateCajaDet(cxccajadetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cajaDetRepo, 'cxccajadetId', cxccajadetId, empresaId, dto, currentUser, 'Detalle Caja');
  }

  private async generarMovimientoDesdeCaja(caja: CxccajaMae, currentUser: string): Promise<CxcMovimiento> {
    const cliente = await this.findCliente(caja.clienteId, caja.empresaId);
    const fecharegistro = await this.fechaSistema.obtenerFechaRegistro(currentUser, caja.empresaId);

    const movimiento = this.movimientoRepo.create({
      fecharegistro,
      clienteId: caja.clienteId,
      nrocliente: cliente.nrocliente,
      moduloId: 4,
      documentoId: caja.documentoId,
      tipomov: 'C',
      nroreferencia: caja.nrodocumento,
      factordecambio: 1,
      importe: 0,
      concepto: `Pago Caja #${caja.cxccajaId} - ${caja.concepto || ''}`,
      sn_cotabilizada: 'N',
      sn_doc_anulado: 'N',
      empresaId: caja.empresaId,
      Idsucursal: caja.Idsucursal || 1,
      usuarioCreated: currentUser,
    });

    return this.movimientoRepo.save(movimiento);
  }

  private async generarMovimientoDesdeCajaDet(cajaDet: CxccajaDet, cajaMae: CxccajaMae, currentUser: string): Promise<CxcMovimiento> {
    const cliente = await this.findCliente(cajaDet.clienteId, cajaDet.empresaId);
    const fecharegistro = await this.fechaSistema.obtenerFechaRegistro(currentUser, cajaDet.empresaId);
    const Idsucursal = cajaDet.Idsucursal || cajaMae.Idsucursal || 1;
    const nromovimiento = await this.generarNroMovimiento(cajaDet.empresaId, 'C', currentUser);

    // Regla de negocio: el abono debe heredar el módulo de ORIGEN del documento
    // pagado para que findDocumentosPendientesCliente lo agrupe bajo la misma
    // clave y el crédito descuente el débito (FAC→3, NDB manual→4).
    const moduloOrigen = await this.resolverModuloOrigenDocumento(
      cajaDet.clienteId, cajaDet.empresaId, cajaMae.nrodocumento, cajaMae.documentoId,
    );

    const movimiento = this.movimientoRepo.create({
      fecharegistro,
      nromovimiento,
      clienteId: cajaDet.clienteId,
      nrocliente: cliente.nrocliente,
      moduloId: moduloOrigen,
      documentoId: cajaMae.documentoId,
      tipomov: 'C',
      nroreferencia: cajaMae.nrodocumento,
      factordecambio: cajaDet.factordecambio || 1,
      importe: cajaDet.importe,
      concepto: `Abono Caja #${cajaMae.cxccajaId} - ${cajaMae.concepto || ''}`,
      sn_cotabilizada: 'N',
      sn_doc_anulado: 'N',
      empresaId: cajaDet.empresaId,
      Idsucursal,
      usuarioCreated: currentUser,
    });

    const saved = await this.movimientoRepo.save(movimiento);

    // Emitir evento para contabilización automática
    this.eventEmitter.emit('cxc.movimiento.creado', { movimiento: saved, origen: 'caja', cajaMae, cajaDet });

    return saved;
  }

  /**
   * Regla de negocio: devuelve el módulo de ORIGEN del documento que se está
   * pagando, de modo que el abono (crédito) herede ese mismo módulo y así
   * findDocumentosPendientesCliente lo agrupe bajo la misma clave
   * `${moduloId}-${nroreferencia}` que su débito, permitiendo descontar el saldo.
   *
   * - Factura de crédito (posfacmae) → módulo 3.
   * - Nota de débito / entrada manual desde movimientos CxC → módulo 4.
   */
  private async resolverModuloOrigenDocumento(
    clienteId: number, empresaId: number, nrodocumento: string, documentoId: number,
  ): Promise<number> {
    const nro = Number(nrodocumento);
    if (!Number.isFinite(nro) || nro <= 0) return 4;

    const fac = await this.facMaeRepo
      .createQueryBuilder('f')
      .select(['f.nrofactura'])
      .where('f.clienteId = :clienteId AND f.empresaId = :empresaId AND f.nrofactura = :nro', { clienteId, empresaId, nro })
      .getOne();
    return fac ? 3 : 4;
  }

  /**
   * Regla de negocio (CxC · caja): genera los movimientos de un abono a partir
   * del TOTAL del cobro, aplicando primero los cargos (interés + mora) y
   * el resto al capital de la factura.
   *
   * - Factura de crédito: 1 movimiento capital (tipomov='C', módulo ORIGEN=3,
   *   descuenta la factura) + interés ICS (tipomov='I', documentoId=11, módulo 4)
   *   y mora ICM (tipomov='I', documentoId=12, módulo 4). Los movimientos 'I'
   *   NO afectan el saldo del cliente — solo registran el cobro de cargos.
   * - Documento no-factura (NDC manual, etc.): 1 único movimiento por el total con el
   *   módulo de origen (4).
   * - Destino = Préstamos (`destinoabono = 2`): delega en `procesarAbonoPrestamo`
   *   (paga cuotas del plan y registra el desglose capital/interés/mora como
   *   movimientos `I` — ver `procesarAbonoPrestamo`).
   *
   * Idempotente: borra los movimientos previamente generados por ESTA caja antes de
   * regenerar, para que re-guardar no duplique.
   */
  async procesarAbonoCaja(
    cxccajaId: number,
    empresaId: number,
    currentUser: string,
    ui?: {
      interes?: number;
      mora?: number;
      prestamoId?: number;
    },
  ) {
    const cajaMae = await this.cajaMaeRepo.findOne({
      where: { cxccajaId, empresaId } as FindOptionsWhere<CxccajaMae>,
    });
    if (!cajaMae) throw new NotFoundException(`Caja #${cxccajaId} no encontrada`);
    if (cajaMae.tipomov !== 'C') return { movimientos: 0, motivo: 'No es un cobro (tipomov ≠ C)' };

    // Destino = Préstamos: paga cuotas del plan de pago (sin movimientos CxC).
    if (Number(cajaMae.destinoabono) === 2) {
      return this.procesarAbonoPrestamo(cajaMae, empresaId, currentUser, ui ?? {});
    }

    const cliente = await this.findCliente(cajaMae.clienteId, empresaId);

    const dets = await this.cajaDetRepo.find({
      where: { cxccajaId, empresaId, sn_anulado: 'N' } as FindOptionsWhere<CxccajaDet>,
    });
    const totalEfectivo = dets.reduce((s, d) => s + (Number(d.importe) || 0), 0);
    const r2 = (x: number) => Math.round(x * 100) / 100;

    // Limpieza idempotente: solo los movimientos que ESTA caja había generado.
    await this.movimientoRepo.createQueryBuilder()
      .delete()
      .where('clienteId = :clienteId AND empresaId = :empresaId AND nroreferencia = :nro', {
        clienteId: cajaMae.clienteId, empresaId, nro: cajaMae.nrodocumento,
      })
      .andWhere('concepto LIKE :marca', { marca: `%Caja #${cxccajaId}%` })
      .andWhere('sn_doc_anulado = :noanulado', { noanulado: 'N' })
      .execute();

    if (totalEfectivo <= 0) return { movimientos: 0, motivo: 'Sin importe en los detalles' };

    const fecharegistro = await this.fechaSistema.obtenerFechaRegistro(currentUser, empresaId);
    const Idsucursal = cajaMae.Idsucursal || 1;
    const marca = `Caja #${cxccajaId}`;

    // ¿Es una factura de crédito? (posfacmae)
    const nro = Number(cajaMae.nrodocumento);
    const fac = Number.isFinite(nro) && nro > 0
      ? await this.facMaeRepo.findOne({
          where: { clienteId: cajaMae.clienteId, empresaId, nrofactura: nro, tipofactura: 'C' } as unknown as FindOptionsWhere<TPosFacMae>,
        })
      : null;

    const creados: CxcMovimiento[] = [];

    const nuevoMov = async (
      parcial: { moduloId: number; documentoId: number; importe: number; concepto: string; tipomov?: string },
      emitir = true,
    ) => {
      if (r2(parcial.importe) <= 0) return;
      const tipomov = parcial.tipomov || 'C';
      const nromovimiento = await this.generarNroMovimiento(empresaId, 'C', currentUser);
      const mov = this.movimientoRepo.create({
        fecharegistro,
        nromovimiento,
        clienteId: cajaMae.clienteId,
        nrocliente: cliente.nrocliente,
        moduloId: parcial.moduloId,
        documentoId: parcial.documentoId,
        tipomov,
        nroreferencia: cajaMae.nrodocumento,
        factordecambio: 1,
        importe: r2(parcial.importe),
        concepto: parcial.concepto,
        sn_cotabilizada: 'N',
        sn_doc_anulado: 'N',
        empresaId,
        Idsucursal,
        usuarioCreated: currentUser,
      });
      const saved = await this.movimientoRepo.save(mov);
      creados.push(saved);
      // Contabilización automática por movimiento (solo si emitir=true).
      // En cobros de factura de crédito con cargos se emite UN solo evento combinado.
      if (emitir) {
        this.eventEmitter.emit('cxc.movimiento.creado', { movimiento: saved, origen: 'caja', cajaMae });
      }
    };

    if (fac) {
      const hoy = await this.fechaSistema.getFecha(empresaId);

      // Fuente de la verdad = valores calculados y APROBADOS por la UI (interés/mora).
      // Solo se recalcula como fallback si la UI no los envía (p.ej. llamada directa a API).
      let interes: number;
      let mora: number;
      if (ui?.interes != null || ui?.mora != null) {
        interes = r2(Math.max(0, Number(ui?.interes) || 0));
        mora = r2(Math.max(0, Number(ui?.mora) || 0));
      } else {
        const tasaAnual = Number(cliente.interes) || 0;
        const tasaMoratoria = Number(cliente.moratorio) || 0;
        const diasPlazo = Number(cliente.diasplazo) || 0;
        const diasGracia = Number(cliente.diasgracia) || 0;
        const fechaUltAbono: Date = fac.fechaultabono ?? fac.fecharegistro;
        const saldo = await this.calcularSaldoFactura(cajaMae.clienteId, empresaId, cajaMae.nrodocumento);
        const calcSaldo = this.calcularInteresesFactura({
          saldo, tasaAnual, tasaMoratoria, diasPlazo, diasGracia, fechaUltAbono, hoy,
        });
        interes = calcSaldo.interes;
        mora = calcSaldo.mora;
      }

      const cargos = r2(interes + mora);
      const pagos = totalEfectivo;
      // Se pagan primero los cargos (interés antes que mora), luego el capital.
      const interesCobrado = r2(Math.min(interes, pagos));
      const moraCobrada = r2(Math.min(mora, r2(pagos - interesCobrado)));
      const abonoCapital = r2(Math.max(0, pagos - cargos));

      // 1) Capital → descuenta la factura (módulo ORIGEN=3). emitir=false:
      //    la contabilización del cobro se hace UNA sola vez con el evento combinado.
      await nuevoMov({
        moduloId: 3,
        documentoId: Number(cajaMae.documentoId) || 1,
        importe: abonoCapital,
        concepto: `Abono a capital · ${marca} - ${cajaMae.concepto || ''}`.trim(),
      }, false);

      // 2) Interés cobrado → ICS (documentoId=11, módulo 4, tipomov='I').
      //    tipomov='I' NO afecta el saldo del cliente (solo registra el cobro de cargos).
      await nuevoMov({
        moduloId: 4,
        documentoId: 11,
        importe: interesCobrado,
        concepto: `Interés devengado cobrado · ${marca}`.trim(),
        tipomov: 'I',
      }, false);

      // 3) Mora cobrada → ICM (documentoId=12, módulo 4, tipomov='I').
      await nuevoMov({
        moduloId: 4,
        documentoId: 12,
        importe: moraCobrada,
        concepto: `Interés moratorio cobrado · ${marca}`.trim(),
        tipomov: 'I',
      }, false);

      // 4) Actualizar el último abono de la factura (fecha del sistema).
      await this.facMaeRepo.createQueryBuilder()
        .update()
        .set({ fechaultabono: hoy, fechaUpdated: hoy, usuarioUpdated: currentUser })
        .where('facturaId = :id AND empresaId = :empresaId', { id: fac.facturaId, empresaId })
        .execute();

      // 5) UN solo evento de contabilización para todo el cobro (capital + cargos).
      //    El listener arma la partida PDA 3 con el importe correcto por cuenta.
      this.eventEmitter.emit('cxc.cobro.contabilizar', {
        abonoCapital,
        interes: interesCobrado,
        mora: moraCobrada,
        facturaId: fac.facturaId,
        empresaId,
        Idsucursal,
        nroreferencia: cajaMae.nrodocumento,
        nrocliente: cliente.nrocliente,
        concepto: `Abono caja #${cxccajaId} - ${cajaMae.concepto || ''}`.trim(),
        movimientoIds: creados.map((m) => m.clienteMovId),
        currentUser,
        cajaMae,
      });
    } else {
      // Documento no-factura: un único movimiento por el total con el módulo de origen.
      const moduloOrigen = await this.resolverModuloOrigenDocumento(
        cajaMae.clienteId, empresaId, cajaMae.nrodocumento, cajaMae.documentoId,
      );
      await nuevoMov({
        moduloId: moduloOrigen,
        documentoId: Number(cajaMae.documentoId) || 0,
        importe: totalEfectivo,
        concepto: `Abono · ${marca} - ${cajaMae.concepto || ''}`.trim(),
      });
    }

    return { movimientos: creados.length, totalEfectivo: r2(totalEfectivo) };
  }

  /**
   * Regla de negocio (CxC · caja · destino = Préstamos): aplica el efectivo
   * recibido a las cuotas del plan de pago (cxcprestamospp), SIEMPRE desde la
   * cuota 1 pendiente en orden de `nrofila`. Una cuota se marca pagada SOLO si
   * el abono acumulado cubre su total (capital + interés + mora); si no alcanza
   * ni para la cuota 1, la caja queda guardada pero ninguna cuota se marca
   * (regla "guardar con aviso" aprobada por el usuario).
   *
   * - Los préstamos NO postean movimiento D al crearse (`createPrestamo`).
   *   Por decisión del usuario (13/10/2026) el desglose del abono se registra
   *   en `cxcmovimientos` con **tipomov='I'** (capital, interés y mora): los
   *   movimientos 'I' NO afectan el saldo del cliente (`getAntiguedadSaldos`
   *   los ignora), por lo que no se distorsiona la cuenta corriente y no hace
   *   falta un D parejo. El capital real del préstamo vive en
   *   `cxcprestamos.saldoactual`.
   *   Se emite UN evento `cxc.cobro.contabilizar` (PDA 3, idéntico al cobro de
   *   facturas de crédito) con el reparto aprobado por la UI.
   * - La UI calcula interés/mora por cuota con la MISMA regla de facturas
   *   (interés simple /360 con gracia) pero usando `prestamo.tasa` y
   *   `prestamo.moratorio`; la UI es la fuente de verdad (patrón interesUI).
   * - Idempotente: antes de re-aplicar, revierte las cuotas pagadas por ESTA
   *   caja (marcadas con `cxccajaId`), para que re-guardar no duplique.
   */
  /**
   * Snapshot en memoria del estado del préstamo ANTES de aplicar un cobro,
   * para la reversa idempotente al editar/anular una caja. En el modelo SIN
   * plan de pagos el saldo se muta directamente (no se recalcula desde filas),
   * así que hay que recordar el estado previo de ESTA caja. Clave: cxccajaId.
   */
  private readonly prestamoSnapshots = new Map<number, {
    saldoAnterior: number;
    fechaAnterior: Date | null;
    ultAnterior: number;
  }>();

  /**
   * Cuota pactada de un préstamo. Prefiere el valor persistido en
   * `cxcprestamos.vlrcuota`; si es nulo o 0, lo deriva de los términos
   * del préstamo (amortización francesa mensual):
   *   i   = tasa_interes_anual/100/12
   *   cuota = capitalneto × i / (1 − (1+i)^−cuotas)
   */
  private calcularVlrcuotaPactada(prestamo: CxcPrestamo): number {
    const r2 = (x: number) => Math.round(x * 100) / 100;
    // Preferir valor persistido
    const persistido = Number(prestamo.vlrcuota) || 0;
    if (persistido > 0) return r2(persistido);
    // Fallback: cálculo por fórmula francesa
    const capitalneto = Number(prestamo.capitalneto)
      || Math.max(0, (Number(prestamo.capital) || 0) - (Number(prestamo.prima) || 0));
    const cuotas = Number(prestamo.cuotas) || 0;
    const tasaMensual = (Number(prestamo.tasa) || 0) / 100 / 12;
    if (capitalneto <= 0 || cuotas <= 0) return 0;
    if (tasaMensual <= 0) return r2(capitalneto / cuotas);
    return r2(capitalneto * (tasaMensual / (1 - Math.pow(1 + tasaMensual, -cuotas))));
  }

  /**
   * Aplica un cobro a PRÉSTAMO con el modelo de INTERÉS SIMPLE sobre el saldo
   * total, sin plan de pagos (reemplaza la amortización francesa por cuotas):
   *  - ProximoPago  = fechaUltPago + diascuotas
   *  - FechaMaxima  = ProximoPago + gracia
   *  - interes/mora vía calcularInteresesFactura (misma regla que facturas:
   *    dentro de gracia no devenga interés; vencido cobra interés + mora)
   *  - abonoCapital = efectivo − (interes + mora)
   *  - saldoactual -= abonoCapital; fechaUltPago = hoy; ultcuotapagada += 1
   * Validación: el efectivo no puede ser menor a la cuota pactada (vlrcuota).
   */
  private async procesarAbonoPrestamo(
    cajaMae: CxccajaMae,
    empresaId: number,
    currentUser: string,
    _ui: { prestamoId?: number },
  ) {
    const r2 = (x: number) => Math.round(x * 100) / 100;
    const cxccajaId = cajaMae.cxccajaId;
    const prestamoId = Number(_ui?.prestamoId || cajaMae.prestamoId);
    if (!prestamoId) throw new BadRequestException('La caja de préstamo requiere prestamoId');

    const prestamo = await this.prestamoRepo.findOne({
      where: { prestamoId, empresaId } as FindOptionsWhere<CxcPrestamo>,
    });
    if (!prestamo) throw new NotFoundException(`Préstamo #${prestamoId} no encontrado`);
    if (prestamo.clienteId !== cajaMae.clienteId) {
      throw new BadRequestException('El préstamo no pertenece al cliente de la caja');
    }

    const dets = await this.cajaDetRepo.find({
      where: { cxccajaId, empresaId, sn_anulado: 'N' } as FindOptionsWhere<CxccajaDet>,
    });
    const efectivo = r2(dets.reduce((s, d) => s + (Number(d.importe) || 0), 0));
    const hoy = await this.fechaSistema.getFecha(empresaId);

    // 1) Idempotencia: si ESTA caja ya había aplicado, restaura el estado previo.
    const snap = this.prestamoSnapshots.get(cxccajaId);
    if (snap) {
      prestamo.saldoactual = snap.saldoAnterior as any;
      prestamo.fechaUltPago = snap.fechaAnterior as any;
      prestamo.ultcuotapagada = snap.ultAnterior;
    }

    const saldoAnterior = r2(
      Number(prestamo.saldoactual) || Number(prestamo.capitalneto) || Number(prestamo.capital) || 0,
    );
    const fechaBase = (prestamo.fechaUltPago ? new Date(prestamo.fechaUltPago) : null)
      ?? (prestamo.fechaEfectiva ? new Date(prestamo.fechaEfectiva) : new Date(hoy));
    const ultAnterior = Number(prestamo.ultcuotapagada) || 0;

    if (saldoAnterior <= 0) {
      return { cuotasPagadas: [] as number[], totalAplicado: 0, motivo: 'Préstamo sin saldo de capital' };
    }

    // 2) Cuota pactada e interés/mora devengados al día de hoy.
    const vlrcuota = this.calcularVlrcuotaPactada(prestamo);
    const calc = this.calcularInteresesPrestamo({
      saldo: saldoAnterior,
      tasaAnual: Number(prestamo.tasa) || 0,
      tasaMoratoria: Number(prestamo.moratorio) || 0,
      diasPlazo: Number(prestamo.diascuotas) || 0,
      diasGracia: Number(prestamo.gracia) || 0,
      vlrcuota,
      fechaUltAbono: fechaBase,
      hoy,
    });

    // 3) Procesar cuotas (cxcprestamospp) con lógica FIFO (más antigua primero):
    const cuotasPendientes = await this.prestamoPPRepo.find({
      where: { prestamoId, empresaId, sn_pagada: 'N', sn_anulada: 'N' } as FindOptionsWhere<CxcPrestamoPP>,
      order: { nrofila: 'ASC' },
    });

    let efectivoRestante = efectivo;
    let cuotasPagadasCount = 0;
    let capitalAbonadoCuotas = 0;

    for (const cuota of cuotasPendientes) {
      const valorCuota = Number(cuota.vlrcuota || (Number(cuota.capital) + Number(cuota.interes)) || 0);
      if (valorCuota <= 0) continue;

      if (efectivoRestante >= valorCuota - 0.01) {
        cuota.sn_pagada = 'S';
        cuota.cxccajaId = cxccajaId;
        cuota.usuarioUpdated = currentUser;
        cuota.fechaUpdated = hoy;
        await this.prestamoPPRepo.save(cuota);
        efectivoRestante = r2(efectivoRestante - valorCuota);
        cuotasPagadasCount++;
        capitalAbonadoCuotas += Number(cuota.capital) || 0;
      } else {
        cuota.sn_pagada = 'N';
        await this.prestamoPPRepo.save(cuota);
        break;
      }
    }

    const abonoCapital = r2(Math.max(0, capitalAbonadoCuotas > 0 ? capitalAbonadoCuotas : (efectivo - calc.totalCargos)));
    const saldoNuevo = r2(Math.max(0, saldoAnterior - abonoCapital));
    const nuevoUltPagada = ultAnterior + cuotasPagadasCount;

    // 3) Aplicar al préstamo: descuenta capital, resetea fechaUltPago, avanza ultcuotapagada
    await this.prestamoRepo.createQueryBuilder()
      .update(CxcPrestamo)
      .set({
        saldoactual: saldoNuevo as any,
        fechaUltPago: hoy,
        ultcuotapagada: nuevoUltPagada,
        usuarioUpdated: currentUser,
        fechaUpdated: hoy,
      } as any)
      .where('prestamoId = :pid AND empresaId = :empresaId', { pid: prestamoId, empresaId })
      .execute();

    this.prestamoSnapshots.set(cxccajaId, { saldoAnterior, fechaAnterior: fechaBase, ultAnterior });

    // 4) Desglose del abono en cxcmovimientos (patrón idéntico al cobro de
    //    facturas de crédito):
    //    - Capital → tipomov='C' (crédito, 13/10/2026)
    //    - Interés y mora → tipomov='I' (ingreso)
    //    El préstamo NO genera 'D' porque su saldo vive en cxcprestamos.saldoactual.
    const cliente = await this.findCliente(cajaMae.clienteId, empresaId);
    const nroreferencia = String(prestamo.nroprestamo);
    const marca = `Caja #${cxccajaId}`;
    const fecharegistro = await this.fechaSistema.obtenerFechaRegistro(currentUser, empresaId);
    const Idsucursal = cajaMae.Idsucursal || 1;

    // Limpieza idempotente: borra los movimientos que ESTA caja había generado.
    await this.movimientoRepo.createQueryBuilder()
      .delete()
      .where('clienteId = :clienteId AND empresaId = :empresaId AND nroreferencia = :nro', {
        clienteId: cajaMae.clienteId, empresaId, nro: nroreferencia,
      })
      .andWhere('concepto LIKE :marca', { marca: `%${marca}%` })
      .andWhere('sn_doc_anulado = :noanulado', { noanulado: 'N' })
      .execute();

    // Reparto cargos → capital (mismo cap que facturas: interés antes que mora).
    const interesCobrado = r2(Math.min(calc.interes, efectivo));
    const moraCobrada = r2(Math.min(calc.mora, r2(efectivo - interesCobrado)));
    const capitalAbonado = r2(Math.max(0, abonoCapital)); // ya = efectivo − cargos

    const creados: CxcMovimiento[] = [];
    const nuevoMov = async (documentoId: number, importe: number, concepto: string, tipomov: 'C' | 'I') => {
      if (r2(importe) <= 0) return;
      // Correlativo: siempre secuencia 'C' (no existe nro_ingreso); el
      // campo tipomov del movimiento sí guarda 'C' o 'I' según el caso.
      const nromovimiento = await this.generarNroMovimiento(empresaId, 'C', currentUser);
      const mov = this.movimientoRepo.create({
        fecharegistro,
        nromovimiento,
        clienteId: cajaMae.clienteId,
        nrocliente: cliente.nrocliente,
        moduloId: 4, // CxC
        documentoId, // 13=PPR capital, 11=ICS interés, 12=ICM mora
        tipomov,
        nroreferencia,
        factordecambio: 1,
        importe: r2(importe),
        concepto,
        sn_cotabilizada: 'N',
        sn_doc_anulado: 'N',
        empresaId,
        Idsucursal,
        usuarioCreated: currentUser,
      });
      creados.push(await this.movimientoRepo.save(mov));
    };

    await nuevoMov(13, capitalAbonado, `Abono a capital · ${marca} - ${cajaMae.concepto || ''}`.trim(), 'C');
    await nuevoMov(11, interesCobrado, `Interés devengado cobrado · ${marca}`.trim(), 'I');
    await nuevoMov(12, moraCobrada, `Interés moratorio cobrado · ${marca}`.trim(), 'I');

    // 5) UN solo evento de contabilización (PDA 3, idéntico al cobro de
    //    facturas de crédito). Sin facturaId → se omite la bitácora posfacmov.
    if (creados.length > 0) {
      this.eventEmitter.emit('cxc.cobro.contabilizar', {
        abonoCapital: capitalAbonado,
        interes: interesCobrado,
        mora: moraCobrada,
        empresaId,
        Idsucursal,
        nroreferencia,
        nrocliente: cliente.nrocliente,
        concepto: `Abono préstamo ${nroreferencia} · ${marca} - ${cajaMae.concepto || ''}`.trim(),
        movimientoIds: creados.map((m) => m.clienteMovId),
        currentUser,
        cajaMae,
      });
    }

    return {
      cuotasPagadas: [ultAnterior + 1],
      totalAplicado: efectivo,
      interes: calc.interes,
      mora: calc.mora,
      interesCobrado,
      moraCobrada,
      abonoCapital,
      saldoNuevo,
      vlrcuota,
      diasInteres: calc.diasInteres,
      diasMora: calc.diasMora,
      movimientos: creados.length,
    };
  }

  /**
   * Revierte un cobro a PRÉSTAMO al anular su caja: restaura el estado previo
   * desde el snapshot en memoria (modelo sin plan de pagos). Si no hay snapshot
   * (reinicio del proceso), deja el préstamo como está (limitación documentada).
   */
  private async revertirAbonoPrestamo(
    prestamoId: number,
    empresaId: number,
    cxccajaId: number,
    currentUser: string,
    now: Date,
  ) {
    await this.prestamoPPRepo.createQueryBuilder()
      .update(CxcPrestamoPP)
      .set({ sn_pagada: 'N', cxccajaId: null, usuarioUpdated: currentUser, fechaUpdated: now } as any)
      .where('cxccajaId = :cxccajaId AND empresaId = :empresaId', { cxccajaId, empresaId })
      .execute();

    const snap = this.prestamoSnapshots.get(cxccajaId);
    if (!snap) return;
    await this.prestamoRepo.createQueryBuilder()
      .update(CxcPrestamo)
      .set({
        saldoactual: snap.saldoAnterior as any,
        fechaUltPago: (snap.fechaAnterior ?? null) as any,
        ultcuotapagada: snap.ultAnterior,
        usuarioUpdated: currentUser,
        fechaUpdated: now,
      } as any)
      .where('prestamoId = :pid AND empresaId = :empresaId', { pid: prestamoId, empresaId })
      .execute();
    this.prestamoSnapshots.delete(cxccajaId);
  }

  /** Saldo actual de una factura = débitos (D) − créditos (C) por nroreferencia.
   *  Los movimientos tipomov='I' (interés/mora) NO afectan el saldo del cliente. */
  private async calcularSaldoFactura(clienteId: number, empresaId: number, nroreferencia: string): Promise<number> {
    const movs = await this.movimientoRepo.find({
      where: { clienteId, empresaId, nroreferencia, sn_doc_anulado: 'N' } as FindOptionsWhere<CxcMovimiento>,
    });
    return movs.reduce((s, m) => {
      const imp = Number(m.importe) || 0;
      if (m.tipomov === 'D') return s + imp;
      if (m.tipomov === 'C') return s - imp;
      return s; // tipomov='I' → sin efecto sobre el saldo
    }, 0);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ANULACIÓN DE CAJA
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Anula una caja (cobro) completa: maestro, detalles y movimientos CxC generados.
   *
   * Reglas:
   * - No se puede anular una caja ya anulada.
   * - Se marcan `sn_anulado='S'` en mae y det con `fec_anulacion`.
   * - Se marcan `sn_doc_anulado='S'` los movimientos CxC generados por ESTA caja
   *   (identificados por la marca `Caja #id` en el concepto).
   * - Si era factura de crédito, NO se revierte `fechaultabono` automáticamente
   *   (queda pendiente de recálculo en el próximo cobro).
   */
  async anularCaja(cxccajaId: number, empresaId: number, currentUser: string) {
    const cajaMae = await this.cajaMaeRepo.findOne({
      where: { cxccajaId, empresaId } as FindOptionsWhere<CxccajaMae>,
    });
    if (!cajaMae) throw new NotFoundException(`Caja #${cxccajaId} no encontrada`);
    if (cajaMae.sn_anulado === 'S') throw new BadRequestException('La caja ya está anulada');

    const now = await this.fechaSistema.getFecha(empresaId);

    // 1. Anular maestro
    cajaMae.sn_anulado = 'S';
    cajaMae.fec_anulacion = now;
    cajaMae.usuarioUpdated = currentUser;
    cajaMae.fechaUpdated = now;
    await this.cajaMaeRepo.save(cajaMae);

    // 2. Anular detalles (bulk update)
    await this.cajaDetRepo.createQueryBuilder()
      .update(CxccajaDet)
      .set({ sn_anulado: 'S', fec_anulacion: now, usuarioUpdated: currentUser, fechaUpdated: now } as any)
      .where('cxccajaId = :id AND empresaId = :empresaId', { id: cxccajaId, empresaId })
      .execute();

    // 3. Anular movimientos CxC generados por esta caja (marca en concepto).
    //    Para cajas de PRÉSTAMO el frontend no envía nrodocumento → se usa el
    //    nroprestamo (los movimientos del desglose se registran con esa referencia).
    let nroRefMov: string | null = cajaMae.nrodocumento ?? null;
    if ((!nroRefMov || nroRefMov === '') && Number(cajaMae.destinoabono) === 2 && cajaMae.prestamoId) {
      const prestamo = await this.prestamoRepo.findOne({
        where: { prestamoId: cajaMae.prestamoId, empresaId } as FindOptionsWhere<CxcPrestamo>,
      });
      nroRefMov = prestamo?.nroprestamo ?? null;
    }
    await this.movimientoRepo.createQueryBuilder()
      .update(CxcMovimiento)
      .set({ sn_doc_anulado: 'S', fec_anulacion: now, usuarioUpdated: currentUser, fechaUpdated: now } as any)
      .where('clienteId = :clienteId AND empresaId = :empresaId AND nroreferencia = :nro', {
        clienteId: cajaMae.clienteId, empresaId, nro: nroRefMov,
      })
      .andWhere('concepto LIKE :marca', { marca: `%Caja #${cxccajaId}%` })
      .andWhere('sn_doc_anulado = :noanulado', { noanulado: 'N' })
      .execute();

    // 4. Revertir cobro a préstamo (destino = Préstamos): restaura el estado
    //    previo del préstamo (saldo/fechaUltPago/ultcuotapagada) desde el snapshot.
    if (Number(cajaMae.destinoabono) === 2 && cajaMae.prestamoId) {
      await this.revertirAbonoPrestamo(cajaMae.prestamoId, empresaId, cxccajaId, currentUser, now);
    }

    this.eventEmitter.emit('cxc.caja.anulada', { cxccajaId, empresaId, currentUser });

    return { ok: true, mensaje: `Caja #${cxccajaId} anulada correctamente` };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RECIBO DE CAJA (impresión)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Devuelve los datos completos de una caja para imprimir el recibo:
   * maestro, detalles (con labels de forma de pago y tarjeta), cliente,
   * tipo de documento fiscal y datos de la empresa.
   */
  async findCajaRecibo(cxccajaId: number, empresaId: number) {
    const cajaMae = await this.cajaMaeRepo.findOne({
      where: { cxccajaId, empresaId } as FindOptionsWhere<CxccajaMae>,
    });
    if (!cajaMae) throw new NotFoundException(`Caja #${cxccajaId} no encontrada`);

    const detalles = await this.cajaDetRepo.find({
      where: { cxccajaId, empresaId } as FindOptionsWhere<CxccajaDet>,
    });

    const cliente = await this.findCliente(cajaMae.clienteId, empresaId);

    // Empresa + datos fiscales
    const empresa = await this.empresaRepo.findOne({ where: { empresaId } });
    const empresaDet = await this.empresaDetRepo.find({
      where: { empresaId, sn_activo: 'S' } as FindOptionsWhere<TempresasDet>,
    });
    const rtn = empresaDet.find((d) => d.tipo === 'RTN')?.descripcion || null;
    const telefono = empresaDet.find((d) => d.tipo === 'TELEFONO')?.descripcion || null;
    const direccion = empresaDet.find((d) => d.tipo === 'DIRECCION')?.descripcion || null;

    // Tipo de documento fiscal (label)
    const tipoDoc = await this.tipoDocRepo.findOne({
      where: { tipodocumentofiscalId: cajaMae.documentoId } as FindOptionsWhere<TCoTipoDocumentoFiscal>,
    });

    // Labels de formas de pago
    const fpIds = [...new Set(detalles.map((d) => d.formapagoId).filter(Boolean))];
    const fps = fpIds.length
      ? await this.formaPagoRepo.find({ where: { formapagoId: In(fpIds) } as FindOptionsWhere<TtipoFormaPago> })
      : [];
    const fpMap = new Map(fps.map((f) => [f.formapagoId, f.descripcion]));

    // Labels de tarjetas de crédito
    const tarjIds = [...new Set(detalles.map((d) => d.tarjetacreditoId).filter(Boolean))];
    const tarjs = tarjIds.length
      ? await this.tarjetaRepo.find({ where: { tarjetacreditoId: In(tarjIds) } as FindOptionsWhere<TtipoTarjetaCredito> })
      : [];
    const tarjMap = new Map(tarjs.map((t) => [t.tarjetacreditoId, t.descripcion]));

    const r2 = (x: number) => Math.round(x * 100) / 100;
    const totalPagos = r2(detalles.reduce((s, d) => s + (Number(d.importe) || 0), 0));

    // Destino = Préstamos: préstamo y cuotas pagadas por ESTA caja (para el recibo).
    let prestamoInfo: any = null;
    if (Number(cajaMae.destinoabono) === 2 && cajaMae.prestamoId) {
      const prestamo = await this.prestamoRepo.findOne({
        where: { prestamoId: cajaMae.prestamoId, empresaId } as FindOptionsWhere<CxcPrestamo>,
      });
      const cuotasPagadas = await this.prestamoPPRepo.find({
        where: { cxccajaId, empresaId } as FindOptionsWhere<CxcPrestamoPP>,
        order: { nrofila: 'ASC' },
      });
      if (prestamo) {
        prestamoInfo = {
          prestamoId: prestamo.prestamoId,
          nroprestamo: prestamo.nroprestamo,
          capital: Number(prestamo.capital) || 0,
          tasa: Number(prestamo.tasa) || 0,
          cuotas: cuotasPagadas.map((c) => ({
            nrofila: c.nrofila,
            capital: Number(c.capital) || 0,
            mora: Number(c.mora) || 0,
          })),
        };
      }
    }

    return {
      caja: cajaMae,
      detalles: detalles.map((d) => ({
        cxccajadetId: d.cxccajadetId,
        formapagoId: d.formapagoId,
        formaPago: fpMap.get(d.formapagoId) || `FP#${d.formapagoId}`,
        importe: Number(d.importe) || 0,
        tarjetacreditoId: d.tarjetacreditoId,
        tarjeta: d.tarjetacreditoId ? (tarjMap.get(d.tarjetacreditoId) || `TARJ#${d.tarjetacreditoId}`) : null,
        nrotarjeta: d.nrotarjeta || null,
        nroautorizacion: d.nroautorizacion || null,
        sn_anulado: d.sn_anulado,
      })),
      cliente: {
        clienteId: cliente.clienteId,
        nrocliente: cliente.nrocliente,
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        razonsocial: cliente.razonsocial,
        dni: cliente.dni,
        rtn: cliente.rtn,
      },
      tipoDocumento: tipoDoc?.descripcion || null,
      prestamo: prestamoInfo,
      totalPagos,
      empresa: {
        nombre: empresa?.descripcion || 'EMPRESA',
        rtn,
        telefono,
        direccion,
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDICIÓN DE CAJA
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Rendición de caja: totales por forma de pago de todos los cobros
   * de una fecha específica (no anulados).
   */
  async findRendicionCaja(fecha: string, empresaId: number) {
    // Parsear fecha (acepta 'YYYY-MM-DD')
    const [anio, mes, dia] = fecha.split('-').map(Number);
    if (!anio || !mes || !dia) throw new BadRequestException('Fecha inválida. Use el formato YYYY-MM-DD');

    const fechaInicio = new Date(anio, mes - 1, dia, 0, 0, 0, 0);
    const fechaFin = new Date(anio, mes - 1, dia, 23, 59, 59, 999);

    // Cajas no anuladas del día
    const cajas = await this.cajaMaeRepo.createQueryBuilder('c')
      .where('c.empresaId = :empresaId', { empresaId })
      .andWhere('c.sn_anulado = :noanulado', { noanulado: 'N' })
      .andWhere('c.fecharegistro BETWEEN :inicio AND :fin', { inicio: fechaInicio, fin: fechaFin })
      .orderBy('c.fecharegistro', 'ASC')
      .getMany();

    if (!cajas.length) {
      return { fecha, empresaId, cajas: [], resumen: [], totalGeneral: 0, totalCobros: 0 };
    }

    const cajaIds = cajas.map((c) => c.cxccajaId);

    // Detalles de esas cajas (no anulados)
    const dets = await this.cajaDetRepo.find({
      where: { cxccajaId: In(cajaIds), empresaId, sn_anulado: 'N' } as FindOptionsWhere<CxccajaDet>,
    });

    // Labels de formas de pago
    const fpIds = [...new Set(dets.map((d) => d.formapagoId).filter(Boolean))];
    const fps = fpIds.length
      ? await this.formaPagoRepo.find({ where: { formapagoId: In(fpIds) } as FindOptionsWhere<TtipoFormaPago> })
      : [];
    const fpMap = new Map(fps.map((f) => [f.formapagoId, f.descripcion]));

    // Labels de tarjetas
    const tarjIds = [...new Set(dets.map((d) => d.tarjetacreditoId).filter(Boolean))];
    const tarjs = tarjIds.length
      ? await this.tarjetaRepo.find({ where: { tarjetacreditoId: In(tarjIds) } as FindOptionsWhere<TtipoTarjetaCredito> })
      : [];
    const tarjMap = new Map(tarjs.map((t) => [t.tarjetacreditoId, t.descripcion]));

    const r2 = (x: number) => Math.round(x * 100) / 100;

    // Resumen por forma de pago
    const resumenMap = new Map<number, { formapagoId: number; formaPago: string; cantidad: number; total: number }>();
    for (const d of dets) {
      const imp = Number(d.importe) || 0;
      const existing = resumenMap.get(d.formapagoId);
      if (existing) {
        existing.cantidad += 1;
        existing.total = r2(existing.total + imp);
      } else {
        resumenMap.set(d.formapagoId, {
          formapagoId: d.formapagoId,
          formaPago: fpMap.get(d.formapagoId) || `FP#${d.formapagoId}`,
          cantidad: 1,
          total: r2(imp),
        });
      }
    }

    // Detalle de cajas con sus formas de pago
    const cajaIdsMap = new Map<number, any[]>();
    for (const d of dets) {
      const arr = cajaIdsMap.get(d.cxccajaId) || [];
      arr.push({
        cxccajadetId: d.cxccajadetId,
        formapagoId: d.formapagoId,
        formaPago: fpMap.get(d.formapagoId) || `FP#${d.formapagoId}`,
        importe: Number(d.importe) || 0,
        tarjeta: d.tarjetacreditoId ? (tarjMap.get(d.tarjetacreditoId) || null) : null,
        nrotarjeta: d.nrotarjeta || null,
        nroautorizacion: d.nroautorizacion || null,
      });
      cajaIdsMap.set(d.cxccajaId, arr);
    }

    const cajasDetalladas = cajas.map((c) => ({
      ...c,
      pagos: cajaIdsMap.get(c.cxccajaId) || [],
      totalPagos: r2((cajaIdsMap.get(c.cxccajaId) || []).reduce((s, p) => s + (Number(p.importe) || 0), 0)),
    }));

    const resumen = [...resumenMap.values()].sort((a, b) => b.total - a.total);
    const totalGeneral = r2(resumen.reduce((s, r) => s + r.total, 0));

    return {
      fecha,
      empresaId,
      cajas: cajasDetalladas,
      resumen,
      totalGeneral,
      totalCobros: cajas.length,
    };
  }

  async findAllMovimientos(empresaId: number) {
    return this.findAllByEmpresa(this.movimientoRepo, empresaId);
  }

  async findMovimientosByCliente(clienteId: number, empresaId: number) {
    return this.movimientoRepo
      .createQueryBuilder('mov')
      .leftJoinAndSelect('mov.modulo', 'modulo')
      .where('mov.clienteId = :clienteId AND mov.empresaId = :empresaId', { clienteId, empresaId })
      .orderBy('mov.fecharegistro', 'ASC')
      .getMany();
  }

  async findMovimiento(clienteMovId: number, empresaId: number) {
    return this.findOneById(this.movimientoRepo, 'clienteMovId', clienteMovId, empresaId, 'Movimiento');
  }

  async createMovimiento(dto: CreateCxcMovimientoDto, currentUser: string) {
    // La fecha que se valida y la que se graba son la MISMA que impone el
    // backend (reglas 1 y 4): el dto ya no aporta fecharegistro.
    const fecha = await this.fechaSistema.obtenerFechaRegistro(currentUser, dto.empresaId);
    await this.contabilidadService.validarPeriodoAbierto(dto.empresaId, fecha);

    // Registro MANUAL (sn_doc_manual='S', moduloId=4): la nroreferencia es
    // libre pero OBLIGATORIA.
    //
    // REGLA DE UNICIDAD (correccion 15/10/2026): la referencia NO se exige
    // unica en esta pantalla, porque lo que se captura aqui son Notas de
    // Debito/Credito (aplicaciones) y pueden repetir el mismo numero de
    // factura, prestamo o ticket varias veces: multiples NC sobre la misma
    // factura, ND acumulativas, filas de interes de un prestamo, etc.
    // La referencia SI debe ser unica cuando el movimiento ES el documento
    // origen (factura, prestamo, ticket) y eso se controla al CREAR ese
    // documento en su modulo (facturacion, prestamos), no aqui.
    if (dto.sn_doc_manual === 'S') {
      const ref = (dto.nroreferencia ?? '').trim();
      if (!ref) {
        throw new BadRequestException('En un documento manual el Nro. Referencia es obligatorio');
      }
    }


    // Nota de Debito/Credito (tipomov D/C): solo se aplican sobre documentos
    // fiscales que lo admiten. Los intereses (simple/moratorio) y los tipos
    // no listados NO pueden recibir ND/NC (lista de abreviaturas autorizadas).
    const DOCS_APLICABLES_ND_NC = ['FAC', 'PPR', 'TCK', 'RHP', 'BDC', 'CDD', 'OCA'];
    if (dto.tipomov === 'D' || dto.tipomov === 'C') {
      const doc = await this.tipoDocRepo.findOne({ where: { tipodocumentofiscalId: dto.documentoId } });
      if (!doc || !DOCS_APLICABLES_ND_NC.includes(doc.abreviatura)) {
        throw new BadRequestException(
          `El tipo de documento fiscal "${doc?.descripcion ?? dto.documentoId}" no admite aplicar Nota de Debito/Credito`
        );
      }
    }

    const saved = await this.createEntity(this.movimientoRepo, dto, currentUser);
    // Emitir evento para contabilización automática (nota débito/crédito)
    if (saved && dto.tipomov && (dto.tipomov === 'D' || dto.tipomov === 'C')) {
      this.eventEmitter.emit('cxc.movimiento.creado', { movimiento: saved, origen: 'manual' });
    }
    return saved;
  }

  async updateMovimiento(clienteMovId: number, empresaId: number, dto: UpdateCxcMovimientoDto, currentUser: string) {
    return this.updateEntity(this.movimientoRepo, 'clienteMovId', clienteMovId, empresaId, dto, currentUser, 'Movimiento');
  }

  /**
   * Anula un movimiento CxC desde la pantalla /cxc/movimientos.
   *
   * Reglas de negocio:
   * 1. Solo movimientos MANUALES (sn_doc_manual='S'). Los automáticos
   *    (factura, caja, préstamo, interés) se anulan desde su documento
   *    de origen: anular el documento revierte sus movimientos.
   * 2. Sin partida contable (partidaId NULL): si la partida ya asentó el
   *    movimiento se requiere reversa contable, no este endpoint.
   *    (Se evalúa `partidaId`, no `sn_cotabilizada`: esta última es 'S' por
   *    default de BD aunque la contabilización no haya ocurrido.)
   * 3. No re-anulables (409).
   * 4. `fec_anulacion` la estampa el backend con fechaSistema (nunca el
   *    cliente); un anulado deja de contar como contabilizado.
   */
  async anularMovimiento(clienteMovId: number, empresaId: number, currentUser: string) {
    const mov = await this.findOneById(
      this.movimientoRepo, 'clienteMovId', clienteMovId, empresaId, 'Movimiento',
    );

    if (mov.sn_doc_anulado === 'S') {
      throw new ConflictException('El movimiento ya esta anulado');
    }
    if (mov.sn_doc_manual !== 'S') {
      throw new BadRequestException(
        'Movimiento automatico: anule el documento de origen (factura, caja o prestamo)',
      );
    }
    if (mov.partidaId != null) {
      throw new BadRequestException(
        'El movimiento tiene partida contable: requiere reversa de la partida',
      );
    }

    mov.sn_doc_anulado = 'S';
    mov.sn_cotabilizada = 'N';
    mov.fec_anulacion = await this.fechaSistema.obtenerFechaRegistro(currentUser, empresaId);
    mov.usuarioUpdated = currentUser;
    mov.fechaUpdated = await this.fechaSistema.getFecha(empresaId);
    return this.movimientoRepo.save(mov);
  }

  async findAllHistoro(empresaId: number) {
    return this.findAllByEmpresa(this.historoRepo, empresaId);
  }

  /**
   * Consulta histórico de movimientos con filtros por DNI, cliente y rango de fechas
   */
  async findHistoricoConFiltros(
    empresaId: number,
    dni?: string,
    cliente?: string,
    fechaDesde?: string,
    fechaHasta?: string,
	documentoId?: string, 
  ) {
    const qb = this.movimientoRepo.createQueryBuilder('a')
      .select('a.clienteId', 'clienteId')
      .addSelect('a.fecharegistro', 'fecharegistro')
      .addSelect('a.nrocliente', 'nrocliente')
      .addSelect('b.dni', 'dni')
      .addSelect('b.razonsocial', 'cliente')
      .addSelect('c.descripcion', 'modulo')
      .addSelect('d.abreviatura', 'abreviatura')
      .addSelect('a.nroreferencia', 'nroreferencia')
      .addSelect('a.tipomov', 'tipomov')
      .addSelect('a.importe', 'importe')
      .addSelect('a.concepto', 'concepto')
      .addSelect('a.sn_doc_anulado', 'sn_doc_anulado')
      .addSelect('a.sn_cotabilizada', 'sn_cotabilizada')
      .addSelect('a.clienteMovId', 'clienteMovId')
      .addSelect('a.documentoId', 'documentoId')
      .innerJoin('cxcclientes', 'b', 'b.clienteId = a.clienteId')
      .innerJoin('tmodulos', 'c', 'c.moduloId = a.moduloId')
      .innerJoin('tcotipodocumentofiscal', 'd', 'd.tipodocumentofiscalId = a.documentoId')
      .where('a.empresaId = :empresaId', { empresaId })
      .orderBy('a.fecharegistro', 'DESC')
      .addOrderBy('a.clienteMovId', 'DESC');

    if (dni && dni.trim()) {
      qb.andWhere('b.dni LIKE :dni', { dni: `%${dni.trim()}%` });
    }

    if (cliente && cliente.trim()) {
      qb.andWhere('(b.razonsocial LIKE :cliente OR b.nombres LIKE :cliente OR b.apellidos LIKE :cliente)', { 
        cliente: `%${cliente.trim()}%` 
      });
    }

    if (fechaDesde && fechaDesde.trim()) {
      qb.andWhere('a.fecharegistro >= :fechaDesde', { fechaDesde: `${fechaDesde.trim()} 00:00:00` });
    }

    if (fechaHasta && fechaHasta.trim()) {
      qb.andWhere('a.fecharegistro <= :fechaHasta', { fechaHasta: `${fechaHasta.trim()} 23:59:59` });
    }

    // 20261015 ARFM, FILTRO POR TIPO DE DOCUMENTO
    if (documentoId && documentoId.trim()) {
       qb.andWhere('a.documentoId = :documentoId', { documentoId: `${documentoId.trim()}`});
    }

    return qb.getRawMany();
  }

  async findHistoricoByCliente(clienteId: number, empresaId: number) {
    return this.historoRepo.find({
      where: { clienteId, empresaId } as FindOptionsWhere<CxcHistoro>,
      order: { historicoclienteId: 'DESC' },
    });
  }

  async findHistoro(historicoclienteId: number, empresaId: number) {
    return this.findOneById(this.historoRepo, 'historicoclienteId', historicoclienteId, empresaId, 'Historico Cliente');
  }

  async createHistoro(dto: any, currentUser: string) {
    return this.createEntity(this.historoRepo, dto, currentUser);
  }

  async updateHistoro(historicoclienteId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.historoRepo, 'historicoclienteId', historicoclienteId, empresaId, dto, currentUser, 'Historico Cliente');
  }

  async findAllSalFav(empresaId: number) {
    return this.findAllByEmpresa(this.salFavRepo, empresaId);
  }

  async findSalFav(cxcsalfavId: number, empresaId: number) {
    return this.findOneById(this.salFavRepo, 'cxcsalfavId', cxcsalfavId, empresaId, 'Saldo Favor');
  }

  async createSalFav(dto: any, currentUser: string) {
    return this.createEntity(this.salFavRepo, dto, currentUser);
  }

  async updateSalFav(cxcsalfavId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.salFavRepo, 'cxcsalfavId', cxcsalfavId, empresaId, dto, currentUser, 'Saldo Favor');
  }

  async findAllDiasCobro(empresaId: number) {
    return this.findAllByEmpresa(this.diasCobroRepo, empresaId);
  }

  async findDiasCobro(tdiascobrosId: number, empresaId: number) {
    return this.findOneById(this.diasCobroRepo, 'tdiascobrosId', tdiascobrosId, empresaId, 'Dias Cobro');
  }

  async createDiasCobro(dto: any, currentUser: string) {
    return this.createEntity(this.diasCobroRepo, dto, currentUser);
  }

  async updateDiasCobro(tdiascobrosId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.diasCobroRepo, 'tdiascobrosId', tdiascobrosId, empresaId, dto, currentUser, 'Dias Cobro');
  }

  async findAllPrestamos(empresaId: number) {
    return this.findAllByEmpresa(this.prestamoRepo, empresaId);
  }

  async findPrestamosByCliente(clienteId: number, empresaId: number) {
    return this.prestamoRepo.find({
      where: { clienteId, empresaId } as FindOptionsWhere<CxcPrestamo>,
      order: { fecharegistro: 'DESC' },
    });
  }

  async findPrestamo(prestamoId: number, empresaId: number) {
    return this.findOneById(this.prestamoRepo, 'prestamoId', prestamoId, empresaId, 'Prestamo');
  }

  async createPrestamo(dto: CreateCxcPrestamoDto, currentUser: string) {
    // Correlativo atómico nroprestamo (ttipoparametros) — solo si no trae número propio
    const payload: any = { ...dto };
    if (!payload.nroprestamo) {
      payload.nroprestamo = await this.correlativos.siguienteString('nroprestamo', dto.empresaId, currentUser, 6);
    }

    // ── Reglas de negocio (11/10/2026) ──
    // capital    = importe solicitado
    // prima      = aporte del cliente que rebaja el monto
    // capitalneto = capital - prima (recalculado SIEMPRE en el servidor)
    const capital = Number(payload.capital) || 0;
    const prima = Number(payload.prima) || 0;
    payload.capital = capital;
    payload.prima = prima;
    payload.capitalneto = Math.round((capital - prima) * 100) / 100;

    // Fechas de control:
    // - fecha_aprobacion = fecha de aprobación (default = fecha del sistema)
    // - fechaEfectiva    = fecha de la 1er cuota = fecha_aprobacion + 30 días
    // - fechaUltPago     = al abrir el préstamo, igual a fechaEfectiva
    const fechaHoy = await this.fechaSistema.obtenerFechaRegistro(currentUser, dto.empresaId);
    const fechaAprob = payload.fecha_aprobacion ? new Date(payload.fecha_aprobacion) : new Date(fechaHoy);
    const fechaEfectiva = new Date(fechaAprob);
    fechaEfectiva.setDate(fechaEfectiva.getDate() + 30);
    payload.fecha_aprobacion = fechaAprob;
    payload.fechaEfectiva = fechaEfectiva;
    payload.fechaUltPago = fechaEfectiva;

    // saldoactual = capital neto pendiente (las cuotas lo reducen al cobrar)
    payload.saldoactual = payload.capitalneto;
    // cxcprestamos.Idsucursal es NOT NULL con FK a tsucursal — fallback 1 (MATRIZ)
    payload.Idsucursal = payload.Idsucursal ?? 1;
    return this.createEntity(this.prestamoRepo, payload, currentUser);
  }

  async updatePrestamo(prestamoId: number, empresaId: number, dto: UpdateCxcPrestamoDto, currentUser: string) {
    return this.updateEntity(this.prestamoRepo, 'prestamoId', prestamoId, empresaId, dto, currentUser, 'Prestamo');
  }

  async removePrestamo(prestamoId: number, empresaId: number) {
    return this.softDelete(this.prestamoRepo, 'prestamoId', prestamoId, empresaId, 'Prestamo');
  }

  // ── Flujo de estados del préstamo ─────────────────────────────────
  // Generar plan → Pre-aprobado → Aprobado → Contabilizado

  /**
   * Pre-aproba un préstamo: marca sn_preaprobado='S' y genera el
   * nroprestamo si está vacío. Solo aplica a préstamos nuevos (sin
   * pre-aprobar ni aprobar).
   */
  async preaprobarPrestamo(prestamoId: number, empresaId: number, currentUser: string) {
    const prestamo = await this.findOneById(this.prestamoRepo, 'prestamoId', prestamoId, empresaId, 'Préstamo');
    if (prestamo.sn_preaprobado === 'S' || prestamo.sn_aprobado === 'S') {
      throw new BadRequestException('El préstamo ya fue pre-aprobado o aprobado');
    }
    const hoy = await this.fechaSistema.getFecha(empresaId);
    const nroprestamo = prestamo.nroprestamo || await this.generarNroprestamo(empresaId, currentUser);
    await this.prestamoRepo.createQueryBuilder()
      .update(CxcPrestamo)
      .set({
        sn_preaprobado: 'S',
        nroprestamo,
        usuarioUpdated: currentUser,
        fechaUpdated: hoy,
      } as any)
      .where('prestamoId = :pid AND empresaId = :empresaId', { pid: prestamoId, empresaId })
      .execute();
    return this.findPrestamo(prestamoId, empresaId);
  }

  /**
   * Aprueba un préstamo: marca sn_aprobado='S'. Solo aplica a préstamos
   * pre-aprobados. Genera nroprestamo si no lo tiene.
   */
  async aprobarPrestamo(prestamoId: number, empresaId: number, currentUser: string) {
    const prestamo = await this.findOneById(this.prestamoRepo, 'prestamoId', prestamoId, empresaId, 'Préstamo');
    if (prestamo.sn_preaprobado !== 'S') {
      throw new BadRequestException('El préstamo debe estar pre-aprobado antes de aprobarlo');
    }
    if (prestamo.sn_aprobado === 'S') {
      throw new BadRequestException('El préstamo ya fue aprobado');
    }
    const hoy = await this.fechaSistema.getFecha(empresaId);
    const nroprestamo = prestamo.nroprestamo || await this.generarNroprestamo(empresaId, currentUser);
    await this.prestamoRepo.createQueryBuilder()
      .update(CxcPrestamo)
      .set({
        sn_aprobado: 'S',
        nroprestamo,
        usuarioUpdated: currentUser,
        fechaUpdated: hoy,
      } as any)
      .where('prestamoId = :pid AND empresaId = :empresaId', { pid: prestamoId, empresaId })
      .execute();
    return this.findPrestamo(prestamoId, empresaId);
  }

  /**
   * Contabiliza un préstamo aprobado:
   * 1. Genera partida contable con plantilla PDA 20 (apertura de préstamos):
   *    Débito préstamo / Crédito bancos.
   * 2. Registra movimiento D en cxcmovimientos por el capital neto
   *    (concepto 'Desembolso préstamo', ref = nroprestamo).
   */
  async contabilizarPrestamo(prestamoId: number, empresaId: number, currentUser: string) {
    const prestamo = await this.findOneById(this.prestamoRepo, 'prestamoId', prestamoId, empresaId, 'Préstamo');
    if (prestamo.sn_aprobado !== 'S') {
      throw new BadRequestException('El préstamo debe estar aprobado antes de contabilizarlo');
    }
    if (prestamo.sn_contabilizado === 'S') {
      throw new BadRequestException('El préstamo ya fue contabilizado');
    }
    const nroprestamo = prestamo.nroprestamo;
    if (!nroprestamo) {
      throw new BadRequestException('El préstamo no tiene número asignado');
    }
    const capitalneto = Number(prestamo.capitalneto) || Math.max(0, (Number(prestamo.capital) || 0) - (Number(prestamo.prima) || 0));
    if (capitalneto <= 0) {
      throw new BadRequestException('El capital neto debe ser mayor a 0 para contabilizar');
    }
    const hoy = await this.fechaSistema.getFecha(empresaId);
    const Idsucursal = prestamo.Idsucursal || 1;

    // 1) Partida contable: plantilla PDA 20 (apertura de préstamos)
    const plantillaMae = await this.plantillaMaeRepo.findOne({
      where: { tcoplantillapdamaeId: 20, empresaId, sn_activo: 'S' } as any,
    });
    if (!plantillaMae) {
      throw new BadRequestException('No existe la plantilla PDA 20 (apertura de préstamos) para esta empresa');
    }
    const plantillaDet = await this.plantillaDetRepo.find({
      where: { tcoplantillapdamaeId: 20, empresaId, sn_activo: 'S' } as any,
      order: { nrofila: 'ASC' },
    });
    if (!plantillaDet || plantillaDet.length === 0) {
      throw new BadRequestException('La plantilla PDA 20 no tiene detalles activos');
    }

    const lineas: LineaPartidaDto[] = plantillaDet.map((det) => ({
      ctacontable: det.ctacontable,
      descripcion: `${det.descripcion || 'Apertura préstamo'}-${nroprestamo}`.substring(0, 200),
      debito: det.naturaleza === 'D' ? capitalneto : 0,
      credito: det.naturaleza === 'C' ? capitalneto : 0,
    }));
    const totalD = lineas.reduce((s, l) => s + l.debito, 0);
    const totalC = lineas.reduce((s, l) => s + l.credito, 0);
    if (Math.round(totalD * 100) !== Math.round(totalC * 100)) {
      throw new BadRequestException(`Partida de apertura de préstamo NO cuadrada: D=${totalD} C=${totalC}`);
    }

    // 2) Crear partida contable via contabilizarPartida (valida período, cuentas, crea copdamae/copdadet)
    const concepto = `Apertura préstamo ${nroprestamo}`;
    const fechaDoc = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const partidaDto: ContabilizarPartidaDto = {
      empresaId,
      Idsucursal,
      periodo: hoy.getMonth() + 1,
      anio: hoy.getFullYear(),
      moduloId: 4, // CxC
      documentoId: 13, // PPR
      fechadocumento: fechaDoc,
      nroreferencia: nroprestamo,
      descripcion: concepto,
      factordecambio: 1,
      lineas,
    };
    const copdamae = await this.contabilidadService.contabilizarPartida(partidaDto, currentUser);

    // 3) Movimiento D en cxcmovimientos por capital neto (vinculado a la partida)
    const cliente = await this.findCliente(prestamo.clienteId, empresaId);
    const nromovimiento = await this.generarNroMovimiento(empresaId, 'D', currentUser);
    const mov = this.movimientoRepo.create({
      fecharegistro: await this.fechaSistema.obtenerFechaRegistro(currentUser, empresaId),
      nromovimiento,
      clienteId: prestamo.clienteId,
      nrocliente: cliente.nrocliente,
      moduloId: 4, // CxC
      documentoId: 13, // PPR = Préstamo
      tipomov: 'D',
      nroreferencia: nroprestamo,
      factordecambio: 1,
      importe: capitalneto,
      concepto: `Desembolso préstamo ${nroprestamo}`,
      partidaId: copdamae.partidaId,
      sn_cotabilizada: 'S',
      sn_doc_anulado: 'N',
      empresaId,
      Idsucursal,
      usuarioCreated: currentUser,
    } as any);
    const movSaved = await this.movimientoRepo.save(mov as any);

    // 4) Marcar préstamo como contabilizado (vincula partidaId)
    await this.prestamoRepo.createQueryBuilder()
      .update(CxcPrestamo)
      .set({
        sn_contabilizado: 'S',
        partidaId: copdamae.partidaId,
        saldoactual: capitalneto as any,
        usuarioUpdated: currentUser,
        fechaUpdated: hoy,
      } as any)
      .where('prestamoId = :pid AND empresaId = :empresaId', { pid: prestamoId, empresaId })
      .execute();

    return { prestamo: await this.findPrestamo(prestamoId, empresaId), partidaId: copdamae.partidaId, movimientoId: (movSaved as any).clienteMovId };
  }

  /**
   * Genera un nroprestamo desde ttipoparametros (field='nroprestamo').
   * El campo `valor` es un contador autoincremental con PAD de 7 dígitos
   * (ej: 0000001, 0000002, ...). Incremento atómico vía CorrelativosService.
   */
  private async generarNroprestamo(empresaId: number, currentUser: string): Promise<string> {
    return this.correlativos.siguienteString('nroprestamo', empresaId, currentUser, 7);
  }

  async findAllPrestamoPP(empresaId: number, prestamoId?: number) {
    const where: any = { empresaId };
    if (prestamoId) where.prestamoId = prestamoId;
    return this.prestamoPPRepo.find({ where, order: { nrofila: 'ASC' } });
  }

  async findPrestamoPP(pppId: number, empresaId: number) {
    return this.findOneById(this.prestamoPPRepo, 'pppId', pppId, empresaId, 'Prestamo Plan Pago');
  }

  async createPrestamoPP(dto: any, currentUser: string) {
    return this.createEntity(this.prestamoPPRepo, dto, currentUser);
  }

  async updatePrestamoPP(pppId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.prestamoPPRepo, 'pppId', pppId, empresaId, dto, currentUser, 'Prestamo Plan Pago');
  }

  async findAllParientes(empresaId: number) {
    return this.findAllByEmpresa(this.parienteRepo, empresaId);
  }

  async findParientesByCliente(clienteId: number, empresaId: number) {
    return this.parienteRepo.find({
      where: { clienteId, empresaId } as FindOptionsWhere<CxcPariente>,
      order: { fecharegistro: 'DESC' },
    });
  }

  async findPariente(parienteId: number, empresaId: number) {
    return this.findOneById(this.parienteRepo, 'parienteId', parienteId, empresaId, 'Pariente');
  }

  async createPariente(dto: any, currentUser: string) {
    return this.createEntity(this.parienteRepo, dto, currentUser);
  }

  async updatePariente(parienteId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.parienteRepo, 'parienteId', parienteId, empresaId, dto, currentUser, 'Pariente');
  }

  async generarMovimientoDesdeFactura(factura: any, currentUser: string): Promise<CxcMovimiento> {
    const cliente = await this.findCliente(factura.clienteId, factura.empresaId);
    const fecharegistro = await this.fechaSistema.obtenerFechaRegistro(currentUser, factura.empresaId);
    const nromovimiento = await this.generarNroMovimiento(factura.empresaId, 'D', currentUser);

    const movimiento = this.movimientoRepo.create({
      fecharegistro,
      nromovimiento,
      clienteId: factura.clienteId,
      nrocliente: cliente.nrocliente,
      moduloId: 3,
      documentoId: 1, // tipodocumentofiscalId = 1 (FAC)
      tipomov: 'D',
      nroreferencia: factura.nrofactura.toString(),
      factordecambio: factura.factordecambio || 1,
      importe: factura.total,
      concepto: `Factura Crédito #${factura.nrofactura}`,
      sn_cotabilizada: 'N',
      sn_doc_anulado: 'N',
      empresaId: factura.empresaId,
      Idsucursal: factura.Idsucursal || 1,
      usuarioCreated: currentUser,
    });

    const saved = await this.movimientoRepo.save(movimiento);

    // El partidaId se asigna después en procesarKardexFactura cuando se contabiliza la factura
    return saved;
  }

  async anularMovimientoFactura(facturaId: number, nrofactura: number, empresaId: number, currentUser: string): Promise<void> {
    const now = await this.fechaSistema.getFecha(empresaId);
    const movimientos = await this.movimientoRepo.find({
      where: { nroreferencia: nrofactura.toString(), moduloId: 3, empresaId } as FindOptionsWhere<CxcMovimiento>,
    });

    for (const mov of movimientos) {
      mov.sn_doc_anulado = 'S';
      mov.fec_anulacion = now;
      mov.usuarioUpdated = currentUser;
      mov.fechaUpdated = now;
      await this.movimientoRepo.save(mov);
    }

    this.eventEmitter.emit('cxc.movimiento.anulado', { facturaId, empresaId, currentUser });
  }

  async anularCajaPorFactura(facturaId: number, nrofactura: number, empresaId: number, currentUser: string): Promise<void> {
    const now = await this.fechaSistema.getFecha(empresaId);
    const cajas = await this.cajaMaeRepo.find({
      where: { nrodocumento: nrofactura.toString(), moduloId: 4, empresaId } as FindOptionsWhere<CxccajaMae>,
    });

    for (const caja of cajas) {
      caja.sn_anulado = 'S';
      caja.fec_anulacion = now;
      caja.usuarioUpdated = currentUser;
      caja.fechaUpdated = now;
      await this.cajaMaeRepo.save(caja);

      const detalles = await this.cajaDetRepo.find({
        where: { cxccajaId: caja.cxccajaId, empresaId } as FindOptionsWhere<CxccajaDet>,
      });

      for (const det of detalles) {
        det.sn_anulado = 'S';
        det.fec_anulacion = now;
        det.usuarioUpdated = currentUser;
        det.fechaUpdated = now;
        await this.cajaDetRepo.save(det);
      }

      const movsCaja = await this.movimientoRepo.find({
        where: { documentoId: caja.cxccajaId, moduloId: 3, empresaId } as FindOptionsWhere<CxcMovimiento>,
      });

      for (const mov of movsCaja) {
        mov.sn_doc_anulado = 'S';
        mov.fec_anulacion = now;
        mov.usuarioUpdated = currentUser;
        mov.fechaUpdated = now;
        await this.movimientoRepo.save(mov);
      }
    }

    this.eventEmitter.emit('cxc.caja.anulada', { facturaId, empresaId, currentUser });
  }

  /**
   * Actualiza el partidaId en movimientos CxC de una factura.
   * Se llama después de contabilizar la factura para vincular el movimiento CxC con la partida.
   */
  async actualizarPartidaMovimientos(nroreferencia: string, partidaId: number, empresaId: number, currentUser: string): Promise<void> {
    const movimientos = await this.movimientoRepo.find({
      where: { nroreferencia, moduloId: 3, empresaId } as unknown as FindOptionsWhere<CxcMovimiento>,
    });
    for (const mov of movimientos) {
      mov.partidaId = partidaId;
      mov.sn_cotabilizada = 'S';
      mov.usuarioUpdated = currentUser;
      await this.movimientoRepo.save(mov);
    }
  }

  async getAntiguedadSaldos(empresaId: number) {
    const hoy = await this.fechaSistema.getFecha(empresaId);
    const clientes = await this.clienteRepo.find({ where: { empresaId, moduloId: 4 } as FindOptionsWhere<CxcCliente> });
    const movimientos = await this.movimientoRepo.find({ where: { empresaId } as FindOptionsWhere<CxcMovimiento> });

    const mapaClientes = new Map<number, any>();

    clientes.forEach(c => {
      mapaClientes.set(c.clienteId, {
        clienteId: c.clienteId,
        nrocliente: c.nrocliente,
        cliente: `${c.nombres || ''} ${c.apellidos || ''}`.trim() || c.razonsocial || 'Sin nombre',
        dni: c.dni || '',
        rtn: c.rtn || '',
        total: 0,
        corriente: 0,
        vencido30: 0,
        vencido60: 0,
        vencido90: 0,
      });
    });

    movimientos.forEach(m => {
      if (m.sn_doc_anulado === 'S') return;
      const item = mapaClientes.get(m.clienteId);
      if (!item) return;

      const importe = Number(m.importe) || 0;
      if (importe <= 0) return;

      const fechaMov = new Date(m.fecharegistro);
      const diasDiff = Math.floor((hoy.getTime() - fechaMov.getTime()) / (1000 * 60 * 60 * 24));

      if (m.tipomov === 'D') {
        item.total += importe;
        if (diasDiff <= 30) {
          item.corriente += importe;
        } else if (diasDiff <= 60) {
          item.vencido30 += importe;
        } else if (diasDiff <= 90) {
          item.vencido60 += importe;
        } else {
          item.vencido90 += importe;
        }
      } else if (m.tipomov === 'C') {
        item.total -= importe;
      }
      // tipomov='I' (interés/mora) → sin efecto sobre el saldo
    });

    return Array.from(mapaClientes.values()).filter(item => item.total > 0);
  }

  async getAntiguedadSaldosPrestamos(empresaId: number) {
    const hoy = await this.fechaSistema.getFecha(empresaId);

    const clientes = await this.clienteRepo.find({
      where: { empresaId, moduloId: 10 } as FindOptionsWhere<CxcCliente>,
    });
    if (!clientes.length) return [];
    const clienteMap = new Map(clientes.map(c => [c.clienteId, c]));

    const prestamos = await this.prestamoRepo.find({
      where: { empresaId, sn_activo: 'S', sn_anulado: 'N' } as FindOptionsWhere<CxcPrestamo>,
    });
    const prestamoMap = new Map(prestamos.map(p => [p.prestamoId, p]));

    const cuotas = await this.prestamoPPRepo.find({
      where: {
        empresaId,
        sn_pagada: 'N',
        sn_anulada: 'N',
      } as FindOptionsWhere<CxcPrestamoPP>,
    });

    const cuotasFiltradas = cuotas.filter(cuota => clienteMap.has(cuota.clienteId));

    const mapaSaldos = new Map<number, {
      clienteId: number;
      nroprestamos: string[];
      cliente: string;
      rtn: string;
      total: number;
      corriente: number;
      vencido30: number;
      vencido60: number;
      vencido90: number;
    }>();

    clientes.forEach(c => {
      mapaSaldos.set(c.clienteId, {
        clienteId: c.clienteId,
        nroprestamos: [],
        cliente: `${c.nombres || ''} ${c.apellidos || ''}`.trim() || c.razonsocial || 'Sin nombre',
        rtn: c.rtn || '',
        total: 0,
        corriente: 0,
        vencido30: 0,
        vencido60: 0,
        vencido90: 0,
      });
    });

    cuotasFiltradas.forEach(cuota => {
      const item = mapaSaldos.get(cuota.clienteId);
      if (!item) return;

      const pres = prestamoMap.get(cuota.prestamoId);
      const nroPrestamo = pres ? pres.nroprestamo : `P-${cuota.prestamoId}`;
      if (!item.nroprestamos.includes(nroPrestamo)) {
        item.nroprestamos.push(nroPrestamo);
      }

      const monto = Number(cuota.vlrcuota || 0);
      if (monto <= 0) return;

      const fechaPago = new Date(cuota.FechaPago);
      if (fechaPago > hoy) return; // Omitir cuotas futuras
      const diasDiff = Math.floor((hoy.getTime() - fechaPago.getTime()) / (1000 * 60 * 60 * 24));

      item.total += monto;

      if (diasDiff <= 0) {
        item.corriente += monto;
      } else if (diasDiff <= 30) {
        item.vencido30 += monto;
      } else if (diasDiff <= 60) {
        item.vencido60 += monto;
      } else {
        item.vencido90 += monto;
      }
    });

    return Array.from(mapaSaldos.values())
      .filter(item => item.total > 0)
      .map(item => ({
        clienteId: item.clienteId,
        nrocliente: item.nroprestamos.join(', '),
        cliente: item.cliente,
        dni: '',
        rtn: item.rtn,
        total: item.total,
        corriente: item.corriente,
        vencido30: item.vencido30,
        vencido60: item.vencido60,
        vencido90: item.vencido90,
      }));
  }

  async getAntiguedadSaldosPrestamosCuotas(empresaId: number) {
    return this.getAntiguedadSaldosPrestamos(empresaId);
  }

  async getClientesConSaldo(empresaId: number) {
    const result = await this.getAntiguedadSaldos(empresaId);

    const clientesIds = result.map(r => r.clienteId);
    if (clientesIds.length === 0) return [];

    // cxccclientesdir / cxcclientestel eliminadas: se conserva la forma de la respuesta con campos vacíos
    return result.map(item => {
      return {
        ...item,
        direccion: '',
        telefono: '',
      };
    });
  }

  /**
   * Clientes con préstamos ACTIVOS para cobro.
   * "Activo" = préstamo no anulado, sn_activo='S' Y con al menos una cuota
   * pendiente (cxcprestamospp: sn_pagada='N' y sn_anulada='N').
   * Los préstamos totalmente pagados conservan sn_activo='S' en BD (el flag no
   * se baja al saldar) → se excluyen vía el plan de cuotas.
   * Usado por caja con destino=Préstamos para filtrar el select de clientes.
   * Misma forma de respuesta que getClientesConSaldo (cliente, dni, rtn...).
   */
  async getClientesConPrestamos(empresaId: number, moduloId?: number) {
    const prestamos = await this.prestamoRepo.find({
      where: { empresaId, sn_activo: 'S', sn_anulado: 'N' } as FindOptionsWhere<CxcPrestamo>,
    });

    if (!prestamos.length) return [];

    // Ids de préstamos con al menos una cuota pendiente (cobrable).
    const conPendientes = await this.prestamoPPRepo.createQueryBuilder('pp')
      .select('DISTINCT pp.prestamoId', 'prestamoId')
      .where('pp.empresaId = :empresaId', { empresaId })
      .andWhere('pp.sn_pagada = :np', { np: 'N' })
      .andWhere('pp.sn_anulada = :na', { na: 'N' })
      .getRawMany<{ prestamoId: string }>();
    const idsPendientes = new Set(conPendientes.map((r) => Number(r.prestamoId)));

    const activos = prestamos.filter((p) => idsPendientes.has(p.prestamoId));
    if (!activos.length) return [];

    // Agrupar saldo pendiente por cliente (solo préstamos con cuotas por cobrar)
    const porCliente = new Map<number, { saldo: number; cantidad: number }>();
    for (const p of activos) {
      // saldoactual: capital pendiente (fallback al capital para préstamos antiguos)
      const saldo = Number(p.saldoactual ?? p.capital ?? 0);
      const acc = porCliente.get(p.clienteId) ?? { saldo: 0, cantidad: 0 };
      acc.saldo += saldo;
      acc.cantidad += 1;
      porCliente.set(p.clienteId, acc);
    }

    const whereCliente: FindOptionsWhere<CxcCliente> = { empresaId };
    if (moduloId != null) {
      whereCliente.moduloId = moduloId;
    }

    const clientes = await this.clienteRepo.find({
      where: whereCliente,
    });

    return clientes
      .filter(c => porCliente.has(c.clienteId))
      .map(c => {
        const acc = porCliente.get(c.clienteId)!;
        return {
          clienteId: c.clienteId,
          nrocliente: c.nrocliente,
          cliente: `${c.nombres || ''} ${c.apellidos || ''}`.trim() || c.razonsocial || 'Sin nombre',
          dni: c.dni || '',
          rtn: c.rtn || '',
          saldo: acc.saldo,
          prestamosactivos: acc.cantidad,
          direccion: '',
          telefono: '',
        };
      });
  }

  /**
   * Diferencia en días calendario entre dos fechas (ignora la hora).
   * Usado para el devengado de intereses: 30/08 → 09/10 = 40 días.
   */
  private diasEntre(fecha1: Date, fecha2: Date): number {
    const msPorDia = 86400000;
    const d1 = Date.UTC(fecha1.getFullYear(), fecha1.getMonth(), fecha1.getDate());
    const d2 = Date.UTC(fecha2.getFullYear(), fecha2.getMonth(), fecha2.getDate());
    return Math.round((d2 - d1) / msPorDia);
  }

  private sumarDias(fecha: Date, dias: number): Date {
    const r = new Date(fecha.getTime());
    r.setDate(r.getDate() + dias);
    return r;
  }

  /**
   * Interés simple devengado + moratorio sobre el saldo de una factura de crédito.
   * Regla aprobada 09/10/2026:
   *  - fechaUltAbono = posfacmae.fechaultPago ?? fecharegistro (si nunca abonó).
   *  - proximoPago   = fechaUltAbono + diasplazo
   *  - fechaMaxPago  = proximoPago + diasgracia
   *  - Dentro de plazo/gracia (hoy <= fechaMaxPago):
   *      diasGraciaEfectiva = max(0, hoy - proximoPago)   // gracia realmente usada
   *      diasInteres        = diasTranscurridos - diasGraciaEfectiva
   *      mora = 0
   *  - Vencido (hoy > fechaMaxPago):
   *      diasInteres = diasTranscurridos (todos, sin restar gracia)
   *      diasMora    = hoy - fechaMaxPago
   *  - interes = saldo × (tasaAnual/100) × (diasInteres/360)
   *  - mora    = saldo × (tasaMoratoria/100) × (diasMora/360)
   *  - Redondeo estándar a 2 decimales (3er decimal >= 5 sube).
   */
  private calcularInteresesFactura(o: {
    saldo: number;
    tasaAnual: number;
    tasaMoratoria: number;
    diasPlazo: number;
    diasGracia: number;
    fechaUltAbono: Date;
    hoy: Date;
  }) {
    const tasaAnual = (o.tasaAnual || 0) / 100;
    const tasaMoratoria = (o.tasaMoratoria || 0) / 100;

    const diasTranscurridos = this.diasEntre(o.fechaUltAbono, o.hoy);
    const proximoPago = this.sumarDias(o.fechaUltAbono, o.diasPlazo || 0);
    const fechaMaxPago = this.sumarDias(proximoPago, o.diasGracia || 0);

    let diasGraciaEfectiva = 0;
    let diasMora = 0;
    let diasInteres = diasTranscurridos;

    if (this.diasEntre(o.hoy, fechaMaxPago) >= 0) {
      // Dentro de plazo o de gracia: la gracia usada no devenga interés.
      diasGraciaEfectiva = Math.max(0, this.diasEntre(proximoPago, o.hoy));
      diasInteres = Math.max(0, diasTranscurridos - diasGraciaEfectiva);
    } else {
      // Vencido: interés sobre todos los días + mora por días de atraso.
      diasMora = this.diasEntre(fechaMaxPago, o.hoy);
    }

    const interes = o.saldo * tasaAnual * (diasInteres / 360);
    const mora = o.saldo * tasaMoratoria * (diasMora / 360);
    const r2 = (x: number) => Math.round(x * 100) / 100;

    return {
      proximoPago,
      fechaMaxPago,
      diasTranscurridos,
      diasGraciaEfectiva,
      diasInteres,
      diasMora,
      tasaAnual: o.tasaAnual,
      tasaMoratoria: o.tasaMoratoria,
      interes: r2(interes),
      mora: r2(mora),
      totalCargos: r2(interes + mora),
    };
  }

  private calcularInteresesPrestamo(o: {
    saldo: number;
    tasaAnual: number;
    tasaMoratoria: number;
    diasPlazo: number;
    diasGracia: number;
    vlrcuota: number;
    fechaUltAbono: Date;
    hoy: Date;
  }) {
    const tasaAnual = (o.tasaAnual || 0) / 100;
    const tasaMoratoria = (o.tasaMoratoria || 0) / 100;

    const diasTranscurridos = this.diasEntre(o.fechaUltAbono, o.hoy);
    const proximoPago = this.sumarDias(o.fechaUltAbono, o.diasPlazo || 0);
    const fechaMaxPago = this.sumarDias(proximoPago, o.diasGracia || 0);

    let diasGraciaEfectiva = 0;
    let diasMora = 0;
    const diasInteres = diasTranscurridos; // DiasGraciaEfectiva = 0

    if (this.diasEntre(o.hoy, fechaMaxPago) < 0) {
      diasMora = this.diasEntre(fechaMaxPago, o.hoy);
    }

    const interes = o.saldo * tasaAnual * (diasInteres / 360);
    const saldoCapitalCuota = Math.max(0, (o.vlrcuota || 0) - interes);
    const mora = saldoCapitalCuota * tasaMoratoria * (diasMora / 360);
    const r2 = (x: number) => Math.round(x * 100) / 100;

    return {
      proximoPago,
      fechaMaxPago,
      diasTranscurridos,
      diasGraciaEfectiva,
      diasInteres,
      diasMora,
      tasaAnual: o.tasaAnual,
      tasaMoratoria: o.tasaMoratoria,
      interes: r2(interes),
      mora: r2(mora),
      totalCargos: r2(interes + mora),
    };
  }

  async findDocumentosPendientesCliente(clienteId: number, empresaId: number) {
    const movimientos = await this.movimientoRepo
      .createQueryBuilder('mov')
      .leftJoinAndSelect('mov.modulo', 'modulo')
      .where('mov.clienteId = :clienteId AND mov.empresaId = :empresaId AND mov.sn_doc_anulado = :anulado', {
        clienteId, empresaId, anulado: 'N',
      })
      .orderBy('mov.fecharegistro', 'ASC')
      .getMany();

    // 1ra pasada: acumular débitos (D) como documentos pendientes
    const mapaDocs = new Map<string, any>();
    for (const m of movimientos) {
      const importe = Number(m.importe) || 0;
      if (m.tipomov !== 'D' || importe <= 0) continue;

      const key = `${m.moduloId}-${m.nroreferencia}`;
      if (!mapaDocs.has(key)) {
        mapaDocs.set(key, {
          moduloId: m.moduloId,
          modulo: m.modulo?.descripcion ?? '',
          documentoId: m.documentoId,
          nroreferencia: m.nroreferencia ?? '',
          tipomov: 'D',
          importe: 0,
          pagado: 0,
        });
      }
      mapaDocs.get(key).importe += importe;
    }

    // 2da pasada: restar créditos (C) por nroreferencia
    for (const m of movimientos) {
      const importe = Number(m.importe) || 0;
      if (m.tipomov !== 'C' || importe <= 0) continue;

      const key = `${m.moduloId}-${m.nroreferencia}`;
      const doc = mapaDocs.get(key);
      if (doc) {
        doc.pagado += importe;
      }
    }

    // Excluir préstamos (decisión 13/10/2026): el cobro de un préstamo solo
    // ocurre por caja con destino=2 (rebaja saldoactual). Si apareciera aquí,
    // un cajero podría "pagarlo" desde caja normal y el préstamo no se
    // actualizaría. Se filtra por documentoId=13 (PPR) o nroreferencia que
    // coincida con un préstamo activo del cliente.
    const prestamos = await this.prestamoRepo.find({
      where: { clienteId, empresaId, sn_anulado: 'N' } as FindOptionsWhere<CxcPrestamo>,
    });
    const refsPrestamos = new Set(prestamos.map((p) => String(p.nroprestamo)));

    const docs = Array.from(mapaDocs.values())
      .map(doc => ({ ...doc, saldo: doc.importe - doc.pagado }))
      .filter(doc => doc.saldo > 0)
      .filter(doc =>
        !(doc.documentoId === 13 || (doc.moduloId === 4 && refsPrestamos.has(String(doc.nroreferencia)))),
      );

    // Enriquecer facturas de crédito con el interés devengado/moratorio al día de hoy.
    await this.enriquecerIntereses(docs, clienteId, empresaId);

    return docs;
  }

  /**
   * Calcula y adjunta el interés devengado/moratorio a cada documento que sea
   * una factura de crédito (matchea nroreferencia contra posfacmae.nrofactura).
   */
  private async enriquecerIntereses(docs: any[], clienteId: number, empresaId: number) {
    if (!docs.length) return;

    const cliente = await this.clienteRepo.findOne({
      where: { clienteId, empresaId } as FindOptionsWhere<CxcCliente>,
    });
    if (!cliente) return;

    const nroRefs = docs
      .map(d => Number(d.nroreferencia))
      .filter(n => Number.isFinite(n) && n > 0);
    if (!nroRefs.length) return;

    const facturas = await this.facMaeRepo.find({
      where: {
        clienteId, empresaId, tipofactura: 'C', nrofactura: In(nroRefs),
      } as unknown as FindOptionsWhere<TPosFacMae>,
    });
    if (!facturas.length) return;

    const mapaFacturas = new Map(facturas.map(f => [Number(f.nrofactura), f]));
    const hoy = await this.fechaSistema.getFecha(empresaId);

    const tasaAnual = Number(cliente.interes) || 0;
    const tasaMoratoria = Number(cliente.moratorio) || 0;
    const diasPlazo = Number(cliente.diasplazo) || 0;
    const diasGracia = Number(cliente.diasgracia) || 0;

    for (const doc of docs) {
      const fac = mapaFacturas.get(Number(doc.nroreferencia));
      if (!fac) continue;

      // Fecha de inicio del devengado: último abono o, si nunca abonó, la emisión.
      const fechaUltAbono: Date = fac.fechaultabono ?? fac.fecharegistro;
      const calc = this.calcularInteresesFactura({
        saldo: Number(doc.saldo) || 0,
        tasaAnual, tasaMoratoria, diasPlazo, diasGracia,
        fechaUltAbono, hoy,
      });

      Object.assign(doc, {
        esFacturaCredito: true,
        fechaultabono: fechaUltAbono,
        ...calc,
      });
    }
  }


  // ==================== EVENT LISTENERS ====================

  /**
   * Listener: Cuando la contabilidad confirma la contabilización de un pago CxC desde Caja.
   * Actualiza cajamae y cajadet con partidaId y sn_contabilizada='S'.
   */
  @OnEvent('cxc.caja.contabilizada')
  async handleCajaContabilizada(payload: any) {
    const { cxccajaId, cxccajadetId, partidaId, empresaId, currentUser } = payload;
    this.logger.log(`[CxC Event] Caja contabilizada: cajaId=${cxccajaId}, partidaId=${partidaId}`);

    try {
      const now = await this.fechaSistema.getFecha(empresaId);

      // Actualizar caja maestro
      await this.cajaMaeRepo.createQueryBuilder()
        .update(CxccajaMae)
        .set({
          partidaId,
          sn_contabilizada: 'S',
          usuarioUpdated: currentUser,
          fechaUpdated: now,
        } as any)
        .where('cxccajaId = :cxccajaId AND empresaId = :empresaId', { cxccajaId, empresaId })
        .execute();

      this.logger.log(`[CxC Event] cajamae #${cxccajaId} actualizado: partidaId=${partidaId}, sn_contabilizada=S`);

      // Actualizar caja detalle (si existe)
      if (cxccajadetId) {
        await this.cajaDetRepo.createQueryBuilder()
          .update(CxccajaDet)
          .set({
            partidaId,
            sn_contabilizada: 'S',
            usuarioUpdated: currentUser,
            fechaUpdated: now,
          } as any)
          .where('cxccajadetId = :cxccajadetId AND empresaId = :empresaId', { cxccajadetId, empresaId })
          .execute();

        this.logger.log(`[CxC Event] cajadet #${cxccajadetId} actualizado: partidaId=${partidaId}, sn_contabilizada=S`);
      }
    } catch (error) {
      this.logger.error(`[CxC Event] Error actualizando caja: ${error.message}`, error.stack);
    }
  }

  // ========== Cartera Contable por Cliente (cxccarteracta) ==========

  async findAllCarterasCta(empresaId: number) {
    return this.carteraCtaRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<CxcCarteraCta>,
      order: { clienteId: 'ASC' } as any,
    });
  }

  async findCarteraCta(id: number, empresaId: number) {
    return this.findOneById(this.carteraCtaRepo, 'id', id, empresaId, 'Cartera contable de cliente');
  }

  async createCarteraCta(dto: CreateCxcCarteraCtaDto, currentUser: string, idsucursal?: number) {
    // Sucursal: preferir la enviada, si no la del usuario autenticado
    const sucursal = dto.Idsucursal ?? idsucursal;
    if (!sucursal) {
      throw new BadRequestException('La sucursal es requerida');
    }

    // Validar cliente (FK) — no existe → 400 en vez de 500
    const cliente = await this.clienteRepo.findOne({
      where: { clienteId: dto.clienteId, empresaId: dto.empresaId } as FindOptionsWhere<CxcCliente>,
    });
    if (!cliente) {
      throw new BadRequestException('El cliente indicado no existe');
    }

    // Validar cartera contable (FK a tcocarteras)
    const cartera = await this.cocarterasRepo.findOne({
      where: { tcocarteraId: dto.carteractaId } as any,
    });
    if (!cartera) {
      throw new BadRequestException('La cartera contable indicada no existe');
    }

    // Unicidad: (clienteId, carteractaId, Idsucusal, empresaId)
    const dup = await this.carteraCtaRepo.findOne({
      where: {
        clienteId: dto.clienteId,
        carteractaId: dto.carteractaId,
        Idsucursal: sucursal,
        empresaId: dto.empresaId,
      } as unknown as FindOptionsWhere<CxcCarteraCta>,
    });
    if (dup) {
      throw new BadRequestException('El cliente ya tiene asignada esta cartera contable');
    }

    return this.createEntity(this.carteraCtaRepo, {
      clienteId: dto.clienteId,
      carteractaId: dto.carteractaId,
      Idsucursal: sucursal,
      empresaId: dto.empresaId,
    }, currentUser);
  }

  async updateCarteraCta(id: number, empresaId: number, dto: UpdateCxcCarteraCtaDto, currentUser: string, idsucursal?: number) {
    const entity = await this.findOneById(this.carteraCtaRepo, 'id', id, empresaId, 'Cartera contable de cliente');

    const nuevoCliente = dto.clienteId ?? entity.clienteId;
    const nuevaCartera = dto.carteractaId ?? entity.carteractaId;
    const nuevaSucursal = dto.Idsucursal ?? entity.Idsucursal ?? idsucursal;

    // Validar FKs solo si cambiaron
    if (dto.clienteId != null && dto.clienteId !== entity.clienteId) {
      const cliente = await this.clienteRepo.findOne({
        where: { clienteId: dto.clienteId, empresaId } as FindOptionsWhere<CxcCliente>,
      });
      if (!cliente) throw new BadRequestException('El cliente indicado no existe');
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
        clienteId: nuevoCliente,
        carteractaId: nuevaCartera,
        Idsucursal: nuevaSucursal,
        empresaId,
      } as unknown as FindOptionsWhere<CxcCarteraCta>,
    });
    if (dup && dup.id !== id) {
      throw new BadRequestException('El cliente ya tiene asignada esta cartera contable');
    }

    const now = await this.fechaSistema.getFecha(empresaId);
    Object.assign(entity, {
      clienteId: nuevoCliente,
      carteractaId: nuevaCartera,
      Idsucursal: nuevaSucursal,
      usuarioUpdate: currentUser,
      fechaUpdate: now,
    });
    return this.carteraCtaRepo.save(entity);
  }

  async removeCarteraCta(id: number, empresaId: number) {
    // La tabla NO tiene sn_activo → eliminación física
    const entity = await this.findOneById(this.carteraCtaRepo, 'id', id, empresaId, 'Cartera contable de cliente');
    await this.carteraCtaRepo.remove(entity);
    return { id, eliminado: true };
  }

  // ========== Info de Clientes (cxccclientesinfo) ==========

  async findAllClientesInfo(empresaId: number) {
    return this.clienteInfoRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<CxcClientesInfo>,
      order: { clienteid: 'ASC', id: 'ASC' } as any,
    });
  }

  async findClientesInfoByCliente(clienteid: number, empresaId: number) {
    return this.clienteInfoRepo.find({
      where: { clienteid, empresaId } as unknown as FindOptionsWhere<CxcClientesInfo>,
      order: { id: 'ASC' } as any,
    });
  }

  async findClienteInfo(id: number, empresaId: number) {
    return this.findOneById(this.clienteInfoRepo, 'id', id, empresaId, 'Info de cliente');
  }

  async createClienteInfo(dto: CreateCxcClientesInfoDto, currentUser: string) {
    // Validar cliente (FK a cxcclientes) — no existe → 400 en vez de 500
    const cliente = await this.clienteRepo.findOne({
      where: { clienteId: dto.clienteid, empresaId: dto.empresaId } as FindOptionsWhere<CxcCliente>,
    });
    if (!cliente) {
      throw new BadRequestException('El cliente indicado no existe');
    }

    // Unicidad: (clienteid, tipo, empresaId) — un solo registro por tipo
    const dup = await this.clienteInfoRepo.findOne({
      where: {
        clienteid: dto.clienteid,
        tipo: dto.tipo,
        empresaId: dto.empresaId,
      } as unknown as FindOptionsWhere<CxcClientesInfo>,
    });
    if (dup) {
      throw new BadRequestException('El cliente ya tiene un registro de este tipo de información');
    }

    return this.createEntity(this.clienteInfoRepo, {
      clienteid: dto.clienteid,
      tipo: dto.tipo,
      descripcion: dto.descripcion ?? null,
      sn_activo: dto.sn_activo ?? 'S',
      empresaId: dto.empresaId,
    }, currentUser);
  }

  async updateClienteInfo(id: number, empresaId: number, dto: UpdateCxcClientesInfoDto, currentUser: string) {
    const entity = await this.findOneById(this.clienteInfoRepo, 'id', id, empresaId, 'Info de cliente');

    const nuevoCliente = dto.clienteid ?? entity.clienteid;
    const nuevoTipo = dto.tipo ?? entity.tipo;

    // Validar FK solo si cambió
    if (dto.clienteid != null && dto.clienteid !== entity.clienteid) {
      const cliente = await this.clienteRepo.findOne({
        where: { clienteId: dto.clienteid, empresaId } as FindOptionsWhere<CxcCliente>,
      });
      if (!cliente) throw new BadRequestException('El cliente indicado no existe');
    }

    // Unicidad excluyendo el propio registro
    const dup = await this.clienteInfoRepo.findOne({
      where: {
        clienteid: nuevoCliente,
        tipo: nuevoTipo,
        empresaId,
      } as unknown as FindOptionsWhere<CxcClientesInfo>,
    });
    if (dup && dup.id !== id) {
      throw new BadRequestException('El cliente ya tiene un registro de este tipo de información');
    }

    const now = await this.fechaSistema.getFecha(empresaId);
    Object.assign(entity, {
      clienteid: nuevoCliente,
      tipo: nuevoTipo,
      descripcion: dto.descripcion !== undefined ? dto.descripcion : entity.descripcion,
      sn_activo: dto.sn_activo ?? entity.sn_activo,
      usuarioUpdated: currentUser,
      fechaUpdated: now,
    });
    return this.clienteInfoRepo.save(entity);
  }

  async removeClienteInfo(id: number, empresaId: number, currentUser: string) {
    // La tabla tiene sn_activo → desactivación lógica
    const entity = await this.findOneById(this.clienteInfoRepo, 'id', id, empresaId, 'Info de cliente');
    const now2 = await this.fechaSistema.getFecha(empresaId);
    Object.assign(entity, {
      sn_activo: 'N',
      usuarioUpdated: currentUser,
      fechaUpdated: now2,
    });
    return this.clienteInfoRepo.save(entity);
  }

  // ========== Categorías de Clientes (cxccategorias) ==========
  async findAllCategorias(empresaId: number) {
    return this.categoriaRepo.find({
      where: { empresaId } as FindOptionsWhere<CxcCategoria>,
      order: { cxccategoriaId: 'DESC' },
    });
  }

  async findCategoria(id: number, empresaId: number) {
    return this.findOneById(this.categoriaRepo, 'cxccategoriaId', id, empresaId, 'Categoría CXC');
  }

  async createCategoria(dto: CreateCxcCategoriaDto, currentUser: string) {
    const payload: any = {
      ...dto,
      Idsucursal: dto.Idsucursal ?? 1,
    };
    return this.createEntity(this.categoriaRepo, payload, currentUser);
  }

  async updateCategoria(id: number, empresaId: number, dto: UpdateCxcCategoriaDto, currentUser: string) {
    return this.updateEntity(this.categoriaRepo, 'cxccategoriaId', id, empresaId, dto, currentUser, 'Categoría CXC');
  }

  async removeCategoria(id: number, empresaId: number) {
    return this.softDelete(this.categoriaRepo, 'cxccategoriaId', id, empresaId, 'Categoría CXC');
  }
}
