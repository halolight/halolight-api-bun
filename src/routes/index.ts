import { Hono } from 'hono';
import { authRoutes } from './auth';
import { userRoutes } from './users';
import { roleRoutes } from './roles';
import { permissionRoutes } from './permissions';
import { teamRoutes } from './teams';
import { documentRoutes } from './documents';
import { notificationRoutes } from './notifications';
import { dashboardRoutes } from './dashboard';
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
    version: '1.0.0',
  });
});

/**
 * Mount route modules
 */
apiRoutes.route('/auth', authRoutes);
apiRoutes.route('/users', userRoutes);
apiRoutes.route('/roles', roleRoutes);
apiRoutes.route('/permissions', permissionRoutes);
apiRoutes.route('/teams', teamRoutes);
apiRoutes.route('/documents', documentRoutes);
apiRoutes.route('/notifications', notificationRoutes);
apiRoutes.route('/dashboard', dashboardRoutes);
