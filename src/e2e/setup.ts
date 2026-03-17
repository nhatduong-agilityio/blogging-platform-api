//
// Creates a real Express app backed by an in-memory SQLite DB.
// No mocks — every layer (controller → service → repository → DB)
// runs exactly as it does in production, just with a fresh DB
// per test suite.
//
// Why in-memory SQLite instead of mocking?
//   E2E tests validate the full integration stack. If we mock the
//   DB we lose confidence that TypeORM entities, migrations, and
//   query logic actually work together.

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PostEntity } from '../../src/entity/post.js';
import { IdempotencyKeyEntity } from '../../src/entity/idempotency.js';
import { UserEntity } from '../../src/entity/user.js';
import { PostRepository } from '../../src/repositories/post.js';
import { UserRepository } from '../../src/repositories/user.js';
import { PostService } from '../../src/services/post.js';
import { AuthService } from '../../src/services/auth.js';
import { UserService } from '../../src/services/user.js';
import { PostController } from '../../src/controllers/post.js';
import { AuthController } from '../../src/controllers/auth.js';
import { UserController } from '../../src/controllers/user.js';
import { createPostRoutes } from '../../src/routes/post.js';
import { createAuthRoutes } from '../../src/routes/auth.js';
import { createUserRoutes } from '../../src/routes/user.js';
import { configurePassport } from '../../src/configs/passport.js';
import { createApp } from '../../src/app.js';
import type { Application } from 'express';

export interface TestContext {
  app: Application;
  dataSource: DataSource;
}

export async function createTestApp(): Promise<TestContext> {
  // In-memory SQLite — isolated per test run, no file left on disk
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [PostEntity, IdempotencyKeyEntity, UserEntity],
    synchronize: true, // auto-create tables from entities
    logging: false
  });

  await dataSource.initialize();

  const postTypeOrmRepo = dataSource.getRepository(PostEntity);
  const idempotencyTypeOrmRepo = dataSource.getRepository(IdempotencyKeyEntity);
  const userTypeOrmRepo = dataSource.getRepository(UserEntity);

  const userRepository = new UserRepository(userTypeOrmRepo);
  const authService = new AuthService(userRepository);
  const authController = new AuthController(authService);

  const userService = new UserService(userRepository);
  const userController = new UserController(userService);

  const postRepository = new PostRepository(postTypeOrmRepo);
  const postService = new PostService(postRepository);
  const postController = new PostController(postService);

  configurePassport(userRepository);

  const app = createApp([
    { path: '/api/v1/auth', router: createAuthRoutes(authController) },
    { path: '/api/v1/users', router: createUserRoutes(userController) },
    {
      path: '/api/v1/posts',
      router: createPostRoutes(postController, idempotencyTypeOrmRepo)
    }
  ]);

  return { app, dataSource };
}

export async function teardownTestApp(ctx: TestContext): Promise<void> {
  if (ctx.dataSource.isInitialized) {
    await ctx.dataSource.destroy();
  }
}
