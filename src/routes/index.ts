import { Hono } from 'hono';
import { authRoutes } from './auth';
import { userRoutes } from './users';
import { successResponse } from '../utils/response';

/**
 * API routes
 */
export const apiRoutes = new Hono();

/**
 * Health check endpoint
 */
apiRoutes.get('/health', (c) => {
  return successResponse(c, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Mount route modules
 */
apiRoutes.route('/auth', authRoutes);
apiRoutes.route('/users', userRoutes);
