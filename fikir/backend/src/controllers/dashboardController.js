import { pool } from '../config/db.js';

const SUBJECT_ORDER = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'SAT'];

const EUEE_EXAM_DATE =
  process.env.EUEE_EXAM_DATE && /^\d{4}-\d{2}-\d{2}$/.test(process.env.EUEE_EXAM_DATE)
    ? process.env.EUEE_EXAM_DATE
    : '2026-07-15';

function daysUntil(dateStr) {
  const exam = new Date(`${dateStr}T00:00:00Z`);
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const end = Date.UTC(exam.getUTCFullYear(), exam.getUTCMonth(), exam.getUTCDate());
  return Math.ceil((end - start) / (24 * 60 * 60 * 1000));
}

function weekdayName(d = new Date()) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
}

/** Map onboarding diagnostic subject label to DB subject name */
function mapDiagnosticSubjectToDb(name) {
  if (!name) return null;
  if (name.includes('SAT') || name.includes('Scholastic')) return 'SAT';
  return name;
}

async function computeStreak(userId) {
  const { rows } = await pool.query(
    `
      SELECT DISTINCT d::date AS day
      FROM (
        SELECT completed_at::date AS d
        FROM lesson_progress
        WHERE user_id = $1 AND completed = TRUE AND completed_at IS NOT NULL
        UNION
        SELECT attempted_at::date AS d
        FROM question_attempts
        WHERE user_id = $1
      ) t
      WHERE d IS NOT NULL
      ORDER BY day DESC
    `,
    [userId]
  );

  if (!rows.length) return 0;

  const toKey = (d) => {
    const x = d instanceof Date ? d : new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };

  const set = new Set(rows.map((r) => toKey(r.day)));
  const today = new Date();
  let check = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let streak = 0;

  if (!set.has(toKey(check))) {
    check.setDate(check.getDate() - 1);
    if (!set.has(toKey(check))) return 0;
  }

  while (set.has(toKey(check))) {
    streak += 1;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

async function subjectProgressRows(userId) {
  const { rows } = await pool.query(
    `
      SELECT
        s.id AS subject_id,
        s.name AS subject_name,
        COALESCE(lc.total_lessons, 0)::int AS total_lessons,
        COALESCE(lp.completed_lessons, 0)::int AS lessons_completed,
        COALESCE(qa.attempts, 0)::int AS practice_attempted,
        CASE
          WHEN COALESCE(qa.attempts, 0) = 0 THEN NULL
          ELSE ROUND(100.0 * qa.correct / qa.attempts)::int
        END AS performance_percent
      FROM subjects s
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS total_lessons FROM lessons l WHERE l.subject_id = s.id
      ) lc ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS completed_lessons
        FROM lesson_progress lp
        INNER JOIN lessons l ON l.id = lp.lesson_id
        WHERE lp.user_id = $1 AND l.subject_id = s.id AND lp.completed = TRUE
      ) lp ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS attempts,
          SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::int AS correct
        FROM question_attempts qa
        INNER JOIN questions q ON q.id = qa.question_id
        WHERE qa.user_id = $1 AND q.subject_id = s.id
      ) qa ON TRUE
      WHERE s.name = ANY ($2::text[])
      ORDER BY array_position($2::text[], s.name)
    `,
    [userId, SUBJECT_ORDER]
  );
  return rows;
}

function lessonProgressPercent(row) {
  const total = row.total_lessons || 0;
  const done = row.lessons_completed || 0;
  if (total <= 0) return row.performance_percent != null ? row.performance_percent : 0;
  return Math.round((done / total) * 100);
}

export async function getOverview(req, res) {
  try {
    const userId = req.user.sub;
    const [userRes, streak, subjects, notifRes] = await Promise.all([
      pool.query(`SELECT name FROM users WHERE id = $1 LIMIT 1`, [userId]),
      computeStreak(userId),
      subjectProgressRows(userId),
      pool.query(
        `SELECT COUNT(*)::int AS c FROM notifications WHERE user_id = $1 AND read = FALSE`,
        [userId]
      ),
    ]);

    const name = userRes.rows[0]?.name || 'Student';
    const percents = subjects.map((r) => lessonProgressPercent(r));
    const overallProgress =
      percents.length > 0 ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : 0;

    let overall = overallProgress;
    if (overall === 0) {
      const diag = await pool.query(
        `SELECT diagnostic_results FROM studentProfiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      const dr = diag.rows[0]?.diagnostic_results;
      if (dr && typeof dr.overallScore === 'number') overall = dr.overallScore;
    }

    const daysLeft = daysUntil(EUEE_EXAM_DATE);

    return res.json({
      success: true,
      overview: {
        userName: name,
        streakDays: streak,
        streakLabel: streak === 1 ? '1 day streak' : `${streak} day streak`,
        overallProgressPercent: Math.min(100, Math.max(0, overall)),
        eueeExamDate: EUEE_EXAM_DATE,
        daysUntilExam: daysLeft,
        examCountdownLabel:
          daysLeft > 0
            ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} until EUEE`
            : daysLeft === 0
              ? 'EUEE is today — you’ve got this!'
              : `EUEE date passed (${EUEE_EXAM_DATE})`,
        unreadNotifications: notifRes.rows[0]?.c ?? 0,
      },
    });
  } catch (err) {
    console.error('dashboard overview error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load overview.' });
  }
}

