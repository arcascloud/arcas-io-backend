import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { Tsucursal } from './entities/sucursal.entity';
import { CreateSucursalDto, UpdateSucursalDto } from './dto/sucursal.dto';

@Injectable()
export class SucursalesService {
  constructor(
    @InjectRepository(Tsucursal)
    private readonly repo: Repository<Tsucursal>,
    private readonly fechaSistema: FechaSistemaService,
  ) {}

  async findAll(empresaId: number) {
    return this.repo.find({
      where: { empresaId },
      order: { descripcion: 'ASC' },
    });
  }

  async findOne(idsucursal: number, empresaId: number) {
    const found = await this.repo.findOne({ where: { idsucursal, empresaId } });
    if (!found) throw new NotFoundException(`Sucursal ${idsucursal} no encontrada`);
    return found;
  }

  async create(dto: CreateSucursalDto, currentUser: string) {
    const entity = this.repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    return this.repo.save(entity);
  }

  async update(idsucursal: number, empresaId: number, dto: UpdateSucursalDto, currentUser: string) {
    const entity = await this.findOne(idsucursal, empresaId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
    });
    return this.repo.save(entity);
  }
}
