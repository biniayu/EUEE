import { pool } from '../config/db.js';

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

const VALID_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const VALID_TASK_TYPES = ['lesson', 'practice', 'review', 'mock'];

const PLANNER_SYSTEM = `You are an expert EUEE study planner for Grade 12 Natural Science students in Ethiopia. Generate realistic, balanced weekly plans that prioritize weak areas while covering all subjects (Mathematics, Physics, Chemistry, Biology, English, SAT). Respect EUEE-style pacing: mix conceptual lessons, timed practice, and short reviews. Plans must be achievable for a busy student — prefer depth over overload.

You MUST respond with a single JSON object only (no markdown fences, no commentary). Use this exact shape:
{
  "planSummary": "2-4 sentences motivating the student and summarizing the week's strategy.",
  "tasks": [
    {
      "day": "Monday",
      "subjectName": "Mathematics",
      "taskType": "lesson",
      "durationMinutes": 40,
      "title": "Short label shown in the app",
      "focusTopic": "optional topic hint"
    }
  ]
}

Rules:
- "day" must be one of: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.
- "subjectName" must be exactly one of: Mathematics, Physics, Chemistry, Biology, English, SAT.
- "taskType" must be one of: lesson, practice, review, mock.
- Include every subject at least once across the week when possible.
- Allocate total "durationMinutes" across tasks to approximately match the student's weekly hours budget (within ±15%).
- Use 20–40 tasks for a typical week; fewer if hoursPerWeek is under 8.
- Prioritize extra practice blocks on subjects listed in weakAreas and low diagnostic scores.
- mock tasks: at most 1–2 per week, timed blocks.
- Titles must be concrete (e.g. "Kinematics drill — 25 questions") not generic ("Study math").`;

function toISODateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mondayStartReferenceDate(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay();
  const toMon = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + toMon);
  return x;
}

