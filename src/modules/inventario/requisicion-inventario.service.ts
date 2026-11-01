import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TInvReqMae } from './entities/invreqmae.entity';
import { TInvReqDet } from './entities/invreqdet.entity';
import { Tproducto } from './entities/producto.entity';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { CorrelativosService } from '../../shared/correlativos.service';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { Tusuarios } from '../users/entities/usuario.entity';

@Injectable()
export class RequisicionInventarioService {
  constructor(
    @InjectRepository(TInvReqMae) private readonly maeRepo: Repository<TInvReqMae>,
    @InjectRepository(TInvReqDet) private readonly detRepo: Repository<TInvReqDet>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
    @InjectRepository(Tusuarios) private readonly usuariosRepo: Repository<Tusuarios>,
    private readonly dataSource: DataSource,
    private readonly fechaSistema: FechaSistemaService,
    private readonly correlativos: CorrelativosService,
  ) {}

  /**
   * Correlativo de requisición: ttipoparametros (field='nrorequisicion'),
   * localizado por Idsucursal + empresaId del usuario logueado, incrementando
   * valor = valor + 1 de forma atómica (UPDATE + LAST_INSERT_ID en la misma
   * conexión) y devolviendo el nuevo número.
   */
  private async siguienteNroRequisicion(usuario: string, empresaId: number): Promise<number> {
    return this.correlativos.siguiente('nrorequisicion', empresaId, usuario);
  }

  async findAllMae(empresaId: number) {
    return this.maeRepo.find({ where: { empresaId } as any, order: { fecharegistro: 'DESC' } as any });
  }

  async findOneMae(invreqmaeid: number, empresaId: number) {
    const mae = await this.maeRepo.findOne({ where: { invreqmaeid, empresaId } as any });
    if (!mae) throw new BadRequestException('Requisición no encontrada');
    return mae;
  }

  async findDetByMae(invreqmaeid: number, empresaId: number) {
    return this.detRepo.find({ where: { invreqmaeid, empresaId } as any, order: { nrofila: 'ASC' } as any });
  }

  async createMae(dto: any, usuario: string) {
    const mae = this.maeRepo.create({
      // Correlativo automático desde ttipoparametros (field='nrorequisicion')
      nrorequisicion: await this.siguienteNroRequisicion(usuario, dto.empresaId),
      bodegaOrigenId: dto.bodegaOrigenId,
      bodegaDestinoId: dto.bodegaDestinoId,
      concepto: dto.concepto || '',
      prioridad: dto.prioridad || 'M',
      fechaEntrega: dto.fechaEntrega ? new Date(dto.fechaEntrega).toISOString().slice(0, 10) : null,
      observaciones: dto.observaciones || '',
      sn_estado: 'P',
      sn_anulado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
      // Reglas 1 y 4: fecha impuesta por el backend (no el reloj de MySQL)
      fecharegistro: await this.fechaSistema.obtenerFechaRegistro(usuario, dto.empresaId),
    });
    return this.maeRepo.save(mae);
  }

  async updateMae(invreqmaeid: number, empresaId: number, dto: any, usuario: string) {
    const mae = await this.findOneMae(invreqmaeid, empresaId);
    if (dto.fechaEntrega) {
      dto.fechaEntrega = new Date(dto.fechaEntrega).toISOString().slice(0, 10);
    }
    const { fecharegistro, ...cambios } = dto ?? {}; // nunca se re-estampa en un PUT
    Object.assign(mae, cambios, { usuarioUpdated: usuario, fechaUpdated: await this.fechaSistema.getFecha(empresaId) });
    return this.maeRepo.save(mae);
  }

  async removeMae(invreqmaeid: number, empresaId: number) {
    const mae = await this.findOneMae(invreqmaeid, empresaId);
    if (mae.sn_estado === 'A') throw new BadRequestException('No se puede eliminar una requisición aprobada');
    await this.detRepo.delete({ invreqmaeid, empresaId } as any);
    return this.maeRepo.delete({ invreqmaeid, empresaId } as any);
  }

  async createDet(dto: any, usuario: string) {
    const maxNro = await this.detRepo.createQueryBuilder('d')
      .select('MAX(d.nrofila)', 'maxNro')
      .where('d.invreqmaeid = :invreqmaeid', { invreqmaeid: dto.invreqmaeid })
      .getRawOne();
    const nrofila = (maxNro?.maxNro || 0) + 1;

    let productoId = 0;
    let descripcion = dto.descripcion || '';

    if (dto.codbarra && dto.empresaId) {
      const prod = await this.productoRepo.findOne({ where: { codbarra: dto.codbarra, empresaId: dto.empresaId } as any });
      if (!prod) throw new BadRequestException(`Producto con codbarra "${dto.codbarra}" no encontrado`);
      productoId = prod.produtoId;
      descripcion = prod.descripcion;
    } else {
      throw new BadRequestException('Código de barra es requerido');
    }

    const cantidadSolicitada = Number(dto.cantidadSolicitada) || 0;

    const det = this.detRepo.create({
      invreqmaeid: dto.invreqmaeid,
      nrofila,
      productoId,
      codbarra: dto.codbarra,
      descripcion,
      cantidadSolicitada,
      cantidadEntregada: 0,
      sn_estado: 'P',
      sn_anulado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
      // Reglas 1 y 4: misma fecha que el maestro de la requisición
      fecharegistro: await this.fechaSistema.obtenerFechaRegistro(usuario, dto.empresaId),
    });
    return this.detRepo.save(det);
  }

  async updateDet(invreqdetid: number, empresaId: number, dto: any, usuario: string) {
    const det = await this.detRepo.findOne({ where: { invreqdetid, empresaId } as any });
    if (!det) throw new BadRequestException('Detalle no encontrado');
    const { fecharegistro, ...cambios } = dto ?? {}; // nunca se re-estampa en un PUT
    Object.assign(det, cambios, { usuarioUpdated: usuario, fechaUpdated: await this.fechaSistema.getFecha(empresaId) });
    return this.detRepo.save(det);
  }

  async removeDet(invreqdetid: number, empresaId: number) {
    return this.detRepo.delete({ invreqdetid, empresaId } as any);
  }

  async procesar(invreqmaeid: number, empresaId: number, usuario: string) {
    const mae = await this.findOneMae(invreqmaeid, empresaId);
    if (mae.sn_estado === 'A') throw new BadRequestException('La requisición ya fue procesada');
    if (mae.sn_anulado === 'S') throw new BadRequestException('La requisición está anulada');

    const dets = await this.findDetByMae(invreqmaeid, empresaId);
    if (dets.length === 0) throw new BadRequestException('No hay items para procesar');

    for (const det of dets) {
      if (det.sn_anulado === 'S') continue;
      await this.detRepo.update(det.invreqdetid, {
        sn_estado: 'A',
        usuarioUpdated: usuario,
        fechaUpdated: await this.fechaSistema.getFecha(empresaId),
      } as any);
    }

    await this.maeRepo.update(invreqmaeid, {
      sn_estado: 'A',
      usuarioUpdated: usuario,
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
    } as any);

    return { message: 'Requisición aprobada' };
  }

  async anular(invreqmaeid: number, empresaId: number, usuario: string) {
    const mae = await this.findOneMae(invreqmaeid, empresaId);
    if (mae.sn_anulado === 'S') throw new BadRequestException('La requisición ya está anulada');

    await this.maeRepo.update(invreqmaeid, {
      sn_anulado: 'S',
      sn_estado: 'X',
      usuarioUpdated: usuario,
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
    } as any);

    return { message: 'Requisición anulada' };
  }
}
