import { pool } from '../config/db.js';

export const NOTIFICATION_TYPES = {
  STREAK: 'streak',
  WEAK_AREA: 'weak_area',
  RECOMMENDATION: 'recommendation',
  MILESTONE: 'milestone',
  COUNTDOWN: 'countdown',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
};

const EUEE_EXAM_DATE =
  process.env.EUEE_EXAM_DATE && /^\d{4}-\d{2}-\d{2}$/.test(process.env.EUEE_EXAM_DATE)
    ? process.env.EUEE_EXAM_DATE
    : '2026-07-15';

function daysUntilExam() {
  const exam = new Date(`${EUEE_EXAM_DATE}T00:00:00Z`);
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const end = Date.UTC(exam.getUTCFullYear(), exam.getUTCMonth(), exam.getUTCDate());
  return Math.ceil((end - start) / (24 * 60 * 60 * 1000));
}

function isoWeekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t - new Date(Date.UTC(y, 0, 1))) / 86400000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
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

async function insertNotification(userId, { title, message, type = NOTIFICATION_TYPES.INFO, dedupeKey = null }) {
  try {
    if (dedupeKey) {
      const dup = await pool.query(
        `SELECT 1 FROM notifications WHERE user_id = $1 AND dedupe_key = $2 LIMIT 1`,
        [userId, dedupeKey]
      );
      if (dup.rows.length) return;
    }
    await pool.query(
      `
        INSERT INTO notifications (user_id, title, message, type, read, dedupe_key)
        VALUES ($1, $2, $3, $4, FALSE, $5)
      `,
      [userId, title.slice(0, 255), message, type, dedupeKey]
    );
  } catch (err) {
    if (err?.code === '23505') return;
    console.error('insertNotification:', err?.message || err);
  }
}

export async function runExamCountdownNotifications(userId) {
  const d = daysUntilExam();
  const wk = isoWeekKey();
  const thresholds = [90, 60, 30, 14, 7, 1, 0];
  if (!thresholds.includes(d)) return;

  const title =
    d <= 0
      ? 'EUEE exam day — you have prepared for this'
      : d === 1
        ? '1 day until EUEE'
        : `${d} days until EUEE`;

  const message =
    d <= 0
      ? 'Walk in calm, hydrated, and confident. Trust your reps — one question at a time.'
      : d <= 7
        ? `The exam is almost here (${EUEE_EXAM_DATE}). Prioritize sleep, light review, and timed drills — you are closer than you think.`
        : `There are ${d} days left until the EUEE (${EUEE_EXAM_DATE}). Keep a steady rhythm: mixed practice + weak-topic touch-ups each week.`;

  await insertNotification(userId, {
    title,
    message,
    type: NOTIFICATION_TYPES.COUNTDOWN,
    dedupeKey: `countdown_${d}_${wk}`,
  });
}

export async function runStreakMilestoneNotifications(userId) {
  const streak = await computeStreak(userId);
  const milestones = [3, 7, 14, 30, 60, 100];
  if (!milestones.includes(streak) || streak < 1) return;

  await insertNotification(userId, {
    title: `${streak}-day study streak!`,
    message:
      streak >= 30
        ? `Incredible consistency — ${streak} days in a row. Elite preparation is built from habits like yours.`
        : `You have studied ${streak} consecutive days. Momentum is compounding — protect it with even a short session tomorrow.`,
    type: NOTIFICATION_TYPES.MILESTONE,
    dedupeKey: `streak_milestone_${streak}`,
  });
}

export async function runStreakReminderNotifications(userId) {
  const streak = await computeStreak(userId);
  if (streak > 0) return;

  const { rows } = await pool.query(
    `
      SELECT
        (SELECT COUNT(*)::int FROM question_attempts WHERE user_id = $1)
        + (SELECT COUNT(*)::int FROM lesson_progress WHERE user_id = $1 AND completed = TRUE) AS n
    `,
    [userId]
  );
  const n = rows[0]?.n ?? 0;
  if (n < 3) return;

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  await insertNotification(userId, {
    title: 'Build momentum today',
    message:
      'You have studied on Fikir before — an active streak starts with one honest session. Even 20 focused minutes today keeps your EUEE prep honest and forward-moving.',
    type: NOTIFICATION_TYPES.STREAK,
    dedupeKey: `streak_nudge_${todayStr}`,
  });
}

export async function runWeakAreaNotifications(userId) {
  const wk = isoWeekKey();
  const { rows } = await pool.query(
    `
      SELECT wa.topic, wa.strength_score, s.name AS subject_name
      FROM weak_areas wa
      INNER JOIN subjects s ON s.id = wa.subject_id
      WHERE wa.user_id = $1 AND wa.strength_score < 42
      ORDER BY wa.strength_score ASC, wa.last_updated DESC
      LIMIT 3
    `,
    [userId]
  );

  for (const r of rows) {
    const key = `weak_${r.subject_name}_${r.topic}_${wk}`.replace(/\s+/g, '_').slice(0, 155);
    await insertNotification(userId, {
      title: `Strengthen ${r.subject_name}: ${r.topic}`,
      message: `Your strength score for this topic is ${r.strength_score}/100. Try a short targeted practice set and revisit the tutor explanation — small wins add up fast for EUEE.`,
      type: NOTIFICATION_TYPES.WEAK_AREA,
      dedupeKey: key,
    });
  }
}

