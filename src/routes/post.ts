import { Router } from 'express';

// Types
import type { PostController } from '../controllers/post.js';
import type { Database as DatabaseType } from 'better-sqlite3';

// Middlewares
import { idempotency } from '../middlewares/idempotency.js';
import { writeLimiter } from '../middlewares/rate-limit.js';

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
  db: DatabaseType
): Router {
  const router = Router();

  router.get('/', controller.getAllPosts);
  router.get('/:id', controller.getPostById);

  // Write routes — rate limited + idempotency on POST
  // PUT and DELETE are naturally idempotent by HTTP semantics,
  // so idempotency middleware is only needed on POST (create).
  router.post('/', writeLimiter, idempotency(db), controller.createPost);
  router.put('/:id', writeLimiter, controller.updatePost);
  router.delete('/:id', controller.deletePost);

  return router;
}
