import bcrypt from 'bcryptjs';

import type { UserRepository } from '../repositories/user.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/jwt.js';

import { AppError } from '../utils/app-error.js';
import type { User } from '../types/auth.js';

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async register(email: string, password: string): Promise<User> {
    const existing = await this.userRepo.findByEmailWithSensitiveData(email);

    if (existing) {
      throw AppError.badRequest('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userRepo.create({
      email,
      password: hashedPassword
    });

    return {
      id: user.id,
      email
    };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findByEmailWithSensitiveData(email);

    if (!user) {
      throw AppError.badRequest('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw AppError.badRequest('Invalid credentials');
    }

    const payload = {
      userId: user.id,
      email: user.email
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await this.userRepo.saveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const payload = verifyRefreshToken(refreshToken);

    const user = await this.userRepo.findByIdWithSensitiveData(payload.userId);

    if (!user || user.refreshToken !== refreshToken) {
      throw AppError.badRequest('Invalid refresh token');
    }

    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email
    });

    return { accessToken: newAccessToken };
  }

  async logout(userId: number): Promise<void> {
    await this.userRepo.removeRefreshToken(userId);
  }
}
