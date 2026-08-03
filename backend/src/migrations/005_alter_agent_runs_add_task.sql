ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_agent_runs_task ON agent_runs(task_id);
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_run FOREIGN KEY (run_id) REFERENCES agent_runs(id) ON DELETE SET NULL;
