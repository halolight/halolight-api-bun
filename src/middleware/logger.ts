import { logger } from 'hono/logger';

/**
 * HTTP request logger middleware
 */
export const loggerMiddleware = logger((message: string, ...rest: string[]) => {
  // Custom log formatting
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, ...rest);
});
