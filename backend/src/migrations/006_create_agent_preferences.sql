CREATE TABLE IF NOT EXISTS agent_preferences (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL, provider TEXT NOT NULL DEFAULT 'free' CHECK (provider IN ('free', 'paid')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (user_id, agent_name)
);
