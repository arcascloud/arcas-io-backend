import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tempresas } from './entities/empresa.entity';
import { TempresasDet } from './entities/empresasdet.entity';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/empresa.dto';
import { CreateEmpresaDetDto, UpdateEmpresaDetDto } from './dto/empresasdet.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Tempresas)
    private readonly repo: Repository<Tempresas>,
    @InjectRepository(TempresasDet)
    private readonly detRepo: Repository<TempresasDet>,
  ) {}

  async findAll() {
    return this.repo.find();
  }

  async findOne(empresaId: number) {
    const found = await this.repo.findOne({ where: { empresaId } });
    if (!found) throw new NotFoundException(`Empresa ${empresaId} no encontrada`);
    return found;
  }

  async create(dto: CreateEmpresaDto, currentUser: string) {
    const entity = this.repo.create({
      ...dto,
      fechasistema: new Date(),
      usuarioCreated: currentUser,
    });
    return this.repo.save(entity);
  }

  async update(empresaId: number, dto: UpdateEmpresaDto, currentUser: string) {
    const entity = await this.findOne(empresaId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.repo.save(entity);
  }

  // ===== EmpresaDet =====

  async findAllDet(empresaId: number) {
    return this.detRepo.find({ where: { empresaId }, order: { tipo: 'ASC' } });
  }

  async findOneDet(empresasdetId: number, empresaId: number) {
    const found = await this.detRepo.findOne({ where: { empresasdetId, empresaId } });
    if (!found) throw new NotFoundException(`EmpresaDet ${empresasdetId} no encontrado`);
    return found;
  }

  async createDet(empresaId: number, dto: CreateEmpresaDetDto, currentUser: string) {
    const entity = this.detRepo.create({
      ...dto,
      empresaId,
      sn_activo: dto.sn_activo || 'S',
      usuarioCreated: currentUser,
    });
    return this.detRepo.save(entity);
  }

  async updateDet(empresasdetId: number, empresaId: number, dto: UpdateEmpresaDetDto, currentUser: string) {
    const entity = await this.findOneDet(empresasdetId, empresaId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.detRepo.save(entity);
  }

  async removeDet(empresasdetId: number, empresaId: number) {
    const entity = await this.findOneDet(empresasdetId, empresaId);
    await this.detRepo.remove(entity);
    return { deleted: true };
  }
}
