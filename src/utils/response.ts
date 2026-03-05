// Constants
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';

// Types
import type { Response } from 'express';
import type { ApiErrorResponse, ApiSuccessResponse } from '../types/api.js';

/**
 * Sends a successful response to the client.
 * @param {Response} res - The Express.js response object.
 * @param {T} data - The data to be sent in the response body.
 * @param {number} [statusCode=RESPONSE_STATUS_CODE.OK] - The HTTP status code to be sent.
 */
export function sendSuccessResponse<T>(
  res: Response,
  data: T,
  statusCode = RESPONSE_STATUS_CODE.OK
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data
  };
  res.status(statusCode).json(response);
}

/**
 * Sends an error response to the client.
 * @param {Response} res - The Express.js response object.
 * @param {string} message - The error message to be sent in the response body.
 * @param {number} [statusCode=RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR] - The HTTP status code to be sent.
 * @param {Record<string, string[]>} [errors] - Optional record of error messages associated with specific fields.
 */
export function sendErrorResponse(
  res: Response,
  message: string,
  statusCode = RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR,
  errors?: Record<string, string[]>
): void {
  const response: ApiErrorResponse = {
    success: false,
    status: 'error',
    message,
    ...(errors && { errors })
  };
  res.status(statusCode).json(response);
}
