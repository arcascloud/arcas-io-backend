# Análisis de Seguridad — Junta de Agua vs Arcas ERP

> Fecha: 01/11/2026
> Fuente: comparativa del backend en producción de Junta de Agua
> (`E:\desarrollo\proyectos angular\junta-agua\backend`, Express/JS) contra
> Arcas ERP Backend (NestJS).

---

## Hallazgo crítico — 401 en `/auth/me` de producción

### Síntoma

Login `POST /api/auth/login` respondía **201** y devolvía el token en el
body, pero **toda** petición autenticada subsiguiente (`/auth/me`,
`/users/menu-items`, etc.) respondía **401 Unauthorized**. Ocurría solo en
producción (`https://hn.arcas-io.workers.dev` →
`https://arcas-io-backend.onrender.com`), no en local.

### Causa raíz (dos capas)

**Capa 1 — cross-site + `SameSite=Lax` (bug de diseño).**

- Frontend y backend viven en **dominios distintos** (cross-site).
- La cookie `jwt_token` se firmaba con `sameSite: 'lax'` fijo
  (`auth.controller.ts`).
- Con `SameSite=Lax`, el navegador **setea** la cookie tras el login
  (por eso el 201) pero **NO la envía** en fetch/XHR posteriores a otro
  origen → el backend nunca ve la cookie → 401.
- **Patrón probado de Junta de Agua** (`authController.js:16-21`):
  `sameSite: isProd ? 'none' : 'lax'` — en producción se usa `None`
  precisamente porque frontend (workers.dev) y backend (onrender.com)
  son sitios distintos.

**Capa 2 — `NODE_ENV` no definida en Render (trampa del fix obvio).**

- El primer fix usó `const isProd = process.env.NODE_ENV === 'production'`.
- Tras el deploy, la cookie seguía saliendo `SameSite=Lax` **sin
  atributo `Secure`** — la inspección del header `Set-Cookie` en
  producción lo delató: `isProd` era `false` **porque Render no define
  `NODE_ENV` por defecto**.
- `SameSite=None` **exige** `Secure=true`; sin HTTPS/Secure el navegador
  descarta la cookie.

### Solución final (commit `6cf2324`)

Detectar HTTPS real en vez de confiar en `NODE_ENV`:

1. **`main.ts`** — confiar en el proxy de Render para que `req.secure`
   refleje el header `x-forwarded-proto` del balanceador:

   ```ts
   // Render termina TLS en un proxy delante del proceso Node.
   // Sin trust proxy, req.secure es false aunque la petición llegue por HTTPS.
   (app as any).set('trust proxy', 1);
   ```

2. **`auth.controller.ts`** — login y logout deciden por `req.secure`:

   ```ts
   const isHttps = request.secure === true;
   response.cookie('jwt_token', resAuth.access_token, {
     httpOnly: true,
     secure: isHttps,
     sameSite: isHttps ? 'none' : 'lax',
     maxAge: 8 * 60 * 60 * 1000,
     path: '/',
   });
   ```

### Verificación

- Antes del fix, `Set-Cookie` en producción:
  `jwt_token=...; HttpOnly; SameSite=Lax` (sin `Secure`).
- Después del fix: `jwt_token=...; HttpOnly; Secure; SameSite=None` ✓.
- El navegador ahora **sí envía** la cookie cross-site → `/auth/me` y el
  resto de la API autenticada responden 200.

### Lecciones

| # | Lección |
|---|---------|
| 1 | Cookies cross-site (SPA en un dominio, API en otro) **necesitan** `SameSite=None; Secure` — `Lax` funciona en local (same-origin) y falla silenciosamente en producción. |
| 2 | En PaaS (Render, Railway, etc.) **no confíes en `NODE_ENV`**: puede no estar definida. Detecta HTTPS por `req.secure` + `trust proxy`, o por el header `x-forwarded-proto`. |
| 3 | Un 201 con cookie seteada ≠ sesión funcionando: inspeccionar siempre el header `Set-Cookie` real en producción (atributos `Secure`, `SameSite`, `HttpOnly`). |
| 4 | `SameSite=None` sin `Secure` es inválido: el navegador la descarta silenciosamente. Van siempre juntos. |

---

## Comparativa de seguridad

| Aspecto | Junta de Agua ✓ | Arcas ✗ |
|---|---|---|
| **Cookie SameSite** | `none` en prod (cross-site OK) | `lax` → cookie no viaja entre orígenes |
| **JWT_SECRET** | Obligatorio; la app no arranca si falta | Fallback hardcodeado `'arcas-software-secret-key-2026'` (cualquiera con el repo puede firmar tokens) |
| **Contraseñas** | bcrypt hasheadas | Texto plano (`user.password !== dto.password`) |
| **Rate limit login** | 5 intentos / IP / 15 min | Ninguno (fuerza bruta abierta) |
| **Helmet** | Sí (X-Frame-Options, X-Content-Type, Referrer-Policy, HSTS) | No |
| **Refresh tokens** | Access corto + refresh 7d rotativo y revocable en BD | Token estático 24h, sin revocación |
| **CORS en producción** | Obligatorio; app no arranca sin lista explícita de orígenes | Permisivo |
| **x-powered-by** | Deshabilitado | Expuesto |
| **Manejo de errores** | Genérico en prod (no expone internals) | NestJS lo hace bien por defecto ✓ |

---

## Plan de mejoras (por prioridad)

### Fase 1 — desbloqueo de producción (01/11/2026)

1. **`sameSite: 'none'` en producción** en `auth.controller.ts`
   — fix inmediato del 401 cross-site. ✅ APLICADO
2. **JWT_SECRET obligatorio** — quitar el fallback hardcodeado en
   `auth.module.ts` y `jwt.strategy.ts`; la app debe fallar al arrancar
   si `JWT_SECRET` no está definida.
3. **Rate limit en login** — puerto del `rateLimiter` de Junta de Agua
   (in-memory, sin dependencias): 5 intentos / IP / 15 min sobre
   `POST /api/auth/login`.
4. **Helmet** — `npm i helmet` + `app.use(helmet(...))` en `main.ts`
   (CSP desactivado: la API es JSON, el CSP lo maneja el SPA).

### Fase 2 — endurecimiento posterior

5. **bcrypt para contraseñas** — requiere migración de usuarios existentes:
   - Hashear al verificar (re-hash lazy): si el stored no empieza con `$2`,
     comparar texto plano y re-guardar con bcrypt.
   - Forzar cambio de password en el próximo login.
6. **Refresh token rotativo** — access 15 min/8h + refresh 7d con hash
   sha256 en BD, rotación en cada refresh y revocación en logout
   (tabla nueva `refresh_tokens`).
7. **CORS estricto en producción** — exigir `CORS_ORIGIN` como lista
   explícita; no arrancar si falta o contiene `*`.

---

## Referencias de implementación en Junta de Agua

- `backend/src/config/auth.js` — JWT_SECRET obligatorio, access+refresh,
  `parseMs`, hash sha256 de refresh tokens.
- `backend/src/middleware/auth.js` — `authRequired` + `roleRequired(...roles)`.
- `backend/src/middleware/rateLimit.js` — rate limiter in-memory con
  limpieza periódica (`setInterval(...).unref()`).
- `backend/src/middleware/errorHandler.js` — genérico en prod.
- `backend/src/controllers/authController.js` — cookies HttpOnly,
  `sameSite: isProd ? 'none' : 'lax'`, rotación de refresh.
- `backend/src/server.js` — CORS con lista obligatoria en prod,
  helmet, `x-powered-by` deshabilitado.
