// Types
import type { Repository, ObjectLiteral, FindOptionsWhere } from 'typeorm';
import type { IRepository } from '../types/common.js';

// Abstract Base Repository (TypeORM)
//
// Wraps TypeORM's Repository<E> and implements IRepository<T,C,U>.
//
// E   = TypeORM Entity class  (PostEntity, UserEntity, ...)
// T   = domain type returned  (Post, User, ...)  — often same as E
// C   = create DTO
// U   = update DTO
//
// Subclasses get findById and delete for free.
// They MUST implement: findAll, create, update
// and toDomain() to convert Entity → domain type if needed.
export abstract class BaseRepository<
  E extends ObjectLiteral,
  T,
  C,
  U
> implements IRepository<T, C, U> {
  constructor(protected readonly repo: Repository<E>) {}

  // Must implement abstract methods

  abstract findAll(term?: string): Promise<T[]>;
  abstract create(input: C): Promise<T>;
  abstract update(id: number, input: U): Promise<T | undefined>;

  // Protected helpers

  // Override when Entity shape differs from domain type.
  // Default: treat entity as domain type (works when E === T).
  protected toDomain(entity: E): T {
    return entity as unknown as T;
  }

  // Provided methods

  /**
   * Finds a record by its ID.
   * @param {number} id - The ID of the record to find.
   * @returns {Promise<T | undefined>} A promise that resolves to the found record if it exists, or undefined if not.
   */
  async findById(id: number): Promise<T | undefined> {
    const entity = await this.repo.findOne({
      where: { id: id } as unknown as FindOptionsWhere<E>
    });
    return entity ? this.toDomain(entity) : undefined;
  }

  /**
   * Deletes a record by its ID.
   * @param {number} id - The ID of the record to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the record was deleted, or false if not.
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
