// controllers/log.controller.js

const { pool }        = require('../config/db');
const { calcBurnout } = require('../utils/burnout');

// ── POST /api/logs — upsert a day's log ──────────────────
async function upsertLog(req, res, next) {
  try {
    const userId = req.userId;
    const { logDate, studyMins = 0, socialMins = 0, entMins = 0, otherMins = 0 } = req.body;

    if (!logDate) {
      return res.status(400).json({ success: false, message: 'logDate (YYYY-MM-DD) is required' });
    }

    const totalMins = studyMins + socialMins + entMins + otherMins;
    if (totalMins <= 0) {
      return res.status(400).json({ success: false, message: 'At least one category must have time > 0' });
    }

    const { score, category } = calcBurnout(totalMins, socialMins, entMins);

    // INSERT … ON DUPLICATE KEY UPDATE handles both create & edit
    await pool.query(
      `INSERT INTO screen_logs
         (user_id, log_date, study_mins, social_mins, ent_mins, other_mins, total_mins, burnout_score, burnout_cat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         study_mins = VALUES(study_mins),
         social_mins = VALUES(social_mins),
         ent_mins = VALUES(ent_mins),
         other_mins = VALUES(other_mins),
         total_mins = VALUES(total_mins),
         burnout_score = VALUES(burnout_score),
         burnout_cat = VALUES(burnout_cat)`,
      [userId, logDate, studyMins, socialMins, entMins, otherMins, totalMins, score, category]
    );

    return res.json({
      success: true,
      message: 'Log saved',
      data: { logDate, totalMins, studyMins, socialMins, entMins, otherMins, score, category },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/logs — all logs for logged-in user ──────────
async function getLogs(req, res, next) {
  try {
    const userId = req.userId;
    const { limit = 30 } = req.query;

    const [rows] = await pool.query(
      `SELECT
         id, log_date AS logDate,
         study_mins AS studyMins, social_mins AS socialMins,
         ent_mins AS entMins, other_mins AS otherMins,
         total_mins AS totalMins,
         burnout_score AS score, burnout_cat AS category,
         created_at, updated_at
       FROM screen_logs
       WHERE user_id = ?
       ORDER BY log_date DESC
       LIMIT ?`,
      [userId, parseInt(limit)]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/logs/:date — single day ─────────────────────
async function getLogByDate(req, res, next) {
  try {
    const userId   = req.userId;
    const { date } = req.params;   // YYYY-MM-DD

    const [rows] = await pool.query(
      `SELECT
         id, log_date AS logDate,
         study_mins AS studyMins, social_mins AS socialMins,
         ent_mins AS entMins, other_mins AS otherMins,
         total_mins AS totalMins,
         burnout_score AS score, burnout_cat AS category
       FROM screen_logs WHERE user_id = ? AND log_date = ?`,
      [userId, date]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No log found for this date' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/logs/:date ───────────────────────────────
async function deleteLog(req, res, next) {
  try {
    const userId   = req.userId;
    const { date } = req.params;

    const [result] = await pool.query(
      'DELETE FROM screen_logs WHERE user_id = ? AND log_date = ?',
      [userId, date]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }

    return res.json({ success: true, message: 'Log deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { upsertLog, getLogs, getLogByDate, deleteLog };
