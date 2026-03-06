// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';

// Types
import type { Post } from '../types/post.js';

// Repositories
import * as postRepository from '../repositories/post.js';

// Utils
import { AppError } from '../utils/app-error.js';
import type {
  CreatePostSchema,
  UpdatePostSchema
} from '../utils/validators.js';

/**
 * Creates a new post with the given payload and returns the created post.
 * @param {CreatePostSchema} payload - The payload to create the post with.
 * @returns {Post} - The created post.
 * @throws {AppError} If the post cannot be created.
 */
export function createPost(payload: CreatePostSchema): Post {
  return postRepository.createPost(payload);
}

/**
 * Finds all posts that match the given term in title, content, or category.
 * If no term is given, returns all posts.
 * @param {string} [term] - Optional search term to filter the posts by.
 * @returns {Post[]} An array of posts that match the given term, or all posts if no term is given.
 */
export function getAllPosts(term?: string): Post[] {
  return postRepository.findAllPosts(term);
}

/**
 * Finds a post by its ID and returns it if found, or throws an AppError with status code NOT_FOUND if not.
 * @param {number} id - The ID of the post to find.
 * @returns {Post} The post if found.
 * @throws {AppError} If the post cannot be found.
 */
export function getPostById(id: number): Post {
  const post = postRepository.findPostById(id);

  if (!post) {
    throw AppError.notFound(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  return post;
}

/**
 * Updates a post by its ID with the given payload and returns the updated post.
 * If no post with the given ID exists, throws an AppError with status code NOT_FOUND.
 * If the update is successful, returns the updated post.
 * If the update fails (e.g. due to a database error), throws an AppError with status code INTERNAL_SERVER_ERROR.
 * @param {number} id - The ID of the post to update.
 * @param {UpdatePostSchema} payload - The payload to update the post with.
 * @returns {Post} The updated post if found.
 * @throws {AppError} If the post cannot be found or updated.
 */
export function updatePost(id: number, payload: UpdatePostSchema): Post {
  const existingPost = postRepository.findPostById(id);

  if (!existingPost) {
    throw AppError.notFound(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  const updatedPost = postRepository.updatePost(id, payload);

  if (!updatedPost) {
    throw AppError.internalServerError(ERROR_MESSAGES.POST_UPDATE_FAILED);
  }

  return updatedPost;
}

/**
 * Deletes a post by its ID.
 * @param {number} id The ID of the post to delete.
 * @throws {AppError} If the post cannot be found.
 */
export function deletePost(id: number): void {
  const deleted = postRepository.deletePost(id);

  if (!deleted) {
    throw AppError.notFound(ERROR_MESSAGES.POST_NOT_FOUND);
  }
}
