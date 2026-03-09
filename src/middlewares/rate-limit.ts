import { rateLimit } from 'express-rate-limit';
import { sendErrorResponse } from '../utils/response.js';
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';

// Global Rate Limiter
// Applied to every route. Protects against basic DDoS / scraping.
// 100 requests per 15 minutes per IP.

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-8', // RateLimit headers (RFC 9110)
  legacyHeaders: false,
  handler: (_req, res) => {
    sendErrorResponse(
      res,
      'Too many requests, please try again later.',
      RESPONSE_STATUS_CODE.TOO_MANY_REQUESTS
    );
  }
});

// Write Limiter
// Applied to POST and PUT only — the mutation routes.
// Much stricter: 10 writes per 15 minutes per IP.
// Directly addresses the spam-create-posts problem.

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => {
    sendErrorResponse(
      res,
      'Too many write requests. You can create or update at most 10 posts per 15 minutes.',
      RESPONSE_STATUS_CODE.TOO_MANY_REQUESTS
    );
  }
});
