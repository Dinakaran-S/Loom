class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;
  }
}
class UnauthorizedError extends AppError {
  constructor(message = "Not authenticated") {
    super(message, 401, "UNAUTHORIZED");
  }
}
class ForbiddenError extends AppError {
  constructor(message = "Not authorized") {
    super(message, 403, "FORBIDDEN");
  }
}
class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}
class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}
class ProviderError extends AppError {
  constructor(message = "Upstream AI provider failed") {
    super(message, 502, "PROVIDER_ERROR");
  }
}
class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporarily unavailable") {
    super(message, 503, "SERVICE_UNAVAILABLE");
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ProviderError,
  ServiceUnavailableError,
};
