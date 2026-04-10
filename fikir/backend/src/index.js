import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, runMigrations } from './config/db.js';
import { requireAuth } from './middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const app = express();

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error', err);
});

app.use(
  cors({
    origin:
      NODE_ENV === 'production'
        ? true
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      fullName,
      gradeLevel,
      stream,
      targetUniversity,
      weakSubjects,
    } = req.body || {};

    const safeName = (name || fullName || '').trim();
    const safeEmail = (email || '').trim().toLowerCase();

    if (!safeName) {
      return res.status(400).json({ success: false, error: 'Name is required.' });
    }
    if (!safeEmail || !safeEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const subjects = Array.isArray(weakSubjects) ? weakSubjects : [];
    const studentStream = stream || 'Natural Science';

    const insertUser = await pool.query(
      `
        INSERT INTO users (email, password, name, gradeLevel, stream, targetUniversity, weakSubjects)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        RETURNING id, email, name, gradeLevel, stream, targetUniversity, weakSubjects, created_at
      `,
      [
        safeEmail,
        hashed,
        safeName,
        gradeLevel || null,
        studentStream,
        targetUniversity || null,
        JSON.stringify(subjects),
      ]
    );

    const user = insertUser.rows[0];

    await pool.query(
      `
        INSERT INTO studentProfiles (user_id, preferences, onboarding_status)
        VALUES ($1, $2::jsonb, $3)
      `,
      [
        user.id,
        JSON.stringify({ studyMode: 'guided', weeklyGoalHours: 8 }),
        'pending',
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
    });
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(409).json({ success: false, error: 'Email already in use.' });
    }
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const safeEmail = (email || '').trim().toLowerCase();

    if (!safeEmail || !safeEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email is required.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required.' });
    }

    const result = await pool.query(
      `SELECT id, email, password, name, gradeLevel, stream, targetUniversity, weakSubjects FROM users WHERE email = $1 LIMIT 1`,
      [safeEmail]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    setAuthCookie(res, token);

    return res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        gradeLevel: user.gradelevel,
        stream: user.stream,
        targetUniversity: user.targetuniversity,
        weakSubjects: user.weaksubjects,
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Failed to login.' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const result = await pool.query(
      `
        SELECT
          u.id,
          u.email,
          u.name,
          u.gradeLevel,
          u.stream,
          u.targetUniversity,
          u.weakSubjects,
          sp.preferences,
          sp.onboarding_status
        FROM users u
        LEFT JOIN studentProfiles sp ON sp.user_id = u.id
        WHERE u.id = $1
        LIMIT 1
      `,
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        gradeLevel: user.gradelevel,
        stream: user.stream,
        targetUniversity: user.targetuniversity,
        weakSubjects: user.weaksubjects,
        preferences: user.preferences,
        onboardingStatus: user.onboarding_status,
      },
    });
  } catch (err) {
    console.error('/me error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch user data.' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return res.json({ success: true, message: 'Logged out successfully.' });
});

if (NODE_ENV === 'production') {
  const dist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

(async function start() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`Fikir API running on http://localhost:${PORT} (${NODE_ENV})`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