export async function getSubjectProgress(req, res) {
  try {
    const userId = req.user.sub;
    const rows = await subjectProgressRows(userId);
    const subjects = rows.map((r) => {
      const progressPercent = lessonProgressPercent(r);
      return {
        subjectId: r.subject_id,
        subjectName: r.subject_name,
        lessonsCompleted: r.lessons_completed,
        lessonsTotal: r.total_lessons,
        practiceAttempted: r.practice_attempted,
        performancePercent: r.performance_percent,
        progressPercent: Math.min(100, Math.max(0, progressPercent)),
      };
    });
    return res.json({ success: true, subjects });
  } catch (err) {
    console.error('dashboard subject-progress error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load subject progress.' });
  }
}

export async function getTodayTasks(req, res) {
  try {
    const userId = req.user.sub;
    const { rows: dbTasks } = await pool.query(
      `
        SELECT
          spt.id,
          spt.day,
          spt.duration_minutes,
          spt.completed,
          s.name AS subject_name,
          spt.question_set,
          l.title AS lesson_title
        FROM study_plan_tasks spt
        INNER JOIN study_plans sp ON sp.id = spt.study_plan_id
        INNER JOIN subjects s ON s.id = spt.subject_id
        LEFT JOIN lessons l ON l.id = spt.lesson_id
        WHERE sp.user_id = $1 AND sp.status = 'active' AND spt.completed = FALSE
        ORDER BY spt.id ASC
        LIMIT 5
      `,
      [userId]
    );

    if (dbTasks.length > 0) {
      return res.json({
        success: true,
        source: 'study_plan_tasks',
        tasks: dbTasks.map((t) => ({
          id: String(t.id),
          title: t.lesson_title || t.question_set || `${t.subject_name} study block`,
          subjectName: t.subject_name,
          durationMinutes: t.duration_minutes,
          day: t.day,
          completed: t.completed,
          ctaLabel: 'Start',
        })),
      });
    }

    const { rows: profRows } = await pool.query(
      `SELECT initial_study_plan FROM studentProfiles WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    const plan = profRows[0]?.initial_study_plan;
    const schedule = Array.isArray(plan?.weeklySchedule) ? plan.weeklySchedule : [];
    const today = weekdayName();
    const match = schedule.find((w) => w?.day === today);

    const tasks = [];
    if (match?.task) {
      tasks.push({
        id: `plan-${today}`,
        title: match.task,
        subjectName: 'Mixed',
        durationMinutes: 45,
        day: today,
        completed: false,
        ctaLabel: 'Start',
      });
    }

    const focus = Array.isArray(plan?.focusSubjects) ? plan.focusSubjects : [];
    for (let i = 0; i < Math.min(2, focus.length); i += 1) {
      const sub = focus[i];
      tasks.push({
        id: `focus-${i}-${sub}`,
        title: `Strengthen ${sub}: timed practice set`,
        subjectName: sub,
        durationMinutes: 30,
        day: today,
        completed: false,
        ctaLabel: 'Start',
      });
    }

    return res.json({
      success: true,
      source: 'initial_study_plan',
      tasks: tasks.slice(0, 4),
      emptyMessage:
        tasks.length === 0
          ? 'Add a study plan or finish onboarding to see personalized tasks for today.'
          : undefined,
    });
  } catch (err) {
    console.error('dashboard today-tasks error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load today’s tasks.' });
  }
}

export async function getRecommendations(req, res) {
  try {
    const userId = req.user.sub;
    const { rows: weakRows } = await pool.query(
      `
        SELECT
          wa.id,
          wa.topic,
          wa.strength_score,
          s.name AS subject_name
        FROM weak_areas wa
        INNER JOIN subjects s ON s.id = wa.subject_id
        WHERE wa.user_id = $1
        ORDER BY wa.strength_score ASC, wa.last_updated DESC
        LIMIT 8
      `,
      [userId]
    );

    if (weakRows.length > 0) {
      return res.json({
        success: true,
        source: 'weak_areas',
        recommendations: weakRows.map((w) => ({
          id: `wa-${w.id}`,
          title: `Review: ${w.topic}`,
          subjectName: w.subject_name,
          strengthScore: w.strength_score,
          body: `Your strength score in this topic is ${w.strength_score}%. Short, focused drills will lift it fastest.`,
          actionLabel: 'Review weak area',
          actionHref: '/dashboard',
        })),
      });
    }

    const { rows: profRows } = await pool.query(
      `SELECT diagnostic_results FROM studentProfiles WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    const dr = profRows[0]?.diagnostic_results;
    const scores = Array.isArray(dr?.subjectScores) ? dr.subjectScores : [];
    const low = scores
      .filter((s) => typeof s.scorePercent === 'number' && s.scorePercent < 65)
      .sort((a, b) => a.scorePercent - b.scorePercent)
      .slice(0, 4);

    const recommendations = low.map((s, i) => {
      const dbName = mapDiagnosticSubjectToDb(s.subject);
      return {
        id: `diag-${i}-${s.subject}`,
        title: `Boost ${dbName || s.subject}`,
        subjectName: dbName || s.subject,
        strengthScore: s.scorePercent,
        body: `Diagnostic showed ${s.correct}/${s.total} correct (${s.scorePercent}%). Targeted review will turn this into a strength.`,
        actionLabel: 'Review weak area',
        actionHref: '/dashboard',
      };
    });

    return res.json({
      success: true,
      source: 'diagnostic_results',
      recommendations,
    });
  } catch (err) {
    console.error('dashboard recommendations error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load recommendations.' });
  }
}

