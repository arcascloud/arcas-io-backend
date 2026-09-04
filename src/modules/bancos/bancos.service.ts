import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { Tbanco } from './entities/banco.entity';
import { TbcoCta } from './entities/bco-cta.entity';
import { TbcoConciliacion } from './entities/bco-conciliacion.entity';
import { TbcoConciliacionDet } from './entities/bco-conciliacion-det.entity';
import { TbcoDireccion } from './entities/bco-direccion.entity';
import { TbcoTelefono } from './entities/bco-telefono.entity';
import { CreateBancoDto, UpdateBancoDto, CreateBcoCtaDto, UpdateBcoCtaDto } from './dto/banco.dto';

@Injectable()
export class BancosService {
  constructor(
    @InjectRepository(Tbanco) private readonly bancoRepo: Repository<Tbanco>,
    @InjectRepository(TbcoCta) private readonly bcoCtaRepo: Repository<TbcoCta>,
    @InjectRepository(TbcoConciliacion) private readonly bcoConciliacionRepo: Repository<TbcoConciliacion>,
    @InjectRepository(TbcoConciliacionDet) private readonly bcoConciliacionDetRepo: Repository<TbcoConciliacionDet>,
    @InjectRepository(TbcoDireccion) private readonly bcoDireccionRepo: Repository<TbcoDireccion>,
    @InjectRepository(TbcoTelefono) private readonly bcoTelefonoRepo: Repository<TbcoTelefono>,
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
}
