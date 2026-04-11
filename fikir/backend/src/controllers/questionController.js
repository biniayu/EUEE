import { pool } from '../config/db.js';

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MIN_QUESTIONS_BEFORE_GROQ = 5;
const GROQ_BATCH_SIZE = 6;
const LIST_MAX_LIMIT = 100;

function parseChoices(options) {
  if (!options || typeof options !== 'object') return [];
  return Array.isArray(options.choices) ? options.choices : [];
}

function getGroqKey() {
  return process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.GROQ_KEY;
}

function getGroqModel() {
  return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
}

async function callGroqJson(messages, useJsonObject = true) {
  const apiKey = getGroqKey();
  if (!apiKey) throw new Error('GROQ_NOT_CONFIGURED');

  async function post(extra = {}) {
    const groqRes = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getGroqModel(),
        temperature: 0.35,
        max_tokens: 8192,
        messages,
        ...extra,
      }),
    });
    const groqData = await groqRes.json().catch(() => ({}));
    return { groqRes, groqData };
  }

  let { groqRes, groqData } = await post(
    useJsonObject ? { response_format: { type: 'json_object' } } : {}
  );
  if (!groqRes.ok && groqData?.error?.message?.toLowerCase?.().includes('json')) {
    ({ groqRes, groqData } = await post({}));
  }
  if (!groqRes.ok) {
    console.error('Groq question gen error:', groqRes.status, groqData);
    throw new Error(groqData?.error?.message || `Groq HTTP ${groqRes.status}`);
  }
  const content = groqData?.choices?.[0]?.message?.content;
  let s = String(content || '').trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  return JSON.parse(s);
}

const GROQ_SYSTEM = `You are an expert EUEE (Ethiopian University Entrance Exam) item writer for Grade 12 Natural Science students. Write clear multiple-choice questions aligned with Ethiopian high-school curriculum style: one best answer, four distinct options labeled by order (first option = index 0). Explanations must be educational and step-by-step where helpful.

Respond with JSON only using this shape:
{ "questions": [
  {
    "topic": "short topic label",
    "questionText": "full question stem",
    "choices": ["option A text", "option B", "option C", "option D"],
    "correctIndex": 0,
    "explanation": "detailed step-by-step explanation of why the correct answer is right and common mistakes",
    "difficulty": "easy" | "medium" | "hard"
  }
] }

Rules:
- Exactly 4 choices per question; correctIndex is 0–3.
- No images, no LaTeX that cannot render as plain text (simple symbols like ° and ² are OK).
- Vary topics within the subject appropriately for EUEE prep.`;

