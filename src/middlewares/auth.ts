import passport from 'passport';

// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';

// Types
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { JwtPayload, UserRole } from '../types/auth.js';

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

/**
 * Authorization middleware factory.
 * @param {...roles} - The roles allowed to access the route.
 * @returns A middleware function that checks if the request has a valid user object
 * with one of the specified roles, and if so, proceeds to the next middleware or controller.
 * If the user is not authorized, it sends a 401 Unauthorized or 403 Forbidden response
 * based on whether the user is authenticated or not.
 */
export function authorizeMiddleware(...roles: UserRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    // authMiddleware must run before authorize()
    if (!user) {
      sendErrorResponse(
        res,
        ERROR_MESSAGES.UNAUTHORIZED,
        RESPONSE_STATUS_CODE.UNAUTHORIZED
      );
      return;
    }

    if (!roles.includes(user.role)) {
      sendErrorResponse(
        res,
        ERROR_MESSAGES.FORBIDDEN,
        RESPONSE_STATUS_CODE.FORBIDDEN
      );
      return;
    }

    next();
  };
}
