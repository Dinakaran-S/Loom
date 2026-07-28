const { pool } = require("../config/db");
const { ConflictError } = require("../utils/errors");

async function create({ id, userId, name, spec }) {
  await pool.execute(
    "INSERT INTO projects (id, user_id, name, spec) VALUES (?, ?, ?, ?)",
    [id, userId, name, spec]
  );
  return findById(id);
}

async function findById(id) {
  const [rows] = await pool.execute("SELECT * FROM projects WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
}

async function findByIdForUser(id, userId) {
  const [rows] = await pool.execute("SELECT * FROM projects WHERE id = ? AND user_id = ? LIMIT 1", [id, userId]);
  return rows[0] || null;
}

async function updateStatus(id, status) {
  await pool.execute("UPDATE projects SET status = ? WHERE id = ?", [status, id]);
}

async function claimRun(id, userId) {
  const [result] = await pool.execute(
    "UPDATE projects SET status = 'running' WHERE id = ? AND user_id = ? AND status IN ('planning', 'done', 'failed')",
    [id, userId]
  );
  if (result.affectedRows !== 1) throw new ConflictError("This project is already running or cannot be started");
}

async function setIntegrationReport(id, report) {
  await pool.execute(
    "UPDATE projects SET integration_report = ?, status = ? WHERE id = ?",
    [JSON.stringify(report), report.approved ? "done" : "failed", id]
  );
}

async function listByUser(userId, { page, limit }) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT id, name, status, created_at FROM projects
     WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  const [[{ total }]] = await pool.query(
    "SELECT COUNT(*) as total FROM projects WHERE user_id = ?", [userId]
  );
  return { rows, total };
}

module.exports = { create, findById, findByIdForUser, updateStatus, claimRun, setIntegrationReport, listByUser };
