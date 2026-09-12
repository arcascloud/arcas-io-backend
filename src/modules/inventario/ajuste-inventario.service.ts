import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TInvMovMae } from './entities/invmovmae.entity';
import { TInvMovDet } from './entities/invmovdet.entity';
import { Tproducto } from './entities/producto.entity';
import { TinvExistencia } from './entities/existencia.entity';
import { KardexService } from './kardex.service';

@Injectable()
export class AjusteInventarioService {
  constructor(
    @InjectRepository(TInvMovMae) private readonly maeRepo: Repository<TInvMovMae>,
    @InjectRepository(TInvMovDet) private readonly detRepo: Repository<TInvMovDet>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TinvExistencia) private readonly existenciaRepo: Repository<TinvExistencia>,
    private readonly kardexService: KardexService,
  ) {}

  async findAllMae(empresaId: number) {
    return this.maeRepo.find({ where: { empresaId } as any, order: { fecharegistro: 'DESC' } as any });
  }

  async findOneMae(invmovmaeid: number, empresaId: number) {
    const mae = await this.maeRepo.findOne({ where: { invmovmaeid, empresaId } as any });
    if (!mae) throw new BadRequestException('Ajuste de inventario no encontrado');
    return mae;
  }

  async findDetByMae(invmovmaeid: number, empresaId: number) {
    return this.detRepo.find({
      where: { invmovmaeid, empresaId } as any,
      order: { nrofila: 'ASC' } as any,
    });
  }

  async createMae(dto: any, usuario: string) {
    const mae = this.maeRepo.create({
      nroajuste: dto.nroajuste || 0,
      bodegaId: dto.bodegaId,
      concepto: dto.concepto || '',
      sn_entrada: dto.sn_entrada || 'S',
      sn_anulado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
    });
    return this.maeRepo.save(mae);
  }

  async updateMae(invmovmaeid: number, empresaId: number, dto: any, usuario: string) {
    const mae = await this.findOneMae(invmovmaeid, empresaId);
    Object.assign(mae, dto, { usuarioUpdated: usuario, fechaUpdated: new Date() });
    return this.maeRepo.save(mae);
  }

  async removeMae(invmovmaeid: number, empresaId: number) {
    await this.detRepo.delete({ invmovmaeid, empresaId } as any);
    return this.maeRepo.delete({ invmovmaeid, empresaId } as any);
  }

  async createDet(dto: any, usuario: string) {
    const maxNro = await this.detRepo.createQueryBuilder('d')
      .select('MAX(d.nrofila)', 'maxNro')
      .where('d.invmovmaeid = :invmovmaeid', { invmovmaeid: dto.invmovmaeid })
      .getRawOne();
    const nrofila = (maxNro?.maxNro || 0) + 1;

    let productoId = 0;
    let descripcion = dto.descripcion || '';
    let costoUnitario = Number(dto.costoUnitario) || 0;

    if (dto.codbarra && dto.empresaId) {
      const prod = await this.productoRepo.findOne({ where: { codbarra: dto.codbarra, empresaId: dto.empresaId } as any });
      if (!prod) {
        throw new BadRequestException(`Producto con codbarra "${dto.codbarra}" no encontrado`);
      }
      productoId = prod.produtoId;
      descripcion = prod.descripcion;
      costoUnitario = Number(prod.cstounit) || 0;
    } else {
      throw new BadRequestException('Codigo de barra es requerido');
    }

    const cantidad = Number(dto.cantidad) || 0;

    const det = this.detRepo.create({
      invmovmaeid: dto.invmovmaeid,
      nrofila,
      bodegaId: dto.bodegaId,
      productoId,
      codbarra: dto.codbarra,
      descripcion,
      cantidad,
      costoUnitario,
      costoTotal: cantidad * costoUnitario,
      verificador: dto.verificador || 0,
      sn_entrada: dto.sn_entrada || 'S',
      sn_anulado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
    });
    return this.detRepo.save(det);
  }

  async updateDet(invmovdetid: number, empresaId: number, dto: any, usuario: string) {
    const det = await this.detRepo.findOne({ where: { invmovdetid, empresaId } as any });
    if (!det) throw new BadRequestException('Detalle no encontrado');
    Object.assign(det, dto, { usuarioUpdated: usuario, fechaUpdated: new Date() });
    return this.detRepo.save(det);
  }

  async removeDet(invmovdetid: number, empresaId: number) {
    return this.detRepo.delete({ invmovdetid, empresaId } as any);
  }

  async procesar(invmovmaeid: number, empresaId: number, usuario: string) {
    const mae = await this.findOneMae(invmovmaeid, empresaId);
    const dets = await this.findDetByMae(invmovmaeid, empresaId);

    if (dets.length === 0) {
      throw new BadRequestException('No hay items para procesar');
    }

    const resultados: any[] = [];

    for (const det of dets) {
      if (det.sn_anulado === 'S') continue;

      const productoId = det.productoId;
      const cantidad = Number(det.cantidad) || 0;
      const costoUnitario = Number(det.costoUnitario) || 0;

      if (cantidad <= 0) continue;

      if (mae.sn_entrada === 'S') {
        await this.kardexService.registrarEntrada({
          bodegaId: mae.bodegaId,
          productoId,
          cantidad,
          costoUnitario,
          nroreferencia: `AJ-${invmovmaeid}`,
          moduloId: 4,
          tipomov: 'E',
          subtipoMov: 'A',
          empresaId,
          usuarioCreated: usuario,
        });
      } else {
        await this.kardexService.registrarSalida({
          bodegaId: mae.bodegaId,
          productoId,
          cantidad,
          costoUnitario,
          nroreferencia: `AJ-${invmovmaeid}`,
          moduloId: 4,
          tipomov: 'S',
          subtipoMov: 'A',
          empresaId,
          usuarioCreated: usuario,
        });
      }

      await this.detRepo.update(det.invmovdetid, {
        verificador: 1,
        usuarioUpdated: usuario,
        fechaUpdated: new Date(),
      } as any);

      resultados.push({
        codbarra: det.codbarra,
        productoId,
        cantidad,
        costoUnitario,
        tipo: mae.sn_entrada === 'S' ? 'Entrada' : 'Salida',
      });
    }

    await this.maeRepo.update(invmovmaeid, {
      sn_anulado: 'N',
      usuarioUpdated: usuario,
      fechaUpdated: new Date(),
    } as any);

    return { message: 'Ajuste procesado', items: resultados };
  }
}
