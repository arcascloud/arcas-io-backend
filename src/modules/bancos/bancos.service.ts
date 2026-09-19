import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Tbanco } from './entities/banco.entity';
import { TbcoCta } from './entities/bco-cta.entity';
import { TbcoConciliacion } from './entities/bco-conciliacion.entity';
import { TbcoConciliacionDet } from './entities/bco-conciliacion-det.entity';
import { TbcoDireccion } from './entities/bco-direccion.entity';
import { TbcoTelefono } from './entities/bco-telefono.entity';
import { TbcoMovimiento } from './entities/bco-movimiento.entity';
import { TCxpCompraMae } from '../cxp/entities/compra-mae.entity';
import { TCxpMovimiento } from '../cxp/entities/movimiento.entity';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { CreateBancoDto, UpdateBancoDto, CreateBcoCtaDto, UpdateBcoCtaDto, CreateBcoMovimientoDto, UpdateBcoMovimientoDto, EmitirChequeDto, EmitirChequeParticularDto, CreateConciliacionDto } from './dto/banco.dto';

@Injectable()
export class BancosService {
  constructor(
    @InjectRepository(Tbanco) private readonly bancoRepo: Repository<Tbanco>,
    @InjectRepository(TbcoCta) private readonly bcoCtaRepo: Repository<TbcoCta>,
    @InjectRepository(TbcoConciliacion) private readonly bcoConciliacionRepo: Repository<TbcoConciliacion>,
    @InjectRepository(TbcoConciliacionDet) private readonly bcoConciliacionDetRepo: Repository<TbcoConciliacionDet>,
    @InjectRepository(TbcoDireccion) private readonly bcoDireccionRepo: Repository<TbcoDireccion>,
    @InjectRepository(TbcoTelefono) private readonly bcoTelefonoRepo: Repository<TbcoTelefono>,
    @InjectRepository(TbcoMovimiento) private readonly bcoMovimientoRepo: Repository<TbcoMovimiento>,
    @InjectRepository(TCxpCompraMae) private readonly compraMaeRepo: Repository<TCxpCompraMae>,
    @InjectRepository(TCxpMovimiento) private readonly cxpMovimientoRepo: Repository<TCxpMovimiento>,
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
    private readonly fechaSistema: FechaSistemaService,
    private readonly dataSource: DataSource,
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
  ) {
    const entity = repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    return repo.save(entity);
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
    const now = await this.fechaSistema.getFecha(empresaId);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: now,
    });
    return repo.save(entity);
  }

  async findAllBancos(empresaId: number) {
    return this.findAllByEmpresa(this.bancoRepo, empresaId);
  }

  async findBanco(bancoId: number, empresaId: number) {
    return this.findOneById(this.bancoRepo, 'bancoId', bancoId, empresaId, 'Banco');
  }

  async createBanco(dto: CreateBancoDto, currentUser: string) {
    return this.createEntity(this.bancoRepo, dto, currentUser);
  }

  async updateBanco(bancoId: number, empresaId: number, dto: UpdateBancoDto, currentUser: string) {
    return this.updateEntity(this.bancoRepo, 'bancoId', bancoId, empresaId, dto, currentUser, 'Banco');
  }

  async removeBanco(bancoId: number, empresaId: number) {
    return this.softDelete(this.bancoRepo, 'bancoId', bancoId, empresaId, 'Banco');
  }

  async findAllCtas(empresaId: number) {
    return this.findAllByEmpresa(this.bcoCtaRepo, empresaId);
  }

  async findCta(bcoctasId: number, empresaId: number) {
    return this.findOneById(this.bcoCtaRepo, 'bcoctasId', bcoctasId, empresaId, 'Cuenta Banco');
  }

  async createCta(dto: CreateBcoCtaDto, currentUser: string) {
    return this.createEntity(this.bcoCtaRepo, dto, currentUser);
  }

  async updateCta(bcoctasId: number, empresaId: number, dto: UpdateBcoCtaDto, currentUser: string) {
    return this.updateEntity(this.bcoCtaRepo, 'bcoctasId', bcoctasId, empresaId, dto, currentUser, 'Cuenta Banco');
  }

  async removeCta(bcoctasId: number, empresaId: number) {
    return this.softDelete(this.bcoCtaRepo, 'bcoctasId', bcoctasId, empresaId, 'Cuenta Banco');
  }

  async findAllConciliaciones(empresaId: number) {
    return this.bcoConciliacionRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<TbcoConciliacion>,
      order: { fecharegistro: 'DESC' } as any,
    });
  }

  async findConciliacion(bcoconcilacionId: number, empresaId: number) {
    return this.findOneById(this.bcoConciliacionRepo, 'bcoconcilacionId', bcoconcilacionId, empresaId, 'Conciliacion');
  }

  async createConciliacion(dto: any, currentUser: string) {
    return this.createEntity(this.bcoConciliacionRepo, dto, currentUser);
  }

  async updateConciliacion(bcoconcilacionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.bcoConciliacionRepo, 'bcoconcilacionId', bcoconcilacionId, empresaId, dto, currentUser, 'Conciliacion');
  }

  async findAllConciliacionesDet(empresaId: number) {
    return this.findAllByEmpresa(this.bcoConciliacionDetRepo, empresaId);
  }

  async findConciliacionDet(bcosdetconciliacionId: number, empresaId: number) {
    return this.findOneById(this.bcoConciliacionDetRepo, 'bcosdetconciliacionId', bcosdetconciliacionId, empresaId, 'Detalle Conciliacion');
  }

  async createConciliacionDet(dto: any, currentUser: string) {
    return this.createEntity(this.bcoConciliacionDetRepo, dto, currentUser);
  }

  async updateConciliacionDet(bcosdetconciliacionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.bcoConciliacionDetRepo, 'bcosdetconciliacionId', bcosdetconciliacionId, empresaId, dto, currentUser, 'Detalle Conciliacion');
  }

  async findAllDirecciones(empresaId: number) {
    return this.findAllByEmpresa(this.bcoDireccionRepo, empresaId);
  }

  async findDireccion(bcosdireccionid: number, empresaId: number) {
    return this.findOneById(this.bcoDireccionRepo, 'bcosdireccionid', bcosdireccionid, empresaId, 'Direccion Banco');
  }

  async createDireccion(dto: any, currentUser: string) {
    return this.createEntity(this.bcoDireccionRepo, dto, currentUser);
  }

  async updateDireccion(bcosdireccionid: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.bcoDireccionRepo, 'bcosdireccionid', bcosdireccionid, empresaId, dto, currentUser, 'Direccion Banco');
  }

  async findAllTelefonos(empresaId: number) {
    return this.findAllByEmpresa(this.bcoTelefonoRepo, empresaId);
  }

  async findTelefono(bancotelefonoId: number, empresaId: number) {
    return this.findOneById(this.bcoTelefonoRepo, 'bancotelefonoId', bancotelefonoId, empresaId, 'Telefono Banco');
  }

  async createTelefono(dto: any, currentUser: string) {
    return this.createEntity(this.bcoTelefonoRepo, dto, currentUser);
  }

  async updateTelefono(bancotelefonoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.bcoTelefonoRepo, 'bancotelefonoId', bancotelefonoId, empresaId, dto, currentUser, 'Telefono Banco');
  }

  // ── Movimientos bancarios ──────────────────────────────────

  async findAllMovimientos(empresaId: number, bcoctasId?: number) {
    const where: any = { empresaId };
    if (bcoctasId) where.bcoctasId = bcoctasId;
    return this.bcoMovimientoRepo.find({
      where,
      order: { fecharegistro: 'DESC' } as any,
    });
  }

  async findCheques(empresaId: number, bcoctasId?: number) {
    const qb = this.bcoMovimientoRepo.createQueryBuilder('m')
      .innerJoin('bcosctas', 'ct', 'ct.bcoctasId = m.bcoctasId')
      .innerJoin('bcos', 'b', 'b.bancoId = ct.bancoId')
      .select([
        'm.bcomovimientosId AS bcomovimientosId',
        'm.fecharegistro AS fecharegistro',
        'm.nrochq AS nrochq',
        'm.importe AS importe',
        'm.concepto AS concepto',
        'm.sn_doc_anulado AS sn_doc_anulado',
        'm.bcoctasId AS bcoctasId',
        'ct.nrocuenta AS nrocuenta',
        'b.descripcion AS bancoNombre',
      ])
      .where('m.empresaId = :empresaId', { empresaId })
      .andWhere('m.nrochq IS NOT NULL')
      .andWhere('m.nrochq != :empty', { empty: '' })
      .andWhere('m.tipomov = :tipomov', { tipomov: 'PAGO' })
      .orderBy('m.fecharegistro', 'DESC');

    if (bcoctasId) {
      qb.andWhere('m.bcoctasId = :bcoctasId', { bcoctasId });
    }

    return qb.getRawMany();
  }

  async findMovimiento(bcomovimientosId: number, empresaId: number) {
    return this.findOneById(this.bcoMovimientoRepo, 'bcomovimientosId', bcomovimientosId, empresaId, 'Movimiento Bancario');
  }

  async createMovimiento(dto: CreateBcoMovimientoDto, currentUser: string) {
    const mov = await this.createEntity(this.bcoMovimientoRepo, dto, currentUser);
    this.eventEmitter.emit('bancos.movimiento.creado', {
      movimiento: mov,
      origen: 'createMovimiento',
    });
    return mov;
  }

  async updateMovimiento(bcomovimientosId: number, empresaId: number, dto: UpdateBcoMovimientoDto, currentUser: string) {
    return this.updateEntity(this.bcoMovimientoRepo, 'bcomovimientosId', bcomovimientosId, empresaId, dto, currentUser, 'Movimiento Bancario');
  }

  // ── Anulación de movimiento bancario ──────────────────────

  async anularMovimiento(bcomovimientosId: number, empresaId: number, currentUser: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscar el movimiento bancario
      const movBanco = await queryRunner.manager.findOne(TbcoMovimiento, {
        where: { bcomovimientosId, empresaId } as any,
      });

      if (!movBanco) {
        throw new BadRequestException('Movimiento bancario no encontrado');
      }

      if ((movBanco as any).sn_doc_anulado === 'S') {
        throw new BadRequestException('El movimiento ya está anulado');
      }

      const now = await this.fechaSistema.getFecha(empresaId);
      const esCheque = !!(movBanco as any).nrochq && (movBanco as any).nrochq !== '';

      // 2. Anular bcosmovimientos
      await queryRunner.manager.update(
        TbcoMovimiento,
        { bcomovimientosId, empresaId } as any,
        { sn_doc_anulado: 'S', fec_anulacion: now } as any,
      );

      if (esCheque) {
        const nrochq = (movBanco as any).nrochq;

        // 3a. Anular cxpmovimientos vinculados al cheque
        await queryRunner.manager
          .createQueryBuilder()
          .update(TCxpMovimiento)
          .set({
            sn_chq_anulado: 'S',
            sn_chq: 'N',
            nrochq: null,
            sn_doc_anulado: 'S',
            fec_anulacion: now,
          } as any)
          .where('nrochq = :nrochq', { nrochq })
          .andWhere('empresaId = :empresaId', { empresaId })
          .execute();

        // 3b. Verificar si alguna compra queda sin pagar
        const movimientosCxP = await queryRunner.manager.find(TCxpMovimiento, {
          where: { nrochq, empresaId } as any,
        });

        const compraIds = [...new Set(movimientosCxP.map(m => m.nroreferencia).filter(Boolean))];

        for (const compraIdStr of compraIds) {
          const compraId = Number(compraIdStr);
          if (!compraId) continue;

          // Sumar pagos válidos (no anulados) para esta compra
          const totalPagado = await queryRunner.manager
            .createQueryBuilder(TCxpMovimiento, 'm')
            .select('COALESCE(SUM(m.importe), 0)', 'total')
            .where('m.nroreferencia = :compraId', { compraId: String(compraId) })
            .andWhere('m.empresaId = :empresaId', { empresaId })
            .andWhere('m.tipomov = :tipomov', { tipomov: 'C' })
            .andWhere('m.sn_doc_anulado != :anulado', { anulado: 'S' })
            .getRawOne();

          const compra = await queryRunner.manager.findOne(TCxpCompraMae, {
            where: { compraId, empresaId } as any,
          });

          if (compra) {
            const saldoTotal = Number(totalPagado?.total || 0);
            const totalCompra = Number((compra as any).total || 0);
            const pagada = saldoTotal >= totalCompra;

            await queryRunner.manager.update(
              TCxpCompraMae,
              { compraId, empresaId } as any,
              { sn_pagada: pagada ? 'S' : 'N', usuarioUpdated: currentUser, fechaUpdated: now } as any,
            );
          }
        }
      } else {
        // 3c. Movimiento no es cheque — solo anular cxpmovimientos vinculados por nroreferencia
        const nroref = (movBanco as any).nroreferencia;
        if (nroref) {
          await queryRunner.manager
            .createQueryBuilder()
            .update(TCxpMovimiento)
            .set({
              sn_doc_anulado: 'S',
              fec_anulacion: now,
            } as any)
            .where('nroreferencia = :nroref', { nroref })
            .andWhere('empresaId = :empresaId', { empresaId })
            .execute();
        }
      }

      await queryRunner.commitTransaction();

      return {
        mensaje: esCheque
          ? `Cheque #${(movBanco as any).nrochq} anulado — CxP y compra actualizados`
          : 'Movimiento bancario anulado',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Error al anular: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async removeMovimiento(bcomovimientosId: number, empresaId: number) {
    return this.softDelete(this.bcoMovimientoRepo, 'bcomovimientosId', bcomovimientosId, empresaId, 'Movimiento Bancario');
  }

  // ── Emisión de cheques ──────────────────────────────────────

  async emitirCheques(dto: EmitirChequeDto, currentUser: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const chequesEmitidos: any[] = [];
      const movimientosGuardados: TbcoMovimiento[] = [];
      const now = await this.fechaSistema.getFecha(dto.empresaId);

      // Obtener parámetro nrochq (una sola vez)
      let parametroNroChq = await this.tipoParametroRepo.findOne({
        where: { empresaId: dto.empresaId, field: 'nrochq' } as any,
      });

      if (!parametroNroChq) {
        const nuevo = this.tipoParametroRepo.create({
          empresaId: dto.empresaId,
          field: 'nrochq',
          tipo: 'NUMBER',
          valor: '0',
          moduloId: 6,
          Idsucursal: 0,
          usuarioCreated: currentUser,
        } as any);
        parametroNroChq = (await queryRunner.manager.save(nuevo)) as unknown as TipoParametro;
      }

      let nroChqActual = Number(parametroNroChq.valor) || 0;

      // ── Un cheque por cada proveedor ──
      for (const grupo of dto.grupos) {
        nroChqActual++;
        const nroChq = String(nroChqActual).padStart(10, '0');

        const nrosFacturas = grupo.facturas.map(f => f.nroReferencia || String(f.compraId)).join(', ');
        const conceptoBanco = `Pago a favor de ${grupo.beneficiario}, facturas: ${nrosFacturas}`;
        const conceptoCxP = `Chq ${nroChq} - ${nrosFacturas}`;
        const totalCheque = grupo.facturas.reduce((sum, f) => sum + (f.saldo || 0), 0);

        // 1. Movimiento bancario consolidado (1 solo por proveedor)
        const movBanco = queryRunner.manager.create(TbcoMovimiento, {
          bancoId: dto.bancoId,
          bcoctasId: dto.bcoctasId,
          moduloId: 2,
          tipomov: 'PAGO',
          dc_debitocredito: 'D',
          importe: totalCheque,
          nroreferencia: nroChq,
          nrochq: nroChq,
          factordecambio: 1,
          concepto: conceptoBanco,
          empresaId: dto.empresaId,
          usuarioCreated: currentUser,
        });
        await queryRunner.manager.save(movBanco);
        movimientosGuardados.push(movBanco);

        // 2. Movimientos CxP — 1 por cada factura del grupo
        const ctaOrigen = await this.bcoCtaRepo.findOne({ where: { bcoctasId: dto.bcoctasId } as any });
        for (const factura of grupo.facturas) {
          const movCxP = queryRunner.manager.create(TCxpMovimiento, {
            nrocuentabco: ctaOrigen?.nrocuenta || '',
            moduloId: 2,
            documentoId: 1,
            proveedorId: grupo.proveedorId,
            codproveedor: grupo.codproveedor,
            tipomov: 'C',
            nroreferencia: factura.compraId.toString(),
            concepto: conceptoCxP,
            descripcion2: grupo.beneficiario,
            importe: factura.saldo,
            nrochq: nroChq,
            sn_chq: 'S',
            empresaId: dto.empresaId,
            usuarioCreated: currentUser,
          });
          await queryRunner.manager.save(movCxP);

          // 3. Verificar si la factura quedó completamente pagada
          const totalPagado = await queryRunner.manager
            .createQueryBuilder(TCxpMovimiento, 'm')
            .select('COALESCE(SUM(m.importe), 0)', 'total')
            .where('m.nroreferencia = :compraId', { compraId: String(factura.compraId) })
            .andWhere('m.empresaId = :empresaId', { empresaId: dto.empresaId })
            .andWhere('m.tipomov = :tipomov', { tipomov: 'C' })
            .getRawOne();

          const compra = await queryRunner.manager.findOne(TCxpCompraMae, {
            where: { compraId: factura.compraId, empresaId: dto.empresaId } as any,
          });

          const saldoTotal = Number(totalPagado?.total || 0);
          const totalCompra = Number(compra?.total || 0);
          const pagada = saldoTotal >= totalCompra;

          await queryRunner.manager.update(
            TCxpCompraMae,
            { compraId: factura.compraId, empresaId: dto.empresaId } as any,
            { sn_pagada: pagada ? 'S' : 'N', usuarioUpdated: currentUser, fechaUpdated: now } as any,
          );
        }

        chequesEmitidos.push({
          nrochq: nroChq,
          proveedor: grupo.beneficiario,
          importe: totalCheque,
          concepto: conceptoBanco,
          facturas: grupo.facturas.map(f => ({
            compraId: f.compraId,
            nroReferencia: f.nroReferencia || String(f.compraId),
            saldo: f.saldo,
          })),
        });
      }

      // 4. Actualizar número de cheque en parámetros
      await queryRunner.manager.update(
        TipoParametro,
        { ttipoparametrosId: parametroNroChq.ttipoparametrosId } as any,
        { valor: String(nroChqActual), usuarioUpdate: currentUser, fechaUpdate: now } as any,
      );

      await queryRunner.commitTransaction();

      // Emitir eventos de contabilización después del commit
      for (const mov of movimientosGuardados) {
        this.eventEmitter.emit('bancos.movimiento.creado', {
          movimiento: mov,
          origen: 'emitirCheques',
        });
      }

      const totalGeneral = chequesEmitidos.reduce((sum, c) => sum + c.importe, 0);
      return {
        mensaje: `${chequesEmitidos.length} cheque(s) emitido(s) — L ${totalGeneral.toFixed(2)}`,
        cheques: chequesEmitidos,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Error al emitir cheques: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // ── Cheque a particular / empleado ──────────────────────────

  async emitirChequeParticular(dto: EmitirChequeParticularDto, currentUser: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = await this.fechaSistema.getFecha(dto.empresaId);

      // Obtener parámetro nrochq
      let parametroNroChq = await this.tipoParametroRepo.findOne({
        where: { empresaId: dto.empresaId, field: 'nrochq' } as any,
      });

      if (!parametroNroChq) {
        const nuevo = this.tipoParametroRepo.create({
          empresaId: dto.empresaId,
          field: 'nrochq',
          tipo: 'NUMBER',
          valor: '0',
          moduloId: 6,
          Idsucursal: 0,
          usuarioCreated: currentUser,
        } as any);
        parametroNroChq = (await queryRunner.manager.save(nuevo)) as unknown as TipoParametro;
      }

      const nroChqActual = Number(parametroNroChq.valor) + 1;
      const nroChq = String(nroChqActual).padStart(10, '0');

      // 1. Crear movimiento bancario (RETIRO - DÉBITO)
      const movBanco = queryRunner.manager.create(TbcoMovimiento, {
        bancoId: dto.bancoId,
        bcoctasId: dto.bcoctasId,
        moduloId: 2,
        tipomov: 'PAGO',
        dc_debitocredito: 'D',
        importe: dto.importe,
        nroreferencia: nroChq,
        nrochq: nroChq,
        factordecambio: 1,
        concepto: `Pago a ${dto.beneficiario} — ${dto.concepto}`,
        empresaId: dto.empresaId,
        usuarioCreated: currentUser,
      });
      await queryRunner.manager.save(movBanco);

      // 2. Actualizar nrochq
      await queryRunner.manager.update(
        TipoParametro,
        { ttipoparametrosId: parametroNroChq.ttipoparametrosId } as any,
        { valor: String(nroChqActual), usuarioUpdate: currentUser, fechaUpdate: now } as any,
      );

      await queryRunner.commitTransaction();

      // Emitir evento de contabilización después del commit
      this.eventEmitter.emit('bancos.movimiento.creado', {
        movimiento: movBanco,
        origen: 'emitirChequeParticular',
      });

      return {
        mensaje: `Cheque ${nroChq} emitido — ${dto.beneficiario} — L ${dto.importe.toFixed(2)}`,
        cheque: {
          nrochq: nroChq,
          proveedor: dto.beneficiario,
          importe: dto.importe,
          concepto: `Pago a ${dto.beneficiario} — ${dto.concepto}`,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Error al emitir cheque: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // ── Conciliación Bancaria ────────────────────────────────

  /**
   * Parsea CSV del estado de cuenta bancario.
   * Formato: Fecha,Concepto,Referencia,Debito,Credito
   */
  parsearCsvConciliacion(csvContent: string): any[] {
    const lineas = csvContent.split(/\r?\n/).filter(l => l.trim());
    const resultados: any[] = [];

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      if (i === 0 && !(/^\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/).test(linea.split(',')[0].trim())) {
        continue;
      }

      const partes = linea.split(',').map(p => p.trim().replace(/"/g, ''));
      if (partes.length < 5) continue;

      const [fecha, concepto, referencia, debito, credito] = partes;

      const impDebito = Number(debito) || 0;
      const impCredito = Number(credito) || 0;
      const importe = impDebito > 0 ? impDebito : impCredito;
      const naturaleza = impDebito > 0 ? 'D' : 'C';

      let fechaMov: Date | null = null;
      const matchFecha = fecha.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
      if (matchFecha) {
        const [, dia, mes, anio] = matchFecha;
        const year = anio.length === 2 ? `20${anio}` : anio;
        fechaMov = new Date(Number(year), Number(mes) - 1, Number(dia));
      }

      resultados.push({
        fecmovbco: fechaMov,
        concepto: concepto || '',
        nrorefencia: referencia || '',
        importe,
        naturaleza,
      });
    }

    return resultados;
  }

  /**
   * Matching entre líneas del CSV y movimientos bancarios.
   * Criterio: importe + referencia + naturaleza.
   */
  async realizarMatching(
    bcoctasId: number,
    empresaId: number,
    lineasCsv: any[],
    currentUser: string,
  ) {
    const movimientos = await this.bcoMovimientoRepo.find({
      where: {
        bcoctasId,
        empresaId,
        sn_doc_anulado: 'N',
      } as any,
    });

    const detalles: any[] = [];
    let totalConciliado = 0;
    let totalDiferencia = 0;
    let conciliados = 0;
    let diferencias = 0;

    for (const linea of lineasCsv) {
      const referencia = (linea.nrorefencia || '').trim();
      const importe = Number(linea.importe) || 0;

      const movMatch = movimientos.find(m => {
        const movRef = (m.nroreferencia || '').trim();
        const movImporte = Number(m.importe) || 0;
        return movRef === referencia && movImporte === importe && m.dc_debitocredito === linea.naturaleza;
      });

      const snConciliado = movMatch ? 'S' : 'N';
      const bcomovimientosId = movMatch?.bcomovimientosId || null;

      if (movMatch) {
        totalConciliado += importe;
        conciliados++;
      } else {
        totalDiferencia += importe;
        diferencias++;
      }

      detalles.push({
        fecmovbco: linea.fecmovbco,
        nrorefencia: referencia,
        concepto: linea.concepto,
        importe,
        naturaleza: linea.naturaleza,
        sn_conciliado: snConciliado,
        bcomovimientosId,
        empresaId,
        Idsucursal: 0,
        usuarioCreated: currentUser,
      });
    }

    return {
      detalles,
      resumen: {
        totalRegistros: lineasCsv.length,
        conciliados,
        diferencias,
        totalConciliado,
        totalDiferencia,
        totalEstadoCuenta: lineasCsv.reduce((s, l) => s + (Number(l.importe) || 0), 0),
      },
    };
  }

  /**
   * Guarda conciliación: crea bcosccmae + bcosccdet
   */
  async guardarConciliacion(dto: CreateConciliacionDto, currentUser: string) {
    const now = await this.fechaSistema.getFecha(dto.empresaId);

    const mae = this.bcoConciliacionRepo.create({
      ctabcoId: dto.ctabcoId,
      importe: dto.detalles.reduce((s, d) => s + (Number(d.importe) || 0), 0),
      sn_conciliado: 'S',
      fechaDesde: dto.fechaDesde,
      fechaHasta: dto.fechaHasta,
      saldoInicial: dto.saldoInicial || 0,
      saldoFinal: dto.saldoFinal || 0,
      empresaId: dto.empresaId,
      Idsucursal: dto.Idsucursal || 0,
      usuarioCreated: currentUser,
    } as any);
    const savedMae = await this.bcoConciliacionRepo.save(mae) as unknown as TbcoConciliacion;

    const detallesGuardados: any[] = [];
    for (const det of dto.detalles) {
      const detEntity = this.bcoConciliacionDetRepo.create({
        bcoconcilacionId: (savedMae as any).bcoconcilacionId,
        fecmovbco: det.fecmovbco,
        nrorefencia: det.nrorefencia,
        concepto: det.concepto,
        importe: det.importe,
        naturaleza: det.naturaleza,
        sn_conciliado: det.sn_conciliado || 'N',
        bcomovimientosId: det.bcomovimientosId || null,
        empresaId: dto.empresaId,
        Idsucursal: dto.Idsucursal || 0,
        usuarioCreated: currentUser,
      } as any);
      const savedDet = await this.bcoConciliacionDetRepo.save(detEntity);
      detallesGuardados.push(savedDet);
    }

    return {
      bcoconcilacionId: (savedMae as any).bcoconcilacionId,
      detalles: detallesGuardados,
    };
  }

  /**
   * Obtiene conciliación completa con detalles enriquecidos
   */
  async findConciliacionCompleta(bcoconcilacionId: number, empresaId: number) {
    const mae = await this.findOneById(
      this.bcoConciliacionRepo, 'bcoconcilacionId', bcoconcilacionId, empresaId, 'Conciliación',
    );

    const detalles = await this.bcoConciliacionDetRepo.find({
      where: { bcoconcilacionId, empresaId } as any,
    });

    const detallesEnriquecidos = await Promise.all(
      detalles.map(async (det) => {
        let movimiento: any = null;
        if (det.bcomovimientosId) {
          movimiento = await this.bcoMovimientoRepo.findOne({
            where: { bcomovimientosId: det.bcomovimientosId } as any,
          });
        }
        return { ...det, movimiento };
      }),
    );

    return { ...mae, detalles: detallesEnriquecidos };
  }

  /**
   * Elimina conciliación y sus detalles
   */
  async deleteConciliacion(bcoconcilacionId: number, empresaId: number, currentUser: string) {
    await this.bcoConciliacionDetRepo.delete({ bcoconcilacionId, empresaId } as any);
    await this.bcoConciliacionRepo.delete({ bcoconcilacionId, empresaId } as any);
    return { message: 'Conciliación eliminada' };
  }
}
