const { pool } = require("../config/db");

async function findByUserAndProvider(userId, provider) {
  const [rows] = await pool.execute(
    "SELECT encrypted_secret FROM provider_credentials WHERE user_id = ? AND provider = ? LIMIT 1",
    [userId, provider]
  );
  return rows[0] || null;
}

async function upsert({ userId, provider, encryptedSecret }) {
  await pool.execute(
    `INSERT INTO provider_credentials (user_id, provider, encrypted_secret) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE encrypted_secret = VALUES(encrypted_secret)`,
    [userId, provider, encryptedSecret]
  );
}

module.exports = { findByUserAndProvider, upsert };
