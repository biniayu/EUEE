import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { handleValidation, lessonCompleteRules } from '../middleware/validate.js';
import * as subjectsController from '../controllers/subjectsController.js';

export function createLessonsRouter() {
  const router = Router();
  router.use(requireAuth);
  router.post('/:id/complete', lessonCompleteRules, handleValidation, (req, res) =>
    subjectsController.completeLesson(req, res)
  );
  router.get('/:id', (req, res) => subjectsController.getLessonById(req, res));
  return router;
}
