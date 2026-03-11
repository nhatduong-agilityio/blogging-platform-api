import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import { PostEntity } from '../entity/post.js';
import { IdempotencyKeyEntity } from '../entity/idempotency.js';

// DataSource
// Single source of truth for the DB connection.
// Passed into repositories via constructor (DI — no global access).

/**
 * Creates a new DataSource instance with the given database path.
 * If DB_PATH is not set, the database will be stored in the ./data/blog.db file relative to the current working directory.
 * @returns The initialized database connection.
 */
export function createDataSource(): DataSource {
  const dbPath = process.env.DB_PATH ?? './data/blog.db';
  const resolvedPath = path.resolve(process.cwd(), dbPath);

  return new DataSource({
    type: 'better-sqlite3',
    database: resolvedPath,
    entities: [PostEntity, IdempotencyKeyEntity],

    // synchronize: true auto-creates/alters tables to match entities.
    // Fine for development — use migrations in production.
    synchronize: process.env.NODE_ENV !== 'production',

    // In production, run migrations instead of synchronize.
    migrations: ['dist/database/migrations/*.js'],

    logging: process.env.NODE_ENV === 'development'
  });
}

/**
 * Initializes the database connection.
 * @returns A promise that resolves to the initialized database connection.
 */
export async function initializeDb(): Promise<DataSource> {
  const dataSource = createDataSource();
  await dataSource.initialize();
  console.info(
    `Database initialized: ${dataSource.options.database as string}`
  );
  return dataSource;
}

/**
 * Closes the database connection.
 * @param {DataSource} [dataSource] - The database connection to close.
 * If not provided, the function will do nothing.
 * @returns {Promise<void>} A promise that resolves to void once the database connection is closed.
 */
export async function closeDb(dataSource?: DataSource): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
    console.info('Database connection closed.');
  }
}
