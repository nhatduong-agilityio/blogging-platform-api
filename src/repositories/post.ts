// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';

// Types
import type { Database as DatabaseType } from 'better-sqlite3';
import type { CreatePostSchema, UpdatePostSchema } from '../schemas/post.js';
import type { IPostRepository, Post, PostRow } from '../types/post.js';

// Utils
import { mapPostRowToPost } from '../utils/map.js';

// Repositories
import { BaseRepository } from './base.js';

export class PostRepository
  extends BaseRepository<Post, PostRow, CreatePostSchema, UpdatePostSchema>
  implements IPostRepository
{
  /**
   * Initializes a new instance of the PostRepository class.
   * @param {DatabaseType} db The database connection to use.
   */
  constructor(db: DatabaseType) {
    super(db, 'posts');
  }

  /**
   * Maps a PostRow object from the database to a Post object.
   * @param {PostRow} row - The PostRow object from the database.
   * @returns {Post} - The Post object.
   */
  protected override mapRow(row: PostRow): Post {
    return mapPostRowToPost(row);
  }

  /**
   * Finds all posts that match the given term in title, content, or category.
   * If no term is given, returns all posts.
   * @param {string} [term] - Optional search term to filter the posts by.
   * @returns {Post[]} An array of posts that match the given term, or all posts if no term is given.
   */
  override findAll(term?: string): Post[] {
    if (term) {
      const likeTerm = `%${term}%`;
      const stmt = this.db.prepare<[string, string, string], PostRow>(`
      SELECT * FROM ${this.tableName}
      WHERE title LIKE ? COLLATE NOCASE
      OR content LIKE ? COLLATE NOCASE
      OR category LIKE ? COLLATE NOCASE
      ORDER BY created_at DESC`);

      const rows = stmt.all(likeTerm, likeTerm, likeTerm);
      return rows.map(row => this.mapRow(row));
    }

    const stmt = this.db.prepare<[], PostRow>(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`
    );

    return stmt.all().map(row => this.mapRow(row));
  }

  /**
   * Creates a new post with the given payload and returns the created post.
   * If the creation is successful, returns the created post.
   * If the creation fails (e.g. due to a database error), throws an Error with the message POST_CREATION_FAILED.
   * @param {CreatePostSchema} input - The payload to create the post with.
   * @returns {Post} The created post if successful.
   * @throws {Error} If the post cannot be created.
   */
  override create(input: CreatePostSchema): Post {
    const now = new Date().toISOString();

    // The tags are stored as a JSON string in the database, so we need to stringify them before inserting.
    // stmt is typed to expect the correct number of parameters and their types, which helps catch errors at compile time.
    const stmt = this.db.prepare<
      [string, string, string, string, string, string]
    >(
      `INSERT INTO ${this.tableName} (title, content, category, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
    );

    const result = stmt.run(
      input.title,
      input.content,
      input.category,
      JSON.stringify(input.tags),
      now,
      now
    );

    const createdPost = this.findById(result.lastInsertRowid as number);

    if (!createdPost) {
      throw new Error(ERROR_MESSAGES.POST_CREATION_FAILED);
    }

    return createdPost;
  }

  /**
   * Updates a post by its ID with the given payload and returns the updated post if found.
   * If no post with the given ID exists, returns undefined.
   * If the update is successful, returns the updated post.
   * If the update fails (e.g. due to a database error), throws an Error with the message POST_UPDATE_FAILED.
   * @param {number} id - The ID of the post to update.
   * @param {UpdatePostSchema} input - The payload to update the post with.
   * @returns {Post | undefined} The updated post if found, or undefined if not.
   * @throws {Error} If the post cannot be updated.
   */
  override update(id: number, input: UpdatePostSchema): Post | undefined {
    const now = new Date().toISOString();

    const stmt = this.db.prepare<
      [string, string, string, string, string, number]
    >(`
    UPDATE ${this.tableName}
    SET title = ?, content = ?, category = ?, tags = ?, updated_at = ?
    WHERE id = ?`);

    const result = stmt.run(
      input.title,
      input.content,
      input.category,
      JSON.stringify(input.tags),
      now,
      id
    );

    if (result.changes === 0) {
      return undefined;
    }

    return this.findById(id);
  }
}
