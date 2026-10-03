const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
function areAnswersEqual(userAns, correctAns, questionType) {
  if (!Array.isArray(userAns) || !Array.isArray(correctAns)) return false;
  if (userAns.length !== correctAns.length) return false;

  if (questionType === 'drag_and_drop') {
    if (
      userAns.some((pair) => !Array.isArray(pair) || pair.length !== 2) ||
      correctAns.some((pair) => !Array.isArray(pair) || pair.length !== 2)
    ) {
      return false;
    }
    const normalizePair = (pair) =>
      pair.map((item) => String(item).trim().toLowerCase()).join('\u0000');
    const normalizedUser = userAns.map(normalizePair).sort();
    const normalizedCorrect = correctAns.map(normalizePair).sort();
    return normalizedUser.every((value, index) => value === normalizedCorrect[index]);
  }

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
        is_active,
        display_order
      FROM exams 
      WHERE is_active = true 
      ORDER BY display_order ASC, title ASC`
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
    const initialAnswers = Object.fromEntries(
      randomizedQuestions.map(question => [question.id, []])
    );
    const attemptRes = await pool.query(
      `INSERT INTO exam_attempts (user_id, exam_id, status, started_at, user_answers)
       VALUES ($1, $2, 'in_progress', CURRENT_TIMESTAMP, $3::jsonb)
       RETURNING id, started_at`,
      [user_id, exam.id, JSON.stringify(initialAnswers)]
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

    // Attempts started after this change retain their full randomized question set.
    // For attempts already in progress during deployment, use the submitted question IDs.
    const questionIds = Object.keys(attempt.user_answers || {});
    if (questionIds.length === 0) {
      questionIds.push(...Object.keys(user_answers));
    }

    if (questionIds.length === 0) {
      return res.status(400).json({ message: 'No questions available for grading' });
    }

    const answersForAttempt = Object.fromEntries(
      questionIds.map(questionId => [questionId, user_answers[questionId] || []])
    );

    // 2. Fetch full question specs from DB (with correct_answers & explanations)
    const questionsRes = await pool.query(
      `SELECT q.id, q.domain_id, q.question_text, q.type, q.options, q.correct_answers, q.explanation, d.name AS domain_name
       FROM questions q
       JOIN domains d ON q.domain_id = d.id
       WHERE q.id = ANY($1::uuid[]) AND d.exam_id = $2`,
      [questionIds, exam_id]
    );

    if (questionsRes.rows.length === 0) {
      return res.status(400).json({ message: 'No questions available for grading' });
    }

    // 3. Evaluate responses and calculate domain metrics
    let totalQuestions = questionsRes.rows.length;
    let correctCount = 0;
    const domainStats = {};
    const reviewDetails = [];

    questionsRes.rows.forEach(q => {
      const uAnswers = answersForAttempt[q.id] || [];
      const isCorrect = areAnswersEqual(uAnswers, q.correct_answers, q.type);

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
           domain_scores = $5::jsonb,
           review_data = $6::jsonb
       WHERE id = $7
       RETURNING *`,
      [
        parseInt(time_spent_seconds, 10),
        JSON.stringify(answersForAttempt),
        overallScorePct,
        isPassed,
        JSON.stringify(domainScores),
        JSON.stringify(reviewDetails),
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

router.post('/attempts/:attemptId/complete', async (req, res) => {
  const { attemptId } = req.params;
  const { user_answers, time_spent_seconds } = req.body;

  if (!UUID_PATTERN.test(attemptId)) {
    return res.status(400).json({ message: 'Invalid attempt id' });
  }
  if (!user_answers || typeof user_answers !== 'object' || Array.isArray(user_answers)) {
    return res.status(400).json({ message: 'user_answers must be an object' });
  }
  if (!Number.isSafeInteger(time_spent_seconds) || time_spent_seconds < 0) {
    return res.status(400).json({ message: 'time_spent_seconds must be a non-negative integer' });
  }

  try {
    const result = await pool.query(
      `UPDATE exam_attempts
       SET status = 'completed',
           completed_at = CURRENT_TIMESTAMP,
           time_spent_seconds = $1,
           user_answers = $2::jsonb
       WHERE id = $3 AND user_id = $4 AND status = 'in_progress'
       RETURNING id, status, completed_at`,
      [time_spent_seconds, JSON.stringify(user_answers), attemptId, req.user.id]
    );

    if (!result.rows.length) {
      const existing = await pool.query(
        'SELECT status FROM exam_attempts WHERE id = $1 AND user_id = $2',
        [attemptId, req.user.id]
      );
      if (!existing.rows.length) {
        return res.status(404).json({ message: 'Exam attempt not found' });
      }
      return res.status(409).json({ message: 'This exam attempt is no longer in progress' });
    }

    return res.status(200).json({
      message: 'Exam attempt completed',
      attempt: result.rows[0],
    });
  } catch (error) {
    console.error('Exam completion error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/attempts/:attemptId/review', async (req, res) => {
  const { attemptId } = req.params;
  if (!UUID_PATTERN.test(attemptId)) {
    return res.status(400).json({ message: 'Invalid attempt id' });
  }

  try {
    const attemptRes = await pool.query(
      `SELECT ea.id, ea.exam_id, ea.status, ea.user_answers, ea.review_data,
              ea.score_percentage, ea.is_passed, ea.time_spent_seconds,
              ea.completed_at, ea.domain_scores, e.code AS exam_code,
              e.title AS exam_title, e.passing_score_percentage
       FROM exam_attempts ea
       JOIN exams e ON e.id = ea.exam_id
       WHERE ea.id = $1 AND ea.user_id = $2`,
      [attemptId, req.user.id]
    );

    if (!attemptRes.rows.length) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }

    const attempt = attemptRes.rows[0];
    if (attempt.status !== 'completed') {
      return res.status(403).json({ message: 'Review is available after the exam is completed' });
    }

    let review = attempt.review_data;
    if (!Array.isArray(review)) {
      const questionIds = Object.keys(attempt.user_answers || {});
      const questionsRes = await pool.query(
        `SELECT q.id, q.domain_id, q.question_text, q.type, q.options,
                q.correct_answers, q.explanation, d.name AS domain_name
         FROM questions q
         JOIN domains d ON d.id = q.domain_id
         WHERE q.id = ANY($1::uuid[]) AND d.exam_id = $2`,
        [questionIds, attempt.exam_id]
      );
      review = questionsRes.rows.map((question) => {
        const userAnswers = attempt.user_answers[question.id] || [];
        return {
          question_id: question.id,
          domain_id: question.domain_id,
          domain_name: question.domain_name,
          question_text: question.question_text,
          type: question.type,
          options: question.options,
          user_answers: userAnswers,
          correct_answers: question.correct_answers,
          is_correct: areAnswersEqual(userAnswers, question.correct_answers, question.type),
          explanation: question.explanation,
        };
      });
    }

    return res.status(200).json({
      attempt: {
        id: attempt.id,
        exam_code: attempt.exam_code,
        exam_title: attempt.exam_title,
        score_percentage: attempt.score_percentage,
        passing_score_percentage: attempt.passing_score_percentage,
        is_passed: attempt.is_passed,
        total_questions: review.length,
        correct_answers_count: review.filter((question) => question.is_correct).length,
        time_spent_seconds: attempt.time_spent_seconds,
        completed_at: attempt.completed_at,
        domain_scores: attempt.domain_scores,
      },
      review,
    });
  } catch (error) {
    console.error('Fetch exam review error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/attempts/:attemptId/questions/:questionId/issues', async (req, res) => {
  const { attemptId, questionId } = req.params;
  const description =
    typeof req.body?.description === 'string' ? req.body.description.trim() : '';

  if (!UUID_PATTERN.test(attemptId) || !UUID_PATTERN.test(questionId)) {
    return res.status(400).json({ message: 'Invalid attempt or question id' });
  }
  if (!description || description.length > 2000) {
    return res.status(400).json({ message: 'Issue description must be between 1 and 2000 characters' });
  }

  try {
    const attemptRes = await pool.query(
      `SELECT ea.user_answers, ea.review_data
       FROM exam_attempts ea
       WHERE ea.id = $1 AND ea.user_id = $2 AND ea.status = 'completed'`,
      [attemptId, req.user.id]
    );
    if (!attemptRes.rows.length) {
      return res.status(404).json({ message: 'Completed exam attempt not found' });
    }

    const attempt = attemptRes.rows[0];
    if (!Object.prototype.hasOwnProperty.call(attempt.user_answers || {}, questionId)) {
      return res.status(404).json({ message: 'Question was not part of this exam attempt' });
    }

    const reviewItem = Array.isArray(attempt.review_data)
      ? attempt.review_data.find((item) => item.question_id === questionId)
      : null;
    let questionText = reviewItem?.question_text;
    const questionRes = await pool.query(
      'SELECT id, question_text FROM questions WHERE id = $1',
      [questionId]
    );
    if (!questionText && questionRes.rows.length) {
      questionText = questionRes.rows[0].question_text;
    }
    if (!questionText) {
      return res.status(404).json({ message: 'Question is no longer available for reporting' });
    }

    const result = await pool.query(
      `INSERT INTO question_issue_reports
         (attempt_id, user_id, question_id, question_text, issue_description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, status, created_at`,
      [
        attemptId,
        req.user.id,
        questionRes.rows.length ? questionId : null,
        questionText,
        description,
      ]
    );
    return res.status(201).json({ message: 'Issue reported successfully', report: result.rows[0] });
  } catch (error) {
    console.error('Report question issue error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;