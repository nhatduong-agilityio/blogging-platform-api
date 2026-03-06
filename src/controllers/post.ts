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

  getAllPosts = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const queryResult = searchQuerySchema.safeParse(req.query);
      const term = queryResult.success ? queryResult.data.term : undefined;

      const posts = this.postService.getAll(term);
      sendSuccessResponse(res, posts);
    } catch (error) {
      next(error);
    }
  };

  getPostById = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseIdParam(req);
      const post = this.postService.getById(id);

      sendSuccessResponse(res, post);
    } catch (error) {
      next(error);
    }
  };

  createPost = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = createPostSchema.safeParse(req.body);

      if (!result.success) {
        throw handleZodError(result.error);
      }

      const post = this.postService.create(result.data);
      sendSuccessResponse(res, post, RESPONSE_STATUS_CODE.CREATED);
    } catch (error) {
      next(error);
    }
  };

  updatePost = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseIdParam(req);

      const result = updatePostSchema.safeParse(req.body);

      if (!result.success) {
        throw handleZodError(result.error);
      }

      const post = this.postService.update(id, result.data);
      sendSuccessResponse(res, post);
    } catch (error) {
      next(error);
    }
  };

  deletePost = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseIdParam(req);
      this.postService.delete(id);

      sendSuccessResponse(res, null, RESPONSE_STATUS_CODE.NO_CONTENT);
    } catch (error) {
      next(error);
    }
  };
}
