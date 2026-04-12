import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  handleValidation,
  studyPlanAdjustRules,
  studyPlanCompleteTaskRules,
  studyPlanGenerateRules,
} from '../middleware/validate.js';
import * as studyPlanController from '../controllers/studyPlanController.js';

export function createStudyPlanRouter() {
  const router = Router();
  router.use(requireAuth);
  router.get('/', (req, res) => studyPlanController.getStudyPlan(req, res));
  router.post('/generate', studyPlanGenerateRules, handleValidation, (req, res) =>
    studyPlanController.generateStudyPlan(req, res)
  );
  router.post('/task/complete', studyPlanCompleteTaskRules, handleValidation, (req, res) =>
    studyPlanController.completeTask(req, res)
  );
  router.put('/adjust', studyPlanAdjustRules, handleValidation, (req, res) =>
    studyPlanController.adjustStudyPlan(req, res)
  );
  return router;
}
