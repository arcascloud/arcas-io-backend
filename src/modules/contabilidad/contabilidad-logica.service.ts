import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { Copdamae } from './entities/copdamae.entity';
import { Copdadet } from './entities/copdadet.entity';
import { Comovcta } from './entities/comovcta.entity';
import { Cosaldoscta } from './entities/cosaldoscta.entity';
import { Tcoctacontables } from './entities/tcoctacontables.entity';
import { Coperiodoctable } from './entities/coperiodoctable.entity';
import { Cocierrectable } from './entities/cocierrectable.entity';
import { Tcoplantillapdamae } from './entities/tcoplantillapdamae.entity';
import { Tcoplantillapdadet } from './entities/tcoplantillapdadet.entity';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
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
import { ContabilizarPartidaDto, CierreContableDto, ReporteContableDto } from './dto/contabilidad.dto';

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
    @InjectRepository(Comovcta) private readonly movctaRepo: Repository<Comovcta>,
    @InjectRepository(Cosaldoscta) private readonly saldosctaRepo: Repository<Cosaldoscta>,
    @InjectRepository(Tcoctacontables) private readonly ctacontablesRepo: Repository<Tcoctacontables>,
    @InjectRepository(Coperiodoctable) private readonly periodoctableRepo: Repository<Coperiodoctable>,
    @InjectRepository(Cocierrectable) private readonly cierrectableRepo: Repository<Cocierrectable>,
    @InjectRepository(Tcoplantillapdamae) private readonly plantillaMaeRepo: Repository<Tcoplantillapdamae>,
    @InjectRepository(Tcoplantillapdadet) private readonly plantillaDetRepo: Repository<Tcoplantillapdadet>,
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
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
  ) {}

  // ==================== CONTABILIZACIÓN ====================

  /**
   * Contabiliza una partida: crea copdamae + copdadet + actualiza comovcta + cosaldoscta
   * Valida que la partida esté cuadrada (débitos = créditos)
   */
  async contabilizarPartida(dto: ContabilizarPartidaDto, currentUser: string): Promise<Copdamae> {
    // 1. Validar que la partida esté cuadrada
    this.validarPartidaCuadrada(dto.lineas);

    // 2. Verificar que el período esté abierto
    await this.verificarPeriodoAbierto(dto.empresaId, dto.anio, dto.periodo);

    // 3. Verificar que las cuentas contables existan y sean operables
    await this.verificarCuentasContables(dto.lineas, dto.empresaId);

    // 4. Generar número de partida
    const nropartida = await this.generarNroPartida(dto.empresaId, dto.anio, dto.periodo);

    // 5. Crear copdamae (maestro)
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
      sn_activo: 'S',
      usuarioCreated: currentUser,
    });
    const savedMae = await this.copdamaeRepo.save(copdamae);

    // 6. Crear copdadet (detalles)
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
        sn_activo: 'S',
        usuarioCreated: currentUser,
      });
      await this.copdadetRepo.save(det);
    }

    // 7. Actualizar movimientos contables (comovcta)
    await this.actualizarMovimientosContables(dto.lineas, dto.empresaId, nropartida, dto.periodo, dto.anio, currentUser);

    // 8. Actualizar saldos de cuentas (cosaldoscta)
    await this.actualizarSaldosCuentas(dto.lineas, dto.empresaId, dto.periodo, dto.anio, currentUser);

    this.logger.log(`Partida ${nropartida} contabilizada por ${currentUser} - Empresa ${dto.empresaId}`);
    return savedMae;
  }

  /**
   * Valida que débitos = créditos en la partida
   */
  private validarPartidaCuadrada(lineas: { debito: number; credito: number }[]): void {
    if (!lineas || lineas.length < 2) {
      throw new BadRequestException('La partida debe tener al menos 2 líneas');
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
   * Verifica que todas las cuentas contables de la partida existan y sean operables
   */
  private async verificarCuentasContables(
    lineas: { ctacontable: string }[],
    empresaId: number,
  ): Promise<void> {
    const cuentasUnicas = [...new Set(lineas.map(l => l.ctacontable))];

    for (const cta of cuentasUnicas) {
      const cuenta = await this.ctacontablesRepo.findOne({
        where: {
          ctacontable: cta,
          empresaId,
          sn_activo: 'S',
        } as unknown as FindOptionsWhere<Tcoctacontables>,
      });

      if (!cuenta) {
        throw new BadRequestException(`La cuenta contable ${cta} no existe o no está activa`);
      }

      if (cuenta.sn_operable !== 'S') {
        throw new BadRequestException(`La cuenta contable ${cta} no es operable (no permite movimientos)`);
      }
    }
  }

  /**
   * Genera el siguiente número de partida para el período
   */
  private async generarNroPartida(empresaId: number, anio: number, periodo: number): Promise<number> {
    const resultado = await this.copdamaeRepo
      .createQueryBuilder('mae')
      .select('MAX(mae.nropartida)', 'maxPartida')
      .where('mae.empresaId = :empresaId', { empresaId })
      .andWhere('mae.anio = :anio', { anio })
      .andWhere('mae.periodo = :periodo', { periodo })
      .getRawOne();

    return (resultado?.maxPartida ?? 0) + 1;
  }

  /**
   * Actualiza la tabla de movimientos contables (comovcta)
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
        } as unknown as FindOptionsWhere<Comovcta>,
      });

      if (mov) {
        // Acumular
        mov.debe = Number(mov.debe) + montoDebito;
        mov.haber = Number(mov.haber) + montoCredito;
        mov.saldo = Number(mov.debe) - Number(mov.haber);
        mov.ultnropda = nropartida;
        mov.fecultmov = new Date();
        await this.movctaRepo.save(mov);
      } else {
        // Crear nuevo
        mov = this.movctaRepo.create({
          empresaId,
          monedaId: 1, // Lempiras por defecto
          ctacontable: linea.ctacontable,
          anio,
          periodo,
          sacum: 0,
          debe: montoDebito,
          haber: montoCredito,
          saldo: montoDebito - montoCredito,
          ultnropda: nropartida,
          fecultmov: new Date(),
          usuarioCreated: currentUser,
        });
        await this.movctaRepo.save(mov);
      }
    }
  }

  /**
   * Actualiza la tabla de saldos mensuales (cosaldoscta)
   * Actualiza el saldo del mes correspondiente
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

    for (const linea of lineas) {
      const montoDebito = Number(linea.debito) || 0;
      const montoCredito = Number(linea.credito) || 0;
      const montoNeto = montoDebito - montoCredito;

      if (montoNeto === 0) continue;

      // Buscar saldo existente
      let saldo = await this.saldosctaRepo.findOne({
        where: {
          ctacontable: linea.ctacontable,
          empresaId,
          anio,
        } as unknown as FindOptionsWhere<Cosaldoscta>,
      });

      if (saldo) {
        // Acumular en el mes correspondiente
        const valorActual = Number(saldo[mesColumna]) || 0;
        (saldo as any)[mesColumna] = valorActual + montoNeto;
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
        nuevoSaldo[mesColumna] = montoNeto;

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

    // 2. Verificar que no existan partidas sin contabilizar del período
    // (Por ahora solo validamos que el período esté abierto)

    // 3. Cerrar el período
    periodo.sn_abierto = 'N';
    periodo.usuarioUpdated = currentUser;
    await this.periodoctableRepo.save(periodo);

    // 4. Registrar el cierre
    const fecha = await this.fechaSistema.getFecha(dto.empresaId);
    const cierre = this.cierrectableRepo.create({
      empresaId: dto.empresaId,
      periodo: dto.periodo,
      anio: dto.anio,
      fechacierre: fecha,
      observacion: dto.observacion ?? `Cierre período ${dto.periodo}/${dto.anio}`,
      sn_activo: 'S',
      usuarioCreated: currentUser,
    });
    const savedCierre = await this.cierrectableRepo.save(cierre);

    this.logger.log(`Cierre ${dto.periodo}/${dto.anio} realizado por ${currentUser} - Empresa ${dto.empresaId}`);
    return savedCierre;
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
      } as unknown as FindOptionsWhere<Comovcta>,
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
        where: { ctacontable, empresaId: dto.empresaId } as unknown as FindOptionsWhere<Tcoctacontables>,
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
   * Genera Libro Diario
   * Lista todas las partidas contables del período con sus detalles
   */
  async generarLibroDiario(dto: ReporteContableDto): Promise<any[]> {
    const partidas = await this.copdamaeRepo.find({
      where: {
        empresaId: dto.empresaId,
        anio: dto.anio,
        periodo: dto.periodo,
        sn_activo: 'S',
      } as unknown as FindOptionsWhere<Copdamae>,
      order: { nropartida: 'ASC' } as any,
    });

    const resultado: any[] = [];

    for (const mae of partidas) {
      const detalles = await this.copdadetRepo.find({
        where: {
          partidaId: mae.partidaId,
          sn_activo: 'S',
        } as unknown as FindOptionsWhere<Copdadet>,
        order: { nrofila: 'ASC' } as any,
      });

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
      });
    }

    return resultado;
  }

  /**
   * Genera Libro Mayor
   * Muestra movimientos agrupados por cuenta contable
   */
  async generarLibroMayor(dto: ReporteContableDto): Promise<any[]> {
    const movimientos = await this.movctaRepo.find({
      where: {
        empresaId: dto.empresaId,
        anio: dto.anio,
        periodo: dto.periodo,
      } as unknown as FindOptionsWhere<Comovcta>,
      order: { ctacontable: 'ASC' } as any,
    });

    const resultado: any[] = [];
    for (const mov of movimientos) {
      const cuenta = await this.ctacontablesRepo.findOne({
        where: { ctacontable: mov.ctacontable, empresaId: dto.empresaId } as unknown as FindOptionsWhere<Tcoctacontables>,
      });

      resultado.push({
        ctacontable: mov.ctacontable,
        descripcionCta: cuenta?.descripcion ?? '',
        anio: mov.anio,
        periodo: mov.periodo,
        debe: Number(mov.debe) || 0,
        haber: Number(mov.haber) || 0,
        saldo: Number(mov.saldo) || 0,
        sacum: Number(mov.sacum) || 0,
        fecultmov: mov.fecultmov,
        ultnropda: mov.ultnropda,
      });
    }

    return resultado;
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
  ): Promise<void> {
    try {
      // 1. Verificar si la integración contable está habilitada
      const paramKey = 'sn_integrar_facturacion';
      const valorParam = await this.getValorParametro(empresaId, paramKey);
      if (valorParam !== 'S') {
        this.logger.debug(`Integración contable deshabilitada (${paramKey}=${valorParam})`);
        return;
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
        return;
      }

      // 3. Leer detalles de la factura
      const detalles = await this.facDetRepo.find({
        where: { facturaId: factura.facturaId } as FindOptionsWhere<TPosFacDet>,
      });

      if (!detalles || detalles.length === 0) {
        this.logger.warn(`Factura ${factura.nrofactura} sin detalles. No se genera partida.`);
        return;
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
        return;
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
        return;
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
        return;
      }

      // 9. Crear la partida contable
      const fecha = await this.fechaSistema.getFecha(empresaId);
      const periodo = new Date(fecha).getMonth() + 1;
      const anio = new Date(fecha).getFullYear();

      const copdamae = await this.contabilizarPartida({
        empresaId,
        Idsucursal,
        periodo,
        anio,
        moduloId: 2, // Facturación
        documentoId: factura.facturaId,
        fechadocumento: factura.fecharegistro as any,
        nroreferencia: `FAC-${factura.nrofactura}`,
        descripcion: `Factura #${factura.nrofactura} - ${factura.nombrecliente || 'Cliente'}`,
        lineas,
      }, currentUser);

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
        fecharegistro: new Date(),
        facturaId: factura.facturaId,
        moduloId: 2, // Facturación
        partidaId: copdamae.partidaId,
        Idsucursal,
        empresaId,
        usuarioCreated: currentUser,
      });

      this.logger.log(
        `Factura ${factura.nrofactura} contabilizada automáticamente `
        + `(partida ${copdamae.nropartida}, ${lineas.length} líneas)`,
      );
    } catch (error) {
      this.logger.error(`Error al contabilizar factura ${factura.nrofactura}: ${error.message}`);
      // No lanzamos error para no bloquear la factura
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

      // 2. Marcar maestro como inactivo
      await this.copdamaeRepo.createQueryBuilder()
        .update(Copdamae)
        .set({ sn_activo: 'N' } as any)
        .where('partidaId = :id', { id: copdamae.partidaId })
        .execute();

      // 3. Marcar todos los detalles como inactivos
      await this.copdadetRepo.createQueryBuilder()
        .update(Copdadet)
        .set({ sn_activo: 'N' } as any)
        .where('partidaId = :id', { id: copdamae.partidaId })
        .execute();

      // 4. Revertir movimientos contables (comovcta)
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
          } as FindOptionsWhere<Comovcta>,
        });

        if (mov) {
          await this.movctaRepo.createQueryBuilder()
            .update(Comovcta)
            .set({
              debe: Number(mov.debe) - Number(det.debito),
              haber: Number(mov.haber) - Number(det.credito),
            } as any)
            .where('movctascontablesId = :id', { id: mov.movctascontablesId })
            .execute();
        }
      }

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
      this.logger.error(`Error al descontabilizar factura ${factura.nrofactura}: ${error.message}`);
    }
  }

  /**
   * Identifica el concepto contable de una línea de plantilla por palabras clave.
   * Las plantillas usan la descripción para indicar a qué概念o corresponde cada cuenta.
   */
  private identificarConcepto(descripcion: string): string {
    const desc = descripcion.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (desc.includes('CAJA') || desc.includes('COBRAR') || desc.includes('CUENTAS POR COBRAR')) {
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
  async contabilizarCxC(movimiento: any, empresaId: number, Idsucursal: number, currentUser: string, facturaId?: number, plantillaId?: number): Promise<number | null> {
    try {
      // 1. Verificar si la integración CxC está habilitada
      const paramKey = 'sn_integrar_cxc';
      const valorParam = await this.getValorParametro(empresaId, paramKey);
      if (valorParam !== 'S') {
        this.logger.debug(`Integración CxC deshabilitada (${paramKey}=${valorParam})`);
        return null;
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
      let refInterna = nroFactura;
      if (movimiento.documentoId) {
        const docFiscal = await this.tipoDocFiscalRepo.findOne({
          where: { tipodocumentofiscalId: Number(movimiento.documentoId) } as any,
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

      // 6. Crear la partida contable
      const fecha = await this.fechaSistema.getFecha(empresaId);
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
      }, currentUser);

      // 7. Registrar en bitácora posfacmov (partida de abono CxC)
      if (facturaId && Idsucursal && Idsucursal > 0) {
        await this.posfacmovRepo.save({
          fecharegistro: await this.fechaSistema.getFecha(empresaId),
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
      const now = await this.fechaSistema.getFecha(empresaId);
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
   * Genera asiento contable para un movimiento de CxP (pago a proveedor / nota débito / nota crédito).
   * Lee plantilla PDA desde tcoplantillapdamae/det por moduloId=5.
   * Actualiza cxpmovimientos con partidaId y sn_contabilizado='S'.
   *
   * @param plantillaId ID de la plantilla PDA a usar (6=Pago, 7=Nota Débito, 8=Nota Crédito)
   */
  async contabilizarCxP(movimiento: any, empresaId: number, Idsucursal: number, currentUser: string, plantillaId?: number): Promise<number | null> {
    try {
      // 1. Verificar si la integración CxP está habilitada
      const paramKey = 'sn_integrar_cxp';
      const valorParam = await this.getValorParametro(empresaId, paramKey);
      if (valorParam !== 'S') {
        this.logger.debug(`Integración CxP deshabilitada (${paramKey}=${valorParam})`);
        return null;
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

      // 6. Crear la partida contable
      const fecha = await this.fechaSistema.getFecha(empresaId);
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
      }, currentUser);

      // 7. Actualizar movimiento CxP con partidaId y sn_contabilizado
      const now = await this.fechaSistema.getFecha(empresaId);
      await this.cxpMovimientoRepo.createQueryBuilder()
        .update(TCxpMovimiento)
        .set({
          partidaId: copdamae.partidaId,
          sn_contabilizado: 'S',
          usuarioUpdated: currentUser,
          fechaUpdated: now,
        } as any)
        .where('bcomovId = :id', { id: movId })
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
  async contabilizarBanco(movimiento: any, empresaId: number, Idsucursal: number, currentUser: string, plantillaId?: number): Promise<number | null> {
    try {
      // 1. Verificar si la integración Bancos está habilitada
      const paramKey = 'sn_integrar_bancos';
      const valorParam = await this.getValorParametro(empresaId, paramKey);
      if (valorParam !== 'S') {
        this.logger.debug(`Integración Bancos deshabilitada (${paramKey}=${valorParam})`);
        return null;
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

      // 6. Crear la partida contable
      const fecha = await this.fechaSistema.getFecha(empresaId);
      const periodo = new Date(fecha).getMonth() + 1;
      const anio = new Date(fecha).getFullYear();

      const copdamae = await this.contabilizarPartida({
        empresaId,
        Idsucursal,
        periodo,
        anio,
        moduloId: 6, // Bancos
        documentoId: movId,
        nroreferencia: `BCO-${nroRef}`.substring(0, 70),
        descripcion: concepto,
        lineas,
      }, currentUser);

      // 7. Actualizar movimiento bancario con partidaId y sn_cotabilizada
      const now = await this.fechaSistema.getFecha(empresaId);
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
      // Buscar facturaId desde posfacmae usando nroreferencia del movimiento
      let facturaId: number | undefined;
      if (movimiento.nroreferencia) {
        const factura = await this.facMaeRepo.findOne({
          where: {
            nrofactura: Number(movimiento.nroreferencia),
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
    } catch (error) {
      this.logger.error(`[CxP Event] Error en handleCxPMovimientoCreado: ${error.message}`, error.stack);
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
}
