// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';
import { RESPONSE_STATUS_CODE } from '../constants/status-code.js';

// Types
import type { CreatePostInput } from '../types/post.js';

// Utils
import { AppError } from './app-error.js';

/**
 * Validates the input for creating a post.
 * @throws {AppError} If the input is invalid.
 * @returns {CreatePostInput} The validated and normalized input.
 */
export function validateCreatePostInput(body: unknown): CreatePostInput {
  if (!body || typeof body !== 'object') {
    throw new AppError(
      ERROR_MESSAGES.BAD_REQUEST,
      RESPONSE_STATUS_CODE.BAD_REQUEST
    );
  }

  const { title, content, category, tags } = body as Record<string, unknown>;

  const errors: Record<string, string[]> = {};

  // validate and normalize title, content, category, and tags
  let normalizedTitle: string | undefined;
  if (typeof title === 'string') {
    normalizedTitle = title.trim();
    if (normalizedTitle.length === 0) {
      errors.title = ['Title cannot be empty'];
    }
  } else {
    errors.title = ['Title is required and must be a string'];
  }

  let normalizedContent: string | undefined;
  if (typeof content === 'string') {
    normalizedContent = content.trim();
    if (normalizedContent.length === 0) {
      errors.content = ['Content cannot be empty'];
    }
  } else {
    errors.content = ['Content is required and must be a string'];
  }

  let normalizedCategory: string | undefined;
  if (typeof category === 'string') {
    normalizedCategory = category.trim();
    if (normalizedCategory.length === 0) {
      errors.category = ['Category cannot be empty'];
    }
  } else {
    errors.category = ['Category is required and must be a string'];
  }

  let normalizedTags: string[] | undefined;
  if (Array.isArray(tags)) {
    const cleaned = tags
      .filter(tag => typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    if (cleaned.length === 0) {
      errors.tags = ['Tags must contain at least one valid string'];
    } else {
      // remove duplicates
      normalizedTags = [...new Set(cleaned)];
    }
  } else {
    errors.tags = ['Tags must be an array of strings'];
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError(
      'Validation failed',
      RESPONSE_STATUS_CODE.BAD_REQUEST,
      errors
    );
  }

  return {
    title: normalizedTitle!,
    content: normalizedContent!,
    category: normalizedCategory!,
    tags: normalizedTags!
  };
}
