import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral, Not, DataSource, In } from 'typeorm';
import { FechaSistemaService, TABLAS_FECHAREGISTRO } from '../../shared/fecha-sistema.service';
import { CorrelativosService } from '../../shared/correlativos.service';
import { RolesService } from '../users/roles.service';
import { Coctacontables } from './entities/coctacontables.entity';
import { Tcogrupocontable } from './entities/tcogrupocontable.entity';
import { Tcoplantillapdamae } from './entities/tcoplantillapdamae.entity';
import { Tcoplantillapdadet } from './entities/tcoplantillapdadet.entity';
import { Coctasaldos } from './entities/coctasaldos.entity';
import { Cocierrectable } from './entities/cocierrectable.entity';
import { Cocierredet } from './entities/cocierredet.entity';
import { Tcorepliquidez } from './entities/tcorepliquidez.entity';
import { Ttipofactordecambios } from './entities/ttipofactordecambios.entity';
import { Tcoplantillabalancesmae } from './entities/tcoplantillabalancesmae.entity';
import { Tcoplantillabalancesdet } from './entities/tcoplantillabalancesdet.entity';
import { Tcorepdiarios } from './entities/tcorepdiarios.entity';
import { Tcorepbalances } from './entities/tcorepbalances.entity';
import { Coperiodoctable } from './entities/coperiodoctable.entity';
import { Copdamae } from './entities/copdamae.entity';
import { Copdadet } from './entities/copdadet.entity';
import { Coctamov } from './entities/coctamov.entity';
import { Tconivelcta } from './entities/tconivelcta.entity';
import { Tconaturalezacta } from './entities/tconaturalezacta.entity';
import { Tcoimpuestovecinal } from './entities/tcoimpuestovecinal.entity';
import { TCoTipoDocumentoFiscal } from './entities/tcotipodocumentofiscal.entity';
import { Tempresas } from '../companies/entities/empresa.entity';
import { Tcocarteras } from './entities/tcocarteras.entity';
import { Tcoisr } from './entities/tcoisr.entity';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { Tusuarios } from '../users/entities/usuario.entity';
import { TPosFacMae } from '../facturacion/entities/posfacmae.entity';
import { CxcMovimiento } from '../cxc/entities/cxcmovimiento.entity';
import { TCxpMovimiento } from '../cxp/entities/movimiento.entity';
import { TCxpCompraMae } from '../cxp/entities/compra-mae.entity';
import {
  CreateCoctacontablesDto, UpdateCoctacontablesDto,
  CreateCopdamaeDto, UpdateCopdamaeDto,
  CreateCopdadetDto, UpdateCopdadetDto,
  ReporteBalanceDinamicoDto,
  ReporteContableDto,
  CalcularSaldosCtaDto,
} from './dto/contabilidad.dto';

@Injectable()
export class ContabilidadService {
  constructor(
    @InjectRepository(Coctacontables) private readonly ctacontablesRepo: Repository<Coctacontables>,
    @InjectRepository(Tcogrupocontable) private readonly grupocontableRepo: Repository<Tcogrupocontable>,
    @InjectRepository(Tcoplantillapdamae) private readonly plantillapdamaeRepo: Repository<Tcoplantillapdamae>,
    @InjectRepository(Tcoplantillapdadet) private readonly plantillapdadetRepo: Repository<Tcoplantillapdadet>,
    @InjectRepository(Coctasaldos) private readonly saldosctaRepo: Repository<Coctasaldos>,
    @InjectRepository(Cocierrectable) private readonly cierrectableRepo: Repository<Cocierrectable>,
    @InjectRepository(Cocierredet) private readonly cierredetRepo: Repository<Cocierredet>,
    @InjectRepository(Tcorepliquidez) private readonly repliquidezRepo: Repository<Tcorepliquidez>,
    @InjectRepository(Ttipofactordecambios) private readonly factordecambioRepo: Repository<Ttipofactordecambios>,
    @InjectRepository(Tcoplantillabalancesmae) private readonly plantillabalancesmaeRepo: Repository<Tcoplantillabalancesmae>,
    @InjectRepository(Tcoplantillabalancesdet) private readonly plantillabalancesdetRepo: Repository<Tcoplantillabalancesdet>,
    @InjectRepository(Tcorepdiarios) private readonly repdiariosRepo: Repository<Tcorepdiarios>,
    @InjectRepository(Tcorepbalances) private readonly repbalancesRepo: Repository<Tcorepbalances>,
    @InjectRepository(Coperiodoctable) private readonly periodoctableRepo: Repository<Coperiodoctable>,
    @InjectRepository(Copdamae) private readonly copdamaeRepo: Repository<Copdamae>,
    @InjectRepository(Copdadet) private readonly copdadetRepo: Repository<Copdadet>,
    @InjectRepository(Coctamov) private readonly movctaRepo: Repository<Coctamov>,
    @InjectRepository(Tconivelcta) private readonly nivelctaRepo: Repository<Tconivelcta>,
    @InjectRepository(Tconaturalezacta) private readonly naturalezactaRepo: Repository<Tconaturalezacta>,
    @InjectRepository(Tcoimpuestovecinal) private readonly impuestovecinalRepo: Repository<Tcoimpuestovecinal>,
    @InjectRepository(TCoTipoDocumentoFiscal) private readonly tipoDocFiscalRepo: Repository<TCoTipoDocumentoFiscal>,
    @InjectRepository(Tempresas) private readonly empresasRepo: Repository<Tempresas>,
    @InjectRepository(Tcocarteras) private readonly carterasRepo: Repository<Tcocarteras>,
    @InjectRepository(Tcoisr) private readonly isrRepo: Repository<Tcoisr>,
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
    @InjectRepository(Tusuarios) private readonly usuariosRepo: Repository<Tusuarios>,
    // Enriquecimiento de copdamae con plantillaId (resolución de "Concepto" por módulo)
    @InjectRepository(TPosFacMae) private readonly facMaeRepo: Repository<TPosFacMae>,
    @InjectRepository(CxcMovimiento) private readonly cxcMovimientoRepo: Repository<CxcMovimiento>,
    @InjectRepository(TCxpMovimiento) private readonly cxpMovimientoRepo: Repository<TCxpMovimiento>,
    @InjectRepository(TCxpCompraMae) private readonly cxpCompraMaeRepo: Repository<TCxpCompraMae>,
    private readonly dataSource: DataSource,
    private readonly fechaSistema: FechaSistemaService,
    private readonly rolesService: RolesService,
    private readonly correlativos: CorrelativosService,
  ) {}

