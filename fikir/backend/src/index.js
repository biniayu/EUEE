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

async function ensureStudentProfile(userId) {
  const existing = await pool.query('SELECT id FROM studentProfiles WHERE user_id = $1 LIMIT 1', [userId]);
  if (existing.rowCount > 0) {
    return;
  }
  await pool.query(
    `
      INSERT INTO studentProfiles (user_id, preferences, onboarding_status, diagnostic_results, initial_study_plan)
      VALUES ($1, $2::jsonb, $3, $4::jsonb, $5::jsonb)
    `,
    [userId, JSON.stringify({}), 'pending', JSON.stringify({}), JSON.stringify({})]
  );
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

app.get('/api/onboarding/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    await ensureStudentProfile(userId);
    const statusRes = await pool.query(
      `
        SELECT
          u.name,
          u.email,
          u.stream,
          u.targetUniversity,
          sp.preferences,
          sp.onboarding_status,
          sp.diagnostic_results,
          sp.initial_study_plan
        FROM users u
        LEFT JOIN studentProfiles sp ON sp.user_id = u.id
        WHERE u.id = $1
        LIMIT 1
      `,
      [userId]
    );

    return res.json({
      success: true,
      status: statusRes.rows[0] || null,
    });
  } catch (err) {
    console.error('Onboarding status error:', err);
    return res.status(500).json({ success: false, error: 'Failed to get onboarding status.' });
  }
});

app.post('/api/onboarding/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { name, targetUniversity, stream } = req.body || {};
    const safeName = (name || '').trim();
    const safeStream = (stream || '').trim() || 'Natural Science';

    if (!safeName) {
      return res.status(400).json({ success: false, error: 'Name is required.' });
    }
    if (safeStream !== 'Natural Science') {
      return res.status(400).json({ success: false, error: 'Stream must be Natural Science.' });
    }

    await pool.query(
      `
        UPDATE users
        SET name = $1, targetUniversity = $2, stream = $3
        WHERE id = $4
      `,
      [safeName, targetUniversity || null, safeStream, userId]
    );

    await ensureStudentProfile(userId);
    await pool.query(
      `UPDATE studentProfiles SET onboarding_status = $1 WHERE user_id = $2`,
      ['profile_done', userId]
    );

    return res.json({ success: true, message: 'Profile information saved.' });
  } catch (err) {
    console.error('Onboarding profile error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save profile.' });
  }
});

app.post('/api/onboarding/preferences', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { hoursPerWeek, preferredStudyTimes, languagePreference } = req.body || {};
    const hours = Number(hoursPerWeek);
    if (!Number.isFinite(hours) || hours < 1) {
      return res.status(400).json({ success: false, error: 'Hours per week must be at least 1.' });
    }
    if (!Array.isArray(preferredStudyTimes) || preferredStudyTimes.length === 0) {
      return res.status(400).json({ success: false, error: 'Select at least one preferred study time.' });
    }
    if (!languagePreference) {
      return res.status(400).json({ success: false, error: 'Language preference is required.' });
    }

    await ensureStudentProfile(userId);
    await pool.query(
      `
        UPDATE studentProfiles
        SET preferences = $1::jsonb, onboarding_status = $2
        WHERE user_id = $3
      `,
      [
        JSON.stringify({
          hoursPerWeek: hours,
          preferredStudyTimes,
          languagePreference,
        }),
        'preferences_done',
        userId,
      ]
    );

    return res.json({ success: true, message: 'Study preferences saved.' });
  } catch (err) {
    console.error('Onboarding preferences error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save preferences.' });
  }
});

