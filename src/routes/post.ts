import { Router } from 'express';

// Types
import type { PostController } from '../controllers/post.js';

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
export function createPostRoutes(controller: PostController): Router {
  const router = Router();

  router.get('/', controller.getAllPosts);
  router.get('/:id', controller.getPostById);
  router.post('/', controller.createPost);
  router.put('/:id', controller.updatePost);
  router.delete('/:id', controller.deletePost);

  return router;
}