  /**
   * Correlativo de partida: ttipoparametros (field='nropartida'),
   * localizado por Idsucursal + empresaId del usuario logueado, incrementando
   * valor = valor + 1 de forma atómica (UPDATE + LAST_INSERT_ID en la misma
   * conexión) y devolviendo el nuevo número.
   */
  private async siguienteNropartida(usuario: string, empresaId: number): Promise<number> {
    return this.correlativos.siguiente('nropartida', empresaId, usuario);
  }

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
    const datos: any = { ...dto, usuarioCreated: currentUser };
    // Reglas 1 y 4: en las tablas afectadas (copdamae, copdadet,
    // ttipofactordecambios), `fecharegistro` lo impone el backend (snapshot
    // tfecma.fechasistema con rango vigente, o tempresas.fechasistema sin él)
    // — nunca el reloj del servidor ni el valor del body.
    if (TABLAS_FECHAREGISTRO.has(repo.metadata.tableName)) {
      datos.fecharegistro = await this.fechaSistema.obtenerFechaRegistro(
        currentUser,
        dto.empresaId,
      );
    }
    const entity = repo.create(datos);
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
    const { fecharegistro, ...cambios } = dto ?? {}; // nunca se re-estampa en un PUT
    Object.assign(entity, cambios, {
      usuarioUpdated: currentUser,
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
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
    const { fecharegistro, ...cambios } = dto ?? {};
    Object.assign(entity, cambios, {
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
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
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
    const cuentas = await this.findAllByEmpresa(this.ctacontablesRepo, empresaId);
    // sn_protegida = la cuenta ya registra historial (movimiento/cierre) → edición restringida
    const conHistorial = await this.cuentasConHistorial(empresaId);
    return cuentas.map((c) => ({ ...c, sn_protegida: conHistorial.has(c.ctacontable) }));
  }

  async findCtacontable(cuentacontablesId: number, empresaId: number) {
    const cuenta = await this.findOneById(this.ctacontablesRepo, 'cuentacontablesId', cuentacontablesId, empresaId, 'Cuenta Contable');
    const conHistorial = await this.cuentasConHistorial(empresaId);
    return { ...cuenta, sn_protegida: conHistorial.has((cuenta as Coctacontables).ctacontable) };
  }

  async createCtacontable(dto: CreateCoctacontablesDto, currentUser: string) {
    await this.validarDuplicadosCtacontable(dto.ctacontable, dto.descripcion, dto.empresaId);
    await this.validarMayorExistente(dto.ctacontable, dto.nivel, dto.padre, dto.empresaId);
    const result = await this.createEntity(this.ctacontablesRepo, dto, currentUser);
    await this.recalcularOrdenCtacontables(dto.empresaId);
    return result;
  }

  async updateCtacontable(cuentacontablesId: number, empresaId: number, dto: UpdateCoctacontablesDto, currentUser: string) {
    // Cuenta actual (necesaria para validar protección de sn_operable / historial)
    const cuentaActual = await this.findOneById(this.ctacontablesRepo, 'cuentacontablesId', cuentacontablesId, empresaId, 'Cuenta Contable') as Coctacontables;
    await this.validarProteccionCuenta(cuentaActual, dto, currentUser, empresaId);

    await this.validarDuplicadosCtacontable(dto.ctacontable, dto.descripcion, empresaId, cuentacontablesId);
    // Para update, necesitamos leer la entidad actual si no viene nivel/padre en el dto
    const actual = dto.nivel != null || dto.padre != null || dto.ctacontable != null
      ? { nivel: dto.nivel, padre: dto.padre, ctacontable: dto.ctacontable }
      : await this.findOneById(this.ctacontablesRepo, 'cuentacontablesId', cuentacontablesId, empresaId, 'Cuenta Contable');
    await this.validarMayorExistente(actual.ctacontable, actual.nivel, actual.padre, empresaId);
    const result = await this.updateEntity(this.ctacontablesRepo, 'cuentacontablesId', cuentacontablesId, empresaId, dto, currentUser, 'Cuenta Contable');
    await this.recalcularOrdenCtacontables(empresaId);
    return result;
  }

  // ========== Protección de cuentas contables (sn_operable / historial) ==========

  /**
   * Determina si la cuenta ya registra historial en:
   * coctamov (movimientos), coctasaldos (saldos), copdadet (partidas), cocierredet (cierre contable).
   */
  private async tieneHistorialCuenta(ctacontable: string, empresaId: number): Promise<boolean> {
    const existe = async (repo: Repository<ObjectLiteral>): Promise<boolean> => {
      const n = await repo.createQueryBuilder('t')
        .where('t.ctacontable = :cta', { cta: ctacontable })
        .andWhere('t.empresaId = :empresaId', { empresaId })
        .getCount();
      return n > 0;
    };
    if (await existe(this.movctaRepo)) return true;
    if (await existe(this.saldosctaRepo)) return true;
    if (await existe(this.copdadetRepo)) return true;
    return existe(this.cierredetRepo);
  }

  /** Códigos de cuentas (distinct) con historial de movimiento/cierre para la empresa */
  private async cuentasConHistorial(empresaId: number): Promise<Set<string>> {
    const distinct = async (repo: Repository<ObjectLiteral>): Promise<string[]> => {
      const rows = await repo.createQueryBuilder('t')
        .select('DISTINCT t.ctacontable', 'ctacontable')
        .where('t.empresaId = :empresaId', { empresaId })
        .getRawMany<{ ctacontable: string }>();
      return rows.map((r) => r.ctacontable).filter((c) => !!c);
    };
    const [mov, sal, det, cie] = await Promise.all([
      distinct(this.movctaRepo),
      distinct(this.saldosctaRepo),
      distinct(this.copdadetRepo),
      distinct(this.cierredetRepo),
    ]);
    return new Set([...mov, ...sal, ...det, ...cie]);
  }

  /**
   * Reglas de protección al editar una cuenta contable:
   * - R1: cuenta con historial → solo roles admin/supervisor/contador pueden modificarla (cualquier campo).
   * - R2: cuenta operable ('S') con historial → NO puede convertirse en cuenta Mayor ('N') para nadie.
   * - R3: habilitar una cuenta como operable ('S') → solo roles admin/supervisor/contador.
   * Si no hay historial ni cambio de sn_operable, no se consultan roles (ruta rápida).
   */
  private async validarProteccionCuenta(
    actual: Coctacontables,
    dto: UpdateCoctacontablesDto,
    currentUser: string,
    empresaId: number,
  ): Promise<void> {
    const cambioOperable = dto.sn_operable != null && dto.sn_operable !== actual.sn_operable;
    const historial = await this.tieneHistorialCuenta(actual.ctacontable, empresaId);

    if (!historial && !cambioOperable) return;

    const privilegiado = await this.rolesService.esPrivilegiadoContabilidad(currentUser, empresaId);

    if (historial && !privilegiado) {
      throw new ForbiddenException(
        `La cuenta "${actual.ctacontable}" ya tiene historial de movimiento/cierre contable. ` +
        'Solo Contador, Supervisor o Administrador pueden modificarla.',
      );
    }
    if (historial && actual.sn_operable === 'S' && dto.sn_operable === 'N') {
      throw new ForbiddenException(
        `La cuenta "${actual.ctacontable}" es operable y ya registra historial de movimiento/cierre. ` +
        'No puede convertirse en cuenta Mayor.',
      );
    }
    if (cambioOperable && dto.sn_operable === 'S' && !privilegiado) {
      throw new ForbiddenException(
        'Solo Contador, Supervisor o Administrador pueden habilitar una cuenta como operable (Diario).',
      );
    }
  }

  /** True si la cuenta tiene historial y el usuario NO es admin/supervisor/contador */
  private async cuentaProtegidaParaUsuario(cuenta: Coctacontables, empresaId: number, currentUser?: string): Promise<boolean> {
    if (!currentUser) return false;
    const historial = await this.tieneHistorialCuenta(cuenta.ctacontable, empresaId);
    if (!historial) return false;
    return !(await this.rolesService.esPrivilegiadoContabilidad(currentUser, empresaId));
  }

  /**
   * Valida que no existan cuentas contables duplicadas por ctacontable o descripcion
   * dentro de la misma empresa. Al actualizar, excluye el registro actual.
   */
  private async validarDuplicadosCtacontable(
    ctacontable: string | undefined,
    descripcion: string | undefined,
    empresaId: number,
    excludeId?: number,
  ): Promise<void> {
    if (!ctacontable && !descripcion) return;

    const conditions: string[] = [];
    const params: any = { empresaId };

    if (ctacontable) {
      conditions.push('cta.ctacontable = :ctacontable');
      params.ctacontable = ctacontable;
    }
    if (descripcion) {
      conditions.push('LOWER(cta.descripcion) = :descripcion');
      params.descripcion = descripcion.toLowerCase();
    }

    const qb = this.ctacontablesRepo.createQueryBuilder('cta')
      .where('cta.empresaId = :empresaId', { empresaId })
      .andWhere(`(${conditions.join(' OR ')})`, params);

    if (excludeId) {
      qb.andWhere('cta.cuentacontablesId != :excludeId', { excludeId });
    }

    const duplicada = await qb.getOne();
    if (duplicada) {
      if (ctacontable && duplicada.ctacontable === ctacontable) {
        throw new BadRequestException(`La cuenta contable "${ctacontable}" ya existe`);
      }
      throw new BadRequestException(`Ya existe una cuenta con la descripción "${descripcion}"`);
    }
  }

  /**
   * Valida que para cuentas de nivel > 1 exista una cuenta de mayor
   * cuyo ctacontable coincida con el patrón del prefijo (antes del último guión).
   * Ej: nivel 4 con codigo '1110-002-0002' → debe existir '1110-002' (nivel 3).
   */
  private async validarMayorExistente(
    ctacontable: string | undefined,
    nivel: number | undefined,
    padre: string | undefined | null,
    empresaId: number,
  ): Promise<void> {
    // Solo validar si nivel > 1
    if (!nivel || nivel <= 1) return;
    if (!ctacontable) return;

    // Determinar el código del padre esperado
    const partes = ctacontable.split('-');
    if (partes.length < 2) return;
    const padreEsperado = partes.slice(0, -1).join('-');

    // Buscar si existe esa cuenta de mayor en la empresa
    const mayorExiste = await this.ctacontablesRepo.findOne({
      where: {
        ctacontable: padreEsperado,
        empresaId,
      } as unknown as FindOptionsWhere<Coctacontables>,
    });

    if (!mayorExiste) {
      const nivelPadre = nivel - 1;
      throw new BadRequestException(
        `No existe cuenta de mayor "${padreEsperado}" (nivel ${nivelPadre}). ` +
        `Debe crear primero la cuenta de nivel ${nivelPadre} antes de registrar cuentas de nivel ${nivel}.`
      );
    }
  }

  /**
   * Recalcula zorden de TODAS las cuentas contables de la empresa
   * basado en ROW_NUMBER() OVER (ORDER BY ctacontable).
   * Esto garantiza que el orden visual siempre sea secuencial
   * sin huecos, independientemente de Inserts/Updates/Deletes.
   */
  private async recalcularOrdenCtacontables(empresaId: number): Promise<void> {
    await this.ctacontablesRepo.query(`
      UPDATE coctacontables c
      INNER JOIN (
        SELECT cuentacontablesId,
               ROW_NUMBER() OVER (ORDER BY ctacontable) AS nuevoOrden
        FROM coctacontables
        WHERE empresaId = ?
      ) ranked ON c.cuentacontablesId = ranked.cuentacontablesId
      SET c.zorden = ranked.nuevoOrden
    `, [empresaId]);
  }

  async removeCtacontable(cuentacontablesId: number, empresaId: number, currentUser?: string) {
    // Cuenta con historial solo puede eliminarla admin/supervisor/contador
    const cuenta = await this.findOneById(this.ctacontablesRepo, 'cuentacontablesId', cuentacontablesId, empresaId, 'Cuenta Contable') as Coctacontables;
    if (await this.cuentaProtegidaParaUsuario(cuenta, empresaId, currentUser)) {
      throw new ForbiddenException(
        `La cuenta "${cuenta.ctacontable}" ya tiene historial de movimiento/cierre contable. ` +
        'Solo Contador, Supervisor o Administrador pueden eliminarla.',
      );
    }
    const result = await this.softDelete(this.ctacontablesRepo, 'cuentacontablesId', cuentacontablesId, empresaId, 'Cuenta Contable');
    await this.recalcularOrdenCtacontables(empresaId);
    return result;
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
    // Índice único (descripcion, empresaId): si ya existe una plantilla con esa
    // descripción desactivada se reactiva; si está activa → 400 (nunca 500).
    const empresaId = Number(dto?.empresaId);
    const descripcion = (dto?.descripcion ?? '').trim();
    if (descripcion && empresaId) {
      const previa = await this.plantillapdamaeRepo.findOne({
        where: { descripcion, empresaId } as any,
      });
      if (previa) {
        if (previa.sn_activo === 'S') {
          throw new BadRequestException(`Ya existe una plantilla con la descripción "${descripcion}".`);
        }
        // REGLA: la plantilla siempre queda habilitada (sn_activo = 'S')
        Object.assign(previa, {
          moduloId: dto?.moduloId ?? previa.moduloId,
          sn_activo: 'S',
          usuarioUpdated: currentUser,
          fechaUpdated: await this.fechaSistema.getFecha(empresaId),
        });
        return this.plantillapdamaeRepo.save(previa);
      }
    }
    // REGLA: la plantilla siempre queda habilitada (sn_activo = 'S')
    try {
      return await this.createEntity(this.plantillapdamaeRepo, { ...dto, sn_activo: 'S' }, currentUser);
    } catch (error) {
      throw this.errorPlantillaMaeRepetida(error, descripcion);
    }
  }

  async updatePlantillapdamae(tcoplantillapdamaeId: number, empresaId: number, dto: any, currentUser: string) {
    // REGLA: la plantilla siempre queda habilitada (sn_activo = 'S')
    try {
      return await this.updateEntity(
        this.plantillapdamaeRepo,
        'tcoplantillapdamaeId',
        tcoplantillapdamaeId,
        empresaId,
        { ...dto, sn_activo: 'S' },
        currentUser,
        'Plantilla PDA Mae',
      );
    } catch (error) {
      throw this.errorPlantillaMaeRepetida(error, dto?.descripcion);
    }
  }

  /** ER_DUP_ENTRY del índice (descripcion, empresaId) → 400 con mensaje claro */
  private errorPlantillaMaeRepetida(error: any, descripcion?: string): any {
    const code = error?.code ?? error?.driverError?.code;
    if (code !== 'ER_DUP_ENTRY') return error;
    return new BadRequestException(
      `Ya existe una plantilla con la descripción "${(descripcion ?? '').trim()}" para esta empresa.`,
    );
  }

  async removePlantillapdamae(tcoplantillapdamaeId: number, empresaId: number) {
    return this.softDelete(this.plantillapdamaeRepo, 'tcoplantillapdamaeId', tcoplantillapdamaeId, empresaId, 'Plantilla PDA Mae');
  }

  async findAllPlantillapdadet(empresaId: number, tcoplantillapdamaeId?: number) {
    if (tcoplantillapdamaeId) {
      return this.plantillapdadetRepo.find({
        where: { empresaId, tcoplantillapdamaeId, sn_activo: 'S' } as any,
        order: { nrofila: 'ASC' },
      });
    }
    return this.plantillapdadetRepo.find({
      where: { empresaId, sn_activo: 'S' } as any,
    });
  }

  async findPlantillapdadet(tcoplantillapdadetId: number, empresaId: number) {
    return this.findOneById(this.plantillapdadetRepo, 'tcoplantillapdadetId', tcoplantillapdadetId, empresaId, 'Plantilla PDA Det');
  }

  async createPlantillapdadet(dto: any, currentUser: string) {
    await this.validarCtaUnicaPlantillaDet(dto?.tcoplantillapdamaeId, dto?.ctacontable);

    // El índice único es (plantilla, cuenta, naturaleza, empresa, módulo) y NO
    // mira sn_activo: si la clave ya existe DESACTIVADA (línea borrada antes),
    // INSERT daría 500. Se restaura la fila en vez de duplicarla.
    const previa = await this.buscarClavePlantillaDet(dto);
    if (previa) {
      if (previa.sn_activo === 'S') {
        throw new BadRequestException(
          `La cuenta contable "${(dto?.ctacontable ?? '').trim()}" ya está ingresada en el detalle de la plantilla. Solo puede registrarse una vez.`,
        );
      }
      const fechaUpdated = await this.fechaSistema.getFecha(dto.empresaId);
      Object.assign(previa, {
        nrofila: dto?.nrofila ?? previa.nrofila,
        descripcion: dto?.descripcion ?? previa.descripcion,
        moduloId: dto?.moduloId ?? previa.moduloId,
        sn_activo: 'S',
        usuarioUpdated: currentUser,
        fechaUpdated,
      });
      return this.plantillapdadetRepo.save(previa);
    }

    try {
      // REGLA: la línea siempre queda habilitada (sn_activo = 'S')
      return await this.createEntity(this.plantillapdadetRepo, { ...dto, sn_activo: 'S' }, currentUser);
    } catch (error) {
      throw this.errorPlantillaDetRepetida(error, dto?.ctacontable);
    }
  }

  async updatePlantillapdadet(tcoplantillapdadetId: number, empresaId: number, dto: any, currentUser: string) {
    // Resuelve mae/cta actuales si el PUT es parcial
    const actual = await this.findOneById(this.plantillapdadetRepo, 'tcoplantillapdadetId', tcoplantillapdadetId, empresaId, 'Plantilla PDA Det');
    await this.validarCtaUnicaPlantillaDet(
      dto?.tcoplantillapdamaeId ?? actual.tcoplantillapdamaeId,
      dto?.ctacontable ?? actual.ctacontable,
      tcoplantillapdadetId,
    );
    try {
      // REGLA: la línea siempre queda habilitada (sn_activo = 'S')
      return await this.updateEntity(
        this.plantillapdadetRepo,
        'tcoplantillapdadetId',
        tcoplantillapdadetId,
        empresaId,
        { ...dto, sn_activo: 'S' },
        currentUser,
        'Plantilla PDA Det',
      );
    } catch (error) {
      throw this.errorPlantillaDetRepetida(error, dto?.ctacontable ?? actual.ctacontable);
    }
  }

  /** Busca una fila por la clave del índice único de tcoplantillapdadet */
  private async buscarClavePlantillaDet(dto: any): Promise<Tcoplantillapdadet | null> {
    const maeId = Number(dto?.tcoplantillapdamaeId);
    const cta = (dto?.ctacontable ?? '').trim();
    const naturaleza = dto?.naturaleza;
    const empresaId = Number(dto?.empresaId);
    const moduloId = Number(dto?.moduloId);
    if (!maeId || !cta || !naturaleza || !empresaId || !moduloId) return null;
    return this.plantillapdadetRepo.findOne({
      where: { tcoplantillapdamaeId: maeId, ctacontable: cta, naturaleza, empresaId, moduloId } as any,
    });
  }

  /** ER_DUP_ENTRY del índice único → 400 con mensaje claro (nunca 500) */
  private errorPlantillaDetRepetida(error: any, ctacontable?: string): any {
    const code = error?.code ?? error?.driverError?.code;
    if (code !== 'ER_DUP_ENTRY') return error;
    const cta = (ctacontable ?? '').trim() || '(cuenta)';
    return new BadRequestException(
      `La cuenta contable "${cta}" ya está registrada en el detalle de esta plantilla con la misma naturaleza, empresa y módulo.`,
    );
  }

  async removePlantillapdadet(tcoplantillapdadetId: number, empresaId: number) {
    return this.softDelete(this.plantillapdadetRepo, 'tcoplantillapdadetId', tcoplantillapdadetId, empresaId, 'Plantilla PDA Det');
  }

  /**
   * Valida que una cuenta contable NO se repita en el detalle de la misma plantilla PDA.
   * Regla de negocio: cada cuenta aparece una sola vez en el detalle de una plantilla.
   */
  private async validarCtaUnicaPlantillaDet(
    tcoplantillapdamaeId: number,
    ctacontable: string,
    excluirId?: number,
  ): Promise<void> {
    const maeId = Number(tcoplantillapdamaeId);
    const cta = (ctacontable ?? '').trim();
    if (!maeId || !cta) return;

    const filas = await this.plantillapdadetRepo.find({
      where: { tcoplantillapdamaeId: maeId, ctacontable: cta, sn_activo: 'S' } as any,
    });

    const duplicada = filas.find((f) => f.tcoplantillapdadetId !== excluirId);
    if (duplicada) {
      throw new BadRequestException(
        `La cuenta contable "${cta}" ya está ingresada en el detalle de la plantilla. Solo puede registrarse una vez.`,
      );
    }
  }

  async findAllSaldoscta(empresaId: number) {
    return this.findAllByEmpresa(this.saldosctaRepo, empresaId);
  }

  async findSaldoscta(cosaldosctaId: number, empresaId: number) {
    return this.findOneById(this.saldosctaRepo, 'cosaldosctaId', cosaldosctaId, empresaId, 'Saldo Cuenta');
  }

  /**
   * Estado de cuenta por partida de una cuenta contable, agrupado por
   * PERÍODO + nropartida, para que el frontend arme un bloque por mes.
   *
   * Cambios (29/09/2026):
   * 1. Agrupa por `periodo` + `nropartida` (antes solo nropartida) para que
   *    el frontend arme el bloque de cada mes. Orden: mes ascendente (el
   *    saldo se acumula en orden cronológico); dentro del mes, nropartida
   *    DESC como ya lo estaba.
   * 2. Filtra por `a.anio` y `a.periodo` (mismo criterio que
   *    calcularSaldosCta) en vez de YEAR(fecharegistro), para que el
   *    detalle cuadre con las columnas de meses.
   * 3. Bandera simple `sn_contabilizada='S'` (10/10/2026; antes doble
   *    bandera regla 29/09/2026): solo líneas CONTABILIZADAS — incluye
   *    originales contraedidas (S/S) y sus contras (N/S), excluye anuladas.
   */
  async findSaldosCtaDetalle(
    ctacontable: string,
    anio: number | undefined,
    empresaId: number,
    periodo?: number,
  ) {
    if (!ctacontable) {
      throw new BadRequestException('El parámetro ctacontable es requerido');
    }

    const qb = this.copdadetRepo.createQueryBuilder('a')
      .select('a.periodo', 'periodo')
      .addSelect('a.nropartida', 'nropartida')
      // partidaId de la cabecera (copdamae) → para abrir el detalle de la partida
      // desde el frontend. Seguro porque el agrupado es por (periodo, nropartida)
      // y nropartida es secuencial dentro de (anio, periodo).
      .addSelect('MIN(a.partidaId)', 'partidaId')
      .addSelect('MIN(a.fecharegistro)', 'fecharegistro')
      .addSelect('SUM(a.debito)', 'debito')
      .addSelect('SUM(a.credito)', 'credito')
      .where('a.ctacontable = :ctacontable', { ctacontable })
      .andWhere('a.empresaId = :empresaId', { empresaId })
      .andWhere("a.sn_contabilizada = 'S'")
      .andWhere('a.periodo IS NOT NULL');

    if (anio) {
      qb.andWhere('a.anio = :anio', { anio });
    }

    // Acotar a un período específico (fila de movcta = cuenta + año + período)
    if (periodo) {
      qb.andWhere('a.periodo = :periodo', { periodo });
    }

    const movimientos = await qb
      .groupBy('a.periodo')
      .addGroupBy('a.nropartida')
      .orderBy('a.periodo', 'ASC')
      .addOrderBy('a.nropartida', 'DESC')
      .getRawMany();

    const cta = await this.ctacontablesRepo.findOne({ where: { ctacontable, empresaId } });

    let totalDebito = 0;
    let totalCredito = 0;
    for (const m of movimientos) {
      totalDebito += Number(m.debito) || 0;
      totalCredito += Number(m.credito) || 0;
    }

    // ===== Saldo acumulado hasta el mes ANTERIOR al período pedido =====
    // Para movcta (fila = cuenta + año + período) la base no puede ser `sacum`
    // de la fila (viene de cocierredet, que puede estar vacía). Se calcula:
    //   1. coctasaldos.saldoanterior (saldo al cierre del año anterior)
    //   2. + Σ(debito - credito) de copdadet de LOS PERÍODOS ANTERIORES
    //      MISMA bandera simple: sn_contabilizada='S'.
    // Ej: fila septiembre 2026 → base = netos de enero..agosto.
    let saldoAcumulado = 0;
    if (anio) {
      const filaSaldo = await this.saldosctaRepo.findOne({
        where: { ctacontable, anio, empresaId } as unknown as FindOptionsWhere<Coctasaldos>,
      });
      saldoAcumulado = Number(filaSaldo?.saldoanterior) || 0;
    }
    if (periodo && anio) {
      const prev = await this.copdadetRepo.createQueryBuilder('a')
        .select('COALESCE(SUM(a.debito) - SUM(a.credito), 0)', 'neto')
        .where('a.ctacontable = :ctacontable', { ctacontable })
        .andWhere('a.empresaId = :empresaId', { empresaId })
        .andWhere('a.anio = :anio', { anio })
        .andWhere('a.periodo < :periodo', { periodo })
        .andWhere('a.periodo IS NOT NULL')
        .andWhere("a.sn_contabilizada = 'S'")
        .getRawOne();
      saldoAcumulado += Number(prev?.neto) || 0;
    }

    return {
      descripcion: cta?.descripcion ?? '',
      movimientos,
      totales: { debito: totalDebito, credito: totalCredito },
      saldoAcumulado,
    };
  }

  async createSaldoscta(dto: any, currentUser: string) {
    return this.createEntity(this.saldosctaRepo, dto, currentUser);
  }

  async updateSaldoscta(cosaldosctaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.saldosctaRepo, 'cosaldosctaId', cosaldosctaId, empresaId, dto, currentUser, 'Saldo Cuenta');
  }

  /**
   * Recalcula coctasaldos desde copdadet (versión backend del
   * sp_calcular_saldos_cuenta, correcciones 29/09/2026).
   *
   * Regla de cálculo (definida por el usuario, 29/09/2026 y 30/09/2026;
   * unificada a bandera simple el 10/10/2026 con la contra partida):
   * `sn_contabilizada='S'` = solo movimientos CONTABILIZADOS. Mismo criterio
   * en findSaldosCtaDetalle (catálogo y detalle cuadran). Las originales
   * contraedidas (S/S) cuentan — permanecen en el mayor; las contras (N/S)
   * también; las anuladas normales (S/N) no.
   *
   * ── SALDO FINAL con ARRASTRE (30/09/2026) ──────────────────────────────
   * Cada celda guarda el SALDO FINAL del mes, no el neto del mes:
   *
   *     saldoFinal(m) = base(m-1) + neto(m)
   *       base(1) = saldoanterior            (apertura del año)
   *       base(m) = cocierredet[m-1].saldo    si existe espejo
   *                = saldoFinal(m-1)          si no hay espejo (cadena)
   *
   * EL ARRASTRE ES OBLIGATORIO: un mes sin partidas ni movimientos
   * arrastra el saldo final del mes anterior. Ej: mayo cierra en 1,200 y
   * junio/julio/agosto/septiembre no tienen movimiento → los cuatro quedan
   * en 1,200 (no en 0).
   *
   * TOPE = meses definidos en `coperiodoctable` para el año (2026 → 1..9).
   * Más allá del tope (oct/nov/dic) NO se arrastra nada → celda 0.00.
   *
   * Diferencias vs el SP original:
   * 1. Guarda saldo FINAL firmado (no ABS()): negativo=(C)/positivo=(D).
   * 2. Filtra por columna `periodo` contable, NO por rango de fecharegistro:
   *    todas las partidas de 2026 se registraron en septiembre (reconstrucción)
   *    y el rango de fechas metía los 12 meses dentro de septiembre.
   * 3. Bandera simple `sn_contabilizada='S'` (10/10/2026; antes doble
   *    bandera) — mismo criterio que findSaldosCtaDetalle.
   * 4. empresaId en TODAS las operaciones (SELECT/UPDATE/INSERT): el SP lo
   *    omitía en UPDATE/EXISTS y podía tocar filas de otra empresa.
   *
   * Reglas: solo toca columnas de meses (jamás saldoanterior); crea la fila
   * si la cuenta tiene movimiento y no existe; idempotente.
   * Si `periodo` se omite recalcula los 12 meses.
   */
  async calcularSaldosCta(dto: CalcularSaldosCtaDto, currentUser: string) {
    const { anio, periodo, empresaId } = dto;

    if (!empresaId) throw new BadRequestException('empresaId es requerido');
    if (!anio || anio < 1900 || anio > 2200) {
      throw new BadRequestException(`Año inválido: ${anio}`);
    }
    if (periodo != null && (periodo < 1 || periodo > 12)) {
      throw new BadRequestException(`Período inválido: ${periodo} (debe estar entre 1 y 12)`);
    }

    const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const redondear = (n: number) => Math.round(n * 100) / 100;
    const periodos = periodo != null ? [periodo] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    // TOPE: meses definidos en coperiodoctable para el año (2026 → 1..9).
    // Más allá del tope no se arrastra nada → celda 0.00.
    const definidos = await this.periodoctableRepo.find({
      where: { empresaId, nroanio: anio } as unknown as FindOptionsWhere<Coperiodoctable>,
    });
    const tope = new Set(definidos.map((p) => Number(p.nromes)));

    // Netos firmados por cuenta+período — bandera simple sn_contabilizada='S'
    const netos = await this.copdadetRepo
      .createQueryBuilder('d')
      .select('d.ctacontable', 'ctacontable')
      .addSelect('d.periodo', 'periodo')
      .addSelect('SUM(d.debito) - SUM(d.credito)', 'neto')
      .where('d.empresaId = :empresaId', { empresaId })
      .andWhere('d.anio = :anio', { anio })
      .andWhere("d.sn_contabilizada = 'S'")
      .andWhere('d.periodo IS NOT NULL')
      .groupBy('d.ctacontable')
      .addGroupBy('d.periodo')
      .getRawMany();

    const netoPorCta = new Map<string, number>();
    const cuentasConMov = new Set<string>();
    for (const n of netos) {
      const p = Number(n.periodo);
      if (p < 1 || p > 12) continue;
      netoPorCta.set(`${n.ctacontable}|${p}`, Number(n.neto) || 0);
      cuentasConMov.add(n.ctacontable);
    }

    // Espejo de cierres del año (cocierredet) → base autoritativa del arrastre
    const cierres = await this.cierredetRepo.find({ where: { empresaId, anio } });
    const cierrePorMes = new Map<number, Map<string, number>>();
    for (const cd of cierres) {
      const m = Number(cd.periodo);
      if (!cierrePorMes.has(m)) cierrePorMes.set(m, new Map());
      const mapa = cierrePorMes.get(m)!;
      mapa.set(cd.ctacontable, redondear((mapa.get(cd.ctacontable) || 0) + (Number(cd.saldo) || 0)));
    }

    const filas = await this.saldosctaRepo.find({ where: { empresaId, anio } });
    const porCta = new Map(filas.map((f) => [f.ctacontable, f]));

    const fecha = await this.fechaSistema.getFecha(empresaId);
    let filasActualizadas = 0;
    let filasCreadas = 0;
    let celdasCorregidas = 0;

    // Cuentas candidatas: las existentes en coctasaldos + las que tienen movimiento
    const candidatas = new Set<string>([...porCta.keys(), ...cuentasConMov]);

    for (const cta of candidatas) {
      const fila = porCta.get(cta);
      const saldoAnterior = fila ? Number(fila.saldoanterior) || 0 : 0;

      // ── Cadena de SALDOS FINALES con ARRASTRE ──────────────────────────
      // saldoFinal(m) = base(m-1) + neto(m); los meses sin movimiento
      // arrancan desde el saldo final del mes anterior (no quedan en 0).
      const saldosFinales = new Map<number, number>();
      let acum = saldoAnterior;
      for (let m = 1; m <= 12; m++) {
        let saldoFinal: number;
        if (!tope.has(m)) {
          // Fuera del tope de coperiodoctable → no se arrastra
          saldoFinal = 0;
        } else {
          let base: number;
          if (m === 1) {
            base = saldoAnterior;
          } else {
            const cierreAnt = cierrePorMes.get(m - 1)?.get(cta);
            base = cierreAnt !== undefined ? cierreAnt : acum;
          }
          saldoFinal = redondear(base + (netoPorCta.get(`${cta}|${m}`) || 0));
        }
        acum = saldoFinal;
        saldosFinales.set(m, saldoFinal);
      }

      const cambios: Record<string, number> = {};
      let difiere = false;

      for (const p of periodos) {
        const nuevo = saldosFinales.get(p) || 0;
        const guardado = fila ? Number((fila as any)[MESES[p - 1]]) || 0 : 0;
        if (Math.abs(guardado - nuevo) > 0.005) {
          cambios[MESES[p - 1]] = nuevo;
          difiere = true;
          celdasCorregidas++;
        }
      }

      if (!fila) {
        // Solo crear si la cuenta realmente tiene movimiento (evita filas huérfanas)
        if (!cuentasConMov.has(cta)) continue;
        const nueva: Record<string, any> = {
          anio,
          ctacontable: cta,
          saldoanterior: 0,
          empresaId,
          usuarioCreated: currentUser,
        };
        for (let p = 1; p <= 12; p++) {
          nueva[MESES[p - 1]] = periodos.includes(p) ? saldosFinales.get(p) || 0 : 0;
        }
        await this.saldosctaRepo.save(this.saldosctaRepo.create(nueva));
        filasCreadas++;
        continue;
      }

      if (difiere) {
        // QueryBuilder.update: evita el problema de decimales string→number
        await this.saldosctaRepo
          .createQueryBuilder()
          .update()
          .set({ ...cambios, usuarioUpdated: currentUser, fechaUpdated: fecha } as any)
          .where('cosaldosctaId = :id', { id: fila.cosaldosctaId })
          .andWhere('empresaId = :empresaId', { empresaId })
          .execute();
        filasActualizadas++;
      }
    }

    return {
      anio,
      periodo: periodo ?? null,
      empresaId,
      filasEvaluadas: candidatas.size,
      filasActualizadas,
      filasCreadas,
      celdasCorregidas,
    };
  }

  async findAllCierrectable(empresaId: number) {
    return this.findAllByEmpresa(this.cierrectableRepo, empresaId);
  }

  async findCierrectable(cierrectableId: number, empresaId: number) {
    return this.findOneById(this.cierrectableRepo, 'cierrectableId', cierrectableId, empresaId, 'Cierre Contable');
  }

  /** Los registros de cierre (cocierremae) son protegidos: solo se generan desde Cierre Contable */
  async createCierrectable(dto: any, currentUser: string) {
    throw new ForbiddenException(
      'Los registros de cierre contable (cocierremae) son de solo lectura: se generan desde Cierre Contable y no pueden crearse manualmente.',
    );
  }

  async updateCierrectable(cierrectableId: number, empresaId: number, dto: any, currentUser: string) {
    throw new ForbiddenException(
      'Los registros de cierre contable (cocierremae) son de solo lectura: no pueden modificarse bajo ninguna circunstancia.',
    );
  }

  async removeCierrectable(cierrectableId: number, empresaId: number) {
    throw new ForbiddenException(
      'Los registros de cierre contable (cocierremae) son de solo lectura: no pueden eliminarse bajo ninguna circunstancia.',
    );
  }

  // ========== Detalle de Cierre Contable (cocierredet) ==========

  async findAllCierredet(empresaId: number, cocierremaeId?: number) {
    const where: any = { empresaId };
    if (cocierremaeId != null) where.cocierremaeId = cocierremaeId;
    // Orden por código de cuenta asc (misma normativa de inserción del cierre)
    return this.cierredetRepo.find({ where, order: { ctacontable: 'ASC' } as any });
  }

  async findCierredet(cocierredetId: number, empresaId: number) {
    return this.findOneById(this.cierredetRepo, 'cocierredetId', cocierredetId, empresaId, 'Detalle de Cierre');
  }

  /** Los detalles de cierre (cocierredet) son protegidos: solo se generan desde Cierre Contable */
  async createCierredet(dto: any, currentUser: string) {
    throw new ForbiddenException(
      'Los detalles de cierre contable (cocierredet) son de solo lectura: se generan desde Cierre Contable y no pueden crearse manualmente.',
    );
  }

  async updateCierredet(cocierredetId: number, empresaId: number, dto: any, currentUser: string) {
    throw new ForbiddenException(
      'Los detalles de cierre contable (cocierredet) son de solo lectura: no pueden modificarse bajo ninguna circunstancia.',
    );
  }

  /**
   * Eliminación física: la tabla cocierredet no tiene columna sn_activo.
   * PROTEGIDO: no se permite eliminar detalles de cierre.
   */
  async removeCierredet(cocierredetId: number, empresaId: number) {
    throw new ForbiddenException(
      'Los detalles de cierre contable (cocierredet) son de solo lectura: no pueden eliminarse bajo ninguna circunstancia.',
    );
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
      where: { empresaId } as unknown as FindOptionsWhere<Ttipofactordecambios>,
      order: { fecharegistro: 'DESC' } as any,
    });
  }

