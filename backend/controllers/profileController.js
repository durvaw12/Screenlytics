const db     = require('../config/db');
const bcrypt = require('bcryptjs');

// ✅ GET PROFILE
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user info
    const [userRows] = await db.query(
      `SELECT 
        id, name, email,
        DATE_FORMAT(created_at, '%Y') AS memberSince
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];

    // Split name into firstName and lastName
    const nameParts = user.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName  = nameParts.slice(1).join(' ') || '';

    // Get days logged count
    const [logRows] = await db.query(
      'SELECT COUNT(*) AS daysLogged FROM screen_logs WHERE user_id = ?',
      [userId]
    );

    // Get latest burnout score
    const [burnoutRows] = await db.query(
      `SELECT score FROM burnout_scores 
       WHERE user_id = ? 
       ORDER BY recorded_at DESC 
       LIMIT 1`,
      [userId]
    );

    // Get notification settings
    const [notifRows] = await db.query(
      'SELECT daily_reminders, burnout_alerts, weekly_report FROM notification_settings WHERE user_id = ?',
      [userId]
    );

    // Default notifications if not set yet
    const notifications = notifRows.length > 0 ? {
      dailyReminders: notifRows[0].daily_reminders === 1,
      burnoutAlerts:  notifRows[0].burnout_alerts  === 1,
      weeklyReport:   notifRows[0].weekly_report   === 1
    } : {
      dailyReminders: true,
      burnoutAlerts:  true,
      weeklyReport:   false
    };

    res.status(200).json({
      user: {
        id:          user.id,
        firstName,
        lastName,
        email:       user.email,
        memberSince: user.memberSince
      },
      stats: {
        burnoutScore: burnoutRows.length > 0 ? parseFloat(burnoutRows[0].score) : 0,
        daysLogged:   logRows[0].daysLogged
      },
      notifications
    });

  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ UPDATE PROFILE (name + email)
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, email } = req.body;

  if (!firstName || !firstName.trim()) {
    return res.status(400).json({ message: 'First name is required' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Check if new email is taken by another user
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email.trim(), userId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already in use by another account' });
    }

    const fullName = `${firstName.trim()} ${lastName ? lastName.trim() : ''}`.trim();

    await db.query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [fullName, email.trim(), userId]
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        firstName: firstName.trim(),
        lastName:  lastName ? lastName.trim() : '',
        email:     email.trim()
      }
    });

  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Please fill all password fields' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    // Get current hashed password
    const [rows] = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.status(200).json({ message: 'Password updated successfully' });

  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ UPDATE NOTIFICATION SETTINGS
exports.updateNotifications = async (req, res) => {
  const userId = req.user.id;
  const { dailyReminders, burnoutAlerts, weeklyReport } = req.body;

  try {
    // Check if settings already exist for this user
    const [existing] = await db.query(
      'SELECT id FROM notification_settings WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      // UPDATE existing settings
      await db.query(
        `UPDATE notification_settings 
         SET daily_reminders = ?, burnout_alerts = ?, weekly_report = ?
         WHERE user_id = ?`,
        [
          dailyReminders ? 1 : 0,
          burnoutAlerts  ? 1 : 0,
          weeklyReport   ? 1 : 0,
          userId
        ]
      );
    } else {
      // INSERT new settings
      await db.query(
        `INSERT INTO notification_settings 
         (user_id, daily_reminders, burnout_alerts, weekly_report)
         VALUES (?, ?, ?, ?)`,
        [
          userId,
          dailyReminders ? 1 : 0,
          burnoutAlerts  ? 1 : 0,
          weeklyReport   ? 1 : 0
        ]
      );
    }

    res.status(200).json({ message: 'Notification settings saved' });

  } catch (err) {
    console.error('Update notifications error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ EXPORT USER DATA
exports.exportData = async (req, res) => {
  const userId = req.user.id;

  try {
    // Fetch all user data
    const [userRows] = await db.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [userId]
    );
    const [logRows] = await db.query(
      `SELECT 
        DATE_FORMAT(log_date, '%Y-%m-%d') AS date,
        total_mins, study_mins, social_mins,
        ent_mins, other_mins, score, category
       FROM screen_logs WHERE user_id = ?
       ORDER BY log_date ASC`,
      [userId]
    );
    const [taskRows] = await db.query(
      `SELECT title, type, 
        DATE_FORMAT(iso_date, '%Y-%m-%d') AS date,
        time, duration, done
       FROM tasks WHERE user_id = ?
       ORDER BY iso_date ASC`,
      [userId]
    );
    const [burnoutRows] = await db.query(
      `SELECT score, 
        DATE_FORMAT(recorded_at, '%Y-%m-%d') AS date
       FROM burnout_scores WHERE user_id = ?
       ORDER BY recorded_at ASC`,
      [userId]
    );

    res.status(200).json({
      exportedAt: new Date().toISOString(),
      user:       userRows[0],
      screenLogs: logRows,
      tasks:      taskRows,
      burnout:    burnoutRows
    });

  } catch (err) {
    console.error('Export data error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ DELETE ACCOUNT
exports.deleteAccount = async (req, res) => {
  const userId = req.user.id;

  try {
    // CASCADE DELETE handles all related data automatically
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.status(200).json({ message: 'Account deleted successfully' });

  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};