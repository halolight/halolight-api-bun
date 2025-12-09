import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/error';
import { loggerMiddleware } from './middleware/logger';
import { apiRoutes } from './routes';
import { createDocsRedirect, createSwaggerRoutes } from './swagger';
import { getHomePage } from './pages/home';
import { getWorkerDb } from './db/cloudflare';
import { setDb } from './db';
import { validateWorkerEnv } from './utils/env.worker';

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
  CORS_ORIGIN?: string;
}

/**
 * Create Hono application for Cloudflare Workers
 */
const app = new Hono<{
  Bindings: Env;
  Variables: {
    env: Env;
  };
}>();

let cachedEnv: Env | null = null;
let routesBound = false;

/**
 * Global middleware
 */
app.use('*', async (c, next) => {
  if (!cachedEnv) {
    cachedEnv = validateWorkerEnv(c.env as unknown as Record<string, unknown>);
  }
  const env = cachedEnv;

  // Bind per-runtime DB into shared service import
  setDb(getWorkerDb(env));

  // Attach parsed env to context for downstream use
  c.set('env', env);

  // Bind routes once using runtime env
  if (!routesBound) {
    const apiPrefix = env.API_PREFIX || '/api';
    const swaggerPath = env.SWAGGER_PATH || '/swagger';
    const enableSwagger = env.SWAGGER_ENABLED !== 'false';

    if (enableSwagger) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      app.route(swaggerPath, createSwaggerRoutes(swaggerPath) as any);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      app.route('/docs', createDocsRedirect(swaggerPath) as any);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    app.route(apiPrefix, apiRoutes as any);
    routesBound = true;
  }

  return next();
});

app.use('*', loggerMiddleware);
app.use('*', (c, next) => {
  const env = c.get('env');
  const origins = (env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return corsMiddleware(origins)(c, next);
});
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
  const env = c.get('env');
  const apiPrefix = env.API_PREFIX || '/api';
  const swaggerPath = env.SWAGGER_PATH || '/swagger';

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

// Routes are bound lazily in the first middleware once env is validated.

/**
 * 404 handler
 */
app.notFound(notFoundHandler);

/**
 * Export for Cloudflare Workers
 */
export default app;
