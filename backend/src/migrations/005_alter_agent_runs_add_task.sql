ALTER TABLE agent_runs
  ADD COLUMN task_id CHAR(36) NULL AFTER agent_name,
  ADD CONSTRAINT fk_agent_runs_task FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE SET NULL,
  ADD INDEX idx_agent_runs_task (task_id);
