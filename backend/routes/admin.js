const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken, requireAdmin);

const VALID_USER_ROLES = new Set(['user', 'admin']);
const VALID_ACCOUNT_STATUSES = new Set(['pending', 'approved', 'rejected']);
const VALID_QUESTION_TYPES = new Set(['single_choice', 'multiple_choice']);
const UUID_RE = /^[0-9a-f-]+$/i;

function normalizeText(value) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text.length ? text : undefined;
}

function parseInteger(value, field, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(field + ' must be an integer between ' + min + ' and ' + max);
  }
  return parsed;
}

function parseDecimal(value, field, min, max) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    throw new Error(field + ' must be a number between ' + min + ' and ' + max);
  }
  return parsed;
}

function isUuid(value) {
  return typeof value === 'string' && value.length === 36 && UUID_RE.test(value);
}

function mapDbError(res, error, defaultMessage) {
  if (error && error.code === '23505') {
    return res.status(409).json({
      message: 'Duplicate record detected.',
      detail: error.detail || error.message,
    });
  }
  if (error && error.code === '23503') {
    return res.status(409).json({
      message: 'This action refers to data that is still in use or missing.',
      detail: error.detail || error.message,
    });
  }
  if (error && error.code === '22P02') {
    return res.status(400).json({
      message: 'Invalid data type provided.',
      detail: error.message,
    });
  }
  console.error(defaultMessage, error);
  return res.status(500).json({ message: defaultMessage });
}

async function ensureExamExists(examId) {
  const result = await pool.query('SELECT id FROM exams WHERE id = $1', [examId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function ensureDomainExists(domainId) {
  const result = await pool.query('SELECT id FROM domains WHERE id = $1', [domainId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function validateDomainWeight(examId, candidateWeight, excludeDomainId = null) {
  const params = [examId];
  let where = 'WHERE exam_id = $1';
  if (excludeDomainId) {
    params.push(excludeDomainId);
    where += ' AND id <> $2';
  }
  const row = await pool.query(
    'SELECT COALESCE(SUM(weight_percentage), 0) AS total_weight FROM domains ' + where,
    params
  );
  const total = Number(row.rows[0].total_weight || 0) + Number(candidateWeight);
  if (total > 100) {
    throw new Error('Total domain weight cannot exceed 100%. Current total is ' + Number(row.rows[0].total_weight || 0).toFixed(2) + '%, attempting to add ' + Number(candidateWeight).toFixed(2) + '%.');
  }
}

router.get('/users', async (req, res) => {
  const { status, role } = req.query;
  const filters = [];
  const values = [];

  if (status) {
    filters.push('status = $' + (filters.length + 1));
    values.push(String(status));
  }
  if (role) {
    filters.push('role = $' + (filters.length + 1));
    values.push(String(role));
  }

  const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role, status, created_at, updated_at FROM users ' + where + ' ORDER BY created_at DESC',
      values
    );
    return res.status(200).json({ users: result.rows });
  } catch (error) {
    return mapDbError(res, error, 'Fetch users error');
  }
});

router.get('/users/pending', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role, status, created_at FROM users WHERE status = $1 ORDER BY created_at ASC',
      ['pending']
    );
    return res.status(200).json({ pending_users: result.rows });
  } catch (error) {
    return mapDbError(res, error, 'Fetch pending users error');
  }
});

router.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, email, role, status } = req.body;

  if (!isUuid(id)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  const updates = [];
  const values = [];

  if (full_name !== undefined) {
    const name = normalizeText(full_name);
    if (!name) return res.status(400).json({ message: 'full_name cannot be empty' });
    updates.push('full_name = $' + (updates.length + 1));
    values.push(name);
  }

  if (email !== undefined) {
    const value = normalizeText(email);
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return res.status(400).json({ message: 'A valid email is required' });
    }
    updates.push('email = $' + (updates.length + 1));
    values.push(value.toLowerCase());
  }

  if (role !== undefined) {
    const value = normalizeText(role);
    if (!VALID_USER_ROLES.has(value)) {
      return res.status(400).json({ message: 'role must be either user or admin' });
    }
    updates.push('role = $' + (updates.length + 1));
    values.push(value);
  }

  if (status !== undefined) {
    const value = normalizeText(status);
    if (!VALID_ACCOUNT_STATUSES.has(value)) {
      return res.status(400).json({ message: 'status must be one of pending, approved, or rejected' });
    }
    updates.push('status = $' + (updates.length + 1));
    values.push(value);
  }

  if (!updates.length) {
    return res.status(400).json({ message: 'At least one field must be provided for update' });
  }

  values.push(id);

  try {
    const result = await pool.query(
      'UPDATE users SET ' + updates.join(', ') + ', updated_at = CURRENT_TIMESTAMP WHERE id = $' + values.length + ' RETURNING id, full_name, email, role, status, created_at, updated_at',
      values
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (error) {
    return mapDbError(res, error, 'Update user error');
  }
});

