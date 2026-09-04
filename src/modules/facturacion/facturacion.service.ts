import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TPosCorrelativos } from './entities/poscorrelativos.entity';
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
import { CxccClientesDir } from '../cxc/entities/cxccclientesdir.entity';
import {
  CreatePosFacMaeDto, UpdatePosFacMaeDto,
  CreatePosCotMaeDto, UpdatePosCotMaeDto,
  CreatePosPedMaeDto, UpdatePosPedMaeDto,
  CheckoutTiendaDto,
  CheckoutPedidoDto,
} from './dto/facturacion.dto';
import { CxcService } from '../cxc/cxc.service';
import { KardexService } from '../inventario/kardex.service';
import { Tempresas } from '../companies/entities/empresa.entity';
import { TempresasDet } from '../companies/entities/empresasdet.entity';
import { TtipoParamFac } from '../parametros/entities/param-fac.entity';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TproductoImg } from '../inventario/entities/producto-img.entity';
import { getTransporter, getMailFrom } from '../../config/mail';

@Injectable()
export class FacturacionService {
  constructor(
    @InjectRepository(TPosCorrelativos) private readonly correlativosRepo: Repository<TPosCorrelativos>,
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
    @InjectRepository(CxccClientesDir) private readonly clienteDirRepo: Repository<CxccClientesDir>,
    @InjectRepository(Tempresas) private readonly empresaRepo: Repository<Tempresas>,
    @InjectRepository(TempresasDet) private readonly empresaDetRepo: Repository<TempresasDet>,
    @InjectRepository(TtipoParamFac) private readonly paramFacRepo: Repository<TtipoParamFac>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TproductoImg) private readonly productoImgRepo: Repository<TproductoImg>,
    @Inject(forwardRef(() => CxcService)) private readonly cxcService: CxcService,
    @Inject(forwardRef(() => KardexService)) private readonly kardexService: KardexService,
    private readonly eventEmitter: EventEmitter2,
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

  async findAllCorrelativos(empresaId: number) {
    return this.findAllByEmpresa(this.correlativosRepo, empresaId);
  }

  async findCorrelativo(poscorrelativosId: number, empresaId: number) {
    return this.findOneById(this.correlativosRepo, 'poscorrelativosId', poscorrelativosId, empresaId, 'Correlativo');
  }

  async createCorrelativo(dto: any, currentUser: string) {
    return this.createEntity(this.correlativosRepo, dto, currentUser);
  }