async function countQuestionsForSubject(subjectId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM questions WHERE subject_id = $1`,
    [subjectId]
  );
  return rows[0]?.c ?? 0;
}

async function generateAndInsertQuestions(subjectId, subjectName, topicHint, count) {
  const userMsg = JSON.stringify({
    subject: subjectName,
    topicHint: topicHint || null,
    requestedCount: Math.min(GROQ_BATCH_SIZE, Math.max(1, count)),
    note: 'Generate questions array only; align with EUEE Natural Science track.',
  });

  const parsed = await callGroqJson([
    { role: 'system', content: GROQ_SYSTEM },
    { role: 'user', content: userMsg },
  ]);

  const arr = Array.isArray(parsed.questions) ? parsed.questions : [];
  const inserted = [];

  for (const q of arr.slice(0, GROQ_BATCH_SIZE)) {
    const choices = Array.isArray(q.choices) ? q.choices.map((c) => String(c || '').trim()) : [];
    if (choices.length !== 4) continue;
    const ci = Math.min(3, Math.max(0, Math.round(Number(q.correctIndex) || 0)));
    const topic = String(q.topic || 'General').trim().slice(0, 255) || 'General';
    const questionText = String(q.questionText || '').trim();
    if (questionText.length < 8) continue;
    const explanation = String(q.explanation || '').trim().slice(0, 4000) || 'Review the concept and try a similar problem.';
    let diff = String(q.difficulty || 'medium').toLowerCase();
    if (!['easy', 'medium', 'hard'].includes(diff)) diff = 'medium';

    const { rows } = await pool.query(
      `
        INSERT INTO questions (subject_id, topic, question_text, options, correct_answer, explanation, difficulty, question_type)
        VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, 'multiple_choice')
        RETURNING id
      `,
      [
        subjectId,
        topic,
        questionText,
        JSON.stringify({ choices }),
        String(ci),
        explanation,
        diff,
      ]
    );
    if (rows[0]?.id) inserted.push(rows[0].id);
  }

  return inserted.length;
}

/** When a subject has very few questions, top up via Groq (if configured). */
async function ensureQuestionBankForSubject(subjectId, topicFilter) {
  if (!Number.isInteger(subjectId) || subjectId < 1) return;
  const subRes = await pool.query(`SELECT id, name FROM subjects WHERE id = $1`, [subjectId]);
  if (!subRes.rows.length) return;

  const n = await countQuestionsForSubject(subjectId);
  if (n >= MIN_QUESTIONS_BEFORE_GROQ) return;

  if (!getGroqKey()) {
    console.warn('Question bank: low questions for subject', subjectId, 'but GROQ_API_KEY not set.');
    return;
  }

  try {
    const need = MIN_QUESTIONS_BEFORE_GROQ - n;
    let added = 0;
    while (added < need && added < 24) {
      const batch = await generateAndInsertQuestions(
        subjectId,
        subRes.rows[0].name,
        topicFilter || null,
        need - added
      );
      if (!batch) break;
      added += batch;
    }
  } catch (e) {
    console.error('ensureQuestionBankForSubject:', e?.message || e);
  }
}

async function updateWeakAreaForAttempt(userId, subjectName, topic, isCorrect) {
  const delta = isCorrect ? 4 : -8;
  const { rows: subRows } = await pool.query(`SELECT id FROM subjects WHERE name = $1 LIMIT 1`, [
    subjectName,
  ]);
  const subjectId = subRows[0]?.id;
  if (!subjectId) return;

  await pool.query(
    `
      INSERT INTO weak_areas (user_id, subject_id, topic, strength_score)
      VALUES ($1, $2, $3, GREATEST(0, LEAST(100, 60 + $4)))
      ON CONFLICT (user_id, subject_id, topic)
      DO UPDATE SET
        strength_score = GREATEST(0, LEAST(100, weak_areas.strength_score + $4)),
        last_updated = NOW()
    `,
    [userId, subjectId, topic, delta]
  );
}

export async function listTopics(req, res) {
  const subjectId = req.query.subjectId != null && req.query.subjectId !== '' ? Number(req.query.subjectId) : null;
  try {
    const params = [];
    let where = 'TRUE';
    if (Number.isInteger(subjectId) && subjectId > 0) {
      where = `subject_id = $1`;
      params.push(subjectId);
    }
    const { rows } = await pool.query(
      `SELECT DISTINCT topic FROM questions WHERE ${where} ORDER BY topic ASC LIMIT 500`,
      params
    );
    return res.json({ success: true, topics: rows.map((r) => r.topic) });
  } catch (err) {
    console.error('listTopics:', err);
    return res.status(500).json({ success: false, error: 'Failed to load topics.' });
  }
}

export async function listQuestions(req, res) {
  const userId = req.user.sub;
  try {
    const subjectId = req.query.subjectId != null && req.query.subjectId !== '' ? Number(req.query.subjectId) : null;
    const topic = typeof req.query.topic === 'string' ? req.query.topic.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty.trim().toLowerCase() : '';
    const questionType =
      typeof req.query.questionType === 'string' ? req.query.questionType.trim().toLowerCase() : '';
    let limit = Number(req.query.limit);
    if (!Number.isFinite(limit) || limit < 1) limit = 24;
    limit = Math.min(LIST_MAX_LIMIT, Math.floor(limit));

    if (Number.isInteger(subjectId) && subjectId > 0) {
      await ensureQuestionBankForSubject(subjectId, topic || null);
    }

    const params = [];
    const where = [];

    if (Number.isInteger(subjectId) && subjectId > 0) {
      where.push(`q.subject_id = $${params.length + 1}`);
      params.push(subjectId);
    }
    if (topic) {
      where.push(`q.topic ILIKE $${params.length + 1}`);
      params.push(`%${topic}%`);
    }
    if (search) {
      where.push(`q.question_text ILIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }
    if (['easy', 'medium', 'hard'].includes(difficulty)) {
      where.push(`LOWER(q.difficulty) = $${params.length + 1}`);
      params.push(difficulty);
    }
    if (questionType === 'multiple_choice' || questionType === 'short_answer') {
      where.push(`q.question_type = $${params.length + 1}`);
      params.push(questionType);
    }

    const userParam = params.length + 1;
    params.push(userId);

    const favJoin = `LEFT JOIN question_favorites qf ON qf.question_id = q.id AND qf.user_id = $${userParam}`;
    const whereSql = where.length ? where.join(' AND ') : 'TRUE';

    const limitParam = params.length + 1;
    params.push(limit);

    const orderSql = req.query.random === '1' || req.query.random === 'true' ? 'RANDOM()' : 'q.id DESC';

    const sql = `
      SELECT
        q.id,
        LEFT(q.question_text, 220) AS preview,
        q.topic,
        q.difficulty,
        q.question_type AS "questionType",
        s.id AS "subjectId",
        s.name AS "subjectName",
        (qf.id IS NOT NULL) AS "isFavorite"
      FROM questions q
      INNER JOIN subjects s ON s.id = q.subject_id
      ${favJoin}
      WHERE ${whereSql}
      ORDER BY ${orderSql}
      LIMIT $${limitParam}
    `;

    const { rows } = await pool.query(sql, params);
    return res.json({ success: true, questions: rows });
  } catch (err) {
    console.error('listQuestions:', err);
    return res.status(500).json({ success: false, error: 'Failed to load questions.' });
  }
}

