import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Types
import type { UserRepository } from '../repositories/user.js';
import type { CreateUserSchema } from '../schemas/auth.js';
import type { User } from '../types/auth.js';

// Utils
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/jwt.js';
import { AppError } from '../utils/app-error.js';

export class AuthService {
  constructor(private readonly userRepo: UserRepository) {}

  async register({ email, password, role }: CreateUserSchema): Promise<User> {
    const existing = await this.userRepo.findByEmailWithSensitiveData(email);
    if (existing) throw AppError.badRequest('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    // All self-registered users get 'user' role by default.
    // Promote to 'admin' via DB seeder or admin tooling — never via API.
    const user = await this.userRepo.create({
      email,
      password: hashedPassword,
      role: role
    });

    return user;
  }

  async login(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findByEmailWithSensitiveData(email);
    if (!user) throw AppError.badRequest('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw AppError.badRequest('Invalid credentials');

    // Role included in payload — authorize() reads from req.user
    // without an extra DB query on every protected request.
    const payload = { userId: user.id, email: user.email, role: user.role };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await this.userRepo.saveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    // verifyRefreshToken throws JsonWebTokenError / TokenExpiredError
    // when the token is invalid or expired — convert to 400 AppError
    // so the error handler returns the correct status code.
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw AppError.badRequest('Refresh token has expired');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw AppError.badRequest('Invalid refresh token');
      }
      throw err; // unexpected error — let the global handler catch it as 500
    }

    const user = await this.userRepo.findByIdWithSensitiveData(payload.userId);
    if (!user || user.refreshToken !== refreshToken) {
      throw AppError.badRequest('Invalid refresh token');
    }

    // Re-read role from DB — picks up any role change since last login
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return { accessToken: newAccessToken };
  }

  async logout(userId: number): Promise<void> {
    await this.userRepo.removeRefreshToken(userId);
  }
}