  async updateCorrelativo(poscorrelativosId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.correlativosRepo, 'poscorrelativosId', poscorrelativosId, empresaId, dto, currentUser, 'Correlativo');
  }

  async findAllFacturas(empresaId: number) {
    return this.findAllByEmpresaOrdered(this.facMaeRepo, empresaId, 'fecharegistro');
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

    if (!factura.direccion && (factura as any).clienteId) {
      const dirs = await this.clienteDirRepo.find({
        where: { clienteid: (factura as any).clienteId, empresaId, sn_activo: 'S' } as unknown as FindOptionsWhere<CxccClientesDir>,
      });
      (factura as any).direccion = dirs.length > 0 ? dirs[0].descripcion || 'N/A' : 'N/A';
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
    const productosMap = new Map(productos.map((p) => [p.produtoId, p.descripcion]));

    const detalles = detallesRaw.map((d) => ({
      ...d,
      descripcion: productosMap.get(d.productoId) || d.codbarra || `#${d.productoId}`,
    }));

    const empresa = await this.empresaRepo.findOne({ where: { empresaId } });
    const empresaDet = await this.empresaDetRepo.find({ where: { empresaId, sn_activo: 'S' } });
    const paramFac = await this.paramFacRepo.findOne({ where: { empresaId } });

    const rtn = empresaDet.find((d) => d.tipo === 'RTN')?.descripcion || null;
    const telefono = empresaDet.find((d) => d.tipo === 'TELEFONO')?.descripcion || null;
    const direccion = empresaDet.find((d) => d.tipo === 'DIRECCION')?.descripcion || null;

    return {
      factura,
      detalles,
      pagos,
      empresa: {
        nombre: empresa?.descripcion || 'EMPRESA',
        rtn,
        telefono,
        direccion,
        mensajeFactura: empresa?.msjfactura || paramFac?.mensajeFactura || '',
        mensajeDevolucion: empresa?.msjdevfactura || '',
      },
    };
  }

  async createFactura(dto: CreatePosFacMaeDto, currentUser: string) {
    if (!dto.nrofactura) {
      dto.nrofactura = await this.asignarCorrelativo(dto.empresaId, currentUser);
    }
    const factura = await this.createEntity(this.facMaeRepo, dto, currentUser);

    if (dto.tipofactura === 'C') {
      try {
        await this.cxcService.generarMovimientoDesdeFactura(factura, currentUser);
      } catch (error) {
        console.error('Error generando movimiento CXC:', error);
      }
    }

    this.eventEmitter.emit('factura.creada', { factura, currentUser });

    return factura;
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

    console.log(`[procesarKardex] finalizado: procesados=${procesados}, errores=${errores.length}`);
    return { procesados, errores };
  }

  private async asignarCorrelativo(empresaId: number, currentUser: string): Promise<number> {
    const doc = await this.tipoDocFiscalRepo.findOne({
      where: { abreviatura: 'FAC', empresaId } as unknown as FindOptionsWhere<TCoTipoDocumentoFiscal>,
    });
    if (!doc) return 1;
    const actual = Number(doc.nrocorrelativo) || 0;
    doc.nrocorrelativo = actual + 1;
    doc.usuarioUpdated = currentUser;
    doc.fechaUpdated = new Date();
    await this.tipoDocFiscalRepo.save(doc);
    return actual;
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

    if (facturaOriginal.sn_contabilizada === 'S') {
      throw new BadRequestException('La factura esta contabilizada y no se puede anular');
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
      facturaOriginal.usuarioUpdated = currentUser;
      facturaOriginal.fechaUpdated = new Date();
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

  async findCotizacionDetByMaeId(poscotmaeId: number, empresaId: number) {
    return this.cotDetRepo.find({
      where: { poscotmaeId, empresaId } as unknown as FindOptionsWhere<TPosCotDet>,
      order: { poscotdetId: 'ASC' } as any,
    });
  }

  async deleteCotizacionDet(poscotdetId: number, empresaId: number) {
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

    const paramFac = await this.paramFacRepo.findOne({
      where: { empresaId } as unknown as FindOptionsWhere<TtipoParamFac>,
    });
    const bodegaId = paramFac?.bodegaId || 1;
    const cajaId = paramFac?.cajaId || 1;

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
        interes: 0,
        moratorio: 0,
        sn_activo: 'S',
        categoria: 'A',
        empresaId,
        usuarioCreated: currentUser,
      })) as CxcCliente;
    }

    const nrofactura = await this.asignarCorrelativo(empresaId, currentUser);

    const facturaPayload: any = {
      nrofactura,
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
      empresaId,
    }, currentUser);

    try {
      await this.procesarKardexFactura(factura.facturaId, currentUser);
    } catch (error) {
      console.error('Error procesando kardex desde tienda:', error);
    }

    carrito.sn_estadocarrito = 'F';
    carrito.Nombrecliente = dto.nombrecliente;
    carrito.direccion = dto.direccion || '';
    carrito.usuarioUpdated = currentUser;
    carrito.fechaUpdated = new Date();
    await this.cotMaeRepo.save(carrito);

    this.eventEmitter.emit('factura.creada', { factura, currentUser });

    return { facturaId: factura.facturaId, nrofactura, total };
  }

  async findAllCotizacionDet(empresaId: number) {
    return this.findAllByEmpresa(this.cotDetRepo, empresaId);
  }

  async findCotizacionDet(poscotdetId: number, empresaId: number) {
    return this.findOneById(this.cotDetRepo, 'poscotdetId', poscotdetId, empresaId, 'Detalle Cotizacion');
  }

  async createCotizacionDet(dto: any, currentUser: string) {
    return this.createEntity(this.cotDetRepo, dto, currentUser);
  }

  async updateCotizacionDet(poscotdetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cotDetRepo, 'poscotdetId', poscotdetId, empresaId, dto, currentUser, 'Detalle Cotizacion');
  }

  async findAllPedidos(empresaId: number) {
    return this.findAllByEmpresaOrdered(this.pedMaeRepo, empresaId, 'fecharegistro');
  }

  async findPedido(pospedmaeId: number, empresaId: number) {
    return this.findOneById(this.pedMaeRepo, 'pospedmaeId', pospedmaeId, empresaId, 'Pedido');
  }

  async createPedido(dto: CreatePosPedMaeDto, currentUser: string) {
    return this.createEntity(this.pedMaeRepo, dto, currentUser);
  }

  async updatePedido(pospedmaeId: number, empresaId: number, dto: UpdatePosPedMaeDto, currentUser: string) {
    return this.updateEntity(this.pedMaeRepo, 'pospedmaeId', pospedmaeId, empresaId, dto, currentUser, 'Pedido');
  }

  async findAllPedidoDet(empresaId: number) {
    return this.findAllByEmpresa(this.pedDetRepo, empresaId);
  }

  async findPedidoDet(pospeddetId: number, empresaId: number) {
    return this.findOneById(this.pedDetRepo, 'pospeddetId', pospeddetId, empresaId, 'Detalle Pedido');
  }

  async createPedidoDet(dto: any, currentUser: string) {
    return this.createEntity(this.pedDetRepo, dto, currentUser);
  }

  async updatePedidoDet(pospeddetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.pedDetRepo, 'pospeddetId', pospeddetId, empresaId, dto, currentUser, 'Detalle Pedido');
  }

  async findPedidoDetByPedidoId(pospedmaeId: number, empresaId: number) {
    const detalles = await this.pedDetRepo.find({
      where: { pospedmaeId } as unknown as FindOptionsWhere<TPosPedDet>,
    });
    return detalles;
  }

  async deletePedido(pospedmaeId: number, empresaId: number) {
    const detalles = await this.pedDetRepo.find({
      where: { pospedmaeId } as unknown as FindOptionsWhere<TPosPedDet>,
    });
    for (const det of detalles) {
      await this.pedDetRepo.remove(det);
    }
    const entity = await this.findOneById(this.pedMaeRepo, 'pospedmaeId', pospedmaeId, empresaId, 'Pedido');
    await this.pedMaeRepo.remove(entity);
    return { deleted: true };
  }

  async deletePedidoDet(pospeddetId: number, empresaId: number) {
    const entity = await this.findOneById(this.pedDetRepo, 'pospeddetId', pospeddetId, empresaId, 'Detalle Pedido');
    await this.pedDetRepo.remove(entity);
    return { deleted: true };
  }

  async checkoutPedido(dto: CheckoutPedidoDto, currentUser: string) {
    const pedido = await this.pedMaeRepo.findOne({
      where: { pospedmaeId: dto.pospedmaeId } as unknown as FindOptionsWhere<TPosPedMae>,
    });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.sn_facturado === 'S') throw new BadRequestException('El pedido ya fue facturado');

    const empresaId = pedido.empresaId;

    const detalles = await this.pedDetRepo.find({
      where: { pospedmaeId: dto.pospedmaeId } as unknown as FindOptionsWhere<TPosPedDet>,
    });
    if (detalles.length === 0) throw new BadRequestException('El pedido está vacío');

    const paramFac = await this.paramFacRepo.findOne({
      where: { empresaId } as unknown as FindOptionsWhere<TtipoParamFac>,
    });
    const bodegaId = paramFac?.bodegaId || 1;
    const cajaId = paramFac?.cajaId || 1;

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
        interes: 0,
        moratorio: 0,
        sn_activo: 'S',
        categoria: 'A',
        empresaId,
        usuarioCreated: currentUser,
      })) as CxcCliente;
    }

    const nrofactura = await this.asignarCorrelativo(empresaId, currentUser);

    const facturaPayload: any = {
      nrofactura,
      tipofactura: 'E',
      clienteId: clienteTienda.clienteId,
      nrocliente: clienteTienda.nrocliente,
      nombrecliente: dto.nombrecliente,
      direccion: '',
      factordecambio: 1,
      subTotal,
      impuesto: impuestoTotal,
      descuento: descuentoTotal,
      total,
      efectivo_recibido: dto.efectivo_recibido || total,
      importe_cambio: (dto.efectivo_recibido || total) - total,
      diascredito: 0,
      bodegaId,
      cajaId,
      gestorId: null,
      sn_excenta: 'N',
      sn_pagada: 'S',
      sn_anulada: 'N',
      sn_contabilizada: 'N',
      empresaId,
    };

    const factura = await this.createEntity(this.facMaeRepo, facturaPayload, currentUser);

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

    try {
      await this.procesarKardexFactura(factura.facturaId, currentUser);
    } catch (error) {
      console.error('Error procesando kardex desde pedido:', error);
    }

    pedido.sn_facturado = 'S';
    pedido.facturaId = factura.facturaId;
    pedido.usuarioUpdated = currentUser;
    pedido.fechaUpdated = new Date();
    await this.pedMaeRepo.save(pedido);

    this.eventEmitter.emit('factura.creada', { factura, currentUser });

    return { facturaId: factura.facturaId, nrofactura, total };
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

  async createComboDet(dto: any, currentUser: string) {
    return this.createEntity(this.cboDetRepo, dto, currentUser);
  }

  async updateComboDet(poscbodetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cboDetRepo, 'poscbodetId', poscbodetId, empresaId, dto, currentUser, 'Detalle Combo');
  }

  async removeComboDet(poscbodetId: number, empresaId: number) {
    return this.cboDetRepo.delete({ poscbodetId, empresaId } as any);
  }

  async removeCombo(poscbomaeId: number, empresaId: number) {
    await this.cboDetRepo.delete({ poscbomaeId, empresaId } as any);
    return this.cboMaeRepo.delete({ poscbomaeId, empresaId } as any);
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

    return '<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">'
      + '<h2 style="color:#10b981;margin-bottom:5px">' + nombre + '</h2>'
      + (rtn ? '<p style="color:#64748b;margin:0">RTN: ' + rtn + '</p>' : '')
      + (dirEmp ? '<p style="color:#64748b;margin:0">' + dirEmp + '</p>' : '')
      + (tel ? '<p style="color:#64748b;margin:0">Tel: ' + tel + '</p>' : '')
      + '<hr style="border:1px solid #e2e8f0">'
      + '<h3 style="margin:10px 0">Factura #' + nroFact + '</h3>'
      + '<p><strong>Cliente:</strong> ' + cliente + '</p>'
      + '<p><strong>Direccion:</strong> ' + dirCli + '</p>'
      + '<p><strong>Fecha:</strong> ' + fecha + '</p>'
      + '<p><strong>Tipo:</strong> ' + tipo + ' | <strong>Estado:</strong> ' + (f.sn_pagada === 'S' ? 'Pagada' : 'Pendiente') + '</p>'
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


