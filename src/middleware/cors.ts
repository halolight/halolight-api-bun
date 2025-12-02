import { cors } from 'hono/cors';
import { parseCorsOrigins } from '../utils/env';

/**
 * CORS middleware configuration
 */
export const corsMiddleware = () => {
  const origins = parseCorsOrigins();

  return cors({
    origin: origins,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 600,
    credentials: true,
  });
};
