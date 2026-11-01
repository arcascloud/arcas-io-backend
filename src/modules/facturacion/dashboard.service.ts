import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { TPosFacMae } from './entities/posfacmae.entity';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TinvCategoria } from '../inventario/entities/categoria.entity';
import { Tsucursal } from '../sucursales/entities/sucursal.entity';

/**
 * Opciones de filtrado del dashboard de ventas.
 * Todos opcionales: sin parámetros muestra la vista consolidada del año actual.
 */
export interface DashboardVentasFiltros {
  anio?: number;
  mes?: number;
  sucursalId?: number;
  categoriaId?: number;
}

const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

/**
 * Dashboard de Facturación (KPIs de ventas) — endpoint `GET /facturacion/dashboard`.
 *
 * 7 widgets:
 *  A. Ventas al Contado vs. Crédito (doughnut + 2 tarjetas KPI)
 *  B. Ventas por Vendedor (barras horizontales + ticket promedio; meta = null: no existe tabla de metas)
 *  C. Ventas por Meses — últimos 12 meses con MoM y YoY (columnas + línea acumulada)
 *  D. Facturas Vencidas / Antigüedad de Saldos (AR Aging) + DSO
 *  E. Utilidad Bruta (ventas − COGS) y margen % por categoría
 *  F. Top 25 productos más vendidos (con Pareto acumulado)
 *  G. Bottom 25 productos (baja rotación / "dormidos")
 *
 * Reglas:
 *  - COGS = `productos.cstounit` (patrón de contabilidad-logica). NUNCA invkardex/invexistencias
 *    porque en salidas por venta guardan el precio de venta, no el costo.
 *  - Fecha de referencia = `tempresas.fechasistema` (FechaSistemaService), jamás new Date().
 *  - Facturas anuladas (`sn_anulada='S'`) fuera de todo cálculo.
 *  - Aging/cartera se calcula SIEMPRE sobre el estado actual (hoy del ERP), sin filtro de año/mes:
 *    es "cuánto se me debe hoy", no una foto histórica.
 */
@Injectable()
export class FacturacionDashboardService {
  constructor(
    @InjectRepository(TPosFacMae) private readonly facRepo: Repository<TPosFacMae>,
    @InjectRepository(Tproducto) private readonly prodRepo: Repository<Tproducto>,
    @InjectRepository(TinvCategoria) private readonly catRepo: Repository<TinvCategoria>,
    @InjectRepository(Tsucursal) private readonly sucRepo: Repository<Tsucursal>,
    private readonly fechaSistema: FechaSistemaService,
  ) {}

