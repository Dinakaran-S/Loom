const { pool } = require("../config/db");

async function findByUserAndProvider(userId, provider) {
  const { rows } = await pool.query(
    "SELECT encrypted_secret FROM provider_credentials WHERE user_id = $1 AND provider = $2 LIMIT 1",
    [userId, provider]
  );
  return rows[0] || null;
}

async function upsert({ userId, provider, encryptedSecret }) {
  await pool.query(
    `INSERT INTO provider_credentials (user_id, provider, encrypted_secret) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, provider) DO UPDATE SET encrypted_secret = EXCLUDED.encrypted_secret, updated_at = CURRENT_TIMESTAMP`,
    [userId, provider, encryptedSecret]
  );
}

module.exports = { findByUserAndProvider, upsert };
