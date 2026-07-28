const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const env = require("./src/config/env");
const logger = require("./src/utils/logger");
const routes = require("./src/routes");
const errorHandler = require("./src/middleware/errorHandler.middleware");
const { generalLimiter } = require("./src/middleware/rateLimiter.middleware");
const { fail } = require("./src/utils/apiResponse");

const app = express();

// --- security & parsing (order matters) ---
app.use(helmet());
app.use(
  cors({
    origin: env.cors.origin,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" })); // cap body size — DoS guard
app.use(cookieParser());
app.use(
  morgan(env.nodeEnv === "production" ? "combined" : "dev", {
    stream: { write: (msg) => logger.info("http_request", { line: msg.trim() }) },
  })
);
app.use(generalLimiter);

// --- routes ---
app.use("/api", routes);

// 404 for anything unmatched
app.use((req, res) => fail(res, 404, "NOT_FOUND", "Route not found"));

// centralized error handler — must be last
app.use(errorHandler);

module.exports = app;
