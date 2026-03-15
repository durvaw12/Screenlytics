// controllers/analytics.controller.js

const { pool } = require('../config/db');

// ── GET /api/analytics/summary ───────────────────────────
// Returns totals and averages for the last N days (default 7)
async function getSummary(req, res, next) {
  try {
    const userId = req.userId;
    const days   = parseInt(req.query.days) || 7;

    const [rows] = await pool.query(
      `SELECT
         COUNT(*)            AS daysLogged,
         SUM(total_mins)     AS totalMins,
         AVG(total_mins)     AS avgDailyMins,
         AVG(burnout_score)  AS avgScore,
         MAX(burnout_score)  AS maxScore,
         MIN(burnout_score)  AS minScore,
         SUM(study_mins)     AS studyMins,
         SUM(social_mins)    AS socialMins,
         SUM(ent_mins)       AS entMins,
         SUM(other_mins)     AS otherMins,
         SUM(CASE WHEN burnout_cat = 'Normal' THEN 1 ELSE 0 END) AS normalDays,
         SUM(CASE WHEN burnout_cat = 'Mid'    THEN 1 ELSE 0 END) AS midDays,
         SUM(CASE WHEN burnout_cat = 'Excess' THEN 1 ELSE 0 END) AS excessDays
       FROM screen_logs
       WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [userId, days]
    );

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/analytics/chart — per-day data for graph ────
async function getChartData(req, res, next) {
  try {
    const userId = req.userId;
    const days   = parseInt(req.query.days) || 7;

    const [rows] = await pool.query(
      `SELECT
         log_date      AS date,
         total_mins    AS totalMins,
         study_mins    AS studyMins,
         social_mins   AS socialMins,
         ent_mins      AS entMins,
         other_mins    AS otherMins,
         burnout_score AS score,
         burnout_cat   AS category
       FROM screen_logs
       WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY log_date ASC`,
      [userId, days]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/analytics/streak ────────────────────────────
// How many consecutive days has the user logged?
async function getStreak(req, res, next) {
  try {
    const userId = req.userId;
    const [rows] = await pool.query(
      `SELECT log_date FROM screen_logs WHERE user_id = ? ORDER BY log_date DESC`,
      [userId]
    );

    let streak = 0;
    let expected = new Date();
    expected.setHours(0, 0, 0, 0);

    for (const row of rows) {
      const d = new Date(row.log_date);
      d.setHours(0, 0, 0, 0);
      const diff = (expected - d) / 86400000;
      if (diff === 0 || diff === 1) {
        streak++;
        expected = d;
      } else {
        break;
      }
    }

    return res.json({ success: true, data: { streak } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, getChartData, getStreak };
