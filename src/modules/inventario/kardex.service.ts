import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TinvKardex } from './entities/kardex.entity';
import { TinvExistencia } from './entities/existencia.entity';
import { Tproducto } from './entities/producto.entity';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';

export interface KardexEntradaDto {
  bodegaId: number;
  productoId: number;
  cantidad: number;
  costoUnitario: number;
  nroreferencia: string;
  moduloId: number;
  tipomov: 'E';
  subtipoMov: 'C' | 'A' | 'T' | 'D' | 'O' | 'AN';
  empresaId: number;
  usuarioCreated: string;
  factordecambio?: number;
  codbarra?: string;
  FechaIngreso?: Date;
}

export interface KardexSalidaDto {
  bodegaId: number;
  productoId: number;
  cantidad: number;
  costoUnitario: number;
  nroreferencia: string;
  moduloId: number;
  tipomov: 'S';
  subtipoMov: 'V' | 'A' | 'T' | 'AN' | 'O';
  empresaId: number;
  usuarioCreated: string;
  factordecambio?: number;
  codbarra?: string;
}

export type KardexMovimientoDto = KardexEntradaDto | KardexSalidaDto;

@Injectable()
export class KardexService {
  constructor(
    @InjectRepository(TinvKardex)
    private readonly kardexRepo: Repository<TinvKardex>,
    @InjectRepository(TinvExistencia)
    private readonly existenciaRepo: Repository<TinvExistencia>,
    @InjectRepository(Tproducto)
    private readonly productoRepo: Repository<Tproducto>,
    private readonly eventEmitter: EventEmitter2,
    private readonly fechaSistema: FechaSistemaService,
  ) {}

  async registrarEntrada(dto: KardexEntradaDto): Promise<TinvKardex> {
    const existencia = await this.obtenerOCrearExistencia(dto.bodegaId, dto.productoId, dto.empresaId, dto.usuarioCreated);
    const saldoAnterior = Number(existencia.existencia) || 0;
    const saldoActual = saldoAnterior + dto.cantidad;
    const costoTotal = dto.cantidad * dto.costoUnitario;

    const kardex = this.kardexRepo.create({
      bodegaId: dto.bodegaId,
      productoId: dto.productoId,
      codbarra: dto.codbarra || '',
      FechaIngreso: dto.FechaIngreso || await this.fechaSistema.getFecha(dto.empresaId),
      factordecambio: dto.factordecambio || 1,
      cantidad: dto.cantidad,
      existencia: saldoActual,
      costoUnitario: dto.costoUnitario,
      subTotal: costoTotal,
      saldoAnterior,
      saldoActual,
      costoTotal,
      costoUSD: dto.factordecambio ? costoTotal / dto.factordecambio : 0,
      subTotalUSD: dto.factordecambio ? costoTotal / dto.factordecambio : 0,
      nroreferencia: dto.nroreferencia,
      tipomov: 'E',
      moduloId: dto.moduloId,
      empresaId: dto.empresaId,
      usuarioCreated: dto.usuarioCreated,
    });

    const saved = await this.kardexRepo.save(kardex);

    await this.actualizarExistencia(dto.bodegaId, dto.productoId, dto.empresaId, saldoActual, dto.costoUnitario, dto.usuarioCreated);

    this.eventEmitter.emit('kardex.entrada.registrada', { kardex: saved, dto });

    return saved;
  }

