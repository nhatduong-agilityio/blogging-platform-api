import type { NextFunction, Request, Response } from 'express';

// Constants
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';
import { ERROR_MESSAGES } from '../constants/messages.js';

// Utils
import { sendSuccessResponse } from '../utils/response.js';
import {
  createPostSchema,
  postIdSchema,
  searchQuerySchema,
  updatePostSchema
} from '../utils/validators.js';
import { handleZodError } from '../utils/zod.js';
import { AppError } from '../utils/app-error.js';

// Services
import * as postService from '../services/post.js';

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
    const result = createPostSchema.safeParse(req.body);

    if (!result.success) {
      throw handleZodError(result.error);
    }

    const post = postService.createPost(result.data);
    sendSuccessResponse(res, post, RESPONSE_STATUS_CODE.CREATED);
  } catch (error) {
    next(error);
  }
}

/**
 * Finds all posts that match the given term in title, content, or category.
 * If no term is given, returns all posts.
 * @param {Request} req - The Express.js request object.
 * @param {Response} res - The Express.js response object.
 * @param {NextFunction} next - The Express.js next function, which is called if an error occurs.
 * @throws {Error} If the posts cannot be found.
 */
export function getAllPosts(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const queryResult = searchQuerySchema.safeParse(req.query);
    const term = queryResult.success ? queryResult.data.term : undefined;

    const posts = postService.getAllPosts(term);
    sendSuccessResponse(res, posts);
  } catch (error) {
    next(error);
  }
}

/**
 * Finds a post by its ID and returns it if found, or throws an AppError with status code NOT_FOUND if not.
 * @param {Request} req - The Express.js request object.
 * @param {Response} res - The Express.js response object.
 * @param {NextFunction} next - The Express.js next function, which is called if an error occurs.
 * @throws {AppError} If the post cannot be found.
 */

export function getPostById(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const id = parseIdParam(req);
    const post = postService.getPostById(id);

    sendSuccessResponse(res, post);
  } catch (error) {
    next(error);
  }
}

/**
 * Updates a post by its ID with the given payload and returns the updated post.
 * If no post with the given ID exists, throws an AppError with status code NOT_FOUND.
 * If the update is successful, returns the updated post.
 * If the update fails (e.g. due to a database error), throws an AppError with status code INTERNAL_SERVER_ERROR.
 * @param {Request} req - The Express.js request object.
 * @param {Response} res - The Express.js response object.
 * @param {NextFunction} next - The Express.js next function, which is called if an error occurs.
 * @throws {AppError} If the post cannot be found or updated.
 */
export function updatePost(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const id = parseIdParam(req);

    const result = updatePostSchema.safeParse(req.body);

    if (!result.success) {
      throw handleZodError(result.error);
    }

    const post = postService.updatePost(id, result.data);
    sendSuccessResponse(res, post);
  } catch (error) {
    next(error);
  }
}

/**
 * Deletes a post by its ID.
 * @param {Request} req - The Express.js request object.
 * @param {Response} res - The Express.js response object.
 * @param {NextFunction} next - The Express.js next function, which is called if an error occurs.
 * @throws {AppError} If the post cannot be found.
 */
export function deletePost(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const id = parseIdParam(req);
    postService.deletePost(id);

    sendSuccessResponse(res, null, RESPONSE_STATUS_CODE.NO_CONTENT);
  } catch (error) {
    next(error);
  }
}
