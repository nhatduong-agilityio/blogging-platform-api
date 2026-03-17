import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { UserController } from '../../controllers/user.js';
import { AppError } from '../../utils/app-error.js';
import { ROLE } from '../../constants/user.js';
import type { UserService } from '../../services/user.js';
import type { User } from '../../types/auth.js';

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  role: ROLE.USER
};

function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    user: undefined,
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

const mockNext = jest.fn() as unknown as NextFunction;

const mockGetMe = jest.fn<(id: number) => Promise<User>>();

const mockUserService = {
  getMe: mockGetMe
} as unknown as UserService;

let controller: UserController;

beforeEach(() => {
  controller = new UserController(mockUserService);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('UserController', () => {
  describe('getMe', () => {
    it('should return 200 with the current user profile', async () => {
      mockGetMe.mockResolvedValue(mockUser);
      const req = mockRequest({
        user: { userId: 1, email: 'test@example.com', role: ROLE.USER }
      });
      const res = mockResponse();

      await controller.getMe(req, res, mockNext);

      expect(mockGetMe).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockUser });
    });

    it('should call next with 404 when req.user is missing', async () => {
      const req = mockRequest({ user: undefined });
      const res = mockResponse();

      await controller.getMe(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 })
      );
      expect(mockGetMe).not.toHaveBeenCalled();
    });

    it('should use userId from req.user to call service', async () => {
      mockGetMe.mockResolvedValue(mockUser);
      const req = mockRequest({
        user: { userId: 42, email: 'other@example.com', role: ROLE.ADMIN }
      });
      const res = mockResponse();

      await controller.getMe(req, res, mockNext);

      expect(mockGetMe).toHaveBeenCalledWith(42);
    });

    it('should never expose password in response', async () => {
      mockGetMe.mockResolvedValue(mockUser);
      const req = mockRequest({
        user: { userId: 1, email: 'test@example.com', role: ROLE.USER }
      });
      const res = mockResponse();

      await controller.getMe(req, res, mockNext);

      const jsonCall = (res.json as jest.Mock).mock.calls[0] as [
        { success: boolean; data: User }
      ];
      expect(jsonCall[0].data).not.toHaveProperty('password');
    });

    it('should call next when service throws 404', async () => {
      const error = AppError.notFound('User not found');
      mockGetMe.mockRejectedValue(error);
      const req = mockRequest({
        user: { userId: 999, email: 'ghost@example.com', role: ROLE.USER }
      });
      const res = mockResponse();

      await controller.getMe(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
