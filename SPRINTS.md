# Plan de Sprints — Sistema de Autenticación "Hardened"

Este documento define qué se hará en cada sprint. La ejecución será secuencial y solo se avanzará con tu confirmación.

## ~~Sprint 1 — Fundaciones seguras (Argon2 + base del proyecto)~~ ✅

Objetivo:
~~Construir la base técnica del backend y asegurar el registro de usuarios con hashing robusto.~~

Entregables:

- ~~Estructura del proyecto Node.js + Express.~~
- ~~Configuración de entorno (`.env.example`).~~
- ~~Registro de usuario con validaciones mínimas.~~
- ~~Hash de contraseña con Argon2id.~~
- ~~Persistencia inicial (archivo o DB simple para demo).~~
- ~~Manejo centralizado de errores.~~

Criterio de aceptación:

- ~~Un usuario puede registrarse.~~
- ~~La contraseña nunca se guarda en texto plano.~~
- ~~El hash almacenado es Argon2.~~

## ~~Sprint 2 — Sesiones endurecidas (JWT + cookies seguras)~~ ✅

Objetivo:
~~Implementar autenticación por token con transporte seguro en cookie.~~

Entregables:

- ~~Endpoint de login (password).~~
- ~~Generación de JWT firmado.~~
- ~~Emisión del JWT en cookie `HttpOnly`, `Secure`, `SameSite`.~~
- ~~Middleware de autenticación para rutas protegidas.~~
- ~~Endpoint de perfil protegido (`/me`).~~
- ~~Endpoint de logout (limpieza de cookie).~~

Criterio de aceptación:

- ~~Login exitoso emite cookie segura.~~
- ~~Ruta protegida responde solo si hay sesión válida.~~
- ~~Token no se expone a JavaScript del cliente.~~

## Sprint 3 — MFA/2FA (TOTP + QR)

Objetivo:
Agregar segundo factor para bloquear accesos con contraseña comprometida.

Entregables:

- Generación de secreto TOTP por usuario.
- QR para enrolar Google Authenticator.
- Flujo de login en dos pasos:
  1. credenciales,
  2. código MFA.
- Verificación de código TOTP.
- Bloqueo de emisión de JWT final si MFA falla.

Criterio de aceptación:

- Sin código MFA válido no se inicia sesión final.
- Con MFA válido se completa login y se mantiene sesión segura.

## Sprint 4 — Frontend plano + narrativa comercial

Objetivo:
Presentar el proyecto de forma clara, técnica y atractiva para demo/venta.

Entregables:

- Landing frontend plana y profesional.
- Formularios para probar registro, login y MFA.
- Mensajes de valor orientados a negocio.
- README técnico/comercial final del producto.

Criterio de aceptación:

- Flujo completo demostrable desde la interfaz.
- Documentación clara para cliente técnico y no técnico.

## Sprint 5 — Hardening adicional y preparación productiva (opcional)

Objetivo:
Subir madurez de seguridad para despliegue real.

Entregables:

- Rate limiting / anti brute force.
- Políticas de seguridad HTTP (helmet, CORS estricto, etc.).
- Logs de seguridad y trazabilidad de eventos.
- Estrategia de refresh tokens/rotación (si aplica).
- Pruebas básicas de seguridad y checklist preproducción.

Criterio de aceptación:

- Controles adicionales activos y validados.
- Checklist de salida a producción documentado.

## Regla de ejecución

- No se avanza al siguiente sprint sin tu indicación explícita.
- Cada sprint cierra con:
  - resumen de cambios,
  - archivos tocados,
  - cómo probar,
  - riesgos y pendientes.

## Estado actual

- Sprint completado: **Sprint 1** ✅
- Sprint completado: **Sprint 2** ✅
- Sprint activo: **esperando autorización para Sprint 3**.
- Siguiente acción: iniciar Sprint 3 (MFA/2FA con TOTP + QR) cuando tú lo indiques.