  async findFactordecambio(factordecambioId: number) {
    return this.findOneByIdNoEmpresa(this.factordecambioRepo, 'factordecambioId', factordecambioId, 'Factor de Cambio');
  }

  /** REGLA: el precio de venta nunca puede ser menor al precio de compra */
  private validarPreciosFactordecambio(preciocompra: any, precioventa: any) {
    const compra = Number(preciocompra ?? 0);
    const venta = Number(precioventa ?? 0);
    if (venta < compra) {
      throw new BadRequestException('El Precio Venta no puede ser menor al Precio Compra');
    }
  }

  async createFactordecambio(dto: any, currentUser: string) {
    const payload = { ...dto };
    this.validarPreciosFactordecambio(payload.preciocompra, payload.precioventa);
    // La columna factordecambioId NO es AUTO_INCREMENT en la tabla y el formulario
    // la oculta → si no viene el ID (o llega en 0), se asigna el consecutivo de la tabla
    if (!payload.factordecambioId) {
      const r = await this.factordecambioRepo
        .createQueryBuilder('f')
        .select('MAX(f.factordecambioId)', 'max')
        .getRawOne();
      payload.factordecambioId = (Number(r?.max) || 0) + 1;
    }
    // fecharegistro: lo estampa createEntity() con obtenerFechaRegistro()
    // (reglas 1 y 4) — ya no se calcula aquí ni se acepta el valor del body.
    return this.createEntity(this.factordecambioRepo, payload, currentUser);
  }

