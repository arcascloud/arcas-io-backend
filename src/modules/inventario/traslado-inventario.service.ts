import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TInvTrasladoMae } from './entities/invtrasladomae.entity';
import { TInvTrasladoDet } from './entities/invtrasladodet.entity';
import { Tproducto } from './entities/producto.entity';
import { TinvExistencia } from './entities/existencia.entity';
import { KardexService } from './kardex.service';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { CorrelativosService } from '../../shared/correlativos.service';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { Tusuarios } from '../users/entities/usuario.entity';

@Injectable()
export class TrasladoInventarioService {
  constructor(
    @InjectRepository(TInvTrasladoMae) private readonly maeRepo: Repository<TInvTrasladoMae>,
    @InjectRepository(TInvTrasladoDet) private readonly detRepo: Repository<TInvTrasladoDet>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TinvExistencia) private readonly existenciaRepo: Repository<TinvExistencia>,
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
    @InjectRepository(Tusuarios) private readonly usuariosRepo: Repository<Tusuarios>,
    private readonly dataSource: DataSource,
    private readonly kardexService: KardexService,
    private readonly fechaSistema: FechaSistemaService,
    private readonly correlativos: CorrelativosService,
  ) {}

  /**
   * Correlativo de traslado: ttipoparametros (field='nrotraslado'),
   * localizado por Idsucursal + empresaId del usuario logueado, incrementando
   * valor = valor + 1 de forma atómica (UPDATE + LAST_INSERT_ID en la misma
   * conexión) y devolviendo el nuevo número como string (nroreferencia varchar).
   */
  private async siguienteNroReferencia(usuario: string, empresaId: number): Promise<string> {
    // Sin pad: la columna varchar guarda el número tal cual (compatibilidad con datos existentes)
    return String(await this.correlativos.siguiente('nrotraslado', empresaId, usuario));
  }

  async findAllMae(empresaId: number) {
    return this.maeRepo.find({ where: { empresaId } as any, order: { fecharegistro: 'DESC' } as any });
  }

  async findOneMae(id: number, empresaId: number) {
    const mae = await this.maeRepo.findOne({ where: { invtrasladomaeId: id, empresaId } as any });
    if (!mae) throw new BadRequestException('Traslado no encontrado');
    return mae;
  }

  async findDetByMae(id: number, empresaId: number) {
    const rows = await this.detRepo.createQueryBuilder('d')
      .leftJoinAndSelect(Tproducto, 'p', 'p.produtoId = d.productoId AND p.empresaId = d.empresaId')
      .select([
        'd.*',
        'p.descripcion AS descripcion',
      ])
      .where('d.invtrasladomaeId = :id', { id })
      .andWhere('d.empresaId = :empresaId', { empresaId })
      .orderBy('d.nrofila', 'ASC')
      .getRawMany();
    return rows;
  }

  async createMae(dto: any, usuario: string) {
    // Correlativo automático desde ttipoparametros (field='nrotraslado')
    const nroreferencia = await this.siguienteNroReferencia(usuario, dto.empresaId);
    const mae = this.maeRepo.create({
      bodegaOrigenId: dto.bodegaOrigenId,
      bodegaDestinoId: dto.bodegaDestinoId,
      nroreferencia,
      observaciones: dto.observaciones || '',
      sn_procesado: 'N',
      sn_anulado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
      // Reglas 1 y 4: fecha impuesta por el backend (no el reloj de MySQL)
      fecharegistro: await this.fechaSistema.obtenerFechaRegistro(usuario, dto.empresaId),
    });
    return this.maeRepo.save(mae);
  }

  async updateMae(id: number, empresaId: number, dto: any, usuario: string) {
    const mae = await this.findOneMae(id, empresaId);
    if (mae.sn_procesado === 'S') throw new BadRequestException('El traslado ya fue procesado y no se puede modificar');
    if (mae.sn_anulado === 'S') throw new BadRequestException('El traslado está anulado');
    Object.assign(mae, {
      bodegaOrigenId: dto.bodegaOrigenId,
      bodegaDestinoId: dto.bodegaDestinoId,
      observaciones: dto.observaciones,
      usuarioUpdated: usuario,
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
    });
    return this.maeRepo.save(mae);
  }

  async removeMae(id: number, empresaId: number) {
    const mae = await this.findOneMae(id, empresaId);
    if (mae.sn_procesado === 'S') throw new BadRequestException('El traslado ya fue procesado y no se puede eliminar');
    await this.detRepo.delete({ invtrasladomaeId: id, empresaId } as any);
    return this.maeRepo.delete({ invtrasladomaeId: id, empresaId } as any);
  }

  async createDet(dto: any, usuario: string) {
    const maxNro = await this.detRepo.createQueryBuilder('d')
      .select('MAX(d.nrofila)', 'maxNro')
      .where('d.invtrasladomaeId = :id', { id: dto.invtrasladomaeId })
      .getRawOne();
    const nrofila = (maxNro?.maxNro || 0) + 1;

    let costoUnitario = Number(dto.costoUnitario) || 0;
    let productoId = dto.productoId;

    if (dto.codbarra && dto.empresaId) {
      const prod = await this.productoRepo.findOne({ where: { codbarra: dto.codbarra, empresaId: dto.empresaId } as any });
      if (prod) {
        productoId = prod.produtoId;
        costoUnitario = Number(prod.cstounit) || 0;
      }
    }

    // Obtener bodegas del maestro
    const mae = await this.maeRepo.findOne({ where: { invtrasladomaeId: dto.invtrasladomaeId } as any });
    const bodegaOrigen = String(mae?.bodegaOrigenId || '');
    const bodegaDestino = String(mae?.bodegaDestinoId || '');

    const cantidad = Number(dto.cantidad) || 0;
    const costoTotal = cantidad * costoUnitario;

    const det = this.detRepo.create({
      invtrasladomaeId: dto.invtrasladomaeId,
      nrofila,
      productoId,
      codbarra: dto.codbarra || '',
      cantidad,
      costoUnitario,
      costoTotal,
      bodegaOrigen,
      bodegaDestino,
      sn_anulado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
      // Reglas 1 y 4: misma fecha que el maestro del traslado
      fecharegistro: await this.fechaSistema.obtenerFechaRegistro(usuario, dto.empresaId),
    });
    return this.detRepo.save(det);
  }

  async removeDet(id: number, empresaId: number) {
    const det = await this.detRepo.findOne({ where: { invtrasladodetId: id, empresaId } as any });
    if (!det) throw new BadRequestException('Item no encontrado');
    return this.detRepo.delete({ invtrasladodetId: id, empresaId } as any);
  }

  async procesar(id: number, empresaId: number, usuario: string) {
    const mae = await this.findOneMae(id, empresaId);
    if (mae.sn_procesado === 'S') throw new BadRequestException('El traslado ya fue procesado');
    if (mae.sn_anulado === 'S') throw new BadRequestException('El traslado está anulado');

    const detalles = await this.findDetByMae(id, empresaId);
    if (detalles.length === 0) throw new BadRequestException('El traslado no tiene items');

    const ref = mae.nroreferencia;

    for (const det of detalles) {
      if (det.sn_anulado === 'S') continue;

      await this.kardexService.registrarSalida({
        bodegaId: mae.bodegaOrigenId,
        productoId: det.productoId,
        cantidad: Number(det.cantidad),
        costoUnitario: Number(det.costoUnitario),
        nroreferencia: ref,
        moduloId: 1,
        tipomov: 'S',
        subtipoMov: 'T',
        empresaId,
        usuarioCreated: usuario,
        codbarra: det.codbarra,
      });

      await this.kardexService.registrarEntrada({
        bodegaId: mae.bodegaDestinoId,
        productoId: det.productoId,
        cantidad: Number(det.cantidad),
        costoUnitario: Number(det.costoUnitario),
        nroreferencia: ref,
        moduloId: 1,
        tipomov: 'E',
        subtipoMov: 'T',
        empresaId,
        usuarioCreated: usuario,
        codbarra: det.codbarra,
      });
    }

    mae.sn_procesado = 'S';
    mae.usuarioUpdated = usuario;
    mae.fechaUpdated = await this.fechaSistema.getFecha(empresaId);
    await this.maeRepo.save(mae);

    return { message: 'Traslado procesado correctamente' };
  }

  async anular(id: number, empresaId: number, usuario: string) {
    const mae = await this.findOneMae(id, empresaId);
    if (mae.sn_anulado === 'S') throw new BadRequestException('El traslado ya está anulado');
    if (mae.sn_procesado === 'S') throw new BadRequestException('El traslado ya fue procesado, no se puede anular');

    mae.sn_anulado = 'S';
    mae.usuarioUpdated = usuario;
    mae.fechaUpdated = await this.fechaSistema.getFecha(empresaId);
    await this.maeRepo.save(mae);

    return { message: 'Traslado anulado' };
  }
}
