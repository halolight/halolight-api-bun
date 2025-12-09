import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { generateOpenApiSpec } from './openapi';
import { env } from '../utils/env';

/**
 * Factory to build Swagger routes with a configurable base path.
 */
export function createSwaggerRoutes(swaggerPath: string) {
  const routes = new Hono();

  routes.get('/openapi.json', (c) => {
    const spec = generateOpenApiSpec();
    return c.json(spec);
  });

  routes.get(
    '/',
    swaggerUI({
      url: `${swaggerPath}/openapi.json`,
      persistAuthorization: true,
    }),
  );

  return routes;
}

export function createDocsRedirect(swaggerPath: string) {
  const docs = new Hono();
  docs.get('/', (c) => c.redirect(swaggerPath));
  return docs;
}

// Default instances for Bun/Vercel entrypoints
export const swaggerRoutes = createSwaggerRoutes(env.SWAGGER_PATH);
export const docsRedirect = createDocsRedirect(env.SWAGGER_PATH);
