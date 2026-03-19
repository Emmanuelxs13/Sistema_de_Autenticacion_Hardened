const path = require("node:path");
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const authController = require("./controllers/authController");
const { authMiddleware } = require("./middleware/authMiddleware");
const { errorMiddleware } = require("./middleware/errorMiddleware");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(helmet());

const loginLimiter = rateLimit({
  windowMs: env.loginRateLimitWindowMs,
  max: env.loginRateLimitMaxAttempts,
  message: "Demasiados intentos de login. Intenta más tarde.",
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", generalLimiter);
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    sprint: 5,
    service: "hardened-auth",
    time: new Date().toISOString(),
  });
});

app.post("/api/auth/register", authController.register);
app.post("/api/auth/mfa/setup", authController.mfaSetup);
app.post(
  "/api/auth/mfa/verify-setup",
  loginLimiter,
  authController.mfaVerifySetup,
);
app.post("/api/auth/login", loginLimiter, authController.login);
app.post("/api/auth/login/2fa", loginLimiter, authController.login2fa);
app.post("/api/auth/refresh", authController.refreshToken);
app.get("/api/auth/audit-log", authMiddleware, authController.getAuditLog);
app.get("/api/auth/me", authMiddleware, authController.me);
app.post("/api/auth/logout", authController.logout);

app.use(errorMiddleware);

app.listen(env.port, () => {
  console.log(`Servidor Sprint 5 corriendo en http://localhost:${env.port}`);
});
