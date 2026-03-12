import 'dotenv/config';

// Constants
import { API_PREFIX } from './constants/route.js';

// Database
import { initializeDb, closeDb } from './database/connection.js';

// Types
import type { Server } from 'http';

// Repositories
import { PostRepository } from './repositories/post.js';

// Services
import { PostService } from './services/post.js';

// Controllers
import { PostController } from './controllers/post.js';

// Routes
import { createPostRoutes } from './routes/post.js';

// App
import { createApp } from './app.js';

// Middlewares
import { purgeExpiredKeys } from './middlewares/idempotency.js';

// Entities
import { PostEntity } from './entity/post.js';
import { IdempotencyKeyEntity } from './entity/idempotency.js';
import { UserEntity } from './entity/user.js';
import { UserRepository } from './repositories/user.js';
import { AuthService } from './services/auth.js';
import { AuthController } from './controllers/auth.js';
import { createAuthRoutes } from './routes/auth.js';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

// Initialize the database connection before starting the server
const dataSource = await initializeDb();

// TypeORM repositories
const postTypeOrmRepo = dataSource.getRepository(PostEntity);
const idempotencyTypeOrmRepo = dataSource.getRepository(IdempotencyKeyEntity);
const authTypeOrmRepo = dataSource.getRepository(UserEntity);

// Posts
const postRepository = new PostRepository(postTypeOrmRepo);
const postService = new PostService(postRepository);
const postController = new PostController(postService);

const authRepository = new UserRepository(authTypeOrmRepo);
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

// Purge idempotency keys that have passed their 24-hour TTL.
// Runs once on boot; a production app could also use setInterval.
const purged = await purgeExpiredKeys(idempotencyTypeOrmRepo);
if (purged > 0) {
  console.info(`🧹 Purged ${purged} expired idempotency key(s)`);
}

const postRoutes = createPostRoutes(postController, idempotencyTypeOrmRepo);
const authRoutes = createAuthRoutes(authController);

// Register routes
const app = createApp([
  {
    path: `${API_PREFIX}/posts`,
    router: postRoutes
  },
  {
    path: `${API_PREFIX}/auth`,
    router: authRoutes
  }
]);

// Start the server
const server = app.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
  console.info(`Environment: ${process.env.NODE_ENV}`);
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
  console.info(`Received ${signal}. Shutting down gracefully...`);

  await closeServer(server);

  console.info('HTTP server closed.');

  await closeDb(dataSource);

  console.info('Shutdown complete. Exiting process.');

  process.exit(0);
}

// Listen for termination signals to gracefully shut down the server and close the database connection
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
