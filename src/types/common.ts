/**
 * Interface for repository methods
 * @template T - Type of entity
 * @template C - Type of create input
 * @template U - Type of update input
 * @type {IRepository<T, C, U>}
 */
export interface IRepository<T, C, U> {
  findAll(term?: string): T[];
  findById(id: number): T | undefined;
  create(input: C): T;
  update(id: number, input: U): T | undefined;
  delete(id: number): boolean;
}

/**
 * Interface for service methods
 * @template T - Type of entity
 * @template C - Type of create input
 * @template U - Type of update input
 * @type {IService<T, C, U>}
 */
export interface IService<T, C, U> {
  getAll(term?: string): T[];
  getById(id: number): T | undefined;
  create(input: C): T;
  update(id: number, input: U): T | undefined;
  delete(id: number): void;
}
