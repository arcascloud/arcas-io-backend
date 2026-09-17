import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { PlPlEmpleados } from './entities/plplempleados.entity';
import { PlEtits } from './entities/pletitulaciones.entity';
import { PlAsistencia } from './entities/pleasistencia.entity';
import { PlCertificaciones } from './entities/plecertificaciones.entity';
import { PlComisiones } from './entities/plecomisiones.entity';
import { PlDeducciones } from './entities/plededucciones.entity';
import { PlPlaMae } from './entities/pleplamae.entity';
import { PlPlaDet } from './entities/plepladet.entity';
import { TplPuestos } from './entities/tplpuestos.entity';
import { TplProfesiones } from './entities/tplprofesiones.entity';
import { TplDeducciones } from './entities/tpldeducciones.entity';
import { TplIngresos } from './entities/tplingresos.entity';
import { CreatePlEmpleadosDto, UpdatePlEmpleadosDto } from './dto/plplempleados.dto';
import { CreatePlPlaMaeDto, UpdatePlPlaMaeDto } from './dto/pleplamae.dto';
import { CreatePlPlaDetDto, UpdatePlPlaDetDto } from './dto/plepladet.dto';
import { CreateTplDeduccionesDto, UpdateTplDeduccionesDto } from './dto/tpldeducciones.dto';
import { CreateTplIngresosDto, UpdateTplIngresosDto } from './dto/tplingresos.dto';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';

