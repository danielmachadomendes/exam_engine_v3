const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Utility: Fisher-Yates array shuffle
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Utility: Deep-equal check for single or multi-select answer arrays
function areAnswersEqual(userAns, correctAns) {
  if (!Array.isArray(userAns) || !Array.isArray(correctAns)) return false;
  if (userAns.length !== correctAns.length) return false;

  const normalizedUser = userAns.map(item => String(item).trim().toLowerCase()).sort();
  const normalizedCorrect = correctAns.map(item => String(item).trim().toLowerCase()).sort();

  return normalizedUser.every((val, index) => val === normalizedCorrect[index]);
}

// =========================================================================
// GET /api/exams 
// Lista todos os exames ativos para os utilizadores autenticados
// =========================================================================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, 
        code, 
        title, 
        description, 
        duration_minutes, 
        total_questions, 
        passing_score_percentage, 
        is_active 
      FROM exams 
      WHERE is_active = true 
      ORDER BY title ASC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching active exams:', err);
    res.status(500).json({ error: 'Failed to retrieve exams' });
  }
});

// =========================================================================
// POST /api/exams/:id/start
// Generates a domain-weighted random question set & opens an exam attempt
// =========================================================================
router.post('/:id/start', async (req, res) => {
  const { id: exam_id } = req.params;
  const user_id = req.user.id;

  try {
    // 1. Fetch exam configuration
    const examRes = await pool.query(
      `SELECT id, code, title, duration_minutes, total_questions, passing_score_percentage, is_active
       FROM exams 
       WHERE id = $1`,
      [exam_id]
    );

    if (examRes.rows.length === 0) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const exam = examRes.rows[0];
    if (!exam.is_active) {
      return res.status(400).json({ message: 'This exam is currently inactive' });
    }

    // 2. Fetch associated domains
    const domainRes = await pool.query(
      `SELECT id, name, weight_percentage 
       FROM domains 
       WHERE exam_id = $1 
       ORDER BY weight_percentage DESC`,
      [exam_id]
    );

    if (domainRes.rows.length === 0) {
      return res.status(400).json({ message: 'Exam has no configured domains' });
    }

    const domains = domainRes.rows;
    let selectedQuestions = [];
    let allocatedTotal = 0;

    // 3. Select domain-weighted random questions
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i];
      let domainQuota;

      if (i === domains.length - 1) {
        // Last domain absorbs rounding difference to guarantee exact total_questions
        domainQuota = Math.max(0, exam.total_questions - allocatedTotal);
      } else {
        domainQuota = Math.round((parseFloat(domain.weight_percentage) / 100) * exam.total_questions);
        allocatedTotal += domainQuota;
      }

      if (domainQuota > 0) {
        const qRes = await pool.query(
          `SELECT id, domain_id, question_text, type, options
           FROM questions
           WHERE domain_id = $1 AND is_active = true
           ORDER BY RANDOM()
           LIMIT $2`,
          [domain.id, domainQuota]
        );
        selectedQuestions.push(...qRes.rows);
      }
    }

    // Fallback: If domain pools were underpopulated, fill remaining quota from any exam domain
    if (selectedQuestions.length < exam.total_questions) {
      const existingIds = selectedQuestions.map(q => q.id);
      const needed = exam.total_questions - selectedQuestions.length;

      const fillRes = await pool.query(
        `SELECT q.id, q.domain_id, q.question_text, q.type, q.options
         FROM questions q
         JOIN domains d ON q.domain_id = d.id
         WHERE d.exam_id = $1 
           AND q.is_active = true
           AND NOT (q.id = ANY($2::uuid[]))
         ORDER BY RANDOM()
         LIMIT $3`,
        [exam_id, existingIds.length ? existingIds : ['00000000-0000-0000-0000-000000000000'], needed]
      );
      selectedQuestions.push(...fillRes.rows);
    }

    // 4. Shuffle final aggregate questions array
    const randomizedQuestions = shuffleArray(selectedQuestions);

    // 5. Open an in_progress attempt record in DB
    const attemptRes = await pool.query(
      `INSERT INTO exam_attempts (user_id, exam_id, status, started_at)
       VALUES ($1, $2, 'in_progress', CURRENT_TIMESTAMP)
       RETURNING id, started_at`,
      [user_id, exam.id]
    );

    // 6. Return payload (correct_answers and explanations are excluded)
    return res.status(200).json({
      attempt_id: attemptRes.rows[0].id,
      exam: {
        id: exam.id,
        code: exam.code,
        title: exam.title,
        duration_minutes: exam.duration_minutes,
        total_questions: randomizedQuestions.length,
        passing_score_percentage: exam.passing_score_percentage,
        started_at: attemptRes.rows[0].started_at,
      },
      questions: randomizedQuestions.map(q => ({
        id: q.id,
        domain_id: q.domain_id,
        question_text: q.question_text,
        type: q.type,
        options: q.options,
      })),
    });
  } catch (error) {
    console.error('Exam start error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// =========================================================================
// POST /api/exams/:id/submit
// Evaluates answers, records metrics, and returns complete review
// =========================================================================
router.post('/:id/submit', async (req, res) => {
  const { id: exam_id } = req.params;
  const user_id = req.user.id;
  const { attempt_id, user_answers = {}, time_spent_seconds = 0 } = req.body;

  if (!attempt_id) {
    return res.status(400).json({ message: 'attempt_id is required' });
  }

  try {
    // 1. Fetch and validate attempt ownership and status
    const attemptRes = await pool.query(
      `SELECT ea.*, e.passing_score_percentage, e.duration_minutes
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.id
       WHERE ea.id = $1 AND ea.user_id = $2 AND ea.exam_id = $3`,
      [attempt_id, user_id, exam_id]
    );

    if (attemptRes.rows.length === 0) {
      return res.status(404).json({ message: 'Exam attempt not found or unauthorized' });
    }

    const attempt = attemptRes.rows[0];
    if (attempt.status === 'completed') {
      return res.status(400).json({ message: 'This exam attempt has already been submitted' });
    }

    const questionIds = Object.keys(user_answers);
    if (questionIds.length === 0) {
      return res.status(400).json({ message: 'No answers provided for grading' });
    }

    // 2. Fetch full question specs from DB (with correct_answers & explanations)
    const questionsRes = await pool.query(
      `SELECT q.id, q.domain_id, q.question_text, q.type, q.options, q.correct_answers, q.explanation, d.name AS domain_name
       FROM questions q
       JOIN domains d ON q.domain_id = d.id
       WHERE q.id = ANY($1::uuid[])`,
      [questionIds]
    );

    const questionsMap = new Map();
    questionsRes.rows.forEach(q => questionsMap.set(q.id, q));

    // 3. Evaluate responses and calculate domain metrics
    let totalQuestions = questionsRes.rows.length;
    let correctCount = 0;
    const domainStats = {};
    const reviewDetails = [];

    questionsRes.rows.forEach(q => {
      const uAnswers = user_answers[q.id] || [];
      const isCorrect = areAnswersEqual(uAnswers, q.correct_answers);

      if (isCorrect) correctCount++;

      // Track domain stats
      if (!domainStats[q.domain_id]) {
        domainStats[q.domain_id] = {
          domain_id: q.domain_id,
          domain_name: q.domain_name,
          total: 0,
          correct: 0,
        };
      }
      domainStats[q.domain_id].total += 1;
      if (isCorrect) domainStats[q.domain_id].correct += 1;

      // Construct detailed review entry
      reviewDetails.push({
        question_id: q.id,
        domain_id: q.domain_id,
        domain_name: q.domain_name,
        question_text: q.question_text,
        type: q.type,
        options: q.options,
        user_answers: uAnswers,
        correct_answers: q.correct_answers,
        is_correct: isCorrect,
        explanation: q.explanation,
      });
    });

    const overallScorePct = parseFloat(((correctCount / totalQuestions) * 100).toFixed(2));
    const isPassed = overallScorePct >= parseFloat(attempt.passing_score_percentage);

    // Format domain breakdown percentages
    const domainScores = Object.values(domainStats).map(d => ({
      domain_id: d.domain_id,
      domain_name: d.domain_name,
      total_questions: d.total,
      correct_questions: d.correct,
      score_percentage: parseFloat(((d.correct / d.total) * 100).toFixed(2)),
    }));

    // 4. Update the attempt in PostgreSQL
    const updatedAttemptRes = await pool.query(
      `UPDATE exam_attempts
       SET status = 'completed',
           completed_at = CURRENT_TIMESTAMP,
           time_spent_seconds = $1,
           user_answers = $2::jsonb,
           score_percentage = $3,
           is_passed = $4,
           domain_scores = $5::jsonb
       WHERE id = $6
       RETURNING *`,
      [
        parseInt(time_spent_seconds, 10),
        JSON.stringify(user_answers),
        overallScorePct,
        isPassed,
        JSON.stringify(domainScores),
        attempt_id,
      ]
    );

    // 5. Return graded payload with explanations and results
    return res.status(200).json({
      message: 'Exam submitted and graded successfully',
      attempt: {
        id: updatedAttemptRes.rows[0].id,
        score_percentage: overallScorePct,
        passing_score_percentage: attempt.passing_score_percentage,
        is_passed: isPassed,
        total_questions: totalQuestions,
        correct_answers_count: correctCount,
        time_spent_seconds: parseInt(time_spent_seconds, 10),
        completed_at: updatedAttemptRes.rows[0].completed_at,
        domain_scores: domainScores,
      },
      review: reviewDetails,
    });
  } catch (error) {
    console.error('Exam submit error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;