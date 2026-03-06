// Constants
import { KEY_HEADER, TTL_MS, UUID_RE } from '../constants/idempotency.js';
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';

// Types
import type { Request, Response, NextFunction } from 'express';
import type { Database as DatabaseType } from 'better-sqlite3';
import type { IdempotencyRow } from '../types/idempotency.js';

// Utils
import { sendErrorResponse } from '../utils/response.js';

// Middleware Factory
// Usage: router.post('/', idempotency(db), controller.create)
// Flow:
//   1. Header missing          → proceed normally (no idempotency)
//   2. Header present, bad fmt → 400
//   3. Key found, not expired  → replay cached response (no DB write)
//   4. Key found, expired      → delete stale row, treat as new request
//   5. Key not found           → intercept res.json() to cache the response
//      after the controller writes it, then let it through

/**
 * Idempotency middleware.
 * Intercepts requests and responses to cache POST requests using a UUID header.
 * If the request is successfully cached, it will be replayed from cache instead of being sent to the controller.
 * If the request is not cached, it will be cached after the controller writes the response.
 * If the cached response has expired, it will be removed from cache and the request will be sent to the controller.
 * @param db - The database to use for caching.
 * @returns A middleware function that takes three arguments: req, res, and next.
 */
export function idempotency(db: DatabaseType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.headers[KEY_HEADER];

    // 1. No header — skip idempotency entirely
    if (!key) {
      next();
      return;
    }

    // 2. Validate format — must be a UUID
    if (typeof key !== 'string' || !UUID_RE.test(key)) {
      sendErrorResponse(
        res,
        `Invalid ${KEY_HEADER} header. Must be a UUID (e.g. 550e8400-e29b-41d4-a716-446655440000).`,
        RESPONSE_STATUS_CODE.BAD_REQUEST
      );
      return;
    }

    // 3 & 4. Look up key in DB
    const row = db
      .prepare<
        [string],
        IdempotencyRow
      >('SELECT * FROM idempotency_keys WHERE key = ?')
      .get(key);

    if (row) {
      const age = Date.now() - row.created_at;

      if (age <= TTL_MS) {
        // 3. Valid cached response — replay it
        res
          .status(row.status_code)
          .setHeader('Idempotent-Replayed', 'true')
          .json(JSON.parse(row.response) as unknown);
        return;
      }

      // 4. Expired — remove stale row and fall through
      db.prepare<[string]>('DELETE FROM idempotency_keys WHERE key = ?').run(
        key
      );
    }

    // 5. New key — intercept res.json to cache the response
    const originalJson = res.json.bind(res);

    res.json = (body: unknown): Response => {
      // Only cache success responses (2xx) — don't cache validation errors
      if (res.statusCode >= 200 && res.statusCode < 300) {
        db.prepare<[string, number, string, number]>(
          `
          INSERT OR REPLACE INTO idempotency_keys (key, status_code, response, created_at)
          VALUES (?, ?, ?, ?)
        `
        ).run(key, res.statusCode, JSON.stringify(body), Date.now());
      }
      return originalJson(body);
    };

    next();
  };
}

// Cleanup Helper
// Call this on a schedule (e.g. daily) or at startup to evict
// rows whose TTL has passed and will never be replayed again.
/**
 * Removes expired idempotency keys from the database.
 * @param db - The database to purge from.
 * @returns The number of rows deleted.
 */
export function purgeExpiredKeys(db: DatabaseType): number {
  const cutoff = Date.now() - TTL_MS;
  const result = db
    .prepare<[number]>('DELETE FROM idempotency_keys WHERE created_at < ?')
    .run(cutoff);
  return result.changes;
}
