import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';

export function createOnboardingRouter(onboardingController) {
  const router = Router();
  router.get('/status', requireAuth, (req, res) => onboardingController.status(req, res));
  router.post('/profile', requireAuth, (req, res) => onboardingController.profile(req, res));
  router.post('/preferences', requireAuth, (req, res) => onboardingController.preferences(req, res));
  router.post('/diagnostic', requireAuth, (req, res) => onboardingController.diagnostic(req, res));
  router.post('/complete', requireAuth, (req, res) => onboardingController.complete(req, res));
  return router;
}
