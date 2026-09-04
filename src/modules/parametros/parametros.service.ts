import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { TtipoMoneda } from './entities/moneda.entity';
import { TtipoPais } from './entities/pais.entity';
import { TtipoDeptoPais } from './entities/depto-pais.entity';
import { TtipoDeptoEmpresa } from './entities/depto-empresa.entity';
import { TtipoDireccion } from './entities/direccion.entity';
import { TtipoEstado } from './entities/estado.entity';
import { TtipoFormaPago } from './entities/forma-pago.entity';
import { TtipoTelefono } from './entities/telefono.entity';
import { TtipoTarjetaCredito } from './entities/tarjeta-credito.entity';
import { TtipoPasatiempo } from './entities/pasatiempo.entity';
import { TtipoZona } from './entities/zona.entity';
import { TtipoGestor } from './entities/gestor.entity';
import { TtipoImpuesto } from './entities/impuesto.entity';
import { TtipoProforma } from './entities/proforma.entity';
import { TtipoZonaVtaCob } from './entities/zona-vta-cob.entity';
import { TtipoParamBco } from './entities/param-bco.entity';
import { TtipoParamCon } from './entities/param-con.entity';
import { TtipoParamCxc } from './entities/param-cxc.entity';
import { TtipoParamCxp } from './entities/param-cxp.entity';
import { TtipoParamFac } from './entities/param-fac.entity';
import { TtipoParamInv } from './entities/param-inv.entity';
import { TtipoParamPap } from './entities/param-pap.entity';
import { TtipoParamPla } from './entities/param-pla.entity';
import { TtipoParamPres } from './entities/param-pres.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { PlPlEmpleados } from '../planilla/entities/plplempleados.entity';
import { TPosPrecioVtas } from '../facturacion/entities/tpospreciovtas.entity';

