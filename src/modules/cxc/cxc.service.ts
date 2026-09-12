import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral, Like } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CxcCliente } from './entities/cxccliente.entity';
import { CxccClientesDir } from './entities/cxccclientesdir.entity';
import { CxcClienteTel } from './entities/cxcclientestel.entity';
import { CxccClientesRef } from './entities/cxccclientesref.entity';
import { Cxccajero } from './entities/cxccajero.entity';
import { CxccajaMae } from './entities/cxccajamae.entity';
import { CxccajaDet } from './entities/cxccajadet.entity';
import { CxcMovimiento } from './entities/cxcmovimiento.entity';
import { CxcHistoro } from './entities/cxchisto.entity';
import { CxcSalFav } from './entities/cxcsalfav.entity';
import { TcctDiasCobro } from './entities/tcctdiascobro.entity';
import { TtipoParamCxc } from '../parametros/entities/param-cxc.entity';
import { CxcPrestamo } from './entities/cxcprestamo.entity';
import { CxcPrestamoPP } from './entities/cxcprestamopp.entity';
import { CxcPariente } from './entities/cxcpariente.entity';
import {
  CreateCxcClienteDto, UpdateCxcClienteDto,
  CreateCxcMovimientoDto, UpdateCxcMovimientoDto,
  CreateCxcPrestamoDto, UpdateCxcPrestamoDto,
} from './dto/cxc.dto';

