import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tmodulos } from './entities/modulo.entity';
import { CreateModuloDto, UpdateModuloDto } from './dto/modulo.dto';

@Injectable()
export class ModulosService {
  constructor(
    @InjectRepository(Tmodulos)
    private readonly repo: Repository<Tmodulos>,
  ) {}

  async findAll(empresaId: number) {
    return this.repo.find({
      where: { empresaId },
      order: { descripcion: 'ASC' },
    });
  }

  async findOne(moduloId: number, empresaId: number) {
    const found = await this.repo.findOne({ where: { moduloId, empresaId } });
    if (!found) throw new NotFoundException(`Módulo ${moduloId} no encontrado`);
    return found;
  }

  async create(dto: CreateModuloDto, currentUser: string) {
    const entity = this.repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    return this.repo.save(entity);
  }

  async update(moduloId: number, empresaId: number, dto: UpdateModuloDto, currentUser: string) {
    const entity = await this.findOne(moduloId, empresaId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.repo.save(entity);
  }
}
