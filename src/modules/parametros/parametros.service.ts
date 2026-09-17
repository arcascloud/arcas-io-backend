import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
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
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { PlPlEmpleados } from '../planilla/entities/plplempleados.entity';
import { TPosPrecioVtas } from '../facturacion/entities/tpospreciovtas.entity';
import { TipoParametro } from './entities/tipo-parametro.entity';

@Injectable()
export class ParametrosService {
  constructor(
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
    @InjectRepository(TipoParametro) private readonly tipoParametroRepoDup: Repository<TipoParametro>,
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
    @InjectRepository(TCoTipoDocumentoFiscal) private readonly tipoDocFiscalRepo: Repository<TCoTipoDocumentoFiscal>,
    @InjectRepository(PlPlEmpleados) private readonly empleadoRepo: Repository<PlPlEmpleados>,
    @InjectRepository(TPosPrecioVtas) private readonly posPrecioVtaRepo: Repository<TPosPrecioVtas>,
    private readonly fechaSistema: FechaSistemaService,
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
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
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
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
    });
    return repo.save(entity);
  }

  // ── Monedas ──────────────────────────────────────────────
  async findAllMonedas(empresaId: number) { return this.findAllByEmpresa(this.monedaRepo, empresaId); }
  async findMoneda(id: number, empresaId: number) { return this.findOneById(this.monedaRepo, 'monedaId', id, empresaId, 'Moneda'); }
  async createMoneda(dto: any, user: string) { return this.createEntity(this.monedaRepo, dto, user); }
  async updateMoneda(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.monedaRepo, 'monedaId', id, eid, dto, user, 'Moneda'); }
  async removeMoneda(id: number, eid: number) { return this.softDelete(this.monedaRepo, 'monedaId', id, eid, 'Moneda'); }

  // ── Países ───────────────────────────────────────────────
  async findAllPaises(empresaId: number) { return this.findAllByEmpresa(this.paisRepo, empresaId); }
  async findPais(id: number, empresaId: number) { return this.findOneById(this.paisRepo, 'paisId', id, empresaId, 'Pais'); }
  async createPais(dto: any, user: string) { return this.createEntity(this.paisRepo, dto, user); }
  async updatePais(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.paisRepo, 'paisId', id, eid, dto, user, 'Pais'); }
  async removePais(id: number, eid: number) { return this.softDelete(this.paisRepo, 'paisId', id, eid, 'Pais'); }

  // ── Depto País ───────────────────────────────────────────
  async findAllDeptoPais(empresaId: number) { return this.findAllByEmpresa(this.deptoPaisRepo, empresaId); }
  async findDeptoPais(id: number, empresaId: number) { return this.findOneById(this.deptoPaisRepo, 'ttipodeptopaisId', id, empresaId, 'Depto Pais'); }
  async createDeptoPais(dto: any, user: string) { return this.createEntity(this.deptoPaisRepo, dto, user); }
  async updateDeptoPais(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.deptoPaisRepo, 'ttipodeptopaisId', id, eid, dto, user, 'Depto Pais'); }
  async removeDeptoPais(id: number, eid: number) { return this.softDelete(this.deptoPaisRepo, 'ttipodeptopaisId', id, eid, 'Depto Pais'); }

  // ── Depto Empresa ────────────────────────────────────────
  async findAllDeptoEmpresa(empresaId: number) { return this.findAllByEmpresa(this.deptoEmpresaRepo, empresaId); }
  async findDeptoEmpresa(id: number, empresaId: number) { return this.findOneById(this.deptoEmpresaRepo, 'departamentostempresasId', id, empresaId, 'Depto Empresa'); }
  async createDeptoEmpresa(dto: any, user: string) { return this.createEntity(this.deptoEmpresaRepo, dto, user); }
  async updateDeptoEmpresa(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.deptoEmpresaRepo, 'departamentostempresasId', id, eid, dto, user, 'Depto Empresa'); }
  async removeDeptoEmpresa(id: number, eid: number) { return this.softDelete(this.deptoEmpresaRepo, 'departamentostempresasId', id, eid, 'Depto Empresa'); }

  // ── Direcciones ──────────────────────────────────────────
  async findAllDirecciones(empresaId: number) { return this.findAllByEmpresa(this.direccionRepo, empresaId); }
  async findDireccion(id: number, empresaId: number) { return this.findOneById(this.direccionRepo, 'direccionId', id, empresaId, 'Direccion'); }
  async createDireccion(dto: any, user: string) { return this.createEntity(this.direccionRepo, dto, user); }
  async updateDireccion(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.direccionRepo, 'direccionId', id, eid, dto, user, 'Direccion'); }
  async removeDireccion(id: number, eid: number) { return this.softDelete(this.direccionRepo, 'direccionId', id, eid, 'Direccion'); }

  // ── Estados ──────────────────────────────────────────────
  async findAllEstados(empresaId: number) { return this.findAllByEmpresa(this.estadoRepo, empresaId); }
  async findEstado(id: number, empresaId: number) { return this.findOneById(this.estadoRepo, 'estadoId', id, empresaId, 'Estado'); }
  async createEstado(dto: any, user: string) { return this.createEntity(this.estadoRepo, dto, user); }
  async updateEstado(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.estadoRepo, 'estadoId', id, eid, dto, user, 'Estado'); }
  async removeEstado(id: number, eid: number) { return this.softDelete(this.estadoRepo, 'estadoId', id, eid, 'Estado'); }

  // ── Formas de Pago ───────────────────────────────────────
  async findAllFormasPago(empresaId: number) { return this.findAllByEmpresa(this.formaPagoRepo, empresaId); }
  async findFormaPago(id: number, empresaId: number) { return this.findOneById(this.formaPagoRepo, 'formapagoId', id, empresaId, 'Forma Pago'); }
  async createFormaPago(dto: any, user: string) { return this.createEntity(this.formaPagoRepo, dto, user); }
  async updateFormaPago(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.formaPagoRepo, 'formapagoId', id, eid, dto, user, 'Forma Pago'); }
  async removeFormaPago(id: number, eid: number) { return this.softDelete(this.formaPagoRepo, 'formapagoId', id, eid, 'Forma Pago'); }

  // ── Teléfonos ────────────────────────────────────────────
  async findAllTelefonos(empresaId: number) { return this.findAllByEmpresa(this.telefonoRepo, empresaId); }
  async findTelefono(id: number, empresaId: number) { return this.findOneById(this.telefonoRepo, 'telefonoId', id, empresaId, 'Telefono'); }
  async createTelefono(dto: any, user: string) { return this.createEntity(this.telefonoRepo, dto, user); }
  async updateTelefono(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.telefonoRepo, 'telefonoId', id, eid, dto, user, 'Telefono'); }
  async removeTelefono(id: number, eid: number) { return this.softDelete(this.telefonoRepo, 'telefonoId', id, eid, 'Telefono'); }

  // ── Tarjetas de Crédito ──────────────────────────────────
  async findAllTarjetasCredito(empresaId: number) { return this.findAllByEmpresa(this.tarjetaCreditoRepo, empresaId); }
  async findTarjetaCredito(id: number, empresaId: number) { return this.findOneById(this.tarjetaCreditoRepo, 'tarjetacreditoId', id, empresaId, 'Tarjeta Credito'); }
  async createTarjetaCredito(dto: any, user: string) { return this.createEntity(this.tarjetaCreditoRepo, dto, user); }
  async updateTarjetaCredito(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.tarjetaCreditoRepo, 'tarjetacreditoId', id, eid, dto, user, 'Tarjeta Credito'); }
  async removeTarjetaCredito(id: number, eid: number) { return this.softDelete(this.tarjetaCreditoRepo, 'tarjetacreditoId', id, eid, 'Tarjeta Credito'); }

  // ── Pasatiempos ──────────────────────────────────────────
  async findAllPasatiempos(empresaId: number) { return this.findAllByEmpresa(this.pasatiempoRepo, empresaId); }
  async findPasatiempo(id: number, empresaId: number) { return this.findOneById(this.pasatiempoRepo, 'pasatiempoId', id, empresaId, 'Pasatiempo'); }
  async createPasatiempo(dto: any, user: string) { return this.createEntity(this.pasatiempoRepo, dto, user); }
  async updatePasatiempo(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.pasatiempoRepo, 'pasatiempoId', id, eid, dto, user, 'Pasatiempo'); }
  async removePasatiempo(id: number, eid: number) { return this.softDelete(this.pasatiempoRepo, 'pasatiempoId', id, eid, 'Pasatiempo'); }

  // ── Zonas ────────────────────────────────────────────────
  async findAllZonas(empresaId: number) { return this.findAllByEmpresa(this.zonaRepo, empresaId); }
  async findZona(id: number, empresaId: number) { return this.findOneById(this.zonaRepo, 'tzonadId', id, empresaId, 'Zona'); }
  async createZona(dto: any, user: string) { return this.createEntity(this.zonaRepo, dto, user); }
  async updateZona(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.zonaRepo, 'tzonadId', id, eid, dto, user, 'Zona'); }
  async removeZona(id: number, eid: number) { return this.softDelete(this.zonaRepo, 'tzonadId', id, eid, 'Zona'); }

  // ── Gestores ─────────────────────────────────────────────
  async findAllGestores(empresaId: number) {
    return this.gestorRepo
      .createQueryBuilder('g')
      .leftJoin(PlPlEmpleados, 'e', 'e.empleadoId = g.empleadoId')
      .addSelect("CONCAT(e.nombres, ' ', e.apellidos)", 'nombre')
      .where('g.empresaId = :empresaId', { empresaId })
      .getRawMany();
  }
  async findGestor(id: number, empresaId: number) { return this.findOneById(this.gestorRepo, 'gestorId', id, empresaId, 'Gestor'); }
  async createGestor(dto: any, user: string) { return this.createEntity(this.gestorRepo, dto, user); }
  async updateGestor(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.gestorRepo, 'gestorId', id, eid, dto, user, 'Gestor'); }
  async removeGestor(id: number, eid: number) { return this.softDelete(this.gestorRepo, 'gestorId', id, eid, 'Gestor'); }

  // ── Impuestos ────────────────────────────────────────────
  async findAllImpuestos(empresaId: number) { return this.findAllByEmpresa(this.impuestoRepo, empresaId); }
  async findImpuesto(id: number, empresaId: number) { return this.findOneById(this.impuestoRepo, 'impuestoId', id, empresaId, 'Impuesto'); }
  async createImpuesto(dto: any, user: string) { return this.createEntity(this.impuestoRepo, dto, user); }
  async updateImpuesto(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.impuestoRepo, 'impuestoId', id, eid, dto, user, 'Impuesto'); }
  async removeImpuesto(id: number, eid: number) { return this.softDelete(this.impuestoRepo, 'impuestoId', id, eid, 'Impuesto'); }

  // ── Proformas ────────────────────────────────────────────
  async findAllProformas(empresaId: number) { return this.findAllByEmpresa(this.proformaRepo, empresaId); }
  async findProforma(id: number, empresaId: number) { return this.findOneById(this.proformaRepo, 'proformaId', id, empresaId, 'Proforma'); }
  async createProforma(dto: any, user: string) { return this.createEntity(this.proformaRepo, dto, user); }
  async updateProforma(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.proformaRepo, 'proformaId', id, eid, dto, user, 'Proforma'); }
  async removeProforma(id: number, eid: number) { return this.softDelete(this.proformaRepo, 'proformaId', id, eid, 'Proforma'); }

  // ── Zonas Vta/Cob ───────────────────────────────────────
  async findAllZonasVtaCob(empresaId: number) { return this.findAllByEmpresa(this.zonaVtaCobRepo, empresaId); }
  async findZonaVtaCob(id: number, empresaId: number) { return this.findOneById(this.zonaVtaCobRepo, 'ttipozonasvtacobId', id, empresaId, 'Zona Vta Cob'); }
  async createZonaVtaCob(dto: any, user: string) { return this.createEntity(this.zonaVtaCobRepo, dto, user); }
  async updateZonaVtaCob(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.zonaVtaCobRepo, 'ttipozonasvtacobId', id, eid, dto, user, 'Zona Vta Cob'); }
  async removeZonaVtaCob(id: number, eid: number) { return this.softDelete(this.zonaVtaCobRepo, 'ttipozonasvtacobId', id, eid, 'Zona Vta Cob'); }

  // ── Precios de Venta ─────────────────────────────────────
  async findAllPreciosVta(empresaId: number) {
    return this.posPrecioVtaRepo.find({
      where: { empresaId, sn_activo: 'S' } as any,
      order: { descripcion: 'ASC' } as any,
    });
  }
  async findPreciosVta(id: number, empresaId: number) {
    return this.posPrecioVtaRepo.findOne({ where: { preciovtaId: id, empresaId } as any });
  }

  // ══════════════════════════════════════════════════════════
  // PARÁMETROS UNIFICADOS (ttipoparametros)
  // ══════════════════════════════════════════════════════════

  async findAllParametros(empresaId: number, moduloId?: number) {
    const where: any = { empresaId, sn_activo: 'S' };
    if (moduloId) where.moduloId = moduloId;
    return this.tipoParametroRepo.find({ where, order: { moduloId: 'ASC', field: 'ASC' } });
  }

  async findParametroById(id: number) {
    const found = await this.tipoParametroRepo.findOne({ where: { ttipoparametrosId: id } });
    if (!found) throw new NotFoundException(`Parámetro ${id} no encontrado`);
    return found;
  }

  async findParametroByField(empresaId: number, moduloId: number, field: string) {
    return this.tipoParametroRepo.findOne({
      where: { empresaId, moduloId, field, sn_activo: 'S' } as any,
    });
  }

  async upsertParametroModulo(empresaId: number, moduloId: number, field: string, valor: string, tipo: string, currentUser: string) {
    const existing = await this.tipoParametroRepo.findOne({
      where: { empresaId, moduloId, field } as any,
    });
    if (existing) {
      existing.valor = valor;
      existing.tipo = tipo;
      existing.usuarioUpdate = currentUser;
      existing.fechaUpdate = await this.fechaSistema.getFecha(empresaId);
      return this.tipoParametroRepo.save(existing);
    }
    const entity = this.tipoParametroRepo.create({
      empresaId, moduloId, field, valor, tipo,
      sn_activo: 'S',
      usuarioCreated: currentUser,
    });
    return this.tipoParametroRepo.save(entity);
  }

  async upsertParametrosLote(empresaId: number, moduloId: number, items: { field: string; valor: string; tipo: string; sn_activo?: string }[], currentUser: string) {
    const results: TipoParametro[] = [];
    for (const item of items) {
      const result = await this.upsertParametroModulo(empresaId, moduloId, item.field, item.valor, item.tipo, currentUser);
      results.push(result);
    }
    return results;
  }

  async getParametrosComoObjeto(empresaId: number, moduloId: number) {
    const rows = await this.tipoParametroRepo.find({
      where: { empresaId, moduloId, sn_activo: 'S' } as any,
    });
    const obj: Record<string, string> = {};
    for (const row of rows) { obj[row.field] = row.valor; }
    return obj;
  }

  async deleteParametro(id: number) {
    const found = await this.findParametroById(id);
    found.sn_activo = 'N';
    found.fechaUpdate = await this.fechaSistema.getFecha(found.empresaId);
    return this.tipoParametroRepo.save(found);
  }

  async getValor(empresaId: number, moduloId: number, field: string, defaultValue?: string) {
    const row = await this.tipoParametroRepo.findOne({
      where: { empresaId, moduloId, field, sn_activo: 'S' } as any,
    });
    return row ? row.valor : (defaultValue || '0');
  }

  async setValor(empresaId: number, moduloId: number, field: string, valor: string, currentUser: string) {
    return this.upsertParametroModulo(empresaId, moduloId, field, valor, 'STRING', currentUser);
  }

  async incrementarValor(empresaId: number, moduloId: number, field: string, currentUser: string, incremento: number = 1) {
    const actual = await this.getValor(empresaId, moduloId, field, '0');
    const nuevo = String(Number(actual) + incremento);
    return this.upsertParametroModulo(empresaId, moduloId, field, nuevo, 'NUMBER', currentUser);
  }
}
