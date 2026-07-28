const rateLimit = require("express-rate-limit");
const { fail } = require("../utils/apiResponse");

const makeLimiter = (windowMs, max, code, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => fail(res, 429, code, message),
  });

module.exports = {
  generalLimiter: makeLimiter(60 * 1000, 100, "RATE_LIMITED", "Too many requests — slow down."),
  loginLimiter: makeLimiter(15 * 60 * 1000, 5, "RATE_LIMITED", "Too many login attempts. Try again in 15 minutes."),
  // Agent generation calls a paid LLM API — cap it harder than normal routes.
  agentGenerateLimiter: makeLimiter(60 * 1000, 10, "RATE_LIMITED", "Too many generation requests. Wait a moment."),
};