  async getDashboard(empresaId: number, f: DashboardVentasFiltros = {}) {
    const { anio, mes, sucursalId, categoriaId } = f;

    if (mes != null && (mes < 1 || mes > 12 || !Number.isInteger(mes))) {
      throw new BadRequestException('mes debe estar entre 1 y 12');
    }

    const hoy = await this.fechaSistema.getFecha(empresaId);
    const refAnio = anio ?? hoy.getFullYear();
    const refMes = mes ?? (anio == null || anio === hoy.getFullYear() ? hoy.getMonth() + 1 : 12);

    const ff = this.filtrosFactura(anio, mes, sucursalId);

    const [
      resumen,
      categoriaMargen,
      vendedores,
      serie,
      aging,
      dso,
      topProductos,
      bottomProductos,
      anios,
      sucursales,
      categorias,
      ventasActual,
      ventasAnterior,
      ventasAnioAnterior,
    ] = await Promise.all([
      this.resumen(empresaId, ff),
      this.margenPorCategoria(empresaId, ff, categoriaId),
      this.vendedores(empresaId, ff),
      this.serieMensual(empresaId, ff, refAnio, refMes, sucursalId),
      this.antiguedad(empresaId, sucursalId, hoy),
      this.dsoCobro(empresaId, sucursalId),
      this.productos(empresaId, ff, categoriaId, 'DESC'),
      this.productos(empresaId, ff, categoriaId, 'ASC'),
      this.aniosDisponibles(empresaId),
      this.sucursales(empresaId),
      this.categorias(empresaId),
      this.ventasMes(empresaId, refAnio, refMes, sucursalId),
      this.ventasMes(empresaId, refMes === 1 ? refAnio - 1 : refAnio, refMes === 1 ? 12 : refMes - 1, sucursalId),
      this.ventasMes(empresaId, refAnio - 1, refMes, sucursalId),
    ]);

    const cogs = this.red(
      categoriaMargen.reduce((s, c) => s + (Number(c.cogs) || 0), 0),
    );
    const utilidadBruta = this.red(resumen.ventasTotales - cogs);
    const margenBruto = resumen.ventasTotales > 0
      ? this.red((utilidadBruta / resumen.ventasTotales) * 100)
      : null;

    for (const v of vendedores) {
      v.pctParticipacion = resumen.ventasTotales > 0
        ? this.red((v.ventas / resumen.ventasTotales) * 100)
        : 0;
    }

    return {
      referencia: {
        anio: refAnio,
        mes: refMes,
        fecha: hoy,
        etiquetaMes: `${MESES_CORTOS[refMes - 1]} ${refAnio}`,
        etiquetaVentana: `12 meses hasta ${MESES_CORTOS[refMes - 1]} ${refAnio}`,
      },
      resumen: {
        ...resumen,
        cogs,
        utilidadBruta,
        margenBruto,
        pctContado: resumen.ventasTotales > 0 ? this.red((resumen.contado / resumen.ventasTotales) * 100) : 0,
        pctCredito: resumen.ventasTotales > 0 ? this.red((resumen.credito / resumen.ventasTotales) * 100) : 0,
        ticketPromedio: resumen.numFacturas > 0 ? this.red(resumen.ventasTotales / resumen.numFacturas) : 0,
      },
      // A
      contadoCredito: {
        contado: resumen.contado,
        credito: resumen.credito,
        numContado: resumen.numContado,
        numCredito: resumen.numCredito,
        pctContado: resumen.ventasTotales > 0 ? this.red((resumen.contado / resumen.ventasTotales) * 100) : 0,
        pctCredito: resumen.ventasTotales > 0 ? this.red((resumen.credito / resumen.ventasTotales) * 100) : 0,
        netoCredito: this.red(resumen.credito - resumen.descuento),
      },
      // B
      vendedores,
      // C
      meses: serie,
      comparativo: {
        actual: ventasActual,
        anterior: ventasAnterior,
        mismoMesAnioAnterior: ventasAnioAnterior,
        mom: ventasAnterior > 0 ? this.red(((ventasActual - ventasAnterior) / ventasAnterior) * 100) : null,
        yoy: ventasAnioAnterior > 0 ? this.red(((ventasActual - ventasAnioAnterior) / ventasAnioAnterior) * 100) : null,
      },
      // D
      aging,
      dso,
      // E
      categoriaMargen,
      // F/G
      topProductos,
      bottomProductos,
      // Filtros disponibles
      opciones: { anios, sucursales, categorias },
      filtros: { anio: anio ?? null, mes: mes ?? null, sucursalId: sucursalId ?? null, categoriaId: categoriaId ?? null },
    };
  }

  // ===================== Fragmentos SQL =====================

  /** Cláusulas AND comunes (alias `f` = posfacmae) para filtrar facturas emitidas. */
  private filtrosFactura(anio?: number, mes?: number, sucursalId?: number): { sql: string; params: any[] } {
    let sql = `AND f.sn_anulada = 'N'`;
    const params: any[] = [];
    if (anio != null) { sql += ' AND YEAR(f.fecharegistro) = ?'; params.push(anio); }
    if (mes != null) { sql += ' AND MONTH(f.fecharegistro) = ?'; params.push(mes); }
    if (sucursalId != null) { sql += ' AND f.Idsucursal = ?'; params.push(sucursalId); }
    return { sql, params };
  }

  private red(n: any): number {
    const v = Number(n);
    return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
  }

  // ===================== Widgets =====================

