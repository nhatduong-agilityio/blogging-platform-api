// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';

// Types
import type { IRepository, IService } from '../types/common.js';

// Utils
import { AppError } from '../utils/app-error.js';

export abstract class BaseService<T, C, U> implements IService<T, C, U> {
  constructor(protected readonly repository: IRepository<T, C, U>) {}

  // Implement abstract methods
  abstract getAll(term?: string): T[];
  abstract create(input: C): T;
  abstract update(id: number, input: U): T | undefined;

  // Protected helpers

  /**
   * Subclasses set this once - used in all error messages
   * e.g `Post not found` or `Any resource not found`
   * @returns {string} The resource name.
   */
  protected abstract get resourceName(): string;

  // Provided methods

  /**
   * Finds a post by its ID and returns it if found, or throws an AppError with status code NOT_FOUND if not.
   * @param {number} id - The ID of the post to find.
   * @returns {T | undefined} The post if found, or undefined if not.
   * @throws {AppError} If the post cannot be found.
   */
  getById(id: number): T {
    const entity = this.repository.findById(id);

    if (!entity) {
      throw AppError.notFound(ERROR_MESSAGES.NOT_FOUND(this.resourceName));
    }

    return entity;
  }

  /**
   * Deletes a post by its ID.
   * If no post with the given ID exists, throws an AppError with status code NOT_FOUND.
   * @param {number} id - The ID of the post to delete.
   * @throws {AppError} If the post cannot be found.
   */
  delete(id: number): void {
    const deleted = this.repository.delete(id);

    if (!deleted) {
      throw AppError.notFound(ERROR_MESSAGES.NOT_FOUND(this.resourceName));
    }
  }
}
