// Database
import { getDb } from '../database/connection.js';

// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';

// Types
import type {
  CreatePostInput,
  Post,
  PostRow,
  UpdatePostInput
} from '../types/post.js';

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
 * Finds all posts that match the given term in title, content, or category.
 * If no term is given, returns all posts.
 * @param {string} [term] - Optional search term to filter the posts by.
 * @returns {Post[]} An array of posts that match the given term, or all posts if no term is given.
 */
export function findAllPosts(term?: string): Post[] {
  const db = getDb();

  if (term) {
    const likeTerm = `%${term}%`;
    const stmt = db.prepare<[string, string, string], PostRow>(`
      SELECT * FROM posts
      WHERE title LIKE ? COLLATE NOCASE
      OR content LIKE ? COLLATE NOCASE
      OR category LIKE ? COLLATE NOCASE
      ORDER BY created_at DESC`);

    const rows = stmt.all(likeTerm, likeTerm, likeTerm);
    return rows.map(mapPostRowToPost);
  }

  const stmt = db.prepare<[], PostRow>(
    'SELECT * FROM posts ORDER BY created_at DESC'
  );

  const rows = stmt.all();
  return rows.map(mapPostRowToPost);
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

/**
 * Updates a post by its ID with the given payload and returns the updated post.
 * If no post with the given ID exists, throws an AppError with status code NOT_FOUND.
 * If the update is successful, returns the updated post.
 * If the update fails (e.g. due to a database error), throws an AppError with status code INTERNAL_SERVER_ERROR.
 * @param {number} id The ID of the post to update.
 * @param {UpdatePostInput} payload The payload to update the post with.
 * @returns {Post | undefined} The updated post if found, or undefined if not.
 * @throws {AppError} If the post cannot be found or updated.
 */
export function updatePost(
  id: number,
  payload: UpdatePostInput
): Post | undefined {
  const db = getDb();
  const now = new Date().toISOString();

  const stmt = db.prepare<[string, string, string, string, string, number]>(`
    UPDATE posts
    SET title = ?, content = ?, category = ?, tags = ?, updated_at = ?
    WHERE id = ?`);

  const result = stmt.run(
    payload.title,
    payload.content,
    payload.category,
    JSON.stringify(payload.tags),
    now,
    id
  );

  if (result.changes === 0) {
    throw new Error(ERROR_MESSAGES.POST_UPDATE_FAILED);
  }

  return findPostById(id);
}
