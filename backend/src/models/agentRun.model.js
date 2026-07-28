const { pool } = require("../config/db");

async function create({
  id, userId, agentName, provider, model,
  taskDescription, status, outputCode, outputExplanation,
  tokensUsed, errorMessage, taskId,
}) {
  await pool.execute(
    `INSERT INTO agent_runs
      (id, user_id, agent_name, provider, model, task_description, status,
       output_code, output_explanation, tokens_used, error_message, task_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, agentName, provider, model, taskDescription, status,
      outputCode || null, outputExplanation || null, tokensUsed || 0, errorMessage || null, taskId || null]
  );
  return findById(id);
}

async function findById(id) {
  const [rows] = await pool.execute(
    "SELECT * FROM agent_runs WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

async function listByUser(userId, { page, limit }) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT id, agent_name, provider, model, status, tokens_used, created_at
     FROM agent_runs WHERE user_id = ?
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  const [[{ total }]] = await pool.query(
    "SELECT COUNT(*) as total FROM agent_runs WHERE user_id = ?",
    [userId]
  );
  return { rows, total };
}

module.exports = { create, findById, listByUser };
