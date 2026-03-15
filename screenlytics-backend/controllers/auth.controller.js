// controllers/auth.controller.js

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');

// ── POST /api/auth/register ──────────────────────────────
async function register(req, res, next) {
  try {
    const { firstName, lastName = '', email, password } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({ success: false, message: 'firstName, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Check duplicate email
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)',
      [firstName.trim(), lastName.trim(), email.toLowerCase(), hash]
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      userId: result.insertId,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/login ─────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, password_hash FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user    = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id:        user.id,
        firstName: user.first_name,
        lastName:  user.last_name,
        email:     user.email,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