router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ message: 'User deleted successfully', id });
  } catch (error) {
    return mapDbError(res, error, 'Delete user error');
  }
});

router.patch('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!isUuid(id)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Allowed values are approved or rejected' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, full_name, email, role, status, updated_at',
      [status, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'User status updated to ' + status,
      user: result.rows[0],
    });
  } catch (error) {
    return mapDbError(res, error, 'Update user status error');
  }
});

router.post('/exams', async (req, res) => {
  const {
    code,
    title,
    description,
    duration_minutes = 90,
    total_questions = 60,
    passing_score_pct = 70.0,
    is_active = true,
  } = req.body;

  const cleanCode = normalizeText(code);
  const cleanTitle = normalizeText(title);

  if (!cleanCode || !cleanTitle) {
    return res.status(400).json({ message: 'Both code and title are required' });
  }

  try {
    const duration = parseInteger(duration_minutes, 'duration_minutes', 1, 10000);
    const total = parseInteger(total_questions, 'total_questions', 1, 10000);
    const passingScore = parseDecimal(passing_score_pct, 'passing_score_pct', 0, 100);

    const result = await pool.query(
      'INSERT INTO exams (code, title, description, duration_minutes, total_questions, passing_score_percentage, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [cleanCode.trim().toUpperCase(), cleanTitle.trim(), normalizeText(description) || null, duration, total, passingScore, Boolean(is_active)]
    );

    return res.status(201).json({ message: 'Exam created successfully', exam: result.rows[0] });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'Exam code ' + cleanCode + ' already exists' });
    }
    if (error && error.message) {
      return res.status(400).json({ message: error.message });
    }
    return mapDbError(res, error, 'Create exam error');
  }
});

router.get('/exams', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT e.id, e.code, e.title, e.description, e.duration_minutes, e.total_questions, e.passing_score_percentage, e.is_active, e.created_at, e.updated_at, COALESCE((SELECT COUNT(*) FROM domains d WHERE d.exam_id = e.id), 0) AS domain_count, COALESCE((SELECT COUNT(*) FROM questions q JOIN domains d2 ON d2.id = q.domain_id WHERE d2.exam_id = e.id), 0) AS question_count, COALESCE(json_agg(json_build_object(\'id\', d.id, \'name\', d.name, \'weight_percentage\', d.weight_percentage, \'created_at\', d.created_at) ORDER BY d.weight_percentage DESC) FILTER (WHERE d.id IS NOT NULL), \'[]\'::json) AS domains FROM exams e LEFT JOIN domains d ON d.exam_id = e.id GROUP BY e.id ORDER BY e.created_at DESC'
    );
    return res.status(200).json({ exams: result.rows });
  } catch (error) {
    return mapDbError(res, error, 'Get exams error');
  }
});