function weekRangeFromMonday(mondayDate) {
  const start = new Date(mondayDate);
  const end = new Date(mondayDate);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

function parseGroqJson(content) {
  let s = String(content || '').trim();
  if (!s) throw new Error('Empty planner response');
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  return JSON.parse(s);
}

function normalizeSubjectName(raw, subjectRows) {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  const lower = t.toLowerCase();
  for (const row of subjectRows) {
    if (row.name.toLowerCase() === lower) return row.name;
  }
  if (lower.includes('math')) return 'Mathematics';
  if (lower.includes('phys')) return 'Physics';
  if (lower.includes('chem')) return 'Chemistry';
  if (lower.includes('bio')) return 'Biology';
  if (lower.includes('english')) return 'English';
  if (lower.includes('sat')) return 'SAT';
  return null;
}

function normalizeDay(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  const hit = VALID_DAYS.find((d) => d.toLowerCase() === t.toLowerCase());
  return hit || null;
}

function normalizeTaskType(raw) {
  if (!raw || typeof raw !== 'string') return 'lesson';
  const t = raw.trim().toLowerCase();
  return VALID_TASK_TYPES.includes(t) ? t : 'lesson';
}

async function loadPlannerContext(userId) {
  const [
    userRow,
    profileRow,
    weakRows,
    subjRows,
    lessonProg,
    attemptAgg,
  ] = await Promise.all([
    pool.query(
      `SELECT id, name, weakSubjects, stream, targetUniversity FROM users WHERE id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT diagnostic_results, preferences, onboarding_status FROM studentProfiles WHERE user_id = $1 LIMIT 1`,
      [userId]
    ),
    pool.query(
      `
        SELECT wa.topic, wa.strength_score, s.name AS subject_name
        FROM weak_areas wa
        INNER JOIN subjects s ON s.id = wa.subject_id
        WHERE wa.user_id = $1
        ORDER BY wa.strength_score ASC, wa.last_updated DESC
        LIMIT 20
      `,
      [userId]
    ),
    pool.query(`SELECT id, name, euee_weightage FROM subjects ORDER BY id`),
    pool.query(
      `
        SELECT s.name AS subject_name,
               COUNT(*) FILTER (WHERE lp.completed) AS completed_lessons,
               COUNT(*) AS total_lessons
        FROM lessons l
        INNER JOIN subjects s ON s.id = l.subject_id
        LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
        GROUP BY s.name
      `,
      [userId]
    ),
    pool.query(
      `
        SELECT s.name AS subject_name,
               COUNT(*)::int AS attempts,
               ROUND(100.0 * AVG(CASE WHEN qa.is_correct THEN 1 ELSE 0 END), 1) AS accuracy_pct
        FROM question_attempts qa
        INNER JOIN questions q ON q.id = qa.question_id
        INNER JOIN subjects s ON s.id = q.subject_id
        WHERE qa.user_id = $1
        GROUP BY s.name
      `,
      [userId]
    ),
  ]);

  const user = userRow.rows[0] || {};
  const profile = profileRow.rows[0] || {};

  return {
    student: {
      name: user.name,
      stream: user.stream,
      targetUniversity: user.targetuniversity,
      weakSubjects: user.weaksubjects,
    },
    onboardingStatus: profile.onboarding_status,
    diagnosticResults: profile.diagnostic_results || {},
    preferences: profile.preferences || {},
    weakAreas: weakRows.rows.map((r) => ({
      subject: r.subject_name,
      topic: r.topic,
      strengthScore: r.strength_score,
    })),
    subjectWeightage: subjRows.rows.map((r) => ({
      name: r.name,
      eueeWeight: Number(r.euee_weightage),
    })),
    lessonProgressBySubject: lessonProg.rows.map((r) => ({
      subject: r.subject_name,
      completedLessons: Number(r.completed_lessons || 0),
      totalLessons: Number(r.total_lessons || 0),
    })),
    practiceAccuracyBySubject: attemptAgg.rows.map((r) => ({
      subject: r.subject_name,
      attempts: r.attempts,
      accuracyPercent: r.accuracy_pct != null ? Number(r.accuracy_pct) : null,
    })),
    subjects: subjRows.rows,
  };
}

async function pickNextLessonId(client, userId, subjectId, taskType, usedLessonIds) {
  if (taskType !== 'lesson' && taskType !== 'review') return null;
  const used = Array.isArray(usedLessonIds) ? usedLessonIds.filter((id) => Number.isInteger(id)) : [];
  const { rows } = await client.query(
    `
      SELECT l.id
      FROM lessons l
      LEFT JOIN lesson_progress lp
        ON lp.lesson_id = l.id AND lp.user_id = $2 AND lp.completed = TRUE
      WHERE l.subject_id = $1
        AND lp.id IS NULL
        AND NOT (l.id = ANY ($3::int[]))
      ORDER BY l.sort_order NULLS LAST, l.id
      LIMIT 1
    `,
    [subjectId, userId, used]
  );
  return rows[0]?.id ?? null;
}

async function callGroqPlanner({ userPayload, hoursPerWeek, examDate, preferences }) {
  const apiKey =
    process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.GROQ_KEY;
  if (!apiKey) {
    const err = new Error('GROQ_NOT_CONFIGURED');
    err.code = 'GROQ_NOT_CONFIGURED';
    throw err;
  }

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const userContent = JSON.stringify({
    instruction: 'Build one weekly study plan from the data below.',
    hoursPerWeek,
    examDate,
    preferences: preferences || {},
    studentContext: userPayload,
  });

  const messages = [
    { role: 'system', content: PLANNER_SYSTEM },
    { role: 'user', content: userContent },
  ];

  async function postGroq(extra = {}) {
    const groqRes = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 8192,
        messages,
        ...extra,
      }),
    });
    const groqData = await groqRes.json().catch(() => ({}));
    return { groqRes, groqData };
  }

  let { groqRes, groqData } = await postGroq({ response_format: { type: 'json_object' } });
  if (!groqRes.ok && groqData?.error?.message?.toLowerCase?.().includes('json')) {
    ({ groqRes, groqData } = await postGroq({}));
  }

  if (!groqRes.ok) {
    console.error('Groq planner error:', groqRes.status, groqData);
    throw new Error(groqData?.error?.message || `Groq HTTP ${groqRes.status}`);
  }

  const content = groqData?.choices?.[0]?.message?.content;
  return parseGroqJson(content);
}

