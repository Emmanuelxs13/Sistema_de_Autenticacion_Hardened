/**
 * Servicio de auditoría para registrar eventos de autenticación.
 * Almacena logs en formato JSONL para facilitar parsing y análisis.
 */

const fs = require("node:fs/promises");
const path = require("node:path");
const env = require("../config/env");

/**
 * Registra un evento de autenticación
 * @param {string} eventType - Tipo de evento: register, login_attempt, login_success, login_2fa, mfa_setup, mfa_disabled, logout, account_locked
 * @param {string} email - Email del usuario (o 'anonymous' si no aplica)
 * @param {string} ip - IP del cliente
 * @param {boolean} success - Éxito o fracaso del evento
 * @param {object} metadata - Información adicional (reason, attemptCount, etc.)
 */
async function logAuthEvent(eventType, email, ip, success, metadata = {}) {
  if (!env.enableAuditLog) return;

  try {
    const event = {
      timestamp: new Date().toISOString(),
      eventType,
      email,
      ip,
      success,
      userAgent: metadata.userAgent || "unknown",
      reason: metadata.reason || null,
      sessionId: metadata.sessionId || null,
      attemptCount: metadata.attemptCount || null,
      ...metadata,
    };

    const logFile = path.join(__dirname, "..", "..", env.logEventsFile);
    const logDir = path.dirname(logFile);

    // Crear directorio si no existe
    await fs.mkdir(logDir, { recursive: true });

    // Agregar línea JSONL
    await fs.appendFile(logFile, JSON.stringify(event) + "\n", "utf-8");
  } catch (error) {
    console.error("Error logging auth event:", error);
    // No lanzar excepción; logging es no-crítico
  }
}

/**
 * Obtiene eventos de auditoría dentro de un rango de tiempo
 * @param {number} limitRows - Máximo número de filas a retornar
 * @returns {Promise<Array>} Array de eventos parseados
 */
async function getAuditLog(limitRows = 100) {
  try {
    const logFile = path.join(__dirname, "..", "..", env.logEventsFile);
    const content = await fs.readFile(logFile, "utf-8");
    const events = content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .slice(-limitRows);

    return events;
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    console.error("Error reading audit log:", error);
    return [];
  }
}

/**
 * Genera reporte de seguridad basado en logs
 * @returns {Promise<object>} Reporte con estadísticas
 */
async function getSecurityReport() {
  const events = await getAuditLog(1000);
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;

  const report = {
    totalEvents: events.length,
    last24h: {
      registrations: 0,
      loginAttempts: 0,
      loginSuccesses: 0,
      loginFailures: 0,
      mfaSetups: 0,
      accountLockouts: 0,
      uniqueIps: new Set(),
    },
    failedLoginsByEmail: {},
    suspiciousIps: new Map(),
  };

  events.forEach((event) => {
    const eventTime = new Date(event.timestamp).getTime();
    if (eventTime < last24h) return;

    report.last24h.uniqueIps.add(event.ip);

    switch (event.eventType) {
      case "register":
        if (event.success) report.last24h.registrations++;
        break;
      case "login_attempt":
        report.last24h.loginAttempts++;
        if (event.success === false) {
          report.last24h.loginFailures++;
          report.failedLoginsByEmail[event.email] =
            (report.failedLoginsByEmail[event.email] || 0) + 1;
        } else {
          report.last24h.loginSuccesses++;
        }
        break;
      case "login_2fa":
        if (event.success) report.last24h.loginSuccesses++;
        break;
      case "mfa_setup":
        if (event.success) report.last24h.mfaSetups++;
        break;
      case "account_locked":
        report.last24h.accountLockouts++;
        break;
    }

    // Detectar IPs sospechosas (múltiples fallos)
    if (event.success === false) {
      const ipFailures = (report.suspiciousIps.get(event.ip) || 0) + 1;
      report.suspiciousIps.set(event.ip, ipFailures);
    }
  });

  // Convertir Set a array
  report.last24h.uniqueIps = Array.from(report.last24h.uniqueIps);
  report.suspiciousIps = Array.from(report.suspiciousIps)
    .filter(([_ip, count]) => count >= 5)
    .map(([ip, count]) => ({ ip, failureCount: count }));

  return report;
}

module.exports = {
  logAuthEvent,
  getAuditLog,
  getSecurityReport,
};
