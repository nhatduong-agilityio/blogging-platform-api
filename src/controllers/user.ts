// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';

// Types
import type { Request, Response, NextFunction } from 'express';
import type { UserService } from '../services/user.js';

// Utils
import { AppError } from '../utils/app-error.js';
import { sendSuccessResponse } from '../utils/response.js';

export class UserController {
  constructor(private readonly userService: UserService) {}

  getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.notFound(ERROR_MESSAGES.NOT_FOUND('User'));
      }

      const user = await this.userService.getMe(req.user.userId);
      sendSuccessResponse(res, user);
    } catch (err) {
      next(err);
    }
  };
}
