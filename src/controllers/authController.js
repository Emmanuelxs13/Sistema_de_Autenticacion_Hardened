const crypto = require("node:crypto");
const argon2 = require("argon2");
const env = require("../config/env");
const { HttpError } = require("../utils/errors");
const { isValidEmail, isStrongPassword } = require("../utils/validators");
const { findByEmail, findById, insertUser, updateUser } = require("../services/userStore");
const {
  signAccessToken,
  signTempToken,
  verifyTempToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../services/tokenService");
const { generateMfaSecret, verifyTotpToken } = require("../services/mfaService");
const { logAuthEvent, getAuditLog: fetchAuditLog, getSecurityReport } = require("../services/auditService");
const { recordFailedAttempt, clearFailedAttempts, isAccountLocked } = require("../services/rateLimitService");

function setAuthCookie(res, token) {
  res.cookie(env.authCookieName, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: 1000 * 60 * 15,
  });
}

function setRefreshCookie(res, token) {
  res.cookie(env.refreshCookieName, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(env.authCookieName, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(env.refreshCookieName, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
  });
}

async function register(req, res, next) {
  const email = String(req.body.email || "").toLowerCase().trim();
  const ip = req.ip || "unknown";

  try {
    const password = String(req.body.password || "");

    if (!isValidEmail(email)) {
      throw new HttpError(400, "Email inválido");
    }

    if (!isStrongPassword(password)) {
      throw new HttpError(
        400,
        "Password débil. Usa 10+ caracteres, mayúscula, minúscula, número y símbolo.",
      );
    }

    const existingUser = await findByEmail(email);
    if (existingUser) {
      throw new HttpError(409, "Usuario ya registrado");
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    const user = {
      id: crypto.randomUUID(),
      email,
      passwordHash,
      mfa: {
        enabled: false,
        secretBase32: null,
        tempSecretBase32: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await insertUser(user);
    await logAuthEvent("register", email, ip, true, { userAgent: req.get("user-agent") });

    return res.status(201).json({
      message: "Usuario registrado de forma segura con Argon2.",
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    await logAuthEvent("register", email || "unknown", ip, false, {
      userAgent: req.get("user-agent"),
      reason: err.message,
    });
    return next(err);
  }
}

async function mfaSetup(req, res, next) {
  const email = String(req.body.email || "").toLowerCase().trim();
  const ip = req.ip || "unknown";

  try {
    const user = await findByEmail(email);
    if (!user) {
      throw new HttpError(404, "Usuario no encontrado");
    }

    const mfaSecret = await generateMfaSecret(user.email, env.mfaIssuer);

    await updateUser(user.id, (current) => ({
      ...current,
      mfa: {
        ...current.mfa,
        tempSecretBase32: mfaSecret.base32,
      },
      updatedAt: new Date().toISOString(),
    }));

    await logAuthEvent("mfa_setup", email, ip, true, { userAgent: req.get("user-agent") });

    return res.json({
      message: "QR MFA generado. Escanéalo y luego verifica con un código TOTP.",
      mfaSetup: {
        qrCodeDataUrl: mfaSecret.qrCodeDataUrl,
        manualSecret: mfaSecret.base32,
      },
    });
  } catch (err) {
    await logAuthEvent("mfa_setup", email || "unknown", ip, false, {
      userAgent: req.get("user-agent"),
      reason: err.message,
    });
    return next(err);
  }
}

async function mfaVerifySetup(req, res, next) {
  const email = String(req.body.email || "").toLowerCase().trim();
  const ip = req.ip || "unknown";

  try {
    const token = String(req.body.token || "").trim();
    const user = await findByEmail(email);

    if (!user) {
      throw new HttpError(404, "Usuario no encontrado");
    }

    if (!user.mfa?.tempSecretBase32) {
      throw new HttpError(400, "No hay un setup MFA pendiente");
    }

    const valid = verifyTotpToken(user.mfa.tempSecretBase32, token);
    if (!valid) {
      throw new HttpError(401, "Código MFA inválido");
    }

    await updateUser(user.id, (current) => ({
      ...current,
      mfa: {
        enabled: true,
        secretBase32: current.mfa.tempSecretBase32,
        tempSecretBase32: null,
      },
      updatedAt: new Date().toISOString(),
    }));

    await logAuthEvent("mfa_verify_setup", email, ip, true, { userAgent: req.get("user-agent") });
    return res.json({ message: "MFA activado correctamente" });
  } catch (err) {
    await logAuthEvent("mfa_verify_setup", email || "unknown", ip, false, {
      userAgent: req.get("user-agent"),
      reason: err.message,
    });
    return next(err);
  }
}

async function login(req, res, next) {
  const email = String(req.body.email || "").toLowerCase().trim();
  const ip = req.ip || "unknown";

  try {
    const password = String(req.body.password || "");

    const lockStatus = isAccountLocked(email);
    if (lockStatus.isLocked) {
      throw new HttpError(429, "Cuenta bloqueada temporalmente por seguridad");
    }

    const user = await findByEmail(email);
    if (!user) {
      recordFailedAttempt(email, ip);
      throw new HttpError(401, "Credenciales inválidas");
    }

    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      recordFailedAttempt(email, ip);
      throw new HttpError(401, "Credenciales inválidas");
    }

    clearFailedAttempts(email);

    if (!user.mfa?.enabled || !user.mfa?.secretBase32) {
      throw new HttpError(
        403,
        "MFA no activado. Completa setup MFA antes de iniciar sesión.",
      );
    }

    const tempToken = signTempToken({
      sub: user.id,
      email: user.email,
      requires2fa: true,
    });

    await logAuthEvent("login_attempt", email, ip, true, { userAgent: req.get("user-agent") });

    return res.json({
      message: "Credenciales válidas. Ingresa código MFA para completar login.",
      requires2FA: true,
      tempToken,
    });
  } catch (err) {
    await logAuthEvent("login_attempt", email || "unknown", ip, false, {
      userAgent: req.get("user-agent"),
      reason: err.message,
    });
    return next(err);
  }
}

async function login2fa(req, res, next) {
  const ip = req.ip || "unknown";

  try {
    const tempToken = String(req.body.tempToken || "").trim();
    const mfaCode = String(req.body.mfaCode || "").trim();

    if (!tempToken || !mfaCode) {
      throw new HttpError(400, "tempToken y mfaCode son obligatorios");
    }

    const tempPayload = verifyTempToken(tempToken);
    const user = await findById(tempPayload.sub);

    if (!user) {
      throw new HttpError(401, "Sesión temporal inválida");
    }

    if (!user.mfa?.enabled || !user.mfa?.secretBase32) {
      throw new HttpError(403, "MFA no activado para este usuario");
    }

    const valid = verifyTotpToken(user.mfa.secretBase32, mfaCode);
    if (!valid) {
      throw new HttpError(401, "Código MFA incorrecto");
    }

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      amr: ["pwd", "mfa"],
    });
    const refreshToken = signRefreshToken({
      sub: user.id,
      email: user.email,
      tokenType: "refresh",
    });

    setAuthCookie(res, accessToken);
    setRefreshCookie(res, refreshToken);

    await logAuthEvent("login_2fa", user.email, ip, true, { userAgent: req.get("user-agent") });

    return res.json({
      message: "Login MFA exitoso. Cookie segura emitida.",
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    await logAuthEvent("login_2fa", "unknown", ip, false, {
      userAgent: req.get("user-agent"),
      reason: err.message,
    });
    return next(err);
  }
}

async function refreshToken(req, res, next) {
  const ip = req.ip || "unknown";

  try {
    const incomingRefreshToken = req.cookies[env.refreshCookieName];
    if (!incomingRefreshToken) {
      throw new HttpError(401, "No refresh token en cookie");
    }

    const payload = verifyRefreshToken(incomingRefreshToken);
    const user = await findById(payload.sub);

    if (!user) {
      throw new HttpError(401, "Usuario no encontrado");
    }

    const newAccessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      amr: ["refresh"],
    });

    const newRefreshToken = signRefreshToken({
      sub: user.id,
      email: user.email,
      tokenType: "refresh",
    });

    setAuthCookie(res, newAccessToken);
    setRefreshCookie(res, newRefreshToken);

    await logAuthEvent("refresh_token", user.email, ip, true, { userAgent: req.get("user-agent") });

    return res.json({
      message: "Token refrescado exitosamente",
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    await logAuthEvent("refresh_token", "unknown", ip, false, {
      userAgent: req.get("user-agent"),
      reason: err.message,
    });
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await findById(req.auth.sub);

    if (!user) {
      throw new HttpError(404, "Usuario no encontrado");
    }

    return res.json({
      id: user.id,
      email: user.email,
      mfaEnabled: Boolean(user.mfa?.enabled),
      createdAt: user.createdAt,
    });
  } catch (err) {
    return next(err);
  }
}

async function getAuditLog(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const events = await fetchAuditLog(limit);
    const report = await getSecurityReport();

    return res.json({
      message: "Audit log obtenido",
      securityReport: report,
      recentEvents: events,
      requestedBy: req.auth.email,
    });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    clearAuthCookie(res);
    clearRefreshCookie(res);

    const email = req.auth?.email || "unknown";
    const ip = req.ip || "unknown";
    await logAuthEvent("logout", email, ip, true, { userAgent: req.get("user-agent") });

    return res.json({ message: "Sesión cerrada" });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  mfaSetup,
  mfaVerifySetup,
  login,
  login2fa,
  refreshToken,
  getAuditLog,
  me,
  logout,
};