  async updateFactordecambio(factordecambioId: number, dto: any, currentUser: string) {
    // Validar contra los valores finales (los que llegan + los guardados)
    const actual = await this.findFactordecambio(factordecambioId);
    this.validarPreciosFactordecambio(
      dto?.preciocompra ?? actual.preciocompra,
      dto?.precioventa ?? actual.precioventa,
    );
    return this.updateEntityNoEmpresa(this.factordecambioRepo, 'factordecambioId', factordecambioId, dto, currentUser, 'Factor de Cambio');
  }

  async findAllPlantillabalancesmae(empresaId: number) {
    return this.findAllByEmpresa(this.plantillabalancesmaeRepo, empresaId);
  }

  async findPlantillabalancesmae(cocdefbalmaId: number, empresaId: number) {
    return this.findOneById(this.plantillabalancesmaeRepo, 'cocdefbalmaId', cocdefbalmaId, empresaId, 'Plantilla Balance Mae');
  }

  async createPlantillabalancesmae(dto: any, currentUser: string) {
    try {
      return await this.createEntity(this.plantillabalancesmaeRepo, dto, currentUser);
    } catch (error) {
      throw this.traducirErrorIntegridadPlantilla(
        error,
        `Ya existe una plantilla de balances con la descripción "${dto.descripcion}"`,
        'El registro relacionado no existe',
      );
    }
  }

  async updatePlantillabalancesmae(cocdefbalmaId: number, empresaId: number, dto: any, currentUser: string) {
    try {
      return await this.updateEntity(this.plantillabalancesmaeRepo, 'cocdefbalmaId', cocdefbalmaId, empresaId, dto, currentUser, 'Plantilla Balance Mae');
    } catch (error) {
      throw this.traducirErrorIntegridadPlantilla(
        error,
        `Ya existe una plantilla de balances con la descripción "${dto.descripcion}"`,
        'El registro relacionado no existe',
      );
    }
  }

  async removePlantillabalancesmae(cocdefbalmaId: number, empresaId: number) {
    return this.softDelete(this.plantillabalancesmaeRepo, 'cocdefbalmaId', cocdefbalmaId, empresaId, 'Plantilla Balance Mae');
  }

  async findAllPlantillabalancesdet(empresaId: number, cocdefbalmaId?: number) {
    if (cocdefbalmaId) {
      return this.plantillabalancesdetRepo.find({
        where: { empresaId, cocdefbalmaId, sn_activo: 'S' } as any,
        order: { renglon: 'ASC', columna: 'ASC' },
      });
    }
    return this.plantillabalancesdetRepo.find({
      where: { empresaId, sn_activo: 'S' } as any,
    });
  }

  async findPlantillabalancesdet(tcoplantillabalancesdetid: number, empresaId: number) {
    return this.findOneById(this.plantillabalancesdetRepo, 'tcoplantillabalancesdetid', tcoplantillabalancesdetid, empresaId, 'Plantilla Balance Det');
  }

  /**
   * Crea una línea de plantilla de balances.
   * Reglas: columna obligatoria (1..4), cuenta contable obligatoria y
   * no repetida dentro de la misma plantilla.
   */
  async createPlantillabalancesdet(dto: any, currentUser: string) {
    const ctacontable = typeof dto.ctacontable === 'string' ? dto.ctacontable.trim() : dto.ctacontable;
    dto.ctacontable = ctacontable;
    if (!dto.cocdefbalmaId) {
      throw new BadRequestException('La plantilla de balance es obligatoria');
    }
    if (!ctacontable) {
      throw new BadRequestException('La cuenta contable es obligatoria');
    }
    this.validarColumnaPlantillaBalances(dto.columna);
    await this.validarCtaDuplicadaPlantillaBalances(dto.cocdefbalmaId, ctacontable, dto.empresaId);
    try {
      return await this.createEntity(this.plantillabalancesdetRepo, dto, currentUser);
    } catch (error) {
      throw this.traducirErrorIntegridadPlantilla(
        error,
        `La cuenta contable ${ctacontable} ya está registrada en esta plantilla`,
        `La cuenta contable ${ctacontable} no existe en el plan de cuentas`,
      );
    }
  }

  /**
   * Actualiza una línea de plantilla de balances (payload parcial permitido).
   * Valida columna (si viene) y cuenta duplicada (si cambia la cuenta o la plantilla).
   */
  async updatePlantillabalancesdet(tcoplantillabalancesdetid: number, empresaId: number, dto: any, currentUser: string) {
    if ('columna' in dto) {
      this.validarColumnaPlantillaBalances(dto.columna);
    }
    const cambiaCuenta = 'ctacontable' in dto || 'cocdefbalmaId' in dto;
    if ('ctacontable' in dto) {
      dto.ctacontable = typeof dto.ctacontable === 'string' ? dto.ctacontable.trim() : dto.ctacontable;
      if (!dto.ctacontable) {
        throw new BadRequestException('La cuenta contable es obligatoria');
      }
    }
    if (cambiaCuenta) {
      const actual = await this.findOneById(
        this.plantillabalancesdetRepo, 'tcoplantillabalancesdetid', tcoplantillabalancesdetid, empresaId, 'Plantilla Balance Det',
      );
      const ctacontable = dto.ctacontable ?? actual.ctacontable;
      const cocdefbalmaId = dto.cocdefbalmaId ?? actual.cocdefbalmaId;
      await this.validarCtaDuplicadaPlantillaBalances(cocdefbalmaId, ctacontable, empresaId, tcoplantillabalancesdetid);
    }
    try {
      return await this.updateEntity(this.plantillabalancesdetRepo, 'tcoplantillabalancesdetid', tcoplantillabalancesdetid, empresaId, dto, currentUser, 'Plantilla Balance Det');
    } catch (error) {
      const cta = typeof dto.ctacontable === 'string' ? dto.ctacontable : '';
      throw this.traducirErrorIntegridadPlantilla(
        error,
        `La cuenta contable ${cta} ya está registrada en esta plantilla`.trim(),
        `La cuenta contable ${cta} no existe en el plan de cuentas`.trim(),
      );
    }
  }

  /**
   * Valida la columna de una línea de plantilla de balances:
   * es obligatoria y su rango de elección es 1 a 4.
   */
  private validarColumnaPlantillaBalances(columna: any): void {
    if (columna === null || columna === undefined || columna === '') {
      throw new BadRequestException('La columna es obligatoria');
    }
    const n = Number(columna);
    if (!Number.isInteger(n) || n < 1 || n > 4) {
      throw new BadRequestException('La columna debe estar entre 1 y 4');
    }
  }

  /**
   * Impide el registro duplicado de la cuenta contable dentro de la misma
   * plantilla (se ignora el tipo D/C: la cuenta no puede repetirse).
   */
  private async validarCtaDuplicadaPlantillaBalances(
    cocdefbalmaId: number,
    ctacontable: string,
    empresaId?: number,
    excluirId?: number,
  ): Promise<void> {
    const base: any = { cocdefbalmaId, ctacontable, sn_activo: 'S' };
    if (empresaId) {
      base.empresaId = empresaId;
    }
    const existe = await this.plantillabalancesdetRepo.findOne({
      where: excluirId ? { ...base, tcoplantillabalancesdetid: Not(excluirId) } : base,
    } as any);
    if (existe) {
      throw new BadRequestException(`La cuenta contable ${ctacontable} ya está registrada en esta plantilla`);
    }
  }

  /**
   * Traduce violaciones de integridad (clave única / foráneas) a HTTP 400
   * con mensaje legible; cualquier otro error se relanza tal cual.
   */
  private traducirErrorIntegridadPlantilla(error: any, mensajeDuplicado: string, mensajeFk?: string): any {
    const code = error?.driverError?.code ?? error?.code;
    if (code === 'ER_DUP_ENTRY') {
      return new BadRequestException(mensajeDuplicado);
    }
    if (code === 'ER_NO_REFERENCED_ROW_2' || code === 'ER_NO_REFERENCED_ROW_1') {
      return new BadRequestException(mensajeFk ?? 'El registro relacionado no existe');
    }
    return error;
  }

  async removePlantillabalancesdet(tcoplantillabalancesdetid: number, empresaId: number) {
    return this.softDelete(this.plantillabalancesdetRepo, 'tcoplantillabalancesdetid', tcoplantillabalancesdetid, empresaId, 'Plantilla Balance Det');
  }

  // ===== Reporte de Balances Dinámico =====