  async registrarSalida(dto: KardexSalidaDto): Promise<TinvKardex> {
    const existencia = await this.obtenerOCrearExistencia(dto.bodegaId, dto.productoId, dto.empresaId, dto.usuarioCreated);
    const saldoAnterior = Number(existencia.existencia) || 0;
    
    if (saldoAnterior < dto.cantidad) {
      throw new Error(`Stock insuficiente. Disponible: ${saldoAnterior}, Solicitado: ${dto.cantidad}`);
    }

    const saldoActual = saldoAnterior - dto.cantidad;
    const costoTotal = dto.cantidad * dto.costoUnitario;

    const kardex = this.kardexRepo.create({
      bodegaId: dto.bodegaId,
      productoId: dto.productoId,
      codbarra: dto.codbarra || '',
      FechaIngreso: await this.fechaSistema.getFecha(dto.empresaId),
      factordecambio: dto.factordecambio || 1,
      cantidad: dto.cantidad,
      existencia: saldoActual,
      costoUnitario: dto.costoUnitario,
      subTotal: costoTotal,
      saldoAnterior,
      saldoActual,
      costoTotal,
      costoUSD: dto.factordecambio ? costoTotal / dto.factordecambio : 0,
      subTotalUSD: dto.factordecambio ? costoTotal / dto.factordecambio : 0,
      nroreferencia: dto.nroreferencia,
      tipomov: 'S',
      moduloId: dto.moduloId,
      empresaId: dto.empresaId,
      usuarioCreated: dto.usuarioCreated,
    });

    const saved = await this.kardexRepo.save(kardex);

    await this.actualizarExistencia(dto.bodegaId, dto.productoId, dto.empresaId, saldoActual, dto.costoUnitario, dto.usuarioCreated);

    this.eventEmitter.emit('kardex.salida.registrada', { kardex: saved, dto });

    return saved;
  }

  async registrarMovimiento(dto: KardexMovimientoDto): Promise<TinvKardex> {
    if (dto.tipomov === 'E') {
      return this.registrarEntrada(dto as KardexEntradaDto);
    }
    return this.registrarSalida(dto as KardexSalidaDto);
  }

  private async obtenerOCrearExistencia(bodegaId: number, productoId: number, empresaId: number, usuario: string): Promise<TinvExistencia> {
    let existencia = await this.existenciaRepo.findOne({
      where: { bodegaId, productoId, empresaId } as FindOptionsWhere<TinvExistencia>,
    });

    if (!existencia) {
      const producto = await this.productoRepo.findOne({
        where: { produtoId: productoId, empresaId } as FindOptionsWhere<Tproducto>,
      });
      existencia = this.existenciaRepo.create({
        bodegaId,
        productoId,
        empresaId,
        existencia: 0,
        costounitario: (producto as any)?.cstounit || 0,
        precioventa: producto?.precioventa || 0,
        usuarioCreated: usuario,
      });
      await this.existenciaRepo.save(existencia);
    }

    return existencia;
  }

  private async actualizarExistencia(
    bodegaId: number,
    productoId: number,
    empresaId: number,
    nuevaExistencia: number,
    costoUnitario: number,
    usuarioUpdated: string,
  ): Promise<void> {
    await this.existenciaRepo
      .createQueryBuilder()
      .update(TinvExistencia)
      .set({
        existencia: nuevaExistencia,
        costounitario: costoUnitario,
        usuarioUpdated,
        fechaUpdated: await this.fechaSistema.getFecha(empresaId) as any,
      })
      .where('bodegaId = :bodegaId AND productoId = :productoId AND empresaId = :empresaId', {
        bodegaId,
        productoId,
        empresaId,
      })
      .execute();
  }

