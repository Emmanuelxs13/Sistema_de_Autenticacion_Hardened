const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtIssuer: process.env.JWT_ISSUER || "hardened-auth",
  jwtAudience: process.env.JWT_AUDIENCE || "hardened-auth-client",
  tempJwtAudience: process.env.TEMP_JWT_AUDIENCE || "hardened-auth-2fa",
  tempTokenExpiresIn: process.env.TEMP_TOKEN_EXPIRES_IN || "5m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  refreshJwtAudience: process.env.REFRESH_JWT_AUDIENCE || "hardened-auth-refresh",
  authCookieName: process.env.AUTH_COOKIE_NAME || "access_token",
  refreshCookieName: process.env.REFRESH_COOKIE_NAME || "refresh_token",
  cookieSecure: String(process.env.COOKIE_SECURE || "false") === "true",
  cookieSameSite: process.env.COOKIE_SAME_SITE || "strict",
  mfaIssuer: process.env.MFA_ISSUER || "hardened-auth",
  
  // Sprint 5: Rate limiting y anti-bruteforce
  loginRateLimitWindowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW || 900000),
  loginRateLimitMaxAttempts: Number(process.env.LOGIN_RATE_LIMIT_MAX || 5),
  accountLockoutThreshold: Number(process.env.ACCOUNT_LOCKOUT_THRESHOLD || 10),
  accountLockoutDurationMs: Number(process.env.ACCOUNT_LOCKOUT_DURATION || 1800000),
  
  // Sprint 5: Logging
  logEventsFile: process.env.LOG_EVENTS_FILE || "data/auth-events.jsonl",
  enableAuditLog: String(process.env.ENABLE_AUDIT_LOG || "true") === "true",
};
