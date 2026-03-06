import 'dotenv/config';

// Constants
import { API_PREFIX } from './constants/route.js';

// Database
import { initializeDb, closeDb } from './database/connection.js';

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

const PORT = parseInt(process.env.PORT ?? '3000', 10);

// Initialize the database connection before starting the server
const db = initializeDb();

// Create repositories and services
const postRepository = new PostRepository(db);
const postService = new PostService(postRepository);
const postController = new PostController(postService);
const postRoutes = createPostRoutes(postController);

// Register routes
const app = createApp([
  {
    path: API_PREFIX,
    router: postRoutes
  }
]);

// Start the server
const server = app.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
  console.info(`Environment: ${process.env.NODE_ENV}`);
});

// Handle graceful shutdown
function shutdown(signal: string): void {
  console.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.info('HTTP server closed.');
    closeDb();
    console.info('Shutdown complete. Exiting process.');
    process.exit(0);
  });
}

// Listen for termination signals to gracefully shut down the server and close the database connection
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
