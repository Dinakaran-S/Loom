// Lightweight structured logger. Swap for pino/winston later without
// changing call sites — every log call already goes through here.
const env = require("../config/env");

function base(level, event, meta = {}) {
  const entry = { level, event, time: new Date().toISOString(), ...meta };
  // Never log secrets/tokens/passwords — callers must not pass them in meta.
  const line = env.nodeEnv === "production" ? JSON.stringify(entry) : entry;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

module.exports = {
  info: (event, meta) => base("info", event, meta),
  warn: (event, meta) => base("warn", event, meta),
  error: (event, meta) => base("error", event, meta),
  debug: (event, meta) => {
    if (env.nodeEnv !== "production") base("debug", event, meta);
  },
};
