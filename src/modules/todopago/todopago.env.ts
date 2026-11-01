import * as fs from 'fs';
import * as path from 'path';

/**
 * Carga del .env únicamente las variables de TodoPago (TODOPAGO_* y PUBLIC_URL).
 *
 * El backend NO carga el .env de forma global a propósito: ese archivo contiene
 * placeholders de otros proyectos (JWT_SECRET=${seed}, DB_*, SMTP_*) y cargarlo
 * completo desalinearía el secreto JWT entre JwtModule (import time) y
 * JwtStrategy (constructor) — rompiendo TODA la autenticación con 401.
 *
 * Se ejecuta en main.ts DESPUÉS de NestFactory.create(), cuando la estrategia
 * JWT ya capturó su secreto.
 */
export function cargarEnvTodoPago(): void {
  const archivo = path.join(process.cwd(), '.env');
  if (!fs.existsSync(archivo)) return;

  let texto: string;
  try {
    texto = fs.readFileSync(archivo, 'utf8');
  } catch {
    return;
  }

  const claves: string[] = [];
  for (const linea of texto.split(/\r?\n/)) {
    const t = linea.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const clave = t.slice(0, i).trim();
    if (clave.startsWith('TODOPAGO_') || clave === 'PUBLIC_URL') {
      claves.push(clave);
      const valor = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      if (process.env[clave] === undefined) {
        process.env[clave] = valor;
      }
    }
  }
  console.log(`TodoPago env cargado: ${claves.join(', ') || '(sin claves en .env)'}`);
}