export async function getStudyPlan(req, res) {
  const userId = req.user.sub;
  try {
    const { rows: planRows } = await pool.query(
      `
        SELECT
          sp.id,
          sp.start_date AS "startDate",
          sp.end_date AS "endDate",
          sp.total_hours_per_week AS "totalHoursPerWeek",
          sp.status,
          sp.exam_target_date AS "examTargetDate",
          sp.plan_preferences AS "planPreferences",
          sp.plan_summary AS "planSummary",
          sp.generated_at AS "generatedAt"
        FROM study_plans sp
        WHERE sp.user_id = $1 AND sp.status = 'active'
        ORDER BY sp.id DESC
        LIMIT 1
      `,
      [userId]
    );

    if (!planRows.length) {
      return res.json({
        success: true,
        hasActivePlan: false,
        plan: null,
        summary: {
          totalTasks: 0,
          completedTasks: 0,
          completionPercent: 0,
          adherenceRate: 0,
          totalPlannedMinutes: 0,
          completedMinutes: 0,
          totalPlannedHours: 0,
        },
      });
    }

    const plan = planRows[0];

    const { rows: taskRows } = await pool.query(
      `
        SELECT
          spt.id,
          spt.day,
          spt.subject_id AS "subjectId",
          s.name AS "subjectName",
          spt.lesson_id AS "lessonId",
          spt.question_set AS "questionSet",
          spt.duration_minutes AS "durationMinutes",
          spt.completed,
          spt.task_type AS "taskType",
          spt.title,
          spt.sort_order AS "sortOrder",
          spt.completed_at AS "completedAt",
          l.title AS "lessonTitle"
        FROM study_plan_tasks spt
        INNER JOIN subjects s ON s.id = spt.subject_id
        LEFT JOIN lessons l ON l.id = spt.lesson_id
        WHERE spt.study_plan_id = $1
        ORDER BY spt.sort_order ASC, spt.id ASC
      `,
      [plan.id]
    );

    const tasks = taskRows.map((t) => ({
      id: t.id,
      day: t.day,
      subjectId: t.subjectId,
      subjectName: t.subjectName,
      lessonId: t.lessonId,
      lessonTitle: t.lessonTitle,
      questionSet: t.questionSet,
      durationMinutes: t.durationMinutes,
      completed: t.completed,
      taskType: t.taskType || (t.lessonId ? 'lesson' : 'practice'),
      title:
        t.title ||
        t.lessonTitle ||
        t.questionSet ||
        `${t.subjectName} ${t.taskType || 'session'}`,
      sortOrder: t.sortOrder,
      completedAt: t.completedAt,
    }));

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((x) => x.completed).length;
    const totalPlannedMinutes = tasks.reduce((a, t) => a + (t.durationMinutes || 0), 0);
    const completedMinutes = tasks
      .filter((x) => x.completed)
      .reduce((a, t) => a + (t.durationMinutes || 0), 0);
    const completionPercent =
      totalTasks > 0 ? Math.round((100 * completedTasks) / totalTasks) : 0;
    const adherenceRate =
      totalPlannedMinutes > 0
        ? Math.min(100, Math.round((100 * completedMinutes) / totalPlannedMinutes))
        : 0;

    const tasksByDay = {};
    for (const d of VALID_DAYS) tasksByDay[d] = [];
    for (const t of tasks) {
      if (!tasksByDay[t.day]) tasksByDay[t.day] = [];
      tasksByDay[t.day].push(t);
    }

    return res.json({
      success: true,
      hasActivePlan: true,
      plan: { ...plan, tasks, tasksByDay },
      summary: {
        totalTasks,
        completedTasks,
        completionPercent,
        adherenceRate,
        totalPlannedMinutes,
        completedMinutes,
        totalPlannedHours: Math.round((totalPlannedMinutes / 60) * 10) / 10,
      },
    });
  } catch (err) {
    console.error('getStudyPlan:', err);
    return res.status(500).json({ success: false, error: 'Failed to load study plan.' });
  }
}

