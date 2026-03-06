// Types
import type { CreatePostInput, Post } from '../types/post.js';

// Repositories
import * as postRepository from '../repositories/post.js';

/**
 * Creates a new post with the given payload and returns the created post.
 * @param {CreatePostInput} payload The payload to create the post with.
 * @returns {Post} The created post.
 * @throws {Error} If the post cannot be created.
 */
export function createPost(payload: CreatePostInput): Post {
  return postRepository.createPost(payload);
}
