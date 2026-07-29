const jwt = require("jsonwebtoken");
const axios = require("axios");
const env = require("../config/env");
const { UnauthorizedError, ForbiddenError } = require("../utils/errors");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return next(new UnauthorizedError("Missing access token"));

  try {
    // In production Supabase issues and refreshes access tokens. Verifying
    // through its Auth API also avoids embedding a JWT signing secret in the
    // browser. Keep local JWT validation only for tests and legacy local use.
    if (env.supabase.url && env.supabase.anonKey) {
      const { data } = await axios.get(`${env.supabase.url}/auth/v1/user`, {
        headers: { apikey: env.supabase.anonKey, Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      req.user = { id: data.id, role: data.app_metadata?.role || "user" };
      return next();
    }
    const payload = jwt.verify(token, env.jwt.accessSecret);
    // Payload is intentionally minimal: {id, role}. Never trust anything
    // else the client might try to smuggle in — role is re-checked here,
    // never read from the request body on subsequent routes.
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
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

module.exports = { requireAuth, requireRole };
