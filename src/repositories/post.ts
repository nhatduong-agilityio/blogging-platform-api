// Database
import { getDb } from '../database/connection.js';

// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';

// Types
import type { CreatePostInput, Post, PostRow } from '../types/post.js';

// Utils
import { mapPostRowToPost } from '../utils/map.js';

/**
 * Finds a post by its ID and returns it if found, or undefined if not.
 * @param {number} id The ID of the post to find.
 * @returns {Post | undefined} The post if found, or undefined if not.
 */
export function findPostById(id: number): Post | undefined {
  const db = getDb();
  const stmt = db.prepare<[number], PostRow>(
    'SELECT * FROM posts WHERE id = ?'
  );
  const row = stmt.get(id);

  return row ? mapPostRowToPost(row) : undefined;
}

/**
 * Creates a new post with the given payload and returns the created post.
 * @param {CreatePostInput} payload The payload to create the post with.
 * @returns {Post} The created post.
 * @throws {Error} If the post cannot be created.
 */
export function createPost(payload: CreatePostInput): Post {
  const db = getDb();
  const now = new Date().toISOString();

  // The tags are stored as a JSON string in the database, so we need to stringify them before inserting.
  // stmt is typed to expect the correct number of parameters and their types, which helps catch errors at compile time.
  const stmt = db.prepare<[string, string, string, string, string, string]>(
    'INSERT INTO posts (title, content, category, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const result = stmt.run(
    payload.title,
    payload.content,
    payload.category,
    JSON.stringify(payload.tags),
    now,
    now
  );

  const createdPost = findPostById(result.lastInsertRowid as number);

  if (!createdPost) {
    throw new Error(ERROR_MESSAGES.POST_CREATION_FAILED);
  }

  return createdPost;
}
