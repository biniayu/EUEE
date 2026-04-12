import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimits.js';
import { handleValidation, loginRules, signupRules } from '../middleware/validate.js';

export function createAuthRouter(authController) {
  const router = Router();
  router.post('/signup', authLimiter, signupRules, handleValidation, (req, res) =>
    authController.signup(req, res)
  );
  router.post('/login', authLimiter, loginRules, handleValidation, (req, res) =>
    authController.login(req, res)
  );
  router.get('/me', requireAuth, (req, res) => authController.me(req, res));
  router.post('/logout', (req, res) => authController.logout(req, res));
  return router;
}
