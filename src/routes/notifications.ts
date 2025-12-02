import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { notificationService } from '../services/notification.service';
import { paginationSchema } from '../db/schema';
import { successResponse, errorResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

/**
 * Notification routes
 */
export const notificationRoutes = new Hono();

// All routes require authentication
notificationRoutes.use('*', authMiddleware);

/**
 * GET /notifications
 * Get user notifications with pagination
 */
const listQuerySchema = paginationSchema.extend({
  unreadOnly: z.coerce.boolean().optional(),
});

notificationRoutes.get('/', zValidator('query', listQuerySchema), async (c) => {
  try {
    const { page, pageSize, unreadOnly } = c.req.valid('query');
    const user = c.get('user');

    const { notifications, total, unreadCount } = await notificationService.findByUserId(user.userId, page, pageSize, {
      unreadOnly,
    });

    return c.json({
      success: true,
      data: notifications,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        unreadCount,
      },
    });
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Failed to fetch notifications',
      500,
      'FETCH_FAILED',
    );
  }
});

/**
 * GET /notifications/unread-count
 * Get unread notification count
 */
notificationRoutes.get('/unread-count', async (c) => {
  try {
    const user = c.get('user');
    const count = await notificationService.getUnreadCount(user.userId);

    return successResponse(c, { unreadCount: count });
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to get count', 500, 'FETCH_FAILED');
  }
});

/**
 * PUT /notifications/:id/read
 * Mark notification as read
 */
notificationRoutes.put('/:id/read', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const notification = await notificationService.findById(id);
    if (!notification) {
      return errorResponse(c, 'Notification not found', 404, 'NOT_FOUND');
    }

    if (notification.userId !== user.userId) {
      return errorResponse(c, 'Not authorized', 403, 'FORBIDDEN');
    }

    const updated = await notificationService.markAsRead(id);
    return successResponse(c, updated);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to mark as read', 400, 'UPDATE_FAILED');
  }
});

/**
 * PUT /notifications/read-all
 * Mark all notifications as read
 */
notificationRoutes.put('/read-all', async (c) => {
  try {
    const user = c.get('user');
    const count = await notificationService.markAllAsRead(user.userId);

    return successResponse(c, { message: `Marked ${count} notifications as read` });
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Failed to mark all as read',
      400,
      'UPDATE_FAILED',
    );
  }
});

/**
 * DELETE /notifications/:id
 * Delete notification
 */
notificationRoutes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const notification = await notificationService.findById(id);
    if (!notification) {
      return errorResponse(c, 'Notification not found', 404, 'NOT_FOUND');
    }

    if (notification.userId !== user.userId) {
      return errorResponse(c, 'Not authorized', 403, 'FORBIDDEN');
    }

    await notificationService.delete(id);
    return successResponse(c, { message: 'Notification deleted successfully' });
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to delete', 400, 'DELETE_FAILED');
  }
});
