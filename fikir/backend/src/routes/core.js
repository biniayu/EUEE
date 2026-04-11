import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';

export function createCoreRouter(ctrl) {
  const router = Router();
  router.get('/subjects', requireAuth, (req, res) => ctrl.getSubjects(req, res));
  return router;
}
