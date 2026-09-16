import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { Tusuarios } from './entities/usuario.entity';
import { TusuariosModule } from './entities/usuarios-module.entity';
import { TusuarioMnuItem } from './entities/usuarios-mnuitem.entity';
import { TusuariosScripts } from './entities/usuarios-scripts.entity';
import { UsuarioModAuth } from './entities/usuario-modauth.entity';
import { Tmodulos } from '../modules/entities/modulo.entity';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { CreateUsuariosModuleDto, UpdateUsuariosModuleDto } from './dto/usuarios-module.dto';
import { CreateUsuarioMnuItemDto, UpdateUsuarioMnuItemDto, BulkCreateMnuItemsDto } from './dto/usuarios-mnuitem.dto';
import { CreateUsuariosScriptsDto, UpdateUsuariosScriptsDto } from './dto/usuarios-scripts.dto';
import { CreateUsuarioModAuthDto, UpdateUsuarioModAuthDto } from './dto/usuario-modauth.dto';

const SAFE_COLS: (keyof Tusuarios)[] = [
  'usuario', 'usuarioId', 'nombre', 'email', 'sn_activo',
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
    @InjectRepository(Tmodulos)
    private readonly modulosRepo: Repository<Tmodulos>,
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

  // ===== Usuarios =====

  async findAll(empresaId: number) {
    const users = await this.repo.find({
      where: { empresaId },
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

    const entity = this.repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    return this.repo.save(entity);
  }

  async update(usuario: string, empresaId: number, dto: UpdateUsuarioDto, currentUser: string) {
    const entity = await this.findOne(usuario, empresaId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.repo.save(entity);
  }

  // ===== UsuariosModule =====

  async findAllModules(empresaId: number) {
    return this.modRepo.find({ where: { empresaId }, order: { usuario: 'ASC' } });
  }

  async findModule(tusuariosmoduloId: number, empresaId: number) {
    return this.findOneById(this.modRepo, 'tusuariosmoduloId', tusuariosmoduloId, empresaId, 'UsuariosModule');
  }

  async createModule(dto: CreateUsuariosModuleDto, currentUser: string) {
    return this.createEntity(this.modRepo, dto, currentUser);
  }

  async updateModule(tusuariosmoduloId: number, empresaId: number, dto: UpdateUsuariosModuleDto, currentUser: string) {
    return this.updateEntity(this.modRepo, 'tusuariosmoduloId', tusuariosmoduloId, empresaId, dto, currentUser, 'UsuariosModule');
  }

  async removeModule(tusuariosmoduloId: number, empresaId: number) {
    return this.softDelete(this.modRepo, 'tusuariosmoduloId', tusuariosmoduloId, empresaId, 'UsuariosModule');
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
}
