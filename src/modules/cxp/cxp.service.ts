import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TCxpProveedor } from './entities/proveedor.entity';
import { TCxpProveedorDir } from './entities/proveedordir.entity';
import { TCxpProveedorTel } from './entities/proveedortel.entity';
import { TCxpCompraMae } from './entities/compra-mae.entity';
import { TCxpCompraDet } from './entities/compra-det.entity';
import { TCxpMovimiento } from './entities/movimiento.entity';
import { TCxpHistorico } from './entities/historico.entity';
import { TCxpSaldoAv } from './entities/saldoav.entity';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { KardexService } from '../inventario/kardex.service';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TPosPrecioVtas } from '../facturacion/entities/tpospreciovtas.entity';
import { Tmodulos } from '../modules/entities/modulo.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';

@Injectable()
export class CxpService {
  constructor(
    @InjectRepository(TCxpProveedor) private readonly proveedorRepo: Repository<TCxpProveedor>,
    @InjectRepository(TCxpProveedorDir) private readonly proveedorDirRepo: Repository<TCxpProveedorDir>,
    @InjectRepository(TCxpProveedorTel) private readonly proveedorTelRepo: Repository<TCxpProveedorTel>,
    @InjectRepository(TCxpCompraMae) private readonly compraMaeRepo: Repository<TCxpCompraMae>,
    @InjectRepository(TCxpCompraDet) private readonly compraDetRepo: Repository<TCxpCompraDet>,
    @InjectRepository(TCxpMovimiento) private readonly movimientoRepo: Repository<TCxpMovimiento>,
    @InjectRepository(TCxpHistorico) private readonly historicoRepo: Repository<TCxpHistorico>,
    @InjectRepository(TCxpSaldoAv) private readonly saldoAvRepo: Repository<TCxpSaldoAv>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TPosPrecioVtas) private readonly posPrecioVtaRepo: Repository<TPosPrecioVtas>,
    @InjectRepository(Tmodulos) private readonly moduloRepo: Repository<Tmodulos>,
    @InjectRepository(TCoTipoDocumentoFiscal) private readonly tipoDocFiscalRepo: Repository<TCoTipoDocumentoFiscal>,
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
    @Inject(forwardRef(() => KardexService)) private readonly kardexService: KardexService,
    private readonly eventEmitter: EventEmitter2,
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

  async createProveedor(dto: CreateProveedorDto, currentUser: string) {
    // Auto-generar nroproveedor desde ttipoparametros (moduloId=5)
    const getParam = async (field: string, def: any) => {
      try {
        const row = await this.tipoParametroRepo.findOne({
          where: { empresaId: dto.empresaId, moduloId: 5, field, sn_activo: 'S' } as any,
        });
        return row ? (row.tipo === 'NUMBER' ? Number(row.valor) : row.valor) : def;
      } catch { return def; }
    };

    const nroActual = await getParam('nroproveedor', 0);
    const nro = Number(nroActual) + 1;
    const nroproveedor = dto.nroproveedor || String(nro).padStart(6, '0');

    const payload: any = {
      ...dto,
      nroproveedor,
      razonsocial: dto.razonsocial || `${dto.nombres} ${dto.apellidos}`,
      dni: dto.dni || '0000000000000',
    };

    const saved = await this.createEntity(this.proveedorRepo, payload, currentUser);

    // Incrementar contador
    try {
      await this.tipoParametroRepo
        .createQueryBuilder()
        .update(TipoParametro)
        .set({ valor: String(nro) })
        .where('empresaId = :eid AND moduloId = 5 AND field = :field', { eid: dto.empresaId, field: 'nroproveedor' })
        .execute();
    } catch (_) {}

    return saved;
  }

  async updateProveedor(proveedorId: number, empresaId: number, dto: UpdateProveedorDto, currentUser: string) {
    return this.updateEntity(this.proveedorRepo, 'proveedorId', proveedorId, empresaId, dto, currentUser, 'Proveedor');
  }

  async removeProveedor(proveedorId: number, empresaId: number) {
    return this.softDelete(this.proveedorRepo, 'proveedorId', proveedorId, empresaId, 'Proveedor');
  }

  async findAllProveedorDirs(empresaId: number) {
    return this.findAllByEmpresa(this.proveedorDirRepo, empresaId);
  }

  async findProveedorDir(proveedorId: number, empresaId: number) {
    return this.findOneById(this.proveedorDirRepo, 'proveedordireccionId', proveedorId, empresaId, 'Direccion Proveedor');
  }

  async createProveedorDir(dto: any, currentUser: string) {
    return this.createEntity(this.proveedorDirRepo, dto, currentUser);
  }

