// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';

// Types
import type { CreatePostSchema, UpdatePostSchema } from '../schemas/post.js';
import type { IPostService, Post, IPostRepository } from '../types/post.js';

// Utils
import { AppError } from '../utils/app-error.js';

// Services
import { BaseService } from './base.js';

export class PostService
  extends BaseService<Post, CreatePostSchema, UpdatePostSchema>
  implements IPostService
{
  constructor(repository: IPostRepository) {
    super(repository);
  }

  /**
   * Subclasses set this once - used in all error messages
   * e.g `Post not found` or `Any resource not found`
   * @returns {string} The resource name.
   */
  protected override get resourceName(): string {
    return 'Post';
  }

  /**
   * Finds all posts that match the given term in title, content, or category.
   * If no term is given, returns all posts.
   * @param {string} [term] - Optional search term to filter the posts by.
   * @returns {Promise<Post[]>} A promise that resolves to an array of posts that match the given term, or all posts if no term is given.
   */
  override async getAll(term?: string): Promise<Post[]> {
    return this.repository.findAll(term);
  }

  /**
   * Creates a new post with the given payload and returns the created post.
   * @param {CreatePostSchema} input - The payload to create the post with.
   * @returns {Promise<Post>} A promise that resolves to the created post if successful.
   */
  override async create(input: CreatePostSchema): Promise<Post> {
    return this.repository.create(input);
  }

  /**
   * Updates a post by its ID with the given payload and returns the updated post.
   * If the post with the given ID does not exist, throws an AppError with status code NOT_FOUND.
   * If the update fails, throws an AppError with status code INTERNAL_SERVER_ERROR.
   * @param {number} id - The ID of the post to update.
   * @param {UpdatePostSchema} input - The payload to update the post with.
   * @returns {Promise<Post>} A promise that resolves to the updated post if successful.
   */
  override async update(id: number, input: UpdatePostSchema): Promise<Post> {
    await this.getById(id); // throws 404 if not found

    const updated = await this.repository.update(id, input);

    if (!updated) {
      throw AppError.internalServerError(ERROR_MESSAGES.POST_UPDATE_FAILED);
    }

    return updated;
  }
}
