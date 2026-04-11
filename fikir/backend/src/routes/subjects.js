import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as subjectsController from '../controllers/subjectsController.js';

export function createSubjectsRouter() {
  const router = Router();
  router.use(requireAuth);
  router.get('/', (req, res) => subjectsController.listSubjects(req, res));
  router.get('/:id', (req, res) => subjectsController.getSubjectById(req, res));
  return router;
}
