const env = require("../config/env");
const { verifyAccessToken } = require("../services/tokenService");

function authMiddleware(req, res, next) {
  try {
    // Leemos el JWT desde cookie HttpOnly para evitar exposición a JavaScript.
    const token = req.cookies[env.authCookieName];

    if (!token) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const payload = verifyAccessToken(token);
    req.auth = payload;
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }

    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

module.exports = {
  authMiddleware,
};
