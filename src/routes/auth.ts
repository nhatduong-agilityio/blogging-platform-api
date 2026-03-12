import { Router } from 'express';

import type { AuthController } from '../controllers/auth.js';
import { authMiddleware } from '../middlewares/auth.js';

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  router.post('/login', controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/logout', authMiddleware, controller.logout);
  router.post('/register', controller.register);

  return router;
}
