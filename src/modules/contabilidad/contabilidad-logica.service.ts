import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, DataSource, In } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { CorrelativosService } from '../../shared/correlativos.service';
import { Copdamae } from './entities/copdamae.entity';
import { Copdadet } from './entities/copdadet.entity';
import { Coctamov } from './entities/coctamov.entity';
import { Coctasaldos } from './entities/coctasaldos.entity';
import { Coctacontables } from './entities/coctacontables.entity';
import { Coperiodoctable } from './entities/coperiodoctable.entity';
import { Cocierrectable } from './entities/cocierrectable.entity';
import { Cocierredet } from './entities/cocierredet.entity';
import { Tcoplantillapdamae } from './entities/tcoplantillapdamae.entity';
import { Tcoplantillapdadet } from './entities/tcoplantillapdadet.entity';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { Tusuarios } from '../users/entities/usuario.entity';
import { TPosFacMae } from '../facturacion/entities/posfacmae.entity';
import { TPosFacDet } from '../facturacion/entities/posfacdet.entity';
import { TPosFacCaja } from '../facturacion/entities/posfaccaja.entity';
import { Posfacmov } from '../facturacion/entities/posfacmov.entity';
import { TinvExistencia } from '../inventario/entities/existencia.entity';
import { CxcMovimiento } from '../cxc/entities/cxcmovimiento.entity';
import { TCxpMovimiento } from '../cxp/entities/movimiento.entity';
import { TCxpCompraMae } from '../cxp/entities/compra-mae.entity';
import { TCoTipoDocumentoFiscal } from './entities/tcotipodocumentofiscal.entity';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TbcoMovimiento } from '../bancos/entities/bco-movimiento.entity';
import { ContabilizarPartidaDto, CierreContableDto, ReporteContableDto, ReporteEstadoResultadoDto, CrearPartidaInicialDto } from './dto/contabilidad.dto';
import { TrasaviblidadService } from './trasaviblidad.service';

/**
 * Servicio de Lógica de Negocio Contable
 * Maneja: contabilización, cierre de períodos, generación de movimientos y reportes
 */
@Injectable()
export class ContabilidadLogicaService {
  private readonly logger = new Logger(ContabilidadLogicaService.name);

