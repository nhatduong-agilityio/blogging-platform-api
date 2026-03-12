import type { CreateUserSchema, UpdateUserSchema } from '../schemas/auth.js';
import type { IRepository } from './common.js';

export interface JwtPayload {
  userId: number;
  email: string;
}

export interface User {
  id: number;
  email: string;
}

export type IUserRepository = IRepository<
  User,
  CreateUserSchema,
  UpdateUserSchema
>;
