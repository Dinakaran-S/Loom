CREATE TABLE IF NOT EXISTS tasks (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  agent_name VARCHAR(60) NOT NULL,
  description TEXT NOT NULL,
  -- JSON array of task ids this task depends on. Not a strict FK (MySQL
  -- can't FK into a JSON array) — the orchestrator validates these exist
  -- within the same project before persisting the graph.
  depends_on JSON NULL,
  status ENUM('pending', 'running', 'done', 'error') NOT NULL DEFAULT 'pending',
  run_id CHAR(36) NULL,
  sequence_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_tasks_run FOREIGN KEY (run_id) REFERENCES agent_runs(id)
    ON DELETE SET NULL,
  INDEX idx_tasks_project (project_id)
) ENGINE=InnoDB;
