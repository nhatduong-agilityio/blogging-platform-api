import type { Repository } from 'typeorm';
import type { UserEntity } from '../entity/user.js';
import type { CreateUserSchema, UpdateUserSchema } from '../schemas/auth.js';
import { BaseRepository } from './base.js';
import type { IUserRepository, User } from '../types/auth.js';

export class UserRepository
  extends BaseRepository<UserEntity, User, CreateUserSchema, UpdateUserSchema>
  implements IUserRepository
{
  constructor(repo: Repository<UserEntity>) {
    super(repo);
  }

  protected override toDomain(entity: UserEntity): User {
    return {
      id: entity.id,
      email: entity.email
    };
  }

  override async findAll(): Promise<User[]> {
    console.info('Feature not implemented yet.');
    return Promise.resolve([]);
  }

  override async create(data: CreateUserSchema): Promise<User> {
    const user = this.repo.create(data);

    const saved = await this.repo.save(user);

    return this.toDomain(saved);
  }

  override update(): Promise<User | undefined> {
    console.info('Feature not implemented yet.');
    return Promise.resolve(undefined);
  }

  async findByEmailWithSensitiveData(
    email: string
  ): Promise<UserEntity | undefined> {
    const user = await this.repo.findOne({ where: { email } });
    return user ? user : undefined;
  }

  async findByIdWithSensitiveData(id: number): Promise<UserEntity | undefined> {
    const user = await this.repo.findOne({ where: { id } });
    return user ? user : undefined;
  }

  async saveRefreshToken(userId: number, token: string): Promise<void> {
    await this.repo.update(userId, { refreshToken: token });
  }

  async removeRefreshToken(userId: number): Promise<void> {
    await this.repo.update(userId, { refreshToken: null });
  }
}
