# Proyecto 1: Sistema de Autenticación "Hardened" (MFA + JWT)

Este proyecto transforma un login básico en una fortaleza. El objetivo es evitar que un atacante robe cuentas, incluso si logra obtener la contraseña del usuario.

## Resumen ejecutivo

- Producto: módulo de autenticación segura "Plug & Play" para Node.js.
- Problema que resuelve: robo de cuentas, secuestro de sesión y abuso de credenciales filtradas.
- Propuesta de valor: integración rápida con controles de seguridad de nivel empresarial.

## Pilares de ciberseguridad del proyecto

## 1) Hashing con Argon2 (la base de la base)

Qué hace:
Cuando un usuario se registra, la contraseña no se guarda en texto plano (por ejemplo, `12345`). Se transforma con Argon2 y se almacena únicamente el hash.

Por qué es ciberseguridad:

- Argon2 está diseñado para ser lento y costoso en memoria (memory-hard).
- Esto dificulta ataques masivos con GPU/ASIC tras una filtración de base de datos.
- Es un estándar moderno recomendado para contraseñas.

## 2) JWT en cookies seguras (HttpOnly + Secure)

Qué hace:
Después de autenticarse, el servidor entrega un JWT para mantener la sesión sin pedir login en cada acción.

Detalle técnico importante:

- El JWT se guarda en cookie segura, no en `localStorage`.
- La cookie incluye banderas `HttpOnly` y `Secure`.

Por qué es ciberseguridad:

- Mitiga robo de token vía XSS porque JavaScript del navegador no puede leer cookies `HttpOnly`.
- `Secure` obliga envío por HTTPS en producción.

## 3) MFA / 2FA (doble factor)

Qué hace:
Obliga a ingresar un código temporal de 6 dígitos desde apps como Google Authenticator.

Por qué es ciberseguridad:

- Protege contra credential stuffing.
- Si el atacante solo tiene la contraseña, no puede completar el acceso sin el segundo factor físico.

## Flujo lógico (explicable a cliente)

1. Registro:
   Usuario envía contraseña -> servidor aplica Argon2 -> se guarda hash en base de datos.

2. Login Paso 1:
   Usuario envía email/contraseña -> servidor valida credenciales -> solicita código MFA.

3. Login Paso 2 (MFA):
   Usuario envía código de 6 dígitos -> servidor valida contra secreto TOTP -> genera JWT.

4. Persistencia segura:
   El servidor envía JWT en cookie blindada (`HttpOnly` + `Secure`).

## ¿Por qué esto es viable comercialmente?

Cualquier empresa que maneje datos sensibles (finanzas, salud, legal, RRHH, e-commerce) necesita este rigor.

Se puede vender como:

**"Módulo de Identidad Blindado para Node.js"**

Beneficios para empresa:

- Reduce riesgo de toma de cuentas.
- Mejora la postura de seguridad en auditorías.
- Acelera el cumplimiento de buenas prácticas.
- Evita construir desde cero un sistema de autenticación robusto.

## Diferencial técnico frente a login tradicional

- Login tradicional: password + sesión simple.
- Hardened auth: password robusto (Argon2) + token en canal protegido + segundo factor.
- Resultado: defensa en capas (defense-in-depth).

## Alcance inicial del repositorio

Este repositorio se trabajará por sprints. En esta etapa se definirá e implementará cada sprint de forma incremental bajo tu aprobación.

Ver detalle en [SPRINTS.md](SPRINTS.md).

## Recomendaciones para producción (cuando se implemente)

- Forzar HTTPS y HSTS.
- Usar base de datos real y cifrado en reposo.
- Añadir rate limiting y bloqueo por intentos fallidos.
- Registrar eventos de seguridad y auditoría.
- Implementar gestión de secretos y rotación de claves JWT.
- Incorporar pruebas automáticas y validaciones de seguridad.

## Estado actual

- Repositorio reiniciado desde cero.
- Documentación base creada.
- Esperando tu indicación para iniciar Sprint 1.
