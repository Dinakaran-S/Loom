const { pool } = require("../config/db");

async function create({
  id, userId, agentName, provider, model,
  taskDescription, status, outputCode, outputExplanation,
  tokensUsed, errorMessage, taskId,
}) {
  await pool.query(
    `INSERT INTO agent_runs
      (id, user_id, agent_name, provider, model, task_description, status,
       output_code, output_explanation, tokens_used, error_message, task_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [id, userId, agentName, provider, model, taskDescription, status,
      outputCode || null, outputExplanation || null, tokensUsed || 0, errorMessage || null, taskId || null]
  );
  return findById(id);
}

async function findById(id) {
  const { rows } = await pool.query(
    "SELECT * FROM agent_runs WHERE id = $1 LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

async function listByUser(userId, { page, limit }) {
  const offset = (page - 1) * limit;
  const { rows } = await pool.query(
    `SELECT id, agent_name, provider, model, status, tokens_used, created_at
     FROM agent_runs WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  const { rows: [{ total }] } = await pool.query(
    "SELECT COUNT(*)::int as total FROM agent_runs WHERE user_id = $1",
    [userId]
  );
  return { rows, total };
}

module.exports = { create, findById, listByUser };
