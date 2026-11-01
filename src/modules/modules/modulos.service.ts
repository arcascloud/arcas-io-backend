import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { RolesService } from '../users/roles.service';
import { Tmodulos } from './entities/modulo.entity';
import { CreateModuloDto, UpdateModuloDto } from './dto/modulo.dto';

@Injectable()
export class ModulosService {
  constructor(
    @InjectRepository(Tmodulos)
    private readonly repo: Repository<Tmodulos>,
    private readonly fechaSistema: FechaSistemaService,
    private readonly rolesService: RolesService,
  ) {}

  async findAll(empresaId: number) {
    return this.repo.find({
      where: { empresaId },
      order: { descripcion: 'ASC' },
    });
  }

  async findOne(moduloId: number, empresaId: number) {
    const found = await this.repo.findOne({ where: { moduloId, empresaId } });
    if (!found) throw new NotFoundException(`Módulo ${moduloId} no encontrado`);
    return found;
  }

  async create(dto: CreateModuloDto, currentUser: string) {
    const entity = this.repo.create({
      ...dto,
      // tmodulos.zorden es NOT NULL en la BD sin default; TypeORM emite DEFAULT → ER_NO_DEFAULT_FOR_FIELD
      zorden: 0,
      usuarioCreated: currentUser,
    });
    return this.repo.save(entity);
  }

  async update(moduloId: number, empresaId: number, dto: UpdateModuloDto, currentUser: string) {
    const entity = await this.findOne(moduloId, empresaId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
    });
    return this.repo.save(entity);
  }

  /**
   * Eliminar un módulo. Reglas:
   *  R1 — solo el rol `admin` puede eliminar.
   *  R2 — no se elimina si existe algún registro con ese `moduloId`
   *       (en cualquier tabla que tenga la columna).
   */
  async remove(moduloId: number, empresaId: number, currentUser: string) {
    if (!(await this.rolesService.esAdmin(currentUser, empresaId))) {
      throw new ForbiddenException('Solo un administrador puede eliminar módulos');
    }

    const modulo = await this.findOne(moduloId, empresaId);

    const usos = await this.contarUsos(moduloId);
    if (usos.total > 0) {
      throw new ConflictException(
        `No se puede eliminar el módulo "${modulo.descripcion}": tiene ${usos.total} registro(s) en ${usos.tablas}`,
      );
    }

    await this.repo.remove(modulo);
    return { eliminado: true, moduloId };
  }

  /** Cuenta los registros que referencian el módulo en todas las tablas que tienen `moduloId` */
  private async contarUsos(moduloId: number): Promise<{ total: number; tablas: string }> {
    const tablas: { TABLE_NAME: string }[] = await this.repo.manager.query(
      `SELECT TABLE_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'moduloId' AND TABLE_NAME <> 'tmodulos'
        ORDER BY TABLE_NAME`,
    );
    if (!tablas.length) return { total: 0, tablas: '' };

    const id = Number(moduloId);
    const union = tablas
      .map(
        (t) =>
          `SELECT '${t.TABLE_NAME}' AS tabla, COUNT(*) AS n FROM \`${t.TABLE_NAME}\` WHERE moduloId = ${id}`,
      )
      .join(' UNION ALL ');

    const res: { tabla: string; n: number | string }[] = await this.repo.manager.query(union);
    const conDatos = res.filter((r) => Number(r.n) > 0);
    return {
      total: conDatos.reduce((s, r) => s + Number(r.n), 0),
      tablas: conDatos.map((r) => `${r.tabla} (${Number(r.n)})`).join(', '),
    };
  }
}
