import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { PostService } from '../../post.js';
import { ERROR_MESSAGES } from '../../../constants/messages.js';
import type { IPostRepository, Post } from '../../../types/post.js';
import type {
  CreatePostSchema,
  UpdatePostSchema
} from '../../../schemas/post.js';

const mockPost: Post = {
  id: 1,
  title: 'Test Post',
  content: 'Test content',
  category: 'tech',
  tags: ['jest', 'testing'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

const createInput: CreatePostSchema = {
  title: 'Test Post',
  content: 'Test content',
  category: 'tech',
  tags: ['jest', 'testing']
};

const updateInput: UpdatePostSchema = {
  title: 'Updated Post',
  content: 'Updated content',
  category: 'tech',
  tags: ['jest', 'updated']
};

const mockFindAll = jest.fn<(term?: string) => Promise<Post[]>>();
const mockFindById = jest.fn<(id: number) => Promise<Post | undefined>>();
const mockCreate = jest.fn<(input: CreatePostSchema) => Promise<Post>>();
const mockUpdate =
  jest.fn<(id: number, input: UpdatePostSchema) => Promise<Post | undefined>>();
const mockDelete = jest.fn<(id: number) => Promise<boolean>>();

const mockPostRepository: IPostRepository = {
  findAll: mockFindAll,
  findById: mockFindById,
  create: mockCreate,
  update: mockUpdate,
  delete: mockDelete
};

let postService: PostService;

beforeEach(() => {
  postService = new PostService(mockPostRepository);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('PostService', () => {
  describe('getAll', () => {
    it('should return all posts', async () => {
      mockFindAll.mockResolvedValue([mockPost]);

      const result = await postService.getAll();

      expect(result).toEqual([mockPost]);
      expect(mockFindAll).toHaveBeenCalledWith(undefined);
      expect(mockFindAll).toHaveBeenCalledTimes(1);
    });

    it('should pass search term to repository', async () => {
      mockFindAll.mockResolvedValue([mockPost]);

      await postService.getAll('jest');

      expect(mockFindAll).toHaveBeenCalledWith('jest');
    });

    it('should return empty array when no posts exist', async () => {
      mockFindAll.mockResolvedValue([]);

      const result = await postService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return post when found', async () => {
      mockFindById.mockResolvedValue(mockPost);

      const result = await postService.getById(1);

      expect(result).toEqual(mockPost);
      expect(mockFindById).toHaveBeenCalledWith(1);
    });

    it('should throw 404 AppError when post not found', async () => {
      mockFindById.mockResolvedValue(undefined);

      await expect(postService.getById(999)).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_MESSAGES.NOT_FOUND('Post')
      });
    });
  });

  describe('create', () => {
    it('should create and return a new post', async () => {
      mockCreate.mockResolvedValue(mockPost);

      const result = await postService.create(createInput);

      expect(result).toEqual(mockPost);
      expect(mockCreate).toHaveBeenCalledWith(createInput);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update and return the post', async () => {
      const updatedPost: Post = { ...mockPost, ...updateInput };
      mockFindById.mockResolvedValue(mockPost);
      mockUpdate.mockResolvedValue(updatedPost);

      const result = await postService.update(1, updateInput);

      expect(result).toEqual(updatedPost);
      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockUpdate).toHaveBeenCalledWith(1, updateInput);
    });

    it('should throw 404 when post does not exist', async () => {
      mockFindById.mockResolvedValue(undefined);

      await expect(postService.update(999, updateInput)).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_MESSAGES.NOT_FOUND('Post')
      });

      // update should never reach the repository
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should throw 500 when repository update returns undefined', async () => {
      mockFindById.mockResolvedValue(mockPost);
      mockUpdate.mockResolvedValue(undefined);

      await expect(postService.update(1, updateInput)).rejects.toMatchObject({
        statusCode: 500
      });
    });
  });

  describe('delete', () => {
    it('should delete post successfully', async () => {
      mockDelete.mockResolvedValue(true);

      await expect(postService.delete(1)).resolves.toBeUndefined();
      expect(mockDelete).toHaveBeenCalledWith(1);
    });

    it('should throw 404 when post does not exist', async () => {
      mockDelete.mockResolvedValue(false);

      await expect(postService.delete(999)).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_MESSAGES.NOT_FOUND('Post')
      });
    });
  });
});
