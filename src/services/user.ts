// Constants
import { ERROR_MESSAGES } from '../constants/messages.js';

// Types
import type { UserRepository } from '../repositories/user.js';
import type { User } from '../types/auth.js';

// Utils
import { AppError } from '../utils/app-error.js';

export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async getMe(userId: number): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw AppError.notFound(ERROR_MESSAGES.NOT_FOUND('User'));

    return user;
  }
}
