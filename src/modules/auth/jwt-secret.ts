import * as fs from 'fs';
import * as path from 'path';

/**
 * Fuente única y cacheada del secreto JWT.
 *
 * Problema que evita: `JwtModule.register()` evalúa `process.env.JWT_SECRET`
 * AL IMPORTAR (antes de que `ConfigModule.forRoot()` cargue el `.env`), mientras
 * `JwtStrategy` lo lee en su constructor (después de cargarlo) — si el .env trae
 * un placeholder distinto (`JWT_SECRET=${seed}`), se firma con un secreto y se
 * verifica con otro y TODA la autenticación devuelve 401 "Unauthorized".
 *
 * Esta función parsea `.env` de forma perezosa, cachea el resultado y se usa
 * en AMBOS lados (firma y verificación), por lo que el orden de importación,
 * la DI o quién cargue el .env primero dejan de importar.
 */
let cache: string | undefined;

export function secretoJwt(): string {
  if (cache !== undefined) return cache;

  let valor = process.env.JWT_SECRET;
  if (!valor) {
    try {
      const archivo = path.join(process.cwd(), '.env');
      if (fs.existsSync(archivo)) {
        const texto = fs.readFileSync(archivo, 'utf8');
        for (const linea of texto.split(/\r?\n/)) {
          const t = linea.trim();
          if (!t || t.startsWith('#')) continue;
          const i = t.indexOf('=');
          if (i > 0 && t.slice(0, i).trim() === 'JWT_SECRET') {
            valor = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
            if (valor) break;
          }
        }
      }
    } catch {
      /* sin .env legible → fallback */
    }
  }

  cache = valor;
  if (!cache || cache === '${seed}' || cache.includes('${')) {
    throw new Error('El login exige JWT_SECRET configurado.');
  }
  return cache;
}
