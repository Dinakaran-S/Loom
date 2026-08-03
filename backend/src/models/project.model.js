const { pool } = require("../config/db");
const { ConflictError } = require("../utils/errors");

async function create({ id, userId, name, spec }) {
  await pool.query(
    "INSERT INTO projects (id, user_id, name, spec) VALUES ($1, $2, $3, $4)",
    [id, userId, name, spec]
  );
  return findById(id);
}

async function findById(id) {
  const { rows } = await pool.query("SELECT * FROM projects WHERE id = $1 LIMIT 1", [id]);
  return rows[0] || null;
}

async function findByIdForUser(id, userId) {
  const { rows } = await pool.query("SELECT * FROM projects WHERE id = $1 AND user_id = $2 LIMIT 1", [id, userId]);
  return rows[0] || null;
}

async function updateStatus(id, status) {
  await pool.query("UPDATE projects SET status = $1 WHERE id = $2", [status, id]);
}

async function claimRun(id, userId) {
  const result = await pool.query(
    "UPDATE projects SET status = 'running' WHERE id = $1 AND user_id = $2 AND status IN ('planning', 'done', 'failed')",
    [id, userId]
  );
  if (result.rowCount !== 1) throw new ConflictError("This project is already running or cannot be started");
}

async function setIntegrationReport(id, report) {
  await pool.query(
    "UPDATE projects SET integration_report = $1, status = $2 WHERE id = $3",
    [report, report.approved ? "done" : "failed", id]
  );
}

async function listByUser(userId, { page, limit }) {
  const offset = (page - 1) * limit;
  const { rows } = await pool.query(
    `SELECT id, name, status, created_at FROM projects
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  const { rows: [{ total }] } = await pool.query(
    "SELECT COUNT(*)::int as total FROM projects WHERE user_id = $1", [userId]
  );
  return { rows, total };
}

module.exports = { create, findById, findByIdForUser, updateStatus, claimRun, setIntegrationReport, listByUser };
