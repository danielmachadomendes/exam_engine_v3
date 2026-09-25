const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// =========================================================================
// GET /api/users/profile
// Fetches the user profile and their historical exam attempts
// =========================================================================
router.get('/profile', async (req, res) => {
  const user_id = req.user.id;

  try {
    // 1. Fetch user data (sanitizing password_hash)
    const userRes = await pool.query(
      `SELECT id, full_name, email, role, status, created_at
       FROM users
       WHERE id = $1`,
      [user_id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Fetch past exam attempts with exam details
    const attemptsRes = await pool.query(
      `SELECT 
        ea.id AS attempt_id,
        ea.status,
        ea.score_percentage,
        ea.is_passed,
        ea.time_spent_seconds,
        ea.domain_scores,
        ea.started_at,
        ea.completed_at,
        e.id AS exam_id,
        e.code AS exam_code,
        e.title AS exam_title,
        e.passing_score_percentage
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.id
       WHERE ea.user_id = $1
       ORDER BY ea.started_at DESC`,
      [user_id]
    );

    return res.status(200).json({
      user: userRes.rows[0],
      attempts: attemptsRes.rows,
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;