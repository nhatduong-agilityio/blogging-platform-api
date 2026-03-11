// Constants
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';
import { ERROR_MESSAGES } from '../constants/messages.js';

// Schemas
import {
  createPostSchema,
  postIdSchema,
  searchQuerySchema,
  updatePostSchema
} from '../schemas/post.js';

// Utils
import { sendSuccessResponse } from '../utils/response.js';
import { handleZodError } from '../utils/zod.js';
import { AppError } from '../utils/app-error.js';

// Types
import type { NextFunction, Request, Response } from 'express';
import type { IPostService } from '../types/post.js';

/**
 * Parses the id parameter from the request URL and returns the parsed id as a number.
 * If the id is invalid, throws an AppError with status code BAD_REQUEST.
 * @param {Request} req - The Express.js request object.
 * @returns {number} The parsed id.
 * @throws {AppError} If the id is invalid.
 */
function parseIdParam(req: Request): number {
  const result = postIdSchema.safeParse({
    id: req.params['id']
  });

  if (!result.success) {
    throw AppError.badRequest(ERROR_MESSAGES.INVALID_POST_ID);
  }

  return result.data.id;
}

export class PostController {
  constructor(private readonly postService: IPostService) {}

  getAllPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const queryResult = searchQuerySchema.safeParse(req.query);
      const term = queryResult.success ? queryResult.data.term : undefined;

      const posts = await this.postService.getAll(term);
      sendSuccessResponse(res, posts);
    } catch (error) {
      next(error);
    }
  };

  getPostById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseIdParam(req);
      const post = await this.postService.getById(id);

      sendSuccessResponse(res, post);
    } catch (error) {
      next(error);
    }
  };

  createPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = createPostSchema.safeParse(req.body);

      if (!result.success) {
        throw handleZodError(result.error);
      }

      const post = await this.postService.create(result.data);
      sendSuccessResponse(res, post, RESPONSE_STATUS_CODE.CREATED);
    } catch (error) {
      next(error);
    }
  };

  updatePost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseIdParam(req);

      const result = updatePostSchema.safeParse(req.body);

      if (!result.success) {
        throw handleZodError(result.error);
      }

      const post = await this.postService.update(id, result.data);
      sendSuccessResponse(res, post);
    } catch (error) {
      next(error);
    }
  };

  deletePost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseIdParam(req);
      await this.postService.delete(id);

      sendSuccessResponse(res, null, RESPONSE_STATUS_CODE.NO_CONTENT);
    } catch (error) {
      next(error);
    }
  };
}
