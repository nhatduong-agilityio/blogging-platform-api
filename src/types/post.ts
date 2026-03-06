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

export interface CreatePostInput {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export type UpdatePostInput = CreatePostInput;
