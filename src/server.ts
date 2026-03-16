import 'reflect-metadata';
import 'dotenv/config';

// Constants
import { API_PREFIX } from './constants/route.js';

// Database
import { initializeDb, closeDb } from './database/connection.js';

// Types
import type { Server } from 'http';

// Entities
import { PostEntity } from './entity/post.js';
import { IdempotencyKeyEntity } from './entity/idempotency.js';
import { UserEntity } from './entity/user.js';

// Repositories
import { PostRepository } from './repositories/post.js';
import { UserRepository } from './repositories/user.js';

// Services
import { PostService } from './services/post.js';
import { AuthService } from './services/auth.js';
import { UserService } from './services/user.js';

// Controllers
import { PostController } from './controllers/post.js';
import { AuthController } from './controllers/auth.js';
import { UserController } from './controllers/user.js';

// Routes
import { createPostRoutes } from './routes/post.js';
import { createAuthRoutes } from './routes/auth.js';
import { createUserRoutes } from './routes/user.js';

// Middlewares
import { purgeExpiredKeys } from './middlewares/idempotency.js';

// Passport — must be configured before createApp()
import { configurePassport } from './configs/passport.js';

// App
import { createApp } from './app.js';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

// Initialize the database connection before starting the server
const dataSource = await initializeDb();

// TypeORM Repositories
const postTypeOrmRepo = dataSource.getRepository(PostEntity);
const idempotencyTypeOrmRepo = dataSource.getRepository(IdempotencyKeyEntity);
const userTypeOrmRepo = dataSource.getRepository(UserEntity);

// Dependency Graph

// Auth
const userRepository = new UserRepository(userTypeOrmRepo);
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

// Users
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// Posts
const postRepository = new PostRepository(postTypeOrmRepo);
const postService = new PostService(postRepository);
const postController = new PostController(postService);

// Register JwtStrategy — must happen before any request hits authMiddleware.
// userRepository is injected so the strategy can verify the user still exists.
configurePassport(userRepository);

// Purge idempotency keys that have passed their 24-hour TTL.
// Runs once on boot; a production app could also use setInterval.
const purged = await purgeExpiredKeys(idempotencyTypeOrmRepo);
if (purged > 0) {
  console.info(`🧹 Purged ${purged} expired idempotency key(s)`);
}

const postRoutes = createPostRoutes(postController, idempotencyTypeOrmRepo);
const authRoutes = createAuthRoutes(authController);
const userRoutes = createUserRoutes(userController);

// Register routes
const app = createApp([
  { path: `${API_PREFIX}/auth`, router: authRoutes },
  {
    path: `${API_PREFIX}/posts`,
    router: postRoutes
  },
  { path: `${API_PREFIX}/users`, router: userRoutes }
]);

// Start the server
const server = app.listen(PORT, () => {
  console.info(`🚀 Server running on port ${PORT}`);
  console.info(`🌿 Environment: ${process.env.NODE_ENV ?? 'development'}`);
});

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close(err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Handle graceful shutdown
async function shutdown(signal: string): Promise<void> {
  console.info(`\n${signal} received — shutting down gracefully...`);
  await closeServer(server);
  await closeDb(dataSource);
  console.info('Shutdown complete.');
  process.exit(0);
}

// Listen for termination signals to gracefully shut down the server and close the database connection
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
