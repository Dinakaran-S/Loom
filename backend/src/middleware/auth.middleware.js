const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { UnauthorizedError, ForbiddenError } = require("../utils/errors");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return next(new UnauthorizedError("Missing access token"));

  try {
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
