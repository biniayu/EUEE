import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as chatbotController from '../controllers/chatbotController.js';

export function createChatbotRouter() {
  const router = Router();
  /** Browsers default to GET — explain how the tutor actually works */
  router.get('/', (req, res) =>
    res.json({
      success: false,
      message:
        'This endpoint expects POST with JSON { "message": "...", "context": {} } and a logged-in session cookie. Use the in-app tutor button.',
      health: '/api/chatbot/health',
    })
  );
  /** Dev helper: GET /api/chatbot/health (no auth) — confirms route exists; chat itself is POST + cookie */
  router.get('/health', (req, res) => {
    const configured = Boolean(
      process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.GROQ_KEY
    );
    return res.json({
      success: true,
      service: 'chatbot',
      groqConfigured: configured,
      hint: configured
        ? 'Send POST /api/chatbot with { message, context? } and auth cookie from the app.'
        : 'Set GROQ_API_KEY in backend/.env and restart the API.',
    });
  });
  router.use(requireAuth);
  router.get('/messages', (req, res) => chatbotController.listMessages(req, res));
  router.post('/', (req, res) => chatbotController.postChat(req, res));
  return router;
}
