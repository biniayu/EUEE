import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  handleValidation,
  questionAttemptRules,
  questionFavoriteRules,
} from '../middleware/validate.js';
import * as questionController from '../controllers/questionController.js';

export function createQuestionsRouter() {
  const router = Router();
  router.use(requireAuth);

  router.get('/favorites', (req, res) => questionController.listFavorites(req, res));
  router.get('/meta/topics', (req, res) => questionController.listTopics(req, res));
  router.get('/', (req, res) => questionController.listQuestions(req, res));
  router.get('/:id(\\d+)', (req, res) => questionController.getQuestionById(req, res));
  router.post('/:id(\\d+)/attempt', questionAttemptRules, handleValidation, (req, res) =>
    questionController.postAttempt(req, res)
  );
  router.post('/:id(\\d+)/favorite', questionFavoriteRules, handleValidation, (req, res) =>
    questionController.postFavorite(req, res)
  );

  return router;
}
