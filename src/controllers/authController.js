const crypto = require("crypto");
const argon2 = require("argon2");
const { HttpError } = require("../utils/errors");
const { isValidEmail, isStrongPassword } = require("../utils/validators");
const { findByEmail, insertUser } = require("../services/userStore");

async function register(req, res, next) {
  try {
    const email = String(req.body.email || "")
      .toLowerCase()
      .trim();
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

    // Argon2id es memory-hard: sube el costo de cracking con GPU.
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await insertUser(user);

    return res.status(201).json({
      message: "Usuario registrado de forma segura con Argon2.",
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
};
