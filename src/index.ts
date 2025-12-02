import { Hono } from 'hono';
import { env } from './utils/env';
import { corsMiddleware } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/error';
import { loggerMiddleware } from './middleware/logger';
import { apiRoutes } from './routes';
import { closeDatabase } from './db';

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
 * Root endpoint
 */
app.get('/', (c) => {
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
    },
    documentation: 'https://github.com/halolight/halolight-api-bun',
  });
});

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
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeDatabase();
  console.log('👋 Server closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  await closeDatabase();
  console.log('👋 Server closed');
  process.exit(0);
});

/**
 * Start server
 */
console.log('🚀 Starting HaloLight API...');
console.log(`📝 Environment: ${env.NODE_ENV}`);
console.log(`🔗 Server running on http://localhost:${env.PORT}`);
console.log(`🌐 API base URL: http://localhost:${env.PORT}${env.API_PREFIX}`);
console.log('');

export default server;
