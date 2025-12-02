import { handle } from 'hono/vercel';
import { Hono } from 'hono';
import { env } from '../src/utils/env';
import { corsMiddleware } from '../src/middleware/cors';
import { errorHandler, notFoundHandler } from '../src/middleware/error';
import { loggerMiddleware } from '../src/middleware/logger';
import { apiRoutes } from '../src/routes';
import { swaggerRoutes } from '../src/swagger';
import { getHomePage } from '../src/pages/home';

/**
 * Create Hono application
 */
const app = new Hono().basePath('/');

/**
 * Global middleware
 */
app.use('*', loggerMiddleware);
app.use('*', corsMiddleware());
app.use('*', errorHandler);

/**
 * Root endpoint - Beautiful home page
 */
app.get('/', (c) => {
  return c.html(getHomePage());
});

/**
 * JSON API info endpoint
 */
app.get('/info', (c) => {
  return c.json({
    name: 'HaloLight API',
    version: '1.0.0',
    framework: 'Bun + Hono + Drizzle',
    status: 'running',
    environment: env.NODE_ENV,
    endpoints: {
      health: `${env.API_PREFIX}/health`,
      auth: `${env.API_PREFIX}/auth`,
      users: `${env.API_PREFIX}/users`,
      docs: '/docs',
      swagger: env.SWAGGER_PATH,
    },
    documentation: 'https://github.com/halolight/halolight-api-bun',
  });
});

/**
 * Mount Swagger UI at /swagger and /docs
 */
app.route(env.SWAGGER_PATH, swaggerRoutes);
app.get('/docs', (c) => c.redirect(env.SWAGGER_PATH));

/**
 * Mount API routes
 */
app.route(env.API_PREFIX, apiRoutes);

/**
 * 404 handler (must be after all routes)
 */
app.notFound(notFoundHandler);

/**
 * Export for Vercel
 */
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);

export default app;