@Injectable()
export class CxcService {
  constructor(
    @InjectRepository(CxcCliente) private readonly clienteRepo: Repository<CxcCliente>,
    @InjectRepository(CxccClientesDir) private readonly clienteDirRepo: Repository<CxccClientesDir>,
    @InjectRepository(CxcClienteTel) private readonly clienteTelRepo: Repository<CxcClienteTel>,
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
    @InjectRepository(TtipoParamCxc) private readonly paramCxcRepo: Repository<TtipoParamCxc>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
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
    const entity = repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
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
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
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
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  async findAllClientes(empresaId: number, page: number, limit: number, q?: string) {
    const whereBase = { empresaId } as FindOptionsWhere<CxcCliente>;
    
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

  async createCliente(dto: CreateCxcClienteDto, currentUser: string) {
    let params: TtipoParamCxc | null = null;
    try {
      params = await this.paramCxcRepo.findOne({ where: { empresaId: dto.empresaId } });
    } catch (_) {}

    const nro = (params?.nrocliente ?? 0) + 1;
    const nrocliente = dto.nrocliente || String(nro).padStart(6, '0');

    const payload: any = {
      ...dto,
      nrocliente,
      dni: dto.dni || '0000000000000',
      razonsocial: dto.razonsocial || `${dto.nombres} ${dto.apellidos}`,
      fecharegistro: dto.fecharegistro || new Date().toISOString(),
      fechanacimiento: dto.fechanacimiento || new Date().toISOString(),
      interes: dto.interes ?? params?.interes ?? 0,
      moratorio: dto.moratorio ?? params?.mora ?? 0,
      diasplazo: dto.diasplazo ?? params?.diasPlazo ?? 0,
      limiteCredito: dto.limiteCredito ?? params?.limitecredito ?? 0,
    };

    const saved = await this.createEntity(this.clienteRepo, payload, currentUser);

    if (params) {
      try {
        await this.paramCxcRepo.update({ empresaId: dto.empresaId }, { nrocliente: nro });
      } catch (_) {}
    }

    return saved;
  }

  async updateCliente(clienteId: number, empresaId: number, dto: UpdateCxcClienteDto, currentUser: string) {
    return this.updateEntity(this.clienteRepo, 'clienteId', clienteId, empresaId, dto, currentUser, 'Cliente');
  }

  async removeCliente(clienteId: number, empresaId: number) {
    return this.softDelete(this.clienteRepo, 'clienteId', clienteId, empresaId, 'Cliente');
  }

  async findAllClientesDir(empresaId: number) {
    return this.findAllByEmpresa(this.clienteDirRepo, empresaId);
  }

  async findClienteDir(cxccclientesdirId: number, empresaId: number) {
    return this.findOneById(this.clienteDirRepo, 'cxccclientesdirId', cxccclientesdirId, empresaId, 'Direccion Cliente');
  }

  async createClienteDir(dto: any, currentUser: string) {
    return this.createEntity(this.clienteDirRepo, dto, currentUser);
  }

  async updateClienteDir(cxccclientesdirId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.clienteDirRepo, 'cxccclientesdirId', cxccclientesdirId, empresaId, dto, currentUser, 'Direccion Cliente');
  }

  async findAllClientesTel(empresaId: number) {
    return this.findAllByEmpresa(this.clienteTelRepo, empresaId);
  }

  async findClienteTel(clientetelefonoId: number, empresaId: number) {
    return this.findOneById(this.clienteTelRepo, 'clientetelefonoId', clientetelefonoId, empresaId, 'Telefono Cliente');
  }

  async createClienteTel(dto: any, currentUser: string) {
    return this.createEntity(this.clienteTelRepo, dto, currentUser);
  }

  async updateClienteTel(clientetelefonoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.clienteTelRepo, 'clientetelefonoId', clientetelefonoId, empresaId, dto, currentUser, 'Telefono Cliente');
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
    const caja = await this.createEntity<CxccajaMae>(this.cajaMaeRepo, dto, currentUser);

    if (dto.tipomov === 'C') {
      try {
        await this.generarMovimientoDesdeCaja(caja, currentUser);
      } catch (error) {
        console.error('Error generando movimiento CXC desde Caja:', error);
      }
    }

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
      cajaId: cajero?.cajaId ?? 0,
      clienteId: cajaMae?.clienteId ?? dto.clienteId,
      nrocliente: cajaMae?.nrocliente ?? dto.nrocliente,
    }, currentUser);

    if (cajaMae && cajaMae.tipomov === 'C') {
      try {
        await this.generarMovimientoDesdeCajaDet(cajaDet, cajaMae, currentUser);
      } catch (error) {
        console.error('Error generando movimiento CXC desde Caja Det:', error.message, error.stack);
      }
    }

    return cajaDet;
  }

  async updateCajaDet(cxccajadetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cajaDetRepo, 'cxccajadetId', cxccajadetId, empresaId, dto, currentUser, 'Detalle Caja');
  }

  private async generarMovimientoDesdeCaja(caja: CxccajaMae, currentUser: string): Promise<CxcMovimiento> {
    const cliente = await this.findCliente(caja.clienteId, caja.empresaId);
    
    const movimiento = this.movimientoRepo.create({
      fecharegistro: new Date(),
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
      usuarioCreated: currentUser,
    });

    return this.movimientoRepo.save(movimiento);
  }

  private async generarMovimientoDesdeCajaDet(cajaDet: CxccajaDet, cajaMae: CxccajaMae, currentUser: string): Promise<CxcMovimiento> {
    const cliente = await this.findCliente(cajaDet.clienteId, cajaDet.empresaId);
    
    const movimiento = this.movimientoRepo.create({
      fecharegistro: new Date(),
      clienteId: cajaDet.clienteId,
      nrocliente: cliente.nrocliente,
      moduloId: 4,
      documentoId: cajaMae.documentoId,
      tipomov: 'C',
      nroreferencia: cajaMae.nrodocumento,
      factordecambio: cajaDet.factordecambio || 1,
      importe: cajaDet.importe,
      concepto: `Pago ${cajaDet.formapagoId} - Caja #${cajaMae.cxccajaId}`,
      sn_cotabilizada: 'N',
      sn_doc_anulado: 'N',
      empresaId: cajaDet.empresaId,
      usuarioCreated: currentUser,
    });

    const saved = await this.movimientoRepo.save(movimiento);

    this.eventEmitter.emit('cxc.movimiento.creado', { movimiento: saved, origen: 'caja', cajaMae, cajaDet });

    return saved;
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
    return this.createEntity(this.movimientoRepo, dto, currentUser);
  }

  async updateMovimiento(clienteMovId: number, empresaId: number, dto: UpdateCxcMovimientoDto, currentUser: string) {
    return this.updateEntity(this.movimientoRepo, 'clienteMovId', clienteMovId, empresaId, dto, currentUser, 'Movimiento');
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
      .orderBy('b.razonsocial', 'ASC')
      .addOrderBy('a.clienteMovId', 'ASC');

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
    return this.createEntity(this.prestamoRepo, dto, currentUser);
  }

  async updatePrestamo(prestamoId: number, empresaId: number, dto: UpdateCxcPrestamoDto, currentUser: string) {
    return this.updateEntity(this.prestamoRepo, 'prestamoId', prestamoId, empresaId, dto, currentUser, 'Prestamo');
  }

  async removePrestamo(prestamoId: number, empresaId: number) {
    return this.softDelete(this.prestamoRepo, 'prestamoId', prestamoId, empresaId, 'Prestamo');
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
    
    const movimiento = this.movimientoRepo.create({
      fecharegistro: new Date(),
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
      usuarioCreated: currentUser,
    });

    const saved = await this.movimientoRepo.save(movimiento);

    this.eventEmitter.emit('cxc.movimiento.creado', { movimiento: saved, origen: 'facturacion', factura });

    return saved;
  }

  async anularMovimientoFactura(facturaId: number, nrofactura: number, empresaId: number, currentUser: string): Promise<void> {
    const movimientos = await this.movimientoRepo.find({
      where: { nroreferencia: nrofactura.toString(), moduloId: 3, empresaId } as FindOptionsWhere<CxcMovimiento>,
    });

    for (const mov of movimientos) {
      mov.sn_doc_anulado = 'S';
      mov.fec_anulacion = new Date();
      mov.usuarioUpdated = currentUser;
      mov.fechaUpdated = new Date();
      await this.movimientoRepo.save(mov);
    }

    this.eventEmitter.emit('cxc.movimiento.anulado', { facturaId, empresaId, currentUser });
  }

  async anularCajaPorFactura(facturaId: number, nrofactura: number, empresaId: number, currentUser: string): Promise<void> {
    const cajas = await this.cajaMaeRepo.find({
      where: { nrodocumento: nrofactura.toString(), moduloId: 4, empresaId } as FindOptionsWhere<CxccajaMae>,
    });

    for (const caja of cajas) {
      caja.sn_anulado = 'S';
      caja.fec_anulacion = new Date();
      caja.usuarioUpdated = currentUser;
      caja.fechaUpdated = new Date();
      await this.cajaMaeRepo.save(caja);

      const detalles = await this.cajaDetRepo.find({
        where: { cxccajaId: caja.cxccajaId, empresaId } as FindOptionsWhere<CxccajaDet>,
      });

      for (const det of detalles) {
        det.sn_anulado = 'S';
        det.fec_anulacion = new Date();
        det.usuarioUpdated = currentUser;
        det.fechaUpdated = new Date();
        await this.cajaDetRepo.save(det);
      }

      const movsCaja = await this.movimientoRepo.find({
        where: { documentoId: caja.cxccajaId, moduloId: 3, empresaId } as FindOptionsWhere<CxcMovimiento>,
      });

      for (const mov of movsCaja) {
        mov.sn_doc_anulado = 'S';
        mov.fec_anulacion = new Date();
        mov.usuarioUpdated = currentUser;
        mov.fechaUpdated = new Date();
        await this.movimientoRepo.save(mov);
      }
    }

    this.eventEmitter.emit('cxc.caja.anulada', { facturaId, empresaId, currentUser });
  }

  async getAntiguedadSaldos(empresaId: number) {
    const hoy = new Date();
    const clientes = await this.clienteRepo.find({ where: { empresaId } as FindOptionsWhere<CxcCliente> });
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
      } else {
        item.total -= importe;
      }
    });

    return Array.from(mapaClientes.values()).filter(item => item.total > 0);
  }

  async getClientesConSaldo(empresaId: number) {
    const result = await this.getAntiguedadSaldos(empresaId);

    const clientesIds = result.map(r => r.clienteId);
    if (clientesIds.length === 0) return [];

    const clientes = await this.clienteRepo.find({
      where: { clienteId: { $in: clientesIds } } as any,
    });

    const mapaDir = new Map<number, any>();
    const dirs = await this.clienteDirRepo.find({ where: { empresaId } as FindOptionsWhere<CxccClientesDir> });
    dirs.forEach((d: any) => {
      const cid = d.clienteid ?? d.clienteId;
      if (cid && !mapaDir.has(cid)) {
        mapaDir.set(cid, d);
      }
    });

    const mapaTel = new Map<number, any>();
    const tels = await this.clienteTelRepo.find({ where: { empresaId } as FindOptionsWhere<CxcClienteTel> });
    tels.forEach(t => {
      if (!mapaTel.has(t.clienteId)) {
        mapaTel.set(t.clienteId, t);
      }
    });

    return result.map(item => {
      const cliente = clientes.find(c => c.clienteId === item.clienteId);
      const dir = mapaDir.get(item.clienteId) as any;
      const tel = mapaTel.get(item.clienteId) as any;
      return {
        ...item,
        direccion: dir ? `${dir.direccion1 || ''} ${dir.direccion2 || ''}`.trim() : '',
        telefono: tel ? tel.telefono || tel.celular || '' : '',
      };
    });
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

    return Array.from(mapaDocs.values())
      .map(doc => ({ ...doc, saldo: doc.importe - doc.pagado }))
      .filter(doc => doc.saldo > 0);
  }
}
