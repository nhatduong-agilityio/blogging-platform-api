import { Router } from 'express';

// Types
import type { PostController } from '../controllers/post.js';
import type { Repository } from 'typeorm';
import type { IdempotencyKeyEntity } from '../entity/idempotency.js';

// Middlewares
import { idempotency } from '../middlewares/idempotency.js';
import { writeLimiter } from '../middlewares/rate-limit.js';
import { authMiddleware } from '../middlewares/auth.js';

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

  router.get('/', controller.getAllPosts);
  router.get('/:id', controller.getPostById);

  // Write routes — rate limited + idempotency on POST
  // PUT and DELETE are naturally idempotent by HTTP semantics,
  // so idempotency middleware is only needed on POST (create).
  router.post(
    '/',
    authMiddleware,
    writeLimiter,
    idempotency(repo),
    controller.createPost
  );
  router.put('/:id', authMiddleware, writeLimiter, controller.updatePost);
  router.delete('/:id', authMiddleware, writeLimiter, controller.deletePost);

  return router;
}
