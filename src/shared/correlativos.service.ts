import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { TipoParametro } from '../modules/parametros/entities/tipo-parametro.entity';
import { Tusuarios } from '../modules/users/entities/usuario.entity';

/**
 * Control de correlativos del ERP — fuente única de verdad.
 *
 * Patrón OBLIGATORIO para todo correlativo autoincremental:
 *  - Tabla: `ttipoparametros` (grupo='CORRELATIVO'), contador en la columna `valor`.
 *  - Localización: `field` + `empresaId` + `Idsucursal` (el Idsucursal se resuelve
 *    desde el usuario logueado en `tusuarios`).
 *  - Incremento ATÓMICO en la misma conexión:
 *      UPDATE ... SET valor = LAST_INSERT_ID(CAST(valor AS UNSIGNED) + 1) ...
 *      SELECT LAST_INSERT_ID()
 *    (no hay race condition: el read-modify-write de dos pasos está prohibido).
 *  - Si no existe la fila del parámetro → 400 (nunca se INSERTA aquí: crear filas
 *    en ttipoparametros requiere autorización explícita del usuario).
 */
@Injectable()
export class CorrelativosService {
  constructor(
    @InjectRepository(TipoParametro) private readonly tipoParametroRepo: Repository<TipoParametro>,
    @InjectRepository(Tusuarios) private readonly usuariosRepo: Repository<Tusuarios>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Devuelve el SIGUIENTE número del correlativo `field` e incrementa `valor`
   * de forma atómica. Idsucursal = sucursal del usuario logueado.
   *
   * @param qr QueryRunner opcional: si se pasa (flujos transaccionales como
   *           Bancos), el UPDATE corre en ESE runner — si la transacción hace
   *           rollback, el incremento también se revierte.
   */
  async siguiente(field: string, empresaId: number, usuario: string, qr?: QueryRunner): Promise<number> {
    const runner = qr ?? this.dataSource.createQueryRunner();
    const propio = !qr;
    if (propio) await runner.connect();
    try {
      const user = await this.usuariosRepo.findOne({ where: { usuario, empresaId } as any });
      const idsucursal = user?.Idsucursal ?? 0;

      const res: any = await runner.query(
        `UPDATE ttipoparametros
            SET valor = LAST_INSERT_ID(CAST(valor AS UNSIGNED) + 1)
          WHERE field = ? AND empresaId = ? AND Idsucursal = ? AND sn_activo = 'S'`,
        [field, empresaId, idsucursal],
      );
      if (!res?.affectedRows) {
        throw new BadRequestException(
          `No existe parámetro de correlativo '${field}' en ttipoparametros para empresaId ${empresaId} / sucursal ${idsucursal}`,
        );
      }
      const rows: any = await runner.query('SELECT LAST_INSERT_ID() AS nro');
      return Number(rows?.[0]?.nro ?? 0);
    } finally {
      if (propio) await runner.release();
    }
  }

  /**
   * Igual que `siguiente()` pero como string con ceros a la izquierda
   * (columnas varchar: nrocliente, nroempleado, nroplanilla, nroproveedor, nrochq…).
   */
  async siguienteString(field: string, empresaId: number, usuario: string, pad = 6, qr?: QueryRunner): Promise<string> {
    const nro = await this.siguiente(field, empresaId, usuario, qr);
    return String(nro).padStart(pad, '0');
  }

  /**
   * Crea la fila del parámetro si NO existe (empresas nuevas). Solo para los
   * correlativos que ya tenían esta tolerancia (ej: nrochq en Bancos) — no usar
   * para nuevos controles sin autorización.
   */
  async asegurar(field: string, empresaId: number, usuario: string, valorInicial = '0', qr?: QueryRunner): Promise<void> {
    const runner = qr ?? this.dataSource.createQueryRunner();
    const propio = !qr;
    if (propio) await runner.connect();
    try {
      const user = await this.usuariosRepo.findOne({ where: { usuario, empresaId } as any });
      const idsucursal = user?.Idsucursal ?? 0;
      const existe = await runner.query(
        'SELECT ttipoparametrosId FROM ttipoparametros WHERE field = ? AND empresaId = ? AND sn_activo = ? LIMIT 1',
        [field, empresaId, 'S'],
      );
      if (existe?.length) return;
      await runner.query(
        `INSERT INTO ttipoparametros (empresaId, Idsucursal, grupo, field, tipo, valor, moduloId, usuarioCreated)
         VALUES (?, ?, 'CORRELATIVO', ?, 'NUMBER', ?, 7, ?)`,
        [empresaId, idsucursal, field, valorInicial, usuario],
      );
    } finally {
      if (propio) await runner.release();
    }
  }
}
