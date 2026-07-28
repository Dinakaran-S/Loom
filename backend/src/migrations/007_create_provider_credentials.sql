CREATE TABLE IF NOT EXISTS provider_credentials (
  user_id CHAR(36) NOT NULL,
  provider VARCHAR(32) NOT NULL,
  encrypted_secret TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, provider),
  CONSTRAINT fk_provider_credentials_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