  async updateProveedorDir(proveedorId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.proveedorDirRepo, 'proveedordireccionId', proveedorId, empresaId, dto, currentUser, 'Direccion Proveedor');
  }

  async findAllProveedorTels(empresaId: number) {
    return this.findAllByEmpresa(this.proveedorTelRepo, empresaId);
  }

  async findProveedorTel(proveedorId: number, empresaId: number) {
    return this.findOneById(this.proveedorTelRepo, 'proveedorestelefonosId', proveedorId, empresaId, 'Telefono Proveedor');
  }

  async createProveedorTel(dto: any, currentUser: string) {
    return this.createEntity(this.proveedorTelRepo, dto, currentUser);
  }

  async updateProveedorTel(proveedorId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.proveedorTelRepo, 'proveedorestelefonosId', proveedorId, empresaId, dto, currentUser, 'Telefono Proveedor');
  }

  async findAllCompras(empresaId: number) {
    return this.findAllByEmpresa(this.compraMaeRepo, empresaId);
  }

  async findCompra(compraId: number, empresaId: number) {
    return this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');
  }

  async createCompra(dto: any, currentUser: string) {
    const compra = await this.createEntity<TCxpCompraMae>(this.compraMaeRepo, {
      TipoCompra: dto.TipoCompra || 'F',
      bodegaId: dto.bodegaId,
      proveedorId: dto.proveedorId,
      documentoId: dto.documentoId,
      nroreferencia: dto.nroreferencia,
      monedaId: dto.monedaId,
      factorcambio: dto.factorcambio || 1,
      subtotal: 0,
      descuento: 0,
      impuesto: 0,
      total: 0,
      sn_pagada: 'N',
      sn_cotabilizada: 'N',
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
    return compra;
  }

  private async actualizarTotalCompra(compraId: number, empresaId: number): Promise<void> {
    const detalles = await this.compraDetRepo.find({
      where: { compraId, empresaId } as unknown as FindOptionsWhere<TCxpCompraDet>,
    });
    const subtotal = detalles.reduce((sum, d) => sum + Number(d.subtotal || 0), 0);
    const compra = await this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');
    compra.subtotal = subtotal;
    compra.total = subtotal;
    await this.compraMaeRepo.save(compra);
  }

  async procesarCompra(compraId: number, empresaId: number, currentUser: string) {
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

    try {
      await this.registrarKardexEntrada(compraId, empresaId, currentUser);
    } catch (error) {
      console.error('Error registrando Kardex entrada compra:', error);
      throw error;
    }

    try {
      await this.crearMovimientoCxP(compra, currentUser);
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

  private async crearMovimientoCxP(compra: TCxpCompraMae, currentUser: string): Promise<void> {
    const proveedor = await this.findOneById(
      this.proveedorRepo, 'proveedorId', compra.proveedorId, compra.empresaId, 'Proveedor',
    );

    await this.createEntity(this.movimientoRepo, {
      bcoctasId: 0,
      moduloId: 2,
      documentoId: compra.documentoId || 1,
      proveedorId: compra.proveedorId,
      codproveedor: proveedor.nroproveedor,
      tipomov: 'D',
      nroreferencia: compra.compraId.toString(),
      descripcion1: `Compra #${compra.compraId}`,
      descripcion2: proveedor.razonsocial || `${proveedor.nombres} ${proveedor.apellidos}`,
      importe: compra.total,
      sn_chq: 'N',
      sn_chq_anulado: 'N',
      sn_conciliado: 'N',
      sn_contabilizado: 'N',
      sn_doc_anulado: 'N',
      empresaId: compra.empresaId,
    }, currentUser);
  }

  async updateCompra(compraId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.compraMaeRepo, 'compraId', compraId, empresaId, dto, currentUser, 'Compra');
  }

  async deleteCompra(compraId: number, empresaId: number, currentUser: string) {
    const compra = await this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');
    if (compra.sn_anulada === 'S') {
      throw new BadRequestException('La compra ya está anulada');
    }
    compra.sn_anulada = 'S';
    compra.usuarioUpdated = currentUser;
    compra.fechaUpdated = new Date();
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
        mov.fec_anulacion = new Date();
        mov.usuarioUpdated = currentUser;
        mov.fechaUpdated = new Date();
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
    return this.createEntity(this.movimientoRepo, dto, currentUser);
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
      .addSelect('COALESCE(a.descripcion1, a.descripcion2, \'\')', 'concepto')
      .addSelect('a.sn_doc_anulado', 'sn_doc_anulado')
      .addSelect('a.sn_contabilizado', 'sn_contabilizado')
      .addSelect('a.bcomovId', 'bcomovId')
      .addSelect('a.documentoId', 'documentoId')
      .innerJoin('proveedor', 'b', 'b.proveedorId = a.proveedorId')
      .innerJoin('tmodulos', 'c', 'c.moduloId = a.moduloId')
      .innerJoin('tcotipodocumentofiscal', 'd', 'd.tipodocumentofiscalId = a.documentoId')
      .where('a.empresaId = :empresaId', { empresaId })
      .orderBy('b.razonsocial', 'ASC')
      .addOrderBy('a.bcomovId', 'ASC');

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
}
