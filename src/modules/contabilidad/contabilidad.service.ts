import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { Tcoctacontables } from './entities/tcoctacontables.entity';
import { Tcogrupocontable } from './entities/tcogrupocontable.entity';
import { Tcoplantillapdamae } from './entities/tcoplantillapdamae.entity';
import { Tcoplantillapdadet } from './entities/tcoplantillapdadet.entity';
import { Cosaldoscta } from './entities/cosaldoscta.entity';
import { Cocierrectable } from './entities/cocierrectable.entity';
import { Tcorepliquidez } from './entities/tcorepliquidez.entity';
import { Cofactordecambios } from './entities/cofactordecambios.entity';
import { Tcoplantillabalancesmae } from './entities/tcoplantillabalancesmae.entity';
import { Tcoplantillabalancesdet } from './entities/tcoplantillabalancesdet.entity';
import { Tcorepdiarios } from './entities/tcorepdiarios.entity';
import { Tcorepbalances } from './entities/tcorepbalances.entity';
import { Coperiodoctable } from './entities/coperiodoctable.entity';
import { Copdamae } from './entities/copdamae.entity';
import { Copdadet } from './entities/copdadet.entity';
import { Comovcta } from './entities/comovcta.entity';
import { Tconivelcta } from './entities/tconivelcta.entity';
import { Tconaturalezacta } from './entities/tconaturalezacta.entity';
import { Tcoimpuestovecinal } from './entities/tcoimpuestovecinal.entity';
import { TCoTipoDocumentoFiscal } from './entities/tcotipodocumentofiscal.entity';
import {
  CreateTcoctacontablesDto, UpdateTcoctacontablesDto,
  CreateCopdamaeDto, UpdateCopdamaeDto,
  CreateCopdadetDto, UpdateCopdadetDto,
} from './dto/contabilidad.dto';

