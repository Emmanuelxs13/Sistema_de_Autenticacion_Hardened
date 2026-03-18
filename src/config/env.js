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
  authCookieName: process.env.AUTH_COOKIE_NAME || "access_token",
  cookieSecure: String(process.env.COOKIE_SECURE || "false") === "true",
  cookieSameSite: process.env.COOKIE_SAME_SITE || "strict",
  mfaIssuer: process.env.MFA_ISSUER || "hardened-auth",
};
