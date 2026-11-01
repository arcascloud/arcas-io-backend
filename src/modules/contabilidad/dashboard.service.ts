import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { Coctacontables } from './entities/coctacontables.entity';
import { Coctasaldos } from './entities/coctasaldos.entity';
import { Copdadet } from './entities/copdadet.entity';
import { Coperiodoctable } from './entities/coperiodoctable.entity';
import { CxcMovimiento } from '../cxc/entities/cxcmovimiento.entity';
import { TCxpMovimiento } from '../cxp/entities/movimiento.entity';
import { TCxpCompraMae } from '../cxp/entities/compra-mae.entity';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Redondea a 2 decimales (MySQL devuelve decimal como string; nunca confiar en la suma de flotantes). */
const redondear = (n: number | string): number => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Dashboard del Módulo 7 (Contabilidad) — 7 widgets.
 *
 * W1  Composición patrimonial (pastel): Activos / Pasivos / Capital
 *     → `coctasaldos` columna del mes = SALDO FINAL firmado con arrastre
 *       (regla 30/09/2026), solo HOJAS (evita doble conteo si hubiera filas
 *       de cuentas padre). Segmento = primer segmento de `ctacontable`.
 * W1b Resultados del período (doughnut + stats): Ingresos (4) vs
 *     Gastos y Costos (5/6/7) → Utilidad/Pérdida, APARTE del pastel.
 * W2  Cuentas nivel 2 de ACTIVOS y PASIVOS (barras por período/ejercicio)
 *     → mismas hojas de `coctasaldos` agregadas a sus 2 primeros segmentos
 *       (`1-1`, `1-2`, … `2-3`), etiquetadas desde `coctacontables.nivel = 2`.
 * W3  Comparativo de INGRESOS (grupo 4): mes actual vs mes anterior
 *     → `copdadet` con bandera simple `sn_contabilizada='S'`
 *       (10/10/2026; antes doble bandera regla 29/09/2026). Ingresos =
 *       crédito − débito por cuenta.
 * W4  Comparativo de GASTOS Y COSTOS (grupos 5/6/7): ídem. Gastos = débito − crédito.
 *     (Tras la reestructuración 05/10/2026 los costos de venta/producción salen
 *      del grupo 5 → se agregan los grupos 6 y 7 a este widget.)
 * W5  CxC: facturado (D) vs recuperado (suma del HABER, C) → `cxcmovimientos`
 *     no anulados + documentos/clientes con saldo pendiente.
 * W6  CxP: debitado (D) vs pagado (suma del HABER, C) → `cxpmovimientos`
 *     no anulados + documentos con saldo + compras sin pagar (`cxpcomprasmae`).
 *
 * Todos los montos salen con `redondear()` a 2 decimales.
 * `empresaId` participa en TODAS las queries (multi-empresa).
 */
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Coctacontables) private readonly ctacontablesRepo: Repository<Coctacontables>,
    @InjectRepository(Coctasaldos) private readonly saldosctaRepo: Repository<Coctasaldos>,
    @InjectRepository(Copdadet) private readonly copdadetRepo: Repository<Copdadet>,
    @InjectRepository(Coperiodoctable) private readonly periodoctableRepo: Repository<Coperiodoctable>,
    @InjectRepository(CxcMovimiento) private readonly cxcMovRepo: Repository<CxcMovimiento>,
    @InjectRepository(TCxpMovimiento) private readonly cxpMovRepo: Repository<TCxpMovimiento>,
    @InjectRepository(TCxpCompraMae) private readonly cxpCompraRepo: Repository<TCxpCompraMae>,
    private readonly fechaSistema: FechaSistemaService,
  ) {}

  /**
   * Arma el payload completo del dashboard.
   * Defaults: `anio` = año de la Fecha del Sistema; `periodo` = mes de la
   * Fecha del Sistema acotado al último período definido en `coperiodoctable`.
   */
  async getDashboard(empresaId: number, anio?: number, periodo?: number) {
    if (!empresaId) throw new BadRequestException('empresaId es requerido');
    if (anio != null && (!Number.isInteger(anio) || anio < 1900 || anio > 2200)) {
      throw new BadRequestException(`Año inválido: ${anio}`);
    }
    if (periodo != null && (!Number.isInteger(periodo) || periodo < 1 || periodo > 12)) {
      throw new BadRequestException(`Período inválido: ${periodo} (debe estar entre 1 y 12)`);
    }

    const fecha = await this.fechaSistema.getFecha(empresaId);
    const anioDef = anio ?? fecha.getFullYear();

    // Último período definido en el calendario contable del año (TOPE).
    const defs = await this.periodoctableRepo.find({ where: { empresaId, nroanio: anioDef } });
    const periodoMax = defs.length ? Math.max(...defs.map((d) => d.nromes)) : 12;
    const p = periodo ?? Math.min(periodoMax, Math.max(fecha.getMonth() + 1, 1));

    // Mes anterior: si p = 1 → diciembre del año anterior (misma query con anioAnt).
    const pAnt = p > 1 ? p - 1 : 12;
    const anioAnt = p > 1 ? anioDef : anioDef - 1;

    const col = MESES[p - 1];
    const etiquetaPeriodo = `${MESES[p - 1]} ${anioDef}`;
    const etiquetaAnterior = `${MESES[pAnt - 1]} ${anioAnt}`;

    const [patrimonial, nivel2, ingresos, gastos, cxc, cxp] = await Promise.all([
      this.resumenPatrimonial(empresaId, anioDef, col),
      this.cuentasNivel2(empresaId, anioDef, col),
      this.comparativoGrupo(empresaId, anioDef, p, pAnt, anioAnt, ['4']),
      this.comparativoGrupo(empresaId, anioDef, p, pAnt, anioAnt, ['5', '6', '7']),
      this.resumenCxc(empresaId),
      this.resumenCxp(empresaId),
    ]);

    return {
      anio: anioDef,
      periodo: p,
      periodoMax,
      periodoAnterior: pAnt,
      etiquetaPeriodo,
      etiquetaAnterior,
      resumen: patrimonial.resumen,
      resultados: patrimonial.resultados,
      nivel2,
      ingresos,
      gastos,
      cxc,
      cxp,
    };
  }

  /**
   * W1 — Pastel patrimonial: saldos finales del mes por segmento 1/2/3 (solo hojas).
   * W1b — Resultados del período: segmentos 4 (ingresos), 5 (gastos),
   *       6 (costos de ventas) y 7 (costos de producción) se devuelven APARTE
   *       del pastel, por decisión del usuario (05/10/2026): el pastel queda con
   *       Activos/Pasivos/Capital "juntos" y los resultados en su propio widget.
   *       — Tras la reestructuración del plan de cuentas (05/10/2026) los costos
   *         se movieron del grupo 5 al grupo 6/7 → deben entrar en la utilidad.
   *
   * Invariante (libros cuadrados): suma(1+2+3) === utilidad, porque la suma de los
   * 7 segmentos es 0 → la diferencia del pastel en un período abierto ES la utilidad.
   * (Grupos 8/9/10 fuera de la fórmula: hoy sin cuentas — pendiente de definición.)
   */
  private async resumenPatrimonial(empresaId: number, anio: number, col: string) {
    const filas: { seg: string; total: string }[] = await this.saldosctaRepo
      .createQueryBuilder('s')
      .select(`SUBSTRING_INDEX(s.ctacontable, '-', 1)`, 'seg')
      .addSelect(`SUM(s.${col})`, 'total') // col ∈ MESES (constante interna), sin inyección
      .where('s.empresaId = :empresaId', { empresaId })
      .andWhere('s.anio = :anio', { anio })
      .andWhere(`SUBSTRING_INDEX(s.ctacontable, '-', 1) IN ('1', '2', '3', '4', '5', '6', '7')`)
      .andWhere(
        `NOT EXISTS (SELECT 1 FROM coctacontables h WHERE h.padre = s.ctacontable AND h.empresaId = s.empresaId)`,
      )
      .groupBy('seg')
      .getRawMany();

    const porSeg = new Map(filas.map((f) => [f.seg, redondear(f.total)]));

    // Firmados: ingresos (4) se registran en crédito → negativo; gastos (5) y
    // costos (6/7) en débito.
    const bruto4 = porSeg.get('4') ?? 0;
    const bruto5 = porSeg.get('5') ?? 0;
    const bruto6 = porSeg.get('6') ?? 0;
    const bruto7 = porSeg.get('7') ?? 0;
    const resultado = bruto4 + bruto5 + bruto6 + bruto7;

    return {
      resumen: {
        activos: porSeg.get('1') ?? 0,
        pasivos: porSeg.get('2') ?? 0,
        capital: porSeg.get('3') ?? 0,
      },
      resultados: {
        ingresos: redondear(Math.abs(bruto4)),
        // Gastos y costos netos firmados (5 + 6 + 7)
        gastos: redondear(Math.abs(bruto5 + bruto6 + bruto7)),
        // utilidad = −(segmentos 4..7) firmado → positivo = ganancia
        utilidad: redondear(-resultado),
      },
    };
  }

  /** W2 — Barras: hojas de grupos 1/2 agregadas a sus 2 primeros segmentos. */
  private async cuentasNivel2(empresaId: number, anio: number, col: string) {
    const filas: { cta: string; total: string }[] = await this.saldosctaRepo
      .createQueryBuilder('s')
      .select(`SUBSTRING_INDEX(s.ctacontable, '-', 2)`, 'cta')
      .addSelect(`SUM(s.${col})`, 'total')
      .where('s.empresaId = :empresaId', { empresaId })
      .andWhere('s.anio = :anio', { anio })
      .andWhere(`SUBSTRING_INDEX(s.ctacontable, '-', 1) IN ('1', '2')`)
      .andWhere(
        `NOT EXISTS (SELECT 1 FROM coctacontables h WHERE h.padre = s.ctacontable AND h.empresaId = s.empresaId)`,
      )
      .groupBy('cta')
      .getRawMany();

    const saldos = new Map(filas.map((f) => [f.cta, redondear(f.total)]));

    // Catálogo de nivel 2 → siempre devolver TODAS las cuentas (aunque estén en 0)
    // para que las barras mantengan las 6 categorías comparables entre períodos.
    const cat = await this.ctacontablesRepo.find({ where: { empresaId, nivel: 2 } });
    return cat
      .filter((c) => c.ctacontable.startsWith('1-') || c.ctacontable.startsWith('2-'))
      .map((c) => ({
        ctacontable: c.ctacontable,
        descripcion: c.descripcion ?? '',
        grupo: c.ctacontable.startsWith('1') ? 'Activos' : 'Pasivos',
        valor: saldos.get(c.ctacontable) ?? 0,
      }))
      .sort((a, b) => a.ctacontable.localeCompare(b.ctacontable));
  }

  /**
   * W3/W4 — Comparativo por cuenta: mes seleccionado vs mes anterior
   * (del año anterior si el mes es enero).
   * `segmentos`: ['4'] = Ingresos; ['5','6','7'] = Gastos y Costos
   * (tras la reestructuración 05/10/2026 los costos viven en los grupos 6/7).
   */
  private async comparativoGrupo(
    empresaId: number,
    anio: number,
    p: number,
    pAnt: number,
    anioAnt: number,
    segmentos: string[],
  ) {
    const filas: Array<{
      ctacontable: string;
      descripcion: string | null;
      debActual: string;
      credActual: string;
      debAnterior: string;
      credAnterior: string;
    }> = await this.copdadetRepo
      .createQueryBuilder('a')
      .select('a.ctacontable', 'ctacontable')
      .addSelect('MAX(c.descripcion)', 'descripcion')
      .addSelect(`SUM(CASE WHEN a.periodo = :p THEN a.debito ELSE 0 END)`, 'debActual')
      .addSelect(`SUM(CASE WHEN a.periodo = :p THEN a.credito ELSE 0 END)`, 'credActual')
      .addSelect(
        `SUM(CASE WHEN a.periodo = :pAnt AND a.anio = :anioAnt THEN a.debito ELSE 0 END)`,
        'debAnterior',
      )
      .addSelect(
        `SUM(CASE WHEN a.periodo = :pAnt AND a.anio = :anioAnt THEN a.credito ELSE 0 END)`,
        'credAnterior',
      )
      .leftJoin(Coctacontables, 'c', 'c.ctacontable = a.ctacontable AND c.empresaId = a.empresaId')
      .where('a.empresaId = :empresaId', { empresaId })
      .andWhere('a.anio = :anio', { anio })
      .andWhere(`a.sn_contabilizada = 'S'`)
      .andWhere('a.periodo IS NOT NULL')
      .andWhere(`SUBSTRING_INDEX(a.ctacontable, '-', 1) IN (:...segmentos)`, { segmentos })
      .setParameters({ p, pAnt, anioAnt })
      .groupBy('a.ctacontable')
      .getRawMany();

    const esIngresos = segmentos.includes('4');
    return filas
      .map((f) => {
        const debA = Number(f.debActual) || 0;
        const credA = Number(f.credActual) || 0;
        const debB = Number(f.debAnterior) || 0;
        const credB = Number(f.credAnterior) || 0;
        const actual = esIngresos ? credA - debA : debA - credA;
        const anterior = esIngresos ? credB - debB : debB - credB;
        return {
          ctacontable: f.ctacontable,
          descripcion: f.descripcion ?? '',
          actual: redondear(actual),
          anterior: redondear(anterior),
        };
      })
      .filter((i) => i.actual !== 0 || i.anterior !== 0)
      .sort((a, b) => a.ctacontable.localeCompare(b.ctacontable));
  }

  /** W5 — CxC: facturado (D) vs recuperado (HABER/C) + pendientes. */
  private async resumenCxc(empresaId: number) {
    const totales = await this.cxcMovRepo
      .createQueryBuilder('m')
      .select(`COALESCE(SUM(CASE WHEN m.tipomov = 'D' THEN m.importe ELSE 0 END), 0)`, 'facturado')
      .addSelect(`COALESCE(SUM(CASE WHEN m.tipomov = 'C' THEN m.importe ELSE 0 END), 0)`, 'recuperado')
      .where('m.empresaId = :empresaId', { empresaId })
      .andWhere(`m.sn_doc_anulado = 'N'`)
      .getRawOne();

    // Documentos con saldo pendiente (D − C > 0 agrupado por referencia).
    const docs: Array<{ docs: string; saldo: string }> = await this.cxcMovRepo.query(
      `SELECT COUNT(*) AS docs, COALESCE(SUM(t.saldo), 0) AS saldo
         FROM (SELECT nroreferencia,
                      SUM(CASE WHEN tipomov = 'D' THEN importe ELSE -importe END) AS saldo
                 FROM cxcmovimientos
                WHERE empresaId = ? AND sn_doc_anulado = 'N'
                GROUP BY nroreferencia
               HAVING saldo > 0.005) t`,
      [empresaId],
    );

    // Clientes con saldo pendiente (agrupado por cliente + referencia).
    const clientes: Array<{ n: string }> = await this.cxcMovRepo.query(
      `SELECT COUNT(DISTINCT clienteId) AS n
         FROM (SELECT clienteId, nroreferencia,
                      SUM(CASE WHEN tipomov = 'D' THEN importe ELSE -importe END) AS saldo
                 FROM cxcmovimientos
                WHERE empresaId = ? AND sn_doc_anulado = 'N'
                GROUP BY clienteId, nroreferencia
               HAVING saldo > 0.005) t`,
      [empresaId],
    );

    const facturado = redondear(totales?.facturado);
    const recuperado = redondear(totales?.recuperado);
    return {
      facturado,
      recuperado,
      saldo: redondear(facturado - recuperado),
      docsPendientes: Number(docs?.[0]?.docs) || 0,
      docsPendientesSaldo: redondear(docs?.[0]?.saldo),
      clientesConSaldo: Number(clientes?.[0]?.n) || 0,
    };
  }

  /** W6 — CxP: debitado (D) vs pagado (HABER/C) + docs con saldo + compras sin pagar. */
  private async resumenCxp(empresaId: number) {
    const totales = await this.cxpMovRepo
      .createQueryBuilder('m')
      .select(`COALESCE(SUM(CASE WHEN m.tipomov = 'D' THEN m.importe ELSE 0 END), 0)`, 'debitado')
      .addSelect(`COALESCE(SUM(CASE WHEN m.tipomov = 'C' THEN m.importe ELSE 0 END), 0)`, 'pagado')
      .where('m.empresaId = :empresaId', { empresaId })
      .andWhere(`m.sn_doc_anulado = 'N'`)
      .getRawOne();

    const docs: Array<{ docs: string; saldo: string }> = await this.cxpMovRepo.query(
      `SELECT COUNT(*) AS docs, COALESCE(SUM(t.saldo), 0) AS saldo
         FROM (SELECT nroreferencia,
                      SUM(CASE WHEN tipomov = 'D' THEN importe ELSE -importe END) AS saldo
                 FROM cxpmovimientos
                WHERE empresaId = ? AND sn_doc_anulado = 'N'
                GROUP BY nroreferencia
               HAVING saldo > 0.005) t`,
      [empresaId],
    );

    const compras = await this.cxpCompraRepo
      .createQueryBuilder('c')
      .select('COUNT(*)', 'n')
      .addSelect('COALESCE(SUM(c.total), 0)', 'total')
      .where('c.empresaId = :empresaId', { empresaId })
      .andWhere(`c.sn_pagada = 'N'`)
      .andWhere(`c.sn_anulada = 'N'`)
      .getRawOne();

    const debitado = redondear(totales?.debitado);
    const pagado = redondear(totales?.pagado);
    return {
      debitado,
      pagado,
      saldo: redondear(debitado - pagado),
      docsPendientes: Number(docs?.[0]?.docs) || 0,
      docsPendientesSaldo: redondear(docs?.[0]?.saldo),
      comprasPendientes: Number(compras?.n) || 0,
      comprasPendientesTotal: redondear(compras?.total),
    };
  }
}
