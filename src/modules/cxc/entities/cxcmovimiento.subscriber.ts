import { EventSubscriber, InsertEvent } from 'typeorm';
import { CxcMovimiento } from './cxcmovimiento.entity';

/**
 * Correlativo de movimientos CxC: `ttipoparametros.field = 'cxc_nromovimiento'`.
 *
 * En TODA inserción de un movimiento (captura manual en /cxc/movimientos y
 * los generados por facturación, caja, préstamos e intereses) se asigna
 * `nromovimiento = valor + 1` y el contador persiste su avance
 * (UPDATE a ttipoparametros autorizado por el usuario el 15/10/2026).
 *
 * Se implementa como EventSubscriber (y no como @BeforeInsert en la entity)
 * porque solo los subscribers reciben el evento con `connection`.
 *
 * Atomicidad: transacción propia con lock de fila sobre la fila del
 * parámetro, así dos inserciones concurrentes serializan y jamás repiten
 * número. Si la transacción padre hace rollback, el contador avanza igual
 * (hueco en la secuencia: aceptable; duplicados: imposibles). Si la empresa
 * no tiene la fila del parámetro, se conserva el default (0) sin bloquear
 * la creación del movimiento.
 */
@EventSubscriber()
export class CxcMovimientoSubscriber {
  listenTo() {
    return CxcMovimiento;
  }

  async beforeInsert(event: InsertEvent<CxcMovimiento>): Promise<void> {
    const mov = event.entity;
    if (!mov || !mov.empresaId) return;

    const qr = event.connection.createQueryRunner();
    await qr.connect();
    await qr.startTransaction('READ COMMITTED');
    try {
      await qr.query(
        `UPDATE ttipoparametros SET valor = CAST(valor AS UNSIGNED) + 1, usuarioUpdate = ?, fechaUpdate = NOW() WHERE field = 'cxc_nromovimiento' AND empresaId = ? ORDER BY ttipoparametrosId LIMIT 1`,
        [mov.usuarioCreated || 'SYSTEM', mov.empresaId],
      );
      const rows: Array<{ valor: string }> = await qr.query(
        `SELECT valor FROM ttipoparametros WHERE field = 'cxc_nromovimiento' AND empresaId = ? ORDER BY ttipoparametrosId LIMIT 1`,
        [mov.empresaId],
      );
      if (rows?.length) mov.nromovimiento = Number(rows[0].valor);

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
}
