const path = require("node:path");
const express = require("express");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const authController = require("./controllers/authController");
const { authMiddleware } = require("./middleware/authMiddleware");
const { errorMiddleware } = require("./middleware/errorMiddleware");

const app = express();

// Permite recibir JSON en body para endpoints REST.
app.use(express.json());
app.use(cookieParser());

// Sprint 4: frontend plano de presentación y demo del flujo completo.
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    sprint: 4,
    service: "hardened-auth",
    time: new Date().toISOString(),
  });
});

// Registro seguro con Argon2.
app.post("/api/auth/register", authController.register);
// Setup MFA con QR y activación por código TOTP.
app.post("/api/auth/mfa/setup", authController.mfaSetup);
app.post("/api/auth/mfa/verify-setup", authController.mfaVerifySetup);
// Login hardened en dos pasos (password + MFA).
app.post("/api/auth/login", authController.login);
app.post("/api/auth/login/2fa", authController.login2fa);
app.get("/api/auth/me", authMiddleware, authController.me);
app.post("/api/auth/logout", authController.logout);

// Middleware final para errores controlados y no controlados.
app.use(errorMiddleware);

app.listen(env.port, () => {
  console.log(`Servidor Sprint 4 corriendo en http://localhost:${env.port}`);
});