export async function generateStudyPlan(req, res) {
  const userId = req.user.sub;
  const { examDate, hoursPerWeek, preferences } = req.body || {};

  const dateOk = typeof examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(examDate.trim());
  if (!dateOk) {
    return res.status(400).json({ success: false, error: 'examDate must be YYYY-MM-DD.' });
  }

  const hours = Number(hoursPerWeek);
  if (!Number.isFinite(hours) || hours < 3 || hours > 60) {
    return res
      .status(400)
      .json({ success: false, error: 'hoursPerWeek must be between 3 and 60.' });
  }

  const prefs =
    preferences && typeof preferences === 'object' && !Array.isArray(preferences)
      ? preferences
      : {};

  try {
    const ctx = await loadPlannerContext(userId);
    const subjectRows = ctx.subjects;

    let groqParsed;
    try {
      groqParsed = await callGroqPlanner({
        userPayload: ctx,
        hoursPerWeek: hours,
        examDate: examDate.trim(),
        preferences: prefs,
      });
    } catch (e) {
      if (e.code === 'GROQ_NOT_CONFIGURED') {
        return res.status(503).json({
          success: false,
          error: 'Study plan AI is not configured. Set GROQ_API_KEY in the server environment.',
        });
      }
      console.error('generateStudyPlan Groq:', e);
      return res.status(502).json({
        success: false,
        error: e.message || 'The planner could not generate a plan. Try again.',
      });
    }

    const planSummary =
      typeof groqParsed.planSummary === 'string'
        ? groqParsed.planSummary.slice(0, 2000)
        : 'Your personalized week is ready. Focus on consistency over intensity.';

    const rawTasks = Array.isArray(groqParsed.tasks) ? groqParsed.tasks : [];
    if (!rawTasks.length) {
      return res.status(502).json({
        success: false,
        error: 'Planner returned no tasks. Please try regenerating.',
      });
    }

    const normalized = [];
    for (let i = 0; i < Math.min(rawTasks.length, 48); i += 1) {
      const rt = rawTasks[i];
      const day = normalizeDay(rt.day);
      const subjectName = normalizeSubjectName(rt.subjectName, subjectRows);
      const taskType = normalizeTaskType(rt.taskType);
      const duration = Math.min(180, Math.max(15, Math.round(Number(rt.durationMinutes) || 30)));
      const title =
        typeof rt.title === 'string' && rt.title.trim()
          ? rt.title.trim().slice(0, 500)
          : `${subjectName || 'Study'} block`;
      if (!day || !subjectName) continue;
      normalized.push({
        day,
        subjectName,
        taskType,
        durationMinutes: duration,
        title,
        focusTopic: typeof rt.focusTopic === 'string' ? rt.focusTopic.slice(0, 255) : null,
      });
    }

    if (!normalized.length) {
      return res.status(502).json({
        success: false,
        error: 'Planner tasks could not be mapped to subjects/days.',
      });
    }

    const byName = Object.fromEntries(subjectRows.map((r) => [r.name, r.id]));
    const mon = mondayStartReferenceDate();
    const { start, end } = weekRangeFromMonday(mon);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE study_plans SET status = 'archived' WHERE user_id = $1 AND status = 'active'`,
        [userId]
      );

      const insPlan = await client.query(
        `
          INSERT INTO study_plans (
            user_id, start_date, end_date, total_hours_per_week, status,
            exam_target_date, plan_preferences, plan_summary, generated_at
          )
          VALUES ($1, $2::date, $3::date, $4, 'active', $5::date, $6::jsonb, $7, CURRENT_TIMESTAMP)
          RETURNING id
        `,
        [
          userId,
          toISODateLocal(start),
          toISODateLocal(end),
          hours,
          examDate.trim(),
          JSON.stringify(prefs),
          planSummary,
        ]
      );

      const planId = insPlan.rows[0].id;

      const sortByDay = {};
      const usedLessonIds = [];
      for (const t of normalized) {
        sortByDay[t.day] = (sortByDay[t.day] || 0) + 1;
        const ord = sortByDay[t.day];

        const subjectId = byName[t.subjectName];
        const lessonId = await pickNextLessonId(
          client,
          userId,
          subjectId,
          t.taskType,
          usedLessonIds
        );
        if (lessonId) usedLessonIds.push(lessonId);

        const isPracticeLike = t.taskType === 'practice' || t.taskType === 'mock';
        const questionSet =
          isPracticeLike || !lessonId
            ? t.focusTopic
              ? `${t.title} — ${t.focusTopic}`.slice(0, 255)
              : t.title.slice(0, 255)
            : null;

        await client.query(
          `
            INSERT INTO study_plan_tasks (
              study_plan_id, day, subject_id, lesson_id, question_set,
              duration_minutes, completed, task_type, title, sort_order
            )
            VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7, $8, $9)
          `,
          [
            planId,
            t.day,
            subjectId,
            isPracticeLike ? null : lessonId,
            questionSet,
            t.durationMinutes,
            t.taskType,
            t.title,
            ord,
          ]
        );
      }

      await client.query(
        `UPDATE studentProfiles SET active_study_plan_id = $1 WHERE user_id = $2`,
        [planId, userId]
      );

      await client.query(
        `
          INSERT INTO ai_recommendations (user_id, recommendation_type, content)
          VALUES ($1, 'study_plan_generated', $2::jsonb)
        `,
        [
          userId,
          JSON.stringify({
            planId,
            examDate: examDate.trim(),
            hoursPerWeek: hours,
            summary: planSummary.slice(0, 500),
            taskCount: normalized.length,
          }),
        ]
      );

      await client.query(
        `UPDATE weak_areas SET last_updated = CURRENT_TIMESTAMP WHERE user_id = $1`,
        [userId]
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return getStudyPlan(req, res);
  } catch (err) {
    console.error('generateStudyPlan:', err);
    return res.status(500).json({ success: false, error: 'Failed to save study plan.' });
  }
}

export async function completeTask(req, res) {
  const userId = req.user.sub;
  const taskId = Number(req.body?.taskId);
  if (!Number.isInteger(taskId) || taskId < 1) {
    return res.status(400).json({ success: false, error: 'taskId is required.' });
  }

  try {
    const { rowCount } = await pool.query(
      `
        UPDATE study_plan_tasks spt
        SET completed = TRUE,
            completed_at = CURRENT_TIMESTAMP
        FROM study_plans sp
        WHERE spt.id = $1
          AND spt.study_plan_id = sp.id
          AND sp.user_id = $2
          AND sp.status = 'active'
          AND spt.completed = FALSE
      `,
      [taskId, userId]
    );

    if (!rowCount) {
      return res.status(404).json({
        success: false,
        error: 'Task not found, already completed, or not part of your active plan.',
      });
    }

    return res.json({ success: true, taskId });
  } catch (err) {
    console.error('completeTask:', err);
    return res.status(500).json({ success: false, error: 'Failed to update task.' });
  }
}

export async function adjustStudyPlan(req, res) {
  const userId = req.user.sub;
  const { moves = [], swaps = [], durationUpdates = [] } = req.body || {};

  try {
    const { rows: planRows } = await pool.query(
      `SELECT id FROM study_plans WHERE user_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1`,
      [userId]
    );
    if (!planRows.length) {
      return res.status(400).json({ success: false, error: 'No active study plan to adjust.' });
    }
    const planId = planRows[0].id;

    const assertTaskInPlan = async (client, tid) => {
      const { rows } = await client.query(
        `SELECT id, day, duration_minutes, sort_order FROM study_plan_tasks WHERE id = $1 AND study_plan_id = $2`,
        [tid, planId]
      );
      return rows[0] || null;
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const m of moves) {
        const tid = Number(m.taskId);
        const day = normalizeDay(m.day);
        if (!Number.isInteger(tid) || tid < 1 || !day) {
          throw new Error('INVALID_MOVE');
        }
        const row = await assertTaskInPlan(client, tid);
        if (!row) throw new Error('FORBIDDEN_TASK');
        await client.query(`UPDATE study_plan_tasks SET day = $1 WHERE id = $2`, [day, tid]);
      }

      for (const u of durationUpdates) {
        const tid = Number(u.taskId);
        const dm = Math.round(Number(u.durationMinutes));
        if (!Number.isInteger(tid) || tid < 1 || !Number.isFinite(dm)) {
          throw new Error('INVALID_DURATION');
        }
        const clamped = Math.min(180, Math.max(15, dm));
        const row = await assertTaskInPlan(client, tid);
        if (!row) throw new Error('FORBIDDEN_TASK');
        await client.query(
          `UPDATE study_plan_tasks SET duration_minutes = $1 WHERE id = $2`,
          [clamped, tid]
        );
      }

      for (const s of swaps) {
        const a = Number(s.taskIdA ?? s.taskId1);
        const b = Number(s.taskIdB ?? s.taskId2);
        if (!Number.isInteger(a) || !Number.isInteger(b) || a === b) {
          throw new Error('INVALID_SWAP');
        }
        const ra = await assertTaskInPlan(client, a);
        const rb = await assertTaskInPlan(client, b);
        if (!ra || !rb) throw new Error('FORBIDDEN_TASK');
        await client.query(`UPDATE study_plan_tasks SET day = $1 WHERE id = $2`, [rb.day, a]);
        await client.query(`UPDATE study_plan_tasks SET day = $1 WHERE id = $2`, [ra.day, b]);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      const msg = e.message;
      if (['INVALID_MOVE', 'INVALID_DURATION', 'INVALID_SWAP'].includes(msg)) {
        return res.status(400).json({ success: false, error: 'Invalid adjustment payload.' });
      }
      if (msg === 'FORBIDDEN_TASK') {
        return res.status(403).json({ success: false, error: 'Task does not belong to your active plan.' });
      }
      throw e;
    } finally {
      client.release();
    }

    return getStudyPlan(req, res);
  } catch (err) {
    console.error('adjustStudyPlan:', err);
    return res.status(500).json({ success: false, error: 'Failed to adjust study plan.' });
  }
}
