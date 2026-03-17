import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import type { UserRepository } from '../../../repositories/user.js';
import { ROLE } from '../../../constants/user.js';
import type { CreateUserSchema } from '../../../schemas/auth.js';
import type { UserEntity } from '../../../entity/user.js';

// Register mocks BEFORE importing the modules that use them
// jest.unstable_mockModule replaces the module for all subsequent imports.

class MockJsonWebTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JsonWebTokenError';
  }
}

class MockTokenExpiredError extends MockJsonWebTokenError {
  expiredAt: Date;
  constructor(message: string, expiredAt: Date) {
    super(message);
    this.name = 'TokenExpiredError';
    this.expiredAt = expiredAt;
  }
}

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    hash: jest.fn<() => Promise<string>>().mockResolvedValue('hashed_password'),
    compare: jest.fn<() => Promise<boolean>>()
  }
}));

jest.unstable_mockModule('../../../utils/jwt.js', () => ({
  generateAccessToken: jest
    .fn<() => string>()
    .mockReturnValue('mock_access_token'),
  generateRefreshToken: jest
    .fn<() => string>()
    .mockReturnValue('mock_refresh_token'),
  verifyRefreshToken: jest.fn<() => object>()
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    JsonWebTokenError: MockJsonWebTokenError,
    TokenExpiredError: MockTokenExpiredError,
    // sign/verify not needed — AuthService uses jwt utils wrappers
    sign: jest.fn(),
    verify: jest.fn()
  }
}));

// Dynamically import AFTER mocks are registered
const { default: bcrypt } = await import('bcryptjs');
const jwtUtils = await import('../../../utils/jwt.js');
const { AuthService } = await import('../../auth.js');

// Fixtures

const mockUserEntity = {
  id: 1,
  email: 'test@example.com',
  password: 'hashed_password',
  role: ROLE.USER,
  refreshToken: null
} as unknown as UserEntity;

const mockUser = {
  id: 1,
  email: 'test@example.com',
  role: ROLE.USER
};

// Mock Repository

const mockFindByEmail =
  jest.fn<() => Promise<typeof mockUserEntity | undefined>>();
const mockFindById =
  jest.fn<() => Promise<typeof mockUserEntity | undefined>>();
const mockCreate =
  jest.fn<
    ({ email, password, role }: CreateUserSchema) => Promise<typeof mockUser>
  >();
const mockSaveRefreshToken =
  jest.fn<(userId: number, token: string) => Promise<void>>();
const mockRemoveRefreshToken = jest.fn<(userId: number) => Promise<void>>();

const mockUserRepository = {
  findByEmailWithSensitiveData: mockFindByEmail,
  findByIdWithSensitiveData: mockFindById,
  create: mockCreate,
  saveRefreshToken: mockSaveRefreshToken,
  removeRefreshToken: mockRemoveRefreshToken
} as unknown as UserRepository;

//  Setup

let authService: InstanceType<typeof AuthService>;

beforeEach(() => {
  authService = new AuthService(mockUserRepository);
});

afterEach(() => {
  jest.clearAllMocks();
});

//  Tests

describe('AuthService', () => {
  //  register

  describe('register', () => {
    it('should register a new user and return User (no password)', async () => {
      mockFindByEmail.mockResolvedValue(undefined);
      mockCreate.mockResolvedValue(mockUser);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        role: ROLE.USER
      });

      expect(result).toEqual(mockUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockCreate).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashed_password',
        role: ROLE.USER
      });
    });

    it('should throw 400 when email already exists', async () => {
      mockFindByEmail.mockResolvedValue(mockUserEntity);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          role: ROLE.USER
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Email already exists'
      });

      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  //  login

  describe('login', () => {
    it('should return access and refresh tokens on valid credentials', async () => {
      mockFindByEmail.mockResolvedValue(mockUserEntity);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);
      mockSaveRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toEqual({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token'
      });
      expect(jwtUtils.generateAccessToken).toHaveBeenCalledWith({
        userId: mockUserEntity.id,
        email: mockUserEntity.email,
        role: mockUserEntity.role
      });
      expect(mockSaveRefreshToken).toHaveBeenCalledWith(
        1,
        'mock_refresh_token'
      );
    });

    it('should throw 400 when user not found', async () => {
      mockFindByEmail.mockResolvedValue(undefined);

      await expect(
        authService.login('unknown@example.com', 'password123')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid credentials'
      });
    });

    it('should throw 400 when password is wrong', async () => {
      mockFindByEmail.mockResolvedValue(mockUserEntity);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false as never);

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid credentials'
      });

      expect(mockSaveRefreshToken).not.toHaveBeenCalled();
    });
  });

  //  refresh

  describe('refresh', () => {
    it('should return a new access token for a valid refresh token', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: 1,
        email: 'test@example.com',
        role: ROLE.USER
      });
      mockFindById.mockResolvedValue({
        ...mockUserEntity,
        refreshToken: 'valid_refresh_token'
      });

      const result = await authService.refresh('valid_refresh_token');

      expect(result).toEqual({ accessToken: 'mock_access_token' });
    });

    it('should throw 400 when refresh token does not match DB', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: 1,
        email: 'test@example.com',
        role: ROLE.USER
      });
      mockFindById.mockResolvedValue({
        ...mockUserEntity,
        refreshToken: 'different_token_in_db'
      });

      await expect(
        authService.refresh('valid_refresh_token')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid refresh token'
      });
    });
  });

  //  logout

  describe('logout', () => {
    it('should remove refresh token from DB', async () => {
      mockRemoveRefreshToken.mockResolvedValue(undefined);

      await authService.logout(1);

      expect(mockRemoveRefreshToken).toHaveBeenCalledWith(1);
      expect(mockRemoveRefreshToken).toHaveBeenCalledTimes(1);
    });
  });
});
