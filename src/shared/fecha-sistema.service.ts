import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tempresas } from '../modules/companies/entities/empresa.entity';

/** Estado de la Fecha del Sistema del ERP frente a la del servidor (MySQL). */
export interface EstadoFechaSistema {
  /** `tempresas.fechasistema` en `YYYY-MM-DD`, o `null` si la empresa no existe. */
  fechaSistema: string | null;
  /** `CURDATE()` de MySQL en `YYYY-MM-DD`. */
  fechaServidor: string;
  /** `true` cuando ambas fechas (solo día) son iguales. */
  coincide: boolean;
}

/**
 * Tablas donde la regla de negocio de fechas (reglas 1 y 4) gobierna
 * `fecharegistro`: el backend SIEMPRE impone la fecha — snapshot
 * `tfecma.fechasistema` si el usuario tiene rango vigente, o
 * `tempresas.fechasistema` en caso contrario — y jamás el reloj del
 * servidor ni el valor enviado en el body.
 *
 * Lista aprobada por el usuario (06/10/2026). NO agregar tablas sin aprobación.
 */
export const TABLAS_FECHAREGISTRO: ReadonlySet<string> = new Set([
  'bcosccdet', 'bcosccmae', 'bcosmovimientos',
  'copdadet', 'copdamae',
  'cxccajamae', 'cxcclientes', 'cxcmovimientos', 'cxcparientes', 'cxcprestamos', 'cxcsalfav',
  'cxpcomprasdet', 'cxpcomprasmae', 'cxpmovimientos', 'cxpsalfav',
  'invfisdet', 'invfismae', 'invkardex', 'invmovdet', 'invmovmae',
  'invreqdet', 'invreqmae', 'invtrasdet', 'invtrasmae',
  'pleasistencia', 'plepladet', 'pleplamae', 'plplempleados',
  'poscotdet', 'poscotmae', 'posfaccaja', 'posfacdet', 'posfacdetanul',
  'posfacmae', 'posfacmaeanul', 'posfacmov', 'pospeddet', 'pospedmae',
  'proveedor', 'trasaviblidad', 'ttipofactordecambios',
]);

/** Rango de vigencia ACTIVO de un usuario en `tfecdet` (con `sn_permitido = 'S'`). */
export interface RangoActivo {
  tfecmaId: number;
  /** `tfecma.fechasistema` (snapshot de la Fecha del Sistema al autorizar). */
  fechasistema: string;
  /** `YYYY-MM-DD` inicio de vigencia. */
  desde: string;
  /** `YYYY-MM-DD` fin de vigencia. */
  hasta: string;
}

