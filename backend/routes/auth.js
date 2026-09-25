const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: 'full_name, email, and password are required' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert user with status = 'pending' and role = 'user'
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'user', 'pending')
       RETURNING id, full_name, email, role, status, created_at`,
      [full_name.trim(), normalizedEmail, password_hash]
    );

    return res.status(201).json({
      message: 'Registration successful. Account awaiting administrator approval.',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const result = await pool.query(
      'SELECT id, full_name, email, password_hash, role, status FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Block non-approved accounts with 403 Forbidden
    if (user.status === 'pending') {
      return res.status(403).json({
        message: 'Your account is pending administrator approval.',
        status: user.status,
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        message: 'Your account registration has been rejected. Please contact an administrator.',
        status: user.status,
      });
    }

    // Issue JWT for approved accounts
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;