// Constants
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';
import { ERROR_MESSAGES } from '../constants/messages.js';

// Types
import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../services/auth.js';

// Schemas
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema
} from '../schemas/auth.js';

// Utils
import { handleZodError } from '../utils/zod.js';
import { AppError } from '../utils/app-error.js';
import { sendSuccessResponse } from '../utils/response.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}
  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) throw handleZodError(result.error);

      const user = await this.authService.register({
        email: result.data.email,
        password: result.data.password,
        role: result.data.role
      });

      sendSuccessResponse(res, user, RESPONSE_STATUS_CODE.CREATED);
    } catch (err) {
      next(err);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) throw handleZodError(result.error);

      const tokens = await this.authService.login(
        result.data.email,
        result.data.password
      );

      sendSuccessResponse(res, tokens);
    } catch (err) {
      next(err);
    }
  };

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = refreshTokenSchema.safeParse(req.body);
      if (!result.success) throw handleZodError(result.error);

      const token = await this.authService.refresh(result.data.refreshToken);

      sendSuccessResponse(res, token);
    } catch (err) {
      next(err);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // req.user is typed as Express.User (= JwtPayload) via express.d.ts
      // authMiddleware ensures this is always set before we reach here.
      if (!req.user) {
        throw AppError.notFound(ERROR_MESSAGES.NOT_FOUND('User'));
      }

      await this.authService.logout(req.user.userId);

      sendSuccessResponse(res, null, RESPONSE_STATUS_CODE.NO_CONTENT);
    } catch (err) {
      next(err);
    }
  };
}
