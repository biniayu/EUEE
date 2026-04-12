import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  handleValidation,
  onboardingDiagnosticRules,
  onboardingPreferencesRules,
  onboardingProfileRules,
} from '../middleware/validate.js';

export function createOnboardingRouter(onboardingController) {
  const router = Router();
  router.get('/status', requireAuth, (req, res) => onboardingController.status(req, res));
  router.post('/profile', requireAuth, onboardingProfileRules, handleValidation, (req, res) =>
    onboardingController.profile(req, res)
  );
  router.post('/preferences', requireAuth, onboardingPreferencesRules, handleValidation, (req, res) =>
    onboardingController.preferences(req, res)
  );
  router.post('/diagnostic', requireAuth, onboardingDiagnosticRules, handleValidation, (req, res) =>
    onboardingController.diagnostic(req, res)
  );
  router.post('/complete', requireAuth, (req, res) => onboardingController.complete(req, res));
  return router;
}
