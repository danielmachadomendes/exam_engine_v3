const jwt = require('jsonwebtoken');
const pool = require('../db');

// Verifies Bearer token in the Authorization header
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expected format: Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Access token missing or malformed' });
  }

  let claims;
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  if (!claims || typeof claims !== 'object' || !claims.id) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, role, status FROM users WHERE id = $1',
      [claims.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    if (user.status !== 'approved') {
      return res.status(403).json({ message: 'Account is not approved' });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error('Authentication user lookup failed:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Enforces role-based access for Admin accounts only
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
};