  async consultarKardex(filtros: {
    empresaId: number;
    bodegaId?: number;
    productoId?: number;
    fechaDesde?: Date;
    fechaHasta?: Date;
    tipomov?: 'E' | 'S';
    moduloId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: TinvKardex[]; total: number }> {
    const qb = this.kardexRepo.createQueryBuilder('k');
    qb.where('k.empresaId = :empresaId', { empresaId: filtros.empresaId });

    if (filtros.bodegaId) qb.andWhere('k.bodegaId = :bodegaId', { bodegaId: filtros.bodegaId });
    if (filtros.productoId) qb.andWhere('k.productoId = :productoId', { productoId: filtros.productoId });
    if (filtros.fechaDesde) qb.andWhere('k.fecharegistro >= :fechaDesde', { fechaDesde: filtros.fechaDesde });
    if (filtros.fechaHasta) qb.andWhere('k.fecharegistro <= :fechaHasta', { fechaHasta: filtros.fechaHasta });
    if (filtros.tipomov) qb.andWhere('k.tipomov = :tipomov', { tipomov: filtros.tipomov });
    if (filtros.moduloId) qb.andWhere('k.moduloId = :moduloId', { moduloId: filtros.moduloId });

    qb.orderBy('k.fecharegistro', 'DESC');
    qb.addOrderBy('k.invkardexId', 'DESC');

    const page = filtros.page || 1;
    const limit = filtros.limit || 50;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async obtenerSaldoActual(bodegaId: number, productoId: number, empresaId: number): Promise<number> {
    const existencia = await this.existenciaRepo.findOne({
      where: { bodegaId, productoId, empresaId } as FindOptionsWhere<TinvExistencia>,
    });
    return Number(existencia?.existencia) || 0;
  }

  async recalcularExistencias(empresaId: number, stockInicial: number = 0): Promise<{ productos: number; registros: number; detalle: any[] }> {
    const kardex = await this.kardexRepo.find({
      where: { empresaId } as FindOptionsWhere<TinvKardex>,
      order: { fecharegistro: 'ASC', invkardexId: 'ASC' },
    });

    const mapa = new Map<number, Map<number, { existencia: number; costoUnitario: number; bodegaId: number }>>();

    for (const k of kardex) {
      const prodId = Number(k.productoId);
      const bodegaId = Number(k.bodegaId);

      if (!mapa.has(bodegaId)) mapa.set(bodegaId, new Map());
      const bodegaMap = mapa.get(bodegaId)!;

      if (!bodegaMap.has(prodId)) {
        const initStock = stockInicial > 0 ? stockInicial : 0;
        bodegaMap.set(prodId, { existencia: initStock, costoUnitario: 0, bodegaId });
      }

      const estado = bodegaMap.get(prodId)!;
      const cant = Number(k.cantidad) || 0;
      const saldoAnt = Math.round(estado.existencia);

      if (k.tipomov === 'E') {
        estado.existencia += cant;
      } else {
        estado.existencia -= cant;
      }

      estado.costoUnitario = Number(k.costoUnitario) || 0;

      await this.kardexRepo.createQueryBuilder()
        .update()
        .set({
          saldoAnterior: saldoAnt,
          saldoActual: Math.round(estado.existencia),
          existencia: Math.round(estado.existencia),
        })
        .where('invkardexId = :id', { id: k.invkardexId })
        .execute();
    }

    const detalle: any[] = [];

    for (const [bodegaId, bodegaMap] of mapa) {
      for (const [prodId, estado] of bodegaMap) {
        const exist = await this.existenciaRepo.findOne({
          where: { bodegaId, productoId: prodId, empresaId } as FindOptionsWhere<TinvExistencia>,
        });

        const anterior = exist ? Number(exist.existencia) : 0;
        const nueva = Math.round(estado.existencia);

        if (exist) {
          await this.existenciaRepo.createQueryBuilder()
            .update()
            .set({
              existencia: nueva,
              costounitario: estado.costoUnitario,
              usuarioUpdated: 'admin',
            })
            .where('invexistenciaId = :id', { id: exist.invexistenciaId })
            .execute();
        } else {
          await this.existenciaRepo.save(this.existenciaRepo.create({
            bodegaId,
            productoId: prodId,
            empresaId,
            existencia: nueva,
            costounitario: estado.costoUnitario,
            usuarioCreated: 'admin',
          }));
        }

        detalle.push({ bodegaId, productoId: prodId, anterior, nueva, diferencia: nueva - anterior });
      }
    }

    return { productos: mapa.size, registros: kardex.length, detalle };
  }
}