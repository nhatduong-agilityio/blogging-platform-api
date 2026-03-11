// All methods are async — TypeORM operations return Promises.

/**
 * Interface for repository methods
 * @template T - Type of entity
 * @template C - Type of create input
 * @template U - Type of update input
 * @type {IRepository<T, C, U>}
 */
export interface IRepository<T, C, U> {
  findAll(term?: string): Promise<T[]>;
  findById(id: number): Promise<T | undefined>;
  create(input: C): Promise<T>;
  update(id: number, input: U): Promise<T | undefined>;
  delete(id: number): Promise<boolean>;
}

/**
 * Interface for service methods
 * @template T - Type of entity
 * @template C - Type of create input
 * @template U - Type of update input
 * @type {IService<T, C, U>}
 */ export interface IService<T, C, U> {
  getAll(term?: string): Promise<T[]>;
  getById(id: number): Promise<T>;
  create(input: C): Promise<T>;
  update(id: number, input: U): Promise<T>;
  delete(id: number): Promise<void>;
}
