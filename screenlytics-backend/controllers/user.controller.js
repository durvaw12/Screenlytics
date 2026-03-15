// controllers/user.controller.js

const bcrypt   = require('bcryptjs');
const { pool } = require('../config/db');

// ── GET /api/users/me ────────────────────────────────────
async function getMe(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, first_name AS firstName, last_name AS lastName, email, created_at FROM users WHERE id = ?',
      [req.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/users/me ──────────────────────────────────
async function updateMe(req, res, next) {
  try {
    const { firstName, lastName } = req.body;
    if (!firstName) {
      return res.status(400).json({ success: false, message: 'firstName is required' });
    }

    await pool.query(
      'UPDATE users SET first_name = ?, last_name = ? WHERE id = ?',
      [firstName.trim(), (lastName || '').trim(), req.userId]
    );

    return res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/users/me/password ─────────────────────────
async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.userId]);
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.userId]);

    return res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe, updatePassword };