router.patch('/exams/:id', async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ message: 'Invalid exam id' });
  }

  const { code, title, description, duration_minutes, total_questions, passing_score_percentage, is_active } = req.body;
  const updates = [];
  const values = [];

  if (code !== undefined) {
    const value = normalizeText(code);
    if (!value) return res.status(400).json({ message: 'code cannot be empty' });
    updates.push('code = $' + (updates.length + 1)); values.push(value.trim().toUpperCase());
  }
  if (title !== undefined) {
    const value = normalizeText(title);
    if (!value) return res.status(400).json({ message: 'title cannot be empty' });
    updates.push('title = $' + (updates.length + 1)); values.push(value.trim());
  }
  if (description !== undefined) {
    updates.push('description = $' + (updates.length + 1)); values.push(normalizeText(description) || null);
  }
  if (duration_minutes !== undefined) {
    try {
      updates.push('duration_minutes = $' + (updates.length + 1)); values.push(parseInteger(duration_minutes, 'duration_minutes', 1, 10000));
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
  if (total_questions !== undefined) {
    try {
      updates.push('total_questions = $' + (updates.length + 1)); values.push(parseInteger(total_questions, 'total_questions', 1, 10000));
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
  if (passing_score_percentage !== undefined) {
    try {
      updates.push('passing_score_percentage = $' + (updates.length + 1)); values.push(parseDecimal(passing_score_percentage, 'passing_score_percentage', 0, 100));
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
  if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') return res.status(400).json({ message: 'is_active must be a boolean' });
    updates.push('is_active = $' + (updates.length + 1)); values.push(is_active);
  }

  if (!updates.length) {
    return res.status(400).json({ message: 'At least one exam field must be provided for update' });
  }

  values.push(id);

  try {
    const result = await pool.query(
      'UPDATE exams SET ' + updates.join(', ') + ', updated_at = CURRENT_TIMESTAMP WHERE id = $' + values.length + ' RETURNING *',
      values
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    return res.status(200).json({ message: 'Exam updated successfully', exam: result.rows[0] });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'An exam with that code already exists' });
    }
    return mapDbError(res, error, 'Update exam error');
  }
});

router.delete('/exams/:id', async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ message: 'Invalid exam id' });
  }

  try {
    const result = await pool.query('DELETE FROM exams WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    return res.status(200).json({ message: 'Exam deleted successfully', id });
  } catch (error) {
    return mapDbError(res, error, 'Delete exam error');
  }
});

router.post('/domains', async (req, res) => {
  const { exam_id, name, weight_percentage } = req.body;
  if (!exam_id || !name || weight_percentage === undefined) {
    return res.status(400).json({ message: 'exam_id, name, and weight_percentage are required' });
  }

  const examId = String(exam_id);
  const cleanedName = normalizeText(name);
  if (!isUuid(examId)) return res.status(400).json({ message: 'Invalid exam_id' });
  if (!cleanedName) return res.status(400).json({ message: 'name cannot be empty' });

  try {
    const weight = parseDecimal(weight_percentage, 'weight_percentage', 0.01, 100);
    const exam = await ensureExamExists(examId);
    if (!exam) return res.status(404).json({ message: 'Target exam not found' });
    await validateDomainWeight(examId, weight);

    const result = await pool.query(
      'INSERT INTO domains (exam_id, name, weight_percentage) VALUES ($1, $2, $3) RETURNING *',
      [examId, cleanedName, weight]
    );
    return res.status(201).json({ message: 'Domain created successfully', domain: result.rows[0] });
  } catch (error) {
    if (error && error.message && error.message.includes('Total domain weight cannot exceed 100%')) {
      return res.status(400).json({ message: error.message });
    }
    if (error && error.message) {
      return res.status(400).json({ message: error.message });
    }
    return mapDbError(res, error, 'Create domain error');
  }
});

router.get('/domains', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT d.id, d.exam_id, d.name, d.weight_percentage, d.created_at, e.code AS exam_code, e.title AS exam_title, COALESCE(COUNT(q.id), 0)::int AS question_count FROM domains d LEFT JOIN exams e ON e.id = d.exam_id LEFT JOIN questions q ON q.domain_id = d.id GROUP BY d.id, e.id, e.code, e.title ORDER BY d.created_at DESC'
    );
    return res.status(200).json({ domains: result.rows });
  } catch (error) {
    return mapDbError(res, error, 'Get domains error');
  }
});

router.patch('/domains/:id', async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ message: 'Invalid domain id' });
  }

  const existing = await pool.query('SELECT id, exam_id, name, weight_percentage FROM domains WHERE id = $1', [id]);
  if (!existing.rows.length) {
    return res.status(404).json({ message: 'Domain not found' });
  }

  const current = existing.rows[0];
  const { exam_id = current.exam_id, name = current.name, weight_percentage = current.weight_percentage } = req.body;
  const examId = String(exam_id);
  const cleanedName = normalizeText(name);
  if (!isUuid(examId)) return res.status(400).json({ message: 'Invalid exam_id' });
  if (!cleanedName) return res.status(400).json({ message: 'name cannot be empty' });

  try {
    const weight = parseDecimal(weight_percentage, 'weight_percentage', 0.01, 100);
    const exam = await ensureExamExists(examId);
    if (!exam) return res.status(404).json({ message: 'Target exam not found' });
    await validateDomainWeight(examId, weight, id);

    const result = await pool.query(
      'UPDATE domains SET exam_id = $1, name = $2, weight_percentage = $3 WHERE id = $4 RETURNING *',
      [examId, cleanedName, weight, id]
    );
    return res.status(200).json({ message: 'Domain updated successfully', domain: result.rows[0] });
  } catch (error) {
    if (error && error.message && error.message.includes('Total domain weight cannot exceed 100%')) {
      return res.status(400).json({ message: error.message });
    }
    if (error && error.message) {
      return res.status(400).json({ message: error.message });
    }
    return mapDbError(res, error, 'Update domain error');
  }
});

