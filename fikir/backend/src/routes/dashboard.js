import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as dashboardController from '../controllers/dashboardController.js';

export function createDashboardRouter() {
  const router = Router();
  router.use(requireAuth);
  router.get('/overview', (req, res) => dashboardController.getOverview(req, res));
  router.get('/subject-progress', (req, res) => dashboardController.getSubjectProgress(req, res));
  router.get('/today-tasks', (req, res) => dashboardController.getTodayTasks(req, res));
  router.get('/recommendations', (req, res) => dashboardController.getRecommendations(req, res));
  router.get('/stats', (req, res) => dashboardController.getStats(req, res));
  return router;
}
