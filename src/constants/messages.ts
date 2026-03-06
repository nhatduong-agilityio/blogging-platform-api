export const ERROR_MESSAGES = {
  NOT_FOUND: (resourceName: string = 'Resource'): string =>
    `${resourceName} not found`,
  BAD_REQUEST: 'Invalid request body',
  FORBIDDEN: 'Insufficient permissions to access this resource',
  INTERNAL_SERVER_ERROR: 'Internal server error',

  // Post related messages
  POST_CREATION_FAILED: 'Failed to create post',
  POST_NOT_FOUND: 'Post not found',
  INVALID_POST_ID: 'Invalid post ID',
  POST_UPDATE_FAILED: 'Failed to update post'
};
