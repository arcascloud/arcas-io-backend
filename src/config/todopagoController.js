import pool from "../config/db.js";
import { todopagoConfig } from "../config/todopago.js";
import {
  sendAuthorizeRequest,
  getAuthorizeAnswer,
  getStatus,
} from "../services/todopago.service.js";

/**
 * POST /api/todopago/generar-link/:factura_id
 * Genera un link de pago en TodoPago para una factura.
 */
export async function generarLink(req, res, next) {
  try {
    const { factura_id } = req.params;

    const [facturas] = await pool.query(
      "SELECT f.*, a.email, a.nombre AS abonado_nombre FROM facturas f JOIN abonados a ON a.id = f.abonado_id WHERE f.id = ?",
      [factura_id],
    );
    const factura = facturas[0];
    if (!factura)
      return res.status(404).json({ error: "Factura no encontrada" });
    if (factura.estado === "pagada")
      return res.status(400).json({ error: "La factura ya está pagada" });

    const result = await sendAuthorizeRequest({
      facturaId: factura.id,
      monto: factura.total,
      emailCliente: factura.email || "",
    });

    // Guardar transacción en BD
    await pool.query(
      `INSERT INTO transacciones_pago (factura_id, operation_id, public_request_key, status, monto, raw_request)
       VALUES (?, ?, ?, 'pending', ?, ?)`,
      [
        factura.id,
        result.operationId,
        result.publicRequestKey || null,
        factura.total,
        JSON.stringify({ factura_id: factura.id, monto: factura.total }),
      ],
    );

    res.json({
      url: result.url,
      publicRequestKey: result.publicRequestKey,
      operationId: result.operationId,
      sandbox: result.sandbox || false,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/todopago/confirmar
 * Callback — TodoPago redirige aquí después del pago.
 * Body: { PublicRequestKey, AnswerKey, Order }
 */
export async function confirmarPago(req, res, next) {
  try {
    const { PublicRequestKey, AnswerKey, Order } = req.body;

    if (!PublicRequestKey || !AnswerKey) {
      return res
        .status(400)
        .json({ error: "PublicRequestKey y AnswerKey son requeridos" });
    }

    // Buscar la transacción
    const [transacciones] = await pool.query(
      "SELECT * FROM transacciones_pago WHERE public_request_key = ? OR operation_id = ? LIMIT 1",
      [PublicRequestKey, Order],
    );
    const transaccion = transacciones[0];
    if (!transaccion)
      return res.status(404).json({ error: "Transacción no encontrada" });

    // Confirmar con TodoPago
    const result = await getAuthorizeAnswer({
      publicRequestKey: PublicRequestKey,
      answerKey: AnswerKey,
    });

    // Actualizar transacción
    await pool.query(
      `UPDATE transacciones_pago
       SET status = ?, fecha_confirmacion = NOW(), raw_response = ?
       WHERE id = ?`,
      [result.status, JSON.stringify(result), transaccion.id],
    );

    if (result.status === "completed") {
      // Marcar factura como pagada
      await pool.query("UPDATE facturas SET estado = ? WHERE id = ?", [
        "pagada",
        transaccion.factura_id,
      ]);

      // Crear registro de pago automático
      await pool.query(
        `INSERT INTO pagos (factura_id, abonado_id, monto, fecha_pago, metodo, cajero_id, concepto, comprobante)
         SELECT ?, f.abonado_id, ?, CURDATE(), 'tarjeta', NULL, 'Pago online TodoPago', ?
         FROM facturas f WHERE f.id = ?`,
        [
          transaccion.factura_id,
          transaccion.monto,
          `TP-${transaccion.operation_id}`,
          transaccion.factura_id,
        ],
      );

      // Registrar en caja
      await pool.query(
        `INSERT INTO caja (tipo, concepto, monto, fecha, factura_id)
         SELECT 'ingreso', CONCAT('Pago online TP #', ?), ?, CURDATE(), ?
         FROM facturas f WHERE f.id = ?`,
        [
          transaccion.id,
          transaccion.monto,
          transaccion.factura_id,
          transaccion.factura_id,
        ],
      );
    }

    res.json({ status: result.status, transactionId: transaccion.id });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/todopago/webhook
 * Webhook para que TodoPago notifique cambios de estado (si aplica).
 */
export async function webhook(req, res, next) {
  try {
    const event = req.body;
    if (!event || !event.OPERATIONID) {
      return res.status(400).json({ error: "Evento inválido" });
    }

    const [transacciones] = await pool.query(
      "SELECT * FROM transacciones_pago WHERE operation_id = ? LIMIT 1",
      [event.OPERATIONID],
    );
    const transaccion = transacciones[0];
    if (!transaccion)
      return res.status(404).json({ error: "Transacción no encontrada" });

    const result = await getStatus(event.OPERATIONID);

    await pool.query(
      `UPDATE transacciones_pago SET status = ?, fecha_confirmacion = IF(? = 'completed', NOW(), NULL), raw_response = ?
       WHERE id = ?`,
      [result.status, result.status, JSON.stringify(event), transaccion.id],
    );

    if (result.status === "completed" && transaccion.status !== "completed") {
      await pool.query("UPDATE facturas SET estado = ? WHERE id = ?", [
        "pagada",
        transaccion.factura_id,
      ]);

      await pool.query(
        `INSERT INTO pagos (factura_id, abonado_id, monto, fecha_pago, metodo, concepto, comprobante)
         SELECT ?, f.abonado_id, ?, CURDATE(), 'tarjeta', 'Pago online TodoPago', ?
         FROM facturas f WHERE f.id = ?`,
        [
          transaccion.factura_id,
          transaccion.monto,
          `TP-${transaccion.operation_id}`,
          transaccion.factura_id,
        ],
      );

      await pool.query(
        `INSERT INTO caja (tipo, concepto, monto, fecha, factura_id)
         SELECT 'ingreso', CONCAT('Pago online TP #', ?), ?, CURDATE(), ?`,
        [transaccion.id, transaccion.monto, transaccion.factura_id],
      );
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/todopago/status/:operation_id
 * Consulta el estado de una transacción.
 */
export async function consultarStatus(req, res, next) {
  try {
    const { operation_id } = req.params;

    const [transacciones] = await pool.query(
      "SELECT t.*, f.periodo, f.total, f.estado AS factura_estado, a.nombre AS abonado_nombre, a.email AS abonado_email, a.codigo AS abonado_codigo FROM transacciones_pago t JOIN facturas f ON f.id = t.factura_id JOIN abonados a ON a.id = f.abonado_id WHERE t.operation_id = ? LIMIT 1",
      [operation_id],
    );
    if (!transacciones[0])
      return res.status(404).json({ error: "Transacción no encontrada" });

    const transaccion = transacciones[0];

    // Si está pendiente, consultar estado actual en TodoPago
    let estadoActual = transaccion.status;
    if (estadoActual === "pending") {
      try {
        const result = await getStatus(operation_id);
        estadoActual = result.status;

        if (estadoActual !== transaccion.status) {
          await pool.query(
            "UPDATE transacciones_pago SET status = ? WHERE id = ?",
            [estadoActual, transaccion.id],
          );
        }
      } catch {
        // Si falla la consulta, mantener el estado actual
      }
    }

    res.json({
      id: transaccion.id,
      factura_id: transaccion.factura_id,
      periodo: transaccion.periodo,
      abonado: transaccion.abonado_nombre,
      abonado_codigo: transaccion.abonado_codigo,
      abonado_email: transaccion.abonado_email,
      monto: Number(transaccion.monto),
      status: estadoActual,
      operation_id: transaccion.operation_id,
      fecha_creacion: transaccion.fecha_creacion,
      fecha_confirmacion: transaccion.fecha_confirmacion,
      factura_estado: transaccion.factura_estado,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/todopago/transacciones/:factura_id
 * Lista las transacciones de una factura.
 */
export async function listarTransacciones(req, res, next) {
  try {
    const { factura_id } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM transacciones_pago WHERE factura_id = ? ORDER BY id DESC",
      [factura_id],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/todopago/config
 * Indica si la pasarela está habilitada.
 */
export function getConfig(_req, res) {
  res.json({
    enabled: todopagoConfig.enabled,
    hasMerchant: Boolean(todopagoConfig.merchant),
    hasApiKey: Boolean(todopagoConfig.apiKey),
  });
}