  constructor(
    @InjectRepository(Copdamae) private readonly copdamaeRepo: Repository<Copdamae>,
    @InjectRepository(Copdadet) private readonly copdadetRepo: Repository<Copdadet>,
    @InjectRepository(Coctamov) private readonly movctaRepo: Repository<Coctamov>,
    @InjectRepository(Coctasaldos) private readonly saldosctaRepo: Repository<Coctasaldos>,
    @InjectRepository(Coctacontables) private readonly ctacontablesRepo: Repository<Coctacontables>,
    @InjectRepository(Coperiodoctable) private readonly periodoctableRepo: Repository<Coperiodoctable>,
    @InjectRepository(Cocierrectable) private readonly cierrectableRepo: Repository<Cocierrectable>,
    @InjectRepository(Cocierredet) private readonly saldosCierreRepo: Repository<Cocierredet>,
    @InjectRepository(Tcoplantillapdamae) private readonly plantillaMaeRepo: Repository<Tcoplantillapdamae>,
    @InjectRepository(Tcoplantillapdadet) private readonly plantillaDetRepo: Repository<Tcoplantillapdadet>,
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
    @InjectRepository(Tusuarios) private readonly usuariosRepo: Repository<Tusuarios>,
    @InjectRepository(TPosFacMae) private readonly facMaeRepo: Repository<TPosFacMae>,
    @InjectRepository(TPosFacDet) private readonly facDetRepo: Repository<TPosFacDet>,
    @InjectRepository(TPosFacCaja) private readonly facCajaRepo: Repository<TPosFacCaja>,
    @InjectRepository(Posfacmov) private readonly posfacmovRepo: Repository<Posfacmov>,
    @InjectRepository(TinvExistencia) private readonly existenciaRepo: Repository<TinvExistencia>,
    @InjectRepository(CxcMovimiento) private readonly cxcMovimientoRepo: Repository<CxcMovimiento>,
    @InjectRepository(TCxpMovimiento) private readonly cxpMovimientoRepo: Repository<TCxpMovimiento>,
    @InjectRepository(TCxpCompraMae) private readonly cxpCompraMaeRepo: Repository<TCxpCompraMae>,
    @InjectRepository(TCoTipoDocumentoFiscal) private readonly tipoDocFiscalRepo: Repository<TCoTipoDocumentoFiscal>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TbcoMovimiento) private readonly bcoMovimientoRepo: Repository<TbcoMovimiento>,
    private readonly fechaSistema: FechaSistemaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
    private readonly trazaService: TrasaviblidadService,
    private readonly correlativos: CorrelativosService,
  ) {}

  // ==================== CONTABILIZACIÓN ====================

  /**
   * Contabiliza una partida: crea copdamae + copdadet + actualiza coctamov + coctasaldos
   * Valida que la partida esté cuadrada (débitos = créditos)
   */
  async contabilizarPartida(dto: ContabilizarPartidaDto, currentUser: string, opts?: { skipPeriodCheck?: boolean }): Promise<Copdamae> {
    // 1. Validar que la partida esté cuadrada
    this.validarPartidaCuadrada(dto.lineas);

    // 2. Validar que una misma cuenta contable no se repita en el detalle
    this.validarCuentasUnicas(dto.lineas);

    // 3. Verificar que el período esté abierto (opcional en reconstrucción)
    if (!opts?.skipPeriodCheck) {
      await this.verificarPeriodoAbierto(dto.empresaId, dto.anio, dto.periodo);
    }

    // 4. Verificar que las cuentas contables existan y sean operables
    await this.verificarCuentasContables(dto.lineas, dto.empresaId);

    // 5. Generar número de partida
    const nropartida = await this.siguienteNropartida(currentUser, dto.empresaId);

    // 6. Crear copdamae (maestro)
    // Reglas 1 y 4: fecharegistro lo impone el backend (snapshot tfecma.fechasistema
    // con rango vigente, o tempresas.fechasistema sin él) — este camino directo
    // se salta createEntity(), así que se estampa explícito aquí y en el detalle.
    const fecharegistro = await this.fechaSistema.obtenerFechaRegistro(currentUser, dto.empresaId);
    const fecha = await this.fechaSistema.getFecha(dto.empresaId);
    const copdamae = this.copdamaeRepo.create({
      empresaId: dto.empresaId,
      Idsucursal: dto.Idsucursal,
      periodo: dto.periodo,
      anio: dto.anio,
      moduloId: dto.moduloId,
      documentoId: dto.documentoId,
      fechadocumento: dto.fechadocumento ? new Date(dto.fechadocumento) : fecha,
      factordecambio: dto.factordecambio ?? 0,
      nroreferencia: dto.nroreferencia,
      descripcion: dto.descripcion,
      nropartida,
      sn_anulada: 'N',
      // La partida se postea a coctamov/coctasaldos en los pasos 8-9 → contabilizada
      sn_contabilizada: 'S',
      fecharegistro,
      usuarioCreated: currentUser,
    });
    const savedMae = await this.copdamaeRepo.save(copdamae);

    // 7. Crear copdadet (detalles)
    let nrofila = 1;
    for (const linea of dto.lineas) {
      const det = this.copdadetRepo.create({
        empresaId: dto.empresaId,
        Idsucursal: dto.Idsucursal,
        partidaId: savedMae.partidaId,
        periodo: dto.periodo,
        anio: dto.anio,
        nropartida,
        moduloId: dto.moduloId,
        nrofila: nrofila++,
        ctacontable: linea.ctacontable,
        descripcion: linea.descripcion ?? dto.descripcion,
        debito: linea.debito,
        credito: linea.credito,
        factordecambio: dto.factordecambio ?? 0,
        sn_anulada: 'N',
        sn_contabilizada: 'S',
        fecharegistro,
        usuarioCreated: currentUser,
      });
      await this.copdadetRepo.save(det);
    }

    // 8. Actualizar movimientos contables (coctamov)
    await this.actualizarMovimientosContables(dto.lineas, dto.empresaId, nropartida, dto.periodo, dto.anio, currentUser);

    // 9. Actualizar saldos de cuentas (coctasaldos)
    await this.actualizarSaldosCuentas(dto.lineas, dto.empresaId, dto.periodo, dto.anio, currentUser);

    this.logger.log(`Partida ${nropartida} contabilizada por ${currentUser} - Empresa ${dto.empresaId}`);
    return savedMae;
  }

  /**
   * Contra partida: reversión contable de una partida creando una partida
   * ESPEJO en el período vigente, SIN revertir `coctamov` de la original.
   *
   * Diseño aprobado (10/10/2026):
   *  - La original queda `sn_anulada='S'` + `sn_contabilizada='S'`
   *    (SÍ permanece en el mayor: `coctamov`/`coctasaldos` conservan sus
   *    importes) y se marca con `contrapdaId` + `feccontrapda`.
   *  - La contra queda `sn_anulada='N'` + `sn_contabilizada='S'` con
   *    `partidaOrigenId` = original, importes espejo (débito ↔ crédito) y el
   *    MISMO módulo/documento/referencia que la original (decisión 2:
   *    `moduloId` no decide la reconstrucción; allí manda `sn_contabilizada`).
   *  - Período de la contra = período vigente de `tempresas.fechasistema`
   *    (debe existir y estar ABIERTO). La original puede estar en un período
   *    cerrado (decisión 3). Bloqueos permitidos: 409 ya contraedida,
   *    400 partidas `CIERRE-%`, 400 no contabilizada, 400 sin período abierto.
   *  - Se postea la contra con `actualizarMovimientosContables` +
   *    `actualizarSaldosCuentas`: el par original + contra netea a 0 en el
   *    balance acumulado sin tocar el historial de la original.
   *
   * Orden: valida → crea contra (mae + det) → postea → marca la original
   * AL FINAL. Si algo falla antes de marcar, la original queda intacta y no
   * hay doble conteo; la búsqueda por `partidaOrigenId` es red de seguridad
   * ante creaciones parciales previas.
   */
  async contraPartida(partidaId: number, empresaId: number, currentUser: string): Promise<Copdamae> {
    // ── 1. Cargar la original ──
    const original = await this.copdamaeRepo.findOne({
      where: { partidaId, empresaId } as FindOptionsWhere<Copdamae>,
    });
    if (!original) {
      throw new NotFoundException(`Partida ${partidaId} no encontrada para la empresa ${empresaId}`);
    }

    // ── 2. Validaciones (404 → 400 contenido → 409 duplicado) ──
    if (original.partidaOrigenId != null) {
      throw new BadRequestException(
        `La partida #${original.nropartida} es una contra partida: no se puede contraer una contra.`,
      );
    }
    if ((original.nroreferencia || '').toUpperCase().startsWith('CIERRE-')) {
      throw new BadRequestException(
        `La partida #${original.nropartida} es de cierre contable: no se permite contra partida de cierre.`,
      );
    }
    if (original.sn_contabilizada !== 'S') {
      throw new BadRequestException(
        `La partida #${original.nropartida} no está contabilizada en el mayor `
        + `(estado: anulada=${original.sn_anulada}, contabilizada=${original.sn_contabilizada}): no hay nada que revertir.`,
      );
    }
    if (original.contrapdaId != null) {
      throw new ConflictException(
        `La partida #${original.nropartida} ya fue contraedida (contra partida id=${original.contrapdaId}).`,
      );
    }
    // Red de seguridad: contra viva huérfana (creación parcial previa).
    // Solo cuenta una contra `sn_contabilizada='S'`: una contra eliminada
    // (S/N) no bloquea volver a contraer la original.
    const contraExistente = await this.copdamaeRepo.findOne({
      where: {
        empresaId,
        partidaOrigenId: original.partidaId,
        sn_contabilizada: 'S',
      } as FindOptionsWhere<Copdamae>,
    });
    if (contraExistente) {
      throw new ConflictException(
        `La partida #${original.nropartida} ya tiene la contra partida #${contraExistente.nropartida} (id=${contraExistente.partidaId}).`,
      );
    }

    // ── 3. Período vigente = fechaSistema (debe existir y estar abierto) ──
    const fecha = await this.fechaSistema.getFecha(empresaId);
    const anio = fecha.getFullYear();
    const periodo = fecha.getMonth() + 1;
    await this.verificarPeriodoAbierto(empresaId, anio, periodo);

    // La original no puede estar en un período posterior al vigente:
    // su reversa quedaría ANTES que el asiento original en el acumulado.
    if (original.anio > anio || (original.anio === anio && original.periodo > periodo)) {
      throw new BadRequestException(
        `La partida #${original.nropartida} pertenece al período ${original.periodo}/${original.anio}, `
        + `posterior al período vigente ${periodo}/${anio}: no se puede contraer.`,
      );
    }

    // ── 4. Líneas contabilizadas de la original → espejo ──
    // El espejo conserva cuadratura y cuentas únicas por construcción
    // (se intercambian débito ↔ crédito de las mismas líneas).
    const detsOriginales = await this.copdadetRepo.find({
      where: { partidaId: original.partidaId, sn_contabilizada: 'S' } as FindOptionsWhere<Copdadet>,
      order: { nrofila: 'ASC' } as any,
    });
    if (!detsOriginales.length) {
      throw new BadRequestException(
        `La partida #${original.nropartida} no tiene líneas contabilizadas: no se puede contraer.`,
      );
    }

    // ── 5. Crear la contra (mae) ──
    const nropartida = await this.siguienteNropartida(currentUser, empresaId);
    const fecharegistro = await this.fechaSistema.obtenerFechaRegistro(currentUser, empresaId);
    const contra = this.copdamaeRepo.create({
      empresaId: original.empresaId,
      Idsucursal: original.Idsucursal,
      periodo,
      anio,
      moduloId: original.moduloId,
      documentoId: original.documentoId,
      fechadocumento: fecha,
      factordecambio: original.factordecambio ?? 0,
      nroreferencia: original.nroreferencia,
      descripcion: `Contra partida #${original.nropartida}: ${original.descripcion}`,
      nropartida,
      sn_anulada: 'N',
      sn_contabilizada: 'S',
      partidaOrigenId: original.partidaId,
      fecharegistro,
      usuarioCreated: currentUser,
    });
    const savedContra = await this.copdamaeRepo.save(contra);

    // ── 6. Detalles espejo (débito ↔ crédito) ──
    const lineas: { ctacontable: string; debito: number; credito: number }[] = [];
    for (const det of detsOriginales) {
      const espejo = this.copdadetRepo.create({
        empresaId: original.empresaId,
        Idsucursal: original.Idsucursal,
        partidaId: savedContra.partidaId,
        periodo,
        anio,
        nropartida,
        moduloId: original.moduloId,
        nrofila: det.nrofila,
        ctacontable: det.ctacontable,
        descripcion: det.descripcion,
        debito: Number(det.credito) || 0,
        credito: Number(det.debito) || 0,
        factordecambio: det.factordecambio ?? 0,
        sn_anulada: 'N',
        sn_contabilizada: 'S',
        fecharegistro,
        usuarioCreated: currentUser,
      });
      await this.copdadetRepo.save(espejo);
      lineas.push({
        ctacontable: det.ctacontable,
        debito: Number(det.credito) || 0,
        credito: Number(det.debito) || 0,
      });
    }

    // ── 7. Postear la contra al mayor ──
    await this.actualizarMovimientosContables(lineas, empresaId, nropartida, periodo, anio, currentUser);
    await this.actualizarSaldosCuentas(lineas, empresaId, periodo, anio, currentUser);

    // ── 8. Marcar la original AL FINAL (paso destructivo) ──
    await this.copdamaeRepo.createQueryBuilder()
      .update(Copdamae)
      .set({
        sn_anulada: 'S',
        sn_contabilizada: 'S',
        contrapdaId: savedContra.partidaId,
        feccontrapda: fecha,
        usuarioUpdated: currentUser,
        fechaUpdated: fecha,
      } as any)
      .where('partidaId = :id', { id: original.partidaId })
      .execute();
    // Cascada a las líneas: siguen contabilizadas (permanecen en el mayor)
    // pero quedan anuladas a nivel de línea, como el maestro.
    await this.copdadetRepo.createQueryBuilder()
      .update(Copdadet)
      .set({
        sn_anulada: 'S',
        sn_contabilizada: 'S',
        usuarioUpdated: currentUser,
        fechaUpdated: fecha,
      } as any)
      .where('partidaId = :id', { id: original.partidaId })
      .execute();

    this.logger.log(
      `Contra partida #${nropartida} (id=${savedContra.partidaId}) creada contra la partida `
      + `#${original.nropartida} en ${periodo}/${anio} por ${currentUser} - Empresa ${empresaId}`,
    );
    return savedContra;
  }

  // ==================== PARTIDA INICIAL DE OPERACIONES ====================

  /**
   * Crea la partida inicial de operaciones (balance inicial) en el período
   * contable ABIERTO de la empresa, a partir de las líneas leídas de un
   * archivo Excel.
   *
   * Reglas:
   *  - El período NO lo decide el cliente: se lee de `coperiodoctable`
   *    (período abierto más antiguo). Si no hay ninguno, se rechaza.
   *  - No se admite duplicado: la referencia por defecto es
   *    `INICIAL-{periodo}-{año}` y si ya existe una partida con esa
   *    referencia se responde 409.
   *  - La fecha documento se fija en el último día del período abierto para
   *    que la partida siempre pertenezca al período que la recibe.
   *  - Orden de errores: primero se valida el contenido del archivo
   *    (cuadrada, cuentas únicas, cuentas operables) → 400; después se
   *    comprueba si ya fue cargada → 409. Así un archivo con errores nunca
   *    queda tapado por el "ya existe".
   *  - La creación de `copdamae`/`copdadet` y la actualización de
   *    `coctamov`/`coctasaldos` quedan a cargo de `contabilizarPartida()`.
   */
  async crearPartidaInicial(dto: CrearPartidaInicialDto, currentUser: string): Promise<Copdamae> {
    const empresaId = Number(dto.empresaId);
    if (!empresaId) {
      throw new BadRequestException('La empresa es requerida para cargar la partida inicial');
    }

    // 1. Período contable abierto (única fuente de verdad)
    const periodoAbierto = await this.primerPeriodoAbierto(empresaId);
    if (!periodoAbierto) {
      throw new BadRequestException(
        'No existe ningún período contable abierto para esta empresa. Abra un período antes de cargar la partida inicial.',
      );
    }
    const periodo = periodoAbierto.nromes;
    const anio = periodoAbierto.nroanio;

    // 2. Primero se valida el CONTENIDO del archivo y sólo después el estado
    //    del sistema: así un archivo con errores responde 400 (qué corregir)
    //    y no 409 "ya existe", que ocultaría el error real.
    this.validarPartidaCuadrada(dto.lineas);
    this.validarCuentasUnicas(dto.lineas);
    await this.verificarCuentasContables(dto.lineas, empresaId);

    // 3. Referencia por defecto + protección contra doble carga
    const nroreferencia = (dto.nroreferencia?.trim() || `INICIAL-${periodo}-${anio}`).slice(0, 70);
    const existente = await this.copdamaeRepo.findOne({
      where: { empresaId, nroreferencia } as unknown as FindOptionsWhere<Copdamae>,
    });
    if (existente) {
      throw new ConflictException(
        `Ya existe la partida "${nroreferencia}" (nro. ${existente.nropartida}) en el período ${existente.periodo}/${existente.anio}. ` +
        'No se puede cargar dos veces la partida inicial.',
      );
    }

    // 4. Fecha documento = último día del período abierto
    //    (new Date(año, mes, 0) = día 0 del mes siguiente = último día del período)
    const ultimoDia = new Date(anio, periodo, 0).getDate();
    const fechadocumento = `${anio}-${String(periodo).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

    // 5. Delegar en contabilizarPartida: revalida, crea copdamae/copdadet
    //    y actualiza coctamov + coctasaldos
    return this.contabilizarPartida(
      {
        empresaId,
        Idsucursal: Number(dto.Idsucursal) || 1,
        periodo,
        anio,
        moduloId: Number(dto.moduloId) || 7,
        documentoId: 0,
        fechadocumento,
        nroreferencia,
        descripcion: dto.descripcion?.trim() || 'balances inicial de operaciones mercantiles',
        factordecambio: 1,
        lineas: dto.lineas,
      },
      currentUser,
    );
  }

  /**
   * Período contable abierto más antiguo de la empresa (null si no hay).
   */
  private async primerPeriodoAbierto(empresaId: number): Promise<Coperiodoctable | null> {
    const abiertos = await this.periodoctableRepo.find({
      where: { empresaId, sn_abierto: 'S' } as unknown as FindOptionsWhere<Coperiodoctable>,
      order: { nroanio: 'ASC', nromes: 'ASC' } as any,
    });
    return abiertos.length > 0 ? abiertos[0] : null;
  }

  /**
   * Valida que débitos = créditos en la partida
   */
  private validarPartidaCuadrada(lineas: { debito: number; credito: number }[]): void {
    if (!lineas || lineas.length < 2) {
      throw new BadRequestException('La partida debe tener al menos 2 líneas');
    }

    // 1. Ningún importe puede ser negativo (se valida antes que el cuadre,
    //    para que un negativo no disfraze el balance de la partida)
    const negativas = lineas
      .map((l, i) => ({
        fila: i + 1,
        d: Number(l?.debito) || 0,
        c: Number(l?.credito) || 0,
      }))
      .filter(x => x.d < 0 || x.c < 0);
    if (negativas.length > 0) {
      throw new BadRequestException(
        `No se admiten importes negativos (${negativas.length} línea(s)): ` +
          negativas.map(x => `línea ${x.fila} (débito ${x.d.toFixed(2)}, crédito ${x.c.toFixed(2)})`).join(', '),
      );
    }

    const totalDebito = lineas.reduce((sum, l) => sum + (Number(l.debito) || 0), 0);
    const totalCredito = lineas.reduce((sum, l) => sum + (Number(l.credito) || 0), 0);

    // Redondeo a 2 decimales para evitar errores de punto flotante
    const redondear = (n: number) => Math.round(n * 100) / 100;

    if (redondear(totalDebito) !== redondear(totalCredito)) {
      throw new BadRequestException(
        `La partida no está cuadrada. Débitos: ${totalDebito.toFixed(2)}, Créditos: ${totalCredito.toFixed(2)}, Diferencia: ${Math.abs(totalDebito - totalCredito).toFixed(2)}`
      );
    }

    if (redondear(totalDebito) === 0) {
      throw new BadRequestException('La partida no puede tener todos los montos en cero');
    }
  }

  /**
   * Valida que cada cuenta contable aparezca UNA SOLA vez en el detalle de la partida.
   * Regla de negocio: la partida contable es partida simple por cuenta, no admite
   * líneas duplicadas con la misma cuenta (los importes de una misma cuenta se suman en una sola línea).
   */
  private validarCuentasUnicas(lineas: { ctacontable: string }[]): void {
    const vistos = new Set<string>();
    const repetidas: string[] = [];

    for (const linea of lineas) {
      const cta = (linea?.ctacontable ?? '').trim();
      if (!cta) continue;
      if (vistos.has(cta)) {
        if (!repetidas.includes(cta)) repetidas.push(cta);
      } else {
        vistos.add(cta);
      }
    }

    if (repetidas.length > 0) {
      throw new BadRequestException(
        `La cuenta contable solo puede ingresarse una vez en el detalle de la partida. Cuenta(s) repetida(s): ${repetidas.join(', ')}`,
      );
    }
  }

  /**
   * Verifica que el período contable esté abierto
   */
  private async verificarPeriodoAbierto(empresaId: number, anio: number, periodo: number): Promise<void> {
    const periodoEntity = await this.periodoctableRepo.findOne({
      where: {
        nroanio: anio,
        nromes: periodo,
        empresaId,
      } as unknown as FindOptionsWhere<Coperiodoctable>,
    });

    if (!periodoEntity) {
      throw new BadRequestException(`No existe el período ${periodo}/${anio} para esta empresa`);
    }

    if (periodoEntity.sn_abierto !== 'S') {
      throw new BadRequestException(`El período ${periodo}/${anio} está cerrado. No se pueden registrar movimientos.`);
    }
  }

  /**
   * Verifica que todas las cuentas contables de la partida existan, estén
   * activas y sean operables.
   *
   * Reporta TODAS las cuentas con problema en un solo 400 —no sólo la
   * primera— porque en una carga masiva desde un archivo lo que se necesita
   * es corregir el origen de una sola vez.
   */
  private async verificarCuentasContables(
    lineas: { ctacontable: string; debito?: number; credito?: number }[],
    empresaId: number,
  ): Promise<void> {
    const cuentasUnicas = [
      ...new Set(lineas.map(l => String(l?.ctacontable ?? '').trim()).filter(Boolean)),
    ];
    if (cuentasUnicas.length === 0) return;

    // Una sola consulta para todas las cuentas del archivo
    const encontradas = await this.ctacontablesRepo.find({
      where: { ctacontable: In(cuentasUnicas), empresaId } as unknown as FindOptionsWhere<Coctacontables>,
    });
    // Lookup en mayúsculas: MySQL compara sin importar mayúsculas/minúsculas
    const mapa = new Map<string, Coctacontables>();
    for (const c of encontradas) mapa.set(String(c.ctacontable).trim().toUpperCase(), c);

    // La `naturaleza` de coctacontables es solo una GUÍA de grupo (D deudor /
    // C acreedor); NO restringe en qué lado se registra la línea: una partida
    // válida puede debitar una cuenta acreedora o acreditar una deudora.
    const inexistentes: string[] = [];
    const inactivas: string[] = [];
    const noOperables: string[] = [];

    for (const cta of cuentasUnicas) {
      const cuenta = mapa.get(cta.toUpperCase());
      if (!cuenta) {
        inexistentes.push(cta);
      } else if (cuenta.sn_activo !== 'S') {
        inactivas.push(cta);
      } else if (cuenta.sn_operable !== 'S') {
        noOperables.push(cta);
      }
    }

    if (inexistentes.length > 0 || inactivas.length > 0 || noOperables.length > 0) {
      const partes: string[] = [];
      if (inexistentes.length > 0)
        partes.push(`No existen en el plan de cuentas (${inexistentes.length}): ${inexistentes.join(', ')}`);
      if (inactivas.length > 0) partes.push(`Cuentas inactivas (${inactivas.length}): ${inactivas.join(', ')}`);
      if (noOperables.length > 0) partes.push(`Cuentas no operables (${noOperables.length}): ${noOperables.join(', ')}`);
      throw new BadRequestException(partes.join(' · '));
    }
  }

  /**
   * Genera el siguiente número de partida para el período
   */
  /**
   * Correlativo de partida: ttipoparametros (field='nropartida'),
   * localizado por Idsucursal + empresaId del usuario logueado, incrementando
   * valor = valor + 1 de forma atómica (UPDATE + LAST_INSERT_ID en la misma
   * conexión) y devolviendo el nuevo número.
   */
  private async siguienteNropartida(usuario: string, empresaId: number): Promise<number> {
    return this.correlativos.siguiente('nropartida', empresaId, usuario);
  }

  /**
   * Actualiza la tabla de movimientos contables (coctamov)
   * Acumula débitos y créditos por cuenta, período y año
   */
  private async actualizarMovimientosContables(
    lineas: { ctacontable: string; debito: number; credito: number }[],
    empresaId: number,
    nropartida: number,
    periodo: number,
    anio: number,
    currentUser: string,
  ): Promise<void> {
    for (const linea of lineas) {
      const montoDebito = Number(linea.debito) || 0;
      const montoCredito = Number(linea.credito) || 0;

      if (montoDebito === 0 && montoCredito === 0) continue;

      // Buscar movimiento existente para esta cuenta/período/año
      let mov = await this.movctaRepo.findOne({
        where: {
          ctacontable: linea.ctacontable,
          empresaId,
          anio,
          periodo,
        } as unknown as FindOptionsWhere<Coctamov>,
      });

      if (mov) {
        // Acumular
        mov.debe = Number(mov.debe) + montoDebito;
        mov.haber = Number(mov.haber) + montoCredito;
        // REGLA: saldo del movimiento = acumulado a inicios del período (sacum)
        // + (debe - haber), CON SIGNO (D positivo / C negativo).
        // NO usar Math.abs: rompe el signo y hace que la partida de cierre
        // cierre mal (deja residual) y que el espejo cocierredet no cuadre.
        mov.saldo = (Number(mov.sacum) || 0) + Number(mov.debe) - Number(mov.haber);
        mov.ultnropda = nropartida;
        mov.fecultmov = new Date();
        await this.movctaRepo.save(mov);
      } else {
        // Crear nuevo — F2: el acumulado inicial (sacum) se ARRASTRA, no es 0.
        // sacum = saldo acumulado al cierre del mes anterior:
        //   1) cocierredet[mes-1].saldo  (espejo = fuente de secuencia si hubo cierre)
        //   2) coctamov[mes-1].saldo     (saldo final del mes anterior si sigue abierto)
        //   3) 0                         (enero sin arrastre del año previo)
        const sacum = await this.obtenerSacum(linea.ctacontable, empresaId, anio, periodo);
        mov = this.movctaRepo.create({
          empresaId,
          monedaId: 1, // Lempiras por defecto
          ctacontable: linea.ctacontable,
          anio,
          periodo,
          sacum,
          debe: montoDebito,
          haber: montoCredito,
          saldo: sacum + montoDebito - montoCredito,
          ultnropda: nropartida,
          fecultmov: new Date(),
          usuarioCreated: currentUser,
        });
        await this.movctaRepo.save(mov);
      }
    }
  }

  /**
   * Acumulado inicial (sacum) para la PRIMERA fila de `coctamov` de una cuenta
   * en un período. Fuente: espejo del cierre anterior → saldo del mes anterior → 0.
   *
   * Regla del estándar de saldos acumulados (AGENTS.md):
   *   sacum = cocierredet[mes-1].saldo, y saldo = sacum + (debe - haber).
   */
  private async obtenerSacum(
    ctacontable: string,
    empresaId: number,
    anio: number,
    periodo: number,
  ): Promise<number> {
    const periodoAnt = periodo === 1 ? 12 : periodo - 1;
    const anioAnt = periodo === 1 ? anio - 1 : anio;

    // 1) Espejo del cierre del mes anterior (fuente de secuencia si existe)
    const cierreAnt = await this.saldosCierreRepo.findOne({
      where: { ctacontable, empresaId, anio: anioAnt, periodo: periodoAnt } as unknown as FindOptionsWhere<Cocierredet>,
    });
    if (cierreAnt) return Number(cierreAnt.saldo) || 0;

    // 2) Mes anterior aún abierto → saldo final registrado en coctamov
    const movAnt = await this.movctaRepo.findOne({
      where: { ctacontable, empresaId, anio: anioAnt, periodo: periodoAnt } as unknown as FindOptionsWhere<Coctamov>,
    });
    if (movAnt) return Number(movAnt.saldo) || 0;

    // 3) Sin arrastre (enero sin cierre del año anterior)
    return 0;
  }

  /**
   * Actualiza la tabla de saldos mensuales (coctasaldos) escribiendo el
   * SALDO FINAL del mes — NO el neto del mes.
   *
   * Regla (30/09/2026 — estándar de saldos acumulados):
   *   saldoFinal(mes) = saldo acumulado al cierre del mes ANTERIOR + (debe - haber)
   *
   * El acumulado se toma de `cocierredet[mes-1]` (espejo del cierre anterior =
   * fuente de secuencia). Si no hay espejo se cae a la celda del mes anterior en
   * `coctasaldos` (que ya guarda saldo final) y, para enero, a `saldoanterior`.
   *
   * El neto se recalcula SIEMPRE desde copdadet con bandera simple
   * (`sn_contabilizada='S'`, 10/10/2026) en vez de usar el tramo de
   * `lineas`: así la celda queda igual aunque varias partidas posteen el
   * mismo mes (idempotente y a prueba de batches).
   *
   * Criterio único de reconstrucción/cálculo (NOTA del usuario): solo importa
   * que la línea esté CONTABILIZADA. `S/S` (original contraedida) cuenta —
   * permanece en el mayor; `S/N` (anulada normal) no cuenta.
   */
  private async actualizarSaldosCuentas(
    lineas: { ctacontable: string; debito: number; credito: number }[],
    empresaId: number,
    periodo: number,
    anio: number,
    currentUser: string,
  ): Promise<void> {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    const mesColumna = meses[periodo - 1];
    const redondear = (n: number) => Math.round(n * 100) / 100;

    // 1. Neto TOTAL del mes por cuenta (bandera simple) — no el tramo de `lineas`
    const netos = await this.copdadetRepo.createQueryBuilder('d')
      .select('d.ctacontable', 'ctacontable')
      .addSelect('SUM(d.debito) - SUM(d.credito)', 'neto')
      .where('d.empresaId = :empresaId', { empresaId })
      .andWhere('d.anio = :anio', { anio })
      .andWhere('d.periodo = :periodo', { periodo })
      .andWhere("d.sn_contabilizada = 'S'")
      .groupBy('d.ctacontable')
      .getRawMany();
    const netoPorCta = new Map<string, number>();
    for (const n of netos) netoPorCta.set(n.ctacontable, Number(n.neto) || 0);

    // 2. Acumulado al cierre del mes ANTERIOR (cocierredet) → base del arrastre
    const periodoAnt = periodo === 1 ? 12 : periodo - 1;
    const anioAnt = periodo === 1 ? anio - 1 : anio;
    const cierresAnt = await this.saldosCierreRepo.find({
      where: { empresaId, anio: anioAnt, periodo: periodoAnt } as unknown as FindOptionsWhere<Cocierredet>,
    });
    const acumPorCta = new Map<string, number>();
    for (const sc of cierresAnt) {
      acumPorCta.set(sc.ctacontable, (acumPorCta.get(sc.ctacontable) || 0) + (Number(sc.saldo) || 0));
    }

    for (const linea of lineas) {
      // Neto del mes COMPLETO para esta cuenta (puede ser 0 → se arrastra igual)
      const montoNeto = netoPorCta.get(linea.ctacontable) ?? 0;

      // Buscar saldo existente
      const saldo = await this.saldosctaRepo.findOne({
        where: {
          ctacontable: linea.ctacontable,
          empresaId,
          anio,
        } as unknown as FindOptionsWhere<Coctasaldos>,
      });

      // 3. Base del arrastre: cocierredet[mes-1] → celda[mes-1] → saldoanterior
      let base = acumPorCta.get(linea.ctacontable);
      if (base === undefined) {
        if (periodo === 1) {
          base = Number(saldo?.saldoanterior) || 0;
        } else {
          base = saldo ? Number((saldo as any)[meses[periodoAnt - 1]]) || 0 : 0;
        }
      }

      // 4. SALDO FINAL = acumulado del mes anterior + neto del mes
      const saldoFinal = redondear(base + montoNeto);

      if (saldo) {
        (saldo as any)[mesColumna] = saldoFinal;
        await this.saldosctaRepo.save(saldo);
      } else {
        // Crear nuevo registro de saldo
        const nuevoSaldo: any = {
          ctacontable: linea.ctacontable,
          empresaId,
          anio,
          saldoanterior: 0,
          usuarioCreated: currentUser,
        };
        // Inicializar todos los meses en 0
        for (const mes of meses) {
          nuevoSaldo[mes] = 0;
        }
        nuevoSaldo[mesColumna] = saldoFinal;

        const nuevoSaldoEntity = this.saldosctaRepo.create(nuevoSaldo);
        await this.saldosctaRepo.save(nuevoSaldoEntity);
      }
    }
  }

  // ==================== CIERRE CONTABLE ====================

  /**
   * Realiza el cierre de un período contable
   * 1. Valida que no existan partidas abiertas
   * 2. Marca el período como cerrado
   * 3. Registra el cierre
   */
  async realizarCierre(dto: CierreContableDto, currentUser: string): Promise<any> {
    // 1. Verificar que el período exista y esté abierto
    const periodo = await this.periodoctableRepo.findOne({
      where: {
        nroanio: dto.anio,
        nromes: dto.periodo,
        empresaId: dto.empresaId,
      } as unknown as FindOptionsWhere<Coperiodoctable>,
    });

    if (!periodo) {
      throw new BadRequestException(`No existe el período ${dto.periodo}/${dto.anio}`);
    }

    if (periodo.sn_abierto !== 'S') {
      throw new BadRequestException(`El período ${dto.periodo}/${dto.anio} ya está cerrado`);
    }

    // 1b. CIERRE SECUENCIAL: no se puede cerrar un período si quedan períodos anteriores abiertos.
    //     Garantiza que nunca exista un período cerrado con previos abiertos (los previos
    //     de un cerrado siempre están cerrados → inmutables).
    const todosPeriodos = await this.periodoctableRepo.find({
      where: { empresaId: dto.empresaId } as unknown as FindOptionsWhere<Coperiodoctable>,
    });
    const abiertosPrevios = todosPeriodos
      .filter(
        (p) =>
          p.sn_abierto === 'S' &&
          (p.nroanio < dto.anio || (p.nroanio === dto.anio && p.nromes < dto.periodo)),
      )
      .sort((a, b) => a.nroanio - b.nroanio || a.nromes - b.nromes);

    if (abiertosPrevios.length > 0) {
      const lista = abiertosPrevios.map((p) => `${p.nromes}/${p.nroanio}`).join(', ');
      throw new BadRequestException(
        `No se puede cerrar el período ${dto.periodo}/${dto.anio}: primero deben cerrarse los períodos anteriores abiertos: ${lista}`,
      );
    }

    // 2. Verificar que no existan facturas sin contabilizar del período
    const facturasPendientes = await this.facMaeRepo
      .createQueryBuilder('f')
      .where('f.empresaId = :empresaId', { empresaId: dto.empresaId })
      .andWhere('f.sn_contabilizada = :sn', { sn: 'N' })
      .andWhere('f.sn_anulada = :anul', { anul: 'N' })
      .andWhere('MONTH(f.fecharegistro) = :periodo', { periodo: dto.periodo })
      .andWhere('YEAR(f.fecharegistro) = :anio', { anio: dto.anio })
      .getCount();

    if (facturasPendientes > 0) {
      throw new BadRequestException(
        `No se puede cerrar: existen ${facturasPendientes} factura(s) sin contabilizar en el período ${dto.periodo}/${dto.anio}`,
      );
    }

    // 3. Obtener todos los movimientos contables del período
    const movimientos = await this.movctaRepo.find({
      where: {
        empresaId: dto.empresaId,
        anio: dto.anio,
        periodo: dto.periodo,
      } as unknown as FindOptionsWhere<Coctamov>,
    });

    // 4. Obtener cuentas de resultado (grupo 4=Ingresos, 5=Costos, 6=Gastos, 7=Otros)
    const cuentasResultado = await this.ctacontablesRepo
      .createQueryBuilder('cta')
      .where('cta.empresaId = :empresaId', { empresaId: dto.empresaId })
      .andWhere('cta.tcogrupocontableId IN (:...grupos)', { grupos: [4, 5, 6, 7] })
      .andWhere('cta.sn_operable = :sn', { sn: 'S' })
      .getMany();

    const ctasResultadoSet = new Set(cuentasResultado.map(c => c.ctacontable));
    // Mapa ctacontable → naturaleza (para cerrar según D/C, nunca por signo)
    const naturalezaResultadoMap = new Map(cuentasResultado.map(c => [c.ctacontable, c.naturaleza || 'D']));

    // 5. Construir líneas de la partida de cierre (inverso de cuentas de resultado)
    const lineasCierre: { ctacontable: string; descripcion: string; debito: number; credito: number }[] = [];
    let totalDebito = 0;
    let totalCredito = 0;

    for (const mov of movimientos) {
      if (!ctasResultadoSet.has(mov.ctacontable)) continue;

      // REGLA DE CIERRE: las cuentas de resultado (grupos 4-5-6-7) se cierran
      // SOLO con los MOVIMIENTOS DEL MES (debe - haber), NUNCA con el saldo
      // acumulado (sacum). El acumulado de cuentas de resultado no se toca.
      const movimientoMes = (Number(mov.debe) || 0) - (Number(mov.haber) || 0);
      const saldo = Math.abs(Math.round(movimientoMes * 100) / 100);
      if (saldo === 0) continue;

      // REGLA CONTABLE: saldo SIEMPRE positivo. La dirección la da la naturaleza:
      // - Naturaleza D (deudora): normalmente saldo deudor → se cierra con Crédito
      // - Naturaleza C (acreedora): normalmente saldo acreedor → se cierra con Débito
      const naturaleza = naturalezaResultadoMap.get(mov.ctacontable) || 'D';

      if (naturaleza === 'D') {
        // Saldo deudor → Crédito para cerrar
        lineasCierre.push({
          ctacontable: mov.ctacontable,
          descripcion: `Cierre ${dto.periodo}/${dto.anio}`,
          debito: 0,
          credito: saldo,
        });
        totalCredito += saldo;
      } else {
        // Saldo acreedor → Débito para cerrar
        lineasCierre.push({
          ctacontable: mov.ctacontable,
          descripcion: `Cierre ${dto.periodo}/${dto.anio}`,
          debito: saldo,
          credito: 0,
        });
        totalDebito += saldo;
      }
    }

    // 6. Si hay diferencia, va a "Utilidad del Ejercicio" (cuenta 1-200 por defecto)
    const diferencia = Math.round((totalDebito - totalCredito) * 100) / 100;
    if (Math.abs(diferencia) > 0.01) {
      const ctaUtilidad = dto.ctaUtilidad ?? '3-1-13-001';
      if (diferencia > 0) {
        // Más débitos que créditos → la utilidad es acreedora (Crédito)
        lineasCierre.push({
          ctacontable: ctaUtilidad,
          descripcion: `Utilidad del período ${dto.periodo}/${dto.anio}`,
          debito: 0,
          credito: diferencia,
        });
        totalCredito += diferencia;
      } else {
        // Más créditos que débitos → la pérdida es deudora (Débito)
        lineasCierre.push({
          ctacontable: ctaUtilidad,
          descripcion: `Pérdida del período ${dto.periodo}/${dto.anio}`,
          debito: Math.abs(diferencia),
          credito: 0,
        });
        totalDebito += Math.abs(diferencia);
      }
    }

    // 7. Crear la partida de cierre automática
    // Reglas 1 y 4: fecharegistro impuesto por el backend (no el reloj del servidor)
    const fecharegistro = await this.fechaSistema.obtenerFechaRegistro(currentUser, dto.empresaId);
    const fecha = await this.fechaSistema.getFecha(dto.empresaId);
    const nropartida = await this.siguienteNropartida(currentUser, dto.empresaId);

    const copdamae = this.copdamaeRepo.create({
      empresaId: dto.empresaId,
      Idsucursal: dto.Idsucursal ?? 1,
      periodo: dto.periodo,
      anio: dto.anio,
      moduloId: 1, // Contabilidad
      documentoId: 0,
      fechadocumento: fecha,
      factordecambio: 0,
      nroreferencia: `CIERRE-${dto.periodo}-${dto.anio}`,
      descripcion: dto.observacion ?? `Partida de cierre período ${dto.periodo}/${dto.anio}`,
      nropartida,
      sn_anulada: 'N',
      // La partida de cierre también se postea a coctamov/coctasaldos (paso 9)
      sn_contabilizada: 'S',
      fecharegistro,
      usuarioCreated: currentUser,
    });
    const savedMae = await this.copdamaeRepo.save(copdamae);

    let nrofila = 1;
    for (const linea of lineasCierre) {
      const det = this.copdadetRepo.create({
        empresaId: dto.empresaId,
        Idsucursal: dto.Idsucursal ?? 1,
        partidaId: savedMae.partidaId,
        periodo: dto.periodo,
        anio: dto.anio,
        nropartida,
        moduloId: 1,
        nrofila: nrofila++,
        ctacontable: linea.ctacontable,
        descripcion: linea.descripcion,
        debito: linea.debito,
        credito: linea.credito,
        factordecambio: 0,
        sn_anulada: 'N',
        sn_contabilizada: 'S',
        fecharegistro,
        usuarioCreated: currentUser,
      });
      await this.copdadetRepo.save(det);
    }

    // 8. Registrar (o reutilizar) el maestro de cierre — cocierremae.
    //    Se crea ANTES del detalle porque cocierredet.cocierremaeId tiene FK hacia cocierremae.
    let savedCierre = await this.cierrectableRepo.findOne({
      where: { empresaId: dto.empresaId, anio: dto.anio, periodo: dto.periodo } as unknown as FindOptionsWhere<Cocierrectable>,
    });
    if (!savedCierre) {
      const cierre = this.cierrectableRepo.create({
        empresaId: dto.empresaId,
        periodo: dto.periodo,
        anio: dto.anio,
        fechacierre: fecha,
        // observacion es varchar(20) en cocierremae
        observacion: (dto.observacion ?? `Cierre ${dto.periodo}/${dto.anio}`).slice(0, 20),
        sn_activo: 'S',
        usuarioCreated: currentUser,
      });
      savedCierre = await this.cierrectableRepo.save(cierre);
    }

    // 9. Actualizar movimientos contables con el nropartida de cierre
    //     (postea la partida de cierre en coctamov y coctasaldos ANTES de
    //     calcular el espejo: así coctasaldos del mes ya refleja el cierre)
    await this.actualizarMovimientosContables(lineasCierre, dto.empresaId, nropartida, dto.periodo, dto.anio, currentUser);
    await this.actualizarSaldosCuentas(lineasCierre, dto.empresaId, dto.periodo, dto.anio, currentUser);

    // 10. Guardar saldos de cierre: ESPEJO COMPLETO — hojas operables + padres
    //     mayorizados por niveles (misma normativa que genera el Libro Mayor).
    //     SE EJECUTA DESPUÉS de postear la partida de cierre: la fuente es
    //     coctasaldos (saldoanterior + meses ≤ periodo) y debe ser POSTcierre
    //     para que los consumidores (Libro Mayor apertura, arrastre de
    //     mayorizarSaldoFinal) lean los saldos ya cerrados. Si se ejecutara
    //     antes, el espejo guardaría ingresos sin cerrar y omitiría la
    //     utilidad del período (saldo 0 en ese momento).
    const saldosFinales = await this.mayorizarSaldoFinal(dto.empresaId, dto.anio, dto.periodo);

    for (const [ctacontable, saldo] of saldosFinales) {
      // TODAS las cuentas del catálogo se insertan, INCLUSO con saldo 0
      // (snapshot completo; el Map ya viene ordenado por ctacontable asc).

      // tiposaldo = lado del saldo final = saldo acumulado + (debe - haber).
      // positivo → D (deudor), negativo → C (acreedor). Mismo criterio que
      // movcta/saldoscta: la dirección la da el signo, nunca la naturaleza.
      const tiposaldo = saldo >= 0 ? 'D' : 'C';

      await this.saldosCierreRepo
        .createQueryBuilder()
        .insert()
        .into(Cocierredet)
        .values({
          cocierremaeId: savedCierre.cierrectableId,
          anio: dto.anio,
          periodo: dto.periodo,
          ctacontable,
          saldo,
          tiposaldo,
          Idsucursal: dto.Idsucursal ?? 1,
          empresaId: dto.empresaId,
          usuarioCreated: currentUser,
          usuarioUpdated: currentUser,
          fechaUpdated: fecha,
        } as any)
          .orUpdate({
            // Unique key fisica de cocierredet: (ctacontable, anio, periodo, empresaId)
            conflict_target: ['ctacontable', 'anio', 'periodo', 'empresaId'],
          overwrite: ['saldo', 'tiposaldo', 'periodo', 'cocierremaeId', 'usuarioUpdated', 'fechaUpdated'],
        })
        .execute();
    }

    // 11. Cerrar el período
    periodo.sn_abierto = 'N';
    periodo.usuarioUpdated = currentUser;
    await this.periodoctableRepo.save(periodo);

    // 12. Marcar TODAS las partidas del período como cerradas (mae + det).
    //     Control a nivel de fila: sn_cerrada='S' bloquea editar/eliminar la
    //     partida (ver exigirPartidaModificable en contabilidad.service).
    //     Incluye la partida de cierre recién creada (mismo empresa/anio/periodo).
    const cierreMae = await this.copdamaeRepo.createQueryBuilder()
      .update(Copdamae)
      .set({ sn_cerrada: 'S', usuarioUpdated: currentUser, fechaUpdated: fecha })
      .where('empresaId = :eid AND anio = :anio AND periodo = :periodo', {
        eid: dto.empresaId,
        anio: dto.anio,
        periodo: dto.periodo,
      })
      .execute();
    // Subquery sobre copdamae (no sobre d.anio/d.periodo) → garantiza que mae y det
    // queden marcados de forma consistente aunque alguna línea antigua tenga NULL.
    const cierreDet = await this.copdadetRepo.createQueryBuilder()
      .update(Copdadet)
      .set({ sn_cerrada: 'S', usuarioUpdated: currentUser, fechaUpdated: fecha })
      .where('partidaId IN (SELECT partidaId FROM copdamae WHERE empresaId = :eid AND anio = :anio AND periodo = :periodo)', {
        eid: dto.empresaId,
        anio: dto.anio,
        periodo: dto.periodo,
      })
      .execute();

    this.logger.log(
      `Cierre ${dto.periodo}/${dto.anio} realizado por ${currentUser} - Empresa ${dto.empresaId} - `
      + `Partida #${nropartida} - partidas marcadas como cerradas: ${cierreMae.affected ?? 0} mae / ${cierreDet.affected ?? 0} det`,
    );
    return { ...savedCierre, nropartida, lineas: lineasCierre.length };
  }

  /**
   * REVERSIÓN DE CIERRE / REAPERTURA DE PERÍODO CONTABLE
   * ======================================================================
   * Deshace, en orden inverso y dentro de UNA transacción, todo lo que hizo
   * realizarCierre(). Si algo falla, la base de datos queda exactamente como
   * estaba (rollback).
   *
   * 1. Valida que el período exista y esté CERRADO
   * 2. Secuencia inversa: no se puede reabrir si hay PERÍODOS POSTERIORES cerrados
   * 3. No puede haber PARTIDAS en períodos posteriores (sus acumulados dependen
   *    de este cierre)
   * 4. Revierte coctamov y coctasaldos con las líneas de la partida de cierre
   * 5. Elimina la partida de cierre (copdadet → copdamae, FK RESTRICT)
   * 6. Elimina el espejo de saldos (cocierredet → cocierremae)
   * 7. Quita sn_cerrada='S' a las partidas restantes del período
   * 8. Reabre el período (sn_abierto='S')
   */
  async revertirCierre(dto: CierreContableDto, currentUser: string): Promise<any> {
    const { empresaId, anio, periodo } = dto;
    const etiqueta = `${periodo}/${anio}`;

    // 1. El período debe existir y estar CERRADO
    const periodoEnt = await this.periodoctableRepo.findOne({
      where: { nroanio: anio, nromes: periodo, empresaId } as unknown as FindOptionsWhere<Coperiodoctable>,
    });

    if (!periodoEnt) {
      throw new NotFoundException(`No existe el período ${etiqueta}`);
    }

    if (periodoEnt.sn_abierto !== 'N') {
      throw new BadRequestException(`El período ${etiqueta} no está cerrado: no hay cierre que revertir`);
    }

    // 2. Secuencia inversa: no reabrir si quedan períodos posteriores cerrados
    const todosPeriodos = await this.periodoctableRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<Coperiodoctable>,
    });
    const posterioresCerrados = todosPeriodos
      .filter(
        (p) =>
          p.sn_abierto === 'N' &&
          (p.nroanio > anio || (p.nroanio === anio && p.nromes > periodo)),
      )
      .sort((a, b) => a.nroanio - b.nroanio || a.nromes - b.nromes);

    if (posterioresCerrados.length > 0) {
      const lista = posterioresCerrados.map((p) => `${p.nromes}/${p.nroanio}`).join(', ');
      throw new BadRequestException(
        `No se puede revertir el cierre de ${etiqueta}: primero deben revertirse los cierres de los períodos posteriores: ${lista}`,
      );
    }

    // 3. No puede haber partidas en períodos posteriores: sus acumulados en
    //    coctamov dependen de este cierre y quedarían desfasados.
    const partidasPosteriores = await this.copdamaeRepo
      .createQueryBuilder('m')
      .where('m.empresaId = :eid', { eid: empresaId })
      .andWhere('(m.anio > :anio OR (m.anio = :anio AND m.periodo > :periodo))', { anio, periodo })
      .getCount();

    if (partidasPosteriores > 0) {
      throw new BadRequestException(
        `No se puede revertir el cierre de ${etiqueta}: existen ${partidasPosteriores} partida(s) en períodos posteriores. `
        + 'Los acumulados de esos períodos dependen de este cierre; revierta primero los más recientes.',
      );
    }

    // 4. Localizar la partida de cierre creada por realizarCierre
    //    (nroreferencia = CIERRE-{periodo}-{anio})
    const partidaCierre = await this.copdamaeRepo.findOne({
      where: {
        empresaId,
        anio,
        periodo,
        nroreferencia: `CIERRE-${periodo}-${anio}`,
        sn_anulada: 'N',
      } as unknown as FindOptionsWhere<Copdamae>,
    });

    if (partidaCierre) {
      // 4b. La partida de cierre no debe tener transacciones externas (FK RESTRICT)
      const refs = await this.dataSource.query(
        `SELECT
           (SELECT COUNT(*) FROM cotrxref   WHERE partidaId = ?) AS trxref,
           (SELECT COUNT(*) FROM posfacmov WHERE partidaId = ?) AS posfacmov`,
        [partidaCierre.partidaId, partidaCierre.partidaId],
      );
      const totalRefs = (Number(refs?.[0]?.trxref) || 0) + (Number(refs?.[0]?.posfacmov) || 0);
      if (totalRefs > 0) {
        throw new BadRequestException(
          `No se puede revertir el cierre de ${etiqueta}: la partida de cierre #${partidaCierre.nropartida} `
          + `tiene ${totalRefs} transacción(es) asociadas en facturación / referencias.`,
        );
      }
    }

    const fecha = await this.fechaSistema.getFecha(empresaId);
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    const redondear = (n: number) => Math.round(n * 100) / 100;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    let movimientosRevertidos = 0;
    let saldosRevertidos = 0;

    try {
      if (partidaCierre) {
        // 5. Líneas de la partida de cierre, agrupadas por cuenta
        const lineas = await qr.manager.getRepository(Copdadet).find({
          where: { partidaId: partidaCierre.partidaId },
        });

        const porCuenta = new Map<string, { debito: number; credito: number }>();
        for (const linea of lineas) {
          const d = Number(linea.debito) || 0;
          const c = Number(linea.credito) || 0;
          if (d === 0 && c === 0) continue;
          const acum = porCuenta.get(linea.ctacontable) || { debito: 0, credito: 0 };
          acum.debito += d;
          acum.credito += c;
          porCuenta.set(linea.ctacontable, acum);
        }

        for (const [ctacontable, tot] of porCuenta) {
          // 5a. coctamov: restar exactamente lo que la partida de cierre acumuló
          const mov = await qr.manager.getRepository(Coctamov).findOne({
            where: { ctacontable, empresaId, anio, periodo },
          });

          if (mov) {
            const nuevoDebe = redondear((Number(mov.debe) || 0) - tot.debito);
            const nuevoHaber = redondear((Number(mov.haber) || 0) - tot.credito);
            // Regla de saldo de coctamov: acumulado a inicios del período (sacum)
            // + (debe - haber) del período. SIN sacum se pierde el acumulado
            // anterior y la partida de cierre deja un residual al re-cerrar.
            const nuevoSaldo = redondear((Number(mov.sacum) || 0) + nuevoDebe - nuevoHaber);

            await qr.manager
              .createQueryBuilder()
              .update(Coctamov)
              .set({
                debe: nuevoDebe,
                haber: nuevoHaber,
                saldo: nuevoSaldo,
                usuarioUpdated: currentUser,
                fechaUpdated: fecha,
              })
              .where('coctamovId = :id', { id: mov.movctascontablesId })
              .execute();
            movimientosRevertidos++;
          }

          // 5b. coctasaldos: restar el neto de la columna del mes
          const neto = redondear(tot.debito - tot.credito);
          if (neto !== 0) {
            const col = meses[periodo - 1];
            const saldoCta = await qr.manager.getRepository(Coctasaldos).findOne({
              where: { ctacontable, empresaId, anio },
            });

            if (saldoCta) {
              const nuevoValor = redondear((Number((saldoCta as any)[col]) || 0) - neto);
              await qr.manager
                .createQueryBuilder()
                .update(Coctasaldos)
                .set({ [col]: nuevoValor, usuarioUpdated: currentUser, fechaUpdated: fecha } as any)
                .where('cosaldosctaId = :id', { id: saldoCta.cosaldosctaId })
                .execute();
              saldosRevertidos++;
            }
          }
        }

        // 5c. Eliminar la partida de cierre: primero detalle, luego maestro (FK RESTRICT)
        await qr.manager.getRepository(Copdadet).delete({ partidaId: partidaCierre.partidaId });
        await qr.manager.getRepository(Copdamae).delete({ partidaId: partidaCierre.partidaId });
      }

      // 6. Eliminar el espejo de saldos del cierre (cocierredet → cocierremae)
      const cierreMae = await qr.manager.getRepository(Cocierrectable).findOne({
        where: { empresaId, anio, periodo } as unknown as FindOptionsWhere<Cocierrectable>,
      });

      if (cierreMae) {
        await qr.manager.getRepository(Cocierredet).delete({ cocierremaeId: cierreMae.cierrectableId });
        await qr.manager.getRepository(Cocierrectable).delete({ cierrectableId: cierreMae.cierrectableId });
      }

      // 7. Quitar sn_cerrada='S' a las partidas restantes del período (mae + det)
      const updMae = await qr.manager
        .createQueryBuilder()
        .update(Copdamae)
        .set({ sn_cerrada: 'N', usuarioUpdated: currentUser, fechaUpdated: fecha })
        .where('empresaId = :eid AND anio = :anio AND periodo = :periodo', { eid: empresaId, anio, periodo })
        .execute();

      const updDet = await qr.manager
        .createQueryBuilder()
        .update(Copdadet)
        .set({ sn_cerrada: 'N', usuarioUpdated: currentUser, fechaUpdated: fecha })
        .where(
          'partidaId IN (SELECT partidaId FROM copdamae WHERE empresaId = :eid AND anio = :anio AND periodo = :periodo)',
          { eid: empresaId, anio, periodo },
        )
        .execute();

      // 8. Reabrir el período
      await qr.manager
        .createQueryBuilder()
        .update(Coperiodoctable)
        .set({ sn_abierto: 'S', usuarioUpdated: currentUser, fechaUpdated: fecha })
        .where('nroanio = :anio AND nromes = :periodo AND empresaId = :eid', { anio, periodo, eid: empresaId })
        .execute();

      await qr.commitTransaction();

      this.logger.log(
        `Reversión de cierre ${etiqueta} por ${currentUser} - Empresa ${empresaId} - `
        + `partida de cierre: ${partidaCierre ? '#' + partidaCierre.nropartida : 'no encontrada'} - `
        + `movimientos revertidos: ${movimientosRevertidos}, saldos revertidos: ${saldosRevertidos}, `
        + `partidas liberadas: ${updMae.affected ?? 0} mae / ${updDet.affected ?? 0} det`,
      );

      return {
        periodo,
        anio,
        partidaCierre: partidaCierre ? partidaCierre.nropartida : null,
        movimientosRevertidos,
        saldosRevertidos,
        partidasLiberadas: (updMae.affected ?? 0) + (updDet.affected ?? 0),
        cierreEliminado: !!cierreMae,
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  /**
   * Valida que un período esté abierto. Lanzar BadRequestException si está cerrado.
   * Llamar desde facturación, CxC, CxP antes de crear transacciones.
   */
  async validarPeriodoAbierto(empresaId: number, fecha: Date): Promise<void> {
    const periodo = fecha.getMonth() + 1;
    const anio = fecha.getFullYear();
    const existe = await this.periodoctableRepo.findOne({
      where: {
        nroanio: anio,
        nromes: periodo,
        empresaId,
      } as unknown as FindOptionsWhere<Coperiodoctable>,
    });
    if (!existe || existe.sn_abierto !== 'S') {
      throw new BadRequestException(
        `El período ${periodo}/${anio} está cerrado. No se pueden registrar movimientos.`,
      );
    }
  }

  // ==================== REPORTES ====================

  /**
   * Genera Balance de Comprobación
   * Lista todas las cuentas con movimiento en el período, mostrando débitos, créditos y saldos
   */
  async generarBalanceComprobacion(dto: ReporteContableDto): Promise<any[]> {
    // Obtener todos los movimientos del período
    const movimientos = await this.movctaRepo.find({
      where: {
        empresaId: dto.empresaId,
        anio: dto.anio,
        periodo: dto.periodo,
      } as unknown as FindOptionsWhere<Coctamov>,
    });

    // Agrupar por cuenta
    const mapaCuentas = new Map<string, { debe: number; haber: number; saldo: number }>();

    for (const mov of movimientos) {
      const clave = mov.ctacontable;
      const actual = mapaCuentas.get(clave) || { debe: 0, haber: 0, saldo: 0 };
      actual.debe += Number(mov.debe) || 0;
      actual.haber += Number(mov.haber) || 0;
      actual.saldo = actual.debe - actual.haber;
      mapaCuentas.set(clave, actual);
    }

    // Enriquecer con descripción de cuenta
    const resultado: any[] = [];
    for (const [ctacontable, datos] of mapaCuentas) {
      const cuenta = await this.ctacontablesRepo.findOne({
        where: { ctacontable, empresaId: dto.empresaId } as unknown as FindOptionsWhere<Coctacontables>,
      });

      resultado.push({
        ctacontable,
        descripcion: cuenta?.descripcion ?? '',
        saldoAnterior: 0,
        debeMes: datos.debe,
        haberMes: datos.haber,
        saldoDeudor: datos.saldo > 0 ? datos.saldo : 0,
        saldoAcreedor: datos.saldo < 0 ? Math.abs(datos.saldo) : 0,
      });
    }

    return resultado.sort((a, b) => a.ctacontable.localeCompare(b.ctacontable));
  }

  /**
   * Genera Estado de Resultado — 3 variantes POR SEPARADO (decisión usuario
   * 05/10/2026: no se muestran columnas juntas; se genera UNA por vez):
   *   'P' Período:    mes seleccionado del año
   *   'A' Acumulado:  enero → mes del año
   *   'N' Anterior:   mismo mes del año anterior
   *
   * Formato estándar multi-paso con subtotales (grupos del plan tras la
   * reestructuración 05/10/2026; componentes 4,5,6,7,10 y 8/9 solo si existen):
   *   Ingresos (4) − Costo de ventas (6) − Costo de producción (7) = Utilidad bruta
   *   Utilidad bruta − Gastos (5)                                 = Utilidad operativa
   *   Utilidad operativa ± Ingresos imputados (10) ± Cuentas de orden (8)
   *       ± Resultado del ejercicio (9)                            = Utilidad del período
   *
   * Convención firmada por grupo (naturaleza ER; NO se lee la columna `naturaleza`):
   *   4, 9, 10 (acreedoras): valor = crédito − débito  (positivo = ingreso/ganancia)
   *   5, 6, 7  (deudoras):   valor = débito − crédito  (positivo = costo/gasto)
   *   8 (cuentas de orden):  valor = débito − crédito
   * Bandera simple `sn_contabilizada='S'` (10/10/2026; antes doble bandera
   * regla 29/09/2026) y filtro por la columna `periodo` (NO por
   * fecharegistro — regla 29/09/2026). Incluye originales contraedidas (S/S)
   * y sus contras (N/S): el ER presenta el flujo real del período.
   */
  async generarEstadoResultado(dto: ReporteEstadoResultadoDto) {
    if (!Number.isInteger(dto.anio) || dto.anio < 1900 || dto.anio > 2200) {
      throw new BadRequestException(`Año inválido: ${dto.anio}`);
    }
    if (!Number.isInteger(dto.periodo) || dto.periodo < 1 || dto.periodo > 12) {
      throw new BadRequestException(`Período inválido: ${dto.periodo} (debe estar entre 1 y 12)`);
    }

    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const r2 = (n: number): number => Math.round(n * 100) / 100;

    const qb = this.copdadetRepo
      .createQueryBuilder('d')
      .select('d.ctacontable', 'ctacontable')
      .addSelect('SUM(d.debito)', 'debito')
      .addSelect('SUM(d.credito)', 'credito')
      .addSelect('MAX(c.descripcion)', 'descripcion')
      .leftJoin(Coctacontables, 'c', 'c.ctacontable = d.ctacontable AND c.empresaId = d.empresaId')
      .leftJoin(Copdamae, 'm', 'm.partidaId = d.partidaId')
      .where('d.empresaId = :empresaId', { empresaId: dto.empresaId })
      .andWhere(`d.sn_contabilizada = 'S'`)
      // El ER presenta la operación real del período: se EXCLUYEN las partidas
      // de cierre (traspaso a Resultados Acumulados que pone ingresos/gastos a
      // 0). Sin esto, un mes cerrado netearía a 0 en Período y Acumulado.
      .andWhere(`(m.nroreferencia IS NULL OR m.nroreferencia NOT LIKE 'CIERRE-%')`)
      .andWhere(`SUBSTRING_INDEX(d.ctacontable, '-', 1) IN ('4', '5', '6', '7', '8', '9', '10')`);

    let etiqueta: string;
    if (dto.tipo === 'P') {
      qb.andWhere('d.anio = :anio AND d.periodo = :periodo', { anio: dto.anio, periodo: dto.periodo });
      etiqueta = `Período: ${meses[dto.periodo - 1]} ${dto.anio}`;
    } else if (dto.tipo === 'A') {
      qb.andWhere('d.anio = :anio AND d.periodo BETWEEN 1 AND :periodo', {
        anio: dto.anio,
        periodo: dto.periodo,
      });
      etiqueta = `Acumulado: enero – ${meses[dto.periodo - 1]} ${dto.anio}`;
    } else {
      qb.andWhere('d.anio = :anio AND d.periodo = :periodo', { anio: dto.anio - 1, periodo: dto.periodo });
      etiqueta = `Año anterior: ${meses[dto.periodo - 1]} ${dto.anio - 1}`;
    }

    const raws = await qb
      .groupBy('d.ctacontable')
      .orderBy('d.ctacontable', 'ASC')
      .getRawMany<{ ctacontable: string; debito: string; credito: string; descripcion: string | null }>();

    // Naturaleza ER por grupo (acreedoras: ingreso = crédito − débito)
    const ACREEDORAS = new Set(['4', '9', '10']);
    const porGrupo = new Map<number, Array<{ ctacontable: string; descripcion: string; valor: number }>>();
    for (const r of raws) {
      const segText = String(r.ctacontable).split('-')[0];
      const seg = Number(segText);
      if (!Number.isInteger(seg)) continue;
      const deb = Number(r.debito) || 0;
      const cred = Number(r.credito) || 0;
      const valor = r2(ACREEDORAS.has(segText) ? cred - deb : deb - cred);
      if (valor === 0) continue; // sin impacto en el ER → no se lista
      const lista = porGrupo.get(seg) ?? [];
      lista.push({ ctacontable: r.ctacontable, descripcion: r.descripcion ?? '', valor });
      porGrupo.set(seg, lista);
    }

    const suma = (g: number): number =>
      r2((porGrupo.get(g) ?? []).reduce((s, c) => s + c.valor, 0));

    const ingresos = suma(4);
    const costoVentas = suma(6);
    const costoProduccion = suma(7);
    const gastos = suma(5);
    const imputados = suma(10);
    const cuentasOrden = suma(8);
    const resultadoEjercicio = suma(9);

    const utilidadBruta = r2(ingresos - costoVentas - costoProduccion);
    const utilidadOperativa = r2(utilidadBruta - gastos);
    const utilidad = r2(utilidadOperativa + imputados + cuentasOrden + resultadoEjercicio);

    type Linea =
      | { tipo: 'seccion'; titulo: string }
      | { tipo: 'cuenta'; ctacontable: string; descripcion: string; valor: number }
      | { tipo: 'total'; titulo: string; valor: number }
      | { tipo: 'resultado'; titulo: string; valor: number };

    const lineas: Linea[] = [];
    const empujarSeccion = (grupo: number, titulo: string, total: number, totalTitulo: string): void => {
      lineas.push({ tipo: 'seccion', titulo });
      for (const c of porGrupo.get(grupo) ?? []) lineas.push({ tipo: 'cuenta', ...c });
      lineas.push({ tipo: 'total', titulo: totalTitulo, valor: total });
    };

    // Componentes obligatorios (4, 6, 7, 5, 10) — siempre presentes en el formato
    empujarSeccion(4, 'INGRESOS OPERACIONALES', ingresos, 'Total Ingresos');
    empujarSeccion(6, '(−) COSTO DE VENTAS', costoVentas, 'Total Costo de Ventas');
    empujarSeccion(7, '(−) COSTO DE PRODUCCIÓN', costoProduccion, 'Total Costo de Producción');
    lineas.push({ tipo: 'resultado', titulo: 'UTILIDAD BRUTA', valor: utilidadBruta });
    empujarSeccion(5, '(−) GASTOS OPERATIVOS', gastos, 'Total Gastos Operativos');
    lineas.push({ tipo: 'resultado', titulo: 'UTILIDAD OPERATIVA', valor: utilidadOperativa });
    empujarSeccion(10, '(+) INGRESOS IMPUTADOS AL PATRIMONIO', imputados, 'Total Ingresos Imputados');
    // Grupos 8 y 9 solo se muestran si tienen movimiento (decisión usuario)
    if (cuentasOrden !== 0) empujarSeccion(8, '(±) CUENTAS DE ORDEN', cuentasOrden, 'Total Cuentas de Orden');
    if (resultadoEjercicio !== 0)
      empujarSeccion(9, '(±) RESULTADO DEL EJERCICIO', resultadoEjercicio, 'Total Resultado del Ejercicio');
    lineas.push({
      tipo: 'resultado',
      titulo: utilidad >= 0 ? 'UTILIDAD DEL PERÍODO' : 'PÉRDIDA DEL PERÍODO',
      valor: utilidad,
    });

    return {
      tipo: dto.tipo,
      anio: dto.anio,
      periodo: dto.periodo,
      etiqueta,
      lineas,
      subtotales: {
        ingresos,
        costoVentas,
        costoProduccion,
        utilidadBruta,
        gastos,
        utilidadOperativa,
        imputados,
        cuentasOrden,
        resultadoEjercicio,
        utilidad,
      },
    };
  }

  /**
   * Genera Libro Diario
   * Lista todas las partidas contables del período con sus detalles
   * Filtros: ctacontable (auxiliar), fechaDesde, fechaHasta
   */
  async generarLibroDiario(dto: ReporteContableDto): Promise<any[]> {
    // Bandera simple (10/10/2026): el Libro Diario muestra AMBAS partes del
    // par original/contrapartida (decisión 1): originales contraedidas (S/S)
    // y contras (N/S) entran; anuladas normales (S/N) quedan fuera.
    const qbMae = this.copdamaeRepo.createQueryBuilder('mae')
      .where('mae.empresaId = :empresaId', { empresaId: dto.empresaId })
      .andWhere('mae.sn_contabilizada = :sn', { sn: 'S' });

    // Filtro por período/año (legacy)
    if (dto.periodo != null && dto.anio != null) {
      qbMae.andWhere('mae.periodo = :periodo', { periodo: dto.periodo })
           .andWhere('mae.anio = :anio', { anio: dto.anio });
    }

    // Filtro por rango de fechas
    if (dto.fechaDesde) {
      qbMae.andWhere('mae.fechadocumento >= :fechaDesde', { fechaDesde: dto.fechaDesde });
    }
    if (dto.fechaHasta) {
      qbMae.andWhere('mae.fechadocumento <= :fechaHasta', { fechaHasta: dto.fechaHasta + ' 23:59:59' });
    }

    qbMae.orderBy('mae.nropartida', 'ASC');

    const partidas = await qbMae.getMany();
    const resultado: any[] = [];

    for (const mae of partidas) {
      // Construir query de detalles con filtro auxiliar
      const qbDet = this.copdadetRepo.createQueryBuilder('det')
        .where('det.partidaId = :partidaId', { partidaId: mae.partidaId })
        .andWhere('det.sn_contabilizada = :sn', { sn: 'S' });

      if (dto.ctacontable) {
        qbDet.andWhere('det.ctacontable LIKE :cta', { cta: `${dto.ctacontable}%` });
      }

      const detalles = await qbDet.orderBy('det.nrofila', 'ASC').getMany();

      // Si se filtra por auxiliar y no hay detalles que coincidan, omitir la partida
      if (dto.ctacontable && detalles.length === 0) continue;

      resultado.push({
        nropartida: mae.nropartida,
        fecha: mae.fechadocumento,
        descripcion: mae.descripcion,
        referencia: mae.nroreferencia,
        lineas: detalles.map(d => ({
          ctacontable: d.ctacontable,
          descripcion: d.descripcion,
          debito: Number(d.debito) || 0,
          credito: Number(d.credito) || 0,
        })),
        totalDebito: detalles.reduce((s, d) => s + (Number(d.debito) || 0), 0),
        totalCredito: detalles.reduce((s, d) => s + (Number(d.credito) || 0), 0),
      });
    }

    return resultado;
  }

  /**
   * ESPEJO DE SALDOS (cocierredet): saldo acumulado al cierre de TODAS las
   * cuentas del catálogo, ordenado por ctacontable asc. (Mejora 30/09/2026)
   *
   * Regla de negocio:
   * - Se inserta TODA la cuenta de coctacontables (activas), INCLUSO con
   *   saldo 0 — el espejo es un snapshot completo del estado al cierre.
   * - Hoja operable: acumulado = BASE + neto del período.
   *     · BASE = espejo del período anterior (cocierredet[P-1]): el saldo que
   *       quede en el cierre de abril es el acumulado de base de mayo.
   *       Si NO existe espejo anterior (primer cierre del año o meses
   *       reconstruidos): coctasaldos.saldoanterior + meses < periodo.
   *     · neto = SUM(debe - haber) por cuenta en coctamov del período, con la
   *       partida de cierre ya posteada (paso 9) → estado POSTcierre.
   * - Padres / grupos (no operables): MAYORIZACIÓN ESCALONADA nivel máx → 1:
   *
   *       total = Σ hijos (ya mayorizados) + movimientos propios del período
   *
   *   El acumulado previo de un PADRE NO se suma por separado: viene contenido
   *   en sus hijos (sumarlo duplicaría el saldo). Por eso generarLibroMayor y
   *   generarBalanceDinamico ignoran las filas de cuentas no operables al
   *   construir su mapa de acumulados.
   *
   * El Map resultante conserva el orden de inserción = catálogo ordenado
   * por ctacontable asc, que es el orden en que se inserta en cocierredet.
   */
  private async mayorizarSaldoFinal(
    empresaId: number,
    anio: number,
    periodo: number,
  ): Promise<Map<string, number>> {
    const MESES_CIERRE = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];

    // 1. Catálogo de cuentas activas ORDENADO por ctacontable asc + mapa padre → hijos.
    //    Orden por comparación de código (misma semántica que MySQL ORDER BY ASC,
    //    no localeCompare de Node que trata la puntuación distinto).
    const cuentas = await this.ctacontablesRepo.find({
      where: { empresaId, sn_activo: 'S' } as unknown as FindOptionsWhere<Coctacontables>,
    });
    cuentas.sort((a, b) => {
      const x = String(a.ctacontable);
      const y = String(b.ctacontable);
      return x < y ? -1 : x > y ? 1 : 0;
    });

    const hijosPorPadre = new Map<string, Coctacontables[]>();
    for (const cta of cuentas) {
      if (!cta.padre) continue;
      const lista = hijosPorPadre.get(cta.padre) || [];
      lista.push(cta);
      hijosPorPadre.set(cta.padre, lista);
    }

    // 2. BASE = acumulado al cierre del período ANTERIOR (cocierredet).
    //    El saldo del espejo de abril será la base de mayo.
    const periodoAnt = periodo === 1 ? 12 : periodo - 1;
    const anioAnt = periodo === 1 ? anio - 1 : anio;
    const cierresAnt = await this.saldosCierreRepo.find({
      where: { empresaId, anio: anioAnt, periodo: periodoAnt } as unknown as FindOptionsWhere<Cocierredet>,
    });
    const basePorCta = new Map<string, number>();
    for (const sc of cierresAnt) {
      basePorCta.set(sc.ctacontable, (basePorCta.get(sc.ctacontable) || 0) + (Number(sc.saldo) || 0));
    }

    // Fallback cuando NO existe espejo anterior (primer cierre / meses
    // reconstruidos): coctasaldos.saldoanterior + meses anteriores al periodo.
    if (basePorCta.size === 0) {
      const saldosMensuales = await this.saldosctaRepo.find({
        where: { empresaId, anio } as unknown as FindOptionsWhere<Coctasaldos>,
      });
      for (const s of saldosMensuales) {
        let acumulado = Number(s.saldoanterior) || 0;
        for (let m = 0; m < periodo - 1 && m < MESES_CIERRE.length; m++) {
          acumulado += Number((s as any)[MESES_CIERRE[m]]) || 0;
        }
        if (acumulado !== 0) basePorCta.set(s.ctacontable, acumulado);
      }
    }

    // 3. Neto del período por cuenta desde coctamov (debe - haber).
    //    coctamov[P] ya incluye la partida de cierre (posteada en el paso 9).
    const movimientos = await this.movctaRepo.find({
      where: { empresaId, anio, periodo } as unknown as FindOptionsWhere<Coctamov>,
    });
    const netoPorCta = new Map<string, number>();
    for (const mv of movimientos) {
      const neto = (Number(mv.debe) || 0) - (Number(mv.haber) || 0);
      netoPorCta.set(mv.ctacontable, (netoPorCta.get(mv.ctacontable) || 0) + neto);
    }

    // 4. TODAS las cuentas del catálogo parten de 0 → se insertan también en cero.
    const resMap = new Map<string, number>();
    for (const cta of cuentas) {
      resMap.set(cta.ctacontable, 0);
    }

    // 5. Hojas operables: acumulado = base + neto del período.
    for (const cta of cuentas) {
      if (cta.sn_operable !== 'S') continue;
      const acumulado = (basePorCta.get(cta.ctacontable) || 0) + (netoPorCta.get(cta.ctacontable) || 0);
      resMap.set(cta.ctacontable, acumulado);
    }

    // 6. Mayorización escalonada de PADRES: nivel máx → 1 (hijos resueltos antes).
    const maxNivel = cuentas.reduce((max, c) => (c.nivel > max ? c.nivel : max), 1);

    for (let nivel = maxNivel; nivel >= 1; nivel--) {
      for (const padre of cuentas) {
        if (padre.nivel !== nivel || padre.sn_operable !== 'N') continue;

        const hijos = hijosPorPadre.get(padre.ctacontable) || [];
        if (hijos.length === 0) continue; // padre sin hijos queda en 0

        // Σ hijos (ya mayorizados si son grupos intermedios)
        let total = 0;
        for (const hijo of hijos) {
          total += resMap.get(hijo.ctacontable) ?? 0;
        }

        // + movimientos propios del período en coctamov (si los tuviera)
        total += netoPorCta.get(padre.ctacontable) || 0;

        resMap.set(padre.ctacontable, total);
      }
    }

    return resMap;
  }

  /**
   * Genera Libro Mayor con mayorización escalonada
   *
   * 1. Lee movimientos del periodo actual (coctamov)
   * 2. Lee saldos de cierre del periodo anterior (cocierredet) → saldo acumulado
   * 3. Mayoriza de abajo hacia arriba: nivel 4 → 3 → 2 → 1
   *    Cada nivel no operable (padre) suma los totales de sus hijas operables
   * 4. Retorna resultado ordenado por código de cuenta con jerarquía
   */
  async generarLibroMayor(dto: ReporteContableDto): Promise<any[]> {
    const empresaId = dto.empresaId;
    const periodo = dto.periodo!;
    const anio = dto.anio!;

    // ── 1. Movimientos del periodo actual ──
    const movimientos = await this.movctaRepo.find({
      where: {
        empresaId,
        anio,
        periodo,
      } as unknown as FindOptionsWhere<Coctamov>,
    });

    // ── 2. Saldo acumulado del periodo anterior (cierre) ──
    const periodoAnt = periodo === 1 ? 12 : periodo - 1;
    const anioAnt = periodo === 1 ? anio - 1 : anio;

    const saldosCierre = await this.saldosCierreRepo.find({
      where: {
        empresaId,
        anio: anioAnt,
        periodo: periodoAnt,
      } as unknown as FindOptionsWhere<Cocierredet>,
    });

    const saldoAcumMap = new Map<string, number>();

    // ── 3. Catálogo de cuentas ──
    const cuentas = await this.ctacontablesRepo.find({
      where: { empresaId, sn_activo: 'S' } as unknown as FindOptionsWhere<Coctacontables>,
    });

    const cuentaMap = new Map<string, Coctacontables>();
    for (const cta of cuentas) {
      cuentaMap.set(cta.ctacontable, cta);
    }

    // Acumulado anterior: SOLO cuentas operables. El acumulado de un PADRE se
    // deriva de sus hijos (mayorización, paso 7); tomar además su propia fila de
    // cocierredet duplicaría el saldo, porque esa fila ya es el mayorizado.
    for (const sc of saldosCierre) {
      const cta = cuentaMap.get(sc.ctacontable);
      if (cta && cta.sn_operable !== 'S') continue;
      saldoAcumMap.set(sc.ctacontable, (saldoAcumMap.get(sc.ctacontable) || 0) + (Number(sc.saldo) || 0));
    }

    // Mapa padre → hijos
    const hijosPorPadre = new Map<string, Coctacontables[]>();
    for (const cta of cuentas) {
      if (cta.padre) {
        const lista = hijosPorPadre.get(cta.padre) || [];
        lista.push(cta);
        hijosPorPadre.set(cta.padre, lista);
      }
    }

    // ── 4. Agregar movimientos por cuenta (nivel hoja) ──
    const movMap = new Map<string, { debe: number; haber: number }>();
    for (const mov of movimientos) {
      const key = mov.ctacontable;
      const ex = movMap.get(key) || { debe: 0, haber: 0 };
      ex.debe += Number(mov.debe) || 0;
      ex.haber += Number(mov.haber) || 0;
      movMap.set(key, ex);
    }

    // ── 5. Determinar nivel máximo ──
    const maxNivel = cuentas.reduce((max, c) => c.nivel > max ? c.nivel : max, 1);

    // ── 6. Resultado temporal por cuenta ──
    interface LineaMayor {
      ctacontable: string;
      descripcion: string;
      nivel: number;
      padre: string | null;
      sn_operable: string;
      debe: number;
      haber: number;
      saldo: number;
      saldoAcum: number;
    }

    const resMap = new Map<string, LineaMayor>();

    // Inicializar con todas las cuentas del catálogo que tienen movimiento o cierre
    // Empezar por hojas (operables)
    for (const cta of cuentas) {
      if (cta.sn_operable === 'S') {
        const mov = movMap.get(cta.ctacontable);
        const debe = mov?.debe || 0;
        const haber = mov?.haber || 0;
        const saldoAcum = saldoAcumMap.get(cta.ctacontable) || 0;
        // REGLA (AGENTS.md): saldo final = saldo acumulado anterior + (debe - haber)
        const saldo = saldoAcum + (debe - haber);

        // Solo incluir si tiene movimiento o saldo acumulado
        if (debe !== 0 || haber !== 0 || saldoAcum !== 0) {
          resMap.set(cta.ctacontable, {
            ctacontable: cta.ctacontable,
            descripcion: cta.descripcion,
            nivel: cta.nivel,
            padre: cta.padre,
            sn_operable: cta.sn_operable,
            debe,
            haber,
            saldo,
            saldoAcum,
          });
        }
      }
    }

    // ── 7. Mayorización escalonada: nivel max → 1 ──
    for (let nivel = maxNivel; nivel >= 1; nivel--) {
      // Buscar cuentas NO operables de este nivel
      const padresNivel = cuentas.filter(c => c.nivel === nivel && c.sn_operable === 'N');

      for (const padre of padresNivel) {
        const hijos = hijosPorPadre.get(padre.ctacontable) || [];
        if (hijos.length === 0) continue;

        let totalDebe = 0;
        let totalHaber = 0;
        let totalSaldoAcum = 0;
        let tieneMovimiento = false;

        const natPadre = padre.naturaleza || 'C';

        for (const hijo of hijos) {
          const hijoData = resMap.get(hijo.ctacontable);
          if (hijoData) {
            // CUENTA CONTRA (naturaleza distinta a la del padre) → se RESTA.
            // Ej.: 4-3 Devoluciones/Rebajas/Descuentos dentro de 4 Ventas →
            // el grupo presenta VENTAS NETAS (ventas − devoluciones).
            // saldoAcum NO se niega: ya viene firmado (D+ / C−) y suma neto correcto.
            const esContra = (hijo.naturaleza || 'C') !== natPadre;
            const signo = esContra ? -1 : 1;
            totalDebe += signo * hijoData.debe;
            totalHaber += signo * hijoData.haber;
            totalSaldoAcum += hijoData.saldoAcum;
            tieneMovimiento = true;
          }
        }

        // También sumar movimientos propios de la cuenta padre (si tiene)
        const movPropio = movMap.get(padre.ctacontable);
        if (movPropio) {
          totalDebe += movPropio.debe;
          totalHaber += movPropio.haber;
          tieneMovimiento = true;
        }
        const saldoAcumPropio = saldoAcumMap.get(padre.ctacontable) || 0;
        totalSaldoAcum += saldoAcumPropio;

        if (tieneMovimiento || totalSaldoAcum !== 0) {
          resMap.set(padre.ctacontable, {
            ctacontable: padre.ctacontable,
            descripcion: padre.descripcion,
            nivel: padre.nivel,
            padre: padre.padre,
            sn_operable: padre.sn_operable,
            debe: totalDebe,
            haber: totalHaber,
            saldo: totalSaldoAcum + (totalDebe - totalHaber),
            saldoAcum: totalSaldoAcum,
          });
        }
      }
    }

    // ── 8. Construir array ordenado por código (asegurar numéricos) ──
    return Array.from(resMap.values())
      .sort((a, b) => a.ctacontable.localeCompare(b.ctacontable))
      .map(r => {
        const cuenta = cuentaMap.get(r.ctacontable);

        const saldo = Number(r.saldo) || 0;
        const saldoAcum = Number(r.saldoAcum) || 0;

        // REGLA (AGENTS.md §2): tiposaldo = D si el saldo final >= 0, C si < 0.
        // El signo se lee ANTES de Math.abs: es la única fuente de la dirección
        // real del saldo. `cuenta.naturaleza` es el atributo ESTÁTICO del catálogo
        // (Activo=D, Pasivo=C) y NO sirve para el saldo: una cuenta de activo con
        // saldo acreedor (ej. inventario con saldo negativo) sigue siendo "D" en el
        // catálogo pero su saldo real es "C". Mostrar la naturaleza del catálogo
        // enmascara esa inversión y envejece mal los reportes.
        const tiposaldo: 'D' | 'C' = saldo >= 0 ? 'D' : 'C';
        const tiposaldoAcum: 'D' | 'C' = saldoAcum >= 0 ? 'D' : 'C';

        return {
          ctacontable: r.ctacontable,
          descripcion: r.descripcion ?? '',
          // Naturaleza contable de la cuenta (catálogo) — atributo propio, no el saldo.
          naturaleza: cuenta?.naturaleza || 'D',
          // Dirección real del saldo calculado por operación contable.
          tiposaldo,
          tiposaldoAcum,
          nivel: r.nivel,
          padre: r.padre,
          sn_operable: r.sn_operable,
          debe: Number(r.debe) || 0,
          haber: Number(r.haber) || 0,
          // REGLA CONTABLE: monto SIEMPRE en positivo; la dirección (D/C) la da 'tiposaldo'.
          saldo: Math.abs(saldo),
          saldoAcum: Math.abs(saldoAcum),
        };
      });
  }

  // ==================== INTEGRACIÓN CON MÓDULOS ====================

  /**
   * Busca una factura por ID y empresaId.
   */
  async findFacturaById(facturaId: number, empresaId: number): Promise<TPosFacMae | null> {
    return this.facMaeRepo.findOne({
      where: { facturaId, empresaId } as FindOptionsWhere<TPosFacMae>,
    });
  }

  async findMovimientoCxC(clienteMovId: number, empresaId: number): Promise<CxcMovimiento | null> {
    return this.cxcMovimientoRepo.findOne({
      where: { clienteMovId, empresaId } as unknown as FindOptionsWhere<CxcMovimiento>,
    });
  }

  /**
   * Diagnóstico: verifica por qué la contabilización no se ejecuta.
   * Retorna un objeto con el estado de cada paso.
   */
  async diagnosticarContabilizacion(facturaId: number, empresaId: number): Promise<any> {
    const diagnostico: any = { facturaId, empresaId, pasos: [] };

    // 1. Buscar factura
    const factura = await this.findFacturaById(facturaId, empresaId);
    diagnostico.factura = factura
      ? { tipofactura: factura.tipofactura, total: factura.total, empresaId: factura.empresaId, bodegaId: factura.bodegaId, sn_contabilizada: factura.sn_contabilizada }
      : null;
    diagnostico.pasos.push({ paso: 'factura', ok: !!factura });

    if (!factura) return diagnostico;

    // 2. Verificar parámetro
    const param = await this.tipoParametroRepo.findOne({
      where: { empresaId, moduloId: 3, field: 'sn_integrar_facturacion', sn_activo: 'S' } as any,
    });
    diagnostico.parametro = param ? { valor: param.valor } : null;
    diagnostico.pasos.push({ paso: 'parametro', ok: param?.valor === 'S', valor: param?.valor });

    if (param?.valor !== 'S') return diagnostico;

    // 3. Buscar plantilla
    const descBusqueda = factura.tipofactura === 'C' ? '%credito%' : '%contado%';
    const plantillaMae = await this.plantillaMaeRepo.createQueryBuilder('mae')
      .where('mae.moduloId = :moduloId', { moduloId: 3 })
      .andWhere('mae.empresaId = :empresaId', { empresaId })
      .andWhere('mae.sn_activo = :activo', { activo: 'S' })
      .andWhere('LOWER(mae.descripcion) LIKE LOWER(:desc)', { desc: descBusqueda })
      .getOne();
    diagnostico.plantilla = plantillaMae
      ? { id: plantillaMae.tcoplantillapdamaeId, descripcion: plantillaMae.descripcion }
      : null;
    diagnostico.pasos.push({ paso: 'plantilla', ok: !!plantillaMae, busqueda: descBusqueda });

    if (!plantillaMae) return diagnostico;

    // 4. Detalles plantilla
    const plantillaDet = await this.plantillaDetRepo.find({
      where: { tcoplantillapdamaeId: plantillaMae.tcoplantillapdamaeId, sn_activo: 'S' } as any,
      order: { nrofila: 'ASC' },
    });
    diagnostico.plantillaDetalles = plantillaDet.map(d => ({
      nrofila: d.nrofila, ctacontable: d.ctacontable, descripcion: d.descripcion, naturaleza: d.naturaleza,
    }));
    diagnostico.pasos.push({ paso: 'plantilla_detalles', ok: plantillaDet.length > 0, count: plantillaDet.length });

    // 5. Detalles factura
    const detalles = await this.facDetRepo.find({
      where: { facturaId } as any,
    });
    diagnostico.facDetalles = detalles.map(d => ({
      productoId: d.productoId, cantidad: d.cantidad, precioventa: d.precioventa, impuesto: d.impuesto, descuento: d.descuento,
    }));
    diagnostico.pasos.push({ paso: 'fac_detalles', ok: detalles.length > 0, count: detalles.length });

    // 6. Costos desde existencias
    for (const det of detalles) {
      const exist = await this.existenciaRepo.findOne({
        where: { bodegaId: factura.bodegaId, productoId: det.productoId, empresaId } as any,
      });
      diagnostico.pasos.push({
        paso: `costo_prod_${det.productoId}`,
        ok: !!exist && Number(exist.costounitario) > 0,
        costounitario: exist?.costounitario,
      });
    }

    return diagnostico;
  }

  /**
   * Genera asiento contable automático para una factura de venta.
   * Lee plantilla de partidas (tcoplantillapdamae/det) según tipo (contado/crédito).
   * Calcula montos reales: subtotal, descuento, ISV, costo de venta.
   *
   * Estructura de partida (6 líneas):
   *   D: Caja/CxC          → total factura (venta neta)
   *   C: Ventas            → subtotal bruto (antes de descuento)
   *   D: Descuento s/ventas → total descuento
   *   C: ISV por pagar     → impuesto
   *   D: Costo de venta    → cantidad × costo unitario
   *   C: Mercancía         → cantidad × costo unitario
   */
  async contabilizarFactura(
    factura: TPosFacMae,
    empresaId: number,
    Idsucursal: number,
    currentUser: string,
    opts?: { force?: boolean; skipPeriodCheck?: boolean; fecha?: Date },
  ): Promise<boolean> {
    try {
      // 1. Verificar si la integración contable está habilitada (skip en reconstrucción con force)
      if (!opts?.force) {
        const paramKey = 'sn_integrar_facturacion';
        const valorParam = await this.getValorParametro(empresaId, paramKey);
        if (valorParam !== 'S') {
          this.logger.debug(`Integración contable deshabilitada (${paramKey}=${valorParam})`);
          return false;
        }
      }

      // 2. Buscar plantilla PDA según tipo de factura
      const descBusqueda = factura.tipofactura === 'C'
        ? '%credito%'    // Crédito: "Partida Venta al credito"
        : '%contado%';   // Contado: "Partida Ventas al contado"

      const plantillaMae = await this.plantillaMaeRepo
        .createQueryBuilder('mae')
        .where('mae.moduloId = :moduloId', { moduloId: 3 })
        .andWhere('mae.empresaId = :empresaId', { empresaId })
        .andWhere('mae.sn_activo = :activo', { activo: 'S' })
        .andWhere('LOWER(mae.descripcion) LIKE LOWER(:desc)', { desc: descBusqueda })
        .getOne();

      if (!plantillaMae) {
        this.logger.warn(
          `No se encontró plantilla PDA para factura ${factura.tipofactura === 'C' ? 'crédito' : 'contado'} `
          + `(empresaId=${empresaId}). No se genera partida contable.`,
        );
        return false;
      }

      // 3. Leer detalles de la factura
      const detalles = await this.facDetRepo.find({
        where: { facturaId: factura.facturaId } as FindOptionsWhere<TPosFacDet>,
      });

      if (!detalles || detalles.length === 0) {
        this.logger.warn(`Factura ${factura.nrofactura} sin detalles. No se genera partida.`);
        return false;
      }

      // 4. Calcular montos desde los detalles
      let subtotalBruto = 0;   // Suma de (precioventa × cantidad) — precio sin descuento
      let totalDescuento = 0;  // Suma de descuentos (montos)
      let totalImpuesto = 0;   // Suma de impuestos

      for (const det of detalles) {
        const precio = Number(det.precioventa) || 0;
        const cant = Number(det.cantidad) || 0;
        const desc = Number(det.descuento) || 0; // Monto de descuento (ya calculado)
        const imp = Number(det.impuesto) || 0;

        subtotalBruto += precio * cant;
        totalDescuento += desc;
        totalImpuesto += imp;
      }

      const ventaBruta = subtotalBruto;  // Subtotal bruto (antes de descuento)
      // Calcular venta neta desde componentes (NO usar factura.total porque puede incluir redondeos/ajustes)
      const ventaNeta = ventaBruta - totalDescuento + totalImpuesto;

      // 5. Calcular costo de venta desde productos (cstounit)
      let totalCostoVenta = 0;
      for (const det of detalles) {
        const cant = Number(det.cantidad) || 0;
        if (cant <= 0) continue;

        const producto = await this.productoRepo.findOne({
          where: {
            produtoId: det.productoId,
          } as FindOptionsWhere<Tproducto>,
        });

        const costoUnit = producto ? Number(producto.cstounit) || 0 : 0;
        totalCostoVenta += cant * costoUnit;
      }

      this.logger.log(
        `Factura ${factura.nrofactura}: ventaBruta=${ventaBruta}, descuento=${totalDescuento}, `
        + `impuesto=${totalImpuesto}, costoVenta=${totalCostoVenta}, total=${ventaNeta}`,
      );

      // 6. Leer detalles de la plantilla y mapear conceptos a montos
      const plantillaDetalles = await this.plantillaDetRepo.find({
        where: {
          tcoplantillapdamaeId: plantillaMae.tcoplantillapdamaeId,
          sn_activo: 'S',
        } as FindOptionsWhere<Tcoplantillapdadet>,
        order: { nrofila: 'ASC' },
      });

      if (!plantillaDetalles || plantillaDetalles.length === 0) {
        this.logger.warn(`Plantilla ${plantillaMae.descripcion} sin detalles. No se genera partida.`);
        return false;
      }

      // 7. Construir líneas de la partida basadas en la plantilla
      const lineas: { ctacontable: string; descripcion: string; debito: number; credito: number }[] = [];

      for (const det of plantillaDetalles) {
        const concepto = this.identificarConcepto(det.descripcion || '');
        let monto = 0;

        switch (concepto) {
          case 'COBRO':
            // Caja General (contado) o CxC (crédito) → total factura
            monto = ventaNeta;
            break;
          case 'VENTA':
            // Ventas gravadas → subtotal bruto
            monto = ventaBruta;
            break;
          case 'DESCUENTO':
            // Descuento sobre ventas → solo si hay descuento
            monto = totalDescuento;
            break;
          case 'ISV':
            // Impuesto → solo si hay impuesto (no exenta)
            monto = totalImpuesto;
            break;
          case 'COSTO':
            // Costo de venta
            monto = totalCostoVenta;
            break;
          case 'MERCANCIA':
            // Mercancía en inventario
            monto = totalCostoVenta;
            break;
          default:
            this.logger.warn(`Concepto no reconocido en plantilla: "${det.descripcion}" (ctacontable=${det.ctacontable})`);
            continue;
        }

        // Omitir líneas con monto 0 (ej: sin descuento, factura exenta)
        if (monto <= 0) {
          this.logger.debug(`Línea omitida (monto=0): ${concepto} — ${det.ctacontable}`);
          continue;
        }

        lineas.push({
          ctacontable: det.ctacontable,
          descripcion: `${det.descripcion} - Factura #${factura.nrofactura}`,
          debito: det.naturaleza === 'D' ? monto : 0,
          credito: det.naturaleza === 'C' ? monto : 0,
        });
      }

      if (lineas.length === 0) {
        this.logger.warn(`No se generaron líneas para factura ${factura.nrofactura}`);
        return false;
      }

      // 8. Validar cuadratura (débitos = créditos)
      const totalDebitos = lineas.reduce((sum, l) => sum + (Number(l.debito) || 0), 0);
      const totalCreditos = lineas.reduce((sum, l) => sum + (Number(l.credito) || 0), 0);
      const redondear = (n: number) => Math.round(n * 100) / 100;

      if (redondear(totalDebitos) !== redondear(totalCreditos)) {
        this.logger.error(
          `Partida NO cuadrada para factura ${factura.nrofactura}: `
          + `Débitos=${totalDebitos}, Créditos=${totalCreditos}. No se genera partida.`,
        );
        return false;
      }

      // 9. Crear la partida contable (fecha de documento para período en reconstrucción)
      const fecha = opts?.fecha ?? await this.fechaSistema.getFecha(empresaId);
      const periodo = new Date(fecha).getMonth() + 1;
      const anio = new Date(fecha).getFullYear();

      const copdamae = await this.contabilizarPartida({
        empresaId,
        Idsucursal,
        periodo,
        anio,
        moduloId: 3, // Facturación
        documentoId: factura.facturaId,
        fechadocumento: factura.fecharegistro as any,
        nroreferencia: `FAC-${factura.nrofactura}`,
        descripcion: `Factura #${factura.nrofactura} - ${factura.nombrecliente || 'Cliente'}`,
        lineas,
      }, currentUser, { skipPeriodCheck: opts?.skipPeriodCheck });

      // 10. Guardar referencia de la partida en la factura
      await this.facMaeRepo.createQueryBuilder()
        .update(TPosFacMae)
        .set({
          partidaId: copdamae.partidaId,
          sn_contabilizada: 'S',
          usuarioUpdated: currentUser,
        } as any)
        .where('facturaId = :id', { id: factura.facturaId })
        .execute();

      // 11. Registrar en bitácora posfacmov (partida de venta)
      await this.posfacmovRepo.save({
        // Reglas 1 y 4: posfacmov está en la lista → fecha del backend
        // (antes iba `new Date()` = reloj del servidor)
        fecharegistro: await this.fechaSistema.obtenerFechaRegistro(currentUser, empresaId),
        facturaId: factura.facturaId,
        moduloId: 3, // Facturación
        partidaId: copdamae.partidaId,
        Idsucursal,
        empresaId,
        usuarioCreated: currentUser,
      });

      this.logger.log(
        `Factura ${factura.nrofactura} contabilizada automáticamente `
        + `(partida ${copdamae.nropartida}, ${lineas.length} líneas)`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Error al contabilizar factura ${factura.nrofactura}: ${error.message}`);
      // No lanzamos error para no bloquear la factura
      return false;
    }
  }

  /**
   * Descontabiliza una factura: anula la partida contable vinculada.
   * Se usa al anular una factura que ya estaba contabilizada.
   */
  async descontabilizarFactura(
    factura: TPosFacMae,
    empresaId: number,
    currentUser: string,
  ): Promise<void> {
    try {
      if (factura.sn_contabilizada !== 'S' || !factura.partidaId) {
        this.logger.debug(`Factura ${factura.nrofactura} no está contabilizada. Nada que descontabilizar.`);
        return;
      }

      // 1. Buscar la partida maestro
      const copdamae = await this.copdamaeRepo.findOne({
        where: {
          partidaId: factura.partidaId,
          empresaId,
        } as FindOptionsWhere<Copdamae>,
      });

      if (!copdamae) {
        this.logger.warn(`Partida ${factura.partidaId} no encontrada para factura ${factura.nrofactura}`);
        return;
      }

      // Guard (10/10/2026): si la partida de la factura ya fue contraedida,
      // anularla dejaría la contra huérfana (reversa sin asiento que revertir).
      if (copdamae.contrapdaId != null) {
        throw new BadRequestException(
          `La partida #${copdamae.nropartida} de la factura ${factura.nrofactura} ya fue contraedida `
          + `(contra partida id=${copdamae.contrapdaId}): elimine primero la contra partida.`,
        );
      }

      // 2. Marcar maestro como anulado y ya no contabilizado
      await this.copdamaeRepo.createQueryBuilder()
        .update(Copdamae)
        .set({ sn_anulada: 'S', sn_contabilizada: 'N' } as any)
        .where('partidaId = :id', { id: copdamae.partidaId })
        .execute();

      // 3. Marcar todos los detalles como anulados y ya no contabilizados
      await this.copdadetRepo.createQueryBuilder()
        .update(Copdadet)
        .set({ sn_anulada: 'S', sn_contabilizada: 'N' } as any)
        .where('partidaId = :id', { id: copdamae.partidaId })
        .execute();

      // 4. Revertir movimientos contables (coctamov)
      const detallesPartida = await this.copdadetRepo.find({
        where: { partidaId: copdamae.partidaId } as FindOptionsWhere<Copdadet>,
      });

      for (const det of detallesPartida) {
        const mov = await this.movctaRepo.findOne({
          where: {
            ctacontable: det.ctacontable,
            anio: copdamae.anio,
            periodo: copdamae.periodo,
            empresaId,
          } as FindOptionsWhere<Coctamov>,
        });

        if (mov) {
          // Recalcular con signo: saldo = sacum + (debe − haber) (misma regla
          // que actualizarMovimientosContables — patrón decimal vía QB update).
          const nuevoDebe = Number(mov.debe) - Number(det.debito);
          const nuevoHaber = Number(mov.haber) - Number(det.credito);
          const sacum = Number(mov.sacum) || 0;
          await this.movctaRepo.createQueryBuilder()
            .update(Coctamov)
            .set({
              debe: nuevoDebe,
              haber: nuevoHaber,
              saldo: Math.round((sacum + (nuevoDebe - nuevoHaber)) * 100) / 100,
            } as any)
            .where('coctamovId = :id', { id: mov.movctascontablesId })
            .execute();
        }
      }

      // 4b. Recalcular coctasaldos (bandera simple, 10/10/2026): la partida
      // ya quedó sn_contabilizada='N' → este servicio descarta sus importes.
      await this.actualizarSaldosCuentas(
        detallesPartida.map((d) => ({
          ctacontable: d.ctacontable,
          debito: Number(d.debito) || 0,
          credito: Number(d.credito) || 0,
        })),
        empresaId,
        copdamae.periodo,
        copdamae.anio,
        currentUser,
      );

      // 5. Limpiar referencia en la factura
      await this.facMaeRepo.createQueryBuilder()
        .update(TPosFacMae)
        .set({
          partidaId: null,
          sn_contabilizada: 'N',
          usuarioUpdated: currentUser,
        } as any)
        .where('facturaId = :id', { id: factura.facturaId })
        .execute();

      this.logger.log(
        `Factura ${factura.nrofactura} descontabilizada `
        + `(partida ${copdamae.nropartida} anulada)`,
      );
    } catch (error) {
      // Los guards intencionales (400/409) deben PROPAGARSE al caller
      // (anulación de factura); los errores inesperados solo se registran.
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error al descontabilizar factura ${factura.nrofactura}: ${error.message}`);
    }
  }

  /**
   * Identifica el concepto contable de una línea de plantilla por palabras clave.
   * Las plantillas usan la descripción para indicar a qué概念o corresponde cada cuenta.
   */
  private identificarConcepto(descripcion: string): string {
    const desc = descripcion.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (desc.includes('CAJA') || desc.includes('COBRAR') || desc.includes('CUENTAS POR COBRAR')
      || desc.includes('CLIENTES') || desc.includes('CXC')) {
      return 'COBRO';
    }
    if (desc.includes('DESCUENTO')) {
      return 'DESCUENTO';
    }
    // IMPORTANTE: ISV/IMPUESTO antes que VENTAS porque "IMPUESTO SOBRE VENTAS" contiene "VENTAS"
    if (desc.includes('IMPUESTO') || desc.includes('ISV') || desc.includes('IVA')) {
      return 'ISV';
    }
    // IMPORTANTE: COSTO antes que VENTAS porque "COSTO DE VENTA" contiene "VENTA"
    if (desc.includes('COSTO')) {
      return 'COSTO';
    }
    if (desc.includes('VENTAS') || desc.includes('VENTA')) {
      return 'VENTA';
    }
    if (desc.includes('MERCADERIA') || desc.includes('MERCANC') || desc.includes('INVENTARIO')) {
      return 'MERCANCIA';
    }

    return 'DESCONOCIDO';
  }

  /**
   * Lee un parámetro de ttipoparametros por empresa, módulo y campo.
   * Retorna el valor como string, o defaultValue si no existe.
   */
  private async getValorParametro(
    empresaId: number,
    field: string,
    defaultValue: string = 'N',
  ): Promise<string> {
    try {
      const where: any = {
        empresaId,
        field,
        sn_activo: 'S',
      };
      const param = await this.tipoParametroRepo.findOne({ where });
      return param ? param.valor : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Genera asiento contable para un movimiento de CxC (abono de cliente).
   * Lee plantilla PDA 3 ("Partida abono de clientes") y genera la partida:
   *   D: Caja General (1110-001) → monto del abono
   *   C: CxC Clientes (1120-001) → monto del abono
   * Registra en bitácora posfacmov y vincula partidaId al movimiento CxC.
   *
   * @param movimiento Objeto CxC con: cxcmovimientoId, nroreferencia (nrofactura), importe, cliente, empresaId, Idsucursal
   * @param facturaId ID de la factura en posfacmae (para vincular en posfacmov)
   */
  async contabilizarCxC(
    movimiento: any,
    empresaId: number,
    Idsucursal: number,
    currentUser: string,
    facturaId?: number,
    plantillaId?: number,
    opts?: { force?: boolean; skipPeriodCheck?: boolean; fecha?: Date },
  ): Promise<number | null> {
    try {
      // 1. Verificar si la integración CxC está habilitada (skip en reconstrucción con force)
      if (!opts?.force) {
        const paramKey = 'sn_integrar_cxc';
        const valorParam = await this.getValorParametro(empresaId, paramKey);
        if (valorParam !== 'S') {
          this.logger.debug(`Integración CxC deshabilitada (${paramKey}=${valorParam})`);
          return null;
        }
      }

      // 2. Buscar plantilla PDA por ID o por descripción (abono por defecto)
      let plantillaMae;
      if (plantillaId) {
        plantillaMae = await this.plantillaMaeRepo.findOne({
          where: {
            tcoplantillapdamaeId: plantillaId,
            empresaId,
            sn_activo: 'S',
          } as any,
        });
      } else {
        plantillaMae = await this.plantillaMaeRepo
          .createQueryBuilder('mae')
          .where('mae.moduloId = :moduloId', { moduloId: 4 })
          .andWhere('mae.empresaId = :empresaId', { empresaId })
          .andWhere('mae.sn_activo = :activo', { activo: 'S' })
          .andWhere('LOWER(mae.descripcion) LIKE LOWER(:desc)', { desc: '%abono%' })
          .getOne();
      }

      if (!plantillaMae) {
        this.logger.warn(
          `No se encontró plantilla PDA para abono CxC (empresaId=${empresaId}). `
          + `No se genera partida contable.`,
        );
        return null;
      }

      // 3. Leer detalles de la plantilla
      const plantillaDetalles = await this.plantillaDetRepo.find({
        where: {
          tcoplantillapdamaeId: plantillaMae.tcoplantillapdamaeId,
          sn_activo: 'S',
        } as FindOptionsWhere<Tcoplantillapdadet>,
        order: { nrofila: 'ASC' },
      });

      if (!plantillaDetalles || plantillaDetalles.length === 0) {
        this.logger.warn(`Plantilla ${plantillaMae.descripcion} sin detalles. No se genera partida.`);
        return null;
      }

      // 4. Construir líneas de la partida desde la plantilla
      const movId = movimiento.clienteMovId || movimiento.cxcmovimientoId;
      const importe = Number(movimiento.importe) || 0;
      const nroFactura = movimiento.nroreferencia || '';
      const concepto = movimiento.concepto || `CXC-${nroFactura}`;

      // Construir referencia interna: abreviatura documento fiscal + nroreferencia
      // (defensa: un documentoId no numerico produciria "Unknown column 'NaN'")
      let refInterna = nroFactura;
      const nroDocFiscal = Number(movimiento.documentoId);
      if (Number.isFinite(nroDocFiscal) && nroDocFiscal > 0) {
        const docFiscal = await this.tipoDocFiscalRepo.findOne({
          where: { tipodocumentofiscalId: nroDocFiscal } as any,
        });
        if (docFiscal?.abreviatura) {
          refInterna = `${docFiscal.abreviatura}-${nroFactura}`;
        }
      }

      const lineas: { ctacontable: string; descripcion: string; debito: number; credito: number }[] = [];

      for (const det of plantillaDetalles) {
        // Omitir líneas con monto 0
        if (importe <= 0) continue;

        const descDet = `${det.descripcion}-${refInterna}`.substring(0, 200);
        lineas.push({
          ctacontable: det.ctacontable,
          descripcion: descDet,
          debito: det.naturaleza === 'D' ? importe : 0,
          credito: det.naturaleza === 'C' ? importe : 0,
        });
      }

      if (lineas.length === 0) {
        this.logger.warn(`No se generaron líneas para abono CxC ref=${nroFactura}`);
        return null;
      }

      // 5. Validar cuadratura (débitos = créditos)
      const totalDebitos = lineas.reduce((sum, l) => sum + (Number(l.debito) || 0), 0);
      const totalCreditos = lineas.reduce((sum, l) => sum + (Number(l.credito) || 0), 0);
      const redondear = (n: number) => Math.round(n * 100) / 100;

      if (redondear(totalDebitos) !== redondear(totalCreditos)) {
        this.logger.error(
          `Partida CxC NO cuadrada ref=${nroFactura}: `
          + `Débitos=${totalDebitos}, Créditos=${totalCreditos}. No se genera partida.`,
        );
        return null;
      }

      // 6. Crear la partida contable (fecha de documento para período en reconstrucción)
      const fecha = opts?.fecha ?? await this.fechaSistema.getFecha(empresaId);
      const periodo = new Date(fecha).getMonth() + 1;
      const anio = new Date(fecha).getFullYear();

      const copdamae = await this.contabilizarPartida({
        empresaId,
        Idsucursal,
        periodo,
        anio,
        moduloId: 4, // CxC
        documentoId: movId,
        nroreferencia: refInterna.substring(0, 70),
        descripcion: concepto,
        lineas,
      }, currentUser, { skipPeriodCheck: opts?.skipPeriodCheck });

      // 7. Registrar en bitácora posfacmov (partida de abono CxC)
      if (facturaId && Idsucursal && Idsucursal > 0) {
        await this.posfacmovRepo.save({
          // Reglas 1 y 4: posfacmov está en la lista → fecha del backend
          // (antes usaba `fecha` = opts/fechasistema, que ignora el rango)
          fecharegistro: await this.fechaSistema.obtenerFechaRegistro(currentUser, empresaId),
          facturaId,
          moduloId: 4, // CxC
          partidaId: copdamae.partidaId,
          Idsucursal,
          empresaId,
          usuarioCreated: currentUser,
        });
      } else {
        this.logger.warn(`posfacmov NO registrado: facturaId=${facturaId}, Idsucursal=${Idsucursal}`);
      }

      // 8. Actualizar movimiento CxC con partidaId y sn_cotabilizada
      const now = fecha;
      await this.cxcMovimientoRepo.createQueryBuilder()
        .update(CxcMovimiento)
        .set({
          partidaId: copdamae.partidaId,
          sn_cotabilizada: 'S',
          usuarioUpdated: currentUser,
          fechaUpdated: now,
        } as any)
        .where('clienteMovId = :id', { id: movId })
        .execute();

      this.logger.log(
        `Movimiento CxC ${movId} contabilizado `
        + `(partida ${copdamae.nropartida}, ref=${nroFactura}, monto=${importe})`,
      );
      return copdamae.partidaId;
    } catch (error) {
      this.logger.error(`Error al contabilizar CxC: ${error.message}`);
      return null;
    }
  }

  /**
   * Contabiliza un COBRO de factura de crédito con cargos (interés + mora).
   * Genera UNA sola partida (PDA 3) con el importe CORRECTO por cuenta:
   *   Caja D = abonoCapital | Interés por cobrar D = interes | Mora por cobrar D = mora
   *   Clientes C = abonoCapital | Ingresos C = interes + mora
   * A diferencia de contabilizarCxC (que mete el mismo importe en TODAS las líneas
   * y descuadra con importes variables), aquí cada línea recibe su monto real.
   */
  async contabilizarAbonoCajaConCargos(
    p: {
      empresaId: number; Idsucursal: number;
      facturaId?: number; // opcional: en cobros de PRÉSTAMO no existe factura (se omite posfacmov)
      nroreferencia: string; nrocliente: string; concepto: string;
      abonoCapital: number; interes: number; mora: number;
      movimientoIds: number[];
    },
    currentUser: string,
  ): Promise<number | null> {
    try {
      const paramKey = 'sn_integrar_cxc';
      const valorParam = await this.getValorParametro(p.empresaId, paramKey);
      if (valorParam !== 'S') {
        this.logger.debug(`Integración CxC deshabilitada (${paramKey}=${valorParam})`);
        return null;
      }

      // Plantilla PDA 3 (abono clientes)
      const plantillaMae = await this.plantillaMaeRepo.findOne({
        where: { tcoplantillapdamaeId: 3, empresaId: p.empresaId, sn_activo: 'S' } as any,
      });
      if (!plantillaMae) {
        this.logger.warn(`No se encontró plantilla PDA 3 (empresaId=${p.empresaId}). No se genera partida.`);
        return null;
      }

      const plantillaDetalles = await this.plantillaDetRepo.find({
        where: { tcoplantillapdamaeId: plantillaMae.tcoplantillapdamaeId, sn_activo: 'S' } as FindOptionsWhere<Tcoplantillapdadet>,
        order: { nrofila: 'ASC' },
      });
      if (!plantillaDetalles || plantillaDetalles.length === 0) {
        this.logger.warn(`Plantilla PDA 3 sin detalles. No se genera partida.`);
        return null;
      }

      const r2 = (x: number) => Math.round(x * 100) / 100;
      const ingresos = r2(p.interes + p.mora);
      // Monto real por ROL (no el mismo importe en todas las líneas).
      const roles: Record<string, { debit: number; credit: number }> = {
        caja:          { debit: r2(p.abonoCapital), credit: 0 },
        clientes:      { debit: 0, credit: r2(p.abonoCapital) },
        interesCobrar: { debit: r2(p.interes), credit: 0 },
        moraCobrar:    { debit: r2(p.mora), credit: 0 },
        ingresos:      { debit: 0, credit: ingresos },
      };
      // Clasificar cada cuenta de la plantilla por su rol (prefijo).
      const clasificar = (cta: string): string | null => {
        if (/^1-1-10/.test(cta)) return 'caja';
        if (/^1-1-30-1/.test(cta)) return 'clientes';
        if (/^1-1-30-3-001/.test(cta)) return 'interesCobrar';
        if (/^1-1-30-3-002/.test(cta)) return 'moraCobrar';
        if (/^4-4-1/.test(cta)) return 'ingresos';
        return null;
      };

      // Referencia interna: abreviatura doc fiscal + nroreferencia.
      // FAC (1) para cobros de factura; PPR (13) para cobros de préstamo.
      let refInterna = p.nroreferencia;
      const docFiscal = await this.tipoDocFiscalRepo.findOne({
        where: { tipodocumentofiscalId: p.facturaId ? 1 : 13 } as any,
      });
      if (docFiscal?.abreviatura) refInterna = `${docFiscal.abreviatura}-${p.nroreferencia}`;

      const lineas: { ctacontable: string; descripcion: string; debito: number; credito: number }[] = [];
      const usados = new Set<string>(); // dedupe (la plantilla puede tener filas repetidas)
      for (const det of plantillaDetalles) {
        const rol = clasificar(det.ctacontable);
        if (!rol || usados.has(rol)) continue;
        const amt = roles[rol];
        if (r2(amt.debit + amt.credit) <= 0) continue; // omitir montos 0
        usados.add(rol);
        lineas.push({
          ctacontable: det.ctacontable,
          descripcion: `${det.descripcion}-${refInterna}`.substring(0, 200),
          debito: amt.debit,
          credito: amt.credit,
        });
      }

      // Orden requerido por el usuario: Naturaleza DESC (D antes que C),
      // y dentro de cada naturaleza, ctacontable ASC.
      lineas.sort((a, b) => {
        const natA = a.debito > 0 ? 'D' : 'C';
        const natB = b.debito > 0 ? 'D' : 'C';
        if (natA !== natB) return natA === 'D' ? -1 : 1; // D primero
        return a.ctacontable.localeCompare(b.ctacontable);
      });

      if (lineas.length === 0) {
        this.logger.warn(`No se generaron líneas para abono CxC con cargos ref=${p.nroreferencia}`);
        return null;
      }

      const totalD = r2(lineas.reduce((s, l) => s + l.debito, 0));
      const totalC = r2(lineas.reduce((s, l) => s + l.credito, 0));
      if (totalD !== totalC) {
        this.logger.error(
          `Partida abono CxC con cargos NO cuadrada ref=${p.nroreferencia}: `
          + `Débitos=${totalD}, Créditos=${totalC}. No se genera partida.`,
        );
        return null;
      }

      const fecha = await this.fechaSistema.getFecha(p.empresaId);
      const periodo = new Date(fecha).getMonth() + 1;
      const anio = new Date(fecha).getFullYear();

      const copdamae = await this.contabilizarPartida({
        empresaId: p.empresaId,
        Idsucursal: p.Idsucursal,
        periodo,
        anio,
        moduloId: 4, // CxC
        documentoId: p.movimientoIds[0],
        nroreferencia: refInterna.substring(0, 70),
        descripcion: p.concepto,
        lineas,
      }, currentUser);

      // Bitácora posfacmov
      if (p.facturaId && p.Idsucursal && p.Idsucursal > 0) {
        await this.posfacmovRepo.save({
          fecharegistro: await this.fechaSistema.obtenerFechaRegistro(currentUser, p.empresaId),
          facturaId: p.facturaId,
          moduloId: 4,
          partidaId: copdamae.partidaId,
          Idsucursal: p.Idsucursal,
          empresaId: p.empresaId,
          usuarioCreated: currentUser,
        });
      }

      // Marcar los movimientos del cobro (capital + cargos) como contabilizados.
      await this.cxcMovimientoRepo.createQueryBuilder()
        .update(CxcMovimiento)
        .set({
          partidaId: copdamae.partidaId,
          sn_cotabilizada: 'S',
          usuarioUpdated: currentUser,
          fechaUpdated: fecha,
        } as any)
        .whereInIds(p.movimientoIds)
        .execute();

      this.logger.log(
        `Abono CxC con cargos contabilizado (partida ${copdamae.nropartida}, `
        + `ref=${p.nroreferencia}, D=C=${totalD})`,
      );
      return copdamae.partidaId;
    } catch (error) {
      this.logger.error(`Error al contabilizar abono CxC con cargos: ${error.message}`);
      return null;
    }
  }

  /**
   * Genera asiento contable para un movimiento de CxP (pago a proveedor / nota débito / nota crédito).
   * Lee plantilla PDA desde tcoplantillapdamae/det por moduloId=5.
   * Actualiza cxpmovimientos con partidaId y sn_contabilizado='S'.
   *
   * @param plantillaId ID de la plantilla PDA a usar (6=Pago, 7=Nota Débito, 8=Nota Crédito)
   */
  async contabilizarCxP(
    movimiento: any,
    empresaId: number,
    Idsucursal: number,
    currentUser: string,
    plantillaId?: number,
    opts?: { force?: boolean; skipPeriodCheck?: boolean; fecha?: Date },
  ): Promise<number | null> {
    try {
      // 1. Verificar si la integración CxP está habilitada (skip en reconstrucción con force)
      if (!opts?.force) {
        const paramKey = 'sn_integrar_cxp';
        const valorParam = await this.getValorParametro(empresaId, paramKey);
        if (valorParam !== 'S') {
          this.logger.debug(`Integración CxP deshabilitada (${paramKey}=${valorParam})`);
          return null;
        }
      }

      // 2. Buscar plantilla PDA
      let plantillaMae;
      if (plantillaId) {
        plantillaMae = await this.plantillaMaeRepo.findOne({
          where: {
            tcoplantillapdamaeId: plantillaId,
            empresaId,
            sn_activo: 'S',
          } as any,
        });
      } else {
        // Default: buscar por descripción LIKE '%pago%' en moduloId=5
        plantillaMae = await this.plantillaMaeRepo
          .createQueryBuilder('mae')
          .where('mae.moduloId = :moduloId', { moduloId: 5 })
          .andWhere('mae.empresaId = :empresaId', { empresaId })
          .andWhere('mae.sn_activo = :activo', { activo: 'S' })
          .andWhere('LOWER(mae.descripcion) LIKE LOWER(:desc)', { desc: '%pago%' })
          .getOne();
      }

      if (!plantillaMae) {
        this.logger.warn(
          `No se encontró plantilla PDA para CxP (empresaId=${empresaId}, plantillaId=${plantillaId}). `
          + `No se genera partida contable.`,
        );
        return null;
      }

      // 3. Leer detalles de la plantilla
      const plantillaDetalles = await this.plantillaDetRepo.find({
        where: {
          tcoplantillapdamaeId: plantillaMae.tcoplantillapdamaeId,
          sn_activo: 'S',
        } as any,
        order: { nrofila: 'ASC' },
      });

      if (!plantillaDetalles || plantillaDetalles.length === 0) {
        this.logger.warn(`Plantilla ${plantillaMae.descripcion} sin detalles. No se genera partida.`);
        return null;
      }

      // 4. Construir líneas de la partida desde la plantilla
      const movId = movimiento.cxpmovimientoId || movimiento.bcomovId;
      const importe = Number(movimiento.importe) || 0;
      const nroRef = movimiento.nroreferencia || '';
      const concepto = movimiento.concepto || `CXP-${nroRef}`;

      // Construir referencia interna: abreviatura documento fiscal + nroreferencia
      let refInterna = nroRef;
      if (movimiento.documentoId) {
        const docFiscal = await this.tipoDocFiscalRepo.findOne({
          where: { tipodocumentofiscalId: Number(movimiento.documentoId) } as any,
        });
        if (docFiscal?.abreviatura) {
          refInterna = `${docFiscal.abreviatura}-${nroRef}`;
        }
      }

      const lineas: { ctacontable: string; descripcion: string; debito: number; credito: number }[] = [];

      for (const det of plantillaDetalles) {
        if (importe <= 0) continue;

        const descDet = `${det.descripcion}-${refInterna}`.substring(0, 200);
        lineas.push({
          ctacontable: det.ctacontable,
          descripcion: descDet,
          debito: det.naturaleza === 'D' ? importe : 0,
          credito: det.naturaleza === 'C' ? importe : 0,
        });
      }

      if (lineas.length === 0) {
        this.logger.warn(`No se generaron líneas para CxP ref=${nroRef}`);
        return null;
      }

      // 5. Validar cuadratura (débitos = créditos)
      const totalDebitos = lineas.reduce((sum, l) => sum + (Number(l.debito) || 0), 0);
      const totalCreditos = lineas.reduce((sum, l) => sum + (Number(l.credito) || 0), 0);
      const redondear = (n: number) => Math.round(n * 100) / 100;

      if (redondear(totalDebitos) !== redondear(totalCreditos)) {
        this.logger.error(
          `Partida CxP NO cuadrada ref=${nroRef}: `
          + `Débitos=${totalDebitos}, Créditos=${totalCreditos}. No se genera partida.`,
        );
        return null;
      }

      // 6. Crear la partida contable (fecha de documento para período en reconstrucción)
      const fecha = opts?.fecha ?? await this.fechaSistema.getFecha(empresaId);
      const periodo = new Date(fecha).getMonth() + 1;
      const anio = new Date(fecha).getFullYear();

      const copdamae = await this.contabilizarPartida({
        empresaId,
        Idsucursal,
        periodo,
        anio,
        moduloId: 5, // CxP
        documentoId: movId,
        nroreferencia: refInterna.substring(0, 70),
        descripcion: concepto,
        lineas,
      }, currentUser, { skipPeriodCheck: opts?.skipPeriodCheck });

      // 7. Actualizar movimiento CxP con partidaId y sn_contabilizado
      const now = fecha;
      await this.cxpMovimientoRepo.createQueryBuilder()
        .update(TCxpMovimiento)
        .set({
          partidaId: copdamae.partidaId,
          sn_contabilizado: 'S',
          usuarioUpdated: currentUser,
          fechaUpdated: now,
        } as any)
        .where('cxpmovId = :id', { id: movId })
        .execute();

      this.logger.log(
        `Movimiento CxP ${movId} contabilizado `
        + `(partida ${copdamae.nropartida}, ref=${nroRef}, monto=${importe})`,
      );
      return copdamae.partidaId;
    } catch (error) {
      this.logger.error(`Error al contabilizar CxP: ${error.message}`);
      return null;
    }
  }

  /**
   * Genera asiento contable para un movimiento bancario
   * Lee plantilla PDA desde tcoplantillapdamae/det por moduloId=6.
   * Actualiza bcosmovimientos con partidaId y sn_cotabilizada='S'.
   *
   * Enruta por tipomov + origen:
   *   DEPOSITO        → PDA 10 (depósito a cuenta bancaria)
   *   RETIRO          → PDA 11 (retiro de cuenta bancaria)
   *   PAGO+proveedor  → PDA 12 (emisión de cheque a proveedor)
   *   PAGO+particular → PDA 13 (emisión de cheque a particular)
   */
  async contabilizarBanco(
    movimiento: any,
    empresaId: number,
    Idsucursal: number,
    currentUser: string,
    plantillaId?: number,
    opts?: { force?: boolean; skipPeriodCheck?: boolean; fecha?: Date },
  ): Promise<number | null> {
    try {
      // 1. Verificar si la integración Bancos está habilitada (skip en reconstrucción con force)
      if (!opts?.force) {
        const paramKey = 'sn_integrar_bancos';
        const valorParam = await this.getValorParametro(empresaId, paramKey);
        if (valorParam !== 'S') {
          this.logger.debug(`Integración Bancos deshabilitada (${paramKey}=${valorParam})`);
          return null;
        }
      }

      // 2. Buscar plantilla PDA
      let plantillaMae;
      if (plantillaId) {
        plantillaMae = await this.plantillaMaeRepo.findOne({
          where: {
            tcoplantillapdamaeId: plantillaId,
            empresaId,
            sn_activo: 'S',
          } as any,
        });
      }

      if (!plantillaMae) {
        this.logger.warn(
          `No se encontró plantilla PDA para Bancos (empresaId=${empresaId}, plantillaId=${plantillaId}). `
          + `No se genera partida contable.`,
        );
        return null;
      }

      // 3. Leer detalles de la plantilla
      const plantillaDetalles = await this.plantillaDetRepo.find({
        where: {
          tcoplantillapdamaeId: plantillaMae.tcoplantillapdamaeId,
          sn_activo: 'S',
        } as any,
        order: { nrofila: 'ASC' },
      });

      if (!plantillaDetalles || plantillaDetalles.length === 0) {
        this.logger.warn(`Plantilla ${plantillaMae.descripcion} sin detalles. No se genera partida.`);
        return null;
      }

      // 4. Construir líneas de la partida desde la plantilla
      const movId = movimiento.bcomovimientosId;
      const importe = Number(movimiento.importe) || 0;
      const nroRef = movimiento.nroreferencia || '';
      const concepto = movimiento.concepto || `BCO-${nroRef}`;

      const lineas: { ctacontable: string; descripcion: string; debito: number; credito: number }[] = [];

      for (const det of plantillaDetalles) {
        if (importe <= 0) continue;

        const descDet = `${det.descripcion}-BCO-${nroRef}`.substring(0, 200);
        lineas.push({
          ctacontable: det.ctacontable,
          descripcion: descDet,
          debito: det.naturaleza === 'D' ? importe : 0,
          credito: det.naturaleza === 'C' ? importe : 0,
        });
      }

      if (lineas.length === 0) {
        this.logger.warn(`No se generaron líneas para Bancos ref=${nroRef}`);
        return null;
      }

      // 5. Validar cuadratura (débitos = créditos)
      const totalDebitos = lineas.reduce((sum, l) => sum + (Number(l.debito) || 0), 0);
      const totalCreditos = lineas.reduce((sum, l) => sum + (Number(l.credito) || 0), 0);
      const redondear = (n: number) => Math.round(n * 100) / 100;

      if (redondear(totalDebitos) !== redondear(totalCreditos)) {
        this.logger.error(
          `Partida Bancos NO cuadrada ref=${nroRef}: `
          + `Débitos=${totalDebitos}, Créditos=${totalCreditos}. No se genera partida.`,
        );
        return null;
      }

      // 6. Crear la partida contable (fecha de documento para período en reconstrucción)
      const fecha = opts?.fecha ?? await this.fechaSistema.getFecha(empresaId);
      const periodo = new Date(fecha).getMonth() + 1;
      const anio = new Date(fecha).getFullYear();

      const copdamae = await this.contabilizarPartida({
        empresaId,
        Idsucursal,
        periodo,
        anio,
        moduloId: 6, // Bancos — módulo SIN documentos fiscales: documentoId guarda
        // el tcoplantillapdamaeId (regla del usuario 14/10/2026). El enlace al
        // movimiento queda en bcosmovimientos.partidaId (paso 7) y en nroreferencia BCO-X.
        documentoId: plantillaMae.tcoplantillapdamaeId,
        nroreferencia: `BCO-${nroRef}`.substring(0, 70),
        descripcion: concepto,
        lineas,
      }, currentUser, { skipPeriodCheck: opts?.skipPeriodCheck });

      // 7. Actualizar movimiento bancario con partidaId y sn_cotabilizada
      const now = fecha;
      await this.bcoMovimientoRepo.createQueryBuilder()
        .update(TbcoMovimiento)
        .set({
          partidaId: copdamae.partidaId,
          sn_cotabilizada: 'S',
          usuarioUpdated: currentUser,
          fechaUpdated: now,
        } as any)
        .where('bcomovimientosId = :id', { id: movId })
        .execute();

      this.logger.log(
        `Movimiento bancario ${movId} contabilizado `
        + `(partida ${copdamae.nropartida}, ref=${nroRef}, monto=${importe})`,
      );
      return copdamae.partidaId;
    } catch (error) {
      this.logger.error(`Error al contabilizar banco: ${error.message}`);
      return null;
    }
  }

  // ==================== RECONSTRUCCIÓN COMOVCTA ====================

  /**
   * Trunca y reconstruye coctamov + coctasaldos desde las fuentes transaccionales:
   * 1) Facturas activas → moduloId=3
   * 2) CxC movimientos → moduloId=4
   * 3) Compras (FCO/FCC/ORC) → moduloId=5 (PDA 14/15)
   * 4) Resto de CxP movimientos → moduloId=5 (PDA 8/9; omite cheques sn_chq='S')
   * 5) Reaplica partidas existentes no regeneradas (Bancos módulo 6 +
   *    manuales/cierre + CONTRAPARTIDAS: no derivan de fuente transaccional)
   * 6) Verificación SUM(debe) = SUM(haber)
   *
   * Contrapartidas (10/10/2026): el snapshot usa bandera simple
   * `sn_contabilizada='S'` (NOTA del usuario). Las originales contraedidas
   * de módulos 3/4/5 se marcan S/N y se REGENERAN desde su fuente; las contras
   * (partidaOrigenId != null) nunca se tocan y se reaplican en Fase 5.
   *
   * Idempotente: cada ejecución limpia y reconstruye desde cero para la empresa.
   */
  async reconstruirCoctamov(empresaId: number, Idsucursal: number = 1, currentUser: string = 'SYSTEM') {
    const resumen: any = {
      empresaId,
      fases: {} as any,
      errores: [] as string[],
      verificacion: null as any,
    };
    const ahora = await this.fechaSistema.getFecha(empresaId);

    // ===== FASE 0: Snapshot de partidas a reaplicar + limpieza =====
    // NOTA del usuario (10/10/2026): para reconstruir mayores/saldos solo
    // importa `sn_contabilizada='S'` (bandera simple). El snapshot incluye
    // activas (N/S), originales contraedidas (S/S) y contras (N/S).
    const todasContabilizadas = await this.copdamaeRepo.find({
      where: { empresaId, sn_contabilizada: 'S' } as FindOptionsWhere<Copdamae>,
    });
    // A reaplicar: lo que NO se regenera desde fuentes (Bancos módulo 6 +
    // manuales/cierre) + TODAS las contras (aunque su módulo sea 3/4/5: no
    // derivan de una fuente transaccional, nacen de una partida original).
    const partidasReaplicar = todasContabilizadas.filter(
      (p) => ![3, 4, 5].includes(p.moduloId) || p.partidaOrigenId != null,
    );
    const contrasConservadas = todasContabilizadas.filter((p) => p.partidaOrigenId != null).length;

    // A marcar S/N (se regeneran en Fases 1-4): módulos 3/4/5 contabilizadas
    // que NO son contras. Incluye originales contraedidas (S/S): su fuente
    // sigue activa y regenerará el asiento con los mismos importes; la contra
    // (excluida por partidaOrigenId) se reaplica en Fase 5. `copdadet` no
    // tiene partidaOrigenId → la limpieza se hace por lista de partidaId.
    const idsRegenerar = todasContabilizadas
      .filter((p) => [3, 4, 5].includes(p.moduloId) && p.partidaOrigenId == null)
      .map((p) => p.partidaId);
    let maeAnuladas = 0;
    let detAnuladas = 0;
    if (idsRegenerar.length > 0) {
      const updMae = await this.copdamaeRepo.createQueryBuilder()
        .update(Copdamae)
        .set({ sn_anulada: 'S', sn_contabilizada: 'N', usuarioUpdated: currentUser, fechaUpdated: ahora })
        .where('partidaId IN (:...ids)', { ids: idsRegenerar })
        .execute();
      const updDet = await this.copdadetRepo.createQueryBuilder()
        .update(Copdadet)
        .set({ sn_anulada: 'S', sn_contabilizada: 'N', usuarioUpdated: currentUser, fechaUpdated: ahora })
        .where('partidaId IN (:...ids)', { ids: idsRegenerar })
        .execute();
      maeAnuladas = updMae.affected ?? 0;
      detAnuladas = updDet.affected ?? 0;
    }

    // Truncar coctamov + coctasaldos de la empresa
    const delMov = await this.movctaRepo.delete({ empresaId } as FindOptionsWhere<Coctamov>);
    const delSaldos = await this.saldosctaRepo.delete({ empresaId } as FindOptionsWhere<Coctasaldos>);

    resumen.fases.limpieza = {
      partidasReaplicar: partidasReaplicar.length,
      contrasConservadas,
      partidasMaeAnuladas: maeAnuladas,
      partidasDetAnuladas: detAnuladas,
      coctamovBorradas: delMov.affected ?? 0,
      coctasaldosBorradas: delSaldos.affected ?? 0,
    };
    this.logger.log(`[Reconstruir] Fase 0 limpieza: ${JSON.stringify(resumen.fases.limpieza)}`);

    // ===== FASE 1: Facturas activas (contado + crédito) → moduloId=3 =====
    const facturas = await this.facMaeRepo.find({
      where: { empresaId, sn_anulada: 'N' } as FindOptionsWhere<TPosFacMae>,
      order: { facturaId: 'ASC' },
    });
    let factOk = 0;
    const factErr: number[] = [];
    for (const f of facturas) {
      try {
        const ok = await this.contabilizarFactura(f, empresaId, f.Idsucursal || Idsucursal, currentUser, {
          force: true,
          skipPeriodCheck: true,
          fecha: f.fecharegistro,
        });
        if (ok) factOk++; else factErr.push(f.nrofactura);
      } catch (e) {
        factErr.push(f.nrofactura);
        resumen.errores.push(`Factura ${f.nrofactura}: ${e.message}`);
      }
    }
    resumen.fases.facturas = { leidas: facturas.length, contabilizadas: factOk, fallidas: factErr.length, nroFallidas: factErr.slice(0, 20) };
    this.logger.log(`[Reconstruir] Fase 1 facturas: ${factOk}/${facturas.length} OK`);

    // ===== FASE 2: CxC movimientos → moduloId=4 =====
    const movsCxc = await this.cxcMovimientoRepo.find({
      where: { empresaId, moduloId: 4, sn_doc_anulado: 'N' } as FindOptionsWhere<CxcMovimiento>,
    });
    let cxcOk = 0;
    const cxcErr: number[] = [];
    for (const m of movsCxc) {
      if (Number(m.importe) <= 0) continue;
      try {
        // Enrutamiento sin origen: concepto de caja → PDA 3; D → PDA 4; C → PDA 5
        const conceptoLc = (m.concepto || '').toLowerCase();
        let plantillaId: number;
        if (m.tipomov === 'D') plantillaId = 4;
        else if (m.tipomov === 'C' && (conceptoLc.includes('abono caja') || conceptoLc.includes('pago caja'))) plantillaId = 3;
        else if (m.tipomov === 'C') plantillaId = 5;
        else continue;

        let facturaId: number | undefined;
        if (m.nroreferencia && !isNaN(Number(m.nroreferencia))) {
          const fac = await this.facMaeRepo.findOne({
            where: { nrofactura: Number(m.nroreferencia), empresaId } as FindOptionsWhere<TPosFacMae>,
          });
          if (fac) facturaId = fac.facturaId;
        }

        const resultado = await this.contabilizarCxC(
          {
            clienteMovId: m.clienteMovId,
            nroreferencia: m.nroreferencia,
            importe: m.importe,
            nrocliente: m.nrocliente,
            concepto: m.concepto || '',
            documentoId: m.documentoId,
            fecharegistro: m.fecharegistro,
          },
          empresaId,
          m.Idsucursal || Idsucursal,
          currentUser,
          facturaId,
          plantillaId,
          { force: true, skipPeriodCheck: true, fecha: m.fecharegistro },
        );
        if (resultado) cxcOk++; else cxcErr.push(m.clienteMovId);
      } catch (e) {
        cxcErr.push(m.clienteMovId);
        resumen.errores.push(`CxC mov ${m.clienteMovId}: ${e.message}`);
      }
    }
    resumen.fases.cxc = { leidas: movsCxc.length, contabilizadas: cxcOk, fallidas: cxcErr.length, nroFallidas: cxcErr.slice(0, 20) };
    this.logger.log(`[Reconstruir] Fase 2 CxC: ${cxcOk}/${movsCxc.length} OK`);

    // ===== FASE 3: Compras (facturas de compra / órdenes) → PDA 14/15 =====
    const compras = await this.cxpCompraMaeRepo.find({
      where: { empresaId, sn_anulada: 'N' } as FindOptionsWhere<TCxpCompraMae>,
    });
    const movsCxPProcesados = new Set<number>();
    let comprasOk = 0;
    const comprasErr: number[] = [];
    const comprasNoProcesadas: number[] = [];
    for (const c of compras) {
      try {
        // Compra nunca procesada → no tiene movimiento CxP (no es error de reconstrucción)
        if (c.sn_procesada !== 'S') {
          comprasNoProcesadas.push(c.compraId);
          continue;
        }

        // Buscar movimiento débito de la compra:
        // - Datos antiguos: nroreferencia = compraId ("1", "3"...) y/o concepto "Compra #N"
        // - Datos nuevos: nroreferencia = compra.nroreferencia ("2525", "202609161"...)
        // No filtrar por moduloId (antiguos usaban moduloId=2, nuevos usan 5)
        const refs = [c.compraId.toString()];
        if (c.nroreferencia && !refs.includes(c.nroreferencia)) refs.push(c.nroreferencia);

        let mov = await this.cxpMovimientoRepo.createQueryBuilder('m')
          .where('m.empresaId = :eid', { eid: empresaId })
          .andWhere('m.tipomov = :t', { t: 'D' })
          .andWhere('m.sn_doc_anulado = :anul', { anul: 'N' })
          .andWhere('m.nroreferencia IN (:...refs)', { refs })
          .orderBy('m.bcomovId', 'DESC')
          .getOne();

        if (!mov) {
          mov = await this.cxpMovimientoRepo.createQueryBuilder('m')
            .where('m.empresaId = :eid', { eid: empresaId })
            .andWhere('m.tipomov = :t', { t: 'D' })
            .andWhere('m.sn_doc_anulado = :anul', { anul: 'N' })
            .andWhere('m.concepto LIKE :c', { c: `Compra #${c.compraId}%` })
            .orderBy('m.bcomovId', 'DESC')
            .getOne();
        }

        if (!mov) {
          comprasErr.push(c.compraId);
          resumen.errores.push(`Compra ${c.compraId}: sin movimiento CxP débito (refs=${refs.join(',')})`);
          continue;
        }
        const plantillaId = c.TipoCompra === 'FCO' ? 14 : 15;
        const resultado = await this.contabilizarCxP(
          {
            bcomovId: mov.bcomovId,
            nroreferencia: mov.nroreferencia,
            importe: mov.importe,
            concepto: mov.concepto || '',
            documentoId: mov.documentoId,
            fecharegistro: mov.fecharegistro,
          },
          empresaId,
          mov.Idsucursal || Idsucursal,
          currentUser,
          plantillaId,
          { force: true, skipPeriodCheck: true, fecha: mov.fecharegistro },
        );
        movsCxPProcesados.add(mov.bcomovId);
        if (resultado) {
          comprasOk++;
          // Marcar compra contabilizada
          await this.cxpCompraMaeRepo.createQueryBuilder()
            .update(TCxpCompraMae)
            .set({
              sn_contabilizada: 'S',
              partidaId: resultado,
              usuarioUpdated: currentUser,
              fechaUpdated: ahora,
            } as any)
            .where('compraId = :id', { id: c.compraId })
            .andWhere('empresaId = :empresaId', { empresaId })
            .execute();
        } else {
          comprasErr.push(c.compraId);
        }
      } catch (e) {
        comprasErr.push(c.compraId);
        resumen.errores.push(`Compra ${c.compraId}: ${e.message}`);
      }
    }
    resumen.fases.compras = {
      leidas: compras.length,
      contabilizadas: comprasOk,
      noProcesadas: comprasNoProcesadas.length,
      idsNoProcesadas: comprasNoProcesadas,
      fallidas: comprasErr.length,
      nroFallidas: comprasErr.slice(0, 20),
    };
    this.logger.log(`[Reconstruir] Fase 3 compras: ${comprasOk}/${compras.length} OK`);

    // ===== FASE 4: Resto de CxP movimientos → PDA 8/9 (omite cheques) =====
    const movsCxp = await this.cxpMovimientoRepo.find({
      where: { empresaId, sn_doc_anulado: 'N' } as FindOptionsWhere<TCxpMovimiento>,
    });
    let cxpOk = 0;
    let cxpOmitidosCheque = 0;
    let cxpOmitidosCompra = 0;
    const cxpErr: number[] = [];
    for (const m of movsCxp) {
      if (Number(m.importe) <= 0) continue;
      if (movsCxPProcesados.has(m.bcomovId)) continue;
      // Cheques: su efecto contable ya está en partidas de Bancos (PDA 12) que se reaplican
      if (m.sn_chq === 'S') {
        cxpOmitidosCheque++;
        continue;
      }
      // Residuos de compras no capturados en fase 3 → no contabilizar como nota débito (PDA 8)
      if ((m.concepto || '').trim().toUpperCase().startsWith('COMPRA #')) {
        cxpOmitidosCompra++;
        continue;
      }
      try {
        const plantillaId = m.tipomov === 'D' ? 8 : 9;
        const resultado = await this.contabilizarCxP(
          {
            bcomovId: m.bcomovId,
            nroreferencia: m.nroreferencia,
            importe: m.importe,
            concepto: m.concepto || '',
            documentoId: m.documentoId,
            fecharegistro: m.fecharegistro,
          },
          empresaId,
          m.Idsucursal || Idsucursal,
          currentUser,
          plantillaId,
          { force: true, skipPeriodCheck: true, fecha: m.fecharegistro },
        );
        if (resultado) cxpOk++; else cxpErr.push(m.bcomovId);
      } catch (e) {
        cxpErr.push(m.bcomovId);
        resumen.errores.push(`CxP mov ${m.bcomovId}: ${e.message}`);
      }
    }
    resumen.fases.cxpResto = {
      leidas: movsCxp.length,
      contabilizadas: cxpOk,
      omitidasCheque: cxpOmitidosCheque,
      omitidasCompra: cxpOmitidosCompra,
      fallidas: cxpErr.length,
      nroFallidas: cxpErr.slice(0, 20),
    };
    this.logger.log(`[Reconstruir] Fase 4 CxP resto: ${cxpOk} OK, ${cxpOmitidosCheque} cheques omitidos`);

    // ===== FASE 5: Reaplicar partidas existentes (Bancos + manuales/cierre) =====
    let reOk = 0;
    const reErr: number[] = [];
    for (const p of partidasReaplicar) {
      try {
        // Bandera simple (10/10/2026): líneas contabilizadas, incluidas las
        // de originales contraedidas (S/S) y de las contras (N/S).
        const dets = await this.copdadetRepo.find({
          where: { partidaId: p.partidaId, sn_contabilizada: 'S' } as FindOptionsWhere<Copdadet>,
        });
        if (!dets.length) continue;
        const lineas = dets.map(d => ({
          ctacontable: d.ctacontable,
          debito: Number(d.debito) || 0,
          credito: Number(d.credito) || 0,
        }));
        await this.actualizarMovimientosContables(lineas, empresaId, p.nropartida, p.periodo, p.anio, currentUser);
        await this.actualizarSaldosCuentas(lineas, empresaId, p.periodo, p.anio, currentUser);
        reOk++;
      } catch (e) {
        reErr.push(p.partidaId);
        resumen.errores.push(`Reaplicar partida ${p.nropartida} (id=${p.partidaId}): ${e.message}`);
      }
    }
    resumen.fases.reaplicacion = { leidas: partidasReaplicar.length, aplicadas: reOk, fallidas: reErr.length, nroFallidas: reErr.slice(0, 20) };
    this.logger.log(`[Reconstruir] Fase 5 reaplicación: ${reOk}/${partidasReaplicar.length} OK`);

    // ===== FASE 6: Verificación cuadratura =====
    try {
      const rows = await this.movctaRepo.query(
        'SELECT COALESCE(SUM(debe), 0) AS totalDebe, COALESCE(SUM(haber), 0) AS totalHaber FROM coctamov WHERE empresaId = ?',
        [empresaId],
      );
      const totalDebe = Number(rows?.[0]?.totalDebe) || 0;
      const totalHaber = Number(rows?.[0]?.totalHaber) || 0;
      const redondear = (n: number) => Math.round(n * 100) / 100;
      resumen.verificacion = {
        totalDebe: redondear(totalDebe),
        totalHaber: redondear(totalHaber),
        cuadrado: redondear(totalDebe) === redondear(totalHaber),
      };
      this.logger.log(`[Reconstruir] Fase 6 verificación: D=${totalDebe} H=${totalHaber} cuadrado=${resumen.verificacion.cuadrado}`);
    } catch (e) {
      resumen.verificacion = { error: e.message };
      resumen.errores.push(`Verificación: ${e.message}`);
    }

    resumen.ok = resumen.errores.length === 0 && resumen.verificacion?.cuadrado === true;
    return resumen;
  }

  // ==================== BITÁCORA POSFACMOV ====================

  /**
   * Consulta la bitácora de partidas contables vinculadas a facturas (posfacmov).
   * Filtra por empresaId (requerido), facturaId y/o moduloId (opcionales).
   */
  async findPosfacmov(empresaId: number, facturaId?: number, moduloId?: number): Promise<Posfacmov[]> {
    const where: any = { empresaId };
    if (facturaId) where.facturaId = facturaId;
    if (moduloId) where.moduloId = moduloId;
    return this.posfacmovRepo.find({
      where,
      order: { posfacmovId: 'DESC' },
    });
  }

  // ==================== EVENT LISTENERS ====================

  /**
   * Listener: Cuando se crea un movimiento CxC.
   * Genera partida contable automáticamente si sn_integrar_cxc='S'.
   *
   * Enruta por tipomov (solo moduloId=4):
   *   tipomov='C' + origen='caja'  → PDA 3 (Abono de clientes)
   *   tipomov='D'                  → PDA 4 (Nota débito sobre factura)
   *   tipomov='C' + sin origen     → PDA 5 (Nota crédito sobre factura)
   */
  @OnEvent('cxc.movimiento.creado')
  async handleCxcMovimientoCreado(payload: any) {
    const { movimiento, origen, cajaMae, cajaDet } = payload;
    this.logger.log(`[CxC Event] Movimiento creado: movId=${movimiento?.clienteMovId}, tipo=${movimiento?.tipomov}, importe=${movimiento?.importe}, origen=${origen}`);

    if (Number(movimiento.importe) <= 0) {
      this.logger.debug(`[CxC Event] Ignorado: importe=${movimiento.importe} (<= 0)`);
      return;
    }

    // Determinar plantilla PDA según tipo de movimiento
    let plantillaId: number;
    const tipomov = movimiento.tipomov;
    const moduloId = movimiento.moduloId || 4;

    // Solo procesar movimientos CxC (moduloId=4). Los de facturación (moduloId=3) se procesan aparte.
    if (moduloId !== 4) {
      this.logger.debug(`[CxC Event] Ignorado: moduloId=${moduloId} (no es CxC)`);
      return;
    }

    if (tipomov === 'C' && origen === 'caja') {
      plantillaId = 3; // Abono de clientes
    } else if (tipomov === 'D') {
      plantillaId = 4; // Nota débito sobre factura
    } else if (tipomov === 'C') {
      plantillaId = 5; // Nota crédito sobre factura
    } else {
      this.logger.debug(`[CxC Event] Ignorado: tipomov=${tipomov}, origen=${origen}`);
      return;
    }

    this.logger.log(`[CxC Event] Enrutando a PDA ${plantillaId} (tipomov=${tipomov}, origen=${origen})`);

    try {
      // Buscar facturaId desde posfacmae usando nroreferencia del movimiento.
      // La referencia puede ser texto libre (documentos manuales: "CORR-1"),
      // por lo que SOLO se busca si es numerica finita — Number("texto") = NaN
      // haria que TypeORM emita "WHERE nrofactura = NaN" (Unknown column 'NaN').
      let facturaId: number | undefined;
      const nroRefNum = Number(movimiento.nroreferencia);
      if (movimiento.nroreferencia && Number.isFinite(nroRefNum) && nroRefNum > 0) {
        const factura = await this.facMaeRepo.findOne({
          where: {
            nrofactura: nroRefNum,
            empresaId: movimiento.empresaId,
          } as FindOptionsWhere<TPosFacMae>,
        });
        if (factura) {
          facturaId = factura.facturaId;
          this.logger.log(`[CxC Event] Factura encontrada: facturaId=${facturaId} para nro=${movimiento.nroreferencia}`);
        } else {
          this.logger.debug(`[CxC Event] No se encontró factura con nrofactura=${movimiento.nroreferencia}`);
        }
      }

      const resultado = await this.contabilizarCxC(
        {
          cxcmovimientoId: movimiento.clienteMovId,
          nroreferencia: movimiento.nroreferencia,
          importe: movimiento.importe,
          nrocliente: movimiento.nrocliente,
          cliente: movimiento.cliente || '',
          concepto: movimiento.concepto || '',
        },
        movimiento.empresaId,
        movimiento.Idsucursal || 1,
        movimiento.usuarioCreated,
        facturaId,
        plantillaId,
      );
      this.logger.log(`[CxC Event] contabilizarCxC resultado: ${resultado} (PDA ${plantillaId})`);

      // Si la contabilización fue exitosa y viene de Caja, notificar para actualizar cajamae/cajadet
      if (resultado && origen === 'caja' && cajaMae) {
        this.eventEmitter.emit('cxc.caja.contabilizada', {
          cxccajaId: cajaMae.cxccajaId,
          cxccajadetId: cajaDet?.cxccajadetId,
          partidaId: resultado,
          empresaId: movimiento.empresaId,
          currentUser: movimiento.usuarioCreated,
        });
        this.logger.log(`[CxC Event] Emitido cxc.caja.contabilizada para caja #${cajaMae.cxccajaId}, partidaId=${resultado}`);
      }
    } catch (error) {
      this.logger.error(`[CxC Event] Error en handleCxcMovimientoCreado: ${error.message}`, error.stack);
    }
  }

  /**
   * Listener: Cuando se guarda un COBRO de factura de crédito con cargos (caja).
   * Recibe el reparto completo (capital + interés + mora) y genera UNA sola partida
   * (PDA 3) con el importe correcto por cuenta. Reemplaza el procesamiento por
   * movimiento, que descuadraba al usar el mismo importe en todas las líneas.
   */
  @OnEvent('cxc.cobro.contabilizar')
  async handleCxcCobroContabilizar(payload: any) {
    const { abonoCapital, interes, mora, facturaId, empresaId, Idsucursal, nroreferencia, nrocliente, concepto, movimientoIds, currentUser, cajaMae } = payload;
    this.logger.log(
      `[CxC Cobro] Contabilizando cobro ref=${nroreferencia}: `
      + `capital=${abonoCapital}, interes=${interes}, mora=${mora}`,
    );
    try {
      const partidaId = await this.contabilizarAbonoCajaConCargos(
        {
          empresaId,
          Idsucursal: Idsucursal || 1,
          facturaId,
          nroreferencia,
          nrocliente,
          concepto,
          abonoCapital,
          interes,
          mora,
          movimientoIds,
        },
        currentUser,
      );
      this.logger.log(`[CxC Cobro] contabilizarAbonoCajaConCargos resultado: ${partidaId}`);

      if (partidaId && cajaMae) {
        this.eventEmitter.emit('cxc.caja.contabilizada', {
          cxccajaId: cajaMae.cxccajaId,
          partidaId,
          empresaId,
          currentUser,
        });
        this.logger.log(`[CxC Cobro] Emitido cxc.caja.contabilizada para caja #${cajaMae.cxccajaId}, partidaId=${partidaId}`);
      }
    } catch (error) {
      this.logger.error(`[CxC Cobro] Error en handleCxcCobroContabilizar: ${error.message}`, error.stack);
    }
  }

  /**
   * Listener: Cuando se crea un movimiento CxP.
   * Genera partida contable automáticamente si sn_integrar_cxp='S'.
   *
   * Enruta por tipomov:
   *   tipomov='D'  → PDA 6 (Compra a proveedor / Nota débito)
   *   tipomov='C'  → PDA 7 (Nota crédito sobre proveedor)
   */
  @OnEvent('cxp.movimiento.creado')
  async handleCxPMovimientoCreado(payload: any) {
    const { movimiento, origen, TipoCompra, compraId, empresaId } = payload;
    this.logger.log(`[CxP Event] Movimiento creado: movId=${movimiento?.bcomovId}, tipo=${movimiento?.tipomov}, importe=${movimiento?.importe}, origen=${origen}, TipoCompra=${TipoCompra}`);

    if (Number(movimiento.importe) <= 0) {
      this.logger.debug(`[CxP Event] Ignorado: importe=${movimiento.importe} (<= 0)`);
      return;
    }

    // Determinar plantilla PDA según tipo de movimiento + origen
    let plantillaId: number;
    const tipomov = movimiento.tipomov;

    if (tipomov === 'D' && origen === 'compra') {
      // Compra: FCO/FCC/ORC → PDA 14 (contado) o PDA 15 (crédito)
      if (TipoCompra === 'FCO') {
        plantillaId = 14; // Compra contado: Dr. Mercadería, Cr. Caja General
      } else {
        plantillaId = 15; // Compra crédito (FCC/ORC): Dr. Mercadería, Cr. Proveedores
      }
    } else if (tipomov === 'D') {
      plantillaId = 8; // Nota débito sobre factura proveedor
    } else if (tipomov === 'C') {
      plantillaId = 9; // Nota crédito proveedor
    } else {
      this.logger.debug(`[CxP Event] Ignorado: tipomov=${tipomov}`);
      return;
    }

    this.logger.log(`[CxP Event] Enrutando a PDA ${plantillaId} (tipomov=${tipomov}, origen=${origen}, TipoCompra=${TipoCompra})`);

    try {
      const resultado = await this.contabilizarCxP(
        {
          cxpmovimientoId: movimiento.bcomovId,
          nroreferencia: movimiento.nroreferencia,
          importe: movimiento.importe,
          proveedor: movimiento.descripcion2 || '',
          concepto: movimiento.concepto || '',
          documentoId: movimiento.documentoId,
        },
        movimiento.empresaId,
        movimiento.Idsucursal || 1,
        movimiento.usuarioCreated,
        plantillaId,
      );
      this.logger.log(`[CxP Event] contabilizarCxP resultado: ${resultado} (PDA ${plantillaId})`);

      // Actualizar compra con sn_contabilizada y partidaId
      if (resultado && compraId && empresaId) {
        const now = await this.fechaSistema.getFecha(empresaId);
        await this.cxpCompraMaeRepo.createQueryBuilder()
          .update(TCxpCompraMae)
          .set({
            sn_contabilizada: 'S',
            partidaId: resultado,
            usuarioUpdated: movimiento.usuarioCreated,
            fechaUpdated: now,
          } as any)
          .where('compraId = :id', { id: compraId })
          .andWhere('empresaId = :empresaId', { empresaId })
          .execute();
        this.logger.log(`[CxP Event] Compra ${compraId} marcada como contabilizada (partida ${resultado})`);
      }

      // Central de transacciones: enlazar la partida con el documento maestro
      // (la traza se creó al alta de la compra/movimiento; acá se completa partidaId)
      await this.trazarCxP(movimiento, resultado, compraId, empresaId || movimiento?.empresaId);
    } catch (error) {
      this.logger.error(`[CxP Event] Error en handleCxPMovimientoCreado: ${error.message}`, error.stack);
    }
  }

  /** Asigna la partida contable a las filas de `trasaviblidad` de compra y movimiento CxP */
  private async trazarCxP(
    movimiento: any,
    partidaId: number | null,
    compraId?: number,
    empresaId?: number,
  ): Promise<void> {
    if (!partidaId || !empresaId) return;
    const idsucursal = movimiento?.Idsucursal ?? null;
    const usuario = movimiento?.usuarioCreated ?? null;
    try {
      if (compraId) {
        await this.trazaService.asignarPartida(5, compraId, partidaId, empresaId, idsucursal, usuario);
      }
      if (movimiento?.bcomovId) {
        await this.trazaService.asignarPartida(5, movimiento.bcomovId, partidaId, empresaId, idsucursal, usuario);
      }
    } catch (error: any) {
      this.logger.error(`[trasaviblidad] No se pudo enlazar partida ${partidaId}: ${error?.message || error}`);
    }
  }

  /**
   * Listener: Cuando se crea un movimiento bancario.
   * Genera partida contable automáticamente si sn_integrar_bancos='S'.
   *
   * Enruta por tipomov + origen:
   *   DEPOSITO              → PDA 10 (depósito a cuenta bancaria)
   *   RETIRO                → PDA 11 (retiro de cuenta bancaria)
   *   PAGO + proveedor      → PDA 12 (emisión de cheque a proveedor)
   *   PAGO + particular     → PDA 13 (emisión de cheque a particular)
   *   TRANSFERENCIA         → PDA 10 (entrada al banco)
   *   NOTA_CREDITO          → PDA 10 (entrada, como depósito)
   *   NOTA_DEBITO           → PDA 11 (salida, como retiro)
   */
  @OnEvent('bancos.movimiento.creado')
  async handleBancoMovimientoCreado(payload: any) {
    const { movimiento, origen } = payload;
    this.logger.log(`[Bancos Event] Movimiento creado: movId=${movimiento?.bcomovimientosId}, tipo=${movimiento?.tipomov}, importe=${movimiento?.importe}, origen=${origen}`);

    if (Number(movimiento.importe) <= 0) {
      this.logger.debug(`[Bancos Event] Ignorado: importe=${movimiento.importe} (<= 0)`);
      return;
    }

    // Determinar plantilla PDA según tipo de movimiento
    let plantillaId: number;
    const tipomov = movimiento.tipomov;

    if (tipomov === 'DEPOSITO') {
      plantillaId = 10; // Depósito a cuenta bancaria
    } else if (tipomov === 'RETIRO') {
      plantillaId = 11; // Retiro de cuenta bancaria
    } else if (tipomov === 'PAGO' && origen === 'emitirCheques') {
      plantillaId = 12; // Emisión de cheque a proveedor
    } else if (tipomov === 'PAGO' && origen === 'emitirChequeParticular') {
      plantillaId = 13; // Emisión de cheque a particular
    } else if (tipomov === 'TRANSFERENCIA') {
      plantillaId = 10; // Transferencia = depósito (entrada al banco)
    } else if (tipomov === 'NOTA_CREDITO') {
      plantillaId = 10; // Nota de crédito = entrada (como depósito)
    } else if (tipomov === 'NOTA_DEBITO') {
      plantillaId = 11; // Nota de débito = salida (como retiro)
    } else {
      this.logger.debug(`[Bancos Event] Ignorado: tipomov=${tipomov}, origen=${origen}`);
      return;
    }

    this.logger.log(`[Bancos Event] Enrutando a PDA ${plantillaId} (tipomov=${tipomov}, origen=${origen})`);

    try {
      const resultado = await this.contabilizarBanco(
        {
          bcomovimientosId: movimiento.bcomovimientosId,
          nroreferencia: movimiento.nroreferencia,
          importe: movimiento.importe,
          dc_debitocredito: movimiento.dc_debitocredito,
          concepto: movimiento.concepto || '',
        },
        movimiento.empresaId,
        movimiento.Idsucursal || 1,
        movimiento.usuarioCreated,
        plantillaId,
      );
      this.logger.log(`[Bancos Event] contabilizarBanco resultado: ${resultado} (PDA ${plantillaId})`);
    } catch (error) {
      this.logger.error(`[Bancos Event] Error en handleBancoMovimientoCreado: ${error.message}`, error.stack);
    }
  }

  // ── PARTIDA CONTABLE DE PLANILLA (PDA 21) ────────────────────────────────

  /**
   * Acumulados de una planilla (desde `plepladet`) para armar la partida
   * contable del pago de planilla con la plantilla PDA 21.
   */
  async crearPartidaPlanilla(dto: CrearPartidaPlanillaDto, currentUser: string) {
    const red = (x: number) => Math.round(x * 100) / 100;

    // ── 1. Plantilla PDA activa y sus filas ──
    const plantilla = await this.plantillaMaeRepo.findOne({
      where: {
        tcoplantillapdamaeId: dto.plantillaId,
        empresaId: dto.empresaId,
        sn_activo: 'S',
      } as unknown as FindOptionsWhere<Tcoplantillapdamae>,
    });
    if (!plantilla) {
      throw new BadRequestException(
        `La plantilla contable ${dto.plantillaId} (pago de planilla) no existe o está inactiva `
        + `para la empresa ${dto.empresaId}.`,
      );
    }
    const filas = (
      await this.plantillaDetRepo.find({
        where: {
          tcoplantillapdamaeId: dto.plantillaId,
          empresaId: dto.empresaId,
          sn_activo: 'S',
        } as unknown as FindOptionsWhere<Tcoplantillapdadet>,
      })
    ).sort((a, b) => a.nrofila - b.nrofila);
    if (!filas.length) {
      throw new BadRequestException(`La plantilla contable ${dto.plantillaId} no tiene filas activas.`);
    }

    // ── 2. Mapa nrofila → importe (esquema del Excel partidaplanilla.xlsx) ──
    // Regla del usuario (21/10/2026): el IHSS/RAP se calcula CON techo
    // (base = mín(sueldo, techoseguro)) pero el asiento DEBE cuadrar. Cuadra
    // por construcción: los pares D/C (IHSS/RAP emp y patronal) llevan el
    // MISMO importe en ambos lados y el neto por pagar (fila 13) no descuenta
    // deducciones ni comisiones.
    const i = dto.importes;
    // Fila 13 — neto por pagar = sueldobruto + HE + bonos (SIN deducciones
    // ni comisiones; el resto de filas C reparte por separado lo demás).
    const netoPorPagar = red(
      i.sbAdmon + i.sbVentas + i.heAdmon + i.heVentas + i.bonosAdmon + i.bonosVentas,
    );
    const porFila: Record<number, number> = {
      // ── DEBE ──
      1: i.sbAdmon,      // Gastos de personal — sueldos admón
      2: i.otrasDed,     // Otras deducciones del personal (gasto)
      3: i.heAdmon,      // Horas extras admón
      4: i.bonosAdmon,   // Bonos admón
      5: i.sbVentas,     // Gastos de personal — sueldos ventas
      6: i.comisiones,   // Comisiones a vendedores
      7: i.heVentas,     // Horas extras ventas
      8: i.bonosVentas,  // Bonos ventas
      9: i.isr,          // ISR retenido al empleado (gasto)
      10: i.vecinal,     // Impuesto vecinal retenido (gasto)
      11: i.ihssEmp,     // IHSS porción empleado (base con techo)
      12: i.rapEmp,      // RAP porción empleado (excedente sobre techo)
      23: i.ihssPat,     // IHSS porción patronal (8.7% con techo)
      24: i.rapVivPat,   // RAP patronal vivienda (1.5% excedente)
      25: i.rapResPat,   // Reserva patronal (4%)
      // ── HABER ──
      13: netoPorPagar,  // Sueldos y salarios por pagar
      14: i.comisiones,  // Comisiones por pagar
      15: i.isr,         // ISR por pagar (DH)
      16: i.vecinal,     // Impuesto vecinal por pagar
      17: i.otrasDed,    // Otras deducciones por pagar
      18: i.ihssEmp,     // IHSS por pagar — empleado
      19: i.rapEmp,      // RAP por pagar — empleado
      20: i.ihssPat,     // IHSS por pagar — patronal
      21: i.rapVivPat,   // RAP vivienda por pagar — patronal
      22: i.rapResPat,   // Reserva patronal por pagar
    };

    // ── 3. Líneas del asiento (importe 0 → se omite) + invariante D = C ──
    const lineas = filas
      .map((f) => ({ f, importe: red(porFila[f.nrofila] ?? 0) }))
      .filter((x) => x.importe > 0)
      .map((x) => ({
        ctacontable: x.f.ctacontable,
        descripcion: x.f.descripcion ?? dto.descripcion,
        debito: x.f.naturaleza === 'D' ? x.importe : 0,
        credito: x.f.naturaleza === 'C' ? x.importe : 0,
      }));
    if (!lineas.length) {
      throw new BadRequestException(
        'La planilla no tiene importes para contabilizar (todas las líneas de la plantilla dan 0).',
      );
    }
    const totDebito = red(lineas.reduce((s, l) => s + l.debito, 0));
    const totCredito = red(lineas.reduce((s, l) => s + l.credito, 0));
    if (Math.abs(totDebito - totCredito) >= 0.01) {
      // No debe ocurrir: los pares D/C de la plantilla 21 son idénticos por construcción
      throw new BadRequestException(
        `La partida de planilla no cuadra: débitos L ${totDebito.toFixed(2)} `
        + `vs créditos L ${totCredito.toFixed(2)}.`,
      );
    }

    // ── 4. Cuentas existentes/operables + no duplicada por referencia ──
    await this.verificarCuentasContables(lineas, dto.empresaId);
    const previa = await this.copdamaeRepo.findOne({
      where: { empresaId: dto.empresaId, nroreferencia: dto.nroreferencia } as unknown as FindOptionsWhere<Copdamae>,
    });
    if (previa) {
      throw new BadRequestException(
        `Ya existe la partida #${previa.nropartida} con referencia ${dto.nroreferencia}: `
        + 'no se puede duplicar la partida de planilla.',
      );
    }

    // ── 5. Crear copdamae + copdadet (patrón realizarCierre) ──
    // Reglas 1 y 4: fecharegistro lo impone el backend.
    const fecharegistro = await this.fechaSistema.obtenerFechaRegistro(currentUser, dto.empresaId);
    const fecha = await this.fechaSistema.getFecha(dto.empresaId);
    const nropartida = await this.siguienteNropartida(currentUser, dto.empresaId);

    const copdamae = this.copdamaeRepo.create({
      empresaId: dto.empresaId,
      Idsucursal: dto.Idsucursal ?? 1,
      periodo: dto.periodo,
      anio: dto.anio,
      moduloId: 8, // Planilla
      documentoId: 0,
      fechadocumento: fecha,
      factordecambio: 0,
      nroreferencia: dto.nroreferencia,
      descripcion: dto.descripcion,
      nropartida,
      sn_anulada: 'N',
      // Se postea a coctamov/coctasaldos en el paso 6 → contabilizada
      sn_contabilizada: 'S',
      fecharegistro,
      usuarioCreated: currentUser,
    });
    const savedMae = await this.copdamaeRepo.save(copdamae);

    let nrofila = 1;
    for (const linea of lineas) {
      const det = this.copdadetRepo.create({
        empresaId: dto.empresaId,
        Idsucursal: dto.Idsucursal ?? 1,
        partidaId: savedMae.partidaId,
        periodo: dto.periodo,
        anio: dto.anio,
        nropartida,
        moduloId: 8,
        nrofila: nrofila++,
        ctacontable: linea.ctacontable,
        descripcion: linea.descripcion,
        debito: linea.debito,
        credito: linea.credito,
        factordecambio: 0,
        sn_anulada: 'N',
        sn_contabilizada: 'S',
        fecharegistro,
        usuarioCreated: currentUser,
      });
      await this.copdadetRepo.save(det);
    }

    // ── 6. Postear a mayor (coctamov + coctasaldos) ──
    await this.actualizarMovimientosContables(lineas, dto.empresaId, nropartida, dto.periodo, dto.anio, currentUser);
    await this.actualizarSaldosCuentas(lineas, dto.empresaId, dto.periodo, dto.anio, currentUser);

    this.logger.log(
      `Partida de planilla ${nropartida} (${dto.nroreferencia}) creada por ${currentUser}: `
      + `${lineas.length} líneas, D L ${totDebito.toFixed(2)} = C L ${totCredito.toFixed(2)}`,
    );
    return { partidaId: savedMae.partidaId, nropartida, totDebito, totCredito, lineas: lineas.length };
  }
}

