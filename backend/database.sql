
-- ============================================================
--  TABLE 1 : users
--  Purpose  : Login credentials for every registered user.
--             Root table — every other table links here.
-- ============================================================
CREATE TABLE users (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
--  TABLE 2 : screen_logs
--  Purpose  : One screen-time log per user per day.
--             UNIQUE(user_id, log_date) enforces one row
--             per user per day — enables upsert pattern.
-- ============================================================
CREATE TABLE screen_logs (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  user_id      INT          NOT NULL,
  log_date     DATE         NOT NULL,
  total_mins   INT          NOT NULL DEFAULT 0,
  study_mins   INT          NOT NULL DEFAULT 0,
  social_mins  INT          NOT NULL DEFAULT 0,
  ent_mins     INT          NOT NULL DEFAULT 0,
  other_mins   INT          NOT NULL DEFAULT 0,
  score        DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  category     VARCHAR(10)  NOT NULL DEFAULT 'Normal',
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_date (user_id, log_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ============================================================
--  TABLE 3 : burnout_scores
--  Purpose  : Timestamped score history.
--             Multiple rows per day allowed — tracks
--             every score change throughout the day.
-- ============================================================
CREATE TABLE burnout_scores (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  score       DECIMAL(4,2) NOT NULL,
  recorded_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ============================================================
--  TABLE 4 : tasks
--  Purpose  : Planner tasks scheduled by the user.
--             type ENUM enforces only valid task types.
--             done TINYINT(1) = MySQL boolean (0/1).
-- ============================================================
CREATE TABLE tasks (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  user_id      INT          NOT NULL,
  title        VARCHAR(200) NOT NULL,
  type         ENUM('study','exercise','break','nophone')
                            NOT NULL DEFAULT 'study',
  iso_date     DATE         NOT NULL,
  display_date VARCHAR(20)  NOT NULL,
  time         TIME         NOT NULL,
  duration     INT          NOT NULL DEFAULT 60,
  done         TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ============================================================
--  TABLE 5 : notification_settings
--  Purpose  : One row of preferences per user.
--             UNIQUE(user_id) = max one row per user.
--             Auto-created on first Profile page visit.
--             updated_at refreshes on every change.
-- ============================================================
CREATE TABLE notification_settings (
  id               INT        AUTO_INCREMENT PRIMARY KEY,
  user_id          INT        NOT NULL UNIQUE,
  daily_reminders  TINYINT(1) NOT NULL DEFAULT 1,
  burnout_alerts   TINYINT(1) NOT NULL DEFAULT 1,
  weekly_report    TINYINT(1) NOT NULL DEFAULT 0,
  updated_at       TIMESTAMP  DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


