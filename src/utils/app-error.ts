// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string[]>;

  /**
   * Constructor for AppError.
   * @param {string} message - The error message.
   * @param {number} statusCode - The HTTP status code associated with the error.
   * @param {Record<string, string[]>} [errors] - Optional record of error messages associated with specific fields.
   */
  constructor(
    message: string,
    statusCode: number,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors ?? {};

    // Create a stack trace for the error object to help with debugging
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Returns an AppError with the NOT_FOUND status code and a default error message of "Resource not found".
   * @param {string} [message] - Optional error message. Defaults to "Resource not found".
   * @returns {AppError}
   */
  static notFound(message: string = ERROR_MESSAGES.NOT_FOUND()): AppError {
    return new AppError(message, RESPONSE_STATUS_CODE.NOT_FOUND);
  }

  /**
   * Returns an AppError with the BAD_REQUEST status code and a default error message of "Bad request".
   * @param {string} [message] - Optional error message. Defaults to "Bad request".
   * @param {Record<string, string[]>} [errors] - Optional record of error messages associated with specific fields.
   * @returns {AppError}
   */
  static badRequest(
    message: string = ERROR_MESSAGES.BAD_REQUEST,
    errors?: Record<string, string[]>
  ): AppError {
    return new AppError(message, RESPONSE_STATUS_CODE.BAD_REQUEST, errors);
  }

  /**
   * Returns an AppError with the INTERNAL_SERVER_ERROR status code and a default error message of "Internal server error".
   * @param {string} [message] - Optional error message. Defaults to "Internal server error".
   * @returns {AppError}
   */
  static internalServerError(
    message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR
  ): AppError {
    return new AppError(message, RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR);
  }
}
