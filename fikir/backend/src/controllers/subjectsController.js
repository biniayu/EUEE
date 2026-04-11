import { pool } from '../config/db.js';
import { runAfterLessonComplete } from '../services/notificationService.js';

const SUBJECT_ORDER = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'SAT'];

function lessonProgressPercent(completed, total) {
  const t = Number(total) || 0;
  const c = Number(completed) || 0;
  if (t <= 0) return 0;
  return Math.min(100, Math.round((c / t) * 100));
}

export async function listSubjects(req, res) {
  try {
    const userId = req.user.sub;
    const { rows } = await pool.query(
      `
        SELECT
          s.id,
          s.name,
          s.description,
          s.euee_weightage,
          (
            SELECT COUNT(*)::int FROM lessons l WHERE l.subject_id = s.id
          ) AS lessons_total,
          (
            SELECT COUNT(*)::int
            FROM lesson_progress lp
            INNER JOIN lessons l ON l.id = lp.lesson_id
            WHERE l.subject_id = s.id AND lp.user_id = $1 AND lp.completed = TRUE
          ) AS lessons_completed
        FROM subjects s
        WHERE s.name = ANY ($2::text[])
        ORDER BY array_position($2::text[], s.name)
      `,
      [userId, SUBJECT_ORDER]
    );

    const subjects = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      eueeWeightage: r.euee_weightage != null ? Number(r.euee_weightage) : null,
      lessonsTotal: r.lessons_total,
      lessonsCompleted: r.lessons_completed,
      progressPercent: lessonProgressPercent(r.lessons_completed, r.lessons_total),
    }));

    return res.json({ success: true, subjects });
  } catch (err) {
    console.error('listSubjects:', err);
    return res.status(500).json({ success: false, error: 'Failed to load subjects.' });
  }
}

export async function getSubjectById(req, res) {
  try {
    const userId = req.user.sub;
    const subjectId = Number(req.params.id);
    if (!Number.isInteger(subjectId) || subjectId < 1) {
      return res.status(400).json({ success: false, error: 'Invalid subject id.' });
    }

    const subRes = await pool.query(
      `SELECT id, name, description, euee_weightage FROM subjects WHERE id = $1 LIMIT 1`,
      [subjectId]
    );
    if (!subRes.rows.length) {
      return res.status(404).json({ success: false, error: 'Subject not found.' });
    }

    const s = subRes.rows[0];
    const lessonsRes = await pool.query(
      `
        SELECT
          l.id,
          l.title,
          l.content_type,
          l.duration_minutes,
          l.sort_order,
          COALESCE(lp.completed, FALSE) AS completed,
          COALESCE(lp.time_spent, 0)::int AS time_spent_seconds
        FROM lessons l
        LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $2
        WHERE l.subject_id = $1
        ORDER BY l.sort_order ASC, l.id ASC
      `,
      [subjectId, userId]
    );

    const lessons = lessonsRes.rows.map((l) => ({
      id: l.id,
      title: l.title,
      contentType: l.content_type,
      durationMinutes: l.duration_minutes,
      sortOrder: l.sort_order,
      completed: l.completed,
      timeSpentSeconds: l.time_spent_seconds,
    }));

    const total = lessons.length;
    const completed = lessons.filter((x) => x.completed).length;

    const nextIncomplete = lessons.find((l) => !l.completed) || null;

    return res.json({
      success: true,
      subject: {
        id: s.id,
        name: s.name,
        description: s.description,
        eueeWeightage: s.euee_weightage != null ? Number(s.euee_weightage) : null,
        lessonsTotal: total,
        lessonsCompleted: completed,
        progressPercent: lessonProgressPercent(completed, total),
        nextLessonId: nextIncomplete ? nextIncomplete.id : null,
      },
      lessons,
    });
  } catch (err) {
    console.error('getSubjectById:', err);
    return res.status(500).json({ success: false, error: 'Failed to load subject.' });
  }
}

function parseChoices(options) {
  if (!options || typeof options !== 'object') return [];
  const ch = options.choices;
  return Array.isArray(ch) ? ch : [];
}

