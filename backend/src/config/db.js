const mysql = require("mysql2/promise");
const env = require("./env");
const logger = require("../utils/logger");

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  connectionLimit: env.db.connectionLimit,
  waitForConnections: true,
  queueLimit: 0,
  dateStrings: false,
});

async function checkConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch (err) {
    logger.error("db_connection_failed", { error: err.message });
    return false;
  }
}

module.exports = { pool, checkConnection };
