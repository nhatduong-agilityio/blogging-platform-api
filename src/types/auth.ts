import type { ROLE } from '../constants/user.js';
import type { CreateUserSchema, UpdateUserSchema } from '../schemas/auth.js';
import type { IRepository } from './common.js';

export type UserRole = ROLE;

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
}

export type IUserRepository = IRepository<
  User,
  CreateUserSchema,
  UpdateUserSchema
>;
