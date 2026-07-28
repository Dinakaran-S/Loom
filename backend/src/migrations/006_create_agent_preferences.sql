CREATE TABLE IF NOT EXISTS agent_preferences (
  user_id CHAR(36) NOT NULL,
  agent_name VARCHAR(64) NOT NULL,
  provider ENUM('free', 'paid') NOT NULL DEFAULT 'free',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, agent_name),
  CONSTRAINT fk_agent_preferences_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
