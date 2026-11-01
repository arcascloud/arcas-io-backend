import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TInvFisMae } from './entities/invfismae.entity';
import { TInvFisDet } from './entities/invfisdet.entity';
import { Tproducto } from './entities/producto.entity';
import { TinvExistencia } from './entities/existencia.entity';
import { KardexService } from './kardex.service';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';

@Injectable()
export class TomaInventarioService {
  constructor(
    @InjectRepository(TInvFisMae) private readonly maeRepo: Repository<TInvFisMae>,
    @InjectRepository(TInvFisDet) private readonly detRepo: Repository<TInvFisDet>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TinvExistencia) private readonly existenciaRepo: Repository<TinvExistencia>,
    private readonly kardexService: KardexService,
    private readonly fechaSistema: FechaSistemaService,
  ) {}

  async findAllMae(empresaId: number) {
    return this.maeRepo.find({ where: { empresaId } as any, order: { fecharegistro: 'DESC' } as any });
  }

  async findOneMae(invfisId: number, empresaId: number) {
    const mae = await this.maeRepo.findOne({ where: { invfisId, empresaId } as any });
    if (!mae) throw new BadRequestException('Toma de inventario no encontrada');
    return mae;
  }

  async findDetByMae(invfisId: number, empresaId: number) {
    return this.detRepo.find({ where: { invfisId, empresaId } as any, order: { nrofila: 'ASC' } as any });
  }

  async createMae(dto: any, usuario: string) {
    const mae = this.maeRepo.create({
      bodegaId: dto.bodegaId,
      concepto: dto.concepto || '',
      sn_anulado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
      // Reglas 1 y 4: fecha impuesta por el backend (no el reloj de MySQL)
      fecharegistro: await this.fechaSistema.obtenerFechaRegistro(usuario, dto.empresaId),
    });
    return this.maeRepo.save(mae);
  }

  async updateMae(invfisId: number, empresaId: number, dto: any, usuario: string) {
    const mae = await this.findOneMae(invfisId, empresaId);
    const { fecharegistro, ...cambios } = dto ?? {}; // nunca se re-estampa en un PUT
    Object.assign(mae, cambios, { usuarioUpdated: usuario, fechaUpdated: await this.fechaSistema.getFecha(empresaId) });
    return this.maeRepo.save(mae);
  }

  async removeMae(invfisId: number, empresaId: number) {
    await this.detRepo.delete({ invfisId, empresaId } as any);
    return this.maeRepo.delete({ invfisId, empresaId } as any);
  }

  async createDet(dto: any, usuario: string) {
    const maxNro = await this.detRepo.createQueryBuilder('d')
      .select('MAX(d.nrofila)', 'maxNro')
      .where('d.invfisId = :invfisId', { invfisId: dto.invfisId })
      .getRawOne();
    const nrofila = (maxNro?.maxNro || 0) + 1;

    let existenciaSistema = Number(dto.existencia) || 0;
    let descripcion = dto.descripcion || '';
    let costoUnitario = Number(dto.costoUnitario) || 0;
    let preciovta = Number(dto.preciovta) || 0;

    if (dto.codbarra && dto.bodegaId && dto.empresaId) {
      const prod = await this.productoRepo.findOne({ where: { codbarra: dto.codbarra, empresaId: dto.empresaId } as any });
      if (prod) {
        descripcion = prod.descripcion;
        costoUnitario = Number(prod.cstounit) || 0;
        preciovta = Number(prod.precioventa) || 0;
        const existReg = await this.existenciaRepo.findOne({
          where: { productoId: prod.produtoId, bodegaId: dto.bodegaId, empresaId: dto.empresaId } as any,
        });
        existenciaSistema = existReg ? Number(existReg.existencia) : 0;
      }
    }

    const fisico = Number(dto.fisico) || 0;
    let ajusteEntrada = Number(dto.ajusteEntrada) || 0;
    let ajusteSalida = Number(dto.ajusteSalida) || 0;

    if (!ajusteEntrada && !ajusteSalida) {
      if (existenciaSistema === 0 && fisico > 0) {
        ajusteEntrada = fisico;
      } else if (fisico > existenciaSistema) {
        ajusteEntrada = fisico - existenciaSistema;
      } else if (fisico < existenciaSistema) {
        ajusteSalida = existenciaSistema - fisico;
      }
    }

    const det = this.detRepo.create({
      invfisId: dto.invfisId,
      bodegaId: dto.bodegaId,
      nrofila,
      codbarra: dto.codbarra || '',
      descripcion,
      existencia: existenciaSistema,
      fisico,
      ajusteEntrada,
      ajusteSalida,
      costoUnitario,
      costoTotal: fisico * costoUnitario,
      preciovta,
      sn_posteado: 'S',
      sn_aplicado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
      // Reglas 1 y 4: misma fecha que el maestro de la toma
      fecharegistro: await this.fechaSistema.obtenerFechaRegistro(usuario, dto.empresaId),
    });
    return this.detRepo.save(det);
  }

  async updateDet(nvfisdetId: number, empresaId: number, dto: any, usuario: string) {
    const det = await this.detRepo.findOne({ where: { nvfisdetId, empresaId } as any });
    if (!det) throw new BadRequestException('Detalle no encontrado');
    const { fecharegistro, ...cambios } = dto ?? {}; // nunca se re-estampa en un PUT
    Object.assign(det, cambios, { usuarioUpdated: usuario, fechaUpdated: await this.fechaSistema.getFecha(empresaId) });
    return this.detRepo.save(det);
  }

  async removeDet(nvfisdetId: number, empresaId: number) {
    return this.detRepo.delete({ nvfisdetId, empresaId } as any);
  }

  async procesarInventario(invfisId: number, empresaId: number, bodegaId: number, usuario: string) {
    const mae = await this.findOneMae(invfisId, empresaId);
    const dets = await this.findDetByMae(invfisId, empresaId);

    if (mae.sn_anulado === 'S') {
      throw new BadRequestException(`La toma de inventario #${invfisId} está anulada y no se puede procesar.`);
    }
    // Idempotencia: sin esta bandera se repetiría el kardex al volver a procesar
    if (mae.sn_procesado === 'S') {
      throw new BadRequestException(`La toma de inventario #${invfisId} ya fue procesada.`);
    }

    if (dets.length === 0) {
      throw new BadRequestException('No hay items para procesar');
    }

    const resultados: any[] = [];

    // OPCIÓN A: el ajuste se calcula contra la existencia ACTUAL de la bodega,
    // no contra el snapshot guardado en la línea. En un proceso "desde cero"
    // (sin kardex ni invexistencias) la actual es 0 ⇒ ajuste = conteo físico.
    for (const det of dets) {
      const fisico = Number(det.fisico) || 0;

      const prod = await this.productoRepo.findOne({ where: { codbarra: det.codbarra, empresaId } as any });
      const productoId = prod?.produtoId;
      if (!productoId) {
        // Antes se omitía en silencio y aún así se marcaba sn_aplicado = 'S'
        throw new BadRequestException(
          `El producto con código de barras ${det.codbarra} no existe en el catálogo; no se puede registrar el kardex.`,
        );
      }
      // Costo de la línea; si está en 0 se toma el del catálogo para no
      // generar existencia de valor cero
      const costoUnitario = Number(det.costoUnitario) || Number(prod.cstounit) || 0;

      const regActual = await this.existenciaRepo.findOne({
        where: { bodegaId: mae.bodegaId, productoId, empresaId } as any,
      });
      const sistema = regActual ? Number(regActual.existencia) || 0 : 0;

      const diferencia = fisico - sistema;
      const ajusteEntrada = diferencia > 0 ? diferencia : 0;
      const ajusteSalida = diferencia < 0 ? Math.abs(diferencia) : 0;

      if (ajusteEntrada > 0) {
        await this.kardexService.registrarEntrada({
          bodegaId: mae.bodegaId,
          productoId,
          cantidad: ajusteEntrada,
          costoUnitario,
          nroreferencia: `TI-${invfisId}`,
          moduloId: 6,
          tipomov: 'E',
          subtipoMov: 'A',
          empresaId,
          usuarioCreated: usuario,
        });
      }

      if (ajusteSalida > 0) {
        await this.kardexService.registrarSalida({
          bodegaId: mae.bodegaId,
          productoId,
          cantidad: ajusteSalida,
          costoUnitario,
          nroreferencia: `TI-${invfisId}`,
          moduloId: 6,
          tipomov: 'S',
          subtipoMov: 'A',
          empresaId,
          usuarioCreated: usuario,
        });
      }

      await this.detRepo.update(det.nvfisdetId, {
        // existencia = base realmente usada, para que la tabla
        // (Existencia | Físico | Ajuste) quede coherente
        existencia: sistema,
        ajusteEntrada,
        ajusteSalida,
        costoTotal: fisico * costoUnitario,
        sn_aplicado: 'S',
        usuarioUpdated: usuario,
        fechaUpdated: await this.fechaSistema.getFecha(empresaId),
      } as any);

      resultados.push({
        codbarra: det.codbarra,
        descripcion: det.descripcion,
        sistema,
        fisico,
        ajusteEntrada,
        ajusteSalida,
      });
    }

    await this.maeRepo.update(invfisId, {
      // sn_procesado = 'S' es lo que el frontend usa para bloquear "Agregar" después de procesar
      sn_procesado: 'S',
      usuarioUpdated: usuario,
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
    } as any);

    return { message: 'Inventario procesado', items: resultados };
  }

  async cargarExistencia(nvfisdetId: number, empresaId: number) {
    const det = await this.detRepo.findOne({ where: { nvfisdetId, empresaId } as any });
    if (!det) throw new BadRequestException('Detalle no encontrado');

    const prod = await this.productoRepo.findOne({ where: { codbarra: det.codbarra, empresaId } as any });
    if (!prod) return det;

    const existencia = await this.existenciaRepo.findOne({
      where: { productoId: prod.produtoId, empresaId } as any,
    });

    det.existencia = existencia ? Number(existencia.existencia) : 0;
    det.costoUnitario = Number(prod.cstounit) || 0;
    det.preciovta = Number(prod.precioventa) || 0;
    det.descripcion = prod.descripcion;

    const fisico = Number(det.fisico) || 0;
    const sistema = det.existencia;
    if (sistema === 0 && fisico > 0) {
      det.ajusteEntrada = fisico;
      det.ajusteSalida = 0;
    } else if (fisico > sistema) {
      det.ajusteEntrada = fisico - sistema;
      det.ajusteSalida = 0;
    } else if (fisico < sistema) {
      det.ajusteEntrada = 0;
      det.ajusteSalida = sistema - fisico;
    } else {
      det.ajusteEntrada = 0;
      det.ajusteSalida = 0;
    }

    await this.detRepo.save(det);
    return det;
  }

  async importarItems(invfisId: number, empresaId: number, items: any[], usuario: string) {
    const mae = await this.findOneMae(invfisId, empresaId);
    const resultados: any[] = [];

    for (const item of items) {
      const fisico = Number(item.existencia) || Number(item.fisico) || 0;

      const det = await this.createDet({
        invfisId,
        bodegaId: mae.bodegaId,
        codbarra: item.codbarra || '',
        descripcion: item.descripcion || '',
        fisico,
        empresaId,
      }, usuario);

      resultados.push(det);
    }

    return resultados;
  }
}
