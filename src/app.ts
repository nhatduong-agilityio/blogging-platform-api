import express from 'express';

// Middlewares
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { requestLogger } from './middlewares/request-logger.js';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Error Handlers and Not Found Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
