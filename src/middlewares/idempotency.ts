// Constants
import { KEY_HEADER, TTL_MS, UUID_RE } from '../constants/idempotency.js';
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';

// Types
import type { Request, Response, NextFunction } from 'express';
import type { Repository } from 'typeorm';
import type { IdempotencyKeyEntity } from '../entity/idempotency.js';

// Utils
import { sendErrorResponse } from '../utils/response.js';

/**
 * Idempotency middleware factory.
 * @param {Repository<IdempotencyKeyEntity>} repo - The TypeORM repository for the idempotency keys.
 * @returns A middleware function that checks if the request has a valid idempotency
 * key, and if so, replays the cached response if it hasn't expired, or deletes
 * the stale row if it has expired.
 *
 * The middleware works as follows:
 *   1. If the request has no idempotency key, it proceeds normally (no idempotency).
 *   2. If the request has an invalid idempotency key, it sends a 400 error response.
 *   3. If the request has a valid idempotency key that hasn't expired, it replays the cached response.
 *   4. If the request has a valid idempotency key that has expired, it deletes the stale row and treats it as a new request.
 *   5. If the request has a new idempotency key, it intercepts the response and caches it after the controller writes it.
 */
export function idempotency(repo: Repository<IdempotencyKeyEntity>) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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
    const row = await repo.findOne({ where: { key } });

    if (row) {
      const age = Date.now() - row.createdAt;

      if (age <= TTL_MS) {
        // 3. Valid cached response — replay it
        res
          .status(row.statusCode)
          .setHeader('Idempotent-Replayed', 'true')
          .json(JSON.parse(row.response) as unknown);
        return;
      }

      // 4. Expired — remove stale row and fall through
      await repo.delete({ key });
    }

    // 5. New key — intercept res.json to cache the response
    const originalJson = res.json.bind(res);

    res.json = (body: unknown): Response => {
      // Only cache success responses (2xx) — don't cache validation errors
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entry = repo.create({
          key,
          statusCode: res.statusCode,
          response: JSON.stringify(body),
          createdAt: Date.now()
        });
        // Fire-and-forget — don't block the response
        void repo.save(entry);
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
 * Removes all idempotency keys whose TTL has expired.
 * @returns A promise that resolves to the number of rows that were deleted.
 */
export async function purgeExpiredKeys(
  repo: Repository<IdempotencyKeyEntity>
): Promise<number> {
  const cutoff = Date.now() - TTL_MS;
  const result = await repo
    .createQueryBuilder()
    .delete()
    .where('created_at < :cutoff', { cutoff })
    .execute();
  return result.affected ?? 0;
}
