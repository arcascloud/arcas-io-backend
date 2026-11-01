/**
 * Configuración de TodoPago (Honduras)
 *
 * Para activar la integración:
 * 1. Solicitar una cuenta de comercio en https://todopago.hn/tp-business/
 * 2. Completar las variables de entorno TODOPAGO_* en el .env
 * 3. Si no hay credenciales, el sistema funciona sin la pasarela
 */
export const todopagoConfig = {
  enabled: Boolean(
    process.env.TODOPAGO_MERCHANT_ID && process.env.TODOPAGO_API_KEY,
  ),

  merchant: process.env.TODOPAGO_MERCHANT_ID || "",
  apiKey: process.env.TODOPAGO_API_KEY || "",
  security: process.env.TODOPAGO_SECURITY || "",

  // URLs del entorno (desarrollo / producción)
  endpoints: {
    sendAuthorizeRequest:
      process.env.TODOPAGO_ENDPOINT_SAR ||
      "https://developers.todopago.com.ar/services/t/1.0/",
    getAuthorizeAnswer:
      process.env.TODOPAGO_ENDPOINT_GAA ||
      "https://developers.todopago.com.ar/services/t/1.0/",
    getStatus:
      process.env.TODOPAGO_ENDPOINT_STATUS ||
      "https://developers.todopago.com.ar/services/t/1.0/",
  },

  // Callbacks — URL pública donde TodoPago redirige tras el pago
  urlOk:
    process.env.TODOPAGO_URL_OK ||
    `${process.env.PUBLIC_URL || "http://localhost:4200"}/pagos/confirmado`,
  urlError:
    process.env.TODOPAGO_URL_ERROR ||
    `${process.env.PUBLIC_URL || "http://localhost:4200"}/pagos/error`,

  // Timeout para llamadas HTTP (ms)
  timeout: parseInt(process.env.TODOPAGO_TIMEOUT || "15000", 10),
};
