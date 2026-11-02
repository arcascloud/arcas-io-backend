import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral, DataSource, Between, DeepPartial, In } from 'typeorm';
import { FechaSistemaService, TABLAS_FECHAREGISTRO } from '../../shared/fecha-sistema.service';
import { CorrelativosService } from '../../shared/correlativos.service';
import { PlEmpleados } from './entities/plempleados.entity';
import { PlEtits } from './entities/pletitulaciones.entity';
import { PlAsistencia } from './entities/pleasistencia.entity';
import { PlCertificaciones } from './entities/plecertificaciones.entity';
import { PlIngresos } from './entities/pleingresos.entity';
import { PlAuthoraExMae } from './entities/pleauthoraexmae.entity';
import { PlAuthoraExDet } from './entities/pleauthoraexdet.entity';
import { PlDeducciones } from './entities/plededucciones.entity';
import { PlPlaMae } from './entities/pleplamae.entity';
import { PlPlaDet } from './entities/plepladet.entity';
import { TplPuestos } from './entities/tplpuestos.entity';
import { TplProfesiones } from './entities/tplprofesiones.entity';
import { TplTipoMov } from './entities/tpltipomov.entity';
import { PlTipoMov } from './entities/pletipomov.entity';
import { TplIngresos } from './entities/tplingresos.entity';
import { TplTipoEmpleado } from './entities/tpltipoempleado.entity';
import { TplHorasExtra } from './entities/tplhorasextras.entity';
import { TplComision } from './entities/tplcomision.entity';
import { TplDepto } from './entities/pldeptos.entity';
import { TMes } from './entities/tmeses.entity';
import { CreatePlEmpleadosDto, UpdatePlEmpleadosDto } from './dto/plplempleados.dto';
import { CreatePlPlaMaeDto, UpdatePlPlaMaeDto } from './dto/pleplamae.dto';
import { CreatePlPlaDetDto, UpdatePlPlaDetDto } from './dto/plepladet.dto';
import { CreatePlTipoMovDto, UpdatePlTipoMovDto } from './dto/pletipomov.dto';
import { CreatePlIngresosDto, UpdatePlIngresosDto } from './dto/pleingresos.dto';
import {
  CreateAuthoraExMaeDto,
  UpdateAuthoraExMaeDto,
  CreateAuthoraExDetDto,
  UpdateAuthoraExDetDto,
} from './dto/authoraex.dto';
import { CreateTplTipoMovDto, UpdateTplTipoMovDto } from './dto/tpltipomov.dto';
import { CreateTplIngresosDto, UpdateTplIngresosDto } from './dto/tplingresos.dto';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { Tcoisr } from '../contabilidad/entities/tcoisr.entity';
import { Tcoimpuestovecinal } from '../contabilidad/entities/tcoimpuestovecinal.entity';
import { Coperiodoctable } from '../contabilidad/entities/coperiodoctable.entity';
import { TbcoMovimiento } from '../bancos/entities/bco-movimiento.entity';
import {
  ContabilidadLogicaService,
  PartidaPlanillaImportes,
} from '../contabilidad/contabilidad-logica.service';

/** Claves de columna del resumen de ingresos (`/planilla/ingresos-rev`). */
export type ClaveIngreso =
  | 'comision'
  | 'bono'
  | 'horaEx'
  | 'diaFest'
  | 'decimo13'
  | 'decimo14';

/** Definición de una columna del resumen de ingresos. */
export interface DefColIngreso {
  clave: ClaveIngreso;
  tipomovId: number | null;
  abreviatura: string;
  descripcion: string;
  /** true = se calcula en Lempiras (décimos); false = porcentaje de planilla */
  esAnual: boolean;
}

/** Estado de un concepto de ingreso para un empleado. */
export interface CeldaIngreso {
  importe: number | null;
  tipoimporte: string | null;
  /** true = importe en Lempiras; false = porcentaje que aplica planilla */
  esMonto: boolean;
  sinRegistrar: boolean;
  /** Sólo décimos: monto calculado (salario ordinario del año / 12) */
  calculado: number | null;
  /** Sólo décimos: registrado <> calculado */
  descuadra: boolean;
}

/** Totales agregados de una columna del resumen de ingresos. */
export interface TotalColumnaIngreso {
  conRegistro: number;
  sinRegistrar: number;
  descuadra: number;
  total: number;
}

/** Horas de jornada diaria por tipo de jornada (`plempleados.sn_jornada`). */
const HORAS_JORNADA: Record<string, number> = { D: 8, M: 7, N: 6 };

/** Tope de "madrugada": una salida real hasta las 06:00 cruza medianoche. */
const MADRUGADA = 6 * 3600;

/** Tramo de `tplhorasextras` con sus límites ya convertidos a segundos. */
interface TramoCfg {
  horaextraId: number;
  descripcion: string;
  desde: string | null;
  hasta: string | null;
  /** Porcentaje de recargo (25 = +25%) */
  tasa: number;
  /** Límite inicial en segundos desde medianoche (puede ser 86400 = 24:00:00) */
  desdeSeg: number;
  /** Límite final en segundos desde medianoche */
  hastaSeg: number;
}

@Injectable()
export class PlanillaService {
  constructor(
    @InjectRepository(PlEmpleados) private readonly empleadoRepo: Repository<PlEmpleados>,
    @InjectRepository(PlEtits) private readonly etitulacionRepo: Repository<PlEtits>,
    @InjectRepository(PlAsistencia) private readonly asistenciaRepo: Repository<PlAsistencia>,
    @InjectRepository(PlCertificaciones) private readonly certificacionRepo: Repository<PlCertificaciones>,
    @InjectRepository(PlIngresos) private readonly pleIngresosRepo: Repository<PlIngresos>,
    @InjectRepository(PlDeducciones) private readonly deduccionEmpRepo: Repository<PlDeducciones>,
    @InjectRepository(PlPlaMae) private readonly plamaeRepo: Repository<PlPlaMae>,
    @InjectRepository(PlPlaDet) private readonly pladetRepo: Repository<PlPlaDet>,
    @InjectRepository(TplPuestos) private readonly puestoRepo: Repository<TplPuestos>,
    @InjectRepository(TplProfesiones) private readonly profesionRepo: Repository<TplProfesiones>,
    @InjectRepository(TplTipoMov) private readonly tipoMovRepo: Repository<TplTipoMov>,
    @InjectRepository(PlTipoMov) private readonly plTipoMovRepo: Repository<PlTipoMov>,
    @InjectRepository(TplIngresos) private readonly ingresoRepo: Repository<TplIngresos>,
    @InjectRepository(TplTipoEmpleado) private readonly tipoEmpleadoRepo: Repository<TplTipoEmpleado>,
  @InjectRepository(TplHorasExtra) private readonly horasExtrasRepo: Repository<TplHorasExtra>,
    @InjectRepository(TplComision) private readonly comisionRepo: Repository<TplComision>,
    @InjectRepository(TplDepto) private readonly deptoRepo: Repository<TplDepto>,
    @InjectRepository(TMes) private readonly mesRepo: Repository<TMes>,
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
    @InjectRepository(Tcoisr) private readonly isrRepo: Repository<Tcoisr>,
    @InjectRepository(Tcoimpuestovecinal) private readonly vecinalRepo: Repository<Tcoimpuestovecinal>,
    @InjectRepository(Coperiodoctable) private readonly periodoctableRepo: Repository<Coperiodoctable>,
    @InjectRepository(PlAuthoraExMae) private readonly authoraexMaeRepo: Repository<PlAuthoraExMae>,
    @InjectRepository(PlAuthoraExDet) private readonly authoraexDetRepo: Repository<PlAuthoraExDet>,
    @InjectRepository(TbcoMovimiento) private readonly bcoMovRepo: Repository<TbcoMovimiento>,
    private readonly fechaSistema: FechaSistemaService,
    private readonly correlativos: CorrelativosService,
    private readonly dataSource: DataSource,
    // Partida contable del pago de planilla (PDA 21)
    private readonly contabilidadLogica: ContabilidadLogicaService,
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
    const datos: any = { ...dto, usuarioCreated: currentUser };
    // Reglas 1 y 4: de este service solo `plplempleados`, `pleasistencia`,
    // `pleplamae` y `plepladet` están en TABLAS_FECHAREGISTRO → a ellas se les
    // estampa `fecharegistro` con obtenerFechaRegistro(); plecertificaciones,
    // pleingresos, pleducciones, pletitulaciones, tpl* no entran al if y
    // conservan su comportamiento actual (pleingresos estampa su propia
    // `fecha_registro` en `createPleIngreso`, que no usa este método).
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
    let nroempleado = dto.nroempleado;
    if (!nroempleado) {
      try {
        nroempleado = await this.correlativos.siguienteString('nroempleado', dto.empresaId, currentUser, 6);
      } catch {
        const count = await this.empleadoRepo.count({ where: { empresaId: dto.empresaId } });
        nroempleado = String(count + 1).padStart(6, '0');
      }
    }

    const payload: any = {
      ...dto,
      nroempleado,
      nrodocumento: dto.nrodocumento || '0000000000000',
    };

    if (payload.foto) {
      payload.foto = Buffer.from(payload.foto, 'base64');
    } else {
      delete payload.foto;
    }

    return this.createEntity(this.empleadoRepo, payload, currentUser);
  }

