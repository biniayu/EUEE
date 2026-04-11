import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { setAuthCookie, clearAuthCookie } from '../utils/cookies.js';

export function createAuthController({ jwtSecret, jwtExpiresIn, nodeEnv }) {
  return {
    async signup(req, res) {
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
          [user.id, JSON.stringify({ studyMode: 'guided', weeklyGoalHours: 8 }), 'pending']
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
    },

    async login(req, res) {
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

        const token = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, {
          expiresIn: jwtExpiresIn,
        });

        setAuthCookie(res, token, nodeEnv);

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
    },

    async me(req, res) {
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
              sp.onboarding_status,
              sp.primary_subject_id,
              sp.active_study_plan_id
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
            primarySubjectId: user.primary_subject_id,
            activeStudyPlanId: user.active_study_plan_id,
          },
        });
      } catch (err) {
        console.error('/me error:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch user data.' });
      }
    },

    logout(req, res) {
      clearAuthCookie(res, nodeEnv);
      return res.json({ success: true, message: 'Logged out successfully.' });
    },
  };
}
