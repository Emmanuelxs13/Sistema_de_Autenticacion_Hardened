const express = require("express");
const env = require("./config/env");
const authController = require("./controllers/authController");
const { errorMiddleware } = require("./middleware/errorMiddleware");

const app = express();

// Permite recibir JSON en body para endpoints REST.
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    sprint: 1,
    service: "hardened-auth",
    time: new Date().toISOString(),
  });
});

// Sprint 1: endpoint de registro seguro con Argon2.
app.post("/api/auth/register", authController.register);

// Middleware final para errores controlados y no controlados.
app.use(errorMiddleware);

app.listen(env.port, () => {
  console.log(`Servidor Sprint 1 corriendo en http://localhost:${env.port}`);
});
