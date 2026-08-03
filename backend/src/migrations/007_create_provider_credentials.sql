CREATE TABLE IF NOT EXISTS provider_credentials (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, provider TEXT NOT NULL,
  encrypted_secret TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, provider)
);
