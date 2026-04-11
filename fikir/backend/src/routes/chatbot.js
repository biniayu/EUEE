import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as chatbotController from '../controllers/chatbotController.js';

export function createChatbotRouter() {
  const router = Router();
  router.use(requireAuth);
  router.get('/messages', (req, res) => chatbotController.listMessages(req, res));
  router.post('/', (req, res) => chatbotController.postChat(req, res));
  return router;
}