export async function runQuestionCountMilestone(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM question_attempts WHERE user_id = $1`,
    [userId]
  );
  const c = rows[0]?.c ?? 0;
  const marks = [25, 50, 100, 250, 500, 1000];
  if (!marks.includes(c) || c < 1) return;

  await insertNotification(userId, {
    title: `${c} questions attempted`,
    message:
      c >= 100
        ? `You have crossed ${c} question attempts — that volume builds exam reflexes. Review misses briefly, then celebrate this milestone.`
        : `Every attempt trains pattern recognition. At ${c} questions, you are building serious EUEE readiness.`,
    type: NOTIFICATION_TYPES.MILESTONE,
    dedupeKey: `questions_milestone_${c}`,
  });
}

export async function runDailyStudyRecommendation(userId) {
  const { rows } = await pool.query(
    `
      SELECT spt.title, s.name AS subject_name, spt.day
      FROM study_plan_tasks spt
      INNER JOIN study_plans sp ON sp.id = spt.study_plan_id
      INNER JOIN subjects s ON s.id = spt.subject_id
      WHERE sp.user_id = $1 AND sp.status = 'active' AND spt.completed = FALSE
      ORDER BY spt.id ASC
      LIMIT 2
    `,
    [userId]
  );

  if (!rows.length) return;

  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    new Date().getDay()
  ];
  const match = rows.find((r) => r.day === todayName) || rows[0];
  const wk = isoWeekKey();

  await insertNotification(userId, {
    title: 'Today’s plan pick',
    message: `From your active study plan: “${match.title}” (${match.subject_name}). Knock it out while it is fresh — consistency beats cramming.`,
    type: NOTIFICATION_TYPES.RECOMMENDATION,
    dedupeKey: `daily_plan_${wk}`,
  });
}

/** Call after successful login (non-blocking from auth controller). */
export async function runPostLoginNotifications(userId) {
  await runExamCountdownNotifications(userId);
  await runStreakMilestoneNotifications(userId);
  await runStreakReminderNotifications(userId);
  await runWeakAreaNotifications(userId);
  await runQuestionCountMilestone(userId);
  await runDailyStudyRecommendation(userId);
}

/**
 * After finishing a practice session (first-time complete).
 * @param {object} results - buildResultsPayload shape
 */
export async function runAfterPracticeSessionComplete(userId, results) {
  const pct = results?.score?.percent ?? 0;
  const weakTopics = (results?.byTopic || [])
    .filter((t) => t.total > 0 && t.percent < 55)
    .slice(0, 2);

  if (weakTopics.length) {
    const topics = weakTopics.map((t) => t.topic).join(', ');
    await insertNotification(userId, {
      title: 'Practice follow-up',
      message: `Nice work finishing a session at ${pct}%. Topics to polish next: ${topics}. A 15-minute review here moves your EUEE needle the most.`,
      type: NOTIFICATION_TYPES.WEAK_AREA,
      dedupeKey: `practice_weak_${results.sessionId}`,
    });
  } else if (pct >= 82) {
    await insertNotification(userId, {
      title: 'Strong session — keep the pace',
      message: `You scored ${pct}% on this run. That is exam-ready accuracy on this mix — schedule another mixed set soon so the skill sticks.`,
      type: NOTIFICATION_TYPES.SUCCESS,
      dedupeKey: `practice_strong_${results.sessionId}`,
    });
  } else {
    await insertNotification(userId, {
      title: 'Session logged',
      message: `You completed another practice block at ${pct}%. Steady reps win EUEE — check your analytics for balance across subjects.`,
      type: NOTIFICATION_TYPES.RECOMMENDATION,
      dedupeKey: `practice_done_${results.sessionId}`,
    });
  }

  await runQuestionCountMilestone(userId);
}

function todayDateStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/** After first-time lesson completion. */
export async function runAfterLessonComplete(userId, { lessonTitle, subjectName, lessonId }) {
  const dedupeKey = `lesson_done_${lessonId}_${todayDateStr()}`.slice(0, 155);
  await insertNotification(userId, {
    title: `Lesson complete: ${lessonTitle}`,
    message: `${subjectName} — great job closing this lesson. Cement it with 3–5 related questions in the Question bank or a short practice set while the ideas are still warm.`,
    type: NOTIFICATION_TYPES.SUCCESS,
    dedupeKey,
  });
  await runStreakMilestoneNotifications(userId);
}