export async function getStats(req, res) {
  try {
    const userId = req.user.sub;
    const weekStartSql = `date_trunc('week', CURRENT_TIMESTAMP)`;

    const [lessonWeek, attemptsWeek, attemptsAllTime, diagRes, thisWeekBySubject] = await Promise.all([
      pool.query(
        `
          SELECT COALESCE(SUM(time_spent), 0)::int AS seconds
          FROM lesson_progress
          WHERE user_id = $1
            AND completed = TRUE
            AND completed_at >= ${weekStartSql}
        `,
        [userId]
      ),
      pool.query(
        `
          SELECT
            COUNT(*)::int AS total,
            SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::int AS correct
          FROM question_attempts
          WHERE user_id = $1 AND attempted_at >= ${weekStartSql}
        `,
        [userId]
      ),
      pool.query(
        `
          SELECT
            COUNT(*)::int AS total,
            SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::int AS correct
          FROM question_attempts
          WHERE user_id = $1
        `,
        [userId]
      ),
      pool.query(
        `SELECT diagnostic_results FROM studentProfiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      ),
      pool.query(
        `
          SELECT
            q.subject_id,
            COUNT(*)::int AS total,
            SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::int AS correct
          FROM question_attempts qa
          INNER JOIN questions q ON q.id = qa.question_id
          WHERE qa.user_id = $1 AND qa.attempted_at >= ${weekStartSql}
          GROUP BY q.subject_id
        `,
        [userId]
      ),
    ]);

    const lessonSeconds = lessonWeek.rows[0]?.seconds ?? 0;
    const attemptTotal = attemptsWeek.rows[0]?.total ?? 0;
    const attemptCorrect = attemptsWeek.rows[0]?.correct ?? 0;
    const attemptMinutesEstimate = attemptTotal * 2;
    const studyHoursThisWeek = Math.round((lessonSeconds / 3600 + attemptMinutesEstimate / 60) * 10) / 10;

    const allTotal = attemptsAllTime.rows[0]?.total ?? 0;
    const allCorrect = attemptsAllTime.rows[0]?.correct ?? 0;
    let accuracyPercent =
      attemptTotal > 0 ? Math.round((attemptCorrect / attemptTotal) * 100) : null;
    if (accuracyPercent == null && allTotal > 0) {
      accuracyPercent = Math.round((allCorrect / allTotal) * 100);
    }

    const dr = diagRes.rows[0]?.diagnostic_results;
    const subjectScores = Array.isArray(dr?.subjectScores) ? dr.subjectScores : [];
    const diagBySubject = new Map(
      subjectScores.map((s) => [mapDiagnosticSubjectToDb(s.subject) || s.subject, s.scorePercent])
    );

    const { rows: subjectNames } = await pool.query(
      `SELECT id, name FROM subjects WHERE name = ANY ($1::text[])`,
      [SUBJECT_ORDER]
    );
    const idToName = Object.fromEntries(subjectNames.map((r) => [r.id, r.name]));

    let bestDelta = -Infinity;
    let mostImprovedSubject = null;

    for (const r of thisWeekBySubject.rows) {
      const name = idToName[r.subject_id];
      if (!name || !r.total) continue;
      const current = Math.round((r.correct / r.total) * 100);
      const baseline = diagBySubject.get(name);
      if (baseline == null) continue;
      const delta = current - baseline;
      if (delta > bestDelta) {
        bestDelta = delta;
        mostImprovedSubject = name;
      }
    }

    if (!mostImprovedSubject && subjectScores.length) {
      const sorted = [...subjectScores].sort((a, b) => b.scorePercent - a.scorePercent);
      mostImprovedSubject = mapDiagnosticSubjectToDb(sorted[0].subject) || sorted[0].subject;
    }

    return res.json({
      success: true,
      stats: {
        studyHoursThisWeek,
        accuracyPercent,
        accuracyLabel:
          accuracyPercent != null
            ? attemptTotal > 0
              ? `${accuracyPercent}% this week`
              : `${accuracyPercent}% all-time`
            : 'Answer questions to see accuracy',
        mostImprovedSubject: mostImprovedSubject || 'Keep practicing — trends will appear soon',
        mostImprovedDelta: bestDelta > -Infinity ? bestDelta : null,
        practiceAttemptsThisWeek: attemptTotal,
      },
    });
  } catch (err) {
    console.error('dashboard stats error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load stats.' });
  }
}
