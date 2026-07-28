CREATE TABLE IF NOT EXISTS agent_runs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  agent_name VARCHAR(60) NOT NULL,
  provider ENUM('free', 'paid') NOT NULL,
  model VARCHAR(120) NULL,
  task_description TEXT NOT NULL,
  status ENUM('success', 'error') NOT NULL,
  output_code MEDIUMTEXT NULL,
  output_explanation TEXT NULL,
  tokens_used INT NOT NULL DEFAULT 0,
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_agent_runs_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_agent_runs_user (user_id),
  INDEX idx_agent_runs_created (created_at)
) ENGINE=InnoDB;