  /** KPIs generales del período filtrado. */
  private async resumen(empresaId: number, ff: { sql: string; params: any[] }) {
    const rows = await this.facRepo.query(
      `SELECT COUNT(*) numFacturas,
              COALESCE(SUM(CASE WHEN f.tipofactura = 'E' THEN 1 ELSE 0 END), 0) numContado,
              COALESCE(SUM(CASE WHEN f.tipofactura = 'C' THEN 1 ELSE 0 END), 0) numCredito,
              COALESCE(SUM(f.total), 0) ventasTotales,
              COALESCE(SUM(CASE WHEN f.tipofactura = 'E' THEN f.total ELSE 0 END), 0) contado,
              COALESCE(SUM(CASE WHEN f.tipofactura = 'C' THEN f.total ELSE 0 END), 0) credito,
              COALESCE(SUM(f.subTotal), 0) subTotal,
              COALESCE(SUM(f.impuesto), 0) impuesto,
              COALESCE(SUM(f.descuento), 0) descuento
       FROM posfacmae f
       WHERE f.empresaId = ? ${ff.sql}`,
      [empresaId, ...ff.params],
    );
    const r = rows[0] ?? {};
    return {
      numFacturas: Number(r.numFacturas) || 0,
      numContado: Number(r.numContado) || 0,
      numCredito: Number(r.numCredito) || 0,
      ventasTotales: this.red(r.ventasTotales),
      contado: this.red(r.contado),
      credito: this.red(r.credito),
      subTotal: this.red(r.subTotal),
      impuesto: this.red(r.impuesto),
      descuento: this.red(r.descuento),
    };
  }

  /**
   * Widget E — utilidad bruta por categoría.
   * Ventas por línea = cantidad × precioventa − descuento (posfacdet.subTotal es inconsistente:
   * a veces incluye ISV, a veces el neto con descuento, por eso NO se usa).
   * COGS por línea = cantidad × productos.cstounit.
   */
  private async margenPorCategoria(
    empresaId: number,
    ff: { sql: string; params: any[] },
    categoriaId?: number,
  ) {
    const extraCat = categoriaId != null ? ' AND p.categoriaId = ?' : '';
    const rows = await this.facRepo.query(
      `SELECT p.categoriaId,
              COALESCE(c.descripcion, 'Sin categoría') categoria,
              COALESCE(SUM(d.cantidad * d.precioventa - d.descuento), 0) ventas,
              COALESCE(SUM(d.cantidad * COALESCE(p.cstounit, 0)), 0) cogs
       FROM posfacdet d
       JOIN posfacmae f ON f.facturaId = d.facturaId AND f.empresaId = d.empresaId
       JOIN productos p ON p.productoId = d.productoId
       LEFT JOIN tinvcategoria c ON c.categoriaId = p.categoriaId
       WHERE d.empresaId = ? AND d.sn_anulada = 'N' ${ff.sql}${extraCat}
       GROUP BY p.categoriaId, c.descripcion
       ORDER BY ventas DESC`,
      [empresaId, ...ff.params, ...(categoriaId != null ? [categoriaId] : [])],
    );
    return rows.map((r: any) => {
      const ventas = this.red(r.ventas);
      const cogs = this.red(r.cogs);
      const utilidad = this.red(ventas - cogs);
      return {
        categoriaId: Number(r.categoriaId),
        categoria: r.categoria,
        ventas,
        cogs,
        utilidad,
        margen: ventas > 0 ? this.red((utilidad / ventas) * 100) : null,
      };
    });
  }

  /**
   * Widget B — ventas por vendedor (`posfacmae.gestorId` → ttipogestores → plempleados).
   * Facturas sin `gestorId` caen en el bucket "Sin vendedor".
   * `meta` es null: en el ERP no existe tabla de metas por vendedor (solo `tplcomision` de planilla,
   * que lee `pleingresos` y no facturación) → el cumplimiento de meta no se puede calcular aún.
   */
  private async vendedores(empresaId: number, ff: { sql: string; params: any[] }) {
    const rows = await this.facRepo.query(
      `SELECT f.gestorId,
              COALESCE(CONCAT(e.nombres, ' ', e.apellidos), 'Sin vendedor') nombre,
              COALESCE(SUM(f.total), 0) ventas,
              COUNT(*) comprobantes
       FROM posfacmae f
       LEFT JOIN ttipogestores g ON g.gestorId = f.gestorId
       LEFT JOIN plempleados e ON e.empleadoId = g.empleadoId
       WHERE f.empresaId = ? ${ff.sql}
       GROUP BY f.gestorId, nombre
       ORDER BY ventas DESC`,
      [empresaId, ...ff.params],
    );
    return rows.map((r: any) => {
      const ventas = this.red(r.ventas);
      const comprobantes = Number(r.comprobantes) || 0;
      return {
        gestorId: r.gestorId != null ? Number(r.gestorId) : null,
        nombre: r.nombre,
        ventas,
        comprobantes,
        ticketPromedio: comprobantes > 0 ? this.red(ventas / comprobantes) : 0,
        meta: null,
        cumplimiento: null,
        pctParticipacion: 0, // se calcula al final con el total
      };
    });
  }

