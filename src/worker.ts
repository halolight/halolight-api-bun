import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/error';
import { loggerMiddleware } from './middleware/logger';
import { apiRoutes } from './routes';
import { swaggerRoutes } from './swagger';
import { getHomePage } from './pages/home';

/**
 * Cloudflare Workers entry point
 * Environment variables are passed via env parameter
 */

// Define environment interface
interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET?: string;
  API_PREFIX: string;
  SWAGGER_PATH: string;
  SWAGGER_ENABLED: string;
}

/**
 * Create Hono application for Cloudflare Workers
 */
const app = new Hono<{ Bindings: Env }>();

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
  const apiPrefix = c.env?.API_PREFIX || '/api';
  const swaggerPath = c.env?.SWAGGER_PATH || '/swagger';

  return c.json({
    name: 'HaloLight API',
    version: '1.0.0',
    framework: 'Hono + Drizzle (Cloudflare Workers)',
    status: 'running',
    environment: 'production',
    endpoints: {
      health: `${apiPrefix}/health`,
      auth: `${apiPrefix}/auth`,
      users: `${apiPrefix}/users`,
      docs: '/docs',
      swagger: swaggerPath,
    },
    documentation: 'https://github.com/halolight/halolight-api-bun',
  });
});

/**
 * Mount Swagger UI
 */
app.route('/swagger', swaggerRoutes);
app.get('/docs', (c) => c.redirect('/swagger'));

/**
 * Mount API routes
 */
app.route('/api', apiRoutes);

/**
 * 404 handler
 */
app.notFound(notFoundHandler);

/**
 * Export for Cloudflare Workers
 */
export default app;
