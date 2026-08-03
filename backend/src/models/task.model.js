const { pool } = require("../config/db");

async function bulkCreate(tasks) {
  // tasks: [{ id, projectId, agentName, description, dependsOn, sequenceOrder }]
  for (const t of tasks) {
    await pool.query(
      `INSERT INTO tasks (id, project_id, agent_name, description, depends_on, sequence_order)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [t.id, t.projectId, t.agentName, t.description, t.dependsOn || [], t.sequenceOrder || 0]
    );
  }
}

async function listByProject(projectId) {
  const { rows } = await pool.query(
    "SELECT * FROM tasks WHERE project_id = $1 ORDER BY sequence_order ASC",
    [projectId]
  );
  return rows.map((r) => ({
    ...r,
    depends_on: typeof r.depends_on === "string" ? JSON.parse(r.depends_on) : (r.depends_on || []),
  }));
}

async function updateStatus(id, status, runId = null) {
  await pool.query(
    "UPDATE tasks SET status = $1, run_id = COALESCE($2, run_id) WHERE id = $3",
    [status, runId, id]
  );
}

module.exports = { bulkCreate, listByProject, updateStatus };
