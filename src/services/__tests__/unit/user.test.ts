import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { UserService } from '../../user.js';
import { ERROR_MESSAGES } from '../../../constants/messages.js';
import { ROLE } from '../../../constants/user.js';
import type { UserRepository } from '../../../repositories/user.js';
import type { User } from '../../../types/auth.js';

// UserService.getMe() returns the public User shape (no password).

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  role: ROLE.USER
};

// UserService only calls userRepo.findById() — only that method
// needs to be mocked.

const mockFindById = jest.fn<(id: number) => Promise<User | undefined>>();

const mockUserRepository = {
  findById: mockFindById
} as unknown as UserRepository;

let userService: UserService;

beforeEach(() => {
  userService = new UserService(mockUserRepository);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('UserService', () => {
  describe('getMe', () => {
    it('should return the user when found', async () => {
      mockFindById.mockResolvedValue(mockUser);

      const result = await userService.getMe(1);

      expect(result).toEqual(mockUser);
      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockFindById).toHaveBeenCalledTimes(1);
    });

    it('should throw 404 AppError when user not found', async () => {
      mockFindById.mockResolvedValue(undefined);

      await expect(userService.getMe(999)).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_MESSAGES.NOT_FOUND('User')
      });
    });

    it('should pass the correct userId to the repository', async () => {
      mockFindById.mockResolvedValue(mockUser);

      await userService.getMe(42);

      expect(mockFindById).toHaveBeenCalledWith(42);
    });

    it('should not expose password in the returned user', async () => {
      mockFindById.mockResolvedValue(mockUser);

      const result = await userService.getMe(1);

      expect(result).not.toHaveProperty('password');
    });
  });
});
