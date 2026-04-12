import { pool } from '../config/db.js';

const SYSTEM_PROMPT = `You are an expert EUEE tutor for Grade 12 Natural Science students in Ethiopia. Subjects include Mathematics (Natural), Physics, Chemistry, Biology, English, and SAT. Give clear step-by-step explanations, be encouraging, and align with Ethiopian curriculum and EUEE exam style. Use concise paragraphs; use markdown headings (##) and bullet lists when they help clarity. If a question is outside these subjects or school-level scope, politely redirect to EUEE-relevant study.`;

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MAX_USER_MESSAGE_LEN = 8000;
const HISTORY_LIMIT = 20;

// TEST: postChat — validation, GROQ 503 when key missing, message persistence, history cap.

function buildGroqMessages(systemWithContext, historyRows) {
  const messages = [{ role: 'system', content: systemWithContext }];
  for (const row of historyRows) {
    messages.push({
      role: row.is_ai ? 'assistant' : 'user',
      content: row.message,
    });
  }
  return messages;
}

export async function listMessages(req, res) {
  try {
    const userId = req.user.sub;
    const { rows } = await pool.query(
      `
        SELECT id, message, is_ai AS "isAi", created_at AS "createdAt"
        FROM chat_messages
        WHERE user_id = $1
        ORDER BY id ASC
        LIMIT 200
      `,
      [userId]
    );
    return res.json({ success: true, messages: rows });
  } catch (err) {
    console.error('listMessages:', err);
    return res.status(500).json({ success: false, error: 'Failed to load chat history.' });
  }
}

export async function postChat(req, res) {
  const userId = req.user.sub;
  const { message, context } = req.body || {};
  const trimmed = typeof message === 'string' ? message.trim() : '';
  if (!trimmed) {
    return res.status(400).json({ success: false, error: 'Message is required.' });
  }
  if (trimmed.length > MAX_USER_MESSAGE_LEN) {
    return res.status(400).json({ success: false, error: 'Message is too long.' });
  }

  const ctx =
    context && typeof context === 'object' && !Array.isArray(context) ? context : {};
  const contextJson = JSON.stringify(ctx);

  const apiKey =
    process.env.GROQ_API_KEY ||
    process.env.GROK_API_KEY ||
    process.env.GROQ_KEY;
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      error: 'AI tutor is not configured. Please try again later.',
    });
  }

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  try {
    await pool.query(
      `
        INSERT INTO chat_messages (user_id, message, is_ai, context)
        VALUES ($1, $2, FALSE, $3::jsonb)
      `,
      [userId, trimmed, contextJson]
    );

    const { rows: historyDesc } = await pool.query(
      `
        SELECT message, is_ai
        FROM chat_messages
        WHERE user_id = $1
        ORDER BY id DESC
        LIMIT $2
      `,
      [userId, HISTORY_LIMIT]
    );
    const historyRows = historyDesc.slice().reverse();

    const systemWithContext = `${SYSTEM_PROMPT}\n\nCurrent page context (JSON — use if relevant to the student's question):\n${contextJson}`;

    const groqMessages = buildGroqMessages(systemWithContext, historyRows);

    const groqRes = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: groqMessages,
        temperature: 0.55,
        max_tokens: 2048,
      }),
    });

    const groqData = await groqRes.json().catch(() => ({}));

    if (!groqRes.ok) {
      console.error('Groq API error:', groqRes.status, groqData);
      throw new Error(groqData?.error?.message || `Groq HTTP ${groqRes.status}`);
    }

    const reply = groqData?.choices?.[0]?.message?.content?.trim() || '';
    if (!reply) {
      throw new Error('Empty model response');
    }

    await pool.query(
      `
        INSERT INTO chat_messages (user_id, message, is_ai, context)
        VALUES ($1, $2, TRUE, '{}'::jsonb)
      `,
      [userId, reply]
    );

    return res.json({ success: true, reply });
  } catch (err) {
    console.error('postChat:', err?.message || err);
    return res.status(500).json({
      success: false,
      error: "Sorry, I couldn't respond. Please try again.",
    });
  }
}
