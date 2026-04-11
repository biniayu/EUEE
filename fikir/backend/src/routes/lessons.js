import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as subjectsController from '../controllers/subjectsController.js';

export function createLessonsRouter() {
  const router = Router();
  router.use(requireAuth);
  router.post('/:id/complete', (req, res) => subjectsController.completeLesson(req, res));
  router.get('/:id', (req, res) => subjectsController.getLessonById(req, res));
  return router;
}
