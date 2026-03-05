import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db: DatabaseType = null as unknown as DatabaseType;

/**
 * Returns the initialized database connection.
 * Throws an error if the database connection has not been initialized using initializeDb() first.
 * @returns The initialized database connection.
 */
export function getDb(): DatabaseType {
  if (!db) {
    throw new Error(
      'Database connection not initialized. Call initializeDb() first.'
    );
  }

  return db;
}

/**
 * Runs database migrations to initialize the database schema.
 * @param {DatabaseType} database - The database connection to run the migrations on.
 */
function runMigrations(database: DatabaseType): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
}

/**
 * Initializes the database connection and runs migrations to initialize the database schema.
 * The database path can be overridden by setting the DB_PATH environment variable.
 * If DB_PATH is not set, the database will be stored in the ./data/blog.db file relative to the current working directory.
 * @returns The initialized database connection.
 */
export function initializeDb(): DatabaseType {
  const dbPath = process.env.DB_PATH ?? path.join(__dirname, './data/blog.db');
  const resolvedDbPath = path.resolve(process.cwd(), dbPath);
  const dbDir = path.dirname(resolvedDbPath);

  // Ensure the directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(resolvedDbPath);

  db.pragma('journal_mode = WAL'); // Enable Write-Ahead Logging for better concurrency
  db.pragma('foreign_keys = ON'); // Enable foreign key constraints

  runMigrations(db);

  console.info(`Database initialized at ${resolvedDbPath}`);
  return db;
}

/**
 * Closes the database connection.
 * If the database connection is not initialized, this function does nothing.
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null as unknown as DatabaseType;
    console.info('Database connection closed.');
  }
}