  /** Widget C — serie mensual de 12 meses terminando en (refAnio, refMes), meses vacíos en 0. */
  private async serieMensual(
    empresaId: number,
    ff: { sql: string; params: any[] },
    refAnio: number,
    refMes: number,
    sucursalId?: number,
  ) {
    const desde = `${refAnio}-${String(refMes).padStart(2, '0')}-01`;
    const hasta = refMes === 12
      ? `${refAnio + 1}-01-01`
      : `${refAnio}-${String(refMes + 1).padStart(2, '0')}-01`;
    // La ventana reemplaza el filtro de año/mes (siempre muestra 12 meses de contexto),
    // pero conserva el filtro de sucursal.
    const whereVentana = `AND f.sn_anulada = 'N'${sucursalId != null ? ' AND f.Idsucursal = ?' : ''}`;
    const params = [empresaId, desde, hasta, ...(sucursalId != null ? [sucursalId] : [])];

    const rows = await this.facRepo.query(
      `SELECT DATE_FORMAT(f.fecharegistro, '%Y-%m') ym,
              COALESCE(SUM(f.total), 0) ventas,
              COALESCE(SUM(CASE WHEN f.tipofactura = 'E' THEN f.total ELSE 0 END), 0) contado,
              COALESCE(SUM(CASE WHEN f.tipofactura = 'C' THEN f.total ELSE 0 END), 0) credito,
              COUNT(*) comprobantes
       FROM posfacmae f
       WHERE f.empresaId = ? AND f.fecharegistro >= ? AND f.fecharegistro < ? ${whereVentana}
       GROUP BY ym ORDER BY ym`,
      params,
    );

    const map = new Map<string, any>();
    for (const r of rows) map.set(String(r.ym), r);

    const salida: any[] = [];
    let acumulado = 0;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(refAnio, refMes - 1 - i, 1));
      const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const fila = map.get(ym);
      const ventas = fila ? this.red(fila.ventas) : 0;
      acumulado += ventas;
      salida.push({
        anio: d.getUTCFullYear(),
        mes: d.getUTCMonth() + 1,
        ym,
        etiqueta: `${MESES_CORTOS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`,
        ventas,
        contado: fila ? this.red(fila.contado) : 0,
        credito: fila ? this.red(fila.credito) : 0,
        comprobantes: fila ? Number(fila.comprobantes) : 0,
        acumulado: this.red(acumulado),
      });
    }
    return salida;
  }

  /** Ventas netas de un mes puntual (para MoM / YoY). */
  private async ventasMes(empresaId: number, anio: number, mes: number, sucursalId?: number): Promise<number> {
    const rows = await this.facRepo.query(
      `SELECT COALESCE(SUM(f.total), 0) ventas
       FROM posfacmae f
       WHERE f.empresaId = ? AND f.sn_anulada = 'N'
         AND YEAR(f.fecharegistro) = ? AND MONTH(f.fecharegistro) = ?
         ${sucursalId != null ? 'AND f.Idsucursal = ?' : ''}`,
      [empresaId, anio, mes, ...(sucursalId != null ? [sucursalId] : [])],
    );
    return this.red(rows[0]?.ventas);
  }

  /**
   * Widget D — Antigüedad de saldos de facturas de crédito.
   * - Saldo por factura = movimientos CxC (D − C por `nroreferencia`); si la factura no tiene
   *   movimiento registrado, se usa `total` (no pagada) o 0 (pagada).
   * - Fecha de vencimiento = `fechavencimiento` si existe, si no `fecharegistro + diascredito`
   *   (o `cxcclientes.diasplazo` como respaldo).
   * - Estado actual (hoy del ERP): sin filtro de año/mes.
   */
  private async antiguedad(empresaId: number, sucursalId: number | undefined, hoy: Date) {
    const rows = await this.facRepo.query(
      `SELECT f.facturaId, f.nrofactura, f.fecharegistro, f.fechavencimiento, f.diascredito,
              f.total, f.sn_pagada,
              COALESCE(cl.diasplazo, 0) diasplazo,
              COALESCE(m.saldo, CASE WHEN f.sn_pagada = 'S' THEN 0 ELSE f.total END) saldo
       FROM posfacmae f
       LEFT JOIN cxcclientes cl ON cl.clienteId = f.clienteId
       LEFT JOIN (
         SELECT nroreferencia,
                SUM(CASE WHEN tipomov = 'D' THEN importe WHEN tipomov = 'C' THEN -importe ELSE 0 END) saldo
         FROM cxcmovimientos
         WHERE empresaId = ? AND moduloId = 3 AND sn_doc_anulado = 'N'
         GROUP BY nroreferencia
       ) m ON m.nroreferencia = CAST(f.nrofactura AS CHAR)
       WHERE f.empresaId = ? AND f.sn_anulada = 'N' AND f.tipofactura = 'C'
         ${sucursalId != null ? 'AND f.Idsucursal = ?' : ''}`,
      [empresaId, empresaId, ...(sucursalId != null ? [sucursalId] : [])],
    );

    const rangos = [
      { key: 'porVencer', rango: 'Por vencer', dias: '≤ 0 días', desde: null, hasta: 0 },
      { key: 'vencido1a30', rango: 'Vencido 1-30', dias: '1 a 30 días', desde: 1, hasta: 30 },
      { key: 'vencido31a60', rango: 'Vencido 31-60', dias: '31 a 60 días', desde: 31, hasta: 60 },
      { key: 'vencido60', rango: 'Vencido +60', dias: 'más de 60 días', desde: 61, hasta: null },
    ];
    const acu = new Map(rangos.map((r) => [r.key, { monto: 0, documentos: 0 }]));

    let carteraTotal = 0;
    let carteraVencida = 0;
    let cobradas = 0;
    let montoCobrado = 0;

    for (const r of rows) {
      const saldo = this.red(r.saldo);
      if (saldo <= 0) {
        cobradas++;
        montoCobrado += this.red(r.total);
        continue;
      }
      const base = r.fechavencimiento
        ? new Date(r.fechavencimiento)
        : new Date(new Date(r.fecharegistro).getTime() + Number(r.diascredito || r.diasplazo || 0) * 86400000);
      const dias = Math.floor((hoy.getTime() - base.getTime()) / 86400000);
      carteraTotal += saldo;
      if (dias > 0) carteraVencida += saldo;
      const rango = dias <= 0 ? 'porVencer' : dias <= 30 ? 'vencido1a30' : dias <= 60 ? 'vencido31a60' : 'vencido60';
      const b = acu.get(rango)!;
      b.monto = this.red(b.monto + saldo);
      b.documentos++;
    }

    return {
      rangos: rangos.map((r) => ({ ...r, ...acu.get(r.key) })),
      carteraTotal: this.red(carteraTotal),
      carteraVencida: this.red(carteraVencida),
      carteraPorVencer: this.red(carteraTotal - carteraVencida),
      documentosVencidos: [...acu.values()].slice(1).reduce((s, b) => s + b.documentos, 0),
      documentosCobrados: cobradas,
      montoCobrado: this.red(montoCobrado),
      pctVencido: carteraTotal > 0 ? this.red((carteraVencida / carteraTotal) * 100) : 0,
    };
  }

  /**
   * Widget D — DSO (Days Sales Outstanding): días promedio de cobro de las facturas de crédito
   * ya pagadas (`fechaultPago − fecharegistro`). Si no hay ninguna cobrada, `null` (se muestra "—").
   * Se descartan fechas ilógicas (abono anterior a la emisión).
   */
  private async dsoCobro(empresaId: number, sucursalId?: number) {
    const rows = await this.facRepo.query(
      `SELECT AVG(DATEDIFF(f.fechaultPago, f.fecharegistro)) dias, COUNT(*) n
       FROM posfacmae f
       WHERE f.empresaId = ? AND f.sn_anulada = 'N' AND f.tipofactura = 'C'
         AND f.fechaultPago IS NOT NULL AND f.fechaultPago >= f.fecharegistro
         ${sucursalId != null ? 'AND f.Idsucursal = ?' : ''}`,
      [empresaId, ...(sucursalId != null ? [sucursalId] : [])],
    );
    const n = Number(rows[0]?.n) || 0;
    return {
      dias: n > 0 ? Math.round(Number(rows[0].dias)) : null,
      muestras: n,
      base: 'Promedio de días entre emisión y último abono (facturas de crédito cobradas)',
    };
  }

  /**
   * Widgets F y G — productos por ingresos en el período.
   * Devuelve TODOS los productos del catálogo (LEFT JOIN de ventas) para que el Bottom
   * incluya realmente los "dormidos" (ingresos = 0). Orden: DESC = Top 25, ASC = Bottom 25.
   */
  private async productos(
    empresaId: number,
    ff: { sql: string; params: any[] },
    categoriaId: number | undefined,
    orden: 'ASC' | 'DESC',
  ) {
    const extraCat = categoriaId != null ? ' AND p.categoriaId = ?' : '';
    const rows = await this.prodRepo.query(
      `SELECT p.productoId productoId, p.descripcion, p.codbarra, p.categoriaId,
              p.cstounit, p.fecUltvta,
              COALESCE(c.descripcion, 'Sin categoría') categoria,
              COALESCE(v.cantidad, 0) cantidad,
              COALESCE(v.ingresos, 0) ingresos,
              COALESCE(v.comprobantes, 0) comprobantes
       FROM productos p
       LEFT JOIN tinvcategoria c ON c.categoriaId = p.categoriaId
       LEFT JOIN (
         SELECT d.productoId,
                SUM(d.cantidad) cantidad,
                SUM(d.cantidad * d.precioventa - d.descuento) ingresos,
                COUNT(DISTINCT d.facturaId) comprobantes
         FROM posfacdet d
         JOIN posfacmae f ON f.facturaId = d.facturaId AND f.empresaId = d.empresaId
         WHERE d.empresaId = ? AND d.sn_anulada = 'N' ${ff.sql}
         GROUP BY d.productoId
       ) v ON v.productoId = p.productoId
       WHERE p.empresaId = ?${extraCat}
       ORDER BY ingresos ${orden}, cantidad ${orden}, p.descripcion ASC
       LIMIT 25`,
      [empresaId, ...ff.params, empresaId, ...(categoriaId != null ? [categoriaId] : [])],
    );
    return rows.map((r: any) => ({
      productoId: Number(r.productoId),
      codbarra: r.codbarra,
      descripcion: r.descripcion,
      categoriaId: Number(r.categoriaId),
      categoria: r.categoria,
      cantidad: Number(r.cantidad) || 0,
      ingresos: this.red(r.ingresos),
      comprobantes: Number(r.comprobantes) || 0,
      costoUnitario: this.red(r.cstounit),
      cogs: this.red((Number(r.cantidad) || 0) * (Number(r.cstounit) || 0)),
      utilidad: this.red(
        (Number(r.ingresos) || 0) - (Number(r.cantidad) || 0) * (Number(r.cstounit) || 0),
      ),
      ultimaVenta: r.fecUltvta ?? null,
      diasSinVenta: r.fecUltvta
        ? Math.max(0, Math.floor((Date.now() - new Date(r.fecUltvta).getTime()) / 86400000))
        : null,
    }));
  }

  // ===================== Opciones de filtro =====================

  private async aniosDisponibles(empresaId: number): Promise<number[]> {
    const rows = await this.facRepo.query(
      `SELECT DISTINCT YEAR(fecharegistro) anio FROM posfacmae WHERE empresaId = ? ORDER BY anio DESC`,
      [empresaId],
    );
    return rows.map((r: any) => Number(r.anio));
  }

  private async sucursales(empresaId: number) {
    const rows = await this.sucRepo.find({ where: { empresaId } as any });
    return rows.map((s: any) => ({ Idsucursal: Number(s.idsucursal), descripcion: s.descripcion }));
  }

  private async categorias(empresaId: number) {
    const rows = await this.catRepo.find({ where: { empresaId } as any, order: { descripcion: 'ASC' } as any });
    return rows.map((c: any) => ({ categoriaId: Number(c.categoriaId), descripcion: c.descripcion }));
  }
}
