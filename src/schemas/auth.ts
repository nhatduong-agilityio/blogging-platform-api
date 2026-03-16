import z from 'zod';
import { ROLE } from '../constants/user.js';

/**
 * Register Schema
 */
export const registerSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be at most 100 characters'),
  role: z.enum(ROLE).default(ROLE.USER)
});

/**
 * Login Schema
 */
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'Password is required')
});

/**
 * Refresh Token Schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1, 'Refresh token is required')
});

/**
 * Auth Types
 */
export type LoginSchema = z.infer<typeof loginSchema>;
export type RefreshTokenSchema = z.infer<typeof refreshTokenSchema>;
export type CreateUserSchema = z.infer<typeof registerSchema>;
export type UpdateUserSchema = z.infer<typeof registerSchema>;
