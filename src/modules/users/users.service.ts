import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral, IsNull } from 'typeorm';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { Tusuarios } from './entities/usuario.entity';
import { TusuariosModule } from './entities/usuarios-module.entity';
import { TusuarioMnuItem } from './entities/usuarios-mnuitem.entity';
import { TusuariosScripts } from './entities/usuarios-scripts.entity';
import { UsuarioModAuth } from './entities/usuario-modauth.entity';
import { TtipoRol } from './entities/ttipo-rol.entity';
import { TusuariosRol } from './entities/tusuarios-rol.entity';
import { TusuarioInfo } from './entities/usuario-info.entity';
import { Tmodulos } from '../modules/entities/modulo.entity';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { CreateUsuarioInfoDto, UpdateUsuarioInfoDto } from './dto/usuario-info.dto';
import { CreateUsuariosModuleDto, UpdateUsuariosModuleDto } from './dto/usuarios-module.dto';
import { CreateUsuarioMnuItemDto, UpdateUsuarioMnuItemDto, BulkCreateMnuItemsDto, ClonarMenuUsuarioDto } from './dto/usuarios-mnuitem.dto';
import { CreateUsuariosScriptsDto, UpdateUsuariosScriptsDto } from './dto/usuarios-scripts.dto';
import { CreateUsuarioModAuthDto, UpdateUsuarioModAuthDto } from './dto/usuario-modauth.dto';
import { CreateUsuarioRolDto, UpdateUsuarioRolDto } from './dto/usuario-rol.dto';

const SAFE_COLS: (keyof Tusuarios)[] = [
  'usuario', 'usuarioId', 'nombre', 'apellidos', 'email', 'sn_activo',
  'Idsucursal', 'empresaId', 'usuarioCreated', 'usuarioUpdated', 'fechaUpdated',
];