app.post('/api/onboarding/diagnostic', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { answers } = req.body || {};
    if (!Array.isArray(answers) || answers.length !== 30) {
      return res.status(400).json({ success: false, error: 'Diagnostic answers must include 30 responses.' });
    }

    const subjectStats = {};
    for (const answer of answers) {
      const subject = answer.subject;
      if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, correct: 0 };
      }
      subjectStats[subject].total += 1;
      if (Boolean(answer.isCorrect)) subjectStats[subject].correct += 1;
    }

    const subjectScores = Object.entries(subjectStats).map(([subject, stat]) => ({
      subject,
      scorePercent: Math.round((stat.correct / stat.total) * 100),
      correct: stat.correct,
      total: stat.total,
    }));

    const weakSubjects = subjectScores
      .filter((s) => s.scorePercent < 60)
      .map((s) => s.subject);

    const overallScore = Math.round(
      (answers.filter((a) => Boolean(a.isCorrect)).length / answers.length) * 100
    );

    const analysis = {
      overallScore,
      subjectScores,
      weakSubjects,
      strengths: subjectScores.filter((s) => s.scorePercent >= 70).map((s) => s.subject),
      planPreview: {
        title: 'AI Study Plan Preview',
        focus: weakSubjects.length > 0 ? weakSubjects : ['Mathematics', 'Physics'],
        weeklyTargets: [
          '2 focused revision sessions per weak subject',
          '1 mixed mock exam each week',
          'Daily 20-minute concept recap',
        ],
      },
    };

    await ensureStudentProfile(userId);
    await pool.query(
      `
        UPDATE studentProfiles
        SET diagnostic_results = $1::jsonb, onboarding_status = $2
        WHERE user_id = $3
      `,
      [JSON.stringify(analysis), 'diagnostic_done', userId]
    );

    await pool.query(
      `
        UPDATE users
        SET weakSubjects = $1::jsonb
        WHERE id = $2
      `,
      [JSON.stringify(weakSubjects), userId]
    );

    return res.json({
      success: true,
      message: 'Diagnostic submitted successfully.',
      analysis,
    });
  } catch (err) {
    console.error('Onboarding diagnostic error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save diagnostic.' });
  }
});

app.post('/api/onboarding/complete', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const profileRes = await pool.query(
      `
        SELECT u.name, u.stream, u.targetUniversity, sp.preferences, sp.diagnostic_results
        FROM users u
        LEFT JOIN studentProfiles sp ON sp.user_id = u.id
        WHERE u.id = $1
        LIMIT 1
      `,
      [userId]
    );
    const row = profileRes.rows[0];
    if (!row) {
      return res.status(404).json({ success: false, error: 'Profile not found.' });
    }

    const diagnostic = row.diagnostic_results || {};
    const preferences = row.preferences || {};
    const weakSubjects = diagnostic.weakSubjects || ['Mathematics', 'Physics'];

    const studyPlan = {
      generatedAt: new Date().toISOString(),
      student: row.name,
      stream: row.stream || 'Natural Science',
      targetUniversity: row.targetuniversity || 'Not specified',
      weeklyHours: preferences.hoursPerWeek || 10,
      focusSubjects: weakSubjects,
      weeklySchedule: [
        { day: 'Monday', task: 'Mathematics problem solving and formulas' },
        { day: 'Tuesday', task: 'Physics concepts and numerical drills' },
        { day: 'Wednesday', task: 'Chemistry reactions + quiz' },
        { day: 'Thursday', task: 'Biology diagrams and definitions' },
        { day: 'Friday', task: 'English and SAT mixed practice' },
        { day: 'Saturday', task: 'Full mixed mock test' },
      ],
    };

    await ensureStudentProfile(userId);
    await pool.query(
      `
        UPDATE studentProfiles
        SET onboarding_status = $1, initial_study_plan = $2::jsonb
        WHERE user_id = $3
      `,
      ['completed', JSON.stringify(studyPlan), userId]
    );

    return res.json({
      success: true,
      message: 'Onboarding completed!',
      studyPlan,
    });
  } catch (err) {
    console.error('Onboarding complete error:', err);
    return res.status(500).json({ success: false, error: 'Failed to complete onboarding.' });
  }
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
