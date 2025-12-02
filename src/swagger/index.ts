import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { generateOpenApiSpec } from './openapi';
import { env } from '../utils/env';

/**
 * Swagger routes
 */
export const swaggerRoutes = new Hono();

/**
 * Serve OpenAPI JSON spec (dynamically generated)
 */
swaggerRoutes.get('/openapi.json', (c) => {
  const spec = generateOpenApiSpec();
  return c.json(spec);
});

/**
 * Serve Swagger UI with custom configuration
 */
swaggerRoutes.get(
  '/',
  swaggerUI({
    url: `${env.SWAGGER_PATH}/openapi.json`,
    persistAuthorization: true,
  }),
);

/**
 * Redirect /docs to /swagger for compatibility
 */
export const docsRedirect = new Hono();
docsRedirect.get('/', (c) => c.redirect(env.SWAGGER_PATH));
