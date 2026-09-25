const bcrypt = require('bcrypt');
const pool = require('../db');

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment before running this script.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }

  if (password.length < 16) {
    throw new Error('ADMIN_PASSWORD must be at least 16 characters long.');
  }

  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('ADMIN_PASSWORD must not exceed 72 UTF-8 bytes.');
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'admin', 'approved')
       RETURNING id, full_name, email, role, status`,
      ['System Administrator', email, passwordHash]
    );

    console.log('Administrator account created:', result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new Error('An account with that email already exists; no account was changed.');
    }

    throw error;
  }
}

createAdmin()
  .catch((error) => {
    console.error('Failed to create administrator account:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