  /**
   * Genera el reporte de balances dinámico/parametrizado.
   *
   * Reglas de negocio:
   * 1. Orden de presentación: por `renglon`.
   * 2. `columna` = ubicación dentro de una tabla de máx. 7 columnas (1..7).
   *    El valor de la línea se muestra SOLO en esa columna.
   * 3. Columna 0 (solo balances, cuentas diferentes de Ingresos/Gastos):
   *    = Saldo Acumulado antes del período en curso.
   * 4. Fórmula para balances / reportes que NO son de resultado:
   *    Saldo Acumulado + (Débitos - Créditos) del período → se muestra en la
   *    columna indicada por el usuario (`columna` de la plantilla).
   * 5. Fuentes: coctamov (movimientos del período) + cocierredet (acumulado anterior).
   * 6. Mayorización: cada línea suma su cuenta + descendientes (prefijo + jerarquía padre).
   * 7. Estado de Resultado: la Columna 1 (Parcial) se totaliza como
   *    (ingresos) − (gastos): cuentas de naturaleza C suman y las de
   *    naturaleza D restan (devoluciones/rebajas/descuentos y gastos tipo 5).
   */
  async generarBalanceDinamico(dto: ReporteBalanceDinamicoDto) {
    const { empresaId, plantillaId, nivelDetalle, periodo, anio } = dto;

    // ── 1. Plantilla cabecera ──
    const mae = await this.plantillabalancesmaeRepo.findOne({
      where: { cocdefbalmaId: plantillaId, empresaId } as any,
    });
    if (!mae) throw new NotFoundException(`Plantilla de balance ${plantillaId} no encontrada`);

    // ── 2. Plantilla detalle (líneas activas) ordenadas por renglon ──
    const det = await this.plantillabalancesdetRepo.find({
      where: { cocdefbalmaId: plantillaId, empresaId, sn_activo: 'S' } as any,
      order: { renglon: 'ASC', columna: 'ASC' } as any,
    });

    // ── 2b. ¿Es BALANCE o ESTADO DE RESULTADO? ──
    // "Solo cuando las cuentas sean diferentes de Ingresos y Gastos se muestra Col 0".
    // Se calcula aquí (depende solo de `det`) porque el paso 5 necesita saberlo
    // para elegir la fuente del acumulado.
    const esBalance = det.some((d) => d.ctacontable && /^[123]/.test(d.ctacontable));

    // ── 3. Nombre de empresa ──
    const empresa = await this.empresasRepo.findOne({ where: { empresaId } as any });
    const empresaName = empresa?.descripcion ?? '';

    // ── 4. Catálogo de cuentas ──
    const cuentas = await this.ctacontablesRepo.find({
      where: { empresaId, sn_activo: 'S' } as any,
    });
    const ctaMap = new Map(cuentas.map((c) => [c.ctacontable, c]));

    // ── 5. Acumulado ANTERIOR al período → Columna 0 ────────────────────
    // FUENTE para BALANCES: coctasaldos + coctamov
    //
    //   acum(P) = coctasaldos.saldoanterior(año)          (apertura del año)
    //           + Σ (debe - haber) de coctamov(año, período < P)   (netos previos)
    //
    // Es idéntico al `sacum` que guarda coctamov para el período P, pero
    // calculado para TODAS las cuentas (también las que no se movieron en P).
    //
    // NO se usa cocierredet: esa tabla solo tiene filas de los períodos ya
    // cerrados, así que cualquier período sin cierre previo dejaba el
    // acumulado en 0 y la columna 0 salía vacía.
    const acumMap = new Map<string, number>();

    if (esBalance) {
      if (anio != null) {
        // 5a. Apertura del año desde coctasaldos (saldo al cierre del año anterior)
        const saldosAnio = await this.saldosctaRepo.find({
          where: { empresaId, anio } as any,
        });
        for (const s of saldosAnio) {
          // Solo cuentas operables: el acumulado de un PADRE se deriva de sus
          // hijos (calcularMayorizado, paso 8). Sumar la fila del padre
          // duplicaría el saldo.
          const cta = ctaMap.get(s.ctacontable);
          if (cta && cta.sn_operable !== 'S') continue;
          const apertura = Number(s.saldoanterior) || 0;
          if (apertura !== 0) acumMap.set(s.ctacontable, apertura);
        }

        // 5b. Netos de los períodos ANTERIORES desde coctamov
        if (periodo != null) {
          const movimientosPrevios = await this.movctaRepo.find({
            where: { empresaId, anio } as any,
          });
          for (const mov of movimientosPrevios) {
            if (mov.periodo >= periodo) continue;
            const cta = ctaMap.get(mov.ctacontable);
            if (cta && cta.sn_operable !== 'S') continue;
            const neto = (Number(mov.debe) || 0) - (Number(mov.haber) || 0);
            if (neto === 0) continue;
            acumMap.set(mov.ctacontable, (acumMap.get(mov.ctacontable) || 0) + neto);
          }
        }
      }
    } else if (periodo != null && anio != null) {
      // ESTADO DE RESULTADO: se conserva el comportamiento previo (cocierredet).
      // El ER presenta el flujo del período, no el acumulado, y su columna 0
      // no se muestra (mostrarCol0 = esBalance).
      const periodoAnt = periodo === 1 ? 12 : periodo - 1;
      const anioAnt = periodo === 1 ? anio - 1 : anio;
      const cierres = await this.cierredetRepo.find({
        where: { empresaId, anio: anioAnt, periodo: periodoAnt } as any,
      });
      for (const sc of cierres) {
        const cta = ctaMap.get(sc.ctacontable);
        if (cta && cta.sn_operable !== 'S') continue;
        acumMap.set(sc.ctacontable, (acumMap.get(sc.ctacontable) || 0) + (Number(sc.saldo) || 0));
      }
    } else if (!esBalance) {
      // ER sin período: acumulado = cierre más reciente por cuenta (previo)
      const cierres = await this.cierredetRepo.find({ where: { empresaId } as any });
      for (const sc of cierres) {
        const cta = ctaMap.get(sc.ctacontable);
        if (cta && cta.sn_operable !== 'S') continue;
        const key = `${sc.ctacontable}`;
        const actual = acumMap.get(key) || 0;
        acumMap.set(key, actual + (Number(sc.saldo) || 0));
      }
    }

    // ── 6. Movimientos del PERÍODO (coctamov): Débitos - Créditos ──
    const movMap = new Map<string, { debe: number; haber: number }>();
    if (periodo != null && anio != null) {
      const movimientos = await this.movctaRepo.find({
        where: { empresaId, anio, periodo } as any,
      });
      for (const mov of movimientos) {
        const ex = movMap.get(mov.ctacontable) || { debe: 0, haber: 0 };
        ex.debe += Number(mov.debe) || 0;
        ex.haber += Number(mov.haber) || 0;
        movMap.set(mov.ctacontable, ex);
      }
    } else {
      const movimientos = await this.movctaRepo.find({ where: { empresaId } as any });
      for (const mov of movimientos) {
        const ex = movMap.get(mov.ctacontable) || { debe: 0, haber: 0 };
        ex.debe += Number(mov.debe) || 0;
        ex.haber += Number(mov.haber) || 0;
        movMap.set(mov.ctacontable, ex);
      }
    }

    // ── 7. Mapa de hijos por padre (jerarquía explícita) ──
    const hijosPorPadre = new Map<string, string[]>();
    for (const cta of cuentas) {
      if (cta.padre) {
        const arr = hijosPorPadre.get(cta.padre) || [];
        arr.push(cta.ctacontable);
        hijosPorPadre.set(cta.padre, arr);
      }
    }

    // ── 8. Mayorización recursiva (acum + movimientos por separado) ──
    interface Mayorizado { acum: number; debe: number; haber: number }
    const mayorizadoMap = new Map<string, Mayorizado>();
    const visitados = new Set<string>();

    const calcularMayorizado = (codigo: string): Mayorizado => {
      const cache = mayorizadoMap.get(codigo);
      if (cache) return cache;
      if (visitados.has(codigo)) return { acum: 0, debe: 0, haber: 0 };
      visitados.add(codigo);

      const mov = movMap.get(codigo);
      let acum = acumMap.get(codigo) || 0;
      let debe = mov?.debe || 0;
      let haber = mov?.haber || 0;

      // Hijos por prefijo de código (ej: "4110" → "4110-001", "4110-002")
      for (const [ctaCod, m] of movMap) {
        if (ctaCod !== codigo && ctaCod.startsWith(codigo)) {
          debe += m.debe;
          haber += m.haber;
        }
      }
      for (const [ctaCod, a] of acumMap) {
        if (ctaCod !== codigo && ctaCod.startsWith(codigo)) {
          acum += a;
        }
      }

      // Hijos por campo padre (jerarquía explícita, si no cubiertos por prefijo)
      const hijos = hijosPorPadre.get(codigo) || [];
      for (const hijo of hijos) {
        if (!hijo.startsWith(codigo)) {
          const h = calcularMayorizado(hijo);
          acum += h.acum;
          debe += h.debe;
          haber += h.haber;
        }
      }

      const resultado: Mayorizado = { acum, debe, haber };
      mayorizadoMap.set(codigo, resultado);
      return resultado;
    };

    for (const cta of cuentas) {
      calcularMayorizado(cta.ctacontable);
    }

    // ── 9. Determinar si es balance (cuentas 1/2/3) vs resultado (4/5/6/7) ──
    // `esBalance` se calcula en el paso 2b (se necesita antes, en el paso 5).

    // ── 10. Construir líneas del reporte (orden por renglon) ──
    const lineasBrutas = det
      .filter((d) => {
        if (nivelDetalle != null && d.ctacontable) {
          const cta = ctaMap.get(d.ctacontable);
          if (cta && cta.nivel != null) return cta.nivel <= nivelDetalle;
        }
        return true;
      })
      .map((d) => {
        const cta = d.ctacontable ? ctaMap.get(d.ctacontable) : undefined;
        const nivel = cta?.nivel ?? null;
        const col = d.columna ?? 0;

        let acum = 0;
        let debe = 0;
        let haber = 0;
        if (d.ctacontable) {
          const m = mayorizadoMap.get(d.ctacontable) ?? calcularMayorizado(d.ctacontable);
          acum = m.acum;
          debe = m.debe;
          haber = m.haber;
        }

        // Fórmula: Saldo Acumulado + (Débitos - Créditos) del período
        // En contabilidad NO existen saldos negativos: se presenta en valor absoluto
        const valor = Math.abs(acum + (debe - haber));

        // Columna 0 = Saldo acumulado ANTES del período (solo balances), valor absoluto
        const col0 = esBalance ? Math.abs(acum) : null;

        return {
          empresaName,
          balancename: mae.descripcion,
          ctacontable: d.ctacontable ?? '',
          descripcion: d.descripcion ?? '',
          columna: col,
          renglon: d.renglon ?? 0,
          tipo: d.tipo ?? '',
          nivel,
          acum,
          debe,
          haber,
          valor,
          col0,
        };
      })
      .sort((a, b) => a.renglon - b.renglon || a.columna - b.columna);

    // ── 11. Columnas usadas (1..7) ──
    const columnasSet = new Set<number>();
    for (const l of lineasBrutas) {
      if (l.columna >= 1 && l.columna <= 7) columnasSet.add(l.columna);
    }
    const columnasUsadas = Array.from(columnasSet).sort((a, b) => a - b);

    // ── 12. Totales por columna ──
    const totales: Record<string, number> = {};
    if (esBalance) {
      totales['0'] = lineasBrutas.reduce((s, l) => s + (l.col0 ?? 0), 0);
    }
    for (const col of columnasUsadas) {
      // REGLA DE NEGOCIO — Estado de Resultado, columnas 1 a 4 (Parcial y Totales):
      //   Total = (todos los ingresos) − (todos los gastos)
      //   Ingresos  = ventas (cuentas de naturaleza C)
      //   Menos     = rebajas, devoluciones y descuentos sobre ventas (naturaleza D dentro de tipo 4)
      //   Menos     = todos los gastos (cuentas de tipo 5, naturaleza D)
      //   Se aplica el signo según la naturaleza de la cuenta: C suma, D resta.
      //   Aplica a cualquier columna 1..4 por si el usuario reordena la presentación
      //   de las columnas de totales en las cuentas registradas (col 5..7 no aplica).
      if (!esBalance && col >= 1 && col <= 4) {
        totales[String(col)] = lineasBrutas
          .filter((l) => l.columna === col && l.ctacontable)
          .reduce((s, l) => {
            const naturaleza = ctaMap.get(l.ctacontable)?.naturaleza || 'D';
            return s + (naturaleza === 'C' ? l.valor : -l.valor);
          }, 0);
        continue;
      }
      const total = lineasBrutas
        .filter((l) => l.columna === col)
        .reduce((s, l) => s + l.valor, 0);
      totales[String(col)] = total;
    }

    return {
      empresaName,
      balancename: mae.descripcion,
      plantillaId,
      nivelDetalle: nivelDetalle ?? null,
      periodo: periodo ?? null,
      anio: anio ?? null,
      esBalance,
      mostrarCol0: esBalance,
      columnasUsadas,
      lineas: lineasBrutas,
      totales,
    };
  }

