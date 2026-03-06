// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';

// Types
import type { CreatePostInput, Post } from '../types/post.js';

// Repositories
import * as postRepository from '../repositories/post.js';
import { AppError } from '../utils/app-error.js';

/**
 * Creates a new post with the given payload and returns the created post.
 * @param {CreatePostInput} payload The payload to create the post with.
 * @returns {Post} The created post.
 * @throws {Error} If the post cannot be created.
 */
export function createPost(payload: CreatePostInput): Post {
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
