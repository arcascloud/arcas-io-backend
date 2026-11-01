import axios from "axios";
import { todopagoConfig } from "../config/todopago.js";

const {
  endpoints,
  merchant,
  apiKey,
  security,
  urlOk,
  urlError,
  timeout,
  enabled,
} = todopagoConfig;

function buildHeaders() {
  return {
    Authorization: `TODOPAGO ${apiKey}`,
    "Content-Type": "application/json;charset=UTF-8",
    Accept: "application/json",
  };
}

/**
 * Genera un operation_id único basado en factura + timestamp
 */
function buildOperationId(facturaId) {
  return `FA-${facturaId}-${Date.now()}`;
}

/**
 * 1. SendAuthorizeRequest
 * Crea una solicitud de pago en TodoPago y devuelve la URL para redirigir al cliente.
 *
 * @param {object} params
 * @param {number} params.facturaId
 * @param {number} params.monto
 * @param {string} params.emailCliente
 * @param {string} params.operationId  (opcional)
 * @returns {{ url: string, publicRequestKey: string, operationId: string }}
 */
export async function sendAuthorizeRequest({
  facturaId,
  monto,
  emailCliente,
  operationId,
}) {
  if (!enabled) {
    // Modo simulación — devuelve datos de prueba
    const fakeOp = operationId || buildOperationId(facturaId);
    const publicRequestKey = `SIM-${fakeOp}`;
    const baseUrl = process.env.PUBLIC_URL || "http://localhost:4200";
    return {
      url: `${baseUrl}/pagos/confirmado?Answer=${publicRequestKey}&Order=${fakeOp}`,
      publicRequestKey,
      operationId: fakeOp,
      sandbox: true,
    };
  }

  const opId = operationId || buildOperationId(facturaId);

  const payload = {
    Security: security,
    Merchant: merchant,
    URL_OK: urlOk,
    URL_ERROR: urlError,
    EncodingMethod: "XML",
    // Operación
    OPERATIONID: opId,
    CURRENCYCODE: "340", // Lempiras (HNL). 032 para ARS
    AMOUNT: monto.toFixed(2),
    EMAILCLIENTE: emailCliente || "",
  };

  try {
    const { data } = await axios.post(endpoints.sendAuthorizeRequest, payload, {
      headers: buildHeaders(),
      timeout,
    });

    // La respuesta típica incluye StatusCode, URL_Request, PublicRequestKey
    const publicRequestKey = data.PublicRequestKey || "";
    const url = data.URL_Request || "";
    const statusCode = data.StatusCode || 0;

    if (statusCode !== 1 && statusCode !== 0) {
      throw new Error(
        `TodoPago SAR error [${statusCode}]: ${data.StatusMessage || "Error desconocido"}`,
      );
    }

    return { url, publicRequestKey, operationId: opId };
  } catch (err) {
    // Si la red falla o hay error, lanzamos con mensaje claro
    if (err.response) {
      throw new Error(
        `TodoPago SAR HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`,
      );
    }
    throw err;
  }
}

/**
 * 2. GetAuthorizeAnswer
 * Confirma una transacción después de que el cliente paga en TodoPago.
 *
 * @param {object} params
 * @param {string} params.publicRequestKey
 * @param {string} params.answerKey
 * @returns {object} Datos de la transacción confirmada
 */
export async function getAuthorizeAnswer({ publicRequestKey, answerKey }) {
  if (!enabled) {
    return {
      sandbox: true,
      status: "completed",
      authorizationCode: "SIM-CODE",
      cardData: { lastFour: "0000" },
    };
  }

  const payload = {
    Security: security,
    Merchant: merchant,
    RequestKey: publicRequestKey,
    AnswerKey: answerKey,
  };

  try {
    const { data } = await axios.post(endpoints.getAuthorizeAnswer, payload, {
      headers: buildHeaders(),
      timeout,
    });

    const statusCode = data.StatusCode || 0;

    if (statusCode !== 1) {
      throw new Error(
        `TodoPago GAA error [${statusCode}]: ${data.StatusMessage || "Error desconocido"}`,
      );
    }

    return {
      status: "completed",
      authorizationCode: data.AuthorizationCode || "",
      cardData: data.CardData ? JSON.parse(data.CardData) : null,
      paymentMethod: data.AuthorizationCode
        ? data.CardData?.CardNumber
          ? "tarjeta"
          : "tokes"
        : null,
    };
  } catch (err) {
    if (err.response) {
      throw new Error(
        `TodoPago GAA HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`,
      );
    }
    throw err;
  }
}

/**
 * 3. GetStatus
 * Consulta el estado de una transacción.
 *
 * @param {string} operationId
 * @returns {object} Estado de la transacción
 */
export async function getStatus(operationId) {
  if (!enabled) {
    // El modo simulación devuelve 'completed' si la transacción existe
    return { sandbox: true, status: "completed" };
  }

  const payload = {
    Security: security,
    Merchant: merchant,
    OPERATIONID: operationId,
  };

  try {
    const { data } = await axios.post(endpoints.getStatus, payload, {
      headers: buildHeaders(),
      timeout,
    });

    const results = data.Operations?.Operations || [];

    if (results.length === 0) {
      return { status: "not_found" };
    }

    const op = results[0];
    const statusMap = {
      1: "completed",
      2: "pending",
      3: "failed",
      "-1": "expired",
    };

    return {
      status: statusMap[op.StatusCode] || "unknown",
      statusCode: op.StatusCode,
      statusMessage: op.StatusMessage,
      authorizationCode: op.AuthorizationCode || null,
      paymentMethod: op.PaymentMethodName || null,
      monto: op.Amount ? Number(op.Amount) : null,
      fecha: op.TransactionDate || null,
    };
  } catch (err) {
    if (err.response) {
      throw new Error(
        `TodoPago Status HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`,
      );
    }
    throw err;
  }
}
