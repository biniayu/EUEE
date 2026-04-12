import { pool } from '../config/db.js';
import { ensureStudentProfile } from '../utils/studentProfile.js';

// TEST: profile → preferences → diagnostic (30 answers) → complete; status transitions on studentProfiles.

export function createOnboardingController() {
  return {
    async status(req, res) {
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
              sp.initial_study_plan,
              sp.primary_subject_id,
              sp.active_study_plan_id
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
    },

    async profile(req, res) {
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
          `UPDATE users SET name = $1, targetUniversity = $2, stream = $3 WHERE id = $4`,
          [safeName, targetUniversity || null, safeStream, userId]
        );

        await ensureStudentProfile(userId);
        await pool.query(`UPDATE studentProfiles SET onboarding_status = $1 WHERE user_id = $2`, [
          'profile_done',
          userId,
        ]);

        return res.json({ success: true, message: 'Profile information saved.' });
      } catch (err) {
        console.error('Onboarding profile error:', err);
        return res.status(500).json({ success: false, error: 'Failed to save profile.' });
      }
    },

    async preferences(req, res) {
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
    },

    async diagnostic(req, res) {
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

        const weakSubjects = subjectScores.filter((s) => s.scorePercent < 60).map((s) => s.subject);

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
          `UPDATE studentProfiles SET diagnostic_results = $1::jsonb, onboarding_status = $2 WHERE user_id = $3`,
          [JSON.stringify(analysis), 'diagnostic_done', userId]
        );

        await pool.query(`UPDATE users SET weakSubjects = $1::jsonb WHERE id = $2`, [
          JSON.stringify(weakSubjects),
          userId,
        ]);

        return res.json({
          success: true,
          message: 'Diagnostic submitted successfully.',
          analysis,
        });
      } catch (err) {
        console.error('Onboarding diagnostic error:', err);
        return res.status(500).json({ success: false, error: 'Failed to save diagnostic.' });
      }
    },

    async complete(req, res) {
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
          `UPDATE studentProfiles SET onboarding_status = $1, initial_study_plan = $2::jsonb WHERE user_id = $3`,
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
    },
  };
}
