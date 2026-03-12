import type { Request, Response } from 'express';

import type { AuthService } from '../services/auth.js';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema
} from '../schemas/auth.js';
import { handleZodError } from '../utils/zod.js';
import { AppError } from '../utils/app-error.js';
import { ERROR_MESSAGES } from '../constants/messages.js';
import { sendSuccessResponse } from '../utils/response.js';
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const parsed = registerSchema.parse(req.body);

    const result = await this.authService.register(
      parsed.email,
      parsed.password
    );

    sendSuccessResponse(res, result, RESPONSE_STATUS_CODE.CREATED);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = loginSchema.safeParse(req.body);
    const data = result.success ? result.data : undefined;

    if (result && result.error) {
      throw handleZodError(result.error);
    }

    const tokens = await this.authService.login(
      data?.email ?? '',
      data?.password ?? ''
    );

    res.json(tokens);
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const result = refreshTokenSchema.safeParse(req.body);
    const data = result.success ? result.data : undefined;

    if (result && result.error) {
      throw handleZodError(result.error);
    }

    const token = await this.authService.refresh(data?.refreshToken ?? '');

    res.json(token);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    if (
      !req as unknown as {
        user: {
          userId: number;
        };
      }
    ) {
      throw AppError.notFound(ERROR_MESSAGES.NOT_FOUND('User'));
    }

    const userId = (
      req as unknown as {
        user: {
          userId: number;
        };
      }
    ).user.userId;

    await this.authService.logout(userId);

    sendSuccessResponse(res, null, RESPONSE_STATUS_CODE.NO_CONTENT);
  };
}