@Injectable()
export class ParametrosService {
  constructor(
    @InjectRepository(TtipoMoneda) private readonly monedaRepo: Repository<TtipoMoneda>,
    @InjectRepository(TtipoPais) private readonly paisRepo: Repository<TtipoPais>,
    @InjectRepository(TtipoDeptoPais) private readonly deptoPaisRepo: Repository<TtipoDeptoPais>,
    @InjectRepository(TtipoDeptoEmpresa) private readonly deptoEmpresaRepo: Repository<TtipoDeptoEmpresa>,
    @InjectRepository(TtipoDireccion) private readonly direccionRepo: Repository<TtipoDireccion>,
    @InjectRepository(TtipoEstado) private readonly estadoRepo: Repository<TtipoEstado>,
    @InjectRepository(TtipoFormaPago) private readonly formaPagoRepo: Repository<TtipoFormaPago>,
    @InjectRepository(TtipoTelefono) private readonly telefonoRepo: Repository<TtipoTelefono>,
    @InjectRepository(TtipoTarjetaCredito) private readonly tarjetaCreditoRepo: Repository<TtipoTarjetaCredito>,
    @InjectRepository(TtipoPasatiempo) private readonly pasatiempoRepo: Repository<TtipoPasatiempo>,
    @InjectRepository(TtipoZona) private readonly zonaRepo: Repository<TtipoZona>,
    @InjectRepository(TtipoGestor) private readonly gestorRepo: Repository<TtipoGestor>,
    @InjectRepository(TtipoImpuesto) private readonly impuestoRepo: Repository<TtipoImpuesto>,
    @InjectRepository(TtipoProforma) private readonly proformaRepo: Repository<TtipoProforma>,
    @InjectRepository(TtipoZonaVtaCob) private readonly zonaVtaCobRepo: Repository<TtipoZonaVtaCob>,
    @InjectRepository(TtipoParamBco) private readonly paramBcoRepo: Repository<TtipoParamBco>,
    @InjectRepository(TtipoParamCon) private readonly paramConRepo: Repository<TtipoParamCon>,
    @InjectRepository(TtipoParamCxc) private readonly paramCxcRepo: Repository<TtipoParamCxc>,
    @InjectRepository(TtipoParamCxp) private readonly paramCxpRepo: Repository<TtipoParamCxp>,
    @InjectRepository(TtipoParamFac) private readonly paramFacRepo: Repository<TtipoParamFac>,
    @InjectRepository(TtipoParamInv) private readonly paramInvRepo: Repository<TtipoParamInv>,
    @InjectRepository(TtipoParamPap) private readonly paramPapRepo: Repository<TtipoParamPap>,
    @InjectRepository(TtipoParamPla) private readonly paramPlaRepo: Repository<TtipoParamPla>,
    @InjectRepository(TtipoParamPres) private readonly paramPresRepo: Repository<TtipoParamPres>,
    @InjectRepository(TCoTipoDocumentoFiscal) private readonly tipoDocFiscalRepo: Repository<TCoTipoDocumentoFiscal>,
    @InjectRepository(PlPlEmpleados) private readonly empleadoRepo: Repository<PlPlEmpleados>,
    @InjectRepository(TPosPrecioVtas) private readonly posPrecioVtaRepo: Repository<TPosPrecioVtas>,
  ) {}

  
  findAllTiposDocFiscal(empresaId: number) {
    return this.findAllByEmpresa(this.tipoDocFiscalRepo, empresaId);
  }

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
    });
  }

  private async findAllSimple<T extends ObjectLiteral>(repo: Repository<T>) {
    return repo.find();
  }

  private async findOneById<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number,
    empresaId: number,
    entityName: string,
  ) {
    const where = { [idField]: id, empresaId } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} ${id} no encontrado`);
    return found;
  }

  private async findOneByEmpresaId<T extends ObjectLiteral>(
    repo: Repository<T>,
    empresaId: number,
    entityName: string,
  ) {
    const where = { empresaId } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} empresa ${empresaId} no encontrado`);
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
    id: number,
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

  private async upsertParam<T extends ObjectLiteral>(
    repo: Repository<T>,
    empresaId: number,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const found = await repo.findOne({ where: { empresaId } as unknown as FindOptionsWhere<T> });
    if (found) {
      Object.assign(found, dto, {
        usuarioUpdated: currentUser,
        fechaUpdated: new Date(),
      });
      return repo.save(found);
    }
    const entity = repo.create({
      empresaId,
      ...dto,
      usuarioCreated: currentUser,
    });
    return repo.save(entity);
  }

  private async softDelete<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number,
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

  async findAllMonedas(empresaId: number) {
    return this.findAllByEmpresa(this.monedaRepo, empresaId);
  }

  async findMoneda(monedaId: number, empresaId: number) {
    return this.findOneById(this.monedaRepo, 'monedaId', monedaId, empresaId, 'Moneda');
  }

  async createMoneda(dto: any, currentUser: string) {
    return this.createEntity(this.monedaRepo, dto, currentUser);
  }

  async updateMoneda(monedaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.monedaRepo, 'monedaId', monedaId, empresaId, dto, currentUser, 'Moneda');
  }

  async removeMoneda(monedaId: number, empresaId: number) {
    return this.softDelete(this.monedaRepo, 'monedaId', monedaId, empresaId, 'Moneda');
  }

  async findAllPaises(empresaId: number) {
    return this.findAllByEmpresa(this.paisRepo, empresaId);
  }

  async findPais(paisId: number, empresaId: number) {
    return this.findOneById(this.paisRepo, 'paisId', paisId, empresaId, 'Pais');
  }

  async createPais(dto: any, currentUser: string) {
    return this.createEntity(this.paisRepo, dto, currentUser);
  }

  async updatePais(paisId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.paisRepo, 'paisId', paisId, empresaId, dto, currentUser, 'Pais');
  }

  async removePais(paisId: number, empresaId: number) {
    return this.softDelete(this.paisRepo, 'paisId', paisId, empresaId, 'Pais');
  }

  async findAllDeptoPais(empresaId: number) {
    return this.findAllByEmpresa(this.deptoPaisRepo, empresaId);
  }

  async findDeptoPais(ttipodeptopaisId: number, empresaId: number) {
    return this.findOneById(this.deptoPaisRepo, 'ttipodeptopaisId', ttipodeptopaisId, empresaId, 'Depto Pais');
  }

  async createDeptoPais(dto: any, currentUser: string) {
    return this.createEntity(this.deptoPaisRepo, dto, currentUser);
  }

  async updateDeptoPais(ttipodeptopaisId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.deptoPaisRepo, 'ttipodeptopaisId', ttipodeptopaisId, empresaId, dto, currentUser, 'Depto Pais');
  }

  async removeDeptoPais(ttipodeptopaisId: number, empresaId: number) {
    return this.softDelete(this.deptoPaisRepo, 'ttipodeptopaisId', ttipodeptopaisId, empresaId, 'Depto Pais');
  }

  async findAllDeptoEmpresa(empresaId: number) {
    return this.findAllByEmpresa(this.deptoEmpresaRepo, empresaId);
  }

  async findDeptoEmpresa(departamentostempresasId: number, empresaId: number) {
    return this.findOneById(this.deptoEmpresaRepo, 'departamentostempresasId', departamentostempresasId, empresaId, 'Depto Empresa');
  }

  async createDeptoEmpresa(dto: any, currentUser: string) {
    return this.createEntity(this.deptoEmpresaRepo, dto, currentUser);
  }

  async updateDeptoEmpresa(departamentostempresasId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.deptoEmpresaRepo, 'departamentostempresasId', departamentostempresasId, empresaId, dto, currentUser, 'Depto Empresa');
  }

  async removeDeptoEmpresa(departamentostempresasId: number, empresaId: number) {
    return this.softDelete(this.deptoEmpresaRepo, 'departamentostempresasId', departamentostempresasId, empresaId, 'Depto Empresa');
  }

  async findAllDirecciones(empresaId: number) {
    return this.findAllByEmpresa(this.direccionRepo, empresaId);
  }

  async findDireccion(direccionId: number, empresaId: number) {
    return this.findOneById(this.direccionRepo, 'direccionId', direccionId, empresaId, 'Direccion');
  }

  async createDireccion(dto: any, currentUser: string) {
    return this.createEntity(this.direccionRepo, dto, currentUser);
  }

  async updateDireccion(direccionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.direccionRepo, 'direccionId', direccionId, empresaId, dto, currentUser, 'Direccion');
  }

  async removeDireccion(direccionId: number, empresaId: number) {
    return this.softDelete(this.direccionRepo, 'direccionId', direccionId, empresaId, 'Direccion');
  }

  async findAllEstados(empresaId: number) {
    return this.findAllByEmpresa(this.estadoRepo, empresaId);
  }

  async findEstado(estadoId: number, empresaId: number) {
    return this.findOneById(this.estadoRepo, 'estadoId', estadoId, empresaId, 'Estado');
  }

  async createEstado(dto: any, currentUser: string) {
    return this.createEntity(this.estadoRepo, dto, currentUser);
  }

  async updateEstado(estadoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.estadoRepo, 'estadoId', estadoId, empresaId, dto, currentUser, 'Estado');
  }

  async removeEstado(estadoId: number, empresaId: number) {
    return this.softDelete(this.estadoRepo, 'estadoId', estadoId, empresaId, 'Estado');
  }

  async findAllFormasPago(empresaId: number) {
    return this.findAllByEmpresa(this.formaPagoRepo, empresaId);
  }

  async findFormaPago(formapagoId: number, empresaId: number) {
    return this.findOneById(this.formaPagoRepo, 'formapagoId', formapagoId, empresaId, 'Forma Pago');
  }

  async createFormaPago(dto: any, currentUser: string) {
    return this.createEntity(this.formaPagoRepo, dto, currentUser);
  }

  async updateFormaPago(formapagoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.formaPagoRepo, 'formapagoId', formapagoId, empresaId, dto, currentUser, 'Forma Pago');
  }

  async removeFormaPago(formapagoId: number, empresaId: number) {
    return this.softDelete(this.formaPagoRepo, 'formapagoId', formapagoId, empresaId, 'Forma Pago');
  }

  async findAllTelefonos(empresaId: number) {
    return this.findAllByEmpresa(this.telefonoRepo, empresaId);
  }

  async findTelefono(telefonoId: number, empresaId: number) {
    return this.findOneById(this.telefonoRepo, 'telefonoId', telefonoId, empresaId, 'Telefono');
  }

  async createTelefono(dto: any, currentUser: string) {
    return this.createEntity(this.telefonoRepo, dto, currentUser);
  }

  async updateTelefono(telefonoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.telefonoRepo, 'telefonoId', telefonoId, empresaId, dto, currentUser, 'Telefono');
  }

  async removeTelefono(telefonoId: number, empresaId: number) {
    return this.softDelete(this.telefonoRepo, 'telefonoId', telefonoId, empresaId, 'Telefono');
  }

  async findAllTarjetasCredito(empresaId: number) {
    return this.findAllByEmpresa(this.tarjetaCreditoRepo, empresaId);
  }

  async findTarjetaCredito(tarjetacreditoId: number, empresaId: number) {
    return this.findOneById(this.tarjetaCreditoRepo, 'tarjetacreditoId', tarjetacreditoId, empresaId, 'Tarjeta Credito');
  }

  async createTarjetaCredito(dto: any, currentUser: string) {
    return this.createEntity(this.tarjetaCreditoRepo, dto, currentUser);
  }

  async updateTarjetaCredito(tarjetacreditoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.tarjetaCreditoRepo, 'tarjetacreditoId', tarjetacreditoId, empresaId, dto, currentUser, 'Tarjeta Credito');
  }

  async removeTarjetaCredito(tarjetacreditoId: number, empresaId: number) {
    return this.softDelete(this.tarjetaCreditoRepo, 'tarjetacreditoId', tarjetacreditoId, empresaId, 'Tarjeta Credito');
  }

  async findAllPasatiempos() {
    return this.findAllSimple(this.pasatiempoRepo);
  }

  async findPasatiempo(pasatiempoId: number) {
    const found = await this.pasatiempoRepo.findOne({ where: { pasatiempoId } });
    if (!found) throw new NotFoundException(`Pasatiempo ${pasatiempoId} no encontrado`);
    return found;
  }

  async createPasatiempo(dto: any, currentUser: string) {
    return this.createEntity(this.pasatiempoRepo, dto, currentUser);
  }

  async updatePasatiempo(pasatiempoId: number, dto: any, currentUser: string) {
    const entity = await this.findPasatiempo(pasatiempoId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.pasatiempoRepo.save(entity);
  }

  async removePasatiempo(pasatiempoId: number) {
    const entity = await this.findPasatiempo(pasatiempoId);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return this.pasatiempoRepo.save(entity);
  }

  async findAllZonas(empresaId: number) {
    return this.findAllByEmpresa(this.zonaRepo, empresaId);
  }

  async findZona(tzonadId: number, empresaId: number) {
    return this.findOneById(this.zonaRepo, 'tzonadId', tzonadId, empresaId, 'Zona');
  }

  async createZona(dto: any, currentUser: string) {
    return this.createEntity(this.zonaRepo, dto, currentUser);
  }

  async updateZona(tzonadId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.zonaRepo, 'tzonadId', tzonadId, empresaId, dto, currentUser, 'Zona');
  }

  async removeZona(tzonadId: number, empresaId: number) {
    return this.softDelete(this.zonaRepo, 'tzonadId', tzonadId, empresaId, 'Zona');
  }

  async findAllGestores(empresaId: number) {
    return this.gestorRepo
      .createQueryBuilder('g')
      .leftJoin(PlPlEmpleados, 'e', 'e.empleadoId = g.empleadoId')
      .addSelect("CONCAT(e.nombres, ' ', e.apellidos)", 'nombre')
      .where('g.empresaId = :empresaId', { empresaId })
      .getRawMany();
  }

  async findGestor(gestorId: number, empresaId: number) {
    return this.findOneById(this.gestorRepo, 'gestorId', gestorId, empresaId, 'Gestor');
  }

  async createGestor(dto: any, currentUser: string) {
    return this.createEntity(this.gestorRepo, dto, currentUser);
  }

  async updateGestor(gestorId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.gestorRepo, 'gestorId', gestorId, empresaId, dto, currentUser, 'Gestor');
  }

  async removeGestor(gestorId: number, empresaId: number) {
    return this.softDelete(this.gestorRepo, 'gestorId', gestorId, empresaId, 'Gestor');
  }

  async findAllImpuestos(empresaId: number) {
    return this.findAllByEmpresa(this.impuestoRepo, empresaId);
  }

  async findImpuesto(impuestoId: number, empresaId: number) {
    return this.findOneById(this.impuestoRepo, 'impuestoId', impuestoId, empresaId, 'Impuesto');
  }

  async createImpuesto(dto: any, currentUser: string) {
    return this.createEntity(this.impuestoRepo, dto, currentUser);
  }

  async updateImpuesto(impuestoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.impuestoRepo, 'impuestoId', impuestoId, empresaId, dto, currentUser, 'Impuesto');
  }

  async removeImpuesto(impuestoId: number, empresaId: number) {
    return this.softDelete(this.impuestoRepo, 'impuestoId', impuestoId, empresaId, 'Impuesto');
  }

  async findAllProformas(empresaId: number) {
    return this.findAllByEmpresa(this.proformaRepo, empresaId);
  }

  async findProforma(proformaId: number, empresaId: number) {
    return this.findOneById(this.proformaRepo, 'proformaId', proformaId, empresaId, 'Proforma');
  }

  async createProforma(dto: any, currentUser: string) {
    return this.createEntity(this.proformaRepo, dto, currentUser);
  }

  async updateProforma(proformaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.proformaRepo, 'proformaId', proformaId, empresaId, dto, currentUser, 'Proforma');
  }

  async removeProforma(proformaId: number, empresaId: number) {
    return this.softDelete(this.proformaRepo, 'proformaId', proformaId, empresaId, 'Proforma');
  }

  async findAllZonasVtaCob(empresaId: number) {
    return this.findAllByEmpresa(this.zonaVtaCobRepo, empresaId);
  }

  async findZonaVtaCob(ttipozonasvtacobId: number, empresaId: number) {
    return this.findOneById(this.zonaVtaCobRepo, 'ttipozonasvtacobId', ttipozonasvtacobId, empresaId, 'Zona Vta Cob');
  }

  async createZonaVtaCob(dto: any, currentUser: string) {
    return this.createEntity(this.zonaVtaCobRepo, dto, currentUser);
  }

  async updateZonaVtaCob(ttipozonasvtacobId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.zonaVtaCobRepo, 'ttipozonasvtacobId', ttipozonasvtacobId, empresaId, dto, currentUser, 'Zona Vta Cob');
  }

  async removeZonaVtaCob(ttipozonasvtacobId: number, empresaId: number) {
    return this.softDelete(this.zonaVtaCobRepo, 'ttipozonasvtacobId', ttipozonasvtacobId, empresaId, 'Zona Vta Cob');
  }

  async findParamBco(empresaId: number) {
    return this.findOneByEmpresaId(this.paramBcoRepo, empresaId, 'Param Bco');
  }

  async upsertParamBco(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramBcoRepo, empresaId, dto, currentUser, 'Param Bco');
  }

  async findParamCon(empresaId: number) {
    return this.findOneByEmpresaId(this.paramConRepo, empresaId, 'Param Con');
  }

  async upsertParamCon(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramConRepo, empresaId, dto, currentUser, 'Param Con');
  }

  async findParamCxc(empresaId: number) {
    return this.findOneByEmpresaId(this.paramCxcRepo, empresaId, 'Param Cxc');
  }

  async upsertParamCxc(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramCxcRepo, empresaId, dto, currentUser, 'Param Cxc');
  }

  async findParamCxp(empresaId: number) {
    return this.findOneByEmpresaId(this.paramCxpRepo, empresaId, 'Param Cxp');
  }

  async upsertParamCxp(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramCxpRepo, empresaId, dto, currentUser, 'Param Cxp');
  }

  async findParamFac(empresaId: number) {
    return this.findOneByEmpresaId(this.paramFacRepo, empresaId, 'Param Fac');
  }

  async upsertParamFac(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramFacRepo, empresaId, dto, currentUser, 'Param Fac');
  }

  async findParamInv(empresaId: number) {
    return this.findOneByEmpresaId(this.paramInvRepo, empresaId, 'Param Inv');
  }

  async upsertParamInv(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramInvRepo, empresaId, dto, currentUser, 'Param Inv');
  }

  async findParamPap(empresaId: number) {
    return this.findOneByEmpresaId(this.paramPapRepo, empresaId, 'Param Pap');
  }

  async upsertParamPap(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramPapRepo, empresaId, dto, currentUser, 'Param Pap');
  }

  async findParamPla(empresaId: number) {
    return this.findOneByEmpresaId(this.paramPlaRepo, empresaId, 'Param Pla');
  }

  async upsertParamPla(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramPlaRepo, empresaId, dto, currentUser, 'Param Pla');
  }

  async findParamPres(empresaId: number) {
    return this.findOneByEmpresaId(this.paramPresRepo, empresaId, 'Param Pres');
  }

  async upsertParamPres(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramPresRepo, empresaId, dto, currentUser, 'Param Pres');
  }

  async findAllPreciosVta(empresaId: number) {
    return this.posPrecioVtaRepo.find({
      where: { empresaId, sn_activo: 'S' } as any,
      order: { descripcion: 'ASC' } as any,
    });
  }

  async findPreciosVta(preciovtaId: number, empresaId: number) {
    return this.posPrecioVtaRepo.findOne({
      where: { preciovtaId, empresaId } as any,
    });
  }
}