  // ================================================================
  //  BALANCE FINANCIERO
  // ================================================================
  /**
   * Balance Financiero (Activos / Pasivos / Capital) con jerarquía de cuentas.
   *
   * Columnas: ctacontable | descripcion | nivel | padre | tiposaldo |
   *           sacum | parcial | total
   *
   * Reglas (definidas por el usuario):
   * 1. Los hijos ACUMULAN en el padre: una sola consulta SQL con auto-unión
   *    jerárquica del catálogo (`hijas.ctacontable = a.ctacontable OR
   *    hijas.ctacontable LIKE CONCAT(a.ctacontable, '-%')`), de modo que
   *    `1-1-10-1` suma en `1-1` sin capturar troncos ajenos como `1-10`.
   * 2. `sacum` = Σ (debe - haber) de los descendientes en los períodos
   *    ANTERIORES al consultado.
   * 3. `parcial` = saldo mayorizado SOLO para cuentas operativas / de
   *    detalle (`sn_operable = 'S'`).
   * 4. `total` = saldo mayorizado SOLO para cuentas mayores
   *    (`sn_operable = 'N'`).
   *    → Cada fila llena UNA de las dos columnas, nunca ambas.
   * 5. Los montos van en POSITIVO para todos los grupos (Activos, Pasivos y
   *    Capital); la dirección real (D/C) se informa en `tiposaldo`.
   * 6. `tiposaldo` = del cierre (cocierredet) del último período cerrado
   *    anterior al consultado; si no hay cierre, la `naturaleza` del catálogo.
   * 7. Alcance: SOLO cuentas de BALANCE (`tcogrupocontableId < 4` = grupos
   *    1 Activos, 2 Pasivos, 3 Capital). La acumulación sí considera TODAS las
   *    descendientes (p.ej. Resultados bajo Capital).
   */
  async generarBalanceFinanciero(dto: ReporteContableDto) {
    const empresaId = Number(dto?.empresaId);
    if (!empresaId) throw new BadRequestException('empresaId es requerido');

    const fechaSistema = await this.fechaSistema.getFecha(empresaId);
    const anio = dto?.anio ? Number(dto.anio) : fechaSistema.getFullYear();
    const periodo = dto?.periodo ? Number(dto.periodo) : fechaSistema.getMonth() + 1;
    if (!anio || anio < 1900) throw new BadRequestException('Año inválido');
    if (periodo < 1 || periodo > 12) {
      throw new BadRequestException('El período debe estar entre 1 y 12');
    }

    const empresa = await this.empresasRepo.findOne({ where: { empresaId } as any });
    const empresaName = empresa?.descripcion ?? '';

    // ── 1. Una sola consulta SQL jerárquica ─────────────────────────────
    // Auto-unión del catálogo por PREFIJO (`hijas.ctacontable = a.ctacontable
    // OR hijas.ctacontable LIKE CONCAT(a.ctacontable, '-%')`) para que cada
    // cuenta padre sume su propio movimiento y el de todas sus hijas
    // (1-1-10-1 suma en 1-1) sin confundir troncos que comparten números
    // iniciales (el guion `-/%` evita que `1-1` capture a `1-10`).
    // `ant` = saldos acumulados anteriores (periodo < P);
    // `act` = movimientos del período consultado (periodo = P);
    // `ce`  = tiposaldo del cierre del último período cerrado anterior a P.
    // ── 1. Agregados jerárquicos (subconsulta interna) ──────────────────
    // Auto-unión del catálogo por PREFIJO (`hijas.ctacontable = a.ctacontable
    // OR hijas.ctacontable LIKE CONCAT(a.ctacontable, '-%')`) para que cada
    // cuenta padre sume su propio movimiento y el de todas sus hijas
    // (1-1-10-1 suma en 1-1) sin confundir troncos que comparten números
    // iniciales (el guion `-/%` evita que `1-1` capture a `1-10`).
    // `ant` = saldos acumulados anteriores (periodo < P);
    // `act` = movimientos del período consultado (periodo = P);
    // `ce`  = tiposaldo del cierre del último período cerrado anterior a P.
    // TODOS los orígenes van filtrados por `empresaId` (+ `anio` en
    // `cocierredet`) y cada subconsulta devuelve UNA fila por cuenta: sin eso
    // el JOIN multiplica los SUM y contamina los importes en multi-empresa.
    const sql = `
      SELECT
        b.ctacontable            AS ctacontable,
        b.descripcion            AS descripcion,
        b.nivel                  AS nivel,
        b.padre                  AS padre,
        b.naturaleza             AS naturaleza,
        b.sn_operable            AS sn_operable,

        -- Tipo de saldo del acumulado ANTERIOR (consolidado)
        CASE
          WHEN b.saldoAnterior <> 0 THEN
            CASE WHEN b.tiposaldoCierre = 'C' THEN 'C'
                 WHEN b.tiposaldoCierre = 'D' THEN 'D'
                 WHEN b.saldoAnterior < 0 THEN 'C'
                 ELSE 'D' END
          WHEN b.debe > b.haber AND b.naturaleza = 'D' THEN 'D'
          ELSE 'C'
        END AS tiposaldo,

        -- Saldo acumulado anterior: positivo cuando el lado anterior es acreedor
        -- (las cuentas de naturaleza C acumulan en negativo en coctamov)
        CASE
          WHEN (CASE
                  WHEN b.saldoAnterior <> 0 THEN
                    CASE WHEN b.tiposaldoCierre = 'C' THEN 'C'
                         WHEN b.tiposaldoCierre = 'D' THEN 'D'
                         WHEN b.saldoAnterior < 0 THEN 'C'
                         ELSE 'D' END
                  WHEN b.debe > b.haber AND b.naturaleza = 'D' THEN 'D'
                  ELSE 'C' END) = 'C'
            THEN -1 * b.saldoAnterior
          ELSE b.saldoAnterior
        END AS sacum,

        b.debe  AS debe,
        b.haber AS haber,

        -- PARCIAL — solo cuentas operables con saldo en el período.
        -- Se usa '<> 0' (no '> 0'): una cuenta acreedora con saldo negativo
        -- (ej. Capital) también debe mostrar su parcial.
        -- En naturaleza C el movimiento se invierte para que el importe quede
        -- en el mismo sentido que su sacum (sacum + parcial = saldo).
        CASE
          WHEN b.sn_operable = 'S' AND b.saldoPeriodo <> 0 THEN
            CASE WHEN b.naturaleza = 'C' THEN -1 * (b.debe - b.haber)
                 ELSE (b.debe - b.haber) END
          ELSE 0
        END AS parcial,

        -- TOTAL — solo cuentas mayores: acumulado anterior + movimiento del
        -- período. Siempre se SUMA el movimiento firmado (restar cuando los
        -- lados difieren doble-aplicaría el signo) y en naturaleza C se toma
        -- el valor absoluto para mostrar el saldo en el lado propio.
        CASE
          WHEN b.sn_operable = 'N' THEN
            CASE WHEN b.naturaleza = 'C'
                 THEN ABS(b.saldoAnterior + (b.debe - b.haber))
                 ELSE b.saldoAnterior + (b.debe - b.haber) END
          ELSE 0
        END AS total,

        b.saldoPeriodo AS saldo
      FROM (
        SELECT
          a.ctacontable             AS ctacontable,
          a.descripcion             AS descripcion,
          a.nivel                   AS nivel,
          a.padre                   AS padre,
          a.naturaleza              AS naturaleza,
          a.sn_operable             AS sn_operable,
          COALESCE(ce.tiposaldo, '') AS tiposaldoCierre,
          COALESCE(SUM(ant.sacum), 0) AS saldoAnterior,
          COALESCE(SUM(act.debe), 0)  AS debe,
          COALESCE(SUM(act.haber), 0) AS haber,
          COALESCE(SUM(act.saldo), 0) AS saldoPeriodo
        FROM coctacontables a
        JOIN coctacontables hijas
          ON hijas.empresaId = a.empresaId
         AND (hijas.ctacontable = a.ctacontable
              OR hijas.ctacontable LIKE CONCAT(a.ctacontable, '-%'))
        LEFT JOIN (
          SELECT ctacontable,
                 SUM(COALESCE(debe, 0)) - SUM(COALESCE(haber, 0)) AS sacum
          FROM coctamov
          WHERE empresaId = ? AND anio = ? AND periodo < ?
          GROUP BY ctacontable
        ) ant ON ant.ctacontable = hijas.ctacontable
        LEFT JOIN (
          SELECT ctacontable,
                 SUM(COALESCE(debe, 0))  AS debe,
                 SUM(COALESCE(haber, 0)) AS haber,
                 SUM(COALESCE(saldo, 0)) AS saldo
          FROM coctamov
          WHERE empresaId = ? AND anio = ? AND periodo = ?
          GROUP BY ctacontable
        ) act ON act.ctacontable = hijas.ctacontable
        LEFT JOIN (
          SELECT d.ctacontable, d.tiposaldo
          FROM cocierredet d
          JOIN (
            SELECT ctacontable, MAX(periodo) AS periodo
            FROM cocierredet
            WHERE empresaId = ? AND anio = ? AND periodo < ?
            GROUP BY ctacontable
          ) m ON m.ctacontable = d.ctacontable AND m.periodo = d.periodo
          WHERE d.empresaId = ? AND d.anio = ?
        ) ce ON ce.ctacontable = a.ctacontable
        WHERE a.empresaId = ? AND a.tcogrupocontableId < 4
        GROUP BY a.ctacontable, a.descripcion, a.nivel, a.padre,
                 a.naturaleza, a.sn_operable, ce.tiposaldo
      ) b
      ORDER BY b.ctacontable ASC
    `;
    const crudas = (await this.ctacontablesRepo.query(sql, [
      empresaId, anio, periodo,
      empresaId, anio, periodo,
      empresaId, anio, periodo,
      empresaId, anio,
      empresaId,
    ])) as any[];

    // ── 2. Dos columnas de monto: PARCIAL o TOTAL ──────────────────────
    // Las reglas (signos y gates) viven en los `CASE` del SQL de arriba; aquí
    // solo se pasan tal cual, redondeados a 2 decimales.
    const r2 = (n: any) => Math.round((Number(n) || 0) * 100) / 100;
    const filas = crudas.map((r) => {
      const nivel = Number(r.nivel) || 0;

      return {
        ctacontable: String(r.ctacontable ?? ''),
        descripcion: String(r.descripcion ?? ''),
        nivel,
        padre: String(r.padre ?? ''),
        sn_operable: String(r.sn_operable ?? ''),
        naturaleza: String(r.naturaleza ?? ''),
        tiposaldo: String(r.tiposaldo ?? '') === 'C' ? 'C' : 'D',
        sacum: r2(r.sacum),
        debe: r2(r.debe),
        haber: r2(r.haber),
        parcial: r2(r.parcial),
        total: r2(r.total),
        saldo: r2(r.saldo),
      };
    });

    // Orden jerárquico numérico: 1 < 1-1 < 1-1-2 < 1-1-10 (no alfabético)
    const cmpCuenta = (x: string, y: string): number => {
      const px = x.split('-');
      const py = y.split('-');
      const n = Math.max(px.length, py.length);
      for (let i = 0; i < n; i++) {
        const a = px[i];
        const b = py[i];
        if (a === undefined) return -1;
        if (b === undefined) return 1;
        const na = Number(a);
        const nb = Number(b);
        const aNum = a !== '' && !Number.isNaN(na);
        const bNum = b !== '' && !Number.isNaN(nb);
        if (aNum && bNum) {
          if (na !== nb) return na - nb;
        } else {
          const cmp = a.localeCompare(b);
          if (cmp !== 0) return cmp;
        }
      }
      return 0;
    };
    filas.sort((a, b) => cmpCuenta(a.ctacontable, b.ctacontable));

    // ── 5. Totales por grupo (nivel 1) ──
    // Se toman de la columna `Total` (NO de `saldo`): `saldo` es
    // `SUM(act.saldo)` y solo alcanza las cuentas que tuvieron movimiento en
    // el mes consultado (las que no se movieron no tienen fila en `coctamov`
    // para ese período), con lo cual subestima el grupo. `Total` =
    // `sacum + (debe - haber)` sí es el saldo acumulado real a fin de período
    // y hace que se cumpla la ecuación contable A + P + C = 0.
    const deNivel1 = (cta: string) => filas.find((f) => f.ctacontable === cta);
    const activos = deNivel1('1');
    const pasivos = deNivel1('2');
    const capital = deNivel1('3');

    return {
      empresaName,
      anio,
      periodo,
      filas,
      totales: {
        activos: { saldo: r2(activos?.total ?? 0), tiposaldo: activos?.tiposaldo ?? 'D' },
        pasivos: { saldo: r2(pasivos?.total ?? 0), tiposaldo: pasivos?.tiposaldo ?? 'C' },
        capital: { saldo: r2(capital?.total ?? 0), tiposaldo: capital?.tiposaldo ?? 'C' },
      },
    };
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
    // REGLA: un período solo puede cerrarse desde Cierre Contable (genera la partida de cierre)
    if (dto?.sn_abierto === 'N') {
      throw new ForbiddenException(
        'No se puede crear un período cerrado. Los cierres se realizan desde Cierre Contable.',
      );
    }
    const motivo = await this.explicarProteccionPeriodo(
      { nroanio: dto?.nroanio, nromes: dto?.nromes },
      dto?.empresaId,
    );
    if (motivo) throw new ForbiddenException(motivo);
    return this.createEntity(this.periodoctableRepo, dto, currentUser);
  }

  async updatePeriodoctable(periodoscontableId: number, empresaId: number, dto: any, currentUser: string) {
    const actual = await this.findPeriodoctable(periodoscontableId, empresaId);
    // REGLA INVARIABLE: período cerrado = inmutable; y un período anterior a otro cerrado también
    const motivo = await this.explicarProteccionPeriodo(actual, empresaId);
    if (motivo) throw new ForbiddenException(motivo);
    // Cerrar un período desde el catálogo saltaría la partida de cierre contable
    if (dto?.sn_abierto === 'N') {
      throw new BadRequestException(
        'No se puede cerrar un período desde el catálogo. Use Cierre Contable para generar la partida de cierre.',
      );
    }
    return this.updateEntity(this.periodoctableRepo, 'periodoscontableId', periodoscontableId, empresaId, dto, currentUser, 'Periodo Contable');
  }

  async removePeriodoctable(periodoscontableId: number, empresaId: number) {
    const actual = await this.findPeriodoctable(periodoscontableId, empresaId);
    const motivo = await this.explicarProteccionPeriodo(actual, empresaId);
    if (motivo) throw new ForbiddenException(motivo);
    // La entidad coperiodoctable no tiene columna sn_activo → el softDelete genérico
    // sería un no-op silencioso, por eso es eliminación física (solo alcanza a períodos abiertos)
    const cierre = await this.cierrectableRepo.findOne({
      where: { anio: actual.nroanio, periodo: actual.nromes, empresaId } as unknown as FindOptionsWhere<Cocierrectable>,
    });
    if (cierre) {
      throw new ForbiddenException(
        `El período ${actual.nromes}/${actual.nroanio} tiene cierre contable registrado: no puede eliminarse.`,
      );
    }
    await this.periodoctableRepo.delete({ periodoscontableId, empresaId });
    return actual;
  }

  /**
   * REGLA DE PROTECCIÓN DE PERÍODOS CONTABLES:
   * 1) Un período cerrado (sn_abierto='N') es inmutable para siempre: no se modifica,
   *    no se reabre y no se elimina bajo ninguna circunstancia.
   * 2) Si existe un período cerrado posterior, los anteriores (previos/antecesores)
   *    tampoco son modificables.
   * Devuelve el motivo de protección, o null si el período no está protegido.
   */
  private async explicarProteccionPeriodo(
    periodo: { nroanio?: number; nromes?: number; sn_abierto?: string },
    empresaId: number,
  ): Promise<string | null> {
    if (!periodo || periodo.nroanio == null || periodo.nromes == null) return null;

    if (periodo.sn_abierto === 'N') {
      return `El período ${periodo.nromes}/${periodo.nroanio} está cerrado: no es modificable ni puede reabrirse bajo ninguna circunstancia`;
    }

    const cerrados = await this.periodoctableRepo.find({
      where: { empresaId, sn_abierto: 'N' } as unknown as FindOptionsWhere<Coperiodoctable>,
    });
    const hayCerradoPosterior = cerrados.some(
      (c) => c.nroanio > periodo.nroanio! || (c.nroanio === periodo.nroanio && c.nromes > periodo.nromes!),
    );
    if (hayCerradoPosterior) {
      return `Existe un período cerrado posterior al ${periodo.nromes}/${periodo.nroanio}: los períodos previos o antecesores no son modificables`;
    }
    return null;
  }

