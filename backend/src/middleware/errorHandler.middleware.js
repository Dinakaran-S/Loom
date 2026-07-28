const env = require("../config/env");
const logger = require("../utils/logger");
const { fail } = require("../utils/apiResponse");

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  // Convert known database connectivity failures into a useful, safe response.
  // Without this, a local setup issue is presented to the UI as an opaque 500.
  if (!err.isOperational && ["ER_ACCESS_DENIED_ERROR", "ECONNREFUSED", "ER_BAD_DB_ERROR"].includes(err.code)) {
    const { ServiceUnavailableError } = require("../utils/errors");
    err = new ServiceUnavailableError("Authentication database is unavailable. Check DB credentials and run migrations.");
  }
  const isOperational = err.isOperational === true;
  const statusCode = isOperational ? err.statusCode : 500;
  const code = isOperational ? err.code : "INTERNAL_ERROR";

  logger.error("request_error", {
    route: req.originalUrl,
    method: req.method,
    userId: req.user ? req.user.id : null,
    statusCode,
    code,
    message: err.message,
    stack: env.nodeEnv !== "production" ? err.stack : undefined,
  });

  // Never leak stack traces or internal details to the client in prod.
  const message = isOperational
    ? err.message
    : "Something went wrong on our end. Please try again.";

  const body = { success: false, error: { code, message } };
  if (isOperational && err.details) body.error.details = err.details;

  res.status(statusCode).json(body);
};
