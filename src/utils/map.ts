import type { Post, PostRow } from '../types/post.js';

/**
 * Maps a PostRow object from the database to a Post object.
 * @param {PostRow} postRow - The PostRow object from the database.
 * @returns {Post} - The Post object.
 */
export function mapPostRowToPost(postRow: PostRow): Post {
  return {
    id: postRow.id,
    title: postRow.title,
    content: postRow.content,
    category: postRow.category,
    tags: JSON.parse(postRow.tags) as string[],
    createdAt: postRow.created_at,
    updatedAt: postRow.updated_at
  };
}
