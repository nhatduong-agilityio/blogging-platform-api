import express, { type Router, type Application } from 'express';

// Middlewares
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { requestLogger } from './middlewares/request-logger.js';

export interface RouteConfig {
  path: string;
  router: Router;
}

/**
 * Creates an express application with the given routes.
 * @param {RouteConfig[]} routes - An array of route configurations.
 * @returns {Application} - The created express application.
 */
export function createApp(routes: RouteConfig[]): Application {
  const app = express();

  // Middleware to parse JSON bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Routes
  routes.forEach(route => {
    app.use(route.path, route.router);
  });

  // Error Handlers and Not Found Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
