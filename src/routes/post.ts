import { Router } from 'express';

// Types
import type { PostController } from '../controllers/post.js';
import type { Repository } from 'typeorm';
import type { IdempotencyKeyEntity } from '../entity/idempotency.js';

// Middlewares
import { idempotency } from '../middlewares/idempotency.js';
import { writeLimiter } from '../middlewares/rate-limit.js';
import { authMiddleware, authorizeMiddleware } from '../middlewares/auth.js';
import { ROLE } from '../constants/user.js';

/**
 * Creates a new Router instance with the given PostController and registers routes for:
 * GET / - Retrieves all posts.
 * GET /:id - Retrieves a post by its ID.
 * POST / - Creates a new post.
 * PUT /:id - Updates a post by its ID.
 * DELETE /:id - Deletes a post by its ID.
 * @param {PostController} controller - The PostController to register routes with.
 * @returns {Router} - The Router instance with the registered routes.
 */
export function createPostRoutes(
  controller: PostController,
  repo: Repository<IdempotencyKeyEntity>
): Router {
  const router = Router();

  // Admin-only write routes
  // Middleware order matters:
  //   1. authMiddleware   — verify JWT, set req.user
  //   2. authorize(admin) — check req.user.role
  //   3. writeLimiter     — rate limit after auth to avoid wasting quota
  //   4. idempotency      — only on POST (PUT/DELETE naturally idempotent)
  router.get('/', authMiddleware, controller.getAllPosts);
  router.get('/:id', authMiddleware, controller.getPostById);
  router.post(
    '/',
    authMiddleware,
    authorizeMiddleware(ROLE.ADMIN),
    writeLimiter,
    idempotency(repo),
    controller.createPost
  );

  router.put(
    '/:id',
    authMiddleware,
    authorizeMiddleware(ROLE.ADMIN),
    writeLimiter,
    controller.updatePost
  );

  router.delete(
    '/:id',
    authMiddleware,
    authorizeMiddleware(ROLE.ADMIN),
    writeLimiter,
    controller.deletePost
  );

  return router;
}
