import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { PostController } from '../../controllers/post.js';
import { AppError } from '../../utils/app-error.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import type { IPostService, Post } from '../../types/post.js';

function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    ...overrides
  } as unknown as Request;
}

/**
 * Mock Response with proper chaining (res.status().json())
 */
export type MockResponse = {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
  end: jest.Mock;
};

export const mockResponse = (): MockResponse & Response => {
  const res: Partial<MockResponse> = {};

  res.status = jest.fn().mockImplementation(() => res);
  res.json = jest.fn().mockImplementation(() => res);
  res.send = jest.fn().mockImplementation(() => res);
  res.end = jest.fn().mockImplementation(() => res);

  return res as MockResponse & Response;
};

const mockNext: NextFunction = jest.fn() as unknown as NextFunction;

const mockPost: Post = {
  id: 1,
  title: 'Test Post',
  content: 'Test content',
  category: 'tech',
  tags: ['jest'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

const validBody = {
  title: 'Test Post',
  content: 'Test content',
  category: 'tech',
  tags: ['jest']
};

const mockGetAll = jest.fn<(term?: string) => Promise<Post[]>>();
const mockGetById = jest.fn<(id: number) => Promise<Post>>();
const mockCreate = jest.fn<(body: typeof validBody) => Promise<Post>>();
const mockUpdate =
  jest.fn<(id: number, body: typeof validBody) => Promise<Post>>();
const mockDelete = jest.fn<(id: number) => Promise<void>>();

const mockPostService: IPostService = {
  getAll: mockGetAll,
  getById: mockGetById,
  create: mockCreate,
  update: mockUpdate,
  delete: mockDelete
};

let controller: PostController;

beforeEach(() => {
  controller = new PostController(mockPostService);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('PostController', () => {
  describe('getAllPosts', () => {
    it('should return 200 with all posts', async () => {
      mockGetAll.mockResolvedValue([mockPost]);
      const req = mockRequest({ query: {} });
      const res = mockResponse();

      await controller.getAllPosts(req, res, mockNext);

      expect(mockGetAll).toHaveBeenCalledWith(undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [mockPost]
      });
    });

    it('should pass term query param to service', async () => {
      mockGetAll.mockResolvedValue([mockPost]);
      const req = mockRequest({ query: { term: 'jest' } });
      const res = mockResponse();

      await controller.getAllPosts(req, res, mockNext);

      expect(mockGetAll).toHaveBeenCalledWith('jest');
    });

    it('should call next with error when service throws', async () => {
      const error = AppError.internalServerError('DB error');
      mockGetAll.mockRejectedValue(error);

      await controller.getAllPosts(mockRequest(), mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getPostById', () => {
    it('should return 200 with a single post', async () => {
      mockGetById.mockResolvedValue(mockPost);
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();

      await controller.getPostById(req, res, mockNext);

      expect(mockGetById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockPost });
    });

    it('should call next with 400 for invalid id', async () => {
      await controller.getPostById(
        mockRequest({ params: { id: 'abc' } }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(mockGetById).not.toHaveBeenCalled();
    });

    it('should call next when service throws 404', async () => {
      const error = AppError.notFound(ERROR_MESSAGES.NOT_FOUND('Post'));
      mockGetById.mockRejectedValue(error);

      await controller.getPostById(
        mockRequest({ params: { id: '999' } }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createPost', () => {
    it('should return 201 with the created post', async () => {
      mockCreate.mockResolvedValue(mockPost);
      const req = mockRequest({ body: validBody });
      const res = mockResponse();

      await controller.createPost(req, res, mockNext);

      expect(mockCreate).toHaveBeenCalledWith(validBody);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockPost });
    });

    it('should call next with 400 for invalid body', async () => {
      await controller.createPost(
        mockRequest({ body: { title: '' } }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should call next when service throws', async () => {
      mockCreate.mockRejectedValue(AppError.internalServerError('DB error'));

      await controller.createPost(
        mockRequest({ body: validBody }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 500 })
      );
    });
  });

  describe('updatePost', () => {
    it('should return 200 with the updated post', async () => {
      const updated = { ...mockPost, title: 'Updated' };
      mockUpdate.mockResolvedValue(updated);
      const req = mockRequest({
        params: { id: '1' },
        body: { ...validBody, title: 'Updated' }
      });
      const res = mockResponse();

      await controller.updatePost(req, res, mockNext);

      expect(mockUpdate).toHaveBeenCalledWith(1, {
        ...validBody,
        title: 'Updated'
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next with 400 for invalid id', async () => {
      await controller.updatePost(
        mockRequest({ params: { id: 'abc' }, body: validBody }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should call next with 400 for invalid body', async () => {
      await controller.updatePost(
        mockRequest({ params: { id: '1' }, body: { title: '' } }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should call next when service throws 404', async () => {
      mockUpdate.mockRejectedValue(
        AppError.notFound(ERROR_MESSAGES.NOT_FOUND('Post'))
      );

      await controller.updatePost(
        mockRequest({ params: { id: '999' }, body: validBody }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 })
      );
    });
  });

  describe('deletePost', () => {
    it('should return 204 with null data', async () => {
      mockDelete.mockResolvedValue(undefined);
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();

      await controller.deletePost(req, res, mockNext);

      expect(mockDelete).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: null });
    });

    it('should call next with 400 for invalid id', async () => {
      await controller.deletePost(
        mockRequest({ params: { id: 'abc' } }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should call next when service throws 404', async () => {
      mockDelete.mockRejectedValue(
        AppError.notFound(ERROR_MESSAGES.NOT_FOUND('Post'))
      );

      await controller.deletePost(
        mockRequest({ params: { id: '999' } }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 })
      );
    });
  });
});
