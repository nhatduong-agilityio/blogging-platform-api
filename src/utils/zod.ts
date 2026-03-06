// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';

// Types
import type { ZodError } from 'zod';

// Utils
import { AppError } from './app-error.js';

/**
 * Handles a ZodError by transforming it into an AppError.
 *
 * @param {ZodError} error - The ZodError to handle.
 * @returns {AppError} An AppError with the status code BAD_REQUEST and the error messages associated with each field.
 */
export function handleZodError(error: ZodError): AppError {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'general';
    errors[field] = [...(errors[field] ?? []), issue.message];
  }

  return AppError.badRequest(ERROR_MESSAGES.BAD_REQUEST, errors);
}
