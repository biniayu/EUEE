import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as practiceController from '../controllers/practiceController.js';

export function createPracticeRouter() {
  const router = Router();
  router.use(requireAuth);
  router.get('/topics/:subjectId', (req, res) => practiceController.listTopics(req, res));
  router.get('/session/:sessionId', (req, res) => practiceController.getSession(req, res));
  /** GET /api/practice/start?type=subject|topic|mock&subjectId=&topic=&targetQuestions= */
  router.get('/start', (req, res) => {
    req.body = {
      type: req.query.type,
      subjectId: req.query.subjectId,
      topic: req.query.topic,
      targetQuestions: req.query.targetQuestions,
    };
    return practiceController.startPractice(req, res);
  });
  router.post('/start', (req, res) => practiceController.startPractice(req, res));
  router.post('/submit-answer', (req, res) => practiceController.submitAnswer(req, res));
  router.post('/complete', (req, res) => practiceController.completePractice(req, res));
  return router;
}