@Injectable()
export class ContabilidadService {
  constructor(
    @InjectRepository(Tcoctacontables) private readonly ctacontablesRepo: Repository<Tcoctacontables>,
    @InjectRepository(Tcogrupocontable) private readonly grupocontableRepo: Repository<Tcogrupocontable>,
    @InjectRepository(Tcoplantillapdamae) private readonly plantillapdamaeRepo: Repository<Tcoplantillapdamae>,
    @InjectRepository(Tcoplantillapdadet) private readonly plantillapdadetRepo: Repository<Tcoplantillapdadet>,
    @InjectRepository(Cosaldoscta) private readonly saldosctaRepo: Repository<Cosaldoscta>,
    @InjectRepository(Cocierrectable) private readonly cierrectableRepo: Repository<Cocierrectable>,
    @InjectRepository(Tcorepliquidez) private readonly repliquidezRepo: Repository<Tcorepliquidez>,
    @InjectRepository(Cofactordecambios) private readonly factordecambioRepo: Repository<Cofactordecambios>,
    @InjectRepository(Tcoplantillabalancesmae) private readonly plantillabalancesmaeRepo: Repository<Tcoplantillabalancesmae>,
    @InjectRepository(Tcoplantillabalancesdet) private readonly plantillabalancesdetRepo: Repository<Tcoplantillabalancesdet>,
    @InjectRepository(Tcorepdiarios) private readonly repdiariosRepo: Repository<Tcorepdiarios>,
    @InjectRepository(Tcorepbalances) private readonly repbalancesRepo: Repository<Tcorepbalances>,
    @InjectRepository(Coperiodoctable) private readonly periodoctableRepo: Repository<Coperiodoctable>,
    @InjectRepository(Copdamae) private readonly copdamaeRepo: Repository<Copdamae>,
    @InjectRepository(Copdadet) private readonly copdadetRepo: Repository<Copdadet>,
    @InjectRepository(Comovcta) private readonly movctaRepo: Repository<Comovcta>,
    @InjectRepository(Tconivelcta) private readonly nivelctaRepo: Repository<Tconivelcta>,
    @InjectRepository(Tconaturalezacta) private readonly naturalezactaRepo: Repository<Tconaturalezacta>,
    @InjectRepository(Tcoimpuestovecinal) private readonly impuestovecinalRepo: Repository<Tcoimpuestovecinal>,
    @InjectRepository(TCoTipoDocumentoFiscal) private readonly tipoDocFiscalRepo: Repository<TCoTipoDocumentoFiscal>,
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

  private async findOneByIdNoEmpresa<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    entityName: string,
  ) {
    const where = { [idField]: id } as unknown as FindOptionsWhere<T>;
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

  private async updateEntityNoEmpresa<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const entity = await this.findOneByIdNoEmpresa(repo, idField, id, entityName);
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

  private async softDeleteNoEmpresa<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    entityName: string,
  ) {
    const entity = await this.findOneByIdNoEmpresa(repo, idField, id, entityName);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  async findAllCtacontables(empresaId: number) {
    return this.findAllByEmpresa(this.ctacontablesRepo, empresaId);
  }

  async findCtacontable(cuentacontablesId: number, empresaId: number) {
    return this.findOneById(this.ctacontablesRepo, 'cuentacontablesId', cuentacontablesId, empresaId, 'Cuenta Contable');
  }

  async createCtacontable(dto: CreateTcoctacontablesDto, currentUser: string) {
    return this.createEntity(this.ctacontablesRepo, dto, currentUser);
  }

  async updateCtacontable(cuentacontablesId: number, empresaId: number, dto: UpdateTcoctacontablesDto, currentUser: string) {
    return this.updateEntity(this.ctacontablesRepo, 'cuentacontablesId', cuentacontablesId, empresaId, dto, currentUser, 'Cuenta Contable');
  }

  async removeCtacontable(cuentacontablesId: number, empresaId: number) {
    return this.softDelete(this.ctacontablesRepo, 'cuentacontablesId', cuentacontablesId, empresaId, 'Cuenta Contable');
  }

  async findAllGrupocontable(empresaId: number) {
    return this.grupocontableRepo.find({
      where: { empresaId, sn_activo: 'S' } as unknown as FindOptionsWhere<Tcogrupocontable>,
    });
  }

  async findGrupocontable(tcogrupocontableId: number, empresaId: number) {
    return this.findOneById(this.grupocontableRepo, 'tcogrupocontableId', tcogrupocontableId, empresaId, 'Grupo Contable');
  }

  async createGrupocontable(dto: any, currentUser: string) {
    return this.createEntity(this.grupocontableRepo, dto, currentUser);
  }

  async updateGrupocontable(tcogrupocontableId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.grupocontableRepo, 'tcogrupocontableId', tcogrupocontableId, empresaId, dto, currentUser, 'Grupo Contable');
  }

  async removeGrupocontable(tcogrupocontableId: number, empresaId: number) {
    return this.softDelete(this.grupocontableRepo, 'tcogrupocontableId', tcogrupocontableId, empresaId, 'Grupo Contable');
  }

  async findAllPlantillapdamae(empresaId: number) {
    return this.findAllByEmpresa(this.plantillapdamaeRepo, empresaId);
  }

  async findPlantillapdamae(tcoplantillapdamaeId: number, empresaId: number) {
    return this.findOneById(this.plantillapdamaeRepo, 'tcoplantillapdamaeId', tcoplantillapdamaeId, empresaId, 'Plantilla PDA Mae');
  }

  async createPlantillapdamae(dto: any, currentUser: string) {
    return this.createEntity(this.plantillapdamaeRepo, dto, currentUser);
  }

