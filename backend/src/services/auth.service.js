const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const env = require("../config/env");
const userModel = require("../models/user.model");
const { UnauthorizedError, ConflictError } = require("../utils/errors");

const BCRYPT_COST = 12;

function signAccessToken(user) {
  // Payload is minimal on purpose — never put password/PII in a JWT.
  return jwt.sign({ id: user.id, role: user.role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ id: user.id }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

async function register({ email, password, name }) {
  const existing = await userModel.findByEmail(email);
  if (existing) throw new ConflictError("An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await userModel.create({ id: uuidv4(), email, passwordHash, name });
  return {
    user,
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}

async function login({ email, password }) {
  const user = await userModel.findByEmail(email);
  // Same generic error whether the email doesn't exist or the password is
  // wrong — don't let the response shape leak which one it was.
  if (!user) throw new UnauthorizedError("Invalid email or password");

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new UnauthorizedError("Invalid email or password");

  const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role };
  return {
    user: safeUser,
    accessToken: signAccessToken(safeUser),
    refreshToken: signRefreshToken(safeUser),
  };
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }
  const user = await userModel.findById(payload.id);
  if (!user) throw new UnauthorizedError("User no longer exists");
  return { accessToken: signAccessToken(user) };
}

module.exports = { register, login, refresh };
