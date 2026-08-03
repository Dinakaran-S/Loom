CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL, provider TEXT NOT NULL CHECK (provider IN ('free', 'paid')),
  model TEXT, task_description TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  output_code TEXT, output_explanation TEXT, tokens_used INTEGER NOT NULL DEFAULT 0,
  error_message TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user ON agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created ON agent_runs(created_at);
