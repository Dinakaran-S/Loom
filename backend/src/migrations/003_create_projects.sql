CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  spec TEXT NOT NULL,
  status ENUM('planning', 'running', 'done', 'failed') NOT NULL DEFAULT 'planning',
  integration_report JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_projects_user (user_id)
) ENGINE=InnoDB;
