-- ============================================================
--  Screenlytics — MySQL Schema
--  Run once:  mysql -u root -p < config/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS screenlytics_db;
USE screenlytics_db;

-- ── Users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(50)  NOT NULL,
  last_name     VARCHAR(50)  NOT NULL DEFAULT '',
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Screen-time logs ─────────────────────────────────────
-- One row per user per calendar day.
CREATE TABLE IF NOT EXISTS screen_logs (
  id            INT    AUTO_INCREMENT PRIMARY KEY,
  user_id       INT    NOT NULL,
  log_date      DATE   NOT NULL,          -- YYYY-MM-DD
  study_mins    INT    NOT NULL DEFAULT 0,
  social_mins   INT    NOT NULL DEFAULT 0,
  ent_mins      INT    NOT NULL DEFAULT 0,
  other_mins    INT    NOT NULL DEFAULT 0,
  total_mins    INT    NOT NULL DEFAULT 0,
  burnout_score DECIMAL(4,1) NOT NULL DEFAULT 0,
  burnout_cat   ENUM('Normal','Mid','Excess') NOT NULL DEFAULT 'Normal',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_date (user_id, log_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Planner tasks ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  title      VARCHAR(255) NOT NULL,
  time_slot  VARCHAR(30)  DEFAULT NULL,   -- e.g. "09:00 AM"
  is_done    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
