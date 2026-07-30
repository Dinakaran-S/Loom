const jwt = require("jsonwebtoken");
const axios = require("axios");
const env = require("../config/env");
const userModel = require("../models/user.model");
const { UnauthorizedError, ForbiddenError } = require("../utils/errors");

async function verifyAccessToken(token) {
  // Supabase is the authority when configured. Local JWTs remain available
  // only for tests and legacy installations with no Supabase configuration.
  if (env.nodeEnv !== "test" && env.supabase.url && env.supabase.anonKey) {
    const { data } = await axios.get(`${env.supabase.url}/auth/v1/user`, {
      headers: { apikey: env.supabase.anonKey, Authorization: `Bearer ${token}` },
      timeout: 5000,
    });
    const user = await userModel.upsertSupabaseUser({
      id: data.id,
      email: data.email,
      name: data.user_metadata?.name || data.user_metadata?.full_name,
      role: data.app_metadata?.role === "admin" ? "admin" : "user",
    });
    return { id: user.id, role: user.role };
  }

  const payload = jwt.verify(token, env.jwt.accessSecret);
  return { id: payload.id, role: payload.role };
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new UnauthorizedError("Missing access token"));

  try {
    req.user = await verifyAccessToken(token);
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Requires role: ${roles.join(" or ")}`));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole, verifyAccessToken };
