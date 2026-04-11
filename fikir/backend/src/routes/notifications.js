import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as notificationController from '../controllers/notificationController.js';

export function createNotificationsRouter() {
  const router = Router();
  router.use(requireAuth);

  router.get('/', (req, res) => notificationController.listNotifications(req, res));
  router.post('/mark-all-read', (req, res) => notificationController.markAllNotificationsRead(req, res));
  router.post('/:id/read', (req, res) => notificationController.markNotificationRead(req, res));

  return router;
}