router.delete('/domains/:id', async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ message: 'Invalid domain id' });
  }

  try {
    const result = await pool.query('DELETE FROM domains WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Domain not found' });
    }
    return res.status(200).json({ message: 'Domain deleted successfully', id });
  } catch (error) {
    return mapDbError(res, error, 'Delete domain error');
  }
});

router.post('/questions', async (req, res) => {
  const { domain_id, question_text, type, options, correct_answers, explanation, is_active = true } = req.body;
  if (!domain_id || !question_text || !options || !correct_answers) {
    return res.status(400).json({ message: 'domain_id, question_text, options, and correct_answers are required' });
  }

  const domainId = String(domain_id);
  const text = normalizeText(question_text);
  const kind = normalizeText(type) || 'single_choice';

  if (!isUuid(domainId)) return res.status(400).json({ message: 'Invalid domain_id' });
  if (!text) return res.status(400).json({ message: 'question_text cannot be empty' });
  if (!VALID_QUESTION_TYPES.has(kind)) return res.status(400).json({ message: 'type must be either single_choice or multiple_choice' });
  if (!Array.isArray(options) || !options.length) return res.status(400).json({ message: 'options must be a non-empty array' });
  if (!Array.isArray(correct_answers)) return res.status(400).json({ message: 'correct_answers must be an array' });

  try {
    const domain = await ensureDomainExists(domainId);
    if (!domain) return res.status(404).json({ message: 'Target domain not found' });

    const result = await pool.query(
      'INSERT INTO questions (domain_id, question_text, type, options, correct_answers, explanation, is_active) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7) RETURNING *',
      [domainId, text, kind, JSON.stringify(options), JSON.stringify(correct_answers), normalizeText(explanation) || null, Boolean(is_active)]
    );

    return res.status(201).json({ message: 'Question created', question: result.rows[0] });
  } catch (error) {
    return mapDbError(res, error, 'Create question error');
  }
});

router.get('/questions', async (req, res) => {
  const { domain_id, exam_id, search, is_active } = req.query;
  const filters = [];
  const values = [];

  let query = 'SELECT q.id, q.domain_id, q.question_text, q.type, q.options, q.correct_answers, q.explanation, q.is_active, q.created_at, q.updated_at, d.name AS domain_name, e.id AS exam_id, e.code AS exam_code, e.title AS exam_title FROM questions q JOIN domains d ON d.id = q.domain_id JOIN exams e ON e.id = d.exam_id';

  if (domain_id) {
    if (!isUuid(String(domain_id))) return res.status(400).json({ message: 'Invalid domain_id filter' });
    filters.push('q.domain_id = $' + (filters.length + 1)); values.push(String(domain_id));
  }
  if (exam_id) {
    if (!isUuid(String(exam_id))) return res.status(400).json({ message: 'Invalid exam_id filter' });
    filters.push('e.id = $' + (filters.length + 1)); values.push(String(exam_id));
  }
  if (search) {
    filters.push('LOWER(q.question_text) LIKE LOWER($' + (filters.length + 1) + ')'); values.push('%' + String(search).trim() + '%');
  }
  if (is_active !== undefined) {
    const flag = String(is_active).toLowerCase();
    if (!['true', 'false'].includes(flag)) return res.status(400).json({ message: 'is_active must be either true or false' });
    filters.push('q.is_active = $' + (filters.length + 1)); values.push(flag === 'true');
  }

  if (filters.length) {
    query += ' WHERE ' + filters.join(' AND ');
  }
  query += ' ORDER BY q.created_at DESC';

  try {
    const result = await pool.query(query, values);
    return res.status(200).json({ questions: result.rows });
  } catch (error) {
    return mapDbError(res, error, 'Get questions error');
  }
});