  async updatePlantillapdamae(tcoplantillapdamaeId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.plantillapdamaeRepo, 'tcoplantillapdamaeId', tcoplantillapdamaeId, empresaId, dto, currentUser, 'Plantilla PDA Mae');
  }

  async removePlantillapdamae(tcoplantillapdamaeId: number, empresaId: number) {
    return this.softDelete(this.plantillapdamaeRepo, 'tcoplantillapdamaeId', tcoplantillapdamaeId, empresaId, 'Plantilla PDA Mae');
  }

  async findAllPlantillapdadet(empresaId: number) {
    return this.findAllByEmpresa(this.plantillapdadetRepo, empresaId);
  }

  async findPlantillapdadet(tcoplantillapdadetId: number, empresaId: number) {
    return this.findOneById(this.plantillapdadetRepo, 'tcoplantillapdadetId', tcoplantillapdadetId, empresaId, 'Plantilla PDA Det');
  }

  async createPlantillapdadet(dto: any, currentUser: string) {
    return this.createEntity(this.plantillapdadetRepo, dto, currentUser);
  }

  async updatePlantillapdadet(tcoplantillapdadetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.plantillapdadetRepo, 'tcoplantillapdadetId', tcoplantillapdadetId, empresaId, dto, currentUser, 'Plantilla PDA Det');
  }

  async removePlantillapdadet(tcoplantillapdadetId: number, empresaId: number) {
    return this.softDelete(this.plantillapdadetRepo, 'tcoplantillapdadetId', tcoplantillapdadetId, empresaId, 'Plantilla PDA Det');
  }

  async findAllSaldoscta(empresaId: number) {
    return this.findAllByEmpresa(this.saldosctaRepo, empresaId);
  }

  async findSaldoscta(cosaldosctaId: number, empresaId: number) {
    return this.findOneById(this.saldosctaRepo, 'cosaldosctaId', cosaldosctaId, empresaId, 'Saldo Cuenta');
  }

  async createSaldoscta(dto: any, currentUser: string) {
    return this.createEntity(this.saldosctaRepo, dto, currentUser);
  }

  async updateSaldoscta(cosaldosctaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.saldosctaRepo, 'cosaldosctaId', cosaldosctaId, empresaId, dto, currentUser, 'Saldo Cuenta');
  }

  async findAllCierrectable(empresaId: number) {
    return this.findAllByEmpresa(this.cierrectableRepo, empresaId);
  }

  async findCierrectable(cierrectableId: number, empresaId: number) {
    return this.findOneById(this.cierrectableRepo, 'cierrectableId', cierrectableId, empresaId, 'Cierre Contable');
  }

  async createCierrectable(dto: any, currentUser: string) {
    return this.createEntity(this.cierrectableRepo, dto, currentUser);
  }

  async updateCierrectable(cierrectableId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cierrectableRepo, 'cierrectableId', cierrectableId, empresaId, dto, currentUser, 'Cierre Contable');
  }

  async removeCierrectable(cierrectableId: number, empresaId: number) {
    return this.softDelete(this.cierrectableRepo, 'cierrectableId', cierrectableId, empresaId, 'Cierre Contable');
  }

  async findAllRepliquidez(empresaId: number) {
    return this.repliquidezRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<Tcorepliquidez>,
      order: { tcorepliquidezId: 'ASC' } as any,
    });
  }

  async findRepliquidez(tcorepliquidezId: number) {
    return this.findOneByIdNoEmpresa(this.repliquidezRepo, 'tcorepliquidezId', tcorepliquidezId, 'Reporte Liquidez');
  }

  async createRepliquidez(dto: any, currentUser: string) {
    return this.createEntity(this.repliquidezRepo, dto, currentUser);
  }

  async updateRepliquidez(tcorepliquidezId: number, dto: any, currentUser: string) {
    return this.updateEntityNoEmpresa(this.repliquidezRepo, 'tcorepliquidezId', tcorepliquidezId, dto, currentUser, 'Reporte Liquidez');
  }

  async removeRepliquidez(tcorepliquidezId: number) {
    return this.softDeleteNoEmpresa(this.repliquidezRepo, 'tcorepliquidezId', tcorepliquidezId, 'Reporte Liquidez');
  }

  async findAllFactordecambio(empresaId: number) {
    return this.factordecambioRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<Cofactordecambios>,
      order: { fecharegistro: 'DESC' } as any,
    });
  }

  async findFactordecambio(factordecambioId: number) {
    return this.findOneByIdNoEmpresa(this.factordecambioRepo, 'factordecambioId', factordecambioId, 'Factor de Cambio');
  }

  async createFactordecambio(dto: any, currentUser: string) {
    return this.createEntity(this.factordecambioRepo, dto, currentUser);
  }

  async updateFactordecambio(factordecambioId: number, dto: any, currentUser: string) {
    return this.updateEntityNoEmpresa(this.factordecambioRepo, 'factordecambioId', factordecambioId, dto, currentUser, 'Factor de Cambio');
  }

  async findAllPlantillabalancesmae(empresaId: number) {
    return this.findAllByEmpresa(this.plantillabalancesmaeRepo, empresaId);
  }

  async findPlantillabalancesmae(cocdefbalmaId: number, empresaId: number) {
    return this.findOneById(this.plantillabalancesmaeRepo, 'cocdefbalmaId', cocdefbalmaId, empresaId, 'Plantilla Balance Mae');
  }

  async createPlantillabalancesmae(dto: any, currentUser: string) {
    return this.createEntity(this.plantillabalancesmaeRepo, dto, currentUser);
  }

  async updatePlantillabalancesmae(cocdefbalmaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.plantillabalancesmaeRepo, 'cocdefbalmaId', cocdefbalmaId, empresaId, dto, currentUser, 'Plantilla Balance Mae');
  }

  async removePlantillabalancesmae(cocdefbalmaId: number, empresaId: number) {
    return this.softDelete(this.plantillabalancesmaeRepo, 'cocdefbalmaId', cocdefbalmaId, empresaId, 'Plantilla Balance Mae');
  }

  async findAllPlantillabalancesdet(empresaId: number) {
    return this.findAllByEmpresa(this.plantillabalancesdetRepo, empresaId);
  }

  async findPlantillabalancesdet(tcoplantillabalancesdetid: number, empresaId: number) {
    return this.findOneById(this.plantillabalancesdetRepo, 'tcoplantillabalancesdetid', tcoplantillabalancesdetid, empresaId, 'Plantilla Balance Det');
  }

  async createPlantillabalancesdet(dto: any, currentUser: string) {
    return this.createEntity(this.plantillabalancesdetRepo, dto, currentUser);
  }

  async updatePlantillabalancesdet(tcoplantillabalancesdetid: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.plantillabalancesdetRepo, 'tcoplantillabalancesdetid', tcoplantillabalancesdetid, empresaId, dto, currentUser, 'Plantilla Balance Det');
  }

  async removePlantillabalancesdet(tcoplantillabalancesdetid: number, empresaId: number) {
    return this.softDelete(this.plantillabalancesdetRepo, 'tcoplantillabalancesdetid', tcoplantillabalancesdetid, empresaId, 'Plantilla Balance Det');
  }

  async findAllRepdiarios(empresaId: number) {
    return this.repdiariosRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<Tcorepdiarios>,
    });
  }

  async findRepdiarios(tcorepdiariosId: number) {
    return this.findOneByIdNoEmpresa(this.repdiariosRepo, 'tcorepdiariosId', tcorepdiariosId, 'Reporte Diario');
  }

  async createRepdiarios(dto: any, currentUser: string) {
    return this.createEntity(this.repdiariosRepo, dto, currentUser);
  }

  async updateRepdiarios(tcorepdiariosId: number, dto: any, currentUser: string) {
    return this.updateEntityNoEmpresa(this.repdiariosRepo, 'tcorepdiariosId', tcorepdiariosId, dto, currentUser, 'Reporte Diario');
  }

  async removeRepdiarios(tcorepdiariosId: number) {
    return this.softDeleteNoEmpresa(this.repdiariosRepo, 'tcorepdiariosId', tcorepdiariosId, 'Reporte Diario');
  }

  async findAllRepbalances(empresaId: number) {
    return this.repbalancesRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<Tcorepbalances>,
      order: { balcomId: 'ASC' } as any,
    });
  }

  async findRepbalances(balcomId: number) {
    return this.findOneByIdNoEmpresa(this.repbalancesRepo, 'balcomId', balcomId, 'Reporte Balance');
  }

  async createRepbalances(dto: any, currentUser: string) {
    return this.createEntity(this.repbalancesRepo, dto, currentUser);
  }

  async updateRepbalances(balcomId: number, dto: any, currentUser: string) {
    return this.updateEntityNoEmpresa(this.repbalancesRepo, 'balcomId', balcomId, dto, currentUser, 'Reporte Balance');
  }

  async findAllPeriodoctable(empresaId: number) {
    return this.findAllByEmpresa(this.periodoctableRepo, empresaId);
  }

  async findPeriodoctable(periodoscontableId: number, empresaId: number) {
    return this.findOneById(this.periodoctableRepo, 'periodoscontableId', periodoscontableId, empresaId, 'Periodo Contable');
  }

  async createPeriodoctable(dto: any, currentUser: string) {
    return this.createEntity(this.periodoctableRepo, dto, currentUser);
  }

  async updatePeriodoctable(periodoscontableId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.periodoctableRepo, 'periodoscontableId', periodoscontableId, empresaId, dto, currentUser, 'Periodo Contable');
  }

  async removePeriodoctable(periodoscontableId: number, empresaId: number) {
    return this.softDelete(this.periodoctableRepo, 'periodoscontableId', periodoscontableId, empresaId, 'Periodo Contable');
  }

  async findAllCopdamae(empresaId: number) {
    return this.copdamaeRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<Copdamae>,
      order: { fecharegistro: 'DESC' } as any,
    });
  }

  async findCopdamae(copdamaeId: number, empresaId: number) {
    return this.findOneById(this.copdamaeRepo, 'copdamaeId', copdamaeId, empresaId, 'Partida Mayor');
  }

  async createCopdamae(dto: CreateCopdamaeDto, currentUser: string) {
    return this.createEntity(this.copdamaeRepo, dto, currentUser);
  }

  async updateCopdamae(copdamaeId: number, empresaId: number, dto: UpdateCopdamaeDto, currentUser: string) {
    return this.updateEntity(this.copdamaeRepo, 'copdamaeId', copdamaeId, empresaId, dto, currentUser, 'Partida Mayor');
  }

  async removeCopdamae(copdamaeId: number, empresaId: number) {
    return this.softDelete(this.copdamaeRepo, 'copdamaeId', copdamaeId, empresaId, 'Partida Mayor');
  }

  async findAllCopdadet(empresaId: number) {
    return this.findAllByEmpresa(this.copdadetRepo, empresaId);
  }

  async findCopdadet(copdadetId: number, empresaId: number) {
    return this.findOneById(this.copdadetRepo, 'copdadetId', copdadetId, empresaId, 'Partida Detalle');
  }

  async createCopdadet(dto: CreateCopdadetDto, currentUser: string) {
    return this.createEntity(this.copdadetRepo, dto, currentUser);
  }

  async updateCopdadet(copdadetId: number, empresaId: number, dto: UpdateCopdadetDto, currentUser: string) {
    return this.updateEntity(this.copdadetRepo, 'copdadetId', copdadetId, empresaId, dto, currentUser, 'Partida Detalle');
  }

  async removeCopdadet(copdadetId: number, empresaId: number) {
    return this.softDelete(this.copdadetRepo, 'copdadetId', copdadetId, empresaId, 'Partida Detalle');
  }

  async findAllMovcta(empresaId: number) {
    return this.findAllByEmpresa(this.movctaRepo, empresaId);
  }

  async findMovcta(movctascontablesId: number, empresaId: number) {
    return this.findOneById(this.movctaRepo, 'movctascontablesId', movctascontablesId, empresaId, 'Movimiento Cuenta');
  }

  async createMovcta(dto: any, currentUser: string) {
    return this.createEntity(this.movctaRepo, dto, currentUser);
  }

  async updateMovcta(movctascontablesId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.movctaRepo, 'movctascontablesId', movctascontablesId, empresaId, dto, currentUser, 'Movimiento Cuenta');
  }

  async findAllNivelcta(empresaId: number) {
    return this.findAllByEmpresa(this.nivelctaRepo, empresaId);
  }

  async findNivelcta(nivelcontableId: number, empresaId: number) {
    return this.findOneById(this.nivelctaRepo, 'nivelcontableId', nivelcontableId, empresaId, 'Nivel Contable');
  }

  async createNivelcta(dto: any, currentUser: string) {
    return this.createEntity(this.nivelctaRepo, dto, currentUser);
  }

  async updateNivelcta(nivelcontableId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.nivelctaRepo, 'nivelcontableId', nivelcontableId, empresaId, dto, currentUser, 'Nivel Contable');
  }

  async removeNivelcta(nivelcontableId: number, empresaId: number) {
    return this.softDelete(this.nivelctaRepo, 'nivelcontableId', nivelcontableId, empresaId, 'Nivel Contable');
  }

  async findAllNaturalezacta(empresaId: number) {
    return this.findAllByEmpresa(this.naturalezactaRepo, empresaId);
  }

  async findNaturalezacta(naturalezaCtaId: number, empresaId: number) {
    return this.findOneById(this.naturalezactaRepo, 'naturalezaCtaId', naturalezaCtaId, empresaId, 'Naturaleza Cuenta');
  }

  async createNaturalezacta(dto: any, currentUser: string) {
    return this.createEntity(this.naturalezactaRepo, dto, currentUser);
  }

  async updateNaturalezacta(naturalezaCtaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.naturalezactaRepo, 'naturalezaCtaId', naturalezaCtaId, empresaId, dto, currentUser, 'Naturaleza Cuenta');
  }

  async findAllImpuestovecinal(empresaId: number) {
    return this.findAllByEmpresa(this.impuestovecinalRepo, empresaId);
  }

  async findImpuestovecinal(impvecinalId: number, empresaId: number) {
    return this.findOneById(this.impuestovecinalRepo, 'impvecinalId', impvecinalId, empresaId, 'Impuesto Vecinal');
  }

  async createImpuestovecinal(dto: any, currentUser: string) {
    return this.createEntity(this.impuestovecinalRepo, dto, currentUser);
  }

  async updateImpuestovecinal(impvecinalId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.impuestovecinalRepo, 'impvecinalId', impvecinalId, empresaId, dto, currentUser, 'Impuesto Vecinal');
  }

  async removeImpuestovecinal(impvecinalId: number, empresaId: number) {
    return this.softDelete(this.impuestovecinalRepo, 'impvecinalId', impvecinalId, empresaId, 'Impuesto Vecinal');
  }

  async findAllTipoDocFiscal(empresaId: number) {
    return this.findAllByEmpresa(this.tipoDocFiscalRepo, empresaId);
  }

  async findTipoDocFiscal(tipodocumentofiscalId: number, empresaId: number) {
    return this.findOneById(this.tipoDocFiscalRepo, 'tipodocumentofiscalId', tipodocumentofiscalId, empresaId, 'Tipo Documento Fiscal');
  }

  async createTipoDocFiscal(dto: any, currentUser: string) {
    return this.createEntity(this.tipoDocFiscalRepo, dto, currentUser);
  }

  async updateTipoDocFiscal(tipodocumentofiscalId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.tipoDocFiscalRepo, 'tipodocumentofiscalId', tipodocumentofiscalId, empresaId, dto, currentUser, 'Tipo Documento Fiscal');
  }

  async removeTipoDocFiscal(tipodocumentofiscalId: number, empresaId: number) {
    return this.softDelete(this.tipoDocFiscalRepo, 'tipodocumentofiscalId', tipodocumentofiscalId, empresaId, 'Tipo Documento Fiscal');
  }
}
