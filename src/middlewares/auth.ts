import passport from 'passport';

// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';

// Types
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { JwtPayload } from '../types/auth.js';

// Utils
import { sendErrorResponse } from '../utils/response.js';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const handler = passport.authenticate(
    'jwt',
    { session: false },
    (err: unknown, user: JwtPayload | false) => {
      if (err) {
        next(err);
        return;
      }

      if (!user) {
        sendErrorResponse(
          res,
          ERROR_MESSAGES.UNAUTHORIZED,
          RESPONSE_STATUS_CODE.UNAUTHORIZED
        );
        return;
      }

      req.user = user;
      next();
    }
  ) as RequestHandler;

  handler(req, res, next);
}