  async findAllCopdamae(empresaId: number) {
    const filas = await this.copdamaeRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<Copdamae>,
      order: { fecharegistro: 'DESC' } as any,
    });
    return this.enriquecerPlantillasPartidas(filas, empresaId);
  }

  async findCopdamae(partidaId: number, empresaId: number) {
    const fila = await this.findOneById(this.copdamaeRepo, 'partidaId', partidaId, empresaId, 'Partida Mayor');
    const [enriquecida] = await this.enriquecerPlantillasPartidas([fila as Copdamae], empresaId);
    return enriquecida;
  }

  /**
   * Enriquece partidas con `plantillaId` (= tcoplantillapdamaeId) calculado POR MÓDULO,
   * para que el frontend muestre el "Concepto" sin CRUZAR jamás `documentoId` contra el
   * catálogo de plantillas (regla del usuario 14/10/2026: el label de la plantilla SIEMPRE
   * se resuelve por tcoplantillapdamaeId, nunca por documentoId).
   *
   * Sin columna nueva en `copdamae` (no procede ALTER): el id se deriva aquí, en lectura,
   * con la MISMA regla que usó cada flujo al crear la partida:
   *
   * | Módulo | copdamae.documentoId es…            | plantillaId calculado con…                    |
   * |--------|-------------------------------------|-----------------------------------------------|
   * | 3 Facturación | posfacmae.facturaId (ref FAC-)  | tipofactura: 'C'→plantilla '%credito%', 'E'→'%contado%' (módulo 3) |
   * | 3 (manual)    | tcoplantillapdamaeId (form)     | catálogo de plantillas del módulo 3           |
    * | 4 CxC   | clienteMovId de cxcmovimientos     | 'Apertura…'→'%apertura%'; si no, por el movimiento (tipodoc 2→NCR, 3→ND, resto '%abono%'); si el movimiento ya no existe (histórico), por descripción 'Abono'; fallback manual = catálogo del módulo 4 |
    * | 5 CxP   | cxpmovId de cxpmovimientos         | compra vinculada (cxpcomprasmae.partidaId): FCO→'%contado%', FCC/ORC→'%credito%'; si no, tipomov del movimiento (C→NCR, D→ND, resto '%abono%'); descripción directa 'contado'/'crédito' (manual); fallback = catálogo del módulo 5 |
    * | 6 Bancos | tcoplantillapdamaeId (módulo SIN documentos fiscales; el enlace al movimiento queda en bcosmovimientos.partidaId) | documentoId tal cual vs catálogo del módulo 6; si no (histórico con bcomovId), por descripción: 'deposito'→PDA depósitos, 'retiro'→PDA retiros, 'cheque'→proveedor/particular |
   * | 7 Contabilidad | tcoplantillapdamaeId (form manual) | documentoId tal cual, catálogo del módulo 7  |
   * | Resto  | cierre (0) / no aplica              | null                                          |
   *
   * INVARIANTE: el id devuelto SIEMPRE pertenece a una plantilla con `moduloId` igual al
   * de la partida (catálogos filtrados por módulo) — nunca se cruza entre módulos.
   */
  private async enriquecerPlantillasPartidas(
    filas: Copdamae[],
    empresaId: number,
  ): Promise<Array<Copdamae & { plantillaId: number | null }>> {
    if (!filas.length) return [];

    // Catálogo de plantillas activas agrupadas por módulo
    const plantillas = await this.plantillapdamaeRepo.find({
      where: { empresaId, sn_activo: 'S' } as unknown as FindOptionsWhere<Tcoplantillapdamae>,
    });
    const porModulo = new Map<number, Tcoplantillapdamae[]>();
    for (const p of plantillas) {
      const arr = porModulo.get(Number(p.moduloId)) ?? [];
      arr.push(p);
      porModulo.set(Number(p.moduloId), arr);
    }
    /** Plantilla activa de un módulo cuyo descripción contenga TODAS las palabras dadas. */
    const buscar = (moduloId: number, ...palabras: string[]): Tcoplantillapdamae | undefined =>
      (porModulo.get(moduloId) ?? []).find((p) => {
        const desc = String(p.descripcion || '').toLowerCase();
        return palabras.every((w) => desc.includes(w));
      });
    /** Si `doc` es un id de plantilla DEL MISMO módulo, devuelve ese id; si no, null. */
    const enCatalogo = (moduloId: number, doc: number): number | null =>
      doc > 0 && (porModulo.get(moduloId) ?? []).some((p) => Number(p.tcoplantillapdamaeId) === doc)
        ? doc
        : null;

    // Documentos vinculados (cargados en lote — sin N+1)
    const docsMod3 = filas
      .filter((f) => Number(f.moduloId) === 3 && /^FAC-/i.test(String(f.nroreferencia || '')))
      .map((f) => Number(f.documentoId))
      .filter((id) => id > 0);
    const docsMod4 = filas.filter((f) => Number(f.moduloId) === 4).map((f) => Number(f.documentoId)).filter((id) => id > 0);
    const docsMod5 = filas.filter((f) => Number(f.moduloId) === 5).map((f) => Number(f.documentoId)).filter((id) => id > 0);

    const facturas = docsMod3.length
      ? await this.facMaeRepo.find({ where: { facturaId: In(docsMod3), empresaId } as unknown as FindOptionsWhere<TPosFacMae> })
      : [];
    const movsCxc = docsMod4.length
      ? await this.cxcMovimientoRepo.find({ where: { clienteMovId: In(docsMod4), empresaId } as unknown as FindOptionsWhere<CxcMovimiento> })
      : [];
    const movsCxp = docsMod5.length
      // OJO: la PK de TCxpMovimiento se llama `bcomovId` (naming heredado) pero
      // mapea a la columna `cxpmovId`, que es lo que guarda copdamae.documentoId
      ? await this.cxpMovimientoRepo.find({ where: { bcomovId: In(docsMod5), empresaId } as unknown as FindOptionsWhere<TCxpMovimiento> })
      : [];
    // Compras CxP vinculadas a partidas (cxpcomprasmae.partidaId → TipoCompra FCO/FCC)
    const partidasMod5 = filas.filter((f) => Number(f.moduloId) === 5).map((f) => Number(f.partidaId)).filter((id) => id > 0);
    const compras = partidasMod5.length
      ? await this.cxpCompraMaeRepo.find({ where: { partidaId: In(partidasMod5), empresaId } as unknown as FindOptionsWhere<TCxpCompraMae> })
      : [];

    const mapaFacturas = new Map(facturas.map((f) => [Number(f.facturaId), f]));
    const mapaMovCxc = new Map(movsCxc.map((m) => [Number(m.clienteMovId), m]));
    const mapaMovCxp = new Map(movsCxp.map((m) => [Number(m.bcomovId), m]));
    const mapaCompras = new Map(compras.map((c) => [Number(c.partidaId), c]));

    const plantillaIdDe = (fila: Copdamae): number | null => {
      const doc = Number(fila.documentoId) || 0;
      const mod = Number(fila.moduloId);
      const idDe = (p: Tcoplantillapdamae | undefined): number | null =>
        p ? Number(p.tcoplantillapdamaeId) : null;

      // 7 Contabilidad: documentoId ES el tcoplantillapdamaeId (form manual)
      if (mod === 7) return enCatalogo(7, doc);

      if (mod === 6) {
        // documentoId ES el tcoplantillapdamaeId (módulo sin documentos fiscales)
        const enCat = enCatalogo(6, doc);
        if (enCat != null) return enCat;
        // Histórico: partidas creadas cuando documentoId guardaba el bcomovId
        // (tests, movimientos ya borrados) → convención del concepto del flujo
        const desc = String(fila.descripcion || '').toLowerCase();
        if (desc.includes('deposito')) return idDe(buscar(6, 'depositos'));
        if (desc.includes('retiro')) return idDe(buscar(6, 'retiros'));
        if (desc.includes('cheque')) {
          return idDe(desc.includes('particular') ? buscar(6, 'particular') : buscar(6, 'proveedor'));
        }
        return null; // ej. transferencias: no hay plantilla PDA propia
      }

      if (mod === 3) {
        // Automática: la referencia FAC- indica documento en posfacmae; el tipo de
        // venta (contado/crédito) decide la plantilla — misma regla que contabilizarFactura
        if (/^FAC-/i.test(String(fila.nroreferencia || ''))) {
          const fac = mapaFacturas.get(doc);
          if (!fac) return null;
          return idDe(String(fac.tipofactura) === 'C' ? buscar(3, 'credito') : buscar(3, 'contado'));
        }
        return enCatalogo(3, doc); // manual: el formulario guarda la plantilla en documentoId
      }

      if (mod === 4) {
        const desc = String(fila.descripcion || '').toLowerCase();
        // Convención de flujo: la partida de apertura de préstamo se describe "Apertura…"
        if (desc.includes('apertura')) return idDe(buscar(4, 'apertura'));
        const mov = mapaMovCxc.get(doc);
        if (mov) {
          const tipodoc = Number(mov.documentoId) || 0;
          if (tipodoc === 2) return idDe(buscar(4, 'nota de credito'));
          if (tipodoc === 3) return idDe(buscar(4, 'nota de debito'));
          return idDe(buscar(4, 'abono')); // default del flujo de abonos CxC
        }
        const enCat = enCatalogo(4, doc);
        if (enCat != null) return enCat;
        // Histórico: movimiento ya borrado pero el concepto conserva la convención
        if (desc.includes('abono')) return idDe(buscar(4, 'abono'));
        return null;
      }

      if (mod === 5) {
        const desc = String(fila.descripcion || '').toLowerCase();
        if (desc.includes('contado')) return idDe(buscar(5, 'contado'));
        if (desc.includes('credito') || desc.includes('crédito')) return idDe(buscar(5, 'credito'));
        // Compra vinculada a la partida: FCO → compra contado (PDA 14),
        // FCC/ORC → compra crédito (PDA 15) — misma regla que handleCxPMovimientoCreado
        const compra = mapaCompras.get(Number(fila.partidaId));
        if (compra) {
          return idDe(String(compra.TipoCompra) === 'FCO' ? buscar(5, 'contado') : buscar(5, 'credito'));
        }
        const mov = mapaMovCxp.get(doc);
        if (mov) {
          const tipomov = String(mov.tipomov);
          if (tipomov === 'C') return idDe(buscar(5, 'nota de credito'));
          if (tipomov === 'D') return idDe(buscar(5, 'nota de debito'));
          return idDe(buscar(5, 'abono'));
        }
        return enCatalogo(5, doc); // manual
      }

      return null; // cierre contable / configuración / sin plantilla
    };

    return filas.map((fila) => ({ ...fila, plantillaId: plantillaIdDe(fila) }));
  }

  /**
   * Control de partidas cerradas (sn_cerrada) — "mejorar el control de lo cerrado".
   *
   * Bloquea la operación si:
   * 1. La partida está marcada sn_cerrada='S' (se marca al cerrar su período
   *    contable en realizarCierre), o
   * 2. Fallback: su período contable está cerrado en coperiodoctable
   *    (cubre partidas creadas manualmente en períodos ya cerrados).
   *
   * Llamar SIEMPRE antes de crear/modificar/eliminar cabecera o líneas.
   */
  private async exigirPartidaModificable(
    ref: {
      empresaId: number;
      anio?: number | null;
      periodo?: number | null;
      sn_cerrada?: string;
    },
    etiqueta: string,
    accion: string,
  ): Promise<void> {
    if (ref.sn_cerrada === 'S') {
      throw new ForbiddenException(`${etiqueta} está cerrada: ${accion}`);
    }
    if (ref.anio && ref.periodo) {
      const per = await this.periodoctableRepo.findOne({
        where: {
          nroanio: ref.anio,
          nromes: ref.periodo,
          empresaId: ref.empresaId,
        } as unknown as FindOptionsWhere<Coperiodoctable>,
      });
      if (per && per.sn_abierto !== 'S') {
        throw new ForbiddenException(
          `${etiqueta} pertenece al período ${ref.periodo}/${ref.anio} (cerrado): ${accion}`,
        );
      }
    }
  }

  /**
   * Protección de la pareja original ↔ contra partida (10/10/2026).
   *  - `partidaOrigenId != null` → la fila ES una contra: no editable ni
   *    modificable línea a línea (rompería el espejo con su original).
   *  - `contrapdaId != null` → la fila YA tiene contra: no editable ni
   *    eliminable (primero elimine la contra).
   * `permitirQuitarContra` habilita SOLO eliminar la propia contra
   * (deshacer); al hacerlo se libera el marcador `contrapdaId` de la original.
   */
  private exigirPartidaNoContraida(
    ref: { partidaOrigenId?: number | null; contrapdaId?: number | null },
    etiqueta: string,
    accion: string,
    opts?: { permitirQuitarContra?: boolean },
  ): void {
    if (ref.partidaOrigenId != null) {
      if (opts?.permitirQuitarContra) return;
      throw new ConflictException(
        `${etiqueta} es una contra partida: ${accion}. La contra partida no es editable.`,
      );
    }
    if (ref.contrapdaId != null) {
      throw new ConflictException(
        `${etiqueta} ya tiene una contra partida asociada (id=${ref.contrapdaId}): ${accion}. ` +
        'Elimine primero la contra partida.',
      );
    }
  }

  async createCopdamae(dto: CreateCopdamaeDto, currentUser: string) {
    await this.exigirPartidaModificable(
      { empresaId: dto.empresaId, anio: dto.anio, periodo: dto.periodo, sn_cerrada: dto.sn_cerrada },
      'La partida',
      'no puede registrarse en un perA-odo cerrado',
    );
    // Correlativo automático desde ttipoparametros (field='nropartida'):
    // el dto.nropartida del cliente se ignora.
    const nropartida = await this.siguienteNropartida(currentUser, dto.empresaId);
    return this.createEntity(this.copdamaeRepo, { ...dto, nropartida }, currentUser);
  }

  async updateCopdamae(partidaId: number, empresaId: number, dto: UpdateCopdamaeDto, currentUser: string) {
    const actual = await this.findOneById(this.copdamaeRepo, 'partidaId', partidaId, empresaId, 'Partida Mayor');
    await this.exigirPartidaModificable(
      actual,
      `La partida #${actual.nropartida}`,
      'no puede modificarse ni eliminarse',
    );
    this.exigirPartidaNoContraida(
      actual,
      `La partida #${actual.nropartida}`,
      'no puede modificarse',
    );
    return this.updateEntity(this.copdamaeRepo, 'partidaId', partidaId, empresaId, dto, currentUser, 'Partida Mayor');
  }

  async removeCopdamae(partidaId: number, empresaId: number) {
    const actual = await this.findOneById(this.copdamaeRepo, 'partidaId', partidaId, empresaId, 'Partida Mayor');
    await this.exigirPartidaModificable(
      actual,
      `La partida #${actual.nropartida}`,
      'no puede modificarse ni eliminarse',
    );
    // Pareja original ↔ contra: la original no se elimina mientras exista
    // su contra; la propia contra sí puede eliminarse (deshacer) — al hacerlo
    // se libera el marcador contrapdaId de la original más abajo.
    this.exigirPartidaNoContraida(
      actual,
      `La partida #${actual.nropartida}`,
      'no puede eliminarse',
      { permitirQuitarContra: true },
    );
    const esContra = actual.partidaOrigenId != null;
    // Invariante (estado actual): partida anulada ⇒ ya no está contabilizada
    const fechaUpdated = await this.fechaSistema.getFecha(empresaId);
    Object.assign(actual, {
      sn_anulada: 'S',
      sn_contabilizada: 'N',
      fechaUpdated,
    });
    const saved = await this.copdamaeRepo.save(actual);
    // Cascada: las líneas de la partida siguen el estado del maestro
    await this.copdadetRepo.createQueryBuilder()
      .update(Copdadet)
      .set({ sn_anulada: 'S', sn_contabilizada: 'N', fechaUpdated })
      .where('partidaId = :pid', { pid: partidaId })
      .execute();
    // Al quitar una contra, liberar el marcador de la original para que
    // pueda volver a contraerse. OJO: la eliminación no revierte coctamov
    // (misma limitación que cualquier partida) → ejecute la Reconstrucción
    // de Mayores para sincronizar el mayor después de eliminar una contra.
    if (esContra && actual.partidaOrigenId != null) {
      await this.copdamaeRepo.createQueryBuilder()
        .update(Copdamae)
        .set({ contrapdaId: null, feccontrapda: null, fechaUpdated } as any)
        .where('partidaId = :pid', { pid: actual.partidaOrigenId })
        .execute();
    }
    return saved;
  }

  async findAllCopdadet(empresaId: number, copdamaeId?: number) {
    if (copdamaeId) {
      return this.copdadetRepo.find({ where: { empresaId, partidaId: copdamaeId }, order: { nrofila: 'ASC' } });
    }
    return this.findAllByEmpresa(this.copdadetRepo, empresaId);
  }

  async findCopdadet(copdadetId: number, empresaId: number) {
    return this.findOneById(this.copdadetRepo, 'copdadetId', copdadetId, empresaId, 'Partida Detalle');
  }

  async createCopdadet(dto: CreateCopdadetDto, currentUser: string) {
    // No permitir agregar líneas a una partida cerrada (bandera o período)
    // ni a una pareja original ↔ contra (rompería el espejo).
    const mae = await this.copdamaeRepo.findOne({
      where: { partidaId: dto.partidaId, empresaId: dto.empresaId } as unknown as FindOptionsWhere<Copdamae>,
    });
    if (mae) {
      await this.exigirPartidaModificable(
        mae,
        `La partida #${mae.nropartida}`,
        'no puede recibir nuevas líneas',
      );
      this.exigirPartidaNoContraida(
        mae,
        `La partida #${mae.nropartida}`,
        'no puede recibir nuevas líneas',
      );
    }
    return this.createEntity(this.copdadetRepo, dto, currentUser);
  }

  async updateCopdadet(copdadetId: number, empresaId: number, dto: UpdateCopdadetDto, currentUser: string) {
    const det = await this.findOneById(this.copdadetRepo, 'copdadetId', copdadetId, empresaId, 'Partida Detalle');
    await this.exigirLineaCopdadetModificable(det, 'no puede modificarse ni eliminarse');
    return this.updateEntity(this.copdadetRepo, 'copdadetId', copdadetId, empresaId, dto, currentUser, 'Partida Detalle');
  }

  async removeCopdadet(copdadetId: number, empresaId: number) {
    const det = await this.findOneById(this.copdadetRepo, 'copdadetId', copdadetId, empresaId, 'Partida Detalle');
    await this.exigirLineaCopdadetModificable(det, 'no puede modificarse ni eliminarse');
    // Invariante (estado actual): línea anulada ⇒ ya no está contabilizada
    Object.assign(det, {
      sn_anulada: 'S',
      sn_contabilizada: 'N',
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
    });
    return this.copdadetRepo.save(det);
  }

  /**
   * Valida que una línea de partida (copdadet) no pertenezca a una partida cerrada.
   * Usa el maestro como referencia (anio/periodo/sn_cerrada); si el maestro no
   * existe, valida con los propios campos de la línea.
   */
  private async exigirLineaCopdadetModificable(det: Copdadet, accion: string): Promise<void> {
    const mae = await this.copdamaeRepo.findOne({
      where: { partidaId: det.partidaId, empresaId: det.empresaId } as unknown as FindOptionsWhere<Copdamae>,
    });
    const ref = mae ?? det;
    const nro = mae?.nropartida ?? det.nropartida ?? det.partidaId;
    const etiqueta = det.nrofila != null
      ? `La línea ${det.nrofila} de la partida #${nro}`
      : `La partida #${nro}`;
    await this.exigirPartidaModificable(ref, etiqueta, accion);
    // Pareja original ↔ contra: las líneas de ambas partes son inmutables
    if (mae) {
      this.exigirPartidaNoContraida(mae, etiqueta, accion);
    }
  }

  /**
   * Lista movimientos contables con SALDO ACUMULADO y SALDO ACTUAL.
   *
   * Criterio ACTUAL (30/09/2026): la fila = cuenta + año + período, y el
   * acumulado se ENCADENA desde la propia tabla `coctamov`:
   *
   *   sacum(p)  = saldoanterior(cuenta, año) + Σ netos de los períodos < p
   *   saldo(p)  = sacum(p) + neto(p)         donde neto = debe - haber
   *
   * - `saldoanterior` se lee de `coctasaldos` (saldo al cierre del año
   *   anterior). `cocierredet` NO se usa: está vacía y dejaba sacum en 0.
   * - El encadenamiento se calcula con TODOS los movimientos del año aunque
   *   el usuario filtre un período; si no, el acumulado saldría cortado.
   * - Signo: netos con signo (D - H). + → (D), - → (C).
   * - Display SIEMPRE en positivo (Math.abs); la dirección (D/C) la indica
   *   el campo `naturaleza` de la cuenta, no el signo.
   *
   * Filtros opcionales: anio, periodo, descripcion (parcial, de la cuenta).
   */
  async findAllMovcta(
    empresaId: number,
    filtros?: { anio?: number; periodo?: number; descripcion?: string },
  ) {
    // 1. Movimientos del año. OJO: NO se filtra `periodo` a nivel SQL porque
    //    el acumulado necesita los períodos anteriores; se filtra al final.
    const where: any = { empresaId };
    if (filtros?.anio != null && !isNaN(filtros.anio)) where.anio = filtros.anio;

    const movimientos = await this.movctaRepo.find({
      where: where as unknown as FindOptionsWhere<Coctamov>,
      // Orden ASC obligatorio: es el orden de encadenamiento del acumulado.
      order: { ctacontable: 'ASC', anio: 'ASC', periodo: 'ASC' } as any,
    });

    if (movimientos.length === 0) return [];

    // 2. Mapa ctacontable → { descripcion, naturaleza }
    const cuentas = await this.ctacontablesRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<Coctacontables>,
    });
    const ctaMap = new Map(cuentas.map(c => [c.ctacontable, { descripcion: c.descripcion || '', naturaleza: c.naturaleza || 'D' }]));

    // 3. Saldo al cierre del año anterior por "ctacontable-anio"
    const saldos = await this.saldosctaRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<Coctasaldos>,
    });
    const antMap = new Map<string, number>();
    for (const s of saldos) {
      antMap.set(`${s.ctacontable}-${s.anio}`, Number(s.saldoanterior) || 0);
    }

    // 4. Encadenar el acumulado por cuenta + año (movimientos ya vienen ordenados)
    const acumMap = new Map<string, number>();
    const enriquecidos = movimientos.map(mov => {
      const grupo = `${mov.ctacontable}-${mov.anio}`;
      const debe = Number(mov.debe) || 0;
      const haber = Number(mov.haber) || 0;
      const neto = debe - haber;

      // Base del grupo: primer movimiento del año → saldoanterior; si no, lo
      // que se haya acumulado hasta el período anterior.
      const sacum = acumMap.has(grupo)
        ? (acumMap.get(grupo) as number)
        : (antMap.get(grupo) ?? 0);

      const saldo = sacum + neto;
      acumMap.set(grupo, saldo);

      const info = ctaMap.get(mov.ctacontable);
      const naturaleza = info?.naturaleza || 'D';

      return {
        movctascontablesId: mov.movctascontablesId,
        monedaId: mov.monedaId,
        ctacontable: mov.ctacontable,
        descripcion: info?.descripcion || '',
        naturaleza,
        anio: mov.anio,
        periodo: mov.periodo,
        // Con signo a propósito: el lado (C)/(D) lo decide el frontend con
        // saldoTexto(). |x| acá rompería el sufijo contable en la lista.
        sacum,
        debe,
        haber,
        saldo,
        fecultmov: mov.fecultmov,
        ultnropda: mov.ultnropda,
        empresaId: mov.empresaId,
        usuarioCreated: mov.usuarioCreated,
      };
    });

    let resultado = enriquecidos;

    // 5. Filtro por período (después de encadenar)
    if (filtros?.periodo != null && !isNaN(filtros.periodo)) {
      resultado = resultado.filter(r => r.periodo === filtros.periodo);
    }

    // 6. Filtro por descripcion de cuenta (parcial, sin distinción de mayúsculas)
    if (filtros?.descripcion && filtros.descripcion.trim()) {
      const d = filtros.descripcion.trim().toLowerCase();
      resultado = resultado.filter(r => (r.descripcion || '').toLowerCase().includes(d));
    }

    return resultado;
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

  /**
   * Reclasificación masiva de cuenta contable:
   * Cambia TODAS las referencias de ctacontableAnterior → ctacontableNueva
   * en 6 tablas: copdadet, coctamov, cocierredet, coctasaldos,
   * tcoplantillapdadet, tcoplantillabalancesdet.
   * 
   * PRIMERO verifica que la cuenta destino exista en coctacontables.
   */
  async reclasificarCuenta(
    ctacontableAnterior: string,
    ctacontableNueva: string,
    empresaId: number,
    currentUser: string,
  ) {
    // 0. Verificar que la cuenta destino exista
    const ctaDestino = await this.ctacontablesRepo.findOne({
      where: { ctacontable: ctacontableNueva } as unknown as FindOptionsWhere<Coctacontables>,
    });
    if (!ctaDestino) {
      throw new BadRequestException(
        `La cuenta destino ${ctacontableNueva} no existe en el plan de cuentas. Créela primero.`
      );
    }

    // 1. Verificar que la cuenta origen exista
    const ctaOrigen = await this.ctacontablesRepo.findOne({
      where: { ctacontable: ctacontableAnterior } as unknown as FindOptionsWhere<Coctacontables>,
    });
    if (!ctaOrigen) {
      throw new BadRequestException(`La cuenta origen ${ctacontableAnterior} no existe.`);
    }

    // 2. Verificar que haya datos con la cuenta origen
    const countCopdadet = await this.copdadetRepo
      .createQueryBuilder('d').where('d.ctacontable = :cta', { cta: ctacontableAnterior }).getCount();
    const countMovcta = await this.movctaRepo
      .createQueryBuilder('m').where('m.ctacontable = :cta', { cta: ctacontableAnterior }).getCount();
    const countCierres = await this.cierredetRepo
      .createQueryBuilder('c').where('c.ctacontable = :cta', { cta: ctacontableAnterior }).getCount();
    const countSaldos = await this.saldosctaRepo
      .createQueryBuilder('s').where('s.ctacontable = :cta', { cta: ctacontableAnterior }).getCount();
    const countPlantPda = await this.plantillapdadetRepo
      .createQueryBuilder('p').where('p.ctacontable = :cta', { cta: ctacontableAnterior }).getCount();
    const countPlantBal = await this.plantillabalancesdetRepo
      .createQueryBuilder('b').where('b.ctacontable = :cta', { cta: ctacontableAnterior }).getCount();

    const totalRegistros = countCopdadet + countMovcta + countCierres + countSaldos + countPlantPda + countPlantBal;
    if (totalRegistros === 0) {
      throw new BadRequestException(`No se encontraron registros con la cuenta ${ctacontableAnterior}.`);
    }

    // 3. Ejecutar UPDATEs en las 6 tablas
    const resultados: Record<string, number> = {};

    // 3a. copdadet (detalle de partidas contables)
    const r1 = await this.copdadetRepo.createQueryBuilder()
      .update(Copdadet)
      .set({ ctacontable: ctacontableNueva } as any)
      .where('ctacontable = :cta', { cta: ctacontableAnterior })
      .execute();
    resultados['copdadet'] = r1.affected ?? 0;

    // 3b. coctamov (movimientos contables)
    const r2 = await this.movctaRepo.createQueryBuilder()
      .update(Coctamov)
      .set({ ctacontable: ctacontableNueva } as any)
      .where('ctacontable = :cta', { cta: ctacontableAnterior })
      .execute();
    resultados['coctamov'] = r2.affected ?? 0;

    // 3c. cocierredet (saldos de cierre)
    const r3 = await this.cierredetRepo.createQueryBuilder()
      .update(Cocierredet)
      .set({ ctacontable: ctacontableNueva } as any)
      .where('ctacontable = :cta', { cta: ctacontableAnterior })
      .execute();
    resultados['cocierredet'] = r3.affected ?? 0;

    // 3d. coctasaldos (saldos de cuenta mensuales)
    const r4 = await this.saldosctaRepo.createQueryBuilder()
      .update(Coctasaldos)
      .set({ ctacontable: ctacontableNueva } as any)
      .where('ctacontable = :cta', { cta: ctacontableAnterior })
      .execute();
    resultados['coctasaldos'] = r4.affected ?? 0;

    // 3e. tcoplantillapdadet (plantilla partida detalle)
    const r5 = await this.plantillapdadetRepo.createQueryBuilder()
      .update(Tcoplantillapdadet)
      .set({ ctacontable: ctacontableNueva } as any)
      .where('ctacontable = :cta', { cta: ctacontableAnterior })
      .execute();
    resultados['tcoplantillapdadet'] = r5.affected ?? 0;

    // 3f. tcoplantillabalancesdet (plantilla balances detalle)
    const r6 = await this.plantillabalancesdetRepo.createQueryBuilder()
      .update(Tcoplantillabalancesdet)
      .set({ ctacontable: ctacontableNueva } as any)
      .where('ctacontable = :cta', { cta: ctacontableAnterior })
      .execute();
    resultados['tcoplantillabalancesdet'] = r6.affected ?? 0;

    // 4. Resumen
    const totalAfectados = Object.values(resultados).reduce((s, v) => s + v, 0);

    return {
      message: `Cuenta ${ctacontableAnterior} reclasificada a ${ctacontableNueva} exitosamente`,
      cuentaOrigen: ctacontableAnterior,
      cuentaDestino: ctacontableNueva,
      registrosAfectados: resultados,
      totalRegistros: totalAfectados,
    };
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

  // ========== Carteras Contables ==========

  async findAllCarteras(empresaId: number) {
    return this.findAllByEmpresa(this.carterasRepo, empresaId);
  }

  async findCartera(tcocarteraId: number, empresaId: number) {
    return this.findOneById(this.carterasRepo, 'tcocarteraId', tcocarteraId, empresaId, 'Cartera');
  }

  async createCartera(dto: any, currentUser: string) {
    return this.createEntity(this.carterasRepo, dto, currentUser);
  }

  async updateCartera(tcocarteraId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.carterasRepo, 'tcocarteraId', tcocarteraId, empresaId, dto, currentUser, 'Cartera');
  }

  async removeCartera(tcocarteraId: number, empresaId: number) {
    return this.softDelete(this.carterasRepo, 'tcocarteraId', tcocarteraId, empresaId, 'Cartera');
  }

  // ========== ISR (Retención en la Fuente) ==========

  async findAllIsr(empresaId: number) {
    return this.findAllByEmpresa(this.isrRepo, empresaId);
  }

  async findIsr(tcoisrId: number, empresaId: number) {
    return this.findOneById(this.isrRepo, 'tcoisrId', tcoisrId, empresaId, 'ISR');
  }

  async createIsr(dto: any, currentUser: string) {
    return this.createEntity(this.isrRepo, dto, currentUser);
  }

  async updateIsr(tcoisrId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.isrRepo, 'tcoisrId', tcoisrId, empresaId, dto, currentUser, 'ISR');
  }

  async removeIsr(tcoisrId: number, empresaId: number) {
    return this.softDelete(this.isrRepo, 'tcoisrId', tcoisrId, empresaId, 'ISR');
  }
}
