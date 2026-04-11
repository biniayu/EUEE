import { pool } from '../config/db.js';

const SUBJECT_ORDER = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'SAT'];

function parseRange(raw) {
  const r = String(raw || 'week').toLowerCase();
  if (r === 'month') return 'month';
  if (r === 'all') return 'all';
  return 'week';
}

/** ISO date string for SQL start (inclusive), UTC midnight */
function rangeStartIso(range) {
  if (range === 'all') return '1970-01-01T00:00:00.000Z';
  const now = new Date();
  const d = new Date(now);
  if (range === 'week') d.setUTCDate(d.getUTCDate() - 7);
  if (range === 'month') d.setUTCDate(d.getUTCDate() - 30);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getAnalytics(req, res) {
  const userId = req.user.sub;
  const range = parseRange(req.query.range);
  const startIso = rangeStartIso(range);

  try {
    const [
      lessonHours,
      practiceSessionTime,
      attemptsAgg,
      trendRows,
      subjectPerf,
      lessonMinutesBySubject,
      attemptCountsBySubject,
      weakRows,
      recentSessions,
      diagnosticRow,
    ] = await Promise.all([
      pool.query(
        `
          SELECT COALESCE(SUM(time_spent), 0)::float AS seconds
          FROM lesson_progress
          WHERE user_id = $1 AND completed = TRUE AND completed_at >= $2::timestamptz
        `,
        [userId, startIso]
      ),
      pool.query(
        `
          SELECT
            COALESCE(
              SUM(
                EXTRACT(EPOCH FROM (completed_at - started_at))::float
              ),
              0
            ) AS seconds
          FROM practice_sessions
          WHERE user_id = $1
            AND completed_at IS NOT NULL
            AND completed_at >= $2::timestamptz
        `,
        [userId, startIso]
      ),
      pool.query(
        `
          SELECT
            COUNT(*)::int AS total,
            SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::int AS correct
          FROM question_attempts
          WHERE user_id = $1 AND attempted_at >= $2::timestamptz
        `,
        [userId, startIso]
      ),
      pool.query(
        `
          SELECT
            (attempted_at AT TIME ZONE 'UTC')::date AS day,
            COUNT(*)::int AS attempts,
            SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::int AS correct
          FROM question_attempts
          WHERE user_id = $1 AND attempted_at >= $2::timestamptz
          GROUP BY 1
          ORDER BY 1 ASC
        `,
        [userId, startIso]
      ),
      pool.query(
        `
          SELECT
            s.id AS subject_id,
            s.name AS subject_name,
            COUNT(qa.id)::int AS attempts,
            SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::int AS correct,
            CASE
              WHEN COUNT(qa.id) = 0 THEN NULL
              ELSE ROUND(100.0 * SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) / COUNT(qa.id), 1)::float
            END AS accuracy_percent
          FROM subjects s
          LEFT JOIN questions q ON q.subject_id = s.id
          LEFT JOIN question_attempts qa ON qa.question_id = q.id AND qa.user_id = $1 AND qa.attempted_at >= $2::timestamptz
          WHERE s.name = ANY ($3::text[])
          GROUP BY s.id, s.name
          ORDER BY array_position($3::text[], s.name)
        `,
        [userId, startIso, SUBJECT_ORDER]
      ),
      pool.query(
        `
          SELECT s.id AS subject_id, s.name AS subject_name,
                 COALESCE(SUM(lp.time_spent), 0)::bigint AS seconds
          FROM subjects s
          LEFT JOIN lessons l ON l.subject_id = s.id
          LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1 AND lp.completed = TRUE
            AND lp.completed_at >= $2::timestamptz
          WHERE s.name = ANY ($3::text[])
          GROUP BY s.id, s.name
          ORDER BY array_position($3::text[], s.name)
        `,
        [userId, startIso, SUBJECT_ORDER]
      ),
      pool.query(
        `
          SELECT s.id AS subject_id, s.name AS subject_name, COUNT(qa.id)::int AS attempts
          FROM question_attempts qa
          INNER JOIN questions q ON q.id = qa.question_id
          INNER JOIN subjects s ON s.id = q.subject_id
          WHERE qa.user_id = $1 AND qa.attempted_at >= $2::timestamptz
          GROUP BY s.id, s.name
        `,
        [userId, startIso]
      ),
      pool.query(
        `
          SELECT wa.topic, wa.strength_score, wa.last_updated, s.name AS subject_name
          FROM weak_areas wa
          INNER JOIN subjects s ON s.id = wa.subject_id
          WHERE wa.user_id = $1
          ORDER BY wa.strength_score ASC, wa.last_updated DESC
          LIMIT 20
        `,
        [userId]
      ),
      pool.query(
        `
          SELECT id, session_type, total_questions, score, started_at, completed_at
          FROM practice_sessions
          WHERE user_id = $1 AND completed_at IS NOT NULL AND completed_at >= $2::timestamptz
          ORDER BY completed_at DESC
          LIMIT 12
        `,
        [userId, startIso]
      ),
      pool.query(
        `SELECT diagnostic_results FROM studentProfiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      ),
    ]);

    const lessonSec = Number(lessonHours.rows[0]?.seconds) || 0;
    const practiceSec = Number(practiceSessionTime.rows[0]?.seconds) || 0;
    const studyHours = Math.round(((lessonSec + practiceSec) / 3600) * 10) / 10;

    const att = attemptsAgg.rows[0] || { total: 0, correct: 0 };
    const totalAttempts = att.total || 0;
    const correctAttempts = att.correct || 0;
    const accuracyPercent =
      totalAttempts > 0 ? Math.round((1000 * correctAttempts) / totalAttempts) / 10 : null;

    const avgTimeRes = await pool.query(
      `
        SELECT AVG(
          EXTRACT(EPOCH FROM (completed_at - started_at)) / NULLIF(total_questions, 0)
        )::float AS avg_sec
        FROM practice_sessions
        WHERE user_id = $1
          AND completed_at IS NOT NULL
          AND started_at IS NOT NULL
          AND total_questions > 0
          AND completed_at >= $2::timestamptz
      `,
      [userId, startIso]
    );
    const avgTimePerQuestionSeconds = avgTimeRes.rows[0]?.avg_sec
      ? Math.round(Number(avgTimeRes.rows[0].avg_sec))
      : null;

    const bySubject = subjectPerf.rows.map((r) => ({
      subjectId: r.subject_id,
      subjectName: r.subject_name,
      attempts: r.attempts,
      correct: r.correct,
      accuracyPercent: r.accuracy_percent,
    }));

    let mostImprovedSubject = null;
    let bestDelta = -Infinity;
    const diag = diagnosticRow.rows[0]?.diagnostic_results;
    const subjectScores = Array.isArray(diag?.subjectScores) ? diag.subjectScores : [];
    const normalizeDiagSubject = (name) => {
      if (!name) return name;
      if (name.includes('SAT') || name.includes('Scholastic')) return 'SAT';
      return name;
    };
    const diagMap = new Map(
      subjectScores.map((s) => [normalizeDiagSubject(s.subject), s.scorePercent])
    );

    for (const row of bySubject) {
      if (!row.subjectName || (row.attempts || 0) < 3) continue;
      const base = diagMap.get(row.subjectName);
      if (base == null || row.accuracyPercent == null) continue;
      const delta = row.accuracyPercent - base;
      if (delta > bestDelta) {
        bestDelta = delta;
        mostImprovedSubject = row.subjectName;
      }
    }
    if (!mostImprovedSubject && bySubject.length) {
      const sorted = [...bySubject]
        .filter((x) => x.accuracyPercent != null)
        .sort((a, b) => b.accuracyPercent - a.accuracyPercent);
      mostImprovedSubject = sorted[0]?.subjectName || null;
    }

    const trends = trendRows.rows.map((r) => ({
      date: r.day,
      attempts: r.attempts,
      scorePercent:
        r.attempts > 0 ? Math.round((1000 * Number(r.correct)) / Number(r.attempts)) / 10 : null,
    }));

    const attemptMap = new Map(attemptCountsBySubject.rows.map((r) => [r.subject_id, r.attempts]));
    const timeBySubject = lessonMinutesBySubject.rows.map((r) => {
      const lessonMin = Math.round(Number(r.seconds) / 60);
      const estPracticeMin = (attemptMap.get(r.subject_id) || 0) * 2;
      return {
        subjectName: r.subject_name,
        minutes: lessonMin + estPracticeMin,
        lessonMinutes: lessonMin,
        practiceEstimateMinutes: estPracticeMin,
      };
    });

    const skillLevels = bySubject.map((r) => ({
      subjectName: r.subjectName,
      score: r.accuracyPercent != null ? Math.round(r.accuracyPercent) : 0,
    }));

    const weakAreas = weakRows.rows.map((r) => ({
      topic: r.topic,
      subjectName: r.subject_name,
      strengthScore: r.strength_score,
      lastUpdated: r.last_updated,
    }));

    const recentTests = recentSessions.rows.map((r) => ({
      id: r.id,
      sessionType: r.session_type,
      totalQuestions: r.total_questions,
      scorePercent: r.score != null ? Number(r.score) : null,
      startedAt: r.started_at,
      completedAt: r.completed_at,
    }));

    const practiceScores = recentSessions.rows
      .map((r) => (r.score != null ? Number(r.score) : null))
      .filter((x) => x != null);
    const overallAcc = accuracyPercent ?? 0;
    const mockAvg = practiceScores.length
      ? practiceScores.reduce((a, b) => a + b, 0) / practiceScores.length
      : overallAcc;
    const diagnosticOverall =
      typeof diag?.overallScore === 'number' ? diag.overallScore : mockAvg;
    const blended = Math.round(mockAvg * 0.55 + diagnosticOverall * 0.25 + overallAcc * 0.2);
    const predicted = Math.min(700, Math.max(200, Math.round((blended / 100) * 700)));
    const sampleN = Math.max(practiceScores.length, Math.min(10, totalAttempts / 5));
    const margin = Math.max(25, Math.min(80, Math.round(90 - sampleN * 5)));

    return res.json({
      success: true,
      range,
      rangeLabel: range === 'week' ? 'This week' : range === 'month' ? 'This month' : 'All time',
      metrics: {
        studyHours,
        questionsAttempted: totalAttempts,
        accuracyPercent,
        avgTimePerQuestionSeconds,
        mostImprovedSubject: mostImprovedSubject || 'Keep practicing — trends will sharpen soon',
      },
      charts: {
        scoreTrend: trends,
        performanceBySubject: bySubject.map((r) => ({
          subjectName: r.subjectName,
          accuracyPercent: r.accuracyPercent ?? 0,
          attempts: r.attempts,
        })),
        timeBySubject,
        skillLevels,
      },
      weakAreas,
      recentTests,
      prediction: {
        predictedScore: predicted,
        margin,
        bandLow: Math.max(200, predicted - margin),
        bandHigh: Math.min(700, predicted + margin),
        narrative:
          'This estimate blends your recent practice scores, question accuracy, and diagnostic baseline. Consistency beats cramming — aim for steady weekly gains.',
      },
    });
  } catch (err) {
    console.error('getAnalytics:', err);
    return res.status(500).json({ success: false, error: 'Failed to load analytics.' });
  }
}
