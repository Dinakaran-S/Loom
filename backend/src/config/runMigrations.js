// Manual migration runner. Never wired into server startup on purpose —
// migrations against a real (esp. prod) DB should be a deliberate,
// reviewed step, not something that fires automatically on deploy.
const fs = require("fs");
const path = require("path");
const { pool } = require("./db");
const logger = require("../utils/logger");

async function run() {
  const dir = path.join(__dirname, "..", "migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    logger.info("migration_running", { file });
    await pool.query(sql);
  }
  logger.info("migrations_complete", { count: files.length });
  process.exit(0);
}

run().catch((err) => {
  logger.error("migration_failed", { error: err.message });
  process.exit(1);
});
