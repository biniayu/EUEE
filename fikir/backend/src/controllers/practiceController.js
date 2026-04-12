import { pool } from '../config/db.js';
import { runAfterPracticeSessionComplete } from '../services/notificationService.js';

// TEST: practice flow — startPractice (subject/topic/mock), submitAnswer adaptive meta, completePractice scoring + weak_areas.

const SUBJECT_NAMES = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'SAT'];
const DIFF_ORDER = ['easy', 'medium', 'hard'];
const DEFAULT_TARGET = 15;

function parseChoices(options) {
  if (!options || typeof options !== 'object') return [];
  return Array.isArray(options.choices) ? options.choices : [];
}

function bumpDifficulty(current) {
  const i = DIFF_ORDER.indexOf(current);
  if (i < 0) return 'medium';
  return DIFF_ORDER[Math.min(DIFF_ORDER.length - 1, i + 1)];
}

function lowerDifficulty(current) {
  const i = DIFF_ORDER.indexOf(current);
  if (i < 0) return 'easy';
  return DIFF_ORDER[Math.max(0, i - 1)];
}

function questionToClient(row) {
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    topic: row.topic,
    questionText: row.question_text,
    choices: parseChoices(row.options),
    difficulty: row.difficulty,
  };
}

async function resolveSubjectIds(client, { type, subjectId }) {
  if (type === 'mock') {
    const r = await client.query(
      `SELECT id FROM subjects WHERE name = ANY ($1::text[]) ORDER BY array_position($1::text[], name)`,
      [SUBJECT_NAMES]
    );
    return r.rows.map((x) => x.id);
  }
  const sid = Number(subjectId);
  if (!Number.isInteger(sid) || sid < 1) return [];
  const r = await client.query(`SELECT id FROM subjects WHERE id = $1`, [sid]);
  return r.rows.length ? [sid] : [];
}

async function pickRandomQuestion(client, { sessionId, subjectIds, topic, difficulty, excludeIds }) {
  const ex = excludeIds.length ? excludeIds : [-1];
  const topicPattern = topic ? `%${topic}%` : null;

  async function atLevel(level) {
    const { rows } = await client.query(
      `
        SELECT q.*, s.name AS subject_name
        FROM questions q
        INNER JOIN subjects s ON s.id = q.subject_id
        WHERE q.difficulty = $1
          AND q.subject_id = ANY ($2::int[])
          AND ($3::text IS NULL OR q.topic ILIKE $3)
          AND NOT (q.id = ANY ($4::int[]))
        ORDER BY RANDOM()
        LIMIT 1
      `,
      [level, subjectIds, topicPattern, ex]
    );
    return rows[0] || null;
  }

  let row = await atLevel(difficulty);
  if (!row) row = await atLevel('medium');
  if (!row) row = await atLevel('easy');
  if (!row) row = await atLevel('hard');
  if (!row) {
    const { rows } = await client.query(
      `
        SELECT q.*, s.name AS subject_name
        FROM questions q
        INNER JOIN subjects s ON s.id = q.subject_id
        WHERE q.subject_id = ANY ($1::int[])
          AND ($2::text IS NULL OR q.topic ILIKE $2)
          AND NOT (q.id = ANY ($3::int[]))
        ORDER BY RANDOM()
        LIMIT 1
      `,
      [subjectIds, topicPattern, ex]
    );
    row = rows[0] || null;
  }
  return row;
}

async function usedQuestionIds(client, sessionId) {
  const { rows } = await client.query(
    `SELECT question_id FROM session_questions WHERE session_id = $1`,
    [sessionId]
  );
  return rows.map((r) => r.question_id);
}

