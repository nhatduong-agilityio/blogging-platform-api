import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../controllers/auth.js';
import { AppError } from '../../utils/app-error.js';
import { ROLE } from '../../constants/user.js';
import type { AuthService } from '../../services/auth.js';
import type { User } from '../../types/auth.js';

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

const mockNext: NextFunction = jest.fn() as unknown as NextFunction;

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  role: ROLE.USER
};

const mockTokens = {
  accessToken: 'mock_access_token',
  refreshToken: 'mock_refresh_token'
};

const mockRegister = jest.fn<({ email }: { email: string }) => Promise<User>>();
const mockLogin =
  jest.fn<(email: string, password: string) => Promise<typeof mockTokens>>();
const mockRefresh =
  jest.fn<(refreshToken: string) => Promise<{ accessToken: string }>>();
const mockLogout = jest.fn<(id: number) => Promise<void>>();

const mockAuthService = {
  register: mockRegister,
  login: mockLogin,
  refresh: mockRefresh,
  logout: mockLogout
} as unknown as AuthService;

let controller: AuthController;

beforeEach(() => {
  controller = new AuthController(mockAuthService);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('AuthController', () => {
  describe('register', () => {
    const validBody = { email: 'test@example.com', password: 'password123' };

    it('should return 201 with the registered user', async () => {
      mockRegister.mockResolvedValue(mockUser);
      const req = mockRequest({ body: validBody });
      const res = mockResponse();

      await controller.register(req, res, mockNext);

      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({ email: validBody.email })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockUser });
    });

    it('should call next with 400 for invalid email', async () => {
      await controller.register(
        mockRequest({ body: { email: 'not-email', password: 'password123' } }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should call next with 400 for short password', async () => {
      await controller.register(
        mockRequest({ body: { email: 'test@example.com', password: '123' } }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should call next when service throws duplicate email error', async () => {
      mockRegister.mockRejectedValue(
        AppError.badRequest('Email already exists')
      );

      await controller.register(
        mockRequest({ body: validBody }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Email already exists'
        })
      );
    });
  });

  describe('login', () => {
    const validBody = { email: 'test@example.com', password: 'password123' };

    it('should return 200 with access and refresh tokens', async () => {
      mockLogin.mockResolvedValue(mockTokens);
      const req = mockRequest({ body: validBody });
      const res = mockResponse();

      await controller.login(req, res, mockNext);

      expect(mockLogin).toHaveBeenCalledWith(
        validBody.email,
        validBody.password
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTokens
      });
    });

    it('should call next with 400 for missing email', async () => {
      await controller.login(
        mockRequest({ body: { password: 'password123' } }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should call next when service throws invalid credentials', async () => {
      mockLogin.mockRejectedValue(AppError.badRequest('Invalid credentials'));

      await controller.login(
        mockRequest({ body: validBody }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Invalid credentials'
        })
      );
    });
  });

  describe('refresh', () => {
    const validBody = { refreshToken: 'valid_refresh_token' };

    it('should return 200 with a new access token', async () => {
      mockRefresh.mockResolvedValue({ accessToken: 'new_access_token' });
      const req = mockRequest({ body: validBody });
      const res = mockResponse();

      await controller.refresh(req, res, mockNext);

      expect(mockRefresh).toHaveBeenCalledWith(validBody.refreshToken);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { accessToken: 'new_access_token' }
      });
    });

    it('should call next with 400 when refreshToken is missing', async () => {
      await controller.refresh(
        mockRequest({ body: {} }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('should call next when service throws invalid token error', async () => {
      mockRefresh.mockRejectedValue(
        AppError.badRequest('Invalid refresh token')
      );

      await controller.refresh(
        mockRequest({ body: validBody }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Invalid refresh token'
        })
      );
    });
  });

  describe('logout', () => {
    it('should return 204 when user is authenticated', async () => {
      mockLogout.mockResolvedValue(undefined);
      const req = mockRequest({
        user: { userId: 1, email: 'test@example.com', role: ROLE.USER }
      });
      const res = mockResponse();

      await controller.logout(req, res, mockNext);

      expect(mockLogout).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('should call next with 404 when req.user is missing', async () => {
      await controller.logout(
        mockRequest({ user: undefined }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 })
      );
      expect(mockLogout).not.toHaveBeenCalled();
    });

    it('should call next when service throws', async () => {
      mockLogout.mockRejectedValue(AppError.internalServerError('DB error'));

      await controller.logout(
        mockRequest({
          user: { userId: 1, email: 'test@example.com', role: ROLE.USER }
        }),
        mockResponse(),
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 500 })
      );
    });
  });
});
