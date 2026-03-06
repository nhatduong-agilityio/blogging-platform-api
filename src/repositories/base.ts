// Types
import type { Database as DatabaseType } from 'better-sqlite3';
import type { IRepository } from '../types/common.js';

export abstract class BaseRepository<
  T,
  Row extends object,
  C,
  U
> implements IRepository<T, C, U> {
  constructor(
    protected readonly db: DatabaseType,
    protected readonly tableName: string
  ) {}

  // Implement abstract methods

  /**
   * Finds all records that match the given term.
   * @param term
   */
  abstract findAll(term?: string): T[];

  /**
   *  Creates a new record.
   * @param input
   */
  abstract create(input: C): T;

  /**
   * Updates a record by its ID.
   * @param id
   * @param input
   */
  abstract update(id: number, input: U): T | undefined;

  // Protected helpers

  /**
   * Maps a row of data to an object of type T.
   * @param row
   */
  protected abstract mapRow(row: Row): T;
  /**
   * Checks if a record exists by its ID.
   * @param {number} id The ID of the record to check.
   * @returns {boolean} true if the record exists, false otherwise.
   */
  protected exists(id: number): boolean {
    return this.findById(id) !== undefined;
  }

  // Provided methods

  /**
   * Finds a record by its ID and returns it if found, or undefined if not.
   * @param {number} id The ID of the record to find.
   * @returns {T | undefined} The record if found, or undefined if not.
   */
  findById(id: number): T | undefined {
    const stmt = this.db.prepare<[number], Row>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`
    );
    const row = stmt.get(id);
    return row ? this.mapRow(row) : undefined;
  }

  /**
   * Deletes a record by its ID.
   * @param {number} id The ID of the record to delete.
   * @returns {boolean} True if the record was successfully deleted, false otherwise.
   */
  delete(id: number): boolean {
    const stmt = this.db.prepare<[number]>(
      `DELETE FROM ${this.tableName} WHERE id = ?`
    );
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
