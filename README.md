# Proyecto 1: Sistema de Autenticación "Hardened" (MFA + JWT)

Este proyecto transforma un login básico en una fortaleza. Su objetivo es evitar que un atacante robe cuentas incluso si logra obtener la contraseña del usuario.

## Propuesta de valor

- Producto: módulo "Plug & Play" de identidad blindada para Node.js + Express.
- Problema que resuelve: account takeover, secuestro de sesión y abuso de credenciales filtradas.
- Beneficio de negocio: despliegue rápido de autenticación robusta sin construirla desde cero.

## Pilares de ciberseguridad

### 1) Argon2id para contraseñas

Qué hace:

- El backend nunca guarda la contraseña en texto plano.
- En registro, la contraseña se transforma con Argon2id y solo se persiste el hash.

Por qué es ciberseguridad:

- Argon2id es memory-hard y lento por diseño.
- Dificulta cracking masivo con GPU/ASIC tras una filtración de base de datos.
- Es el estándar moderno recomendado para password hashing.

### 2) JWT en cookies seguras

Qué hace:

- Tras login exitoso, el servidor emite JWT firmado.
- El token se guarda en cookie con `HttpOnly`, `Secure` y `SameSite`.

Por qué es ciberseguridad:

- `HttpOnly` impide lectura del token desde JavaScript (mitiga robo por XSS).
- `Secure` restringe envío de cookie a HTTPS en producción.

### 3) MFA / 2FA con TOTP

Qué hace:

- Se genera un secreto MFA por usuario y un QR para Google Authenticator.
- El login se divide en dos pasos: credenciales + código TOTP.

Por qué es ciberseguridad:

- Si la contraseña se filtra, el atacante sigue bloqueado sin el segundo factor.
- Mitiga credential stuffing y reuse de credenciales.

## Flujo lógico para cliente

1. Registro:
   usuario envía email/contraseña -> backend valida -> hashea con Argon2id -> guarda en DB.

2. Setup MFA:
   backend genera secreto TOTP + QR -> usuario escanea en Authenticator -> confirma con código de 6 dígitos.

3. Login Paso 1:
   usuario envía email/contraseña -> backend verifica -> responde `tempToken` (todavía sin sesión final).

4. Login Paso 2:
   usuario envía `tempToken` + TOTP -> backend valida -> emite JWT en cookie segura.

5. Persistencia de sesión:
   browser envía cookie al backend en rutas protegidas (`/api/auth/me`).

## Endpoints principales

- `POST /api/auth/register`
- `POST /api/auth/mfa/setup`
- `POST /api/auth/mfa/verify-setup`
- `POST /api/auth/login`
- `POST /api/auth/login/2fa`
- `POST /api/auth/refresh`
- `GET /api/auth/audit-log`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/health`

## Hardening Sprint 5

Se agregaron controles de seguridad orientados a producción:

- `helmet` para cabeceras HTTP seguras por defecto.
- Rate limiting general para `/api/*` y específico para login/MFA.
- Anti brute-force con lockout temporal por cuenta tras múltiples fallos.
- Audit logging en formato JSONL (`data/auth-events.jsonl`) para trazabilidad.
- Refresh token en cookie `HttpOnly` con rotación en `/api/auth/refresh`.

## Frontend de demo (Sprint 4)

Incluye una landing plana y atractiva en `public/` para presentación comercial y validación técnica:

- Registro
- Setup MFA (QR)
- Activación MFA
- Login paso 1 y paso 2
- Consulta de sesión protegida y logout

Ejecuta y abre:

- `npm install`
- `npm run dev`
- `http://localhost:3000`

## Estructura principal

```text
src/
  config/env.js
  controllers/authController.js
  middleware/authMiddleware.js
  middleware/errorMiddleware.js
  services/mfaService.js
  services/tokenService.js
  services/userStore.js
  utils/errors.js
  utils/validators.js
  server.js
public/
  index.html
  styles.css
  app.js
data/
  users.json
```

## Variables de entorno clave

Revisa `.env.example`:

- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `JWT_ISSUER`, `JWT_AUDIENCE`
- `TEMP_JWT_AUDIENCE`, `TEMP_TOKEN_EXPIRES_IN`
- `REFRESH_JWT_AUDIENCE`, `REFRESH_TOKEN_EXPIRES_IN`, `REFRESH_COOKIE_NAME`
- `AUTH_COOKIE_NAME`, `COOKIE_SECURE`, `COOKIE_SAME_SITE`
- `LOGIN_RATE_LIMIT_WINDOW`, `LOGIN_RATE_LIMIT_MAX`
- `ACCOUNT_LOCKOUT_THRESHOLD`, `ACCOUNT_LOCKOUT_DURATION`
- `LOG_EVENTS_FILE`, `ENABLE_AUDIT_LOG`
- `MFA_ISSUER`

## Viabilidad comercial

Este módulo es ideal para sectores con datos sensibles (finanzas, salud, legal, e-commerce B2B):

- reduce riesgo de fraude y account takeover,
- acelera auditorías de seguridad,
- ofrece una base robusta reutilizable para nuevos productos.

## Recomendaciones para producción

- Forzar HTTPS, HSTS y cabeceras de seguridad.
- Migrar `data/users.json` a base de datos real con cifrado en reposo.
- Integrar monitoreo de rate limiting y lockouts en alertas operativas.
- Enviar `auth-events.jsonl` a SIEM/SOC para detección de anomalías.
- Gestionar rotación de secretos y llaves JWT.

## Estado actual

- Sprint 1 completado ✅
- Sprint 2 completado ✅
- Sprint 3 completado ✅
- Sprint 4 completado ✅
- Sprint 5 completado ✅
