import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral, Not } from 'typeorm';
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
import { TTipoMes } from './entities/tipo-mes.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { PlEmpleados } from '../planilla/entities/plempleados.entity';
import { TPosPrecioVtas } from '../facturacion/entities/tpospreciovtas.entity';
import { TipoParametro, GrupoTipoParametro } from './entities/tipo-parametro.entity';
import { TusuarioCaja } from './entities/usuario-caja.entity';
import { TtipoWorldCity } from './entities/world-city.entity';
import { Tusuarios } from '../users/entities/usuario.entity';

@Injectable()
export class ParametrosService {
  constructor(
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
    @InjectRepository(TipoParametro) private readonly tipoParametroRepoDup: Repository<TipoParametro>,
    @InjectRepository(TTipoMes) private readonly mesRepo: Repository<TTipoMes>,
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
    @InjectRepository(PlEmpleados) private readonly empleadoRepo: Repository<PlEmpleados>,
    @InjectRepository(TPosPrecioVtas) private readonly posPrecioVtaRepo: Repository<TPosPrecioVtas>,
    @InjectRepository(TusuarioCaja) private readonly usuarioCajaRepo: Repository<TusuarioCaja>,
    @InjectRepository(TtipoWorldCity) private readonly worldCityRepo: Repository<TtipoWorldCity>,
    @InjectRepository(Tusuarios) private readonly usuarioRepo: Repository<Tusuarios>,
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
  async findDeptoEmpresa(id: number, empresaId: number) { return this.findOneById(this.deptoEmpresaRepo, 'deptoId', id, empresaId, 'Depto Empresa'); }
  async createDeptoEmpresa(dto: any, user: string) { return this.createEntity(this.deptoEmpresaRepo, dto, user); }
  async updateDeptoEmpresa(id: number, eid: number, dto: any, user: string) { return this.updateEntity(this.deptoEmpresaRepo, 'deptoId', id, eid, dto, user, 'Depto Empresa'); }
  async removeDeptoEmpresa(id: number, eid: number) { return this.softDelete(this.deptoEmpresaRepo, 'deptoId', id, eid, 'Depto Empresa'); }

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
    // Shape PLANO (gestorId, moduloId, ...) + nombre del empleado: lo consumen
    // el catálogo genérico (idKey 'gestorId'), factura, cotizaciones y
    // nueva-factura (que busca por empresaId/usuarioId/gestorId).
    const raw = await this.gestorRepo
      .createQueryBuilder('g')
      .leftJoin(PlEmpleados, 'e', 'e.empleadoId = g.empleadoId')
      .addSelect("CONCAT(e.nombres, ' ', e.apellidos)", 'nombre')
      .where('g.empresaId = :empresaId', { empresaId })
      .getRawMany();
    return raw.map((r) => ({
      gestorId: r.g_gestorId,
      moduloId: r.g_moduloId,
      empleadoId: r.g_empleadoId,
      usuarioId: r.g_usuarioId,
      sn_activo: r.g_sn_activo,
      sn_vendedor: r.g_sn_vendedor,
      empresaId: r.g_empresaId,
      usuarioCreated: r.g_usuarioCreated,
      usuarioUpdated: r.g_usuarioUpdated,
      fechaUpdated: r.g_fechaUpdated,
      nombre: r.nombre,
    }));
  }
  async findGestor(id: number, empresaId: number) { return this.findOneById(this.gestorRepo, 'gestorId', id, empresaId, 'Gestor'); }

  /**
   * Mensaje de duplicado (empleado + empresa = único, clave `gestoresUnique(empleadoId, empresaId)`);
   * se describe el rol que YA tiene el empleado (módulo del registro existente):
   *  - módulo 3 (Facturación) → "… ya se encuentra registrada como vendedora"
   *  - módulo 4 (CxC)         → "… ya se encuentra registrada como gestora de cobro"
   * El género (vendedora/vendedor) sale del sexo del empleado en plplempleados.
   * Si el módulo existente no está en la lista, se usa el módulo solicitado.
   */
  private async mensajeGestorDuplicado(moduloId: number, empleadoId: number): Promise<string> {
    let nombre = `Empleado #${empleadoId}`;
    let fem = false;
    try {
      const emp = await this.empleadoRepo.findOne({ where: { empleadoId } as any });
      if (emp) {
        nombre = `${emp.nombres} ${emp.apellidos}`.trim();
        fem = emp.sexo === 'F';
      }
    } catch { /* sin empleado: se usa el fallback */ }
    if (moduloId === 3) {
      return `${nombre} ya se encuentra ${fem ? 'registrada como vendedora' : 'registrado como vendedor'}`;
    }
    if (moduloId === 4) {
      return `${nombre} ya se encuentra ${fem ? 'registrada como gestora de cobro' : 'registrado como gestor de cobro'}`;
    }
    return `${nombre} ya se encuentra ${fem ? 'registrada' : 'registrado'} en el módulo ${moduloId}`;
  }

