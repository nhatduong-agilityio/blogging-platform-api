import z from 'zod';

export const createPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title must be at most 255 characters long'),
  content: z.string().trim().min(1, 'Content is required'),
  category: z.string().trim().min(1, 'Category is required'),
  tags: z
    .array(z.string().trim().min(1, 'Tag cannot be empty'))
    .min(1, 'At least one tag is required')
});

export const updatePostSchema = createPostSchema;

export const postIdSchema = z.object({
  id: z.coerce
    .number()
    .int({ message: 'ID must be an integer' })
    .positive({ message: 'ID must be a positive number' })
});

export const searchQuerySchema = z.object({
  term: z.string().optional()
});

export type CreatePostSchema = z.infer<typeof createPostSchema>;
export type UpdatePostSchema = z.infer<typeof updatePostSchema>;
