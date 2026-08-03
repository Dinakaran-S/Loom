const { pool } = require("../config/db");

async function listByUser(userId) {
  const { rows } = await pool.query(
    "SELECT agent_name, provider FROM agent_preferences WHERE user_id = $1",
    [userId]
  );
  return rows;
}

async function upsert({ userId, agentName, provider }) {
  await pool.query(
    `INSERT INTO agent_preferences (user_id, agent_name, provider) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, agent_name) DO UPDATE SET provider = EXCLUDED.provider`,
    [userId, agentName, provider]
  );
  return { agent_name: agentName, provider };
}

module.exports = { listByUser, upsert };
