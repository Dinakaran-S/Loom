const { Pool } = require("pg");
const env = require("./env");
const logger = require("../utils/logger");

const pool = new Pool({
  connectionString: env.db.connectionString,
  max: env.db.connectionLimit,
  ssl: env.nodeEnv === "production" ? { rejectUnauthorized: false } : undefined,
});

async function checkConnection() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (err) {
    logger.error("db_connection_failed", { error: err.message });
    return false;
  }
}

module.exports = { pool, checkConnection };