@Injectable()
export class PlanillaService {
  constructor(
    @InjectRepository(PlPlEmpleados) private readonly empleadoRepo: Repository<PlPlEmpleados>,
    @InjectRepository(PlEtits) private readonly etitulacionRepo: Repository<PlEtits>,
    @InjectRepository(PlAsistencia) private readonly asistenciaRepo: Repository<PlAsistencia>,
    @InjectRepository(PlCertificaciones) private readonly certificacionRepo: Repository<PlCertificaciones>,
    @InjectRepository(PlComisiones) private readonly comisionRepo: Repository<PlComisiones>,
    @InjectRepository(PlDeducciones) private readonly deduccionEmpRepo: Repository<PlDeducciones>,
    @InjectRepository(PlPlaMae) private readonly plamaeRepo: Repository<PlPlaMae>,
    @InjectRepository(PlPlaDet) private readonly pladetRepo: Repository<PlPlaDet>,
    @InjectRepository(TplPuestos) private readonly puestoRepo: Repository<TplPuestos>,
    @InjectRepository(TplProfesiones) private readonly profesionRepo: Repository<TplProfesiones>,
    @InjectRepository(TplDeducciones) private readonly deduccionRepo: Repository<TplDeducciones>,
    @InjectRepository(TplIngresos) private readonly ingresoRepo: Repository<TplIngresos>,
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
    private readonly fechaSistema: FechaSistemaService,
  ) {}

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
    });
  }

  private async findAllByEmpresaOrder<T extends ObjectLiteral>(
    repo: Repository<T>,
    empresaId: number,
    orderField: string,
    direction: 'ASC' | 'DESC' = 'DESC',
  ) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
      order: { [orderField]: direction } as any,
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

  async findAllEmpleados(empresaId: number) {
    return this.findAllByEmpresa(this.empleadoRepo, empresaId);
  }

  async findEmpleado(empleadoId: number, empresaId: number) {
    return this.findOneById(this.empleadoRepo, 'empleadoId', empleadoId, empresaId, 'Empleado');
  }

  async createEmpleado(dto: CreatePlEmpleadosDto, currentUser: string) {
    // Auto-generar nroempleado desde ttipoparametros (moduloId=8)
    const getParam = async (field: string, def: any) => {
      try {
        const row = await this.tipoParametroRepo.findOne({
          where: { empresaId: dto.empresaId, moduloId: 8, field, sn_activo: 'S' } as any,
        });
        return row ? (row.tipo === 'NUMBER' ? Number(row.valor) : row.valor) : def;
      } catch { return def; }
    };

    const nroActual = await getParam('nroempleado', 0);
    const nro = Number(nroActual) + 1;
    const nroempleado = dto.nroempleado || String(nro).padStart(6, '0');

    const payload: any = {
      ...dto,
      nroempleado,
      dni: dto.dni || '0000000000000',
    };

    const saved = await this.createEntity(this.empleadoRepo, payload, currentUser);

    // Incrementar contador
    try {
      await this.tipoParametroRepo
        .createQueryBuilder()
        .update(TipoParametro)
        .set({ valor: String(nro) })
        .where('empresaId = :eid AND moduloId = 8 AND field = :field', { eid: dto.empresaId, field: 'nroempleado' })
        .execute();
    } catch (_) {}

    return saved;
  }

  async updateEmpleado(empleadoId: number, empresaId: number, dto: UpdatePlEmpleadosDto, currentUser: string) {
    return this.updateEntity(this.empleadoRepo, 'empleadoId', empleadoId, empresaId, dto, currentUser, 'Empleado');
  }

  async removeEmpleado(empleadoId: number, empresaId: number) {
    return this.softDelete(this.empleadoRepo, 'empleadoId', empleadoId, empresaId, 'Empleado');
  }

  async findAllTitulaciones(empresaId: number) {
    return this.findAllByEmpresa(this.etitulacionRepo, empresaId);
  }

  async findTitulacion(emptitulacionId: number, empresaId: number) {
    return this.findOneById(this.etitulacionRepo, 'emptitulacionId', emptitulacionId, empresaId, 'Titulacion');
  }

  async createTitulacion(dto: any, currentUser: string) {
    return this.createEntity(this.etitulacionRepo, dto, currentUser);
  }

  async updateTitulacion(emptitulacionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.etitulacionRepo, 'emptitulacionId', emptitulacionId, empresaId, dto, currentUser, 'Titulacion');
  }

  async removeTitulacion(emptitulacionId: number, empresaId: number) {
    return this.softDelete(this.etitulacionRepo, 'emptitulacionId', emptitulacionId, empresaId, 'Titulacion');
  }

  async findAllAsistencia(empresaId: number) {
    return this.findAllByEmpresaOrder(this.asistenciaRepo, empresaId, 'fecharegistro', 'DESC');
  }

  async findAsistencia(plempleadosasistenciaId: number, empresaId: number) {
    return this.findOneById(this.asistenciaRepo, 'plempleadosasistenciaId', plempleadosasistenciaId, empresaId, 'Asistencia');
  }

  async createAsistencia(dto: any, currentUser: string) {
    return this.createEntity(this.asistenciaRepo, dto, currentUser);
  }

  async updateAsistencia(plempleadosasistenciaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.asistenciaRepo, 'plempleadosasistenciaId', plempleadosasistenciaId, empresaId, dto, currentUser, 'Asistencia');
  }

  async findAllCertificaciones(empresaId: number) {
    return this.findAllByEmpresa(this.certificacionRepo, empresaId);
  }

  async findCertificacion(empcertificacionId: number, empresaId: number) {
    return this.findOneById(this.certificacionRepo, 'empcertificacionId', empcertificacionId, empresaId, 'Certificacion');
  }

  async createCertificacion(dto: any, currentUser: string) {
    return this.createEntity(this.certificacionRepo, dto, currentUser);
  }

  async updateCertificacion(empcertificacionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.certificacionRepo, 'empcertificacionId', empcertificacionId, empresaId, dto, currentUser, 'Certificacion');
  }

  async removeCertificacion(empcertificacionId: number, empresaId: number) {
    return this.softDelete(this.certificacionRepo, 'empcertificacionId', empcertificacionId, empresaId, 'Certificacion');
  }

  async findAllComisiones(empresaId: number) {
    return this.findAllByEmpresa(this.comisionRepo, empresaId);
  }

  async findComision(emplcomId: number, empresaId: number) {
    return this.findOneById(this.comisionRepo, 'emplcomId', emplcomId, empresaId, 'Comision');
  }

  async createComision(dto: any, currentUser: string) {
    return this.createEntity(this.comisionRepo, dto, currentUser);
  }

  async updateComision(emplcomId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.comisionRepo, 'emplcomId', emplcomId, empresaId, dto, currentUser, 'Comision');
  }

  async removeComision(emplcomId: number, empresaId: number) {
    return this.softDelete(this.comisionRepo, 'emplcomId', emplcomId, empresaId, 'Comision');
  }

  async findAllDeduccionesEmp(empresaId: number) {
    return this.findAllByEmpresa(this.deduccionEmpRepo, empresaId);
  }

  async findDeduccionEmp(empdeduccionId: number, empresaId: number) {
    return this.findOneById(this.deduccionEmpRepo, 'empdeduccionId', empdeduccionId, empresaId, 'Deduccion Empleado');
  }

  async createDeduccionEmp(dto: any, currentUser: string) {
    return this.createEntity(this.deduccionEmpRepo, dto, currentUser);
  }

  async updateDeduccionEmp(empdeduccionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.deduccionEmpRepo, 'empdeduccionId', empdeduccionId, empresaId, dto, currentUser, 'Deduccion Empleado');
  }

  async removeDeduccionEmp(empdeduccionId: number, empresaId: number) {
    return this.softDelete(this.deduccionEmpRepo, 'empdeduccionId', empdeduccionId, empresaId, 'Deduccion Empleado');
  }

  async findAllPlanillas(empresaId: number) {
    return this.findAllByEmpresaOrder(this.plamaeRepo, empresaId, 'fecharegistro', 'DESC');
  }

  async findPlanilla(planillaId: number, empresaId: number) {
    return this.findOneById(this.plamaeRepo, 'planillaId', planillaId, empresaId, 'Planilla');
  }

  async createPlanilla(dto: CreatePlPlaMaeDto, currentUser: string) {
    // Auto-generar nroplanilla desde ttipoparametros (moduloId=8)
    const getParam = async (field: string, def: any) => {
      try {
        const row = await this.tipoParametroRepo.findOne({
          where: { empresaId: dto.empresaId, moduloId: 8, field, sn_activo: 'S' } as any,
        });
        return row ? (row.tipo === 'NUMBER' ? Number(row.valor) : row.valor) : def;
      } catch { return def; }
    };

    const nroActual = await getParam('nroplanilla', 0);
    const nro = Number(nroActual) + 1;
    const nroplanilla = dto.nroplanilla || String(nro).padStart(6, '0');

    const payload: any = {
      ...dto,
      nroplanilla,
    };

    const saved = await this.createEntity(this.plamaeRepo, payload, currentUser);

    // Incrementar contador
    try {
      await this.tipoParametroRepo
        .createQueryBuilder()
        .update(TipoParametro)
        .set({ valor: String(nro) })
        .where('empresaId = :eid AND moduloId = 8 AND field = :field', { eid: dto.empresaId, field: 'nroplanilla' })
        .execute();
    } catch (_) {}

    return saved;
  }

  async updatePlanilla(planillaId: number, empresaId: number, dto: UpdatePlPlaMaeDto, currentUser: string) {
    return this.updateEntity(this.plamaeRepo, 'planillaId', planillaId, empresaId, dto, currentUser, 'Planilla');
  }

  async findAllPlanillaDet(empresaId: number) {
    return this.findAllByEmpresa(this.pladetRepo, empresaId);
  }

  async findPlanillaDet(plepladetId: number, empresaId: number) {
    return this.findOneById(this.pladetRepo, 'plepladetId', plepladetId, empresaId, 'Detalle Planilla');
  }

  async createPlanillaDet(dto: CreatePlPlaDetDto, currentUser: string) {
    return this.createEntity(this.pladetRepo, dto, currentUser);
  }

  async updatePlanillaDet(plepladetId: number, empresaId: number, dto: UpdatePlPlaDetDto, currentUser: string) {
    return this.updateEntity(this.pladetRepo, 'plepladetId', plepladetId, empresaId, dto, currentUser, 'Detalle Planilla');
  }

  async findAllPuestos(empresaId: number) {
    return this.findAllByEmpresa(this.puestoRepo, empresaId);
  }

  async findPuesto(puestosId: number, empresaId: number) {
    return this.findOneById(this.puestoRepo, 'puestosId', puestosId, empresaId, 'Puesto');
  }

  async createPuesto(dto: any, currentUser: string) {
    return this.createEntity(this.puestoRepo, dto, currentUser);
  }

  async updatePuesto(puestosId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.puestoRepo, 'puestosId', puestosId, empresaId, dto, currentUser, 'Puesto');
  }

  async findAllProfesiones(empresaId: number) {
    return this.findAllByEmpresa(this.profesionRepo, empresaId);
  }

  async findProfesion(profesionId: number, empresaId: number) {
    return this.findOneById(this.profesionRepo, 'profesionId', profesionId, empresaId, 'Profesion');
  }

  async createProfesion(dto: any, currentUser: string) {
    return this.createEntity(this.profesionRepo, dto, currentUser);
  }

  async updateProfesion(profesionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.profesionRepo, 'profesionId', profesionId, empresaId, dto, currentUser, 'Profesion');
  }

  async removeProfesion(profesionId: number, empresaId: number) {
    return this.softDelete(this.profesionRepo, 'profesionId', profesionId, empresaId, 'Profesion');
  }

  async findAllDeducciones(empresaId: number) {
    return this.findAllByEmpresa(this.deduccionRepo, empresaId);
  }

  async findDeduccion(deduccioneId: number, empresaId: number) {
    return this.findOneById(this.deduccionRepo, 'deduccioneId', deduccioneId, empresaId, 'Deduccion');
  }

  async createDeduccion(dto: CreateTplDeduccionesDto, currentUser: string) {
    return this.createEntity(this.deduccionRepo, dto, currentUser);
  }

  async updateDeduccion(deduccioneId: number, empresaId: number, dto: UpdateTplDeduccionesDto, currentUser: string) {
    return this.updateEntity(this.deduccionRepo, 'deduccioneId', deduccioneId, empresaId, dto, currentUser, 'Deduccion');
  }

  async removeDeduccion(deduccioneId: number, empresaId: number) {
    return this.softDelete(this.deduccionRepo, 'deduccioneId', deduccioneId, empresaId, 'Deduccion');
  }

  async findAllIngresos(empresaId: number) {
    return this.findAllByEmpresa(this.ingresoRepo, empresaId);
  }

  async findIngreso(tingresoId: number, empresaId: number) {
    return this.findOneById(this.ingresoRepo, 'tingresoId', tingresoId, empresaId, 'Ingreso');
  }

  async createIngreso(dto: CreateTplIngresosDto, currentUser: string) {
    return this.createEntity(this.ingresoRepo, dto, currentUser);
  }

  async updateIngreso(tingresoId: number, empresaId: number, dto: UpdateTplIngresosDto, currentUser: string) {
    return this.updateEntity(this.ingresoRepo, 'tingresoId', tingresoId, empresaId, dto, currentUser, 'Ingreso');
  }

  async removeIngreso(tingresoId: number, empresaId: number) {
    return this.softDelete(this.ingresoRepo, 'tingresoId', tingresoId, empresaId, 'Ingreso');
  }
}