async function answeredCount(client, sessionId) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS c FROM session_questions WHERE session_id = $1 AND answered_at IS NOT NULL`,
    [sessionId]
  );
  return rows[0]?.c ?? 0;
}

async function getCurrentQuestionRow(client, sessionId) {
  const { rows } = await client.query(
    `
      SELECT sq.*, q.subject_id, q.topic, q.question_text, q.options, q.difficulty,
             q.correct_answer, q.explanation, s.name AS subject_name
      FROM session_questions sq
      INNER JOIN questions q ON q.id = sq.question_id
      INNER JOIN subjects s ON s.id = q.subject_id
      WHERE sq.session_id = $1 AND sq.answered_at IS NULL
      ORDER BY sq.sort_order ASC
      LIMIT 1
    `,
    [sessionId]
  );
  return rows[0] || null;
}

export async function listTopics(req, res) {
  const subjectId = Number(req.params.subjectId);
  if (!Number.isInteger(subjectId) || subjectId < 1) {
    return res.status(400).json({ success: false, error: 'Invalid subject id.' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT topic FROM questions WHERE subject_id = $1 ORDER BY topic ASC`,
      [subjectId]
    );
    return res.json({ success: true, topics: rows.map((r) => r.topic) });
  } catch (err) {
    console.error('listTopics:', err);
    return res.status(500).json({ success: false, error: 'Failed to load topics.' });
  }
}

export async function startPractice(req, res) {
  const userId = req.user.sub;
  const body = req.body || {};
  const type = body.type === 'topic' ? 'topic' : body.type === 'mock' ? 'mock' : 'subject';
  const subjectId = body.subjectId != null ? Number(body.subjectId) : null;
  const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
  const targetQuestions = Math.min(30, Math.max(5, Number(body.targetQuestions) || DEFAULT_TARGET));

  if (type !== 'mock' && (!subjectId || subjectId < 1)) {
    return res.status(400).json({ success: false, error: 'subjectId is required for subject or topic practice.' });
  }
  if (type === 'topic' && !topic) {
    return res.status(400).json({ success: false, error: 'topic is required for topic practice.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const subjectIds = await resolveSubjectIds(client, { type, subjectId });
    if (!subjectIds.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'No subjects available for this practice mode.' });
    }

    const sessionType = type === 'mock' ? 'mock' : type === 'topic' ? 'topic' : 'subject';
    const meta = {
      practiceType: type,
      subjectIds,
      subjectId: subjectIds.length === 1 ? subjectIds[0] : null,
      topic: type === 'topic' ? topic : null,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      currentDifficulty: 'medium',
      targetQuestions,
      answeredCount: 0,
      markedForReview: [],
    };

    const ins = await client.query(
      `
        INSERT INTO practice_sessions (user_id, session_type, total_questions, session_meta)
        VALUES ($1, $2, $3, $4::jsonb)
        RETURNING id, started_at
      `,
      [userId, sessionType, targetQuestions, JSON.stringify(meta)]
    );
    const sessionId = ins.rows[0].id;

    const exclude = await usedQuestionIds(client, sessionId);
    const qrow = await pickRandomQuestion(client, {
      sessionId,
      subjectIds,
      topic: type === 'topic' ? topic : null,
      difficulty: meta.currentDifficulty,
      excludeIds: exclude,
    });

    if (!qrow) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'No questions found for these filters. Try another subject or topic.',
      });
    }

    await client.query(
      `
        INSERT INTO session_questions (session_id, question_id, sort_order)
        VALUES ($1, $2, 1)
      `,
      [sessionId, qrow.id]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      sessionId,
      totalQuestions: targetQuestions,
      currentIndex: 1,
      sessionType,
      question: questionToClient(qrow),
      startedAt: ins.rows[0].started_at,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('startPractice:', err);
    return res.status(500).json({ success: false, error: 'Failed to start practice session.' });
  } finally {
    client.release();
  }
}