  /**
   * Bloquea duplicado (empresaId, empleadoId) — activo o inactivo: la BD tiene la clave
   * única `gestoresUnique(empleadoId, empresaId)` SIN módulo, así que un empleado solo
   * puede ser gestor una vez por empresa (si no, el INSERT daría ER_DUP_ENTRY → 500).
   * El 409 usa el módulo del registro existente (el rol que ya tiene).
   * Si el registro existente está inactivo, se reactiva editándolo desde la lista.
   */
  private async validarGestorDuplicado(empresaId: number, empleadoId: number, excluirId?: number, moduloIdSolicitado?: number) {
    if (!empresaId || !empleadoId) return;
    const where: any = { empresaId, empleadoId };
    if (excluirId) where.gestorId = Not(excluirId);
    const dup = await this.gestorRepo.findOne({ where });
    if (dup) {
      throw new ConflictException(await this.mensajeGestorDuplicado(dup.moduloId ?? moduloIdSolicitado, empleadoId));
    }
  }

  async createGestor(dto: any, user: string) {
    // Empleado ya registrado como gestor (cualquier módulo) no puede repetirse
    await this.validarGestorDuplicado(dto.empresaId, dto.empleadoId, undefined, dto.moduloId);
    // ttipogestores.usuarioId es NOT NULL sin default: si no llega en el body
    // (el form no lo pide), se resuelve desde el usuario autenticado.
    let usuarioId = dto.usuarioId;
    if (usuarioId == null) {
      try {
        const u = await this.usuarioRepo.findOne({
          where: { usuario: user, empresaId: dto.empresaId } as any,
        });
        usuarioId = u?.usuarioId ?? 0;
      } catch {
        usuarioId = 0;
      }
    }
    return this.createEntity(this.gestorRepo, { ...dto, usuarioId }, user);
  }
  async updateGestor(id: number, eid: number, dto: any, user: string) {
    // Empleado ya registrado no puede repetirse en la edición (excluye el propio registro)
    const actual = await this.gestorRepo.findOne({ where: { gestorId: id, empresaId: eid } as any });
    if (actual) {
      const moduloId = dto?.moduloId ?? actual.moduloId;
      const empleadoId = dto?.empleadoId ?? actual.empleadoId;
      await this.validarGestorDuplicado(eid, empleadoId, id, moduloId);
    }
    return this.updateEntity(this.gestorRepo, 'gestorId', id, eid, dto, user, 'Gestor');
  }
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

  // ── Usuarios de Caja (tusuarios_caja) ────────────────────
  async findAllUsuarioCaja(empresaId: number) {
    return this.usuarioCajaRepo.find({ where: { empresaId }, order: { usuario: 'ASC', codigo: 'ASC' } });
  }

  async findUsuarioCaja(id: number, empresaId: number) {
    return this.findOneById(this.usuarioCajaRepo, 'id', id, empresaId, 'Usuario de Caja');
  }

  async createUsuarioCaja(dto: any, user: string) {
    await this.validarUsuarioCaja(dto, undefined);
    return this.createEntity(this.usuarioCajaRepo, dto, user);
  }

  async updateUsuarioCaja(id: number, eid: number, dto: any, user: string) {
    await this.validarUsuarioCaja(dto, id);
    return this.updateEntity(this.usuarioCajaRepo, 'id', id, eid, dto, user, 'Usuario de Caja');
  }

