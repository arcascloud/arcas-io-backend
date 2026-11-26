import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { Tsucursal } from './entities/sucursal.entity';
import { TinvBodega } from '../inventario/entities/bodega.entity';
import { CreateSucursalDto, UpdateSucursalDto } from './dto/sucursal.dto';

@Injectable()
export class SucursalesService {
  constructor(
    @InjectRepository(Tsucursal)
    private readonly repo: Repository<Tsucursal>,
    private readonly fechaSistema: FechaSistemaService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Lista de sucursales. `empresaId` es OPCIONAL:
   *  - con empresaId → solo esa empresa (comportamiento histórico)
   *  - sin empresaId → TODAS las empresas (catálogo multi-empresa)
   */
  async findAll(empresaId?: number) {
    const where: FindOptionsWhere<Tsucursal> = {};
    if (empresaId != null) where.empresaId = empresaId;
    return this.repo.find({
      where,
      order: { descripcion: 'ASC' },
    });
  }

  /** `empresaId` opcional (misma regla que findAll) */
  async findOne(idsucursal: number, empresaId?: number) {
    const where: FindOptionsWhere<Tsucursal> = { idsucursal };
    if (empresaId != null) where.empresaId = empresaId;
    const found = await this.repo.findOne({ where });
    if (!found) throw new NotFoundException(`Sucursal ${idsucursal} no encontrada`);
    return found;
  }

  /**
   * Crea la sucursal Y su bodega por defecto en UNA transacción:
   * por cada sucursal nueva se crea una bodega (tinvbodegas) con la misma
   * descripción/empresa/estado y su `bodegaId` queda asignado en la sucursal
   * (usado por facturación/kardex como bodega por defecto).
   * Si la sucursal falla, la bodega se revierte (ROLLBACK).
   */
  async create(dto: CreateSucursalDto, currentUser: string) {
    return this.dataSource.transaction(async (manager) => {
      // 1) Bodega por defecto de la sucursal (misma descripción → trazabilidad)
      const bodega = await manager.getRepository(TinvBodega).save({
        descripcion: dto.descripcion,
        sn_activo: dto.sn_activo ?? 'S',
        empresaId: dto.empresaId,
        usuarioCreated: currentUser,
      });

      // 2) Sucursal apuntando a la bodega recién creada
      return manager.getRepository(Tsucursal).save({
        ...dto,
        bodegaId: bodega.bodegaId,
        usuarioCreated: currentUser,
      });
    });
  }

  /**
   * Actualiza la sucursal.
   * @param empresaFiltro - Filtro por empresa (opcional: en catálogo multi-empresa
   *   la consulta viene sin empresaId y el registro se localiza solo por id)
   * @param empresaFecha  - Empresa usada para resolver tempresas.fechasistema
   *   (siempre la de la sesión JWT)
   */
  async update(
    idsucursal: number,
    empresaFiltro: number | undefined,
    dto: UpdateSucursalDto,
    currentUser: string,
    empresaFecha: number,
  ) {
    const entity = await this.findOne(idsucursal, empresaFiltro);
    // El ValidationPipe (class-transformer) crea TODAS las propiedades del DTO
    // como own-keys con valor `undefined` aunque no vengan en el payload.
    // Object.assign copiaría esos undefined encima de la entidad cargada y
    // save() respondería nulls en los campos no enviados (la BD queda bien
    // porque TypeORM omite undefined del UPDATE, pero la respuesta sale rota).
    const cambios: Partial<Tsucursal> = {};
    for (const [clave, valor] of Object.entries(dto)) {
      if (valor !== undefined) (cambios as any)[clave] = valor;
    }
    Object.assign(entity, cambios, {
      usuarioUpdated: currentUser,
      fechaUpdated: await this.fechaSistema.getFecha(empresaFecha),
    });
    return this.repo.save(entity);
  }
}