  async updateEmpleado(empleadoId: number, empresaId: number, dto: UpdatePlEmpleadosDto, currentUser: string) {
    const payload: any = { ...dto };
    if (payload.foto) {
      payload.foto = Buffer.from(payload.foto, 'base64');
    } else {
      delete payload.foto;
    }
    return this.updateEntity(this.empleadoRepo, 'empleadoId', empleadoId, empresaId, payload, currentUser, 'Empleado');
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

  // ── Ingresos autorizados (pleingresos): comisiones y bonos ────────────────
  //
  // Cada fila registra un ingreso aprobado por un departamento: qué depto lo
  // autoriza (deptoId), el jefe que firmó (jefeId), el empleado que lo cobra
  // (empleadoId), el importe y el concepto (COMISION o BONO).
  // Sustituye a la antigua tabla `plecomisiones`.

  async findAllPleIngresos(empresaId: number) {
    // `removePleIngreso` es un soft delete (sn_activo='N'), así que la lista
    // filtra sobre activos: un ingreso eliminado desaparece del listado pero
    // se conserva el registro en BD. El resumen ingresa-rev aplica el mismo
    // filtro.
    return this.pleIngresosRepo.find({
      where: { empresaId, sn_activo: 'S' },
      order: { fecha_registro: 'DESC', pleingresoId: 'DESC' },
    });
  }

  async findPleIngreso(pleingresoId: number, empresaId: number) {
    return this.findOneById(
      this.pleIngresosRepo,
      'pleingresoId',
      pleingresoId,
      empresaId,
      'Ingreso',
    );
  }

  async createPleIngreso(dto: CreatePlIngresosDto, currentUser: string) {
    const fecha = await this.fechaSistema.getFecha(dto.empresaId);
    // anio_ejercicio y periodo son NOT NULL: si no vienen, se derivan
    const anio = dto.anio_ejercicio ?? fecha.getFullYear();
    const periodo = dto.periodo ?? fecha.getMonth() + 1;
    this.validarEjercicio(periodo, anio);

    const entity = this.pleIngresosRepo.create({
      ...dto,
      anio_ejercicio: anio,
      periodo,
      fecha_registro: dto.fecha_registro ?? fecha,
      usuarioCreated: currentUser,
    });
    return this.pleIngresosRepo.save(entity);
  }

  async updatePleIngreso(
    pleingresoId: number,
    empresaId: number,
    dto: UpdatePlIngresosDto,
    currentUser: string,
  ) {
    const existente = await this.findPleIngreso(pleingresoId, empresaId);
    this.validarEjercicio(
      dto.periodo ?? existente.periodo,
      dto.anio_ejercicio ?? existente.anio_ejercicio,
    );
    return this.updateEntity(
      this.pleIngresosRepo,
      'pleingresoId',
      pleingresoId,
      empresaId,
      dto,
      currentUser,
      'Ingreso',
    );
  }

  async removePleIngreso(pleingresoId: number, empresaId: number) {
    return this.softDelete(
      this.pleIngresosRepo,
      'pleingresoId',
      pleingresoId,
      empresaId,
      'Ingreso',
    );
  }

  /** Valida el par período (1-12) / ejercicio antes de escribir en BD. */
  private validarEjercicio(periodo: number, anio: number) {
    if (!Number.isInteger(periodo) || periodo < 1 || periodo > 12) {
      throw new BadRequestException(`Período inválido: ${periodo} (debe estar entre 1 y 12)`);
    }
    if (!Number.isInteger(anio) || anio < 1900 || anio > 2200) {
      throw new BadRequestException(`Ejercicio inválido: ${anio}`);
    }
  }

  // ══ AUTORIZACIÓN DE PAGO DE HORAS EXTRAS ═══════════════════════════════
  //
  // `pleauthoraexmae` → departamento (`deptoId`), el jefe que SOLICITA
  //                     (`solicitado_por`), el gerente que APRUEBA
  //                     (`autorizado_por`), el RANGO de fechas
  //                     (`fecha_desde`/`fecha_hasta`) y el motivo.
  // `pleauthoraexdet` → los empleados autorizados; sólo los de `sn_pagar='S'`
  //                     cobran, y además su ASISTENCIA debe caer dentro del
  //                     rango seleccionado.
  //
  // Ninguna de las dos tablas tiene `sn_activo`, así que la baja es
  // definitiva (hard delete) y respeta las FK RESTRICT hacia empleados,
  // empresa y cabecera.

  async findAllAuthoraExMae(empresaId: number) {
    return this.authoraexMaeRepo.find({
      where: { empresaId },
      order: { fecha_registro: 'DESC', pleauthoraexmaeid: 'DESC' },
    });
  }

  /** Cabecera + detalle de la autorización. */
  async findAuthoraExMae(pleauthoraexmaeid: number, empresaId: number) {
    const mae = await this.findOneById(
      this.authoraexMaeRepo,
      'pleauthoraexmaeid',
      pleauthoraexmaeid,
      empresaId,
      'Autorización horas extras',
    );
    const detalles = await this.authoraexDetRepo.find({
      where: { pleauthoraexmaeid, empresaId },
      order: { pleauthoraexdetId: 'ASC' },
    });
    return { ...mae, detalles };
  }

  async createAuthoraExMae(dto: CreateAuthoraExMaeDto, currentUser: string) {
    const fecha = await this.fechaSistema.getFecha(dto.empresaId);
    const anio = dto.anio_ejercicio ?? fecha.getFullYear();
    const periodo = dto.periodo ?? fecha.getMonth() + 1;
    this.validarEjercicio(periodo, anio);
    this.validarRangoFechas(dto.fecha_desde, dto.fecha_hasta);

    // Se validan las líneas ANTES de insertar la cabecera: si un empleado no
    // existe o está repetido, el 404/409 no debe dejar una cabecera huérfana.
    const lineas = dto.detalles ?? [];
    const enBatch = new Set<number>();
    for (const linea of lineas) {
      if (enBatch.has(linea.empleadoId)) {
        throw new ConflictException(
          `El empleado ${linea.empleadoId} está repetido en las líneas de la solicitud`,
        );
      }
      enBatch.add(linea.empleadoId);
      await this.findOneById(
        this.empleadoRepo,
        'empleadoId',
        linea.empleadoId,
        dto.empresaId,
        'Empleado',
      );
    }

    // DeepPartial (no `any`): con `any` TS elige la sobrecarga ARRAY de
    // repo.create() y `save()` devolvería PlAuthoraExMae[].
    const payload: DeepPartial<PlAuthoraExMae> = {
      fecha_registro: fecha,
      anio_ejercicio: anio,
      periodo,
      deptoId: dto.deptoId,
      solicitado_por: dto.solicitado_por,
      autorizado_por: dto.autorizado_por,
      razon_justificacion: dto.razon_justificacion,
      empresaId: dto.empresaId,
      usuarioCreated: currentUser,
      fechaCreated: fecha,
    };
    if (dto.fecha_desde) payload.fecha_desde = this.fechaLocal(dto.fecha_desde);
    if (dto.fecha_hasta) payload.fecha_hasta = this.fechaLocal(dto.fecha_hasta);

    const mae = await this.authoraexMaeRepo.save(this.authoraexMaeRepo.create(payload));

    for (const linea of dto.detalles ?? []) {
      await this.crearLineaAuthoraEx(
        mae.pleauthoraexmaeid,
        dto.empresaId,
        { empleadoId: linea.empleadoId, departamentoId: linea.departamentoId, sn_pagar: linea.sn_pagar },
        currentUser,
        fecha,
      );
    }
    return this.findAuthoraExMae(mae.pleauthoraexmaeid, dto.empresaId);
  }

  async updateAuthoraExMae(
    pleauthoraexmaeid: number,
    empresaId: number,
    dto: UpdateAuthoraExMaeDto,
    currentUser: string,
  ) {
    const mae = await this.findOneById(
      this.authoraexMaeRepo,
      'pleauthoraexmaeid',
      pleauthoraexmaeid,
      empresaId,
      'Autorización horas extras',
    );
    this.validarEjercicio(dto.periodo ?? mae.periodo, dto.anio_ejercicio ?? mae.anio_ejercicio);
    this.validarRangoFechas(
      'fecha_desde' in dto ? dto.fecha_desde : mae.fecha_desde,
      'fecha_hasta' in dto ? dto.fecha_hasta : mae.fecha_hasta,
    );

    const cambios: any = {};
    if (dto.anio_ejercicio !== undefined) cambios.anio_ejercicio = dto.anio_ejercicio;
    if (dto.periodo !== undefined) cambios.periodo = dto.periodo;
    if (dto.deptoId !== undefined) cambios.deptoId = dto.deptoId;
    if (dto.solicitado_por !== undefined) cambios.solicitado_por = dto.solicitado_por;
    if (dto.autorizado_por !== undefined) cambios.autorizado_por = dto.autorizado_por;
    if (dto.razon_justificacion !== undefined) cambios.razon_justificacion = dto.razon_justificacion;
    // `in` para distinguir "no se tocó el campo" de "se limpió" (null)
    if ('fecha_desde' in dto) cambios.fecha_desde = dto.fecha_desde ? this.fechaLocal(dto.fecha_desde) : null;
    if ('fecha_hasta' in dto) cambios.fecha_hasta = dto.fecha_hasta ? this.fechaLocal(dto.fecha_hasta) : null;

    Object.assign(mae, cambios, {
      usuarioUpdated: currentUser,
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
    });
    await this.authoraexMaeRepo.save(mae);
    return this.findAuthoraExMae(pleauthoraexmaeid, empresaId);
  }

  async removeAuthoraExMae(pleauthoraexmaeid: number, empresaId: number) {
    const mae = await this.findOneById(
      this.authoraexMaeRepo,
      'pleauthoraexmaeid',
      pleauthoraexmaeid,
      empresaId,
      'Autorización horas extras',
    );
    // El detalle tiene FK RESTRICT hacia la cabecera: primero las líneas.
    await this.authoraexDetRepo.delete({ pleauthoraexmaeid, empresaId });
    await this.authoraexMaeRepo.delete({ pleauthoraexmaeid, empresaId });
    return { pleauthoraexmaeid, eliminada: true };
  }

  async createAuthoraExDet(dto: CreateAuthoraExDetDto, currentUser: string) {
    const fecha = await this.fechaSistema.getFecha(dto.empresaId);
    // La cabecera debe existir y pertenecer a la misma empresa
    await this.findOneById(
      this.authoraexMaeRepo,
      'pleauthoraexmaeid',
      dto.pleauthoraexmaeid,
      dto.empresaId,
      'Autorización horas extras',
    );
    return this.crearLineaAuthoraEx(
      dto.pleauthoraexmaeid,
      dto.empresaId,
      { empleadoId: dto.empleadoId, departamentoId: dto.departamentoId, sn_pagar: dto.sn_pagar },
      currentUser,
      fecha,
    );
  }

  async updateAuthoraExDet(
    pleauthoraexdetId: number,
    empresaId: number,
    dto: UpdateAuthoraExDetDto,
    currentUser: string,
  ) {
    const det = await this.findOneById(
      this.authoraexDetRepo,
      'pleauthoraexdetId',
      pleauthoraexdetId,
      empresaId,
      'Detalle autorización horas extras',
    );
    if (dto.empleadoId !== undefined && dto.empleadoId !== det.empleadoId) {
      // mover la línea a otro empleado choca con el UNIQUE (mae, empleado, empresa)
      await this.findOneById(this.empleadoRepo, 'empleadoId', dto.empleadoId, empresaId, 'Empleado');
      const duplicado = await this.authoraexDetRepo.findOne({
        where: { pleauthoraexmaeid: det.pleauthoraexmaeid, empleadoId: dto.empleadoId, empresaId },
      });
      if (duplicado) {
        throw new ConflictException('El empleado ya está autorizado en esta solicitud');
      }
    }
    const cambios: any = {};
    if (dto.empleadoId !== undefined) cambios.empleadoId = dto.empleadoId;
    if (dto.departamentoId !== undefined) cambios.departamentoId = dto.departamentoId;
    if (dto.sn_pagar !== undefined) cambios.sn_pagar = dto.sn_pagar;

    Object.assign(det, cambios, {
      usuarioUpdated: currentUser,
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
    });
    return this.authoraexDetRepo.save(det);
  }

  async removeAuthoraExDet(pleauthoraexdetId: number, empresaId: number) {
    const det = await this.findOneById(
      this.authoraexDetRepo,
      'pleauthoraexdetId',
      pleauthoraexdetId,
      empresaId,
      'Detalle autorización horas extras',
    );
    await this.authoraexDetRepo.delete({ pleauthoraexdetId: det.pleauthoraexdetId, empresaId });
    return { pleauthoraexdetId: det.pleauthoraexdetId, eliminada: true };
  }

  /**
   * Empleados a pagar + su asistencia dentro del rango de la autorización,
   * con el desglose de horas extras por tramo y su importe.
   *
   * Reglas de cálculo:
   * 1. El corte de la jornada normal es **`horasalida`** (salida programada
   *    de cada día): sólo lo que excede esa hora son horas extras.
   * 2. Cada minuto extra se clasifica en el tramo de **`tplhorasextras`**
   *    cuyo horario de reloj lo contenga y se le aplica su `tasa`.
   * 3. El cruce de medianoche sólo se aplica si la salida real cae de
   *    madrugada (≤ 06:00); salir ANTES de lo programado no genera extras.
   * 4. Valor de la hora = `(sueldobruto / 30) / horas de jornada`, según
   *    `sn_jornada` (D=8, M=7, N=6).
   * 5. Importe por tramo = `valorHora × horas × (1 + tasa / 100)`.
   *
   * Los minutos que no caen en ningún tramo se reportan en
   * `minutosSinTramo` (horario no cubierto por la tabla).
   */
  async findAuthoraExHorasExtras(pleauthoraexmaeid: number, empresaId: number) {
    const mae = await this.findAuthoraExMae(pleauthoraexmaeid, empresaId);
    if (!mae.fecha_desde || !mae.fecha_hasta) {
      throw new BadRequestException(
        'La autorización no tiene rango de fechas (fecha_desde / fecha_hasta): no se puede evaluar la asistencia.',
      );
    }

    const desde = this.fechaLocal(mae.fecha_desde);
    desde.setHours(0, 0, 0, 0);
    const hasta = this.fechaLocal(mae.fecha_hasta);
    hasta.setHours(23, 59, 59, 999);

    const [asistencias, tramos] = await Promise.all([
      this.asistenciaRepo.find({
        where: { empresaId, fecharegistro: Between(desde, hasta) },
        order: { fecharegistro: 'ASC', plempleadosasistenciaId: 'ASC' },
      }),
      this.horasExtrasRepo.find({
        where: { empresaId, sn_activo: 'S' },
        order: { desde: 'ASC', horaextraId: 'ASC' },
      }),
    ]);

    if (!tramos.length) {
      throw new BadRequestException(
        'No hay tramos de horas extras activos en tplhorasextras para esta empresa.',
      );
    }

    /** Tramos utilizables: con desde/hasta válidos. */
    const cfgTramos: TramoCfg[] = tramos
      .map((t) => ({
        horaextraId: t.horaextraId,
        descripcion: (t.descripcion || '').replace(/:\s*$/, '').trim(),
        desde: t.desde,
        hasta: t.hasta,
        tasa: Number(t.tasa ?? 0),
        desdeSeg: this.segundosDeHora(t.desde),
        hastaSeg: this.segundosDeHora(t.hasta),
      }))
      .filter((t) => t.desdeSeg >= 0 && t.hastaSeg >= 0);

    if (!cfgTramos.length) {
      throw new BadRequestException(
        'Los tramos de tplhorasextras no tienen desde/hasta válidos: no se pueden clasificar las horas extras.',
      );
    }

    const porEmpleado = new Map<number, PlAsistencia[]>();
    for (const a of asistencias) {
      const lista = porEmpleado.get(a.empleadoId) ?? [];
      lista.push(a);
      porEmpleado.set(a.empleadoId, lista);
    }

    const idsEmpleados = [...new Set((mae.detalles ?? []).map((d) => d.empleadoId))];
    const empleados = idsEmpleados.length
      ? await this.empleadoRepo.find({
          where: { empresaId, empleadoId: In(idsEmpleados) },
        })
      : [];
    const mapaEmpleados = new Map<number, PlEmpleados>(
      empleados.map((e) => [e.empleadoId, e]),
    );

    let minutosTotales = 0;
    let importeTotal = 0;
    let recargoTotal = 0;
    let minutosPagados = 0;
    let importePagado = 0;
    let recargoPagado = 0;

    const filas = (mae.detalles ?? []).map((d) => {
      const emp = mapaEmpleados.get(d.empleadoId);
      const jornada = HORAS_JORNADA[emp?.sn_jornada ?? 'D'] ?? 8;
      const sueldo = Number(emp?.sueldobruto ?? 0);
      const valorHora = sueldo > 0 ? sueldo / 30 / jornada : 0;

      const asis = porEmpleado.get(d.empleadoId) ?? [];
      const accPorTramo = new Map<number, number>();
      let minutos = 0;
      let diasConExtras = 0;
      let minutosSinTramo = 0;

      const linea = asis.map((a) => {
        const clasif = this.clasificarHorasExtras(a, cfgTramos);
        minutos += clasif.minutos;
        if (clasif.minutos > 0) diasConExtras++;
        minutosSinTramo += clasif.sinTramo;
        for (const [tramoId, mins] of clasif.porTramo) {
          accPorTramo.set(tramoId, (accPorTramo.get(tramoId) ?? 0) + mins);
        }
        return {
          asistenciaId: a.plempleadosasistenciaId,
          fecha: a.fecharegistro,
          horasalida: a.horasalida,
          horarealSalida: a.horarealSalida,
          minutosExtras: clasif.minutos,
          sinTramo: clasif.sinTramo,
          porTramo: cfgTramos
            .filter((t) => (clasif.porTramo.get(t.horaextraId) ?? 0) > 0)
            .map((t) => ({
              horaextraId: t.horaextraId,
              minutos: clasif.porTramo.get(t.horaextraId) ?? 0,
            })),
        };
      });

      const desglose = cfgTramos
        .filter((t) => (accPorTramo.get(t.horaextraId) ?? 0) > 0)
        .map((t) => {
          const min = accPorTramo.get(t.horaextraId) ?? 0;
          const base = valorHora * (min / 60);
          return {
            horaextraId: t.horaextraId,
            descripcion: t.descripcion,
            desde: t.desde,
            hasta: t.hasta,
            tasa: t.tasa,
            minutos: min,
            horas: this.redondear(min / 60, 2),
            importe: this.redondear(base * (1 + t.tasa / 100), 2),
            recargo: this.redondear(base * (t.tasa / 100), 2),
          };
        });

      const importeFila = this.redondear(
        desglose.reduce((s, t) => s + t.importe, 0),
        2,
      );
      const recargoFila = this.redondear(
        desglose.reduce((s, t) => s + t.recargo, 0),
        2,
      );

      const paga = d.sn_pagar === 'S';
      minutosTotales += minutos;
      importeTotal += importeFila;
      recargoTotal += recargoFila;
      if (paga) {
        minutosPagados += minutos;
        importePagado += importeFila;
        recargoPagado += recargoFila;
      }

      return {
        pleauthoraexdetId: d.pleauthoraexdetId,
        empleadoId: d.empleadoId,
        departamentoId: d.departamentoId,
        sn_pagar: d.sn_pagar,
        /** Regla de pago: autorizado Y sn_pagar='S' */
        paga,
        nroempleado: emp?.nroempleado ?? '',
        nombres: emp?.nombres ?? '',
        apellidos: emp?.apellidos ?? '',
        sn_jornada: emp?.sn_jornada ?? 'D',
        horasJornada: jornada,
        sueldobruto: sueldo,
        valorHora: this.redondear(valorHora, 4),
        diasAsistencia: asis.length,
        diasConExtras,
        minutosExtras: minutos,
        horasExtras: this.redondear(minutos / 60, 2),
        minutosSinTramo,
        tramos: desglose,
        importe: importeFila,
        recargo: recargoFila,
        asistencias: linea,
      };
    });

    const quePagan = filas.filter((f) => f.paga);
    return {
      ...mae,
      desde,
      hasta,
      /** Configuración vigente de tramos y tasas (para mostrarla/legenda). */
      tramos: cfgTramos.map(({ desdeSeg, hastaSeg, ...t }) => t),
      filas,
      totales: {
        empleadosAutorizados: filas.length,
        empleadosQuePagan: quePagan.length,
        diasConExtras: filas.reduce((s, f) => s + f.diasConExtras, 0),
        minutosExtras: minutosTotales,
        horasExtras: this.redondear(minutosTotales / 60, 2),
        minutosExtrasPagados: minutosPagados,
        horasExtrasPagadas: this.redondear(minutosPagados / 60, 2),
        importe: this.redondear(importeTotal, 2),
        importePagado: this.redondear(importePagado, 2),
        recargo: this.redondear(recargoTotal, 2),
        recargoPagado: this.redondear(recargoPagado, 2),
      },
    };
  }

  /**
   * Integra las horas extras MENSUALES con la planilla del período.
   *
   * Fuente (decisión de negocio): todas las autorizaciones
   * (`pleauthoraexmae`) del mismo `anio_ejercicio`/`periodo` que la
   * planilla, considerando sólo las líneas con `sn_pagar='S'` y
   * **deduplicando por día de asistencia**: si dos autorizaciones cubren el
   * mismo día del mismo empleado, el importe se cuenta UNA sola vez.
   *
   * Escribe:
   *  - `plepladet.importe_chorasextras` (monto en L) en CADA línea de la
   *    planilla (0 cuando el empleado no tuvo horas extras);
   *  - `pletipomov` del rubro `PAGO-HORA-EX` → `tipoimporte='A'` con el
   *    importe mensual, para que el resumen de ingresos lo muestre.
   *
   * Todo dentro de UNA transacción. Invocación manual desde la pantalla de
   * planilla: `POST /planilla/planillas/:id/calcular-horas-extras`.
   */
  async calcularHorasExtrasPlanilla(
    planillaId: number,
    empresaId: number,
    currentUser: string,
  ) {
    const planilla = await this.plamaeRepo.findOne({ where: { planillaId, empresaId } });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');
    if (planilla.sn_anulada === 'S') {
      throw new BadRequestException(
        'La planilla está anulada: no se pueden calcular horas extras.',
      );
    }
    if (planilla.sn_pagada === 'S') {
      throw new BadRequestException(
        'La planilla está pagada: no se puede recalcular horas extras.',
      );
    }

    const lineas = await this.pladetRepo.find({ where: { planillaId, empresaId } });
    if (!lineas.length) {
      throw new BadRequestException(
        'La planilla no tiene líneas: agregue los empleados antes de calcular las horas extras.',
      );
    }

    const etiquetaPeriodo = `${planilla.periodo}/${planilla.anio}`;
    const autorizaciones = await this.authoraexMaeRepo.find({
      where: {
        empresaId,
        anio_ejercicio: planilla.anio,
        periodo: planilla.periodo,
      },
      order: { pleauthoraexmaeid: 'ASC' },
    });
    if (!autorizaciones.length) {
      throw new BadRequestException(
        `No hay autorizaciones de horas extras para el período ${etiquetaPeriodo}.`,
      );
    }

    // Sólo líneas autorizadas a pagar (regla: autorizado Y sn_pagar='S').
    const detalles = await this.authoraexDetRepo.find({
      where: {
        pleauthoraexmaeid: In(autorizaciones.map((a) => a.pleauthoraexmaeid)),
        empresaId,
        sn_pagar: 'S',
      },
    });
    if (!detalles.length) {
      throw new BadRequestException(
        `Las autorizaciones del período ${etiquetaPeriodo} no tienen empleados marcados con "Sí, paga".`,
      );
    }

    const tramos = await this.horasExtrasRepo.find({
      where: { empresaId, sn_activo: 'S' },
      order: { desde: 'ASC', horaextraId: 'ASC' },
    });
    if (!tramos.length) {
      throw new BadRequestException(
        'No hay tramos de horas extras activos en tplhorasextras para esta empresa.',
      );
    }
    const cfgTramos: TramoCfg[] = tramos
      .map((t) => ({
        horaextraId: t.horaextraId,
        descripcion: (t.descripcion || '').replace(/:\s*$/, '').trim(),
        desde: t.desde,
        hasta: t.hasta,
        tasa: Number(t.tasa ?? 0),
        desdeSeg: this.segundosDeHora(t.desde),
        hastaSeg: this.segundosDeHora(t.hasta),
      }))
      .filter((t) => t.desdeSeg >= 0 && t.hastaSeg >= 0);
    if (!cfgTramos.length) {
      throw new BadRequestException(
        'Los tramos de tplhorasextras no tienen desde/hasta válidos: no se pueden clasificar las horas extras.',
      );
    }

    // --- Rango de fechas de cada autorización del mes ---
    type Rango = { au: PlAuthoraExMae; desde: Date; hasta: Date };
    const rangos: Rango[] = [];
    for (const au of autorizaciones) {
      if (!au.fecha_desde || !au.fecha_hasta) continue;
      const desde = this.fechaLocal(au.fecha_desde);
      desde.setHours(0, 0, 0, 0);
      const hasta = this.fechaLocal(au.fecha_hasta);
      hasta.setHours(23, 59, 59, 999);
      rangos.push({ au, desde, hasta });
    }
    if (!rangos.length) {
      throw new BadRequestException(
        `Las autorizaciones del período ${etiquetaPeriodo} no tienen rango de fechas (fecha_desde / fecha_hasta): no se puede evaluar la asistencia.`,
      );
    }

    /** Empleados autorizados a pagar por cada autorización. */
    const empleadosPorAuth = new Map<number, number[]>();
    for (const d of detalles) {
      const ids = empleadosPorAuth.get(d.pleauthoraexmaeid) ?? [];
      ids.push(d.empleadoId);
      empleadosPorAuth.set(d.pleauthoraexmaeid, ids);
    }

    // --- Asistencia dentro del rango global (menor desde / mayor hasta) ---
    const desdeGlobal = new Date(Math.min(...rangos.map((r) => r.desde.getTime())));
    const hastaGlobal = new Date(Math.max(...rangos.map((r) => r.hasta.getTime())));
    const asistencias = await this.asistenciaRepo.find({
      where: { empresaId, fecharegistro: Between(desdeGlobal, hastaGlobal) },
      order: { plempleadosasistenciaId: 'ASC' },
    });
    const asisPorEmpleado = new Map<number, PlAsistencia[]>();
    for (const a of asistencias) {
      const lista = asisPorEmpleado.get(a.empleadoId) ?? [];
      lista.push(a);
      asisPorEmpleado.set(a.empleadoId, lista);
    }

    // --- Días contados por empleado (deduplicado entre autorizaciones) ---
    const contados = new Map<number, Map<number, PlAsistencia>>();
    for (const { au, desde, hasta } of rangos) {
      const ids = empleadosPorAuth.get(au.pleauthoraexmaeid) ?? [];
      for (const empleadoId of ids) {
        const mapa = contados.get(empleadoId) ?? new Map<number, PlAsistencia>();
        for (const a of asisPorEmpleado.get(empleadoId) ?? []) {
          const fecha = this.fechaLocal(a.fecharegistro).getTime();
          if (fecha < desde.getTime() || fecha > hasta.getTime()) continue;
          if (mapa.has(a.plempleadosasistenciaId)) continue;
          mapa.set(a.plempleadosasistenciaId, a);
        }
        if (mapa.size) contados.set(empleadoId, mapa);
      }
    }
    if (!contados.size) {
      throw new BadRequestException(
        `Las autorizaciones del período ${etiquetaPeriodo} no tienen asistencia registrada dentro de su rango de fechas.`,
      );
    }

    const idsEmpleados = [...contados.keys()];
    const empleados = await this.empleadoRepo.find({
      where: { empresaId, empleadoId: In(idsEmpleados) },
    });
    const mapaEmpleados = new Map<number, PlEmpleados>(
      empleados.map((e) => [e.empleadoId, e]),
    );

    // --- Cálculo mensual por empleado (valor de hora × tramos) ---
    type CalcHe = {
      empleadoId: number;
      nroempleado: string;
      nombre: string;
      sn_jornada: string;
      horasJornada: number;
      sueldobruto: number;
      valorHora: number;
      diasConExtras: number;
      minutosExtras: number;
      horasExtras: number;
      minutosSinTramo: number;
      importe: number;
      recargo: number;
      tramos: Array<{
        horaextraId: number;
        descripcion: string;
        tasa: number;
        minutos: number;
        horas: number;
        importe: number;
        recargo: number;
      }>;
    };
    const detalle: CalcHe[] = [];
    /** Importe mensual a pagar por empleado (0 si no tuvo extras). */
    const porEmpleado = new Map<number, number>();

    for (const empleadoId of idsEmpleados) {
      const emp = mapaEmpleados.get(empleadoId);
      if (!emp) continue;

      const jornada = HORAS_JORNADA[emp.sn_jornada ?? 'D'] ?? 8;
      const sueldo = Number(emp.sueldobruto ?? 0);
      const valorHora = sueldo > 0 ? sueldo / 30 / jornada : 0;

      const accPorTramo = new Map<number, number>();
      let minutos = 0;
      let minutosSinTramo = 0;
      let diasConExtras = 0;

      const mapaAsis = contados.get(empleadoId) ?? new Map<number, PlAsistencia>();
      for (const a of mapaAsis.values()) {
        const clasif = this.clasificarHorasExtras(a, cfgTramos);
        minutos += clasif.minutos;
        if (clasif.minutos > 0) diasConExtras++;
        minutosSinTramo += clasif.sinTramo;
        for (const [tramoId, min] of clasif.porTramo) {
          accPorTramo.set(tramoId, (accPorTramo.get(tramoId) ?? 0) + min);
        }
      }

      const desglose = cfgTramos
        .filter((t) => (accPorTramo.get(t.horaextraId) ?? 0) > 0)
        .map((t) => {
          const min = accPorTramo.get(t.horaextraId) ?? 0;
          const base = valorHora * (min / 60);
          return {
            horaextraId: t.horaextraId,
            descripcion: t.descripcion,
            tasa: t.tasa,
            minutos: min,
            horas: this.redondear(min / 60, 2),
            importe: this.redondear(base * (1 + t.tasa / 100), 2),
            recargo: this.redondear(base * (t.tasa / 100), 2),
          };
        });

      const importe = this.redondear(desglose.reduce((s, t) => s + t.importe, 0), 2);
      const recargo = this.redondear(desglose.reduce((s, t) => s + t.recargo, 0), 2);

      porEmpleado.set(empleadoId, importe);
      detalle.push({
        empleadoId,
        nroempleado: emp.nroempleado ?? '',
        nombre: `${(emp.apellidos ?? '').trim()} ${(emp.nombres ?? '').trim()}`.trim(),
        sn_jornada: emp.sn_jornada ?? 'D',
        horasJornada: jornada,
        sueldobruto: sueldo,
        valorHora: this.redondear(valorHora, 4),
        diasConExtras,
        minutosExtras: minutos,
        horasExtras: this.redondear(minutos / 60, 2),
        minutosSinTramo,
        importe,
        recargo,
        tramos: desglose,
      });
    }

    if (!detalle.length) {
      throw new BadRequestException(
        'No se pudo calcular horas extras: los empleados autorizados no están activos en la nómina.',
      );
    }

    const empleadosLinea = [...new Set(lineas.map((l) => l.empleadoId))];
    /** Empleados con horas extras que NO tienen línea en esta planilla. */
    const sinLinea = detalle.filter(
      (d) => d.importe > 0 && !empleadosLinea.includes(d.empleadoId),
    );

    const tipos = await this.tipoMovRepo.find({
      where: { empresaId },
      order: { tipomovId: 'ASC' },
    });
    const tipoHora = tipos.find((d) => this.esHorasExtras(d));
    if (!tipoHora) {
      throw new BadRequestException(
        'No existe el rubro PAGO-HORA-EX en tpltipomov para esta empresa: no se puede integrar con la planilla.',
      );
    }

    const fecha = await this.fechaSistema.getFecha(empresaId);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      // 1) plepladet.importe_chorasextras en TODAS las líneas de la planilla
      //    + sueldoneto recalculado con la misma fórmula que generarPlanilla
      //    (bruto + comisiones + HE + bonos − (IHSS + RAP + RTF + Vecinal
      //    + otras)), si no el neto quedaba desfasado cada vez que se
      //    integraban HE. QueryBuilder explícito: evita el saltarse el
      //    UPDATE de columnas decimal (MySQL las devuelve como string)
      //    del update() genérico.
      for (const linea of lineas) {
        const importe = porEmpleado.get(linea.empleadoId) ?? 0;
        const nuevoNeto =
          Math.round(
            (Number(linea.sueldobruto) +
              Number(linea.importe_ccomision) +
              importe +
              Number(linea.importe_cbonos) -
              (Number(linea.importe_dihss) +
                Number(linea.importe_drap) +
                Number(linea.importe_drtf) +
                Number(linea.importe_drvc) +
                Number(linea.importe_dotras))) *
              100,
          ) / 100;
        await qr.manager
          .createQueryBuilder()
          .update(PlPlaDet)
          .set({
            importe_chorasextras: importe,
            sueldoneto: nuevoNeto,
            usuarioUpdated: currentUser,
            fechaUpdated: fecha,
          })
          .where('plepladetId = :id', { id: linea.plepladetId })
          .execute();
      }

      // 2) pletipomov PAGO-HORA-EX → monto del mes (tipoimporte='A').
      const movs = await qr.manager.find(PlTipoMov, {
        where: {
          empresaId,
          tipomovId: tipoHora.tipomovId,
          empleadoId: In(empleadosLinea),
        },
      });
      const movPorEmpleado = new Map<number, PlTipoMov>(
        movs.map((m) => [m.empleadoId, m]),
      );

      for (const empleadoId of empleadosLinea) {
        const importe = porEmpleado.get(empleadoId) ?? 0;
        const existente = movPorEmpleado.get(empleadoId);
        if (existente) {
          await qr.manager
            .createQueryBuilder()
            .update(PlTipoMov)
            .set({
              importe,
              tipoimporte: 'A',
              sn_activo: 'S',
              usuarioUpdated: currentUser,
              fechaUpdated: fecha,
            })
            .where('pletipomovId = :id', { id: existente.pletipomovId })
            .execute();
        } else {
          await qr.manager.insert(PlTipoMov, {
            empleadoId,
            tipomovId: tipoHora.tipomovId,
            aplicacion: 'M',
            tipoimporte: 'A',
            importe,
            sn_activo: 'S',
            empresaId,
            usuarioCreated: currentUser,
            fechaCreated: fecha,
          } as DeepPartial<PlTipoMov>);
        }
      }

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    const totalMinutos = detalle.reduce((s, d) => s + d.minutosExtras, 0);

    return {
      planillaId,
      nroplanilla: planilla.nroplanilla,
      anio: planilla.anio,
      periodo: planilla.periodo,
      periodoTexto: etiquetaPeriodo,
      autorizaciones: rangos.length,
      diasEvaluados: [...contados.values()].reduce((s, m) => s + m.size, 0),
      empleadosCalculados: detalle.length,
      lineasActualizadas: lineas.length,
      movimientosActualizados: empleadosLinea.length,
      horasTotales: this.redondear(totalMinutos / 60, 2),
      minutosTotales: totalMinutos,
      importeTotal: this.redondear(detalle.reduce((s, d) => s + d.importe, 0), 2),
      recargoTotal: this.redondear(detalle.reduce((s, d) => s + d.recargo, 0), 2),
      minutosSinTramo: detalle.reduce((s, d) => s + d.minutosSinTramo, 0),
      /** Empleados con horas extras que NO están en la planilla (se cobran 0). */
      empleadosSinLinea: sinLinea.map((d) => ({
        empleadoId: d.empleadoId,
        nroempleado: d.nroempleado,
        nombre: d.nombre,
        importe: d.importe,
      })),
      detalle,
    };
  }

  /**
   * Distribuye los minutos trabajados DESPUÉS de `horasalida` (salida
   * programada) hasta `horarealSalida` en los tramos recibidos.
   *
   * Devuelve los minutos totales, los clasificados por `horaextraId` y los
   * que no cayeron en ningún tramo (`sinTramo`). Siempre se cumple
   * `minutos = Σ porTramo + sinTramo`.
   */
  private clasificarHorasExtras(
    a: PlAsistencia,
    tramos: TramoCfg[],
  ): { minutos: number; sinTramo: number; porTramo: Map<number, number> } {
    const porTramo = new Map<number, number>();
    const prog = this.segundosDeHora(a.horasalida);
    const real = this.segundosDeHora(a.horarealSalida);
    if (prog < 0 || real < 0) return { minutos: 0, sinTramo: 0, porTramo };

    // Sólo el cruce de medianoche es válido si la salida real es de
    // madrugada; quien sale antes de lo programado no trabaja 24 h más.
    let salida = real;
    if (salida <= prog && salida <= MADRUGADA) salida += 24 * 3600;
    if (salida <= prog) return { minutos: 0, sinTramo: 0, porTramo };

    let sinTramo = 0;
    // Un minuto "es extra" si inicia estrictamente después del corte y
    // termina a lo sumo en la salida real → (prog, salida].
    for (let seg = prog + 60; seg <= salida; seg += 60) {
      const reloj = seg % (24 * 3600);
      const tramo = tramos.find((t) => this.contieneHora(t, reloj));
      if (tramo) {
        porTramo.set(
          tramo.horaextraId,
          (porTramo.get(tramo.horaextraId) ?? 0) + 1,
        );
      } else {
        sinTramo++;
      }
    }

    let clasificados = 0;
    for (const min of porTramo.values()) clasificados += min;
    return { minutos: clasificados + sinTramo, sinTramo, porTramo };
  }

  /** ¿El segundo `reloj` (0..86399) cae dentro del tramo? Soporta cruce de medianoche. */
  private contieneHora(
    tramo: { desdeSeg: number; hastaSeg: number },
    reloj: number,
  ): boolean {
    const dia = 24 * 3600;
    const d = tramo.desdeSeg % dia;
    const h = tramo.hastaSeg % dia;
    if (d <= h) return reloj >= d && reloj <= h;
    // Tramo que pasa la medianoche (ej. 24:00 → 05:00)
    return reloj >= d || reloj <= h;
  }

  /**
   * Segundos desde medianoche de un valor TIME. Acepta 'HH:MM:SS',
   * 'HH:MM' y también '24:00:00' (= 86400). Devuelve **-1** si no es válido.
   */
  private segundosDeHora(valor?: string | null): number {
    if (!valor) return -1;
    const partes = valor.split(':');
    if (partes.length < 2) return -1;
    const h = parseInt(partes[0], 10);
    const m = parseInt(partes[1], 10);
    const s = partes.length > 2 ? parseInt(partes[2], 10) : 0;
    if (Number.isNaN(h) || Number.isNaN(m)) return -1;
    return h * 3600 + m * 60 + (Number.isNaN(s) ? 0 : s);
  }

  /** Redondeo comercial a N decimales (con ajuste de error de punto flotante). */
  private redondear(valor: number, decimales: number): number {
    const f = Math.pow(10, decimales);
    return Math.round((valor + Number.EPSILON) * f) / f;
  }

  /** Crea una línea del detalle validando duplicado (UNIQUE) y empleado. */
  private async crearLineaAuthoraEx(
    pleauthoraexmaeid: number,
    empresaId: number,
    linea: { empleadoId: number; departamentoId?: number; sn_pagar?: string },
    currentUser: string,
    fecha: Date,
  ): Promise<PlAuthoraExDet> {
    const duplicado = await this.authoraexDetRepo.findOne({
      where: { pleauthoraexmaeid, empleadoId: linea.empleadoId, empresaId },
    });
    if (duplicado) {
      throw new ConflictException(
        'El empleado ya está autorizado en esta solicitud de horas extras',
      );
    }
    // La FK exige un empleado real de la empresa: lo validamos explícitamente
    // para devolver un 404 claro en vez de un 500 por constraint.
    await this.findOneById(this.empleadoRepo, 'empleadoId', linea.empleadoId, empresaId, 'Empleado');

    const payload: DeepPartial<PlAuthoraExDet> = {
      pleauthoraexmaeid,
      empleadoId: linea.empleadoId,
      departamentoId: linea.departamentoId,
      sn_pagar: linea.sn_pagar ?? 'S',
      empresaId,
      usuarioCreated: currentUser,
      fechaCreated: fecha,
      fecharegistro: fecha,
    };
    return this.authoraexDetRepo.save(this.authoraexDetRepo.create(payload));
  }

  /**
   * Convierte lo recibido (string 'YYYY-MM-DD', ISO con Z o Date) a la
   * **MEDIANOCHE LOCAL** de esa fecha.
   *
   * Motivo: `new Date('2026-10-16')` se resuelve en UTC; en Honduras (UTC-6)
   * eso cae en 15/oct 18:00, y un `setHours(0,0,0,0)` / `setHours(23,59,59,999)`
   * posterior desplazaba el rango un día hacia atrás y perdía la última fecha.
   */
  private fechaLocal(valor: unknown): Date {
    if (valor instanceof Date) {
      return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
    }
    const texto = String(valor).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      const [y, m, d] = texto.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(texto);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(`Fecha inválida: ${texto}`);
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  /** `fecha_desde` y `fecha_hasta` van juntas y en orden. */
  private validarRangoFechas(desde: unknown, hasta: unknown) {
    if ((desde && !hasta) || (!desde && hasta)) {
      throw new BadRequestException(
        'La autorización debe definir AMBAS fechas del rango: fecha_desde y fecha_hasta.',
      );
    }
    if (desde && hasta && new Date(String(desde)) > new Date(String(hasta))) {
      throw new BadRequestException('fecha_desde no puede ser posterior a fecha_hasta.');
    }
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
    let nroplanilla = dto.nroplanilla;
    if (!nroplanilla) {
      try {
        nroplanilla = await this.correlativos.siguienteString('nroplanilla', dto.empresaId, currentUser, 6);
      } catch {
        const count = await this.plamaeRepo.count({ where: { empresaId: dto.empresaId } });
        nroplanilla = String(count + 1).padStart(6, '0');
      }
    }

    const payload: any = {
      ...dto,
      nroplanilla,
      // `partidaId` es NOT NULL sin default en la BD (STRICT): sin este valor
      // todo INSERT de planilla falla con 500. Nueva planilla = sin partida.
      partidaId: 0,
      sn_autorizada: 'N',
      sn_contabilizada: 'N',
    };

    return this.createEntity(this.plamaeRepo, payload, currentUser);
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

  // ── FLUJO Generar → Autorizar pago → Contabilizar ─────────────────────────

  /**
   * Saldo disponible de una cuenta bancaria (`bcosctas`), con la MISMA
   * convención que `BancosService.calcularSaldoCta`:
   * saldo = Σ Débitos − Σ Créditos de `bcosmovimientos` no anulados.
   * (Copia de `bancos.service.ts:279` para no acoplar módulos.)
   */
  private async calcularSaldoCta(bcoctasId: number, empresaId: number): Promise<number> {
    const row = await this.bcoMovRepo
      .createQueryBuilder('m')
      .select(
        "COALESCE(SUM(CASE WHEN m.dc_debitocredito = 'D' THEN m.importe ELSE -m.importe END), 0)",
        'saldo',
      )
      .where('m.bcoctasId = :bcoctasId', { bcoctasId })
      .andWhere('m.empresaId = :empresaId', { empresaId })
      .andWhere("m.sn_doc_anulado = 'N'")
      .getRawOne();
    return Math.round(Number(row?.saldo || 0) * 100) / 100;
  }

  /**
   * **Paso 2 del flujo — Autorizar pago de planilla.**
   *
   * Marca `sn_autorizada='S'`. No mueve dinero ni toca contabilidad: es la
   * aprobación previa que habilita la contabilización (la partida contable
   * se crea en el paso 3, `contabilizarPlanilla`).
   *
   * Validaciones: exista, no anulada, no pagada, con líneas generadas y que
   * aún no esté autorizada.
   */
  async autorizarPlanilla(planillaId: number, currentUser: string) {
    const planilla = await this.plamaeRepo.findOne({ where: { planillaId } });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');
    if (planilla.sn_anulada === 'S') {
      throw new BadRequestException('La planilla está anulada: no se puede autorizar.');
    }
    if (planilla.sn_pagada === 'S') {
      throw new BadRequestException('La planilla ya está pagada: no se puede autorizar.');
    }
    if (planilla.sn_autorizada === 'S') {
      throw new BadRequestException('La planilla ya está autorizada.');
    }
    if (Number(planilla.items) <= 0) {
      throw new BadRequestException('La planilla no tiene líneas: genere la planilla antes de autorizarla.');
    }

    const fecha = await this.fechaSistema.getFecha(planilla.empresaId);
    planilla.sn_autorizada = 'S';
    planilla.usuarioUpdated = currentUser;
    planilla.fechaUpdated = fecha;
    await this.plamaeRepo.save(planilla);
    return planilla;
  }

  /**
   * **Paso 3 del flujo — Contabilizar planilla.**
   *
   * Valida el flujo y los **FONDOS de la cuenta bancaria seleccionada**
   * (pedido explícito 20/10/2026): el saldo disponible de `bcosctas` debe
   * alcanzar el total a pagar; si no, 400 con saldo vs requerido.
   *
   * Después **crea la partida contable real** (`copdamae` + `copdadet` +
   * posteo a `coctamov`/`coctasaldos`) con la plantilla PDA 21 "Pago de
   * planilla" (diseño del Excel `partidaplanilla.xlsx`, 21/10/2026) y deja
   * `partidaId` poblado en la planilla.
   *
   * Regla de cuadre (decisión del usuario: "estima el techo, pero igual
   * tiene que cuadrar"): IHSS/RAP patronales se calculan sobre
   * mín(sueldo, `techoseguro`), los pares D/C (IHSS/RAP emp y patronal)
   * llevan el MISMO importe en ambos lados y el neto por pagar (fila 13)
   * no descuenta deducciones ni comisiones → Debe = Haber por construcción.
   *
   * Validaciones: exista, no anulada, no pagada, con líneas, **autorizada**
   * (secuencia Generar → Autorizar → Contabilizar), aún no contabilizada y
   * sin partida previa.
   */
  async contabilizarPlanilla(planillaId: number, currentUser: string) {
    const planilla = await this.plamaeRepo.findOne({ where: { planillaId } });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');
    if (planilla.sn_anulada === 'S') {
      throw new BadRequestException('La planilla está anulada: no se puede contabilizar.');
    }
    if (planilla.sn_pagada === 'S') {
      throw new BadRequestException('La planilla ya está pagada: no se puede contabilizar.');
    }
    if (planilla.sn_contabilizada === 'S') {
      throw new BadRequestException('La planilla ya está contabilizada.');
    }
    if (Number(planilla.items) <= 0) {
      throw new BadRequestException('La planilla no tiene líneas: genere la planilla antes de contabilizarla.');
    }
    if (planilla.sn_autorizada !== 'S') {
      throw new BadRequestException('La planilla no está autorizada: primero use "Autorizar pago de planilla".');
    }
    if (Number(planilla.partidaId) > 0) {
      throw new BadRequestException(`La planilla ya tiene la partida contable #${planilla.partidaId}.`);
    }

    // ── FONDOS: la cuenta bancaria seleccionada debe alcanzar el total ──
    const total = Math.round(Number(planilla.totalapagar) || 0);
    const saldo = await this.calcularSaldoCta(planilla.bcoctasId, planilla.empresaId);
    if (saldo < total) {
      throw new BadRequestException(
        `Fondos insuficientes en la cuenta bancaria seleccionada: `
        + `saldo disponible L ${saldo.toFixed(2)}, total a pagar L ${total.toFixed(2)}.`,
      );
    }

    // ── ACUMULADOS PARA LA PARTIDA (plantilla 21) ──
    const empresaId = planilla.empresaId;
    const periodo = Number(planilla.periodo);
    const anio = Number(planilla.anio);
    const red = (x: number) => Math.round(x * 100) / 100;

    // Catálogos de rubros (mismas tasas que `generarPlanilla`)
    const tipos = await this.tipoMovRepo.find({
      where: { empresaId },
      order: { tipomovId: 'ASC' },
    });
    const movIhss = tipos.find((d) => this.esIhss(d)) ?? null;
    const movRap = tipos.find((d) => this.esRap(d)) ?? null;
    const tasaIhss = movIhss ? Number(movIhss.importe ?? 0) : 0;
    const tasaPatronIhss = movIhss ? Number(movIhss.imppatron ?? 0) : 0;
    const tasaRap = movRap ? Number(movRap.importe ?? 0) : 0;
    const tasaPatronRap = movRap ? Number(movRap.imppatron ?? 0) : 0;
    // Reserva patronal 4% = imppatron RAP (5.5%) − empleado RAP (1.5%)
    const tasaReserva = Math.max(0, tasaPatronRap - tasaRap);

    // Empleados (techoseguro + depto fallback) y departamento de Ventas
    const empleados = await this.empleadoRepo.find({ where: { empresaId } });
    const empMap = new Map(empleados.map((e) => [e.empleadoId, e]));
    const deptos = await this.deptoRepo.find({ where: { empresaId } });
    const deptoVentas =
      deptos.find((d) => (d.descripcion || '').trim().toUpperCase().includes('VENTA')) ?? null;

    const lineas = await this.pladetRepo.find({ where: { planillaId, empresaId } });
    if (!lineas.length) {
      throw new BadRequestException('La planilla no tiene líneas de detalle para contabilizar.');
    }

    const ac: PartidaPlanillaImportes = {
      sbAdmon: 0, sbVentas: 0, heAdmon: 0, heVentas: 0, bonosAdmon: 0, bonosVentas: 0,
      comisiones: 0, otrasDed: 0, isr: 0, vecinal: 0, ihssEmp: 0, rapEmp: 0,
      ihssPat: 0, rapVivPat: 0, rapResPat: 0,
    };
    for (const l of lineas) {
      const bruto = Number(l.sueldobruto) || 0;
      const emp = empMap.get(l.empleadoId);
      const deptoId = l.departamentoId ?? emp?.deptoId ?? null;
      const esVentas = deptoVentas != null && deptoId === deptoVentas.tpldeptosId;
      const he = Number(l.importe_chorasextras) || 0;
      const bonos = Number(l.importe_cbonos) || 0;
      if (esVentas) {
        ac.sbVentas += bruto;
        ac.heVentas += he;
        ac.bonosVentas += bonos;
      } else {
        ac.sbAdmon += bruto;
        ac.heAdmon += he;
        ac.bonosAdmon += bonos;
      }
      // Comisiones siempre a la cuenta de ventas (5-1-20-002) — regla del Excel
      ac.comisiones += Number(l.importe_ccomision) || 0;
      // Otras deducciones siempre a la cuenta de admón (5-1-10-002) — regla del Excel
      ac.otrasDed += Number(l.importe_dotras) || 0;
      ac.isr += Number(l.importe_drtf) || 0;
      ac.vecinal += Number(l.importe_drvc) || 0;
      // IHSS/RAP empleado: ya descontados en la generación (mismas fórmulas con techo)
      ac.ihssEmp += Number(l.importe_dihss) || 0;
      ac.rapEmp += Number(l.importe_drap) || 0;

      // Patronales: se recalculan aquí con la MISMA fórmula que `generarPlanilla`
      // (IHSS con techo; RAP vivienda sobre excedente; reserva sobre bruto)
      const techo = Number(emp?.techoseguro ?? 0) || 0;
      const baseIHSS = techo > 0 && bruto > techo ? techo : bruto;
      ac.ihssPat += red(baseIHSS * (tasaPatronIhss / 100));
      const excedente = techo > 0 && bruto > techo ? bruto - techo : 0;
      ac.rapVivPat += red(excedente * (tasaRap / 100));
      ac.rapResPat += red(bruto * (tasaReserva / 100));
    }
    for (const k of Object.keys(ac) as (keyof PartidaPlanillaImportes)[]) {
      ac[k] = red(ac[k]);
    }

    // ── CREAR LA PARTIDA (PDA 21) + posteo al mayor ──
    const partida = await this.contabilidadLogica.crearPartidaPlanilla(
      {
        empresaId,
        periodo,
        anio,
        plantillaId: 21, // "Pago de planilla" en tcoplantillapdamae
        nroreferencia: `PLANILLA-${planilla.nroplanilla}`,
        descripcion: `Pago de planilla ${planilla.nroplanilla} período ${periodo}/${anio}`,
        importes: ac,
      },
      currentUser,
    );

    // ── Marcar la planilla con su partida ──
    const fecha = await this.fechaSistema.getFecha(empresaId);
    await this.plamaeRepo
      .createQueryBuilder()
      .update()
      .set({
        partidaId: partida.partidaId,
        sn_contabilizada: 'S',
        usuarioUpdated: currentUser,
        fechaUpdated: fecha,
      })
      .where('planillaId = :planillaId', { planillaId })
      .execute();

    planilla.partidaId = partida.partidaId;
    planilla.sn_contabilizada = 'S';
    planilla.usuarioUpdated = currentUser;
    planilla.fechaUpdated = fecha;
    return planilla;
  }

  // ── GENERACIÓN DE PLANILLA (cálculos completos) ──────────────────────────

  /** Lee un parámetro activo de `ttipoparametros` (patrón cxp/contabilidad). */
  private async getValorParametro(
    empresaId: number,
    field: string,
    defaultValue = '',
  ): Promise<string> {
    try {
      const param = await this.tipoParametroRepo.findOne({
        where: { empresaId, field, sn_activo: 'S' } as unknown as FindOptionsWhere<TipoParametro>,
      });
      return param ? param.valor : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /** Convierte un nombre de mes en español ('ABRIL') a número (4). Default si no reconoce. */
  private mesDeParam(valor: string, porDefecto: number): number {
    const MESES: Record<string, number> = {
      ENERO: 1, FEBRERO: 2, MARZO: 3, ABRIL: 4, MAYO: 5, JUNIO: 6,
      JULIO: 7, AGOSTO: 8, SEPTIEMBRE: 9, SETIEMBRE: 9, OCTUBRE: 10,
      NOVIEMBRE: 11, DICIEMBRE: 12,
    };
    return MESES[(valor || '').trim().toUpperCase()] ?? porDefecto;
  }

  /**
   * Horas extras por empleado para un período CONCRETO, calculadas desde la
   * fuente real (`pleauthoraexmae`/det + asistencia + tramos).
   *
   * A diferencia de `pletipomov` (que guarda solo el último mes calculado y
   * re-usaría el valor de otro mes), este método es PERIODO-ESPECÍFICO y
   * devuelve un mapa VACÍO si el período no tiene autorizaciones (sin error),
   * para que `generarPlanilla` pueda usarse en cualquier mes.
   */
  private async hePorPeriodo(
    empresaId: number,
    anio: number,
    periodo: number,
  ): Promise<Map<number, number>> {
    const resultado = new Map<number, number>();
    const autorizaciones = await this.authoraexMaeRepo.find({
      where: { empresaId, anio_ejercicio: anio, periodo },
      order: { pleauthoraexmaeid: 'ASC' },
    });
    if (!autorizaciones.length) return resultado;

    const detalles = await this.authoraexDetRepo.find({
      where: {
        pleauthoraexmaeid: In(autorizaciones.map((a) => a.pleauthoraexmaeid)),
        empresaId,
        sn_pagar: 'S',
      },
    });
    if (!detalles.length) return resultado;

    const tramos = await this.horasExtrasRepo.find({
      where: { empresaId, sn_activo: 'S' },
      order: { desde: 'ASC', horaextraId: 'ASC' },
    });
    const cfgTramos: TramoCfg[] = tramos
      .map((t) => ({
        horaextraId: t.horaextraId,
        descripcion: (t.descripcion || '').replace(/:\s*$/, '').trim(),
        desde: t.desde,
        hasta: t.hasta,
        tasa: Number(t.tasa ?? 0),
        desdeSeg: this.segundosDeHora(t.desde),
        hastaSeg: this.segundosDeHora(t.hasta),
      }))
      .filter((t) => t.desdeSeg >= 0 && t.hastaSeg >= 0);
    if (!cfgTramos.length) return resultado;

    type Rango = { au: PlAuthoraExMae; desde: Date; hasta: Date };
    const rangos: Rango[] = [];
    for (const au of autorizaciones) {
      if (!au.fecha_desde || !au.fecha_hasta) continue;
      const desde = this.fechaLocal(au.fecha_desde);
      desde.setHours(0, 0, 0, 0);
      const hasta = this.fechaLocal(au.fecha_hasta);
      hasta.setHours(23, 59, 59, 999);
      rangos.push({ au, desde, hasta });
    }
    if (!rangos.length) return resultado;

    const empleadosPorAuth = new Map<number, number[]>();
    for (const d of detalles) {
      const ids = empleadosPorAuth.get(d.pleauthoraexmaeid) ?? [];
      ids.push(d.empleadoId);
      empleadosPorAuth.set(d.pleauthoraexmaeid, ids);
    }

    const desdeGlobal = new Date(Math.min(...rangos.map((r) => r.desde.getTime())));
    const hastaGlobal = new Date(Math.max(...rangos.map((r) => r.hasta.getTime())));
    const asistencias = await this.asistenciaRepo.find({
      where: { empresaId, fecharegistro: Between(desdeGlobal, hastaGlobal) },
      order: { plempleadosasistenciaId: 'ASC' },
    });
    const asisPorEmpleado = new Map<number, PlAsistencia[]>();
    for (const a of asistencias) {
      const lista = asisPorEmpleado.get(a.empleadoId) ?? [];
      lista.push(a);
      asisPorEmpleado.set(a.empleadoId, lista);
    }

    const contados = new Map<number, Map<number, PlAsistencia>>();
    for (const { au, desde, hasta } of rangos) {
      const ids = empleadosPorAuth.get(au.pleauthoraexmaeid) ?? [];
      for (const empleadoId of ids) {
        const mapa = contados.get(empleadoId) ?? new Map<number, PlAsistencia>();
        for (const a of asisPorEmpleado.get(empleadoId) ?? []) {
          const fecha = this.fechaLocal(a.fecharegistro).getTime();
          if (fecha < desde.getTime() || fecha > hasta.getTime()) continue;
          if (mapa.has(a.plempleadosasistenciaId)) continue;
          mapa.set(a.plempleadosasistenciaId, a);
        }
        if (mapa.size) contados.set(empleadoId, mapa);
      }
    }
    if (!contados.size) return resultado;

    const empleados = await this.empleadoRepo.find({
      where: { empresaId, empleadoId: In([...contados.keys()]) },
    });
    const mapaEmpleados = new Map<number, PlEmpleados>(
      empleados.map((e) => [e.empleadoId, e]),
    );

    for (const [empleadoId, mapaAsis] of contados) {
      const emp = mapaEmpleados.get(empleadoId);
      if (!emp) continue;
      const jornada = HORAS_JORNADA[emp.sn_jornada ?? 'D'] ?? 8;
      const sueldo = Number(emp.sueldobruto ?? 0);
      const valorHora = sueldo > 0 ? sueldo / 30 / jornada : 0;
      const accPorTramo = new Map<number, number>();
      for (const a of mapaAsis.values()) {
        const clasif = this.clasificarHorasExtras(a, cfgTramos);
        for (const [tramoId, min] of clasif.porTramo) {
          accPorTramo.set(tramoId, (accPorTramo.get(tramoId) ?? 0) + min);
        }
      }
      let importe = 0;
      for (const t of cfgTramos) {
        const min = accPorTramo.get(t.horaextraId) ?? 0;
        if (!min) continue;
        const base = valorHora * (min / 60);
        importe += this.redondear(base * (1 + t.tasa / 100), 2);
      }
      resultado.set(empleadoId, this.redondear(importe, 2));
    }
    return resultado;
  }

  /**
   * GENERACIÓN DE PLANILLA — proceso completo de cálculo (decisión 20/10/2026).
   *
   * Reglas aprobadas por el arquitecto:
   *  - IHSS  = tasa % del catálogo × MÍN(sueldobruto, `plempleados.techoseguro`)
   *            (helper `calcularAportacion`; techo 11,903.13 en los empleados).
   *  - RAP   = vivienda % sobre el EXCEDENTE del sueldo sobre el techo
   *            (helper `calcularRap`) — misma fórmula de los importes ya
   *            registrados en pletipomov (ej. emp1: 1.5% × 13,096.87 = 196.45).
   *  - RTF   = `pletipomov` (tipo renta, anual) ÷ 12, desde el mes del param
   *            `APLICAR_RETENCION_ENFUENTE_EN_ABRIL` en adelante.
   *  - Vecinal = `pletipomov` (tipo vecinal, anual) ÷ 12, desde el mes del param
   *            `APLICAR_RETENCION_VECINAL_EN_MAYO` en adelante. RTF + vecinal
   *            se acumulan en `importe_drtf` (ambas son retenciones).
   *  - Otras deducciones (`importe_dotras`) = `plededucciones` activas del
   *    empleado: tipo 'F' = importe fijo (columna `porcentaje`), 'P' = % del sueldo.
   *  - Comisión = tramo NO progresivo de `tplcomision` que contiene el total de
   *    ventas del período (`pleingresos` concepto COMISION); ventas > último
   *    tramo → se usa el último tramo activo.
   *  - Bono = `pleingresos` concepto BONO del período (importe directo).
   *  - HE = importe de horas extras recalculado DESDE LA FUENTE del período
   *    (`pleauthoraexmae`/det + asistencia + tramos vía `hePorPeriodo`) —
   *    NO se lee `pletipomov` (que guarda solo el último mes calculado y
   *    re-usaría el valor de otro mes en un período distinto).
   *  - Neto = sueldo + HE + comisión + bono − (IHSS + RAP + RTF + vecinal + otras).
   *  - Décimo especial: si el mes de la planilla coincide con
   *    `13AVO_APLICA_EN_DICIEMBRE` / `14AVO_APLICARA_EN_JUNIO` se crea (o
   *    regenera) AUTOMÁTICAMENTE una segunda planilla del mismo período
   *    (`ESP-13AVO-12-2026`) con el importe anual registrado en `pletipomov`
   *    (rubro 13avo/14avo) como sueldobruto = neto, SIN deducciones.
   *
   * Reemplaza TODAS las líneas de la planilla por los empleados activos.
   */
  async generarPlanilla(planillaId: number, currentUser: string) {
    const planilla = await this.plamaeRepo.findOne({ where: { planillaId } });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');
    const empresaId = planilla.empresaId;
    if (planilla.sn_anulada === 'S') {
      throw new BadRequestException('La planilla está anulada: no se puede generar.');
    }
    if (planilla.sn_pagada === 'S') {
      throw new BadRequestException('La planilla está pagada: no se puede generar.');
    }

    const fecha = await this.fechaSistema.getFecha(empresaId);
    const periodo = Number(planilla.periodo);
    const anio = Number(planilla.anio);

    // ── Catálogos de rubros (tasa en `importe` de tpltipomov) ──
    const tipos = await this.tipoMovRepo.find({
      where: { empresaId },
      order: { tipomovId: 'ASC' },
    });
    const movIhss = tipos.find((d) => this.esIhss(d)) ?? null;
    const movRap = tipos.find((d) => this.esRap(d)) ?? null;
    const movRtf = tipos.find((d) => this.esRetencionIsr(d)) ?? null;
    const movVecinal = tipos.find((d) => this.esRetencionVecinal(d)) ?? null;
    const mov13 = tipos.find((d) => this.esDecimoTercer(d)) ?? null;
    const mov14 = tipos.find((d) => this.esDecimoCuarto(d)) ?? null;

    const tasaIhss = movIhss ? Number(movIhss.importe ?? 0) : 0;
    const tasaPatronIhss = movIhss ? Number(movIhss.imppatron ?? 0) : 0;
    const tasaRap = movRap ? Number(movRap.importe ?? 0) : 0;
    const tasaPatronRap = movRap ? Number(movRap.imppatron ?? 0) : 0;

    // ── Parámetros (ttipoparametros, módulo planilla) ──
    // El TECHO de IHSS/RAP se toma de `plempleados.techoseguro` (columna
    // por empleado, hoy 11,903.13 = param techo_maximo_ihss) vía los helpers
    // calcularAportacion/calcularRap, documentados con el ejemplo del usuario.
    const mesRtf = this.mesDeParam(
      await this.getValorParametro(empresaId, 'APLICAR_RETENCION_ENFUENTE_EN_ABRIL', 'ABRIL'),
      4,
    );
    const mesVecinal = this.mesDeParam(
      await this.getValorParametro(empresaId, 'APLICAR_RETENCION_VECINAL_EN_MAYO', 'MAYO'),
      5,
    );
    const mes13 = this.mesDeParam(
      await this.getValorParametro(empresaId, '13AVO_APLICA_EN_DICIEMBRE', 'DICIEMBRE'),
      12,
    );
    const mes14 = this.mesDeParam(
      await this.getValorParametro(empresaId, '14AVO_APLICARA_EN_JUNIO', 'JUNIO'),
      6,
    );

    // ── Empleados activos ──
    const empleados = await this.empleadoRepo.find({
      where: { empresaId, sn_activo: 'S' },
      order: { empleadoId: 'ASC' },
    });
    if (!empleados.length) {
      throw new BadRequestException('No hay empleados activos para generar la planilla.');
    }

    // ── Movimientos por empleado (pletipomov activos) ──
    const movs = await this.plTipoMovRepo.find({ where: { empresaId, sn_activo: 'S' } });
    const movsPorEmp = new Map<number, PlTipoMov[]>();
    for (const m of movs) {
      const lista = movsPorEmp.get(m.empleadoId) ?? [];
      lista.push(m);
      movsPorEmp.set(m.empleadoId, lista);
    }

    // ── Ingresos autorizados del período (comisiones y bonos) ──
    const ingresos = await this.pleIngresosRepo.find({
      where: {
        empresaId,
        sn_activo: 'S',
        anio_ejercicio: anio,
        periodo,
      } as unknown as FindOptionsWhere<PlIngresos>,
    });
    const ventasPorEmp = new Map<number, number>();
    const bonosPorEmp = new Map<number, number>();
    for (const ing of ingresos) {
      const importe = Number(ing.importe ?? 0);
      const clave = (ing.concepto || '').trim().toUpperCase();
      const mapa = clave === 'BONO' ? bonosPorEmp : ventasPorEmp;
      mapa.set(ing.empleadoId, (mapa.get(ing.empleadoId) ?? 0) + importe);
    }

    // ── Tramos de comisión (único tramo = no progresivo) ──
    const tramosCom = (await this.comisionRepo.find({ where: { empresaId, sn_activo: 'S' } })).sort(
      (a, b) => Number(a.desde) - Number(b.desde),
    );

    // ── Otras deducciones activas por empleado (plededucciones) ──
    const deducciones = await this.deduccionEmpRepo.find({ where: { empresaId, sn_activo: 'S' } });
    const deducPorEmp = new Map<number, PlDeducciones[]>();
    for (const d of deducciones) {
      const lista = deducPorEmp.get(d.empleadoId) ?? [];
      lista.push(d);
      deducPorEmp.set(d.empleadoId, lista);
    }

    // ── Horas extras del PERÍODO desde su fuente (autorizaciones + asistencia) ──
    // Mapa vacío si el período no tiene autorizaciones → HE = 0 en todas las líneas.
    const hePorEmp = await this.hePorPeriodo(empresaId, anio, periodo);

    // ── Cálculo por empleado ──
    const red = (x: number) => Math.round(x * 100) / 100;
    type LineaGen = {
      empleadoId: number;
      departamentoId: number | null;
      sueldobruto: number;
      importe_dihss: number;
      importe_drap: number;
      importe_drtf: number;
      importe_drvc: number;
      importe_dotras: number;
      importe_ccomision: number;
      importe_chorasextras: number;
      importe_cbonos: number;
      sueldoneto: number;
    };
    const lineas: LineaGen[] = [];
    const totales = {
      sueldobruto: 0,
      ihss: 0,
      rap: 0,
      rtf: 0,
      vecinal: 0,
      dotras: 0,
      comision: 0,
      horasExtras: 0,
      bonos: 0,
      neto: 0,
    };
    /** Importe anual del décimo registrado por empleado (planilla especial). */
    const decimoPorEmp = new Map<number, number>();

    for (const e of empleados) {
      const sueldo = Number(e.sueldobruto ?? 0);
      const filasMov = movsPorEmp.get(e.empleadoId) ?? [];
      const impDe = (tipomovId: number | null | undefined) =>
        tipomovId != null
          ? Number(filasMov.find((m) => m.tipomovId === tipomovId)?.importe ?? 0)
          : 0;

      // IHSS: % del empleado sobre MÍN(sueldo, techoseguro) — helper existente
      const ihss = movIhss
        ? red(this.calcularAportacion(e, tasaIhss, tasaPatronIhss, {
            conTecho: true,
            desglosaSaludIvm: false,
          }).empleado)
        : 0;
      // RAP: vivienda % sobre el EXCEDENTE del sueldo sobre el techo —
      // helper existente (calcularRap), misma fórmula de los importes registrados
      const rap = movRap ? red(this.calcularRap(e, tasaRap, tasaPatronRap).empleado) : 0;

      // Retenciones anuales ÷ 12, desde el mes del parámetro en adelante
      const rtf =
        movRtf != null && periodo >= mesRtf ? red(impDe(movRtf.tipomovId) / 12) : 0;
      const vecinal =
        movVecinal != null && periodo >= mesVecinal
          ? red(impDe(movVecinal.tipomovId) / 12)
          : 0;

      // Otras deducciones: plededucciones activas (F: importe fijo · P: % sueldo)
      let dotras = 0;
      for (const d of deducPorEmp.get(e.empleadoId) ?? []) {
        const valor = Number(d.porcentaje ?? 0);
        dotras += d.tipodeduccion === 'P' ? (valor / 100) * sueldo : valor;
      }
      dotras = red(dotras);

      // Comisión: tramo de tplcomision sobre las ventas autorizadas del período
      const ventas = red(ventasPorEmp.get(e.empleadoId) ?? 0);
      let ccomision = 0;
      if (ventas > 0 && tramosCom.length) {
        const tramo =
          tramosCom.find((t) => ventas >= Number(t.desde) && ventas <= Number(t.hasta)) ??
          (ventas > Number(tramosCom[tramosCom.length - 1].hasta)
            ? tramosCom[tramosCom.length - 1]
            : null);
        if (tramo) ccomision = red(ventas * (Number(tramo.tasa ?? 0) / 100));
      }

      const bonos = red(bonosPorEmp.get(e.empleadoId) ?? 0);
      // HE recalculadas desde la fuente del período (pleauthoraexmae), no de pletipomov
      const horasExtras = red(hePorEmp.get(e.empleadoId) ?? 0);
      const neto = red(sueldo + horasExtras + ccomision + bonos - (ihss + rap + rtf + vecinal + dotras));

      lineas.push({
        empleadoId: e.empleadoId,
        departamentoId: e.deptoId ?? null,
        sueldobruto: sueldo,
        importe_dihss: ihss,
        importe_drap: rap,
        // RTF = solo ISR. El Impuesto Vecinal va en su propia columna
        // importe_drvc (antes venía mezclado aquí: red(rtf + vecinal)).
        importe_drtf: rtf,
        importe_drvc: vecinal,
        importe_dotras: dotras,
        importe_ccomision: ccomision,
        importe_chorasextras: horasExtras,
        importe_cbonos: bonos,
        sueldoneto: neto,
      });

      totales.sueldobruto = red(totales.sueldobruto + sueldo);
      totales.ihss = red(totales.ihss + ihss);
      totales.rap = red(totales.rap + rap);
      totales.rtf = red(totales.rtf + rtf);
      totales.vecinal = red(totales.vecinal + vecinal);
      totales.dotras = red(totales.dotras + dotras);
      totales.comision = red(totales.comision + ccomision);
      totales.horasExtras = red(totales.horasExtras + horasExtras);
      totales.bonos = red(totales.bonos + bonos);
      totales.neto = red(totales.neto + neto);

      // Décimo especial (13avo/14avo): importe anual registrado en pletipomov
      const movDecimo = periodo === mes13 ? mov13 : periodo === mes14 ? mov14 : null;
      if (movDecimo) {
        const importeDecimo = red(impDe(movDecimo.tipomovId));
        if (importeDecimo > 0) decimoPorEmp.set(e.empleadoId, importeDecimo);
      }
    }

    // ── Planilla especial del décimo (si el mes corresponde) ──
    const etiquetaDecimo = periodo === mes13 && mov13 ? '13AVO' : periodo === mes14 && mov14 ? '14AVO' : null;
    const filasDecimo = etiquetaDecimo
      ? [...decimoPorEmp.entries()].map(([empleadoId, importe]) => ({
          empleadoId,
          departamentoId: lineas.find((l) => l.empleadoId === empleadoId)?.departamentoId ?? null,
          importe,
        }))
      : [];
    const totalDecimo = red(filasDecimo.reduce((s, f) => s + f.importe, 0));
    const nroEspecial = etiquetaDecimo ? `ESP-${etiquetaDecimo}-${periodo}-${anio}` : null;

    // ── Escritura en transacción ──
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    let decimoPlanillaId: number | null = null;
    try {
      // 1) Reemplazar TODAS las líneas de la planilla
      await qr.manager
        .createQueryBuilder()
        .delete()
        .from(PlPlaDet)
        .where('planillaId = :id', { id: planillaId })
        .execute();
      for (const l of lineas) {
        await qr.manager.insert(PlPlaDet, {
          planillaId,
          fecharegistro: fecha,
          empleadoId: l.empleadoId,
          departamentoId: l.departamentoId,
          sueldobruto: l.sueldobruto,
          importe_dihss: l.importe_dihss,
          importe_drap: l.importe_drap,
          importe_drtf: l.importe_drtf,
          importe_drvc: l.importe_drvc,
          importe_dotras: l.importe_dotras,
          importe_ccomision: l.importe_ccomision,
          importe_chorasextras: l.importe_chorasextras,
          importe_cbonos: l.importe_cbonos,
          sueldoneto: l.sueldoneto,
          sn_pagar: 'S',
          empresaId,
          usuarioCreated: currentUser,
        } as DeepPartial<PlPlaDet>);
      }

      // 2) Totales de la cabecera (totalapagar es INT en la BD)
      await qr.manager
        .createQueryBuilder()
        .update(PlPlaMae)
        .set({
          items: lineas.length,
          totalapagar: Math.round(totales.neto),
          usuarioUpdated: currentUser,
          fechaUpdated: fecha,
        })
        .where('planillaId = :id', { id: planillaId })
        .execute();

      // 3) Planilla especial del décimo (idempotente: crea o regenera)
      if (etiquetaDecimo && nroEspecial) {
        const existente = await qr.manager.findOne(PlPlaMae, {
          where: { empresaId, nroplanilla: nroEspecial },
        });
        if (existente) {
          if (existente.sn_pagada === 'S') {
            throw new BadRequestException(
              `La planilla especial ${nroEspecial} ya está pagada: no se puede regenerar.`,
            );
          }
          if (existente.sn_anulada === 'S') {
            throw new BadRequestException(
              `La planilla especial ${nroEspecial} está anulada: no se puede regenerar.`,
            );
          }
          decimoPlanillaId = existente.planillaId;
          await qr.manager
            .createQueryBuilder()
            .delete()
            .from(PlPlaDet)
            .where('planillaId = :id', { id: decimoPlanillaId })
            .execute();
        } else {
          const creada = await qr.manager.insert(PlPlaMae, {
            nroplanilla: nroEspecial,
            fecharegistro: fecha,
            periodo,
            anio,
            bcoctasId: planilla.bcoctasId,
            items: 0,
            partidaId: 0,
            sn_pagada: 'N',
            sn_anulada: 'N',
            empresaId,
            usuarioCreated: currentUser,
          } as DeepPartial<PlPlaMae>);
          decimoPlanillaId = Number(creada.identifiers[0].planillaId);
        }
        for (const f of filasDecimo) {
          await qr.manager.insert(PlPlaDet, {
            planillaId: decimoPlanillaId,
            fecharegistro: fecha,
            empleadoId: f.empleadoId,
            departamentoId: f.departamentoId,
            sueldobruto: f.importe,
            importe_dihss: 0,
            importe_drap: 0,
            importe_drtf: 0,
            importe_drvc: 0,
            importe_dotras: 0,
            importe_ccomision: 0,
            importe_chorasextras: 0,
            importe_cbonos: 0,
            sueldoneto: f.importe,
            sn_pagar: 'S',
            empresaId,
            usuarioCreated: currentUser,
          } as DeepPartial<PlPlaDet>);
        }
        await qr.manager
          .createQueryBuilder()
          .update(PlPlaMae)
          .set({
            items: filasDecimo.length,
            totalapagar: Math.round(totalDecimo),
            usuarioUpdated: currentUser,
            fechaUpdated: fecha,
          })
          .where('planillaId = :id', { id: decimoPlanillaId })
          .execute();
      }

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    return {
      planillaId,
      periodoTexto: `${periodo}/${anio}`,
      empleadosCalculados: lineas.length,
      lineasCreadas: lineas.length,
      totales,
      decimo: etiquetaDecimo
        ? {
            aplicado: true,
            tipo: etiquetaDecimo,
            nroplanilla: nroEspecial,
            planillaEspecialId: decimoPlanillaId,
            empleados: filasDecimo.length,
            total: totalDecimo,
          }
        : { aplicado: false as const },
    };
  }

  async findAllPuestos(empresaId: number) {
    return this.findAllByEmpresa(this.puestoRepo, empresaId);
  }

  /** Departamentos de planilla (`tpldeptos`) de la empresa, ordenados por descripción. */
  async findAllDeptos(empresaId: number) {
    return this.deptoRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<TplDepto>,
      order: { descripcion: 'ASC' },
    });
  }

  /** Catálogo global de meses (`tmeses`, 1..12). Sin empresaId. */
  async findMeses() {
    return this.mesRepo.find({ order: { tmesId: 'ASC' } });
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

  async findAllTipoMov(empresaId: number) {
    return this.findAllByEmpresa(this.tipoMovRepo, empresaId);
  }

  async findTipoMov(tipomovId: number, empresaId: number) {
    return this.findOneById(this.tipoMovRepo, 'tipomovId', tipomovId, empresaId, 'Tipo Mov');
  }

  async createTipoMov(dto: CreateTplTipoMovDto, currentUser: string) {
    return this.createEntity(this.tipoMovRepo, dto, currentUser);
  }

  async updateTipoMov(tipomovId: number, empresaId: number, dto: UpdateTplTipoMovDto, currentUser: string) {
    return this.updateEntity(this.tipoMovRepo, 'tipomovId', tipomovId, empresaId, dto, currentUser, 'Tipo Mov');
  }

  async removeTipoMov(tipomovId: number, empresaId: number) {
    return this.softDelete(this.tipoMovRepo, 'tipomovId', tipomovId, empresaId, 'Tipo Mov');
  }

  async findAllPlTipoMov(empresaId: number, empleadoId?: number) {
    const qb = this.plTipoMovRepo.createQueryBuilder('p')
      .where('p.empresaId = :empresaId', { empresaId });
    if (empleadoId) qb.andWhere('p.empleadoId = :empleadoId', { empleadoId });
    return qb.getMany();
  }

  async findPlTipoMov(pletipomovId: number, empresaId: number) {
    return this.findOneById(this.plTipoMovRepo, 'pletipomovId', pletipomovId, empresaId, 'Tipo Mov Empleado');
  }

  async createPlTipoMov(dto: CreatePlTipoMovDto, currentUser: string) {
    return this.createEntity(this.plTipoMovRepo, dto, currentUser);
  }

  async updatePlTipoMov(pletipomovId: number, empresaId: number, dto: UpdatePlTipoMovDto, currentUser: string) {
    return this.updateEntity(this.plTipoMovRepo, 'pletipomovId', pletipomovId, empresaId, dto, currentUser, 'Tipo Mov Empleado');
  }

  async removePlTipoMov(pletipomovId: number, empresaId: number) {
    return this.softDelete(this.plTipoMovRepo, 'pletipomovId', pletipomovId, empresaId, 'Tipo Mov Empleado');
  }

  /**
   * «Dar derechos laborales» — proceso por lotes.
   *
   * 1. Lee `tpltipomov` filtrando `sn_obligatoria = 'S'` (los derechos obligatorios).
   * 2. Para el empleado indicado, registra cada derecho en `pletipomov`:
   *    - No existía  → se CREA la fila.
   *    - Ya existía  → se ACTUALIZA `importe` / `tipoimporte` / `aplicacion`
   *      con los valores del catálogo (decisión del usuario, 18/10/2026).
   * 3. El lote corre dentro de UNA transacción: o se aplica completo o no se
   *    aplica nada (nunca quedan derechos a medias).
   *
   * Mapeo catálogo → movimiento del empleado:
   *   importe      ← tpltipomov.importe
   *   tipoimporte  ← 'P' si sn_porcentual = 'S', si no 'A'
   *   aplicacion   ← 'M' (tpltipomov no tiene este campo; es el default de la entity)
   */
  // ── ISR · Retención en la Fuente ─────────────────────────────────────────
  // Tramos progresivos en tcoisr (empresa 2):
  //   Excento   0.01       → 228,324.32    0%
  //   15%       228,324.33 → 348,154.10   15%
  //   20%       348,154.11 → 809,660.75   20%
  //   25%       809,660.76 → ...           25%
  //
  // Ingreso anual = sueldobruto × meses trabajados desde fecha_alta hasta
  // fechasistema. Si el alta es de un año anterior -> año completo (12 meses).
  // NO se pone puerta de "12 meses": un salario alto contratado hace pocos
  // meses igual supera el máximo excento y retiene.

  /** ¿Este tipo de movimiento es la retención en la fuente (ISR)? */
  private esRetencionIsr(d: TplTipoMov): boolean {
    const abr = (d.abreviatura || '').trim().toUpperCase();
    const desc = (d.descripcion || '').trim().toUpperCase();
    return abr === 'RETECION-EN-FUENTE' || desc.includes('RENTA');
  }

  /**
   * Meses trabajados del empleado dentro del año en curso (1..12).
   * Alta anterior al año en curso -> 12 (año completo).
   * Alta en el mismo año -> mes de alta .. mes actual, ambos incluidos.
   */
  private calcularMesesTrabajados(fechaAlta: Date | string | null, fecha: Date): number {
    if (!fechaAlta) return 12;
    const a = new Date(fechaAlta);
    const h = new Date(fecha);
    if (Number.isNaN(a.getTime())) return 12;
    if (a.getFullYear() < h.getFullYear()) return 12;
    if (a.getFullYear() > h.getFullYear()) return 0;
    // Fecha de alta posterior a hoy (comparando día a día, sin hora) -> aún no trabaja
    const aDia = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const hDia = new Date(h.getFullYear(), h.getMonth(), h.getDate());
    if (aDia > hDia) return 0;
    const meses = h.getMonth() - a.getMonth() + 1;
    return Math.max(0, Math.min(12, meses));
  }

  /**
   * ISR progresivo: recorre los tramos ordenados y suma la porción del ingreso
   * que cae dentro de cada uno (solape de [0, ingresoAnual] con [del, al]).
   * Devuelve redondeado a 2 decimales.
   */
  private calcularIsrProgresivo(ingresoAnual: number, tramos: Tcoisr[]): number {
    if (!(ingresoAnual > 0)) return 0;
    const ordenados = [...tramos].sort((a, b) => Number(a.del) - Number(b.del));
    let isr = 0;
    for (const t of ordenados) {
      const del = Number(t.del);
      const al = Number(t.al);
      const tasa = Number(t.importe) / 100;
      if (ingresoAnual <= del) continue;
      const base = Math.min(ingresoAnual, al) - del;
      if (base > 0) isr += base * tasa;
    }
    return Math.round(isr * 100) / 100;
  }

  /** Cálculo completo de ISR para un empleado dado. */
  private calcularIsrEmpleado(
    empleado: PlEmpleados,
    fecha: Date,
    tramos: Tcoisr[],
  ): { sueldobruto: number; meses: number; ingresoAnual: number; isr: number; debeRetener: boolean } {
    const sueldobruto = Number(empleado.sueldobruto ?? 0);
    const meses = this.calcularMesesTrabajados(empleado.fecha_alta, fecha);
    const ingresoAnual = sueldobruto * meses;
    const isr = this.calcularIsrProgresivo(ingresoAnual, tramos);
    return { sueldobruto, meses, ingresoAnual, isr, debeRetener: isr > 0 };
  }

  // ── Impuesto Vecinal ─────────────────────────────────────────────────────
  // Tramos en tcoimpuestovecinal. Es PROGRESIVO como el ISR, pero el
  // `importe` NO es un porcentaje: es la **tasa por cada L 1,000** del
  // ingreso anual. Cada tramo grava únicamente la porción que le toca:
  //
  //   vecinal = Σ sobre tramos  (base del tramo × (importe / 1000))
  //   base    = min(ingreso, al) − del
  //
  // Ejemplo del usuario (ingreso anual 348,000.00, tabla corregida):
  //   1.50 → 7.50 · 2.00 → 10.00 · 2.50 → 25.00 · 3.00 → 30.00
  //   3.50 → 70.00 · 3.75 → 93.75 · 4.00 → 100.00 · 5.00 → 250.00
  //   5.25 → 1,039.50                       total = L 1,625.75
  //
  // La ventana de ingreso es fiscal: 1 de junio → 31 de mayo.

  /** ¿Este tipo de movimiento es el Impuesto Vecinal? */
  private esRetencionVecinal(d: TplTipoMov): boolean {
    const abr = (d.abreviatura || '').trim().toUpperCase();
    const desc = (d.descripcion || '').trim().toUpperCase();
    return abr === 'RETECION-VECINAL' || desc.includes('VECINAL');
  }

  /**
   * Inicio de la ventana fiscal del Impuesto Vecinal para una fecha de
   * sistema dada: 1 de junio del ejercicio vigente.
   * Entre enero y mayo el ejercicio inició el 1 de junio del año anterior.
   */
  private inicioFiscalVecinal(fecha: Date): Date {
    const y = fecha.getFullYear();
    // getMonth() es 0-based: 5 = junio
    return fecha.getMonth() >= 5 ? new Date(y, 5, 1) : new Date(y - 1, 5, 1);
  }

  /**
   * Meses trabajados dentro de la ventana 1 jun → 31 may (máximo 12).
   * Cuenta el mes de alta y el mes en curso.
   */
  private calcularMesesVecinal(fechaAlta: Date | string | null, fecha: Date): number {
    const inicio = this.inicioFiscalVecinal(fecha);
    const hDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    let desde: Date;

    if (!fechaAlta) {
      desde = inicio;
    } else {
      const a = new Date(fechaAlta);
      if (Number.isNaN(a.getTime())) return 12;
      const aDia = new Date(a.getFullYear(), a.getMonth(), a.getDate());
      // Alta posterior a hoy: aún no trabaja
      if (aDia > hDia) return 0;
      // Alta posterior al inicio fiscal: cuenta desde el mes de alta
      desde = aDia > inicio ? aDia : inicio;
    }

    const mesActual = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const meses =
      (mesActual.getFullYear() - desde.getFullYear()) * 12 +
      (mesActual.getMonth() - desde.getMonth()) +
      1;
    return Math.max(0, Math.min(12, meses));
  }

  /**
   * Impuesto Vecinal progresivo: recorre los tramos ordenados y suma la porción
   * del ingreso que cae dentro de cada uno, aplicando la tasa por mil.
   * (Mismo mecanismo de solape que el ISR, sólo cambia el divisor.)
   */
  private calcularVecinal(ingresoAnual: number, tramos: Tcoimpuestovecinal[]): number {
    if (!(ingresoAnual > 0)) return 0;
    const ordenados = [...tramos].sort((a, b) => Number(a.del) - Number(b.del));
    let total = 0;
    for (const t of ordenados) {
      const del = Number(t.del);
      const al = Number(t.al);
      const tasa = Number(t.importe) / 1000; // tasa por cada L 1,000
      if (ingresoAnual <= del) continue;
      const base = Math.min(ingresoAnual, al) - del;
      if (base > 0) total += base * tasa;
    }
    return Math.round(total * 100) / 100;
  }

  /** Cálculo completo de Impuesto Vecinal para un empleado dado. */
  private calcularVecinalEmpleado(
    empleado: PlEmpleados,
    fecha: Date,
    tramos: Tcoimpuestovecinal[],
  ): { sueldobruto: number; meses: number; ingresoAnual: number; vecinal: number; debeRetener: boolean } {
    const sueldobruto = Number(empleado.sueldobruto ?? 0);
    const meses = this.calcularMesesVecinal(empleado.fecha_alta, fecha);
    const ingresoAnual = sueldobruto * meses;
    const vecinal = this.calcularVecinal(ingresoAnual, tramos);
    return { sueldobruto, meses, ingresoAnual, vecinal, debeRetener: vecinal > 0 };
  }

  // ── Aportaciones (IHSS y RAP) ────────────────────────────────────────────
  // Los porcentajes NO se hardcodean: se leen del catálogo
  // (`tpltipomov.importe` y `tpltipomov.imppatron`), así un ajuste legal sólo
  // requiere tocar el catálogo.
  //
  //   IHSS: empleado 5% (2.5% Salud + 2.5% IVM) · patrono 8.7%
  //         base = MENOR entre sueldo y techo de seguridad (`techoseguro`)
  //
  //   RAP:  DOS fondos con bases distintas
  //         1. Vivienda e Inclusión Financiera — emp 1.5% · pat 1.5%
  //            base = SOBRE EL EXCEDENTE del salario que supera el techo
  //         2. Reserva Laboral (cesantía)      — pat 4.0% · el empleado NO paga
  //            base = SALARIO ORDINARIO completo
  //
  // Ejemplo del usuario (sueldo L 25,000.00, techo L 11,903.13):
  //   IHSS  base 11,903.13 → emp 595.16 (Salud 297.58 + IVM 297.58) · pat 1,035.57
  //   RAP   excedente 25,000.00 − 11,903.13 = L 13,096.87
  //         vivienda emp 13,096.87 × 1.5% = L   196.45
  //         vivienda pat 13,096.87 × 1.5% = L   196.45
  //         reserva  pat 25,000.00 × 4.0% = L 1,000.00
  //         → emp L   196.45  ·  pat L 1,196.45

  /** ¿Este tipo de movimiento es IHSS? */
  private esIhss(d: TplTipoMov): boolean {
    const abr = (d.abreviatura || '').trim().toUpperCase();
    const desc = (d.descripcion || '').trim().toUpperCase();
    return abr === 'IHSS' || desc.includes('IHSS') || desc.includes('SEGURIDAD SOCIAL');
  }

  /** ¿Este tipo de movimiento es RAP (Régimen de Aportación Privada)? */
  private esRap(d: TplTipoMov): boolean {
    const abr = (d.abreviatura || '').trim().toUpperCase();
    const desc = (d.descripcion || '').trim().toUpperCase();
    return abr === 'RAP' || desc.includes('APORTACION PRIVADA') || desc.includes('REGIMEN DE APORTACION');
  }

  /**
   * Cálculo mensual de una aportación (IHSS o RAP) para un empleado.
   *
   * `pctEmpleado` y `pctPatron` llegan como porcentajes del catálogo (ej. 5.00
   * y 8.70). `conTecho` limita la base al `plempleados.techoseguro`; sólo el
   * IHSS desagrega el aporte del empleado en Salud e IVM (mitad cada uno).
   */
  private calcularAportacion(
    empleado: PlEmpleados,
    pctEmpleado: number,
    pctPatron: number,
    opts: { conTecho: boolean; desglosaSaludIvm: boolean },
  ): {
    sueldobruto: number;
    techoseguro: number;
    base: number;
    salud: number | null;
    ivm: number | null;
    empleado: number;
    patron: number;
  } {
    const sueldobruto = Number(empleado.sueldobruto ?? 0);
    const techoseguro = Number(empleado.techoseguro ?? 0);
    const base =
      opts.conTecho && techoseguro > 0 && sueldobruto > techoseguro ? techoseguro : sueldobruto;

    const red2 = (x: number) => Math.round(x * 100) / 100;
    const pct = pctEmpleado / 100;

    let salud: number | null = null;
    let ivm: number | null = null;
    let empleadoTotal: number;
    if (opts.desglosaSaludIvm) {
      salud = red2(base * (pct / 2));
      ivm = red2(base * (pct / 2));
      // El total es la suma de sus partes → nunca hay desfase de redondeo
      empleadoTotal = red2(salud + ivm);
    } else {
      empleadoTotal = red2(base * pct);
    }

    return {
      sueldobruto,
      techoseguro,
      base,
      salud,
      ivm,
      empleado: empleadoTotal,
      patron: red2(base * (pctPatron / 100)),
    };
  }

  /**
   * RAP — Régimen de Aportación Privada. Se compone de DOS fondos con bases
   * distintas, por lo que no puede resolverse con un solo porcentaje:
   *
   *   1. Fondo de Vivienda e Inclusión Financiera
   *      empleado 1.5% · patrono 1.5% · SOBRE EL EXCEDENTE del salario que
   *      supera el techo de cotización (0 si no lo supera).
   *
   *   2. Fondo de Reserva Laboral (capitalización individual / cesantía)
   *      patrono 4.0% · SOBRE EL SALARIO ORDINARIO completo · el empleado NO
   *      paga nada de este componente.
   *
   * Los porcentajes salen del catálogo: `importe` = % de vivienda (vale lo
   * mismo para empleado y patrono) e `imppatron` = % TOTAL del patrono
   * (vivienda + reserva). La reserva se obtiene por diferencia
   * `imppatron − importe` (5.50 − 1.50 = 4.00).
   */
  private calcularRap(
    empleado: PlEmpleados,
    pctVivienda: number,
    pctPatronTotal: number,
  ): {
    sueldobruto: number;
    techoseguro: number;
    excedente: number;
    pctVivienda: number;
    pctReserva: number;
    viviendaEmpleado: number;
    viviendaPatrono: number;
    reservaPatrono: number;
    empleado: number;
    patron: number;
  } {
    const sueldobruto = Number(empleado.sueldobruto ?? 0);
    const techoseguro = Number(empleado.techoseguro ?? 0);
    const red2 = (x: number) => Math.round(x * 100) / 100;

    // La vivienda grava sólo el excedente sobre el techo (0 si no lo supera)
    const excedente =
      techoseguro > 0 && sueldobruto > techoseguro ? red2(sueldobruto - techoseguro) : 0;
    // La reserva laboral grava el salario completo y es exclusiva del patrono
    const pctReserva = Math.max(0, red2(pctPatronTotal - pctVivienda));

    const viviendaEmpleado = red2(excedente * (pctVivienda / 100));
    const viviendaPatrono = red2(excedente * (pctVivienda / 100));
    const reservaPatrono = red2(sueldobruto * (pctReserva / 100));

    return {
      sueldobruto,
      techoseguro,
      excedente,
      pctVivienda,
      pctReserva,
      viviendaEmpleado,
      viviendaPatrono,
      reservaPatrono,
      // El empleado sólo paga vivienda; el patrono paga vivienda + reserva
      empleado: viviendaEmpleado,
      patron: red2(viviendaPatrono + reservaPatrono),
    };
  }

  // ── Décimo Tercer y Décimo Cuarto Mes ────────────────────────────────────
  // MISMA fórmula para ambos (aguinaldo y prima escolar):
  //
  //   decimo = (suma de los salarios ordinarios del año) / 12
  //
  // • Período: 1 de enero → 31 de diciembre (año calendario).
  // • Salario ORDINARIO: sólo el sueldo base o fijo. NO incluye horas extras,
  //   bonos variables, comisiones ni viáticos.
  // • Año completo (12 meses) → equivale a UN salario mensual completo.
  // • Proporcional (n meses)  → salario × n / 12, que equivale a
  //   salario × días trabajados / 360 (año comercial).
  // • Fecha de pago: 13avo en diciembre antes de Navidad · 14avo en noviembre.
  //
  // Ejemplo (sueldo L 32,000.00):
  //   12 meses → 32,000.00 × 12 / 12 = L 32,000.00
  //    5 meses → 32,000.00 ×  5 / 12 = L 13,333.33
  //
  // LÍMITE CONOCIDO: el sistema guarda UN sólo `sueldobruto` por empleado, por
  // lo que si el salario cambió dentro del año no se puede promediar; se usa el
  // sueldo vigente para todos los meses (regla de "promedio de sueldos
  // devengados" queda pendiente de un historial de salarios).

  /** ¿Es Décimo Tercer Mes (aguinaldo) o Décimo Cuarto Mes (prima escolar)? */
  private esDecimo(d: TplTipoMov): boolean {
    const abr = (d.abreviatura || '').trim().toUpperCase();
    const desc = (d.descripcion || '').trim().toUpperCase();
    return (
      abr.includes('13AVO') ||
      abr.includes('14AVO') ||
      desc.includes('DECIMO TERCER') ||
      desc.includes('DECIMO CUARTO') ||
      desc.includes('13AVO') ||
      desc.includes('14AVO') ||
      desc.includes('AGUINALDO') ||
      desc.includes('PRIMA ESCOLAR')
    );
  }

  // ── Conceptos de INGRESO que resume /planilla/ingresos-rev ────────────────

  /** ¿Es Comisiones sobre ventas? */
  private esComision(d: TplTipoMov): boolean {
    const abr = (d.abreviatura || '').trim().toUpperCase();
    const desc = (d.descripcion || '').trim().toUpperCase();
    return abr.includes('COMISION') || desc.includes('COMISION');
  }

  /** ¿Es Bono? */
  private esBono(d: TplTipoMov): boolean {
    const abr = (d.abreviatura || '').trim().toUpperCase();
    const desc = (d.descripcion || '').trim().toUpperCase();
    return abr.includes('BONO') || desc.includes('BONO');
  }

  /** ¿Es Pago de Horas Extras? */
  private esHorasExtras(d: TplTipoMov): boolean {
    const abr = (d.abreviatura || '').trim().toUpperCase();
    const desc = (d.descripcion || '').trim().toUpperCase();
    return (
      abr.includes('HORA-EX') ||
      abr.includes('HORA EX') ||
      desc.includes('HORAS EXTRAS') ||
      desc.includes('HORA EXTRA')
    );
  }

  /** ¿Es Pago Doble por Días Festivos? */
  private esDiaFestivo(d: TplTipoMov): boolean {
    const abr = (d.abreviatura || '').trim().toUpperCase();
    const desc = (d.descripcion || '').trim().toUpperCase();
    return (
      abr.includes('DIA-FEST') ||
      abr.includes('DIA FEST') ||
      desc.includes('DIAS FESTIVOS') ||
      desc.includes('DIA FESTIVO')
    );
  }

  /** ¿Es específicamente el Décimo Tercer Mes (aguinaldo)? */
  private esDecimoTercer(d: TplTipoMov): boolean {
    const abr = (d.abreviatura || '').trim().toUpperCase();
    const desc = (d.descripcion || '').trim().toUpperCase();
    return (
      abr.includes('13AVO') ||
      desc.includes('DECIMO TERCER') ||
      desc.includes('13AVO') ||
      desc.includes('AGUINALDO')
    );
  }

  /** ¿Es específicamente el Décimo Cuarto Mes (prima escolar)? */
  private esDecimoCuarto(d: TplTipoMov): boolean {
    const abr = (d.abreviatura || '').trim().toUpperCase();
    const desc = (d.descripcion || '').trim().toUpperCase();
    return (
      abr.includes('14AVO') ||
      desc.includes('DECIMO CUARTO') ||
      desc.includes('14AVO') ||
      desc.includes('PRIMA ESCOLAR')
    );
  }

  /** Cálculo del décimo (tercer o cuarto mes) para un empleado dado. */
  private calcularDecimo(
    empleado: PlEmpleados,
    fecha: Date,
  ): {
    sueldobruto: number;
    meses: number;
    ingresoAnual: number;
    monto: number;
    proporcional: boolean;
  } {
    const sueldobruto = Number(empleado.sueldobruto ?? 0);
    const meses = this.calcularMesesTrabajados(empleado.fecha_alta, fecha);
    // Suma de salarios ordinarios del año
    const ingresoAnual = sueldobruto * meses;
    const monto = Math.round((ingresoAnual / 12) * 100) / 100;
    return { sueldobruto, meses, ingresoAnual, monto, proporcional: meses < 12 };
  }

  async darDerechosLaborales(empleadoId: number, empresaId: number, currentUser: string) {
    const empleado = await this.empleadoRepo.findOne({ where: { empleadoId, empresaId } });
    if (!empleado) throw new NotFoundException('Empleado no encontrado');

    const derechos = await this.tipoMovRepo.find({
      where: { empresaId, sn_obligatoria: 'S' },
      order: { tipomovId: 'ASC' },
    });

    if (!derechos.length) {
      return {
        creados: 0,
        actualizados: 0,
        totales: 0,
        detalles: [],
        mensaje: 'No hay tipos de movimiento marcados como obligatorios.',
      };
    }

    // Qué tipos ya tiene el empleado → tipomovId → fila existente
    const existentes = await this.plTipoMovRepo.find({ where: { empleadoId, empresaId } });
    const filaPorTipo = new Map<number, PlTipoMov>();
    existentes.forEach((f) => filaPorTipo.set(f.tipomovId, f));

    const fecha = await this.fechaSistema.getFecha(empresaId);

    // Tramos de retenciones: sólo se cargan si el lote incluye esa retención.
    const hayIsr = derechos.some((d) => this.esRetencionIsr(d));
    const hayVecinal = derechos.some((d) => this.esRetencionVecinal(d));

    const tramosIsr = hayIsr
      ? await this.isrRepo.find({ where: { empresaId, sn_activo: 'S' } })
      : [];
    const tramosVecinal = hayVecinal
      ? await this.vecinalRepo.find({ where: { empresaId, sn_activo: 'S' } })
      : [];

    if (hayIsr && !tramosIsr.length) {
      throw new BadRequestException('No hay tramos ISR activos en tcoisr para esta empresa.');
    }
    if (hayVecinal && !tramosVecinal.length) {
      throw new BadRequestException(
        'No hay tramos de Impuesto Vecinal activos en tcoimpuestovecinal para esta empresa.',
      );
    }

    // ISR: ingreso anual = sueldobruto × meses desde fecha_alta (año calendario).
    const isrCalc = hayIsr ? this.calcularIsrEmpleado(empleado, fecha, tramosIsr) : null;
    // Vecinal: misma base pero ventana fiscal 1 jun → 31 may y tasa por mil.
    const vecinalCalc = hayVecinal
      ? this.calcularVecinalEmpleado(empleado, fecha, tramosVecinal)
      : null;

    // Décimo 3ro y 4to: misma fórmula (salario ordinario del año / 12)
    const hayDecimo = derechos.some((d) => this.esDecimo(d));
    const decimoCalc = hayDecimo ? this.calcularDecimo(empleado, fecha) : null;

    // Prestaciones: 13avo y 14avo (INGRESOS anuales del trabajador)
    const prestaciones: {
      movimientos: {
        tipomovId: number;
        descripcion: string;
        abreviatura: string;
        sueldobruto: number;
        meses: number;
        ingresoAnual: number;
        monto: number;
        proporcional: boolean;
      }[];
      totales: { monto: number };
    } = { movimientos: [], totales: { monto: 0 } };

    // Aportaciones: IHSS (con techo) y RAP (sin techo), con sus totales.
    const aportaciones: {
      movimientos: {
        tipomovId: number;
        descripcion: string;
        abreviatura: string;
        sueldobruto: number;
        techoseguro: number;
        /** Base sobre la que se calculó: IHSS = menor(sueldo,techo); RAP = excedente */
        base: number;
        /** IHSS: desglose Salud / IVM */
        salud: number | null;
        ivm: number | null;
        /** RAP: desglose Vivienda (sobre excedente) + Reserva Laboral (sobre salario) */
        excedente?: number;
        pctVivienda?: number;
        pctReserva?: number;
        viviendaEmpleado?: number;
        viviendaPatrono?: number;
        reservaPatrono?: number;
        empleado: number;
        patron: number;
      }[];
      totales: { empleado: number; patrono: number; total: number };
    } = { movimientos: [], totales: { empleado: 0, patrono: 0, total: 0 } };

    const aCrear: Partial<PlTipoMov>[] = [];
    const aActualizar: { id: number; datos: Partial<PlTipoMov> }[] = [];
    const detalles: {
      tipomovId: number;
      descripcion: string;
      abreviatura: string;
      accion: 'Creado' | 'Actualizado';
      importe: number;
      aplicacion: string;
      isr?: { sueldobruto: number; meses: number; ingresoAnual: number; isr: number; debeRetener: boolean };
      vecinal?: {
        sueldobruto: number;
        meses: number;
        ingresoAnual: number;
        vecinal: number;
        debeRetener: boolean;
      };
    }[] = [];

    for (const d of derechos) {
      const esIsr = this.esRetencionIsr(d);
      const esVecinal = this.esRetencionVecinal(d);
      const esIhssMov = this.esIhss(d);
      const esRapMov = !esIhssMov && this.esRap(d);
      const esDecimoMov = !esIhssMov && !esRapMov && this.esDecimo(d);
      // IHSS: base = menor entre sueldo y techo (5% emp / 8.7% pat).
      // RAP:  vivienda sobre el EXCEDENTE (1.5% emp / 1.5% pat)
      //       + reserva laboral sobre el SALARIO COMPLETO (4% sólo patrono).
      const ihssCalc = esIhssMov
        ? this.calcularAportacion(empleado, Number(d.importe ?? 0), Number(d.imppatron ?? 0), {
            conTecho: true,
            desglosaSaludIvm: true,
          })
        : null;
      const rapCalc = esRapMov
        ? this.calcularRap(empleado, Number(d.importe ?? 0), Number(d.imppatron ?? 0))
        : null;

      // ISR y Vecinal se calculan por tabla (anual, tipo Retención).
      // IHSS y RAP se calculan mensualmente (tipo Aportación).
      // 13avo y 14avo son un ingreso anual (salario ordinario del año / 12).
      // Resto: se toman del catálogo, aplicados mensualmente.
      const base: Partial<PlTipoMov> = esIsr
        ? { importe: isrCalc?.isr ?? 0, tipoimporte: 'R', aplicacion: 'A' }
        : esVecinal
          ? { importe: vecinalCalc?.vecinal ?? 0, tipoimporte: 'R', aplicacion: 'A' }
          : ihssCalc
            ? {
                // Ya son importes calculados, NO porcentajes → tipo Aportación
                importe: ihssCalc.empleado,
                imppatron: ihssCalc.patron,
                tipoimporte: 'A',
                aplicacion: 'M',
              }
            : rapCalc
              ? {
                  importe: rapCalc.empleado,
                  imppatron: rapCalc.patron,
                  tipoimporte: 'A',
                  aplicacion: 'M',
                }
              : esDecimoMov && decimoCalc
                ? {
                    // Ingreso del trabajador, pago único en el año (dic/nov)
                    importe: decimoCalc.monto,
                    imppatron: 0,
                    tipoimporte: 'A',
                    aplicacion: 'A',
                  }
                : {
                    // Importe del trabajador y aporte del patrono se copian del catálogo
                    importe: Number(d.importe ?? 0),
                    imppatron: Number(d.imppatron ?? 0),
                    tipoimporte: d.sn_porcentual === 'S' ? 'P' : 'A',
                    aplicacion: 'M',
                  };

      if (ihssCalc) {
        aportaciones.movimientos.push({
          tipomovId: d.tipomovId,
          descripcion: d.descripcion,
          abreviatura: d.abreviatura,
          sueldobruto: ihssCalc.sueldobruto,
          techoseguro: ihssCalc.techoseguro,
          base: ihssCalc.base,
          salud: ihssCalc.salud,
          ivm: ihssCalc.ivm,
          empleado: ihssCalc.empleado,
          patron: ihssCalc.patron,
        });
        aportaciones.totales.empleado += ihssCalc.empleado;
        aportaciones.totales.patrono += ihssCalc.patron;
      }

      if (rapCalc) {
        aportaciones.movimientos.push({
          tipomovId: d.tipomovId,
          descripcion: d.descripcion,
          abreviatura: d.abreviatura,
          sueldobruto: rapCalc.sueldobruto,
          techoseguro: rapCalc.techoseguro,
          // La vivienda grava el excedente; la reserva grava el salario completo
          base: rapCalc.excedente,
          salud: null,
          ivm: null,
          excedente: rapCalc.excedente,
          pctVivienda: rapCalc.pctVivienda,
          pctReserva: rapCalc.pctReserva,
          viviendaEmpleado: rapCalc.viviendaEmpleado,
          viviendaPatrono: rapCalc.viviendaPatrono,
          reservaPatrono: rapCalc.reservaPatrono,
          empleado: rapCalc.empleado,
          patron: rapCalc.patron,
        });
        aportaciones.totales.empleado += rapCalc.empleado;
        aportaciones.totales.patrono += rapCalc.patron;
      }

      if (esDecimoMov && decimoCalc) {
        prestaciones.movimientos.push({
          tipomovId: d.tipomovId,
          descripcion: d.descripcion,
          abreviatura: d.abreviatura,
          sueldobruto: decimoCalc.sueldobruto,
          meses: decimoCalc.meses,
          ingresoAnual: decimoCalc.ingresoAnual,
          monto: decimoCalc.monto,
          proporcional: decimoCalc.proporcional,
        });
        prestaciones.totales.monto += decimoCalc.monto;
      }

      const fila = filaPorTipo.get(d.tipomovId);
      if (fila) {
        aActualizar.push({
          id: fila.pletipomovId,
          datos: { ...base, usuarioUpdated: currentUser, fechaUpdated: fecha },
        });
        detalles.push({
          tipomovId: d.tipomovId,
          descripcion: d.descripcion,
          abreviatura: d.abreviatura,
          accion: 'Actualizado',
          importe: base.importe as number,
          aplicacion: base.aplicacion as string,
          isr: esIsr && isrCalc ? isrCalc : undefined,
          vecinal: esVecinal && vecinalCalc ? vecinalCalc : undefined,
        });
      } else {
        aCrear.push({
          ...base,
          empleadoId,
          tipomovId: d.tipomovId,
          sn_activo: 'S',
          empresaId,
          usuarioCreated: currentUser,
        });
        detalles.push({
          tipomovId: d.tipomovId,
          descripcion: d.descripcion,
          abreviatura: d.abreviatura,
          accion: 'Creado',
          importe: base.importe as number,
          aplicacion: base.aplicacion as string,
          isr: esIsr && isrCalc ? isrCalc : undefined,
          vecinal: esVecinal && vecinalCalc ? vecinalCalc : undefined,
        });
      }
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      if (aCrear.length) await qr.manager.insert(PlTipoMov, aCrear);
      for (const upd of aActualizar) {
        await qr.manager.update(PlTipoMov, { pletipomovId: upd.id, empresaId }, upd.datos);
      }
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    // Totales finales de aportaciones (redondeo tras la acumulación del bucle)
    const red2 = (x: number) => Math.round(x * 100) / 100;
    aportaciones.totales.empleado = red2(aportaciones.totales.empleado);
    aportaciones.totales.patrono = red2(aportaciones.totales.patrono);
    aportaciones.totales.total = red2(
      aportaciones.totales.empleado + aportaciones.totales.patrono,
    );

    // Retenciones (anuales) agrupadas, para su propia sección
    const totalesRetenciones = {
      isr: isrCalc?.isr ?? 0,
      vecinal: vecinalCalc?.vecinal ?? 0,
      total: red2((isrCalc?.isr ?? 0) + (vecinalCalc?.vecinal ?? 0)),
    };

    // Prestaciones (13avo y 14avo): ingresos anuales del trabajador
    prestaciones.totales.monto = red2(prestaciones.totales.monto);

    const fmtL = (n: number) => `L ${n.toFixed(2)}`;
    const lineasAport = aportaciones.movimientos.map((m) => {
      // RAP: dos fondos con bases distintas → mostrar ambas
      if (m.excedente != null) {
        return (
          `${m.abreviatura} emp ${fmtL(m.empleado)}` +
          ` (vivienda ${m.pctVivienda}% sobre excedente ${fmtL(m.excedente)})` +
          ` / pat ${fmtL(m.patron)}` +
          ` (vivienda ${fmtL(m.viviendaPatrono ?? 0)}` +
          ` + reserva ${m.pctReserva}% = ${fmtL(m.reservaPatrono ?? 0)} sobre salario ${fmtL(m.sueldobruto)})`
        );
      }
      const desglose =
        m.salud !== null && m.ivm !== null ? ` (Salud ${fmtL(m.salud)} + IVM ${fmtL(m.ivm)})` : '';
      const techo = m.base < m.sueldobruto ? ` · techo ${fmtL(m.techoseguro)}` : '';
      return `${m.abreviatura} emp ${fmtL(m.empleado)}${desglose} / pat ${fmtL(m.patron)} sobre base ${fmtL(m.base)}${techo}`;
    });

    const lineasPrest = prestaciones.movimientos.map(
      (m) =>
        `${m.abreviatura} ${fmtL(m.monto)}` +
        ` (salario ${fmtL(m.sueldobruto)} × ${m.meses}/12` +
        `${m.proporcional ? ` · proporcional, ingreso anual ${fmtL(m.ingresoAnual)}` : ' · año completo'})`,
    );

    const mensaje =
      `${aCrear.length} creado(s) y ${aActualizar.length} actualizado(s) de ${derechos.length} derecho(s) obligatorio(s).` +
      (lineasAport.length
        ? ` APORTACIONES (mensual): ${lineasAport.join(' · ')}` +
          ` → empleado ${fmtL(aportaciones.totales.empleado)} + patrono ${fmtL(aportaciones.totales.patrono)}` +
          ` = total ${fmtL(aportaciones.totales.total)}.`
        : '') +
      (lineasPrest.length
        ? ` PRESTACIONES (anual): ${lineasPrest.join(' · ')}` +
          ` = total ${fmtL(prestaciones.totales.monto)}.`
        : '') +
      (isrCalc || vecinalCalc
        ? ` RETENCIONES (anual): ISR ${fmtL(totalesRetenciones.isr)} + Vecinal ${fmtL(totalesRetenciones.vecinal)}` +
          ` = total ${fmtL(totalesRetenciones.total)}.`
        : '');

    return {
      creados: aCrear.length,
      actualizados: aActualizar.length,
      totales: derechos.length,
      detalles,
      aportaciones,
      prestaciones,
      retenciones: {
        isr: isrCalc,
        vecinal: vecinalCalc,
        totales: totalesRetenciones,
      },
      // Compatibilidad con lo que el frontend ya consume hoy
      isr: isrCalc,
      vecinal: vecinalCalc,
      mensaje,
    };
  }

  /**
   * Revisión de retenciones (ISR + Impuesto Vecinal) por empleado para la
   * pantalla de retenciones. Devuelve los tramos activos de cada tabla, el
   * cálculo por empleado y los totales.
   */
  async revisarRetenciones(empresaId: number) {
    const fecha = await this.fechaSistema.getFecha(empresaId);

    const tramosIsr = (
      await this.isrRepo.find({ where: { empresaId, sn_activo: 'S' } })
    ).sort((a, b) => Number(a.del) - Number(b.del));
    const tramosVecinal = (
      await this.vecinalRepo.find({ where: { empresaId, sn_activo: 'S' } })
    ).sort((a, b) => Number(a.del) - Number(b.del));

    const tipos = await this.tipoMovRepo.find({
      where: { empresaId },
      order: { tipomovId: 'ASC' },
    });
    const movIsr = tipos.find((d) => this.esRetencionIsr(d)) ?? null;
    const movVecinal = tipos.find((d) => this.esRetencionVecinal(d)) ?? null;

    const empleados = await this.empleadoRepo.find({
      where: { empresaId, sn_activo: 'S' },
      order: { apellidos: 'ASC', nombres: 'ASC' },
    });

    // Filas ya registradas en pletipomov por empleado (una por retención)
    let filasIsr = new Map<number, PlTipoMov>();
    let filasVecinal = new Map<number, PlTipoMov>();
    if (movIsr) {
      const filas = await this.plTipoMovRepo.find({
        where: { empresaId, tipomovId: movIsr.tipomovId },
      });
      filasIsr = new Map(filas.map((f) => [f.empleadoId, f]));
    }
    if (movVecinal) {
      const filas = await this.plTipoMovRepo.find({
        where: { empresaId, tipomovId: movVecinal.tipomovId },
      });
      filasVecinal = new Map(filas.map((f) => [f.empleadoId, f]));
    }

    const filas = empleados.map((e) => {
      const i = this.calcularIsrEmpleado(e, fecha, tramosIsr);
      const v = this.calcularVecinalEmpleado(e, fecha, tramosVecinal);
      const fIsr = filasIsr.get(e.empleadoId);
      const fVec = filasVecinal.get(e.empleadoId);
      return {
        empleadoId: e.empleadoId,
        nroempleado: e.nroempleado,
        nrodocumento: e.nrodocumento,
        nombre: `${e.apellidos}, ${e.nombres}`,
        fecha_alta: e.fecha_alta,
        sueldobruto: i.sueldobruto,
        // ISR — año calendario, tasa progresiva en %
        isrMeses: i.meses,
        isrIngresoAnual: i.ingresoAnual,
        isr: i.isr,
        isrDebeRetener: i.debeRetener,
        isrRegistrado: fIsr ? Number(fIsr.importe ?? 0) : null,
        isrSinRegistrar: !fIsr,
        // Vecinal — ventana 1 jun → 31 may, tasa progresiva por mil
        vecMeses: v.meses,
        vecIngresoAnual: v.ingresoAnual,
        vecinal: v.vecinal,
        vecDebeRetener: v.debeRetener,
        vecRegistrado: fVec ? Number(fVec.importe ?? 0) : null,
        vecSinRegistrar: !fVec,
        totalRetenciones: Math.round((i.isr + v.vecinal) * 100) / 100,
      };
    });

    const totales = {
      empleados: filas.length,
      isr: {
        conRetencion: filas.filter((f) => f.isrDebeRetener).length,
        exentos: filas.filter((f) => !f.isrDebeRetener).length,
        total: Math.round(filas.reduce((s, f) => s + f.isr, 0) * 100) / 100,
        sinRegistrar: filas.filter((f) => f.isrSinRegistrar).length,
      },
      vecinal: {
        conRetencion: filas.filter((f) => f.vecDebeRetener).length,
        exentos: filas.filter((f) => !f.vecDebeRetener).length,
        total: Math.round(filas.reduce((s, f) => s + f.vecinal, 0) * 100) / 100,
        sinRegistrar: filas.filter((f) => f.vecSinRegistrar).length,
      },
      totalRetenciones:
        Math.round(filas.reduce((s, f) => s + f.totalRetenciones, 0) * 100) / 100,
    };

    return {
      fecha,
      tramos: { isr: tramosIsr, vecinal: tramosVecinal },
      movimientos: { isr: movIsr, vecinal: movVecinal },
      empleados: filas,
      totales,
    };
  }

  /**
   * Período que rige la consulta de ingresos autorizados.
   *
   * Prioridad: el **período contable abierto** (`coperiodoctable.sn_abierto='S'`),
   * tomando el más antiguo — misma regla que `primerPeriodoAbierto` de
   * Contabilidad. Si la empresa no tiene ninguno abierto, cae al mes/año de la
   * fecha de sistema y lo marca con `fuente: 'fechasistema'` para que la
   * pantalla pueda avisar que no hay período abierto.
   */
  private async resolverPeriodoConsulta(empresaId: number) {
    const abiertos = await this.periodoctableRepo.find({
      where: { empresaId, sn_abierto: 'S' } as unknown as FindOptionsWhere<Coperiodoctable>,
      order: { nroanio: 'ASC', nromes: 'ASC' } as any,
    });
    if (abiertos.length > 0) {
      return { anio: abiertos[0].nroanio, mes: abiertos[0].nromes, fuente: 'abierto' as const };
    }
    const fecha = await this.fechaSistema.getFecha(empresaId);
    return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1, fuente: 'fechasistema' as const };
  }

  /**
   * Resumen de INGRESOS por empleado: comisiones sobre ventas, bonos, horas
   * extras, pago doble por días festivos y los décimos tercero y cuarto.
   *
   * - COMISION y BONO se toman de `pleingresos` (ingresos AUTORIZADOS por un
   *   departamento) filtrados por el **período abierto**: al iniciar un período
   *   nuevo se registran los valores nuevos y se retiran los viejos, así que
   *   sólo se suma lo del período vigente. Siempre en Lempiras, `sn_activo='S'`.
   * - Horas extras / Días festivos NO tienen fuente de datos propia
   *   (pleasistencia está vacía), por lo que se resume lo registrado en
   *   pletipomov. **Pendiente de resolver por aparte.**
   * - Los décimos SÍ se calculan (salario ordinario del año / 12) y se comparan
   *   contra lo registrado para detectar descuadres.
   */
  async revisarIngresos(empresaId: number) {
    const fecha = await this.fechaSistema.getFecha(empresaId);
    const per = await this.resolverPeriodoConsulta(empresaId);

    const tipos = await this.tipoMovRepo.find({
      where: { empresaId },
      order: { tipomovId: 'ASC' },
    });

    const armar = (
      clave: ClaveIngreso,
      buscar: (d: TplTipoMov) => boolean,
      abrDef: string,
      descDef: string,
      esAnual: boolean,
    ): DefColIngreso => {
      const m = tipos.find(buscar) ?? null;
      return {
        clave,
        tipomovId: m?.tipomovId ?? null,
        abreviatura: (m?.abreviatura ?? abrDef).trim(),
        descripcion: (m?.descripcion ?? descDef).trim(),
        esAnual,
      };
    };

    const defs: DefColIngreso[] = [
      armar('comision', (d) => this.esComision(d), 'COMISION', 'COMISIONES SOBRE VENTAS', false),
      armar('bono', (d) => this.esBono(d), 'BONO', 'BONOS', false),
      armar('horaEx', (d) => this.esHorasExtras(d), 'PAGO-HORA-EX', 'PAGO DE HORAS EXTRAS', false),
      armar('diaFest', (d) => this.esDiaFestivo(d), 'PAGO-DIA-FEST', 'PAGO DOBLE DIAS FESTIVO', false),
      armar('decimo13', (d) => this.esDecimoTercer(d), 'PAGO-13AVO', 'DECIMO TERCER MES', true),
      armar('decimo14', (d) => this.esDecimoCuarto(d), 'PAGO-14AVO', 'DECIMO CUARTO MES', true),
    ];

    // ── Fuente real de COMISION / BONO: ingresos autorizados DEL PERÍODO ────
    const autorizados = await this.pleIngresosRepo.find({
      where: { empresaId, sn_activo: 'S', anio_ejercicio: per.anio, periodo: per.mes },
    });
    const porConcepto: Record<'COMISION' | 'BONO', Map<number, number>> = {
      COMISION: new Map<number, number>(),
      BONO: new Map<number, number>(),
    };
    for (const a of autorizados) {
      const clave = a.concepto === 'BONO' ? 'BONO' : 'COMISION';
      porConcepto[clave].set(
        a.empleadoId,
        (porConcepto[clave].get(a.empleadoId) ?? 0) + Number(a.importe ?? 0),
      );
    }

    // Filas ya registradas en pletipomov: tipomovId -> empleadoId -> fila
    const regPorTipo = new Map<number, Map<number, PlTipoMov>>();
    for (const def of defs) {
      if (def.tipomovId == null) continue;
      const filas = await this.plTipoMovRepo.find({
        where: { empresaId, tipomovId: def.tipomovId },
      });
      regPorTipo.set(def.tipomovId, new Map(filas.map((f) => [f.empleadoId, f])));
    }

    const empleados = await this.empleadoRepo.find({
      where: { empresaId, sn_activo: 'S' },
      order: { apellidos: 'ASC', nombres: 'ASC' },
    });

    const red2 = (x: number) => Math.round(x * 100) / 100;

    const filas = empleados.map((e) => {
      // Misma fórmula para 13avo y 14avo: salario ordinario del año / 12
      const dec = this.calcularDecimo(e, fecha);
      const ingresos = {} as Record<ClaveIngreso, CeldaIngreso>;
      for (const def of defs) {
        // COMISION / BONO: importe AUTORIZADO en pleingresos (siempre en L).
        // Un empleado sin ingreso autorizado muestra «—» pero NO cuenta como
        // «sin registrar»: no es una deuda pendiente sino que no tiene comisión
        // ni bono en el ejercicio. Por lo mismo tampoco hay cálculo contra qué
        // comparar → sin descuadre.
        if (def.clave === 'comision' || def.clave === 'bono') {
          const autorizado = porConcepto[def.clave === 'bono' ? 'BONO' : 'COMISION'].get(
            e.empleadoId,
          );
          const tiene = autorizado != null && autorizado > 0;
          ingresos[def.clave] = {
            importe: tiene ? red2(autorizado) : null,
            tipoimporte: tiene ? 'A' : null,
            esMonto: true,
            sinRegistrar: false,
            calculado: null,
            descuadra: false,
          };
          continue;
        }

        const reg =
          def.tipomovId != null
            ? regPorTipo.get(def.tipomovId)?.get(e.empleadoId)
            : undefined;
        const importe = reg ? Number(reg.importe ?? 0) : null;
        // 'P' = porcentaje; el lote escribe 'A' cuando ya es un importe en L
        const esMonto = reg ? reg.tipoimporte !== 'P' : def.esAnual;
        const calculado = def.esAnual ? dec.monto : null;
        ingresos[def.clave] = {
          importe,
          tipoimporte: reg?.tipoimporte ?? null,
          esMonto,
          sinRegistrar: !reg,
          calculado,
          descuadra:
            calculado != null && importe != null && Math.abs(importe - calculado) >= 0.01,
        };
      }

      const totalAnual = red2(
        defs
          .filter((d) => d.esAnual)
          .reduce((s, d) => s + (ingresos[d.clave].importe ?? ingresos[d.clave].calculado ?? 0), 0),
      );

      return {
        empleadoId: e.empleadoId,
        nroempleado: e.nroempleado,
        nrodocumento: e.nrodocumento,
        nombre: `${e.apellidos}, ${e.nombres}`,
        fecha_alta: e.fecha_alta,
        sueldobruto: Number(e.sueldobruto ?? 0),
        ingresos,
        totalAnual,
      };
    });

    const totales = {
      empleados: filas.length,
      porColumna: {} as Record<ClaveIngreso, TotalColumnaIngreso>,
      // Los décimos son los únicos con importe en Lempiras
      totalAnual: red2(filas.reduce((s, f) => s + f.totalAnual, 0)),
    };
    for (const def of defs) {
      const cs = filas.map((f) => f.ingresos[def.clave]);
      totales.porColumna[def.clave] = {
        conRegistro: cs.filter((c) => !c.sinRegistrar).length,
        sinRegistrar: cs.filter((c) => c.sinRegistrar).length,
        descuadra: cs.filter((c) => c.descuadra).length,
        total: red2(cs.reduce((s, c) => s + (c.importe ?? c.calculado ?? 0), 0)),
      };
    }

    return {
      fecha,
      /** Período que rige COMISION/BONO (abierto o, en su defecto, fechasistema) */
      periodo: per,
      columnas: defs,
      empleados: filas,
      totales,
    };
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

  async findAllTipoEmpleado(empresaId: number) {
    return this.findAllByEmpresa(this.tipoEmpleadoRepo, empresaId);
  }

  async findTipoEmpleado(tipoempleadoId: number, empresaId: number) {
    return this.findOneById(this.tipoEmpleadoRepo, 'tipoempleadoId', tipoempleadoId, empresaId, 'Tipo Empleado');
  }

  async createTipoEmpleado(dto: any, currentUser: string) {
    return this.createEntity(this.tipoEmpleadoRepo, dto, currentUser);
  }

  async updateTipoEmpleado(tipoempleadoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.tipoEmpleadoRepo, 'tipoempleadoId', tipoempleadoId, empresaId, dto, currentUser, 'Tipo Empleado');
  }

  async removeTipoEmpleado(tipoempleadoId: number, empresaId: number) {
    return this.softDelete(this.tipoEmpleadoRepo, 'tipoempleadoId', tipoempleadoId, empresaId, 'Tipo Empleado');
  }
}
