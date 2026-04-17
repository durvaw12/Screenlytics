// backend/controllers/authController.js — with server-side name & email validation

const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

// ✅ FIX 1: Name must be letters only — no numbers or special chars (hyphens/apostrophes OK)
function isValidName(val) {
  return /^[A-Za-z\s'\-]+$/.test((val || '').trim());
}

// ✅ FIX 2: Email must have a real domain with a dot extension (.com, .in, .edu etc.)
function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((val || '').trim());
}

// ✅ REGISTER
exports.register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !email || !password) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }

  // ✅ FIX 1: Reject numeric/invalid first name
  if (!isValidName(firstName)) {
    return res.status(400).json({ message: 'First name must contain letters only — no numbers allowed' });
  }

  // ✅ FIX 1: Reject numeric/invalid last name if provided
  if (lastName && !isValidName(lastName)) {
    return res.status(400).json({ message: 'Last name must contain letters only — no numbers allowed' });
  }

  // ✅ FIX 2: Reject emails without a proper domain (e.g. user@test without .com)
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address (e.g. you@gmail.com)' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [`${firstName} ${lastName || ''}`.trim(), email, hashedPassword]
    );

    res.status(201).json({ message: 'Account created successfully' });

  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter email and password' });
  }

  // ✅ FIX 2: Validate email format on login too
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address (e.g. you@gmail.com)' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
