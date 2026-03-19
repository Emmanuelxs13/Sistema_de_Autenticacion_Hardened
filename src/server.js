const path = require("node:path");
const os = require("node:os");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const authController = require("./controllers/authController");
const { authMiddleware } = require("./middleware/authMiddleware");
const { errorMiddleware } = require("./middleware/errorMiddleware");

const app = express();

if (env.nodeEnv === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json());
app.use(cookieParser());

app.use(
  helmet({
    contentSecurityPolicy: env.enableCsp
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
          },
        }
      : false,
    hsts: env.nodeEnv === "production",
    referrerPolicy: { policy: "no-referrer" },
  }),
);

const corsOptions = {
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const allowInDev = env.nodeEnv !== "production";
    const isTrusted = env.trustedOrigins.includes(origin);
    if (isTrusted || allowInDev) {
      return callback(null, true);
    }

    return callback(new Error("Origen no permitido por CORS"));
  },
};

app.use("/api", cors(corsOptions));
app.options(/^\/api\/.*/, cors(corsOptions));

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

app.get("/api/health/live", (_req, res) => {
  res.json({
    ok: true,
    uptimeSeconds: Math.floor(process.uptime()),
    time: new Date().toISOString(),
  });
});

app.get("/api/health/ready", (_req, res) => {
  const checks = {
    jwtSecretConfigured:
      env.nodeEnv !== "production" ||
      env.jwtSecret !== "change-me-in-production",
    cookieSecureInProduction:
      env.nodeEnv !== "production" || env.cookieSecure === true,
    trustedOriginsConfigured:
      env.nodeEnv !== "production" || env.trustedOrigins.length > 0,
  };

  const ready = Object.values(checks).every(Boolean);
  const statusCode = ready ? 200 : 503;

  res.status(statusCode).json({
    ok: ready,
    checks,
    nodeEnv: env.nodeEnv,
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
app.post("/api/auth/logout", authMiddleware, authController.logout);

app.use(errorMiddleware);

app.listen(env.port, env.host, () => {
  const interfaces = os.networkInterfaces();
  const lanIp = Object.values(interfaces)
    .flat()
    .find((item) => item?.family === "IPv4" && !item?.internal)?.address;

  console.log(`Servidor Sprint 5 corriendo en http://localhost:${env.port}`);
  if (lanIp) {
    console.log(`Acceso en red local: http://${lanIp}:${env.port}`);
  }
});
