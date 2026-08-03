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
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const { rows: appliedRows } = await pool.query("SELECT filename FROM schema_migrations");
  const applied = new Set(appliedRows.map((row) => row.filename));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    logger.info("migration_running", { file });
    try {
      await pool.query(sql);
    } catch (err) {
      // Earlier Loom versions had no migration ledger. Mark an already-applied
      // additive migration as complete rather than blocking an upgrade.
      if (!["42701", "42P07", "42710"].includes(err.code)) throw err;
      logger.warn("migration_already_applied", { file, code: err.code });
    }
    await pool.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
  }
  logger.info("migrations_complete", { count: files.length });
  process.exit(0);
}

run().catch((err) => {
  logger.error("migration_failed", { error: err.message });
  process.exit(1);
});
