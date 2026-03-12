import type { Request, Response, NextFunction } from 'express';

import { verifyAccessToken } from '../utils/jwt.js';
import { sendErrorResponse } from '../utils/response.js';
import type { JwtPayload } from '../types/auth.js';
import { ERROR_MESSAGES } from '../constants/messages.js';
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';

export function authMiddleware(
  req: Request & { user?: JwtPayload },
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header) {
    sendErrorResponse(
      res,
      ERROR_MESSAGES.UNAUTHORIZED,
      RESPONSE_STATUS_CODE.UNAUTHORIZED
    );
    return;
  }

  const token = header.split(' ')[1];

  if (!token) {
    sendErrorResponse(
      res,
      ERROR_MESSAGES.UNAUTHORIZED,
      RESPONSE_STATUS_CODE.UNAUTHORIZED
    );
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = payload;

    next();
  } catch {
    sendErrorResponse(res, 'Invalid token', RESPONSE_STATUS_CODE.UNAUTHORIZED);
  }
}
