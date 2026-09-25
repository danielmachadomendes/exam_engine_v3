require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const examRoutes = require('./routes/exams');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;
const configuredOrigins = process.env.CORS_ORIGINS;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
}

if (process.env.NODE_ENV === 'production' && !configuredOrigins) {
  throw new Error('CORS_ORIGINS must be set in production to the deployed frontend origin(s).');
}

const allowedOrigins = new Set(
  (configuredOrigins || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

if (allowedOrigins.size === 0 || allowedOrigins.has('*')) {
  throw new Error('CORS_ORIGINS must contain one or more explicit frontend origins.');
}

for (const origin of allowedOrigins) {
  let parsedOrigin;

  try {
    parsedOrigin = new URL(origin);
  } catch {
    throw new Error(`Invalid origin in CORS_ORIGINS: ${origin}`);
  }

  if (parsedOrigin.origin !== origin) {
    throw new Error(`CORS_ORIGINS entries must be origins without paths: ${origin}`);
  }

  if (process.env.NODE_ENV === 'production' && parsedOrigin.protocol !== 'https:') {
    throw new Error(`Production CORS origins must use HTTPS: ${origin}`);
  }
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || allowedOrigins.has(origin));
  },
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/users', userRoutes);

// Healthcheck
app.get('/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    return res.status(200).json({
      status: 'healthy',
      message: 'Exam Engine Server is running smoothly!',
      dbTime: dbRes.rows[0].now,
    });
  } catch (error) {
    console.error('Database healthcheck failed:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
    });
  }
});

// Listener
app.listen(PORT, () => {
  console.log(`🚀 Server up and running on port ${PORT}`);
});