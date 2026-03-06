import type { NextFunction, Request, Response } from 'express';

// Constants
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';

// Utils
import { sendSuccessResponse } from '../utils/response.js';
import { validateCreatePostInput } from '../utils/validators.js';

// Services
import * as postService from '../services/post.js';

/**
 * Creates a new post with the given payload and returns the created post.
 * @param {Request} req - The Express.js request object.
 * @param {Response} res - The Express.js response object.
 * @param {NextFunction} next - The Express.js next function, which is called if an error occurs.
 * @throws {Error} If the post cannot be created.
 */
export function createPost(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const result = validateCreatePostInput(req.body);
    const post = postService.createPost(result);

    sendSuccessResponse(res, post, RESPONSE_STATUS_CODE.CREATED);
  } catch (error) {
    next(error);
  }
}
