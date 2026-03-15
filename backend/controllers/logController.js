const db = require('../config/db');

// ✅ Helper: replicate frontend calcBurnout logic
function calcBurnout(totalMins, socialMins, entMins) {
  // Score based on total screen time
  let score;
  if (totalMins <= 120)      score = parseFloat((totalMins / 40).toFixed(1));
  else if (totalMins <= 300) score = parseFloat((3 + ((totalMins - 120) / 60)).toFixed(1));
  else                       score = parseFloat(Math.min(10, 6 + ((totalMins - 300) / 100)).toFixed(1));

  // Bump score if social/entertainment is dominant
  const highRiskMins = socialMins + entMins;
  if (highRiskMins > totalMins * 0.6) score = Math.min(10, score + 1);

  // Category
  const category =
    score <= 3 ? 'Normal' :
    score <= 6 ? 'Mid'    : 'Excess';

  return { score, category };
}

// ✅ UPSERT LOG (Insert or Update for same date)
exports.upsertLog = async (req, res) => {
  const userId = req.user.id;
  const { isoDate, totalMins, study, social, ent, other } = req.body;

  // Validation
  if (!isoDate || !totalMins) {
    return res.status(400).json({ message: 'Date and total minutes are required' });
  }
  if (!totalMins || totalMins <= 0) {
    return res.status(400).json({ message: 'Please enter at least one category' });
  }

  try {
    // Calculate burnout score same as frontend
    const { score, category } = calcBurnout(totalMins, social || 0, ent || 0);

    // Check if log already exists for this date
    const [existing] = await db.query(
      'SELECT id FROM screen_logs WHERE user_id = ? AND log_date = ?',
      [userId, isoDate]
    );

    if (existing.length > 0) {
      // ✅ UPDATE existing log
      await db.query(
        `UPDATE screen_logs 
         SET total_mins = ?, study_mins = ?, social_mins = ?, 
             ent_mins = ?, other_mins = ?, score = ?, category = ?
         WHERE user_id = ? AND log_date = ?`,
        [totalMins, study || 0, social || 0, ent || 0, other || 0, score, category, userId, isoDate]
      );
    } else {
      // ✅ INSERT new log
      await db.query(
        `INSERT INTO screen_logs 
         (user_id, log_date, total_mins, study_mins, social_mins, ent_mins, other_mins, score, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, isoDate, totalMins, study || 0, social || 0, ent || 0, other || 0, score, category]
      );
    }

    // Also upsert burnout_scores table with latest score
    const [existingBurnout] = await db.query(
      'SELECT id FROM burnout_scores WHERE user_id = ? AND DATE(recorded_at) = ?',
      [userId, isoDate]
    );

    if (existingBurnout.length > 0) {
      await db.query(
        'UPDATE burnout_scores SET score = ? WHERE user_id = ? AND DATE(recorded_at) = ?',
        [score, userId, isoDate]
      );
    } else {
      await db.query(
        'INSERT INTO burnout_scores (user_id, score, recorded_at) VALUES (?, ?, ?)',
        [userId, score, isoDate]
      );
    }

    res.status(200).json({
      message: 'Log saved successfully',
      score,
      category
    });

  } catch (err) {
    console.error('Upsert log error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ GET ALL LOGS (for history list)
exports.getLogs = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT 
        DATE_FORMAT(log_date, '%Y-%m-%d') AS isoDate,
        total_mins                        AS totalMins,
        study_mins                        AS study,
        social_mins                       AS social,
        ent_mins                          AS ent,
        other_mins                        AS other,
        score,
        category
       FROM screen_logs
       WHERE user_id = ?
       ORDER BY log_date DESC`,
      [userId]
    );

    // Add displayDate (DD / MM / YYYY) for each log
    const logs = rows.map(log => ({
      ...log,
      displayDate: log.isoDate.split('-').reverse().join(' / ')
    }));

    res.status(200).json({ logs });

  } catch (err) {
    console.error('Get logs error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};