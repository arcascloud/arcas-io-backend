import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tempresas } from './entities/empresa.entity';
import { TempresasDet } from './entities/empresasdet.entity';
import { TempresasLogo } from './entities/empresaslogo.entity';
import { TImpresora } from './entities/impresoras.entity';
import { TPosCorrelativos } from '../facturacion/entities/poscorrelativos.entity';
import { Tsucursal } from '../sucursales/entities/sucursal.entity';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/empresa.dto';
import { CreateEmpresaDetDto, UpdateEmpresaDetDto } from './dto/empresasdet.dto';
import { CreateCorrelativoDto, UpdateCorrelativoDto } from './dto/correlativos.dto';
import { CreateEmpresaLogoDto, UpdateEmpresaLogoDto } from './dto/empresaslogo.dto';
import { CreateImpresoraDto, UpdateImpresoraDto } from './dto/impresoras.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Tempresas)
    private readonly repo: Repository<Tempresas>,
    @InjectRepository(TempresasDet)
    private readonly detRepo: Repository<TempresasDet>,
    @InjectRepository(TempresasLogo)
    private readonly logoRepo: Repository<TempresasLogo>,
    @InjectRepository(TImpresora)
    private readonly impRepo: Repository<TImpresora>,
    @InjectRepository(TPosCorrelativos)
    private readonly corrRepo: Repository<TPosCorrelativos>,
    @InjectRepository(Tsucursal)
    private readonly sucRepo: Repository<Tsucursal>,
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

  // ===== Correlativos (CAI) =====

  async findAllCorr(empresaId: number) {
    return this.corrRepo.find({
      where: { empresaId },
      order: { poscorrelativosId: 'ASC' },
    });
  }

  async findOneCorr(poscorrelativosId: number, empresaId: number) {
    const found = await this.corrRepo.findOne({
      where: { poscorrelativosId, empresaId },
    });
    if (!found) throw new NotFoundException(`Correlativo ${poscorrelativosId} no encontrado`);
    return found;
  }

  async createCorr(empresaId: number, dto: CreateCorrelativoDto, currentUser: string) {
    const entity = this.corrRepo.create({
      ...dto,
      empresaId,
      usuarioCreated: currentUser,
    });
    return this.corrRepo.save(entity);
  }

  async updateCorr(poscorrelativosId: number, empresaId: number, dto: UpdateCorrelativoDto, currentUser: string) {
    const entity = await this.findOneCorr(poscorrelativosId, empresaId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.corrRepo.save(entity);
  }

  async removeCorr(poscorrelativosId: number, empresaId: number) {
    const entity = await this.findOneCorr(poscorrelativosId, empresaId);
    await this.corrRepo.remove(entity);
    return { deleted: true };
  }

  async findNextNroFactura(empresaId: number, idsucursal: number) {
    const corr = await this.corrRepo.findOne({
      where: { empresaId, Idsucursal: idsucursal },
      order: { poscorrelativosId: 'DESC' },
    });
    return { nrofactura: corr ? corr.nrofactura + 1 : 1 };
  }

  /**
   * Extrae el número secuencial del rango formateado.
   * Ej: '000-001-01-00120001' → 120001
   */
  private extractRangoNumero(rango: string): number {
    const partes = rango.split('-');
    const ultimo = partes[partes.length - 1];
    return parseInt(ultimo, 10) || 0;
  }

  async findEstadoCorrelativo(empresaId: number) {
    const corr = await this.corrRepo.find({ where: { empresaId } });
    return corr.map(c => {
      const desde = this.extractRangoNumero(c.rangoDesde);
      const hasta = this.extractRangoNumero(c.rangoHasta);
      const usados = Number(c.nrofactura) || 0;
      const total = hasta - desde + 1;
      const disponible = Math.max(0, total - usados);
      const porcentaje = total > 0 ? Math.min(100, (usados / total) * 100) : 0;

      let estado: 'OK' | 'ALERTA' | 'CRITICO' | 'AGOTADO' = 'OK';
      if (usados >= total) estado = 'AGOTADO';
      else if (porcentaje >= 90) estado = 'CRITICO';
      else if (porcentaje >= 80) estado = 'ALERTA';

      return {
        poscorrelativosId: c.poscorrelativosId,
        Idsucursal: c.Idsucursal,
        rangoDesde: c.rangoDesde,
        rangoHasta: c.rangoHasta,
        nrofactura: usados,
        fechaLimite: c.fechaLimite,
        total,
        usados,
        disponible,
        porcentaje: Math.round(porcentaje),
        estado,
      };
    });
  }

  // ===== Sucursales =====

  async findAllSucursales(empresaId: number) {
    return this.sucRepo.find({
      where: { empresaId },
      order: { idsucursal: 'ASC' },
    });
  }

  async createSucursal(empresaId: number, dto: Partial<Tsucursal>, currentUser: string) {
    const entity = this.sucRepo.create({
      ...dto,
      empresaId,
      usuarioCreated: currentUser,
    });
    return this.sucRepo.save(entity);
  }

  async updateSucursal(idsucursal: number, dto: Partial<Tsucursal>, currentUser: string) {
    const found = await this.sucRepo.findOne({ where: { idsucursal } });
    if (!found) throw new NotFoundException(`Sucursal ${idsucursal} no encontrada`);
    Object.assign(found, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.sucRepo.save(found);
  }

  // ===== Logo =====

  async findLogo(empresaId: number) {
    return this.logoRepo.findOne({ where: { empresaId }, order: { tempresaslogoId: 'DESC' } });
  }

  async createLogo(empresaId: number, dto: CreateEmpresaLogoDto, currentUser: string) {
    // Desactivar logos anteriores de la misma empresa
    const existing = await this.logoRepo.find({ where: { empresaId } });
    for (const logo of existing) {
      logo.sn_activo = 'N';
      logo.usuarioUpdated = currentUser;
      logo.fechaUpdated = new Date();
      await this.logoRepo.save(logo);
    }
    const entity = this.logoRepo.create({
      ...dto,
      empresaId,
      sn_activo: dto.sn_activo || 'S',
      usuarioCreated: currentUser,
    });
    return this.logoRepo.save(entity);
  }

  async updateLogo(tempresaslogoId: number, dto: UpdateEmpresaLogoDto, currentUser: string) {
    const entity = await this.logoRepo.findOne({ where: { tempresaslogoId } });
    if (!entity) throw new NotFoundException(`Logo ${tempresaslogoId} no encontrado`);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.logoRepo.save(entity);
  }

  async removeLogo(tempresaslogoId: number) {
    const entity = await this.logoRepo.findOne({ where: { tempresaslogoId } });
    if (!entity) throw new NotFoundException(`Logo ${tempresaslogoId} no encontrado`);
    await this.logoRepo.remove(entity);
    return { deleted: true };
  }

  // ===== Impresoras =====

  async findAllImpresoras(empresaId: number) {
    return this.impRepo.find({ where: { empresaId }, order: { timpresorasId: 'ASC' } });
  }

  async createImpresora(empresaId: number, dto: CreateImpresoraDto, currentUser: string) {
    const entity = this.impRepo.create({
      ...dto,
      empresaId,
      usuarioCreated: currentUser,
    });
    return this.impRepo.save(entity);
  }

  async updateImpresora(timpresorasId: number, dto: UpdateImpresoraDto, currentUser: string) {
    const entity = await this.impRepo.findOne({ where: { timpresorasId } });
    if (!entity) throw new NotFoundException(`Impresora ${timpresorasId} no encontrada`);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.impRepo.save(entity);
  }

  async removeImpresora(timpresorasId: number) {
    const entity = await this.impRepo.findOne({ where: { timpresorasId } });
    if (!entity) throw new NotFoundException(`Impresora ${timpresorasId} no encontrada`);
    await this.impRepo.remove(entity);
    return { deleted: true };
  }
}
