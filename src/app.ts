import express from 'express';
import postRoutes from './routes/post.js';

// Constants
import { API_PREFIX } from './constants/route.js';

// Middlewares
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { requestLogger } from './middlewares/request-logger.js';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use(API_PREFIX, postRoutes);

// Error Handlers and Not Found Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
