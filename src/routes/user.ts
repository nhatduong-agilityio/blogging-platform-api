import { Router } from 'express';
import type { UserController } from '../controllers/user.js';
import { authMiddleware } from '../middlewares/auth.js';

export function createUserRoutes(controller: UserController): Router {
  const router = Router();

  // Any authenticated user (admin or user)
  router.get('/me', authMiddleware, controller.getMe);

  return router;
}
