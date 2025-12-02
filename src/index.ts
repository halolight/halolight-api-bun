import { Hono } from 'hono';
import { env } from './utils/env';
import { corsMiddleware } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/error';
import { loggerMiddleware } from './middleware/logger';
import { apiRoutes } from './routes';
import { swaggerRoutes } from './swagger';
import { closeDatabase } from './db';
import { getHomePage } from './pages/home';

/**
 * Create Hono application
 */
const app = new Hono();

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
 * Server configuration
 */
const server = {
  port: env.PORT,
  fetch: app.fetch,
};

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  closeDatabase()
    .then(() => {
      console.log('👋 Server closed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error during shutdown:', err);
      process.exit(1);
    });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  closeDatabase()
    .then(() => {
      console.log('👋 Server closed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error during shutdown:', err);
      process.exit(1);
    });
});

/**
 * Start server
 */
console.log('🚀 Starting HaloLight API...');
console.log(`📝 Environment: ${env.NODE_ENV}`);
console.log(`🔗 Server running on http://localhost:${env.PORT}`);
console.log(`🌐 API base URL: http://localhost:${env.PORT}${env.API_PREFIX}`);
console.log(`📚 Swagger UI: http://localhost:${env.PORT}${env.SWAGGER_PATH}`);
console.log(`📖 Docs: http://localhost:${env.PORT}/docs`);
console.log('');

export default server;