export async function getLessonById(req, res) {
  try {
    const userId = req.user.sub;
    const lessonId = Number(req.params.id);
    if (!Number.isInteger(lessonId) || lessonId < 1) {
      return res.status(400).json({ success: false, error: 'Invalid lesson id.' });
    }

    const lessonRes = await pool.query(
      `
        SELECT
          l.id,
          l.subject_id,
          l.title,
          l.content_type,
          l.content_url,
          l.text_content,
          l.difficulty,
          l.duration_minutes,
          l.sort_order,
          s.name AS subject_name
        FROM lessons l
        INNER JOIN subjects s ON s.id = l.subject_id
        WHERE l.id = $1
        LIMIT 1
      `,
      [lessonId]
    );
    if (!lessonRes.rows.length) {
      return res.status(404).json({ success: false, error: 'Lesson not found.' });
    }

    const row = lessonRes.rows[0];
    const subjectId = row.subject_id;

    const navRes = await pool.query(
      `
        WITH ordered AS (
          SELECT
            id,
            LAG(id) OVER (ORDER BY sort_order ASC, id ASC) AS prev_id,
            LEAD(id) OVER (ORDER BY sort_order ASC, id ASC) AS next_id
          FROM lessons
          WHERE subject_id = $1
        )
        SELECT prev_id, next_id FROM ordered WHERE id = $2
      `,
      [subjectId, lessonId]
    );

    const prevId = navRes.rows[0]?.prev_id ?? null;
    const nextId = navRes.rows[0]?.next_id ?? null;

    const progRes = await pool.query(
      `
        SELECT completed, COALESCE(time_spent, 0)::int AS time_spent_seconds, completed_at
        FROM lesson_progress
        WHERE user_id = $1 AND lesson_id = $2
        LIMIT 1
      `,
      [userId, lessonId]
    );

    const progress = progRes.rows[0] || {
      completed: false,
      time_spent_seconds: 0,
      completed_at: null,
    };

    const qRes = await pool.query(
      `
        SELECT id, topic, question_text, options, correct_answer, explanation
        FROM questions
        WHERE subject_id = $1
        ORDER BY id ASC
        LIMIT 3
      `,
      [subjectId]
    );

    const practiceQuestions = qRes.rows.map((q) => {
      const choices = parseChoices(q.options);
      let correctIndex = Number.parseInt(String(q.correct_answer), 10);
      if (Number.isNaN(correctIndex)) correctIndex = 0;
      return {
        id: q.id,
        topic: q.topic,
        questionText: q.question_text,
        choices,
        correctIndex,
        explanation: q.explanation || '',
      };
    });

    return res.json({
      success: true,
      lesson: {
        id: row.id,
        subjectId: row.subject_id,
        subjectName: row.subject_name,
        title: row.title,
        contentType: row.content_type,
        contentUrl: row.content_url,
        textContent: row.text_content,
        difficulty: row.difficulty,
        durationMinutes: row.duration_minutes,
        sortOrder: row.sort_order,
        completed: Boolean(progress.completed),
        timeSpentSeconds: progress.time_spent_seconds,
        completedAt: progress.completed_at,
      },
      navigation: {
        previousLessonId: prevId,
        nextLessonId: nextId,
      },
      practiceQuestions,
    });
  } catch (err) {
    console.error('getLessonById:', err);
    return res.status(500).json({ success: false, error: 'Failed to load lesson.' });
  }
}

export async function completeLesson(req, res) {
  try {
    const userId = req.user.sub;
    const lessonId = Number(req.params.id);
    if (!Number.isInteger(lessonId) || lessonId < 1) {
      return res.status(400).json({ success: false, error: 'Invalid lesson id.' });
    }

    const exists = await pool.query(`SELECT id FROM lessons WHERE id = $1 LIMIT 1`, [lessonId]);
    if (!exists.rows.length) {
      return res.status(404).json({ success: false, error: 'Lesson not found.' });
    }

    const prev = await pool.query(
      `SELECT completed FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2 LIMIT 1`,
      [userId, lessonId]
    );
    const alreadyDone = prev.rows[0]?.completed === true;

    const raw = req.body?.timeSpentSeconds;
    const extra = Math.min(Math.max(0, Number(raw) || 0), 86400);

    const result = await pool.query(
      `
        INSERT INTO lesson_progress (user_id, lesson_id, completed, time_spent, completed_at)
        VALUES ($1, $2, TRUE, $3, NOW())
        ON CONFLICT (user_id, lesson_id)
        DO UPDATE SET
          completed = TRUE,
          time_spent = lesson_progress.time_spent + EXCLUDED.time_spent,
          completed_at = COALESCE(lesson_progress.completed_at, NOW())
        RETURNING id, completed, time_spent, completed_at
      `,
      [userId, lessonId, extra]
    );

    const r = result.rows[0];

    if (!alreadyDone) {
      const meta = await pool.query(
        `
          SELECT l.title, s.name AS subject_name
          FROM lessons l
          INNER JOIN subjects s ON s.id = l.subject_id
          WHERE l.id = $1
          LIMIT 1
        `,
        [lessonId]
      );
      const m = meta.rows[0];
      if (m) {
        setImmediate(() => {
          runAfterLessonComplete(userId, {
            lessonTitle: m.title,
            subjectName: m.subject_name,
            lessonId,
          }).catch((e) => console.error('runAfterLessonComplete:', e?.message || e));
        });
      }
    }

    return res.json({
      success: true,
      message: 'Lesson marked complete. Great work!',
      progress: {
        lessonId,
        completed: r.completed,
        timeSpentSeconds: r.time_spent,
        completedAt: r.completed_at,
      },
    });
  } catch (err) {
    console.error('completeLesson:', err);
    return res.status(500).json({ success: false, error: 'Failed to update lesson progress.' });
  }
}
