/**
 * Rate limiting y anti-bruteforce para proteger contra ataques.
 * Mantiene registro en memoria de intentos por IP/email.
 */

const env = require("../config/env");

// En-memory storage para intentos fallidos: email -> { attemptCount, lastAttempt, lockedUntil, ips: Set }
const failedAttempts = new Map();

// En-memory storage para intentos por IP: ip -> { count, firstAttempt }
const ipAttempts = new Map();

/**
 * Registra un intento fallido de login asociado a email e IP
 * @param {string} email - Email del usuario
 * @param {string} ip - IP del cliente
 */
function recordFailedAttempt(email, ip) {
  const now = Date.now();

  // Registro por email
  if (!failedAttempts.has(email)) {
    failedAttempts.set(email, {
      attemptCount: 0,
      lastAttempt: now,
      lockedUntil: null,
      ips: new Set(),
    });
  }

  const emailRecord = failedAttempts.get(email);
  emailRecord.attemptCount++;
  emailRecord.lastAttempt = now;
  emailRecord.ips.add(ip);

  // Bloquear si se supera el threshold
  if (emailRecord.attemptCount >= env.accountLockoutThreshold) {
    emailRecord.lockedUntil = now + env.accountLockoutDurationMs;
  }

  // Registro por IP (limitado a 20 intentos por ventana)
  if (!ipAttempts.has(ip)) {
    ipAttempts.set(ip, { count: 0, firstAttempt: now });
  }

  const ipRecord = ipAttempts.get(ip);
  ipRecord.count++;
}

/**
 * Limpia intentos fallidos de un email tras login exitoso
 * @param {string} email - Email del usuario
 */
function clearFailedAttempts(email) {
  failedAttempts.delete(email);
}

/**
 * Verifica si una cuenta está bloqueada
 * @param {string} email - Email del usuario
 * @returns {object} { isLocked: boolean, remainingMs: number|null }
 */
function isAccountLocked(email) {
  const record = failedAttempts.get(email);
  if (!record?.lockedUntil) {
    return { isLocked: false, remainingMs: null };
  }

  const now = Date.now();
  const remainingMs = record.lockedUntil - now;
  if (remainingMs > 0) {
    return { isLocked: true, remainingMs };
  }

  // Desbloquear tras expiración
  record.lockedUntil = null;
  record.attemptCount = 0;
  return { isLocked: false, remainingMs: null };
}

/**
 * Obtiene el número de intentos fallidos en la ventana actual
 * @param {string} ip - IP del cliente
 * @returns {number} Número de intentos
 */
function getIPAttemptCount(ip) {
  const record = ipAttempts.get(ip);
  if (!record) return 0;

  const now = Date.now();
  const windowStart = now - env.loginRateLimitWindowMs;

  if (record.firstAttempt < windowStart) {
    // Ventana expirada, resetear
    ipAttempts.delete(ip);
    return 0;
  }

  return record.count;
}

/**
 * Limpia registros expirados periódicamente (ejecutar cada 5 minutos)
 */
function cleanExpiredRecords() {
  const now = Date.now();
  const windowMs = env.loginRateLimitWindowMs;

  // Limpiar IPs
  for (const [ip, record] of ipAttempts.entries()) {
    if (now - record.firstAttempt > windowMs) {
      ipAttempts.delete(ip);
    }
  }

  // Limpiar emails desbloqueados
  for (const [email, record] of failedAttempts.entries()) {
    const isOldRecord = now - record.lastAttempt > windowMs * 3;
    const isUnlocked = !record.lockedUntil;
    if (isOldRecord && isUnlocked) {
      failedAttempts.delete(email);
    }
  }
}

// Ejecutar limpieza cada 5 minutos
setInterval(cleanExpiredRecords, 5 * 60 * 1000);

module.exports = {
  recordFailedAttempt,
  clearFailedAttempts,
  isAccountLocked,
  getIPAttemptCount,
  cleanExpiredRecords,
};
