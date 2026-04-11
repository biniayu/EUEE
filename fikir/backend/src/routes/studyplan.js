import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as studyPlanController from '../controllers/studyPlanController.js';

export function createStudyPlanRouter() {
  const router = Router();
  router.use(requireAuth);
  router.get('/', (req, res) => studyPlanController.getStudyPlan(req, res));
  router.post('/generate', (req, res) => studyPlanController.generateStudyPlan(req, res));
  router.post('/task/complete', (req, res) => studyPlanController.completeTask(req, res));
  router.put('/adjust', (req, res) => studyPlanController.adjustStudyPlan(req, res));
  return router;
}
