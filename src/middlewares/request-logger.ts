import type { Request, Response, NextFunction } from 'express';

/**
 * Request logger middleware.
 * Logs information about each incoming request, including the request method, original URL, response status code, and response time in milliseconds.
 * The log message will be colored based on the response status code.
 *   - Red for server errors (500+)
 *   - Yellow for client errors (400+)
 *   - Cyan for redirects (300+)
 *   - Green for successful responses (200+)
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusColor =
      statusCode >= 500
        ? '\x1b[31m' // Red for server errors
        : statusCode >= 400
          ? '\x1b[33m' // Yellow for client errors
          : statusCode >= 300
            ? '\x1b[36m' // Cyan for redirects
            : '\x1b[32m'; // Green for successful responses

    const reset = '\x1b[0m'; // Reset color

    console.info(
      `${statusColor}${req.method}${reset} ${req.originalUrl} ${statusColor}${statusCode}${reset} - ${duration}ms${reset}`
    );
  });

  next();
}
