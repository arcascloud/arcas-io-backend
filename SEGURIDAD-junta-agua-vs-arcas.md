# Análisis de Seguridad — Junta de Agua vs Arcas ERP

> Fecha: 01/11/2026
> Fuente: comparativa del backend en producción de Junta de Agua
> (`E:\desarrollo\proyectos angular\junta-agua\backend`, Express/JS) contra
> Arcas ERP Backend (NestJS).

---

## Hallazgo crítico — 401 en `/auth/me` de producción

**Causa raíz**: cookie `jwt_token` firmada con `sameSite: 'lax'` en
`Backend/src/modules/auth/auth.controller.ts`.

- Frontend en producción: `https://hn.arcas-io.workers.dev`
- Backend en producción: `https://arcas-io-backend.onrender.com`
- Son **sitios distintos (cross-site)**.
- Con `SameSite=Lax`, el navegador setea la cookie tras el login (201 OK)
  pero **NO la envía** en peticiones fetch/XHR posteriores a otro origen →
  `/auth/me` responde 401 indefinidamente.

**Solución (patrón probado en Junta de Agua, `authController.js:16-21`)**:

```js
// SameSite=None en producción porque frontend (workers.dev) y backend
// (onrender.com) son sitios distintos (cross-site): con SameSite=Lax el
// navegador NO enviaría la cookie en las peticiones fetch/XHR autenticadas.
sameSite: isProd ? "none" : "lax"
```

`SameSite=None` exige `Secure=true` (solo HTTPS) — correcto en Render.

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
