const { pool } = require("../config/db");

async function bulkCreate(tasks) {
  // tasks: [{ id, projectId, agentName, description, dependsOn, sequenceOrder }]
  for (const t of tasks) {
    await pool.execute(
      `INSERT INTO tasks (id, project_id, agent_name, description, depends_on, sequence_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [t.id, t.projectId, t.agentName, t.description, JSON.stringify(t.dependsOn || []), t.sequenceOrder || 0]
    );
  }
}

async function listByProject(projectId) {
  const [rows] = await pool.query(
    "SELECT * FROM tasks WHERE project_id = ? ORDER BY sequence_order ASC",
    [projectId]
  );
  return rows.map((r) => ({
    ...r,
    depends_on: typeof r.depends_on === "string" ? JSON.parse(r.depends_on) : (r.depends_on || []),
  }));
}

async function updateStatus(id, status, runId = null) {
  await pool.execute(
    "UPDATE tasks SET status = ?, run_id = COALESCE(?, run_id) WHERE id = ?",
    [status, runId, id]
  );
}

module.exports = { bulkCreate, listByProject, updateStatus };