router.patch('/questions/:id', async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ message: 'Invalid question id' });
  }

  const { domain_id, question_text, type, options, correct_answers, explanation, is_active } = req.body;
  const updates = [];
  const values = [];

  if (domain_id !== undefined) {
    const domainId = String(domain_id);
    if (!isUuid(domainId)) return res.status(400).json({ message: 'Invalid domain_id' });
    const domain = await ensureDomainExists(domainId);
    if (!domain) return res.status(404).json({ message: 'Target domain not found' });
    updates.push('domain_id = $' + (updates.length + 1)); values.push(domainId);
  }

  if (question_text !== undefined) {
    const text = normalizeText(question_text);
    if (!text) return res.status(400).json({ message: 'question_text cannot be empty' });
    updates.push('question_text = $' + (updates.length + 1)); values.push(text);
  }

  if (type !== undefined) {
    const kind = normalizeText(type) || 'single_choice';
    if (!VALID_QUESTION_TYPES.has(kind)) return res.status(400).json({ message: 'type must be either single_choice or multiple_choice' });
    updates.push('type = $' + (updates.length + 1)); values.push(kind);
  }

  if (options !== undefined) {
    if (!Array.isArray(options) || !options.length) return res.status(400).json({ message: 'options must be a non-empty array' });
    updates.push('options = $' + (updates.length + 1) + '::jsonb'); values.push(JSON.stringify(options));
  }

  if (correct_answers !== undefined) {
    if (!Array.isArray(correct_answers)) return res.status(400).json({ message: 'correct_answers must be an array' });
    updates.push('correct_answers = $' + (updates.length + 1) + '::jsonb'); values.push(JSON.stringify(correct_answers));
  }

  if (explanation !== undefined) {
    updates.push('explanation = $' + (updates.length + 1)); values.push(normalizeText(explanation) || null);
  }

  if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') return res.status(400).json({ message: 'is_active must be a boolean' });
    updates.push('is_active = $' + (updates.length + 1)); values.push(is_active);
  }

  if (!updates.length) {
    return res.status(400).json({ message: 'At least one question field must be provided for update' });
  }

  values.push(id);

  try {
    const result = await pool.query(
      'UPDATE questions SET ' + updates.join(', ') + ', updated_at = CURRENT_TIMESTAMP WHERE id = $' + values.length + ' RETURNING *',
      values
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Question not found' });
    }
    return res.status(200).json({ message: 'Question updated successfully', question: result.rows[0] });
  } catch (error) {
    return mapDbError(res, error, 'Update question error');
  }
});

router.delete('/questions/:id', async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ message: 'Invalid question id' });
  }

  try {
    const result = await pool.query('DELETE FROM questions WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Question not found' });
    }
    return res.status(200).json({ message: 'Question deleted successfully', id });
  } catch (error) {
    return mapDbError(res, error, 'Delete question error');
  }
});

router.post('/questions/bulk', async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || !questions.length) {
    return res.status(400).json({ message: 'An array of questions is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    for (const item of questions) {
      const domainId = String(item.domain_id);
      if (!isUuid(domainId)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Each question needs a valid domain_id' });
      }
      const domain = await client.query('SELECT id FROM domains WHERE id = $1', [domainId]);
      if (!domain.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'One or more target domains were not found' });
      }

      const questionText = normalizeText(item.question_text);
      const kind = normalizeText(item.type) || 'single_choice';
      if (!questionText || !Array.isArray(item.options) || !item.options.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Each question requires question_text and options' });
      }
      if (!Array.isArray(item.correct_answers)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Each question requires correct_answers as an array' });
      }
      if (!VALID_QUESTION_TYPES.has(kind)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Each question type must be single_choice or multiple_choice' });
      }

      await client.query(
        'INSERT INTO questions (domain_id, question_text, type, options, correct_answers, explanation) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)',
        [domainId, questionText, kind, JSON.stringify(item.options), JSON.stringify(item.correct_answers), normalizeText(item.explanation) || null]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ message: questions.length + ' questions uploaded successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    return mapDbError(res, error, 'Bulk upload failed');
  } finally {
    client.release();
  }
});

module.exports = router;