@Injectable()
export class FechaSistemaService {
  constructor(
    @InjectRepository(Tempresas) private readonly empresaRepo: Repository<Tempresas>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Primera empresa del catálogo (empresaId ASC) — fallback para canales
   * PÚBLICOS sin sesión (tienda online: catálogo y carrito de visitantes).
   * El visitante no tiene `empresaId` de usuario, pero las operaciones del
   * carrito lo exigen a nivel de columna.
   */
  async empresaDefault(): Promise<number> {
    const emp = await this.empresaRepo.findOne({
      where: {} as never,
      order: { empresaId: 'ASC' } as never,
    });
    if (!emp) throw new BadRequestException('Sin empresa configurada en el sistema');
    return Number(emp.empresaId);
  }

  /**
   * Obtiene la fecha del sistema desde tempresas.fechasistema.
   * Si no existe la empresa o no tiene fechasistema, usa new Date() como fallback.
   */
  async getFecha(empresaId: number): Promise<Date> {
    const empresa = await this.empresaRepo.findOne({ where: { empresaId } as any });
    return empresa?.fechasistema ? new Date(empresa.fechasistema) : new Date();
  }

  /**
   * Valor a grabar en `fecharegistro` para cualquier tabla de `TABLAS_FECHAREGISTRO`.
   *
   * - **Regla 1**: usuario con rango vigente en `tfecdet` → snapshot
   *   `tfecma.fechasistema` (fecha fija del rango; NO elige el cliente y
   *   NO es el rango [desde, hasta]).
   * - **Regla 4**: usuario normal/no autorizado → `tempresas.fechasistema`.
   * - Nunca usa el reloj del servidor y nunca acepta `fecharegistro` del body.
   */
  async obtenerFechaRegistro(usuario: string | undefined, empresaId: number): Promise<Date> {
    const rango = await this.getRangoActivo(usuario, empresaId);
    if (rango) return this.fechaLocal(rango.fechasistema);
    return this.getFecha(empresaId);
  }

  /** `YYYY-MM-DD` → Date a medianoche LOCAL (evita el corrimiento de `new Date(iso)` = UTC). */
  private fechaLocal(iso: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if (!m) return new Date(iso);
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  /**
   * Compara `tempresas.fechasistema` con `CURDATE()` de MySQL.
   *
   * Se usan `DATE_FORMAT`/`CURDATE()` para recibir **strings `YYYY-MM-DD`** y
   * evitar cualquier corrimiento de día por zona horaria en mysql2.
   */
  async getEstado(empresaId: number): Promise<EstadoFechaSistema> {
    const filas: { fechaSistema: string | null; fechaServidor: string }[] =
      await this.dataSource.query(
        `SELECT DATE_FORMAT(fechasistema, '%Y-%m-%d') AS fechaSistema,
                DATE_FORMAT(CURDATE(), '%Y-%m-%d')          AS fechaServidor
           FROM tempresas
          WHERE empresaId = ?`,
        [empresaId],
      );

    if (!filas.length) {
      // Sin registro de empresa no hay fecha que comparar: se considera desalineada.
      const servidor = await this.dataSource.query<[{}]>(
        `SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS fechaServidor`,
      );
      const fechaServidor = (servidor[0] as any)?.fechaServidor ?? '';
      return { fechaSistema: null, fechaServidor, coincide: false };
    }

    const { fechaSistema, fechaServidor } = filas[0];
    return { fechaSistema, fechaServidor, coincide: !!fechaSistema && fechaSistema === fechaServidor };
  }

  /**
   * Rango de vigencia ACTIVO del usuario en `tfecdet`, o `null`.
   *
   * Regla aprobada: `fec_vig_desde ≤ CURDATE() ≤ fec_vig_hasta`, con
   * `sn_permitido = 'S'` y `empresaId` coincidente. `hoy` es la fecha del
   * servidor (`CURDATE()`); **concluida la vigencia** deja de devolver el
   * rango y el control de la fecha vuelve a `tempresas.fechasistema`.
   */
  async getRangoActivo(usuario: string | undefined, empresaId: number): Promise<RangoActivo | null> {
    if (!usuario || !empresaId) return null;
    try {
      const filas = await this.dataSource.query(
        `SELECT m.tfecmaId,
                DATE_FORMAT(m.fechasistema, '%Y-%m-%d') AS fechasistema,
                DATE_FORMAT(m.fec_vig_desde, '%Y-%m-%d') AS desde,
                DATE_FORMAT(m.fec_vig_hasta, '%Y-%m-%d') AS hasta
           FROM tfecdet d
           INNER JOIN tfecma m ON m.tfecmaId = d.fecmaeId
          WHERE d.empresaId = ?
            AND d.usuario = ?
            AND d.sn_permitido = 'S'
            AND CURDATE() >= DATE(m.fec_vig_desde)
            AND CURDATE() <= DATE(m.fec_vig_hasta)
          LIMIT 1`,
        [empresaId, usuario],
      );
      return filas.length ? (filas[0] as RangoActivo) : null;
    } catch {
      return null;
    }
  }

  /** ¿El usuario está habilitado en `tfecdet` dentro de un rango VIGENTE? */
  async esExceptado(usuario: string | undefined, empresaId: number): Promise<boolean> {
    return (await this.getRangoActivo(usuario, empresaId)) !== null;
  }

  /**
   * VALIDACIÓN ESPECIAL para usuarios con rango vigente en `tfecdet`:
   * **ninguna fecha enviada en la escritura puede estar fuera de [desde, hasta]**.
   *
   * Recorre el `body` de la petición (incluidos arreglos anidados, p. ej.
   * `detalles[]`) y revisa todo campo de **fecha de documento**
   * (`fecha`, `fechadoc`, `fechacontabilizacion`, …),
   * con estas EXCLUSIONES:
   * - `fecharegistro`: ya NO lo controla el cliente. El backend lo impone con
   *   `obtenerFechaRegistro()` (snapshot `tfecma.fechasistema` con rango
   *   vigente, o `tempresas.fechasistema` sin él) → validar el valor del
   *   body solo produciría falsos rechazos de un campo que se ignora.
   * - `fechaCreated` / `fechaUpdated` / `fechaUpdate`: las setea el backend.
   * - `fechaNacimiento`: dato histórico de personas, nunca es fecha de documento.
   * - `fechaVencimiento` / `fechaVenc`: proyección futura (crédito); lo
   *   relevante para el período es la fecha del documento, no su vencimiento.
   *
   * Lanza `400` con `code: 'FECHA_FUERA_DE_RANGO'`.
   */
  validarFechasDentroDelRango(rango: RangoActivo, body: unknown): void {
    if (!body || typeof body !== 'object') return;

    const problemas: string[] = [];
    this.recorrerFechas(body as Record<string, unknown>, rango, problemas, '');

    if (problemas.length) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'FECHA_FUERA_DE_RANGO',
        message:
          `Fecha fuera del rango autorizado (${this.fmt(rango.desde)} - ${this.fmt(rango.hasta)}): ` +
          problemas.join('; ') +
          '. Con un rango vigente en tfecdet solo se permite registrar fechas dentro de dicho rango.',
      });
    }
  }

  /** Recorrido recursivo del body juntando campos de fecha fuera del rango. */
  private recorrerFechas(
    obj: Record<string, unknown>,
    rango: RangoActivo,
    problemas: string[],
    prefijo: string,
  ): void {
    for (const [clave, valor] of Object.entries(obj)) {
      const ruta = prefijo ? `${prefijo}.${clave}` : clave;

      if (valor && typeof valor === 'object' && !(valor instanceof Date)) {
        this.recorrerFechas(valor as Record<string, unknown>, rango, problemas, ruta);
        continue;
      }

      if (!this.esCampoFechaCliente(clave)) continue;

      const dia = this.extraerDia(valor);
      if (!dia) continue; // vacío o formato no fecha: lo valida el DTO

      if (dia < rango.desde || dia > rango.hasta) {
        problemas.push(`"${ruta}" = ${this.fmt(dia)}`);
      }
    }
  }

  /**
   * ¿La clave es una fecha de documento que envía el cliente?
   * Excluye: `fecharegistro` (lo impone el backend), lo que setea el backend
   * (created/updated), fecha de nacimiento (histórica) y fecha de vencimiento
   * (proyección futura del crédito).
   */
  private esCampoFechaCliente(clave: string): boolean {
    return (
      /^fecha/i.test(clave) &&
      !/^fecha(created|updated|update|nacimiento|vencimiento|venc|registro)$/i.test(clave)
    );
  }

  /** Extrae `YYYY-MM-DD` de un string/Date; `null` si no es reconocible. */
  private extraerDia(valor: unknown): string | null {
    if (valor instanceof Date) return isNaN(valor.getTime()) ? null : valor.toISOString().slice(0, 10);
    if (typeof valor !== 'string') return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor.trim());
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
  }

  /**
   * Bloquea la operación si la Fecha del Sistema del ERP no coincide con la
   * del servidor, salvo que el usuario esté exceptuado por un rango vigente
   * en `tfecdet`.
   *
   * Lanza `409 Conflict` con `code: 'FECHA_SISTEMA'` para que el frontend
   * pueda mostrar el mensaje específico.
   */
  async exigirFechaVigente(usuario: string | undefined, empresaId: number): Promise<void> {
    const estado = await this.getEstado(empresaId);
    if (estado.coincide) return;
    if (await this.esExceptado(usuario, empresaId)) return;

    const erp = estado.fechaSistema ? this.fmt(estado.fechaSistema) : 'sin registro';
    const srv = estado.fechaServidor ? this.fmt(estado.fechaServidor) : 'desconocida';

    throw new ConflictException({
      statusCode: 409,
      code: 'FECHA_SISTEMA',
      message:
        `La Fecha del Sistema del ERP (${erp}) no coincide con la Fecha del Servidor (${srv}). ` +
        'Por seguridad, todas las operaciones están bloqueadas. ' +
        'Un supervisor, administrador o contador debe actualizar la Fecha del Sistema ' +
        '(Configuración › Fechas) para continuar.',
    });
  }

  /** `dd/mm/aaaa` a partir de un string `YYYY-MM-DD` (sin `new Date()`). */
  private fmt(iso: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
  }
}
