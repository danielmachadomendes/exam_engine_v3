const pool = require('../db');

const AUDIT_ENTITY_TABLES = {
  user: 'users',
  exam: 'exams',
  domain: 'domains',
  question: 'questions',
  question_issue_report: 'question_issue_reports',
  exam_attempt: 'exam_attempts',
};

async function insertAuditLog(client, req, { action, entity, entityId = null, details = {} }) {
  await client.query(
    `INSERT INTO admin_audit_logs (actor_id, actor_email, action, entity, entity_id, details)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [req.user.id, req.user.email, action, entity, entityId, JSON.stringify(details)]
  );
}

async function runAdminMutation(req, event, query, values) {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;
    let before = null;
    if (event.entityId && ['update', 'status_change', 'delete'].includes(event.action)) {
      const table = AUDIT_ENTITY_TABLES[event.entity];
      if (!table) throw new Error('Unsupported audit entity: ' + event.entity);
      const recordExpression = event.entity === 'exam_attempt'
        ? "to_jsonb(r) - 'user_answers' - 'review_data'"
        : event.entity === 'user'
          ? "to_jsonb(r) - 'password_hash'"
          : 'to_jsonb(r)';
      const snapshot = await client.query(
        `SELECT ${recordExpression} AS record
         FROM ${table} AS r
         WHERE id = $1
         FOR UPDATE`,
        [event.entityId]
      );
      before = snapshot.rows[0]?.record || null;
    }
    const result = await client.query(query, values);
    if (result.rows.length) {
      const details = { ...(event.details || {}) };
      if (event.action === 'update' || event.action === 'status_change') {
        details.before = before;
        details.after = { ...(before || {}), ...result.rows[0] };
      } else if (event.action === 'delete') {
        details.before = before;
      }
      await insertAuditLog(client, req, {
        ...event,
        entityId: result.rows[0].id || event.entityId || null,
        details,
      });
    }
    await client.query('COMMIT');
    return result;
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Admin mutation rollback failed:', rollbackError);
      }
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { insertAuditLog, runAdminMutation };