export async function getQuestionById(req, res) {
  const userId = req.user.sub;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ success: false, error: 'Invalid question id.' });
  }

  try {
    const { rows } = await pool.query(
      `
        SELECT
          q.id,
          q.topic,
          q.question_text AS "questionText",
          q.options,
          q.difficulty,
          q.question_type AS "questionType",
          s.id AS "subjectId",
          s.name AS "subjectName",
          (qf.id IS NOT NULL) AS "isFavorite"
        FROM questions q
        INNER JOIN subjects s ON s.id = q.subject_id
        LEFT JOIN question_favorites qf ON qf.question_id = q.id AND qf.user_id = $2
        WHERE q.id = $1
        LIMIT 1
      `,
      [id, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Question not found.' });
    }

    const r = rows[0];
    return res.json({
      success: true,
      question: {
        id: r.id,
        topic: r.topic,
        questionText: r.questionText,
        choices: parseChoices(r.options),
        difficulty: r.difficulty,
        questionType: r.questionType,
        subjectId: r.subjectId,
        subjectName: r.subjectName,
        isFavorite: Boolean(r.isFavorite),
      },
    });
  } catch (err) {
    console.error('getQuestionById:', err);
    return res.status(500).json({ success: false, error: 'Failed to load question.' });
  }
}

export async function postAttempt(req, res) {
  const userId = req.user.sub;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ success: false, error: 'Invalid question id.' });
  }

  const selectedAnswer =
    req.body?.selectedAnswer != null ? String(req.body.selectedAnswer).trim() : '';

  if (selectedAnswer === '') {
    return res.status(400).json({ success: false, error: 'selectedAnswer is required (option index as string).' });
  }

  try {
    const qRes = await pool.query(
      `
        SELECT q.id, q.correct_answer, q.explanation, q.question_text, q.options, q.topic,
               q.question_type,
               s.name AS subject_name
        FROM questions q
        INNER JOIN subjects s ON s.id = q.subject_id
        WHERE q.id = $1
      `,
      [id]
    );
    const q = qRes.rows[0];
    if (!q) {
      return res.status(404).json({ success: false, error: 'Question not found.' });
    }

    const correct =
      q.question_type === 'short_answer'
        ? selectedAnswer.trim().toLowerCase() === String(q.correct_answer || '').trim().toLowerCase()
        : selectedAnswer === String(q.correct_answer).trim();

    await pool.query(
      `
        INSERT INTO question_attempts (user_id, question_id, selected_answer, is_correct)
        VALUES ($1, $2, $3, $4)
      `,
      [userId, id, selectedAnswer, correct]
    );

    await updateWeakAreaForAttempt(userId, q.subject_name, q.topic, correct);

    const choices = parseChoices(q.options);
    const correctChoiceText =
      q.question_type === 'multiple_choice' ? choices[Number(q.correct_answer)] ?? null : null;

    return res.json({
      success: true,
      correct,
      correctAnswer: q.correct_answer,
      correctChoiceText,
      explanation: q.explanation || 'Great effort — review the key idea and try another variant.',
      selectedAnswer,
    });
  } catch (err) {
    console.error('postAttempt:', err);
    return res.status(500).json({ success: false, error: 'Failed to record attempt.' });
  }
}

export async function listFavorites(req, res) {
  const userId = req.user.sub;
  try {
    const { rows } = await pool.query(
      `
        SELECT
          q.id,
          LEFT(q.question_text, 220) AS preview,
          q.topic,
          q.difficulty,
          q.question_type AS "questionType",
          s.id AS "subjectId",
          s.name AS "subjectName",
          TRUE AS "isFavorite"
        FROM question_favorites qf
        INNER JOIN questions q ON q.id = qf.question_id
        INNER JOIN subjects s ON s.id = q.subject_id
        WHERE qf.user_id = $1
        ORDER BY qf.created_at DESC
        LIMIT 200
      `,
      [userId]
    );
    return res.json({ success: true, questions: rows });
  } catch (err) {
    console.error('listFavorites:', err);
    return res.status(500).json({ success: false, error: 'Failed to load favorites.' });
  }
}

export async function postFavorite(req, res) {
  const userId = req.user.sub;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ success: false, error: 'Invalid question id.' });
  }

  const favorite = Boolean(req.body?.favorite);

  try {
    const exists = await pool.query(`SELECT 1 FROM questions WHERE id = $1`, [id]);
    if (!exists.rows.length) {
      return res.status(404).json({ success: false, error: 'Question not found.' });
    }

    if (favorite) {
      await pool.query(
        `
          INSERT INTO question_favorites (user_id, question_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, question_id) DO NOTHING
        `,
        [userId, id]
      );
    } else {
      await pool.query(
        `DELETE FROM question_favorites WHERE user_id = $1 AND question_id = $2`,
        [userId, id]
      );
    }

    return res.json({ success: true, questionId: id, favorite });
  } catch (err) {
    console.error('postFavorite:', err);
    return res.status(500).json({ success: false, error: 'Failed to update favorite.' });
  }
}
