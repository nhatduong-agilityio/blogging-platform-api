import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { ROLE } from '../../constants/user.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import { RESPONSE_STATUS_CODE } from '../../constants/status-code.js';
import type { JwtPayload } from '../../types/auth.js';

jest.unstable_mockModule('passport', () => ({
  default: {
    authenticate: jest.fn()
  }
}));

const { default: passport } = await import('passport');
const { authMiddleware, authorizeMiddleware } =
  await import('../../middlewares/auth.js');

function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    user: undefined,
    ...overrides
  } as unknown as Request;
}

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

// passport.authenticate(strategy, options, callback) returns a
// RequestHandler. We mock it so the inner callback fires immediately
// with the (err, user) values we control per test.

function setupPassportMock(err: unknown, user: JwtPayload | false): void {
  (passport.authenticate as jest.Mock).mockImplementation(
    (...args: unknown[]) => {
      const callback = args[2] as (
        err: unknown,
        user: JwtPayload | false
      ) => void;
      return (_req: Request, _res: Response, _next: NextFunction) => {
        callback(err, user);
      };
    }
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('authMiddleware', () => {
  const mockUser: JwtPayload = {
    userId: 1,
    email: 'test@example.com',
    role: ROLE.USER
  };

  it('should set req.user and call next when token is valid', () => {
    setupPassportMock(null, mockUser);
    const req = mockRequest();
    const res = mockResponse();

    authMiddleware(req, res, mockNext);

    expect(req.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalledWith(); // next() with no args
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 when user is false (invalid/missing token)', () => {
    setupPassportMock(null, false);
    const req = mockRequest();
    const res = mockResponse();

    authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(RESPONSE_STATUS_CODE.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next(err) when passport returns an error', () => {
    const error = new Error('JWT strategy failure');
    setupPassportMock(error, false);
    const req = mockRequest();
    const res = mockResponse();

    authMiddleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('authorizeMiddleware', () => {
  const adminUser: JwtPayload = {
    userId: 1,
    email: 'admin@example.com',
    role: ROLE.ADMIN
  };

  const regularUser: JwtPayload = {
    userId: 2,
    email: 'user@example.com',
    role: ROLE.USER
  };

  it('should call next when user has the required role', () => {
    const req = mockRequest({ user: adminUser });
    const res = mockResponse();

    authorizeMiddleware(ROLE.ADMIN)(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should call next when user matches one of multiple allowed roles', () => {
    const req = mockRequest({ user: regularUser });
    const res = mockResponse();

    authorizeMiddleware(ROLE.ADMIN, ROLE.USER)(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should return 403 when user role is not in the allowed list', () => {
    const req = mockRequest({ user: regularUser });
    const res = mockResponse();

    authorizeMiddleware(ROLE.ADMIN)(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(RESPONSE_STATUS_CODE.FORBIDDEN);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when req.user is missing', () => {
    const req = mockRequest({ user: undefined });
    const res = mockResponse();

    authorizeMiddleware(ROLE.ADMIN)(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(RESPONSE_STATUS_CODE.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
});
