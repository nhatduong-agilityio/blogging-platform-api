// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';

// Types
import type { IRepository, IService } from '../types/common.js';

// Utils
import { AppError } from '../utils/app-error.js';

export abstract class BaseService<T, C, U> implements IService<T, C, U> {
  constructor(protected readonly repository: IRepository<T, C, U>) {}

  // Implement abstract methods
  abstract getAll(term?: string): Promise<T[]>;
  abstract create(input: C): Promise<T>;
  abstract update(id: number, input: U): Promise<T>;

  // Protected helpers

  /**
   * Subclasses set this once - used in all error messages
   * e.g `Post not found` or `Any resource not found`
   * @returns {string} The resource name.
   */
  protected abstract get resourceName(): string;

  // Provided methods

  /**
   * Finds a record by its ID.
   * @param {number} id - The ID of the record to find.
   * @returns {Promise<T>} A promise that resolves to the found record if it exists, or throws an AppError with status code NOT_FOUND if not.
   */
  async getById(id: number): Promise<T> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw AppError.notFound(ERROR_MESSAGES.NOT_FOUND(this.resourceName));
    }
    return entity;
  }

  /**
   * Deletes a record by its ID.
   * @param {number} id - The ID of the record to delete.
   * @throws {AppError} If the record with the given ID does not exist.
   * @returns {Promise<void>} A promise that resolves to void if the record is deleted, or throws an AppError with status code NOT_FOUND if not.
   */
  async delete(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw AppError.notFound(ERROR_MESSAGES.NOT_FOUND(this.resourceName));
    }
  }
}