function safeUser(u: Tusuarios) {
  const out: any = {};
  for (const k of SAFE_COLS) out[k] = u[k];
  return out;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Tusuarios)
    private readonly repo: Repository<Tusuarios>,
    @InjectRepository(TusuariosModule)
    private readonly modRepo: Repository<TusuariosModule>,
    @InjectRepository(TusuarioMnuItem)
    private readonly mnuRepo: Repository<TusuarioMnuItem>,
    @InjectRepository(TusuariosScripts)
    private readonly scriptsRepo: Repository<TusuariosScripts>,
    @InjectRepository(UsuarioModAuth)
    private readonly authRepo: Repository<UsuarioModAuth>,
    @InjectRepository(TtipoRol)
    private readonly tipoRolRepo: Repository<TtipoRol>,
    @InjectRepository(TusuariosRol)
    private readonly rolRepo: Repository<TusuariosRol>,
    @InjectRepository(TusuarioInfo)
    private readonly infoRepo: Repository<TusuarioInfo>,
    @InjectRepository(Tmodulos)
    private readonly modulosRepo: Repository<Tmodulos>,
    private readonly fechaSistema: FechaSistemaService,
  ) {}

  // ===== Generic helpers =====

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
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
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

  // ===== Usuarios =====

  async findAll(empresaId: number) {
    const users = await this.repo.find({
      where: { empresaId },
      order: { usuario: 'ASC' },
    });
    return users.map(safeUser);
  }

  async findAllGlobal() {
    const users = await this.repo.find({
      order: { usuario: 'ASC' },
    });
    return users.map(safeUser);
  }

  async findOne(usuario: string, empresaId: number) {
    const found = await this.repo.findOne({ where: { usuario, empresaId } });
    if (!found) throw new NotFoundException(`Usuario ${usuario} no encontrado`);
    return safeUser(found);
  }

  async create(dto: CreateUsuarioDto, currentUser: string) {
    const exists = await this.repo.findOne({
      where: { usuario: dto.usuario },
    });
    if (exists) throw new ConflictException(`Usuario ${dto.usuario} ya existe`);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const entity = this.repo.create({
      ...dto,
      password: hashedPassword,
      usuarioCreated: currentUser,
    });
    return this.repo.save(entity);
  }

  async update(usuario: string, empresaId: number, dto: UpdateUsuarioDto, currentUser: string) {
    const entity = await this.findOne(usuario, empresaId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
    });
    return this.repo.save(entity);
  }

  // ===== UsuariosModule =====

  /**
   * Usuario plantilla del que se clonan los items de menú (tusuariomnuitem).
   * El menú del admin es la fuente de verdad; los demás usuarios reciben copias.
   */
  private static readonly USUARIO_PLANTILLA = 'admin';

  async findAllModules(empresaId: number) {
    return this.modRepo.find({ where: { empresaId }, order: { usuario: 'ASC' } });
  }

  async findModule(tusuariosmoduloId: number, empresaId: number) {
    return this.findOneById(this.modRepo, 'tusuariosmoduloId', tusuariosmoduloId, empresaId, 'UsuariosModule');
  }

  async createModule(dto: CreateUsuariosModuleDto, currentUser: string) {
    // FK fk_tusuariosmodule_usuario → validar existencia (evitar 500 por constraint)
    const usuario = await this.repo.findOne({ where: { usuario: dto.usuario } });
    if (!usuario) {
      throw new BadRequestException(`El usuario "${dto.usuario}" no existe en el sistema`);
    }

    const modulo = await this.modulosRepo.findOne({
      where: { moduloId: dto.moduloId, empresaId: dto.empresaId },
    });
    if (!modulo) {
      throw new BadRequestException(`El módulo ${dto.moduloId} no existe para la empresa ${dto.empresaId}`);
    }

    const dup = await this.modRepo.findOne({
      where: { empresaId: dto.empresaId, usuario: dto.usuario, moduloId: dto.moduloId },
    });
    if (dup) {
      throw new ConflictException(`El usuario "${dto.usuario}" ya tiene asignado el módulo "${modulo.descripcion}"`);
    }

    const creado = await this.createEntity(this.modRepo, dto, currentUser);

    // Clonar menú del admin → usuario (la asignación ya existente no se modifica)
    let itemsClonados = 0;
    if (dto.usuario !== UsersService.USUARIO_PLANTILLA) {
      try {
        itemsClonados = await this.clonarMnuItemsDesdePlantilla(
          dto.empresaId,
          [dto.moduloId],
          dto.usuario,
          currentUser,
        );
      } catch (e) {
        // La asignación se creó; un fallo en el clonado no debe tirarse abajo el POST
        console.error('[users.createModule] error clonando tusuariomnuitem:', e);
      }
    }

    return { ...creado, itemsClonados };
  }

  /**
   * Clona hacia `usuario` los items de menú de la plantilla (admin) para TODOS
   * los módulos que tiene asignados y que aún no tiene en tusuariomnuitem.
   * Rellena huecos: no borra ni duplica. Endpoint manual desde la pantalla de items de menú.
   */
  async clonarMenuUsuario(dto: ClonarMenuUsuarioDto, currentUser: string) {
    if (dto.usuario === UsersService.USUARIO_PLANTILLA) {
      throw new BadRequestException(
        `"${UsersService.USUARIO_PLANTILLA}" es la plantilla de menú; no se clona sobre sí mismo`,
      );
    }

    const usuario = await this.repo.findOne({ where: { usuario: dto.usuario } });
    if (!usuario) {
      throw new BadRequestException(`El usuario "${dto.usuario}" no existe en el sistema`);
    }

    const asignados = await this.modRepo.find({
      where: { empresaId: dto.empresaId, usuario: dto.usuario },
    });
    const moduloIds = [...new Set(asignados.map((a) => a.moduloId))];
    if (!moduloIds.length) {
      throw new BadRequestException(
        `El usuario "${dto.usuario}" no tiene módulos asignados; asígnele módulos primero`,
      );
    }

    const itemsClonados = await this.clonarMnuItemsDesdePlantilla(
      dto.empresaId,
      moduloIds,
      dto.usuario,
      currentUser,
    );

    return { usuario: dto.usuario, modulosProcesados: moduloIds.length, itemsClonados };
  }

  /**
   * Clona los items de menú (tusuariomnuitem) desde la plantilla del admin hacia
   * el usuario indicado, correspondientes a los módulos recibidos (`moduloIds`),
   * más la raíz (levelId 1) si el usuario aún no tiene ninguna. Idempotente y no
   * destructivo: nunca borra, nunca duplica (solo rellena huecos).
   *
   * Reglas de remapeo (verificado contra datos reales de admin):
   * - `parent` = self-ref (id propio de la fila)
   * - `parentId` = jerarquía real (raíz se auto-referencia; el resto apunta al padre)
   * - Se inserta ordenado por levelId ASC (padres primero) con mapa id plantilla → id destino
   *
   * @returns cantidad de items clonados
   */
  private async clonarMnuItemsDesdePlantilla(
    empresaId: number,
    moduloIds: number[],
    usuario: string,
    usuarioCreated: string,
  ): Promise<number> {
    const plantilla = await this.mnuRepo.find({
      where: { empresaId, usuario: UsersService.USUARIO_PLANTILLA },
      order: { levelId: 'ASC', zorden: 'ASC' },
    });
    if (!plantilla.length || !moduloIds.length) return 0;

    const existentes = await this.mnuRepo.find({ where: { empresaId, usuario } });
    const raizPropia = existentes.find((e) => e.levelId === 1);
    // Módulos que ya tienen items propios (excluye la raíz: tiene moduloId 9 pero no cuenta)
    const modsConItems = new Set(existentes.filter((e) => e.levelId > 1).map((e) => e.moduloId));

    const raizPlantilla = plantilla.find((f) => f.levelId === 1);

    // Filas a clonar: raíz si falta + filas de cada módulo pendiente sin items propios
    const pendientes = new Set(moduloIds.filter((m) => !modsConItems.has(m)));
    const aCopiar: TusuarioMnuItem[] = [];
    if (!raizPropia && raizPlantilla) aCopiar.push(raizPlantilla);
    if (pendientes.size) {
      for (const f of plantilla) {
        if (f.levelId !== 1 && pendientes.has(f.moduloId)) aCopiar.push(f);
      }
    }
    if (!aCopiar.length) return 0;

    // Mapa id plantilla → id destino (sembrar con la raíz existente propia)
    const idMap = new Map<number, number>();
    if (raizPlantilla && raizPropia) {
      idMap.set(raizPlantilla.tusuariomnuitemsId, raizPropia.tusuariomnuitemsId);
    }

    aCopiar.sort((a, b) => a.levelId - b.levelId || a.zorden - b.zorden);

    let clonados = 0;
    for (const f of aCopiar) {
      const nueva = this.mnuRepo.create({
        empresaId,
        moduloId: f.moduloId,
        usuario,
        parent: 0,
        parentId: 0,
        levelId: f.levelId,
        nameParent: f.nameParent,
        nameItem: f.nameItem,
        labelItem: f.labelItem,
        iconItem: f.iconItem,
        routerLink: f.routerLink,
        sn_activo: f.sn_activo,
        zorden: f.zorden,
        usuarioCreated,
      });
      const guardada = await this.mnuRepo.save(nueva);
      const nuevoId = guardada.tusuariomnuitemsId;
      idMap.set(f.tusuariomnuitemsId, nuevoId);

      // `parent` self-ref + `parentId` jerárquico remapeado al id ya generado
      guardada.parent = nuevoId;
      guardada.parentId = f.levelId === 1 ? nuevoId : idMap.get(f.parentId) ?? nuevoId;
      await this.mnuRepo.save(guardada);
      clonados++;
    }

    return clonados;
  }

  async updateModule(tusuariosmoduloId: number, empresaId: number, dto: UpdateUsuariosModuleDto, currentUser: string) {
    return this.updateEntity(this.modRepo, 'tusuariosmoduloId', tusuariosmoduloId, empresaId, dto, currentUser, 'UsuariosModule');
  }

  async removeModule(tusuariosmoduloId: number, empresaId: number) {
    // Hard delete: la fila se elimina de verdad (softDelete solo pondría sn_activo='N'
    // y findAllModules no filtra por ese campo, así que seguiría apareciendo)
    const entity = await this.findOneById(
      this.modRepo,
      'tusuariosmoduloId',
      tusuariosmoduloId,
      empresaId,
      'UsuariosModule',
    );

    // Ciclo de vida del menú: al quitar el módulo también se eliminan los
    // tusuariomnuitem del usuario para ESE módulo (hard delete, para que una
    // re-asignación posterior vuelva a clonar los items desde la plantilla).
    // Se borra ANTES de la asignación: si falla, no se pierde nada (se reintenta).
    // La plantilla (admin) nunca se toca: es la fuente del clonado.
    let itemsEliminados = 0;
    if (entity.usuario !== UsersService.USUARIO_PLANTILLA) {
      const del = await this.mnuRepo
        .createQueryBuilder()
        .delete()
        .where('empresaId = :empresaId', { empresaId })
        .andWhere('usuario = :usuario', { usuario: entity.usuario })
        .andWhere('moduloId = :moduloId', { moduloId: entity.moduloId })
        .execute();
      itemsEliminados = del.affected ?? 0;
    }

    await this.modRepo.remove(entity);
    return { tusuariosmoduloId, eliminado: true, itemsEliminados };
  }

  // ===== UsuarioMnuItem =====

  async findAllMnuItems(empresaId: number, usuario?: string) {
    const qb = this.mnuRepo.createQueryBuilder('m')
      .leftJoin(Tmodulos, 'mod', 'mod.moduloId = m.moduloId AND mod.empresaId = m.empresaId')
      .select([
        'm.tusuariomnuitemsId AS tusuariomnuitemsId',
        'm.empresaId AS empresaId',
        'm.moduloId AS moduloId',
        'm.usuario AS usuario',
        'm.parent AS parent',
        'm.parentId AS parentId',
        'm.levelId AS levelId',
        'm.nameParent AS nameParent',
        'm.nameItem AS nameItem',
        'm.labelItem AS labelItem',
        'm.iconItem AS iconItem',
        'm.routerLink AS routerLink',
        'm.sn_activo AS sn_activo',
        'm.zorden AS zordenItem',
      ])
      .addSelect('COALESCE(mod.zorden, 0)', 'zordenMod')
      .where('m.empresaId = :empresaId', { empresaId })
      .orderBy('m.levelId', 'ASC');

    if (usuario) {
      qb.andWhere('m.usuario = :usuario', { usuario });
    }

    return qb.getRawMany();
  }

  async findMnuItem(tusuariomnuitemsId: number, empresaId: number) {
    return this.findOneById(this.mnuRepo, 'tusuariomnuitemsId', tusuariomnuitemsId, empresaId, 'UsuarioMnuItem');
  }

  async createMnuItem(dto: CreateUsuarioMnuItemDto, currentUser: string) {
    return this.createEntity(this.mnuRepo, dto, currentUser);
  }

  async updateMnuItem(tusuariomnuitemsId: number, empresaId: number, dto: UpdateUsuarioMnuItemDto, currentUser: string) {
    return this.updateEntity(this.mnuRepo, 'tusuariomnuitemsId', tusuariomnuitemsId, empresaId, dto, currentUser, 'UsuarioMnuItem');
  }

  async removeMnuItem(tusuariomnuitemsId: number, empresaId: number) {
    return this.softDelete(this.mnuRepo, 'tusuariomnuitemsId', tusuariomnuitemsId, empresaId, 'UsuarioMnuItem');
  }

  /**
   * Bulk import menu items from CSV data.
   * Maps csvId → generated tusuariomnuitemsId for parent relationships.
   */
  async bulkCreateMnuItems(dto: BulkCreateMnuItemsDto, currentUser: string) {
    // 1. Delete existing menu items for this user+empresa
    await this.mnuRepo
      .createQueryBuilder()
      .delete()
      .where('empresaId = :empresaId AND usuario = :usuario', {
        empresaId: dto.empresaId,
        usuario: dto.usuario,
      })
      .execute();

    // 2. Sort items by levelId (parents first)
    const sorted = [...dto.items].sort((a, b) => a.levelId - b.levelId || a.csvId - b.csvId);

    // 3. Insert sequentially, mapping csvId → generated ID
    const idMap = new Map<number, number>(); // csvId → DB ID
    const created: TusuarioMnuItem[] = [];

    for (const item of sorted) {
      const parentCsvId = item.parentId === item.csvId ? 0 : item.parentId;
      const parentDbId = idMap.get(parentCsvId) ?? 0;

      const entity = this.mnuRepo.create({
        empresaId: dto.empresaId,
        moduloId: dto.moduloId,
        usuario: dto.usuario,
        parent: parentDbId,
        parentId: item.parentId,
        levelId: item.levelId,
        nameParent: item.nameParent,
        nameItem: item.nameItem,
        labelItem: item.labelItem,
        iconItem: item.iconItem ?? '',
        routerLink: item.routerLink ?? '',
        sn_activo: 'S',
        usuarioCreated: currentUser,
      });

      const saved = await this.mnuRepo.save(entity);
      idMap.set(item.csvId, saved.tusuariomnuitemsId);
      created.push(saved);
    }

    return { count: created.length, items: created };
  }

  // ===== UsuariosScripts =====

  async findAllScripts(empresaId: number) {
    return this.scriptsRepo.find({ where: { empresaId }, order: { usuario: 'ASC' } });
  }

  async findScript(tusuarioscriptsId: number, empresaId: number) {
    return this.findOneById(this.scriptsRepo, 'tusuarioscriptsId', tusuarioscriptsId, empresaId, 'UsuariosScripts');
  }

  async createScript(dto: CreateUsuariosScriptsDto, currentUser: string) {
    return this.createEntity(this.scriptsRepo, dto, currentUser);
  }

  async updateScript(tusuarioscriptsId: number, empresaId: number, dto: UpdateUsuariosScriptsDto, currentUser: string) {
    return this.updateEntity(this.scriptsRepo, 'tusuarioscriptsId', tusuarioscriptsId, empresaId, dto, currentUser, 'UsuariosScripts');
  }

  async removeScript(tusuarioscriptsId: number, empresaId: number) {
    const entity = await this.findOneById(this.scriptsRepo, 'tusuarioscriptsId', tusuarioscriptsId, empresaId, 'UsuariosScripts');
    return this.scriptsRepo.remove(entity);
  }

  // ===== UsuarioModAuth =====

  async findAllModAuth(empresaId: number) {
    return this.authRepo.find({ where: { empresaId }, order: { usuario: 'ASC' } });
  }

  async findModAuth(usuariomodauthId: number, empresaId: number) {
    return this.findOneById(this.authRepo, 'usuariomodauthId', usuariomodauthId, empresaId, 'UsuarioModAuth');
  }

  async createModAuth(dto: CreateUsuarioModAuthDto, currentUser: string) {
    return this.createEntity(this.authRepo, dto, currentUser);
  }

  async updateModAuth(usuariomodauthId: number, empresaId: number, dto: UpdateUsuarioModAuthDto, currentUser: string) {
    return this.updateEntity(this.authRepo, 'usuariomodauthId', usuariomodauthId, empresaId, dto, currentUser, 'UsuarioModAuth');
  }

  async removeModAuth(usuariomodauthId: number, empresaId: number) {
    const entity = await this.findOneById(this.authRepo, 'usuariomodauthId', usuariomodauthId, empresaId, 'UsuarioModAuth');
    return this.authRepo.remove(entity);
  }

  // ===== Roles de usuario (tusuarios_rol) =====

  /** Lista de asignaciones de rol de la empresa, enriquecida con el nombre del usuario */
  async findAllRoles(empresaId: number) {
    const filas = await this.rolRepo.find({ where: { empresaId }, order: { usuarioId: 'ASC', rol: 'ASC' } });
    const usuarios = await this.repo.find({ where: { empresaId }, order: { usuario: 'ASC' } });
    const mapa = new Map(usuarios.map((u) => [u.usuarioId, u]));
    return filas.map((f) => ({
      ...f,
      nombreUsuario: mapa.get(f.usuarioId)?.nombre ?? '',
      loginUsuario: mapa.get(f.usuarioId)?.usuario ?? '',
    }));
  }

  async findRole(rol_id: number, empresaId: number) {
    return this.findOneById(this.rolRepo, 'rol_id', rol_id, empresaId, 'Rol de usuario');
  }

  /** Catálogo de roles disponibles (ttipo_rol), incluye los globales (empresaId NULL) */
  async findAllTiposRol(empresaId: number) {
    return this.tipoRolRepo.find({
      where: [{ empresaId }, { empresaId: IsNull() }] as unknown as FindOptionsWhere<TtipoRol>[],
      order: { rol: 'ASC' },
    });
  }

  async createRole(dto: CreateUsuarioRolDto, currentUser: string) {
    await this.validarRole(dto.usuarioId, dto.rol, dto.empresaId);
    const entity = this.rolRepo.create({
      ...dto,
      usuarioCreated: currentUser,
      fechaCreated: await this.fechaSistema.getFecha(dto.empresaId),
    });
    return this.rolRepo.save(entity);
  }

  async updateRole(rol_id: number, empresaId: number, dto: UpdateUsuarioRolDto, currentUser: string) {
    const actual = await this.findRole(rol_id, empresaId);
    const usuarioId = dto.usuarioId ?? actual.usuarioId;
    const rol = dto.rol ?? actual.rol;
    await this.validarRole(usuarioId, rol, actual.empresaId, rol_id);
    Object.assign(actual, { usuarioId, rol }, {
      usuarioUpdated: currentUser,
      fechaUpdate: await this.fechaSistema.getFecha(actual.empresaId),
    });
    return this.rolRepo.save(actual);
  }

  async removeRole(rol_id: number, empresaId: number) {
    const entity = await this.findRole(rol_id, empresaId);
    return this.rolRepo.remove(entity);
  }

  /**
   * Valida asignación de rol: usuario existente, rol en catálogo (ttipo_rol)
   * y unicidad (usuarioId + rol) según UNIQUE KEY `usuarioId_rol`.
   */
  private async validarRole(usuarioId: number, rol: string, empresaId: number, excludeId?: number) {
    const user = await this.repo.findOne({ where: { usuarioId } });
    if (!user) throw new NotFoundException(`Usuario ${usuarioId} no encontrado`);

    const tipo = await this.tipoRolRepo.findOne({ where: { rol } });
    if (!tipo) throw new BadRequestException(`El rol "${rol}" no existe en el catálogo de roles (ttipo_rol)`);

    const dup = await this.rolRepo.findOne({ where: { usuarioId, rol } });
    if (dup && dup.rol_id !== excludeId) {
      throw new ConflictException(`El usuario "${user.usuario}" ya tiene asignado el rol "${rol}"`);
    }
    // empresaId referenciada válida (FK FK_tusuarios_rol_tempresas)
    if (!empresaId) throw new BadRequestException('empresaId es requerido');
  }

  // ===== Info extendida del usuario (tusuariosinfoinfo) =====

  /**
   * La tabla NO tiene `empresaId`: el scoping por empresa se resuelve
   * uniéndola con `tusuarios` (FK lógica `usuarioId`).
   */
  private scopedInfo(empresaId: number) {
    return this.infoRepo
      .createQueryBuilder('i')
      .innerJoin(Tusuarios, 'u', 'u.usuarioId = i.usuarioId AND u.empresaId = :empresaId', { empresaId });
  }

  async findAllInfo(empresaId: number) {
    const rows = await this.scopedInfo(empresaId)
      .select([
        'i.usuarioId AS "usuarioId"',
        'i.usuario AS "usuario"',
        'i.nrodocumento AS "nrodocumento"',
        'i.fecnac AS "fecnac"',
        'i.tipodoc AS "tipodoc"',
        'i.sn_cliente AS "sn_cliente"',
        'i.sexo AS "sexo"',
        'i.pais AS "pais"',
        'i.departamento AS "departamento"',
        'i.ciudad AS "ciudad"',
        'i.direccion AS "direccion"',
        'i.telefono AS "telefono"',
        'i.empleadoId AS "empleadoId"',
        'i.usuarioCreated AS "usuarioCreated"',
        'i.fechaCreated AS "fechaCreated"',
        'i.usuarioUpdated AS "usuarioUpdated"',
        'i.fechaUpdated AS "fechaUpdated"',
        'u.nombre AS "nombre"',
        'u.apellidos AS "apellidos"',
        'u.email AS "email"',
        'u.sn_activo AS "sn_activo"',
      ])
      .orderBy('u.apellidos', 'ASC')
      .addOrderBy('u.nombre', 'ASC')
      .getRawMany();
    return rows;
  }

  /** Trae la fila de info solo si el usuario pertenece a la empresa indicada. */
  private async findInfoScoped(usuarioId: number, empresaId: number) {
    const row = await this.scopedInfo(empresaId)
      .andWhere('i.usuarioId = :usuarioId', { usuarioId })
      .getOne();
    if (!row) {
      // ¿existe pero de otra empresa, o no existe?
      const propio = await this.infoRepo.findOne({ where: { usuarioId } });
      if (propio) throw new NotFoundException(`Usuario ${usuarioId} no encontrado en esta empresa`);
      throw new NotFoundException(`Información del usuario ${usuarioId} no encontrada`);
    }
    return row;
  }

  async findInfo(usuarioId: number, empresaId: number) {
    return this.findInfoScoped(usuarioId, empresaId);
  }

  async createInfo(dto: CreateUsuarioInfoDto, currentUser: string) {
    // El usuario debe existir y pertenecer a la empresa
    const user = await this.repo.findOne({
      where: { usuarioId: dto.usuarioId, empresaId: dto.empresaId },
    });
    if (!user) throw new NotFoundException(`Usuario ${dto.usuarioId} no encontrado en la empresa ${dto.empresaId}`);

    // PK: 1 fila por usuario
    const existe = await this.infoRepo.findOne({ where: { usuarioId: dto.usuarioId } });
    if (existe) throw new ConflictException(`El usuario "${user.usuario}" ya tiene información registrada`);

    // UNIQUE KEY (tipodoc, nrodocumento)
    const docDup = await this.infoRepo.findOne({
      where: { tipodoc: dto.tipodoc ?? 'D', nrodocumento: dto.nrodocumento },
    });
    if (docDup) {
      throw new ConflictException(`El documento ${dto.nrodocumento} ya está registrado (tipodoc ${dto.tipodoc ?? 'D'})`);
    }

    const { empresaId, ...data } = dto;
    const entity = this.infoRepo.create({
      ...data,
      usuario: user.usuario, // denormalizado desde tusuarios
      tipodoc: dto.tipodoc ?? 'D',
      sn_cliente: dto.sn_cliente ?? 'N',
      sexo: dto.sexo ?? 'M',
      fecnac: dto.fecnac ? new Date(dto.fecnac) : null,
      empleadoId: dto.empleadoId ?? null,
      usuarioCreated: currentUser,
      fechaCreated: await this.fechaSistema.getFecha(empresaId),
    });
    return this.infoRepo.save(entity);
  }

  async updateInfo(usuarioId: number, empresaId: number, dto: UpdateUsuarioInfoDto, currentUser: string) {
    const actual = await this.findInfoScoped(usuarioId, empresaId);

    // UNIQUE KEY (tipodoc, nrodocumento) — excluyendo la propia fila
    if (dto.nrodocumento !== undefined || dto.tipodoc !== undefined) {
      const tipodoc = dto.tipodoc ?? actual.tipodoc;
      const nrodocumento = dto.nrodocumento ?? actual.nrodocumento;
      const docDup = await this.infoRepo.findOne({ where: { tipodoc, nrodocumento } });
      if (docDup && docDup.usuarioId !== usuarioId) {
        throw new ConflictException(`El documento ${nrodocumento} ya está registrado (tipodoc ${tipodoc})`);
      }
    }

    const { fecnac, ...resto } = dto;
    Object.assign(actual, resto, {
      ...(fecnac !== undefined ? { fecnac: fecnac ? new Date(fecnac) : null } : {}),
      usuarioUpdated: currentUser,
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
    });
    return this.infoRepo.save(actual);
  }

  async removeInfo(usuarioId: number, empresaId: number) {
    const entity = await this.findInfoScoped(usuarioId, empresaId);
    return this.infoRepo.remove(entity); // la tabla no tiene sn_activo: hard delete
  }

  async cambiarPassword(usuario: string, empresaId: number, passwordNueva: string, currentUser: string) {
    const entity = await this.findOne(usuario, empresaId);
    if (!entity) throw new NotFoundException('Usuario no encontrado');
    if (!passwordNueva || passwordNueva.trim().length < 4) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 4 caracteres');
    }
    entity.password = await bcrypt.hash(passwordNueva, 10);
    entity.usuarioUpdated = currentUser;
    entity.fechaUpdated = await this.fechaSistema.getFecha(empresaId);
    await this.repo.save(entity);
    return { ok: true, mensaje: 'Contraseña actualizada exitosamente' };
  }
}
