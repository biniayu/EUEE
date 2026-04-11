import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';

export function createAuthRouter(authController) {
  const router = Router();
  router.post('/signup', (req, res) => authController.signup(req, res));
  router.post('/login', (req, res) => authController.login(req, res));
  router.get('/me', requireAuth, (req, res) => authController.me(req, res));
  router.post('/logout', (req, res) => authController.logout(req, res));
  return router;
}
