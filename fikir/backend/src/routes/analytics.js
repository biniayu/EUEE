import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as analyticsController from '../controllers/analyticsController.js';

export function createAnalyticsRouter() {
  const router = Router();
  router.use(requireAuth);
  router.get('/', (req, res) => analyticsController.getAnalytics(req, res));
  return router;
}