export async function submitAnswer(req, res) {
  const userId = req.user.sub;
  const { sessionId, questionId, selectedAnswer, skipped, markForReview } = req.body || {};
  const sid = Number(sessionId);
  const qid = Number(questionId);
  if (!Number.isInteger(sid) || !Number.isInteger(qid)) {
    return res.status(400).json({ success: false, error: 'sessionId and questionId are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sRes = await client.query(
      `SELECT * FROM practice_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [sid, userId]
    );
    if (!sRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }
    const session = sRes.rows[0];
    if (session.completed_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Session already completed.' });
    }

    let meta = session.session_meta || {};
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta);
      } catch {
        meta = {};
      }
    }

    const cur = await client.query(
      `
        SELECT sq.id AS sq_id, sq.question_id, sq.answered_at
        FROM session_questions sq
        WHERE sq.session_id = $1 AND sq.question_id = $2
        FOR UPDATE
      `,
      [sid, qid]
    );
    if (!cur.rows[0] || cur.rows[0].answered_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Invalid or already answered question.' });
    }

    const qRes = await client.query(
      `SELECT id, correct_answer, explanation, question_text, options, topic, subject_id, difficulty FROM questions WHERE id = $1`,
      [qid]
    );
    const q = qRes.rows[0];
    if (!q) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Question not found.' });
    }

    const isSkipped = Boolean(skipped);
    const sel = isSkipped ? null : String(selectedAnswer ?? '');
    const correct = !isSkipped && sel === String(q.correct_answer).trim();

    await client.query(
      `
        UPDATE session_questions
        SET selected_answer = $1,
            is_correct = $2,
            skipped = $3,
            answered_at = NOW()
        WHERE session_id = $4 AND question_id = $5
      `,
      [sel, correct, isSkipped, sid, qid]
    );

    await client.query(
      `
        INSERT INTO question_attempts (user_id, question_id, selected_answer, is_correct)
        VALUES ($1, $2, $3, $4)
      `,
      [userId, qid, sel, correct && !isSkipped]
    );

    if (markForReview && !meta.markedForReview?.includes(qid)) {
      meta.markedForReview = [...(meta.markedForReview || []), qid];
    }

    let adaptiveNote = '';
    if (isSkipped || !correct) {
      meta.consecutiveCorrect = 0;
      const prev = meta.currentDifficulty || 'medium';
      meta.currentDifficulty = lowerDifficulty(prev);
      if (prev !== meta.currentDifficulty) {
        adaptiveNote = `Difficulty adjusted to ${meta.currentDifficulty}.`;
      }
    } else {
      meta.consecutiveCorrect = (meta.consecutiveCorrect || 0) + 1;
      if (meta.consecutiveCorrect >= 2) {
        const prev = meta.currentDifficulty || 'medium';
        meta.currentDifficulty = bumpDifficulty(prev);
        if (prev !== meta.currentDifficulty) adaptiveNote = `Difficulty increased to ${meta.currentDifficulty}.`;
        meta.consecutiveCorrect = 0;
      }
    }

    meta.answeredCount = (meta.answeredCount || 0) + 1;

    await client.query(`UPDATE practice_sessions SET session_meta = $1::jsonb WHERE id = $2`, [
      JSON.stringify(meta),
      sid,
    ]);

    const done = meta.answeredCount >= (meta.targetQuestions || session.total_questions);

    let nextQuestion = null;
    if (!done) {
      const exclude = await usedQuestionIds(client, sid);
      const qrow = await pickRandomQuestion(client, {
        sessionId: sid,
        subjectIds: meta.subjectIds || [],
        topic: meta.topic || null,
        difficulty: meta.currentDifficulty || 'medium',
        excludeIds: exclude,
      });

      if (qrow) {
        const ord = exclude.length + 1;
        await client.query(
          `INSERT INTO session_questions (session_id, question_id, sort_order) VALUES ($1, $2, $3)`,
          [sid, qrow.id, ord]
        );
        nextQuestion = questionToClient(qrow);
      } else {
        await client.query('COMMIT');
        const totalQ = meta.targetQuestions || session.total_questions;
        return res.json({
          success: true,
          complete: true,
          insufficientQuestions: true,
          lastResult: {
            correct,
            skipped: isSkipped,
            explanation: q.explanation,
            correctAnswer: q.correct_answer,
          },
          adaptiveNote,
          progress: {
            current: meta.answeredCount,
            total: totalQ,
          },
        });
      }
    }

    await client.query('COMMIT');

    const totalQ = meta.targetQuestions || session.total_questions;
    return res.json({
      success: true,
      complete: done,
      correct: !isSkipped && correct,
      skipped: isSkipped,
      explanation: q.explanation,
      correctAnswer: q.correct_answer,
      adaptiveNote,
      progress: {
        current: done ? meta.answeredCount : meta.answeredCount + 1,
        total: totalQ,
      },
      nextQuestion,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('submitAnswer:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit answer.' });
  } finally {
    client.release();
  }
}

async function buildResultsPayload(client, sessionId, userId, timeTakenSeconds) {
  const sRes = await client.query(
    `SELECT * FROM practice_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
  const session = sRes.rows[0];
  if (!session) return null;

  const { rows } = await client.query(
    `
      SELECT sq.*, q.question_text, q.options, q.correct_answer, q.explanation, q.topic, q.subject_id,
             s.name AS subject_name
      FROM session_questions sq
      INNER JOIN questions q ON q.id = sq.question_id
      INNER JOIN subjects s ON s.id = q.subject_id
      WHERE sq.session_id = $1
      ORDER BY sq.sort_order ASC, sq.id ASC
    `,
    [sessionId]
  );

  let correctN = 0;
  const bySubject = {};
  const byTopic = {};
  const questions = [];

  for (const r of rows) {
    const choices = parseChoices(r.options);
    const wasCorrect = Boolean(r.is_correct);
    if (wasCorrect) correctN += 1;

    const sub = r.subject_name;
    if (!bySubject[sub]) bySubject[sub] = { correct: 0, total: 0 };
    bySubject[sub].total += 1;
    if (wasCorrect) bySubject[sub].correct += 1;

    const tk = `${sub} — ${r.topic}`;
    if (!byTopic[tk]) byTopic[tk] = { correct: 0, total: 0, topic: r.topic, subjectName: sub };
    byTopic[tk].total += 1;
    if (wasCorrect) byTopic[tk].correct += 1;

    questions.push({
      id: r.question_id,
      topic: r.topic,
      subjectName: sub,
      questionText: r.question_text,
      choices,
      selectedAnswer: r.selected_answer,
      correctAnswer: r.correct_answer,
      isCorrect: wasCorrect,
      skipped: Boolean(r.skipped),
      explanation: r.explanation || '',
    });
  }

  const total = rows.length || 1;
  const percent = Math.round((correctN / total) * 1000) / 10;

  const sm = session.session_meta;
  const markedForReview = Array.isArray(sm?.markedForReview) ? sm.markedForReview : [];

  return {
    sessionId,
    sessionType: session.session_type,
    score: { correct: correctN, total: rows.length, percent },
    timeTakenSeconds: timeTakenSeconds ?? null,
    markedForReview,
    bySubject: Object.entries(bySubject).map(([name, v]) => ({
      subjectName: name,
      correct: v.correct,
      total: v.total,
      percent: v.total ? Math.round((v.correct / v.total) * 1000) / 10 : 0,
    })),
    byTopic: Object.values(byTopic).map((v) => ({
      ...v,
      percent: v.total ? Math.round((v.correct / v.total) * 1000) / 10 : 0,
    })),
    questions,
  };
}

async function updateWeakAreasAndAi(client, userId, results) {
  for (const q of results.questions) {
    const delta = q.isCorrect ? 4 : -8;
    const { rows: subRows } = await client.query(`SELECT id FROM subjects WHERE name = $1 LIMIT 1`, [
      q.subjectName,
    ]);
    const subjectId = subRows[0]?.id;
    if (!subjectId) continue;

    await client.query(
      `
        INSERT INTO weak_areas (user_id, subject_id, topic, strength_score)
        VALUES ($1, $2, $3, GREATEST(0, LEAST(100, 60 + $4)))
        ON CONFLICT (user_id, subject_id, topic)
        DO UPDATE SET
          strength_score = GREATEST(0, LEAST(100, weak_areas.strength_score + $4)),
          last_updated = NOW()
      `,
      [userId, subjectId, q.topic, delta]
    );
  }

  const weakTopics = results.byTopic
    .filter((t) => t.total > 0 && t.correct / t.total < 0.5)
    .map((t) => t.topic);

  await client.query(
    `
      INSERT INTO ai_recommendations (user_id, recommendation_type, content)
      VALUES ($1, 'practice_followup', $2::jsonb)
    `,
    [
      userId,
      JSON.stringify({
        sessionId: results.sessionId,
        scorePercent: results.score.percent,
        weakTopics,
        message:
          weakTopics.length > 0
            ? `Review ${weakTopics.slice(0, 3).join(', ')} with short drills before your next mock.`
            : 'Strong session — maintain momentum with mixed timed practice.',
      }),
    ]
  );
}

export async function completePractice(req, res) {
  const userId = req.user.sub;
  const sessionId = Number(req.body?.sessionId);
  const timeTakenSeconds = Math.min(86400, Math.max(0, Number(req.body?.timeTakenSeconds) || 0));
  if (!Number.isInteger(sessionId) || sessionId < 1) {
    return res.status(400).json({ success: false, error: 'sessionId is required.' });
  }

  const initial = await pool.query(`SELECT * FROM practice_sessions WHERE id = $1 AND user_id = $2`, [
    sessionId,
    userId,
  ]);
  if (!initial.rows[0]) {
    return res.status(404).json({ success: false, error: 'Session not found.' });
  }
  if (initial.rows[0].completed_at) {
    const results = await buildResultsPayload(pool, sessionId, userId, timeTakenSeconds);
    if (!results?.questions?.length) {
      return res.status(400).json({ success: false, error: 'Session has no question data.' });
    }
    return res.json({ success: true, results });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sRes = await client.query(
      `SELECT * FROM practice_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [sessionId, userId]
    );
    const session = sRes.rows[0];
    if (session.completed_at) {
      await client.query('ROLLBACK');
      const results = await buildResultsPayload(pool, sessionId, userId, timeTakenSeconds);
      return res.json({ success: true, results });
    }

    const results = await buildResultsPayload(client, sessionId, userId, timeTakenSeconds);
    if (!results || !results.questions.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'No answered questions in this session.' });
    }

    const { score } = results;
    await client.query(
      `
        UPDATE practice_sessions
        SET completed_at = NOW(), score = $1
        WHERE id = $2
      `,
      [score.percent, sessionId]
    );
    await updateWeakAreasAndAi(client, userId, results);

    await client.query('COMMIT');

    setImmediate(() => {
      runAfterPracticeSessionComplete(userId, results).catch((e) =>
        console.error('runAfterPracticeSessionComplete:', e?.message || e)
      );
    });

    return res.json({ success: true, results });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('completePractice:', err);
    return res.status(500).json({ success: false, error: 'Failed to complete session.' });
  } finally {
    client.release();
  }
}

export async function getSession(req, res) {
  const userId = req.user.sub;
  const sessionId = Number(req.params.sessionId);
  if (!Number.isInteger(sessionId) || sessionId < 1) {
    return res.status(400).json({ success: false, error: 'Invalid session id.' });
  }

  try {
    const sRes = await pool.query(`SELECT * FROM practice_sessions WHERE id = $1 AND user_id = $2`, [
      sessionId,
      userId,
    ]);
    if (!sRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }
    const session = sRes.rows[0];

    if (session.completed_at) {
      const client = await pool.connect();
      try {
        const results = await buildResultsPayload(client, sessionId, userId, null);
        return res.json({ success: true, status: 'complete', results });
      } finally {
        client.release();
      }
    }

    const ac = await answeredCount(pool, sessionId);
    const cur = await getCurrentQuestionRow(pool, sessionId);
    if (!cur) {
      return res.json({
        success: true,
        status: 'pending_complete',
        sessionId,
        progress: { current: ac, total: session.total_questions },
      });
    }

    let meta = session.session_meta || {};
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta);
      } catch {
        meta = {};
      }
    }

    return res.json({
      success: true,
      status: 'active',
      sessionId,
      totalQuestions: session.total_questions,
      sessionType: session.session_type,
      progress: { current: ac + 1, total: session.total_questions },
      markedForReview: meta.markedForReview || [],
      question: questionToClient(cur),
    });
  } catch (err) {
    console.error('getSession:', err);
    return res.status(500).json({ success: false, error: 'Failed to load session.' });
  }
}