  /**
   * Validaciones de negocio de tusuarios_caja:
   * - El usuario debe existir en tunidades/tusuarios (FK fk_create_..._usuario)
   * - UNIQUE (usuario, codigo) global — coincide con el índice tusuarioipaddressUnique
   */
  private async validarUsuarioCaja(dto: any, excludeId?: number) {
    if (dto.usuario !== undefined && dto.usuario !== null && dto.usuario !== '') {
      const existe = await this.usuarioRepo.findOne({ where: { usuario: dto.usuario } });
      if (!existe) throw new BadRequestException(`El usuario ${dto.usuario} no existe`);
    }

    if (dto.usuario && dto.codigo !== undefined && dto.codigo !== null) {
      const where: any = { usuario: dto.usuario, codigo: Number(dto.codigo) };
      const dup = await this.usuarioCajaRepo.findOne({ where });
      if (dup && dup.id !== excludeId) {
        throw new ConflictException(`El usuario ${dto.usuario} ya tiene asignado el código ${dto.codigo}`);
      }
    }
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

  async upsertParametroModulo(
    empresaId: number, moduloId: number, field: string, valor: string, tipo: string, currentUser: string,
    descripcion?: string, grupo?: string,
  ) {
    const existing = await this.tipoParametroRepo.findOne({
      where: { empresaId, moduloId, field } as any,
    });
    if (existing) {
      existing.valor = valor;
      existing.tipo = tipo;
      // Solo se sobreescriben si vienen en el payload (los endpoints internos no los mandan)
      if (descripcion !== undefined) existing.descripcion = descripcion;
      if (grupo !== undefined) existing.grupo = grupo as TipoParametro['grupo'];
      existing.usuarioUpdate = currentUser;
      existing.fechaUpdate = await this.fechaSistema.getFecha(empresaId);
      return this.tipoParametroRepo.save(existing);
    }
    const entity = this.tipoParametroRepo.create({
      empresaId, moduloId, field, valor, tipo,
      // Si no vienen → columnas ausentes en el INSERT → aplican defaults de la BD
      ...(descripcion !== undefined ? { descripcion } : {}),
      ...(grupo !== undefined ? { grupo: grupo as GrupoTipoParametro } : {}),
      sn_activo: 'S',
      usuarioCreated: currentUser,
    });
    return this.tipoParametroRepo.save(entity);
  }

  async upsertParametrosLote(
    empresaId: number, moduloId: number,
    items: { field: string; valor: string; tipo: string; sn_activo?: string; descripcion?: string; grupo?: string }[],
    currentUser: string,
  ) {
    const results: TipoParametro[] = [];
    for (const item of items) {
      const result = await this.upsertParametroModulo(
        empresaId, moduloId, item.field, item.valor, item.tipo, currentUser,
        item.descripcion, item.grupo,
      );
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

  // ── Meses (catálogo global, sin empresaId) ────────────────
  async findAllMeses() { return this.mesRepo.find({ order: { ttipomesId: 'ASC' } }); }
  async findMes(id: number) {
    const found = await this.mesRepo.findOne({ where: { ttipomesId: id } });
    if (!found) throw new NotFoundException(`Mes ${id} no encontrado`);
    return found;
  }
  async createMes(dto: any) { const entity = this.mesRepo.create(dto); return this.mesRepo.save(entity); }
  async updateMes(id: number, dto: any) {
    const entity = await this.findMes(id);
    Object.assign(entity, dto);
    return this.mesRepo.save(entity);
  }
  async removeMes(id: number) { const entity = await this.findMes(id); return this.mesRepo.remove(entity); }

  // ── Ciudades del mundo (catálogo global, solo lectura) ────
  // NOTA: la colación utf8mb3_spanish_ci hace LIKE insensible a acentos
  // y mayúsculas, por eso no se normaliza el texto de búsqueda.
  async findAllWorldCities(params: {
    q?: string; iso2?: string; country?: string; admin_name?: string;
    capital?: string; page?: number; rows?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const rows = Math.min(500, Math.max(1, Number(params.rows) || 25));
    const qb = this.worldCityRepo.createQueryBuilder('c');

    const q = (params.q || '').trim();
    if (q) {
      qb.andWhere('(c.city LIKE :q OR c.city_ascii LIKE :q)', { q: `%${q}%` });
    }
    if (params.iso2) qb.andWhere('c.iso2 = :iso2', { iso2: params.iso2.trim() });
    if (params.country) qb.andWhere('c.country LIKE :country', { country: `%${params.country.trim()}%` });
    if (params.admin_name) qb.andWhere('c.admin_name LIKE :admin', { admin: `%${params.admin_name.trim()}%` });
    if (params.capital) qb.andWhere('c.capital = :capital', { capital: params.capital.trim() });

    qb.orderBy('c.city', 'ASC').addOrderBy('c.id', 'ASC')
      .skip((page - 1) * rows).take(rows);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, rows };
  }

  async findWorldCity(id: number) {
    const found = await this.worldCityRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException(`Ciudad ${id} no encontrada`);
    return found;
  }

  /** Países distintos (para filtros/select). Solo se consideran capitales válidas para el flag. */
  async findWorldCitiesPaises() {
    return this.worldCityRepo.createQueryBuilder('c')
      .select('c.country', 'country')
      .addSelect('c.iso2', 'iso2')
      .addSelect('c.iso3', 'iso3')
      .addSelect('COUNT(*)', 'total')
      .groupBy('c.country').addGroupBy('c.iso2').addGroupBy('c.iso3')
      .orderBy('c.country', 'ASC')
      .getRawMany();
  }

  /** Departamentos/estados/provincias distintos de un país (iso2). */
  async findWorldCitiesAdmin(iso2: string) {
    return this.worldCityRepo.createQueryBuilder('c')
      .select('DISTINCT c.admin_name', 'admin_name')
      .where('c.iso2 = :iso2', { iso2: iso2.trim() })
      .andWhere("c.admin_name <> ''")
      .orderBy('admin_name', 'ASC')
      .getRawMany();
  }

  /** Capitales de un país (capital = 'primary' | 'admin'), para selects. */
  async findWorldCitiesCapitales(iso2?: string) {
    const qb = this.worldCityRepo.createQueryBuilder('c')
      .where("c.capital IN ('primary', 'admin')");
    if (iso2) qb.andWhere('c.iso2 = :iso2', { iso2: iso2.trim() });
    // Case-insensitive y acento-insensitive por la colación spanish_ci
    qb.orderBy("CASE WHEN c.capital = 'primary' THEN 0 ELSE 1 END", 'ASC')
      .addOrderBy('c.city', 'ASC');
    return qb.getMany();
  }
}
