const { pool } = require("../config/db");

async function listByUser(userId) {
  const [rows] = await pool.execute(
    "SELECT agent_name, provider FROM agent_preferences WHERE user_id = ?",
    [userId]
  );
  return rows;
}

async function upsert({ userId, agentName, provider }) {
  await pool.execute(
    `INSERT INTO agent_preferences (user_id, agent_name, provider) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE provider = VALUES(provider)`,
    [userId, agentName, provider]
  );
  return { agent_name: agentName, provider };
}

module.exports = { listByUser, upsert };
