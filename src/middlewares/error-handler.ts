// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';

// Types
import type { Request, Response, NextFunction } from 'express';

// Utils
import { AppError } from '../utils/app-error.js';
import { sendErrorResponse } from '../utils/response.js';

/**
 * Global error handler middleware.
 *
 * If the error is an instance of AppError, it will be handled by sending a response with the error message, status code, and errors if any.
 * Otherwise, it will log the error to the console and send a response with a generic error message and a 500 status code.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendErrorResponse(res, err.message, err.statusCode, err.errors);
    return;
  }

  console.error('Unexpected error:', err);
  const message =
    process.env.NODE_ENV === 'development'
      ? err.message
      : ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  sendErrorResponse(res, message, RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR);
}

/**
 * Sends a 404 response to the client when a route is not found.
 *
 * In development mode, the response message will include the method and path of the request.
 * In production mode, the response message will be a generic "Resource not found" message.
 * This should be added after all other routes and middlewares to catch any requests that do not match existing routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  const message =
    process.env.NODE_ENV === 'development'
      ? `Route ${req.method} ${req.path} not found`
      : ERROR_MESSAGES.NOT_FOUND;

  sendErrorResponse(res, message, RESPONSE_STATUS_CODE.NOT_FOUND);
}
