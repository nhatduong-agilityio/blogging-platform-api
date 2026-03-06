import type { CreatePostSchema, UpdatePostSchema } from '../schemas/post.js';
import type { IRepository, IService } from './common.js';

export interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PostRow extends Omit<
  Post,
  'createdAt' | 'updatedAt' | 'tags'
> {
  tags: string;
  created_at: string;
  updated_at: string;
}

export type IPostRepository = IRepository<
  Post,
  CreatePostSchema,
  UpdatePostSchema
>;

export type IPostService = IService<Post, CreatePostSchema, UpdatePostSchema>;
