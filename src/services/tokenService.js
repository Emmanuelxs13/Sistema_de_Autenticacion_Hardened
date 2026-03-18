const jwt = require("jsonwebtoken");
const env = require("../config/env");

function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });
}

function signTempToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.tempTokenExpiresIn,
    issuer: env.jwtIssuer,
    audience: env.tempJwtAudience,
  });
}

function verifyTempToken(token) {
  return jwt.verify(token, env.jwtSecret, {
    issuer: env.jwtIssuer,
    audience: env.tempJwtAudience,
  });
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signTempToken,
  verifyTempToken,
};
