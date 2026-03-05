import express from 'express';

// Middlewares
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error Handlers and Not Found Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
