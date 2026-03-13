import express, { type Router, type Application } from 'express';
import passport from 'passport';

// Middlewares
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { requestLogger } from './middlewares/request-logger.js';
import { globalLimiter } from './middlewares/rate-limit.js';

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

  // Global Middleware
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: true, limit: '50kb' }));
  app.use(requestLogger);

  // Rate limit middleware
  app.use(globalLimiter);

  //  Passport
  // session: false — stateless JWT, no server-side sessions needed.
  // Strategy is registered via configurePassport() in server.ts
  // before this function is called.
  app.use(passport.initialize());

  //  Routes
  routes.forEach(route => {
    app.use(route.path, route.router);
  });

  // Error Handlers and Not Found Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
