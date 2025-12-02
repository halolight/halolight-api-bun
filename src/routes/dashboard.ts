import { Hono } from 'hono';
import { dashboardService } from '../services/dashboard.service';
import { successResponse, errorResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

/**
 * Dashboard routes
 */
export const dashboardRoutes = new Hono();

// All routes require authentication
dashboardRoutes.use('*', authMiddleware);

/**
 * GET /dashboard/stats
 * Get dashboard statistics
 */
dashboardRoutes.get('/stats', async (c) => {
  try {
    const user = c.get('user');
    const stats = await dashboardService.getStats(user.userId);

    return successResponse(c, stats);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch stats', 500, 'FETCH_FAILED');
  }
});

/**
 * GET /dashboard/visits
 * Get visit trends (7 days)
 */
dashboardRoutes.get('/visits', async (c) => {
  try {
    const trends = await dashboardService.getVisitTrends();
    return successResponse(c, trends);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch visits', 500, 'FETCH_FAILED');
  }
});

/**
 * GET /dashboard/sales
 * Get sales trends (6 months)
 */
dashboardRoutes.get('/sales', async (c) => {
  try {
    const trends = await dashboardService.getSalesTrends();
    return successResponse(c, trends);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch sales', 500, 'FETCH_FAILED');
  }
});

/**
 * GET /dashboard/activities
 * Get recent activities
 */
dashboardRoutes.get('/activities', async (c) => {
  try {
    const activities = await dashboardService.getRecentActivities(20);
    return successResponse(c, activities);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch activities', 500, 'FETCH_FAILED');
  }
});

/**
 * GET /dashboard/pie
 * Get pie chart data
 */
dashboardRoutes.get('/pie', async (c) => {
  try {
    const data = await dashboardService.getPieChartData();
    return successResponse(c, data);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch pie data', 500, 'FETCH_FAILED');
  }
});

/**
 * GET /dashboard/tasks
 * Get task list
 */
dashboardRoutes.get('/tasks', async (c) => {
  try {
    const tasks = await dashboardService.getTaskList();
    return successResponse(c, tasks);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch tasks', 500, 'FETCH_FAILED');
  }
});

/**
 * GET /dashboard/overview
 * Get system overview
 */
dashboardRoutes.get('/overview', async (c) => {
  try {
    const user = c.get('user');
    const stats = await dashboardService.getStats(user.userId);

    // Add system info
    const overview = {
      ...stats,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version,
      },
    };

    return successResponse(c, overview);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch overview', 500, 'FETCH_FAILED');
  }
});