/**
 * Acumulados de la planilla que alimentan la partida contable PDA 21
 * (pago de planilla). Todos los importes en Lempiras, ya redondeados a 2 decimales.
 */
export interface PartidaPlanillaImportes {
  /** Σ sueldobruto — departamento ≠ Ventas */
  sbAdmon: number;
  /** Σ sueldobruto — departamento Ventas */
  sbVentas: number;
  /** Σ importe_chorasextras — admón */
  heAdmon: number;
  /** Σ importe_chorasextras — ventas */
  heVentas: number;
  /** Σ importe_cbonos — admón */
  bonosAdmon: number;
  /** Σ importe_cbonos — ventas */
  bonosVentas: number;
  /** Σ importe_ccomision (siempre a la cuenta de ventas) */
  comisiones: number;
  /** Σ importe_dotras (siempre a la cuenta de admón) */
  otrasDed: number;
  /** Σ importe_drtf (ISR) */
  isr: number;
  /** Σ importe_drvc (impuesto vecinal) */
  vecinal: number;
  /** Σ importe_dihss (IHSS empleado, ya con techo en la generación) */
  ihssEmp: number;
  /** Σ importe_drap (RAP empleado, ya con/excedente del techo) */
  rapEmp: number;
  /** Σ IHSS patronal 8.7% sobre mín(sueldo, techo) — se recalcula aquí */
  ihssPat: number;
  /** Σ RAP patronal vivienda 1.5% sobre excedente del techo */
  rapVivPat: number;
  /** Σ Reserva patronal 4% sobre sueldobruto */
  rapResPat: number;
}

/** Payload de `ContabilidadLogicaService.crearPartidaPlanilla`. */
export interface CrearPartidaPlanillaDto {
  empresaId: number;
  periodo: number;
  anio: number;
  /** Plantilla PDA del asiento de planilla (21 = "Pago de planilla"). */
  plantillaId: number;
  /** Referencia única de la partida, ej. `PLANILLA-000003`. */
  nroreferencia: string;
  descripcion: string;
  importes: PartidaPlanillaImportes;
  Idsucursal?: number;
}
