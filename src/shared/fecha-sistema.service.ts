import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tempresas } from '../modules/companies/entities/empresa.entity';

@Injectable()
export class FechaSistemaService {
  constructor(
    @InjectRepository(Tempresas) private readonly empresaRepo: Repository<Tempresas>,
  ) {}

  /**
   * Obtiene la fecha del sistema desde tempresas.fechasistema.
   * Si no existe la empresa o no tiene fechasistema, usa new Date() como fallback.
   */
  async getFecha(empresaId: number): Promise<Date> {
    const empresa = await this.empresaRepo.findOne({ where: { empresaId } as any });
    return empresa?.fechasistema ? new Date(empresa.fechasistema) : new Date();
  }
}
