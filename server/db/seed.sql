-- StudyHabits database seed

CREATE DATABASE IF NOT EXISTS studyhabits
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE studyhabits;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Emails are unique; the collation also makes lookups case-insensitive.
  UNIQUE KEY uq_users_email (email)
) DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- One synced study plan per user. The whole plan is a single JSON document;
-- `revision` guards against one device overwriting another's newer edit.
CREATE TABLE IF NOT EXISTS study_plans (
  user_id INT UNSIGNED NOT NULL,
  data JSON NOT NULL,
  revision INT UNSIGNED NOT NULL DEFAULT 1,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_study_plans_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
