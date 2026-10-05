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
