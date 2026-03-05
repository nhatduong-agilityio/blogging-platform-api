import 'dotenv/config';

import { initializeDb, closeDb } from './database/connection.js';
import app from './app.js';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

// Initialize the database connection before starting the server
initializeDb();

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
