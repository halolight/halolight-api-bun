import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { userService } from '../services/user.service';
import { updateUserSchema } from '../db/schema';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { authMiddleware, requireRole } from '../middleware/auth';

/**
 * User routes (all protected)
 */
export const userRoutes = new Hono();

// Apply authentication middleware to all routes
userRoutes.use('*', authMiddleware);

/**
 * Query params schema for pagination
 */
const paginationSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  pageSize: z.string().optional().default('20').transform(Number),
});

/**
 * GET /users
 * Get paginated list of users
 */
userRoutes.get('/', zValidator('query', paginationSchema), async (c) => {
  try {
    const { page, pageSize } = c.req.valid('query');
    const { users, total } = await userService.findAll(page, pageSize);

    return paginatedResponse(c, users, page, pageSize, total);
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Failed to fetch users',
      500,
      'USERS_FETCH_FAILED',
    );
  }
});

/**
 * GET /users/:id
 * Get user by ID
 */
userRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = await userService.findById(id);

    if (!user) {
      return errorResponse(c, 'User not found', 404, 'USER_NOT_FOUND');
    }

    return successResponse(c, user);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch user', 500, 'USER_FETCH_FAILED');
  }
});

/**
 * PUT /users/:id
 * Update user (admin only)
 */
userRoutes.put('/:id', requireRole('admin'), zValidator('json', updateUserSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');

    const updatedUser = await userService.update(id, data);

    if (!updatedUser) {
      return errorResponse(c, 'User not found', 404, 'USER_NOT_FOUND');
    }

    return successResponse(c, updatedUser);
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Failed to update user',
      500,
      'USER_UPDATE_FAILED',
    );
  }
});

/**
 * DELETE /users/:id
 * Delete user (admin only)
 */
userRoutes.delete('/:id', requireRole('admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user');

    // Prevent self-deletion
    if (id === currentUser.userId) {
      return errorResponse(c, 'Cannot delete your own account', 400, 'SELF_DELETE_FORBIDDEN');
    }

    const deleted = await userService.delete(id);

    if (!deleted) {
      return errorResponse(c, 'User not found', 404, 'USER_NOT_FOUND');
    }

    return successResponse(c, { message: 'User deleted successfully' });
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Failed to delete user',
      500,
      'USER_DELETE_FAILED',
    );
  }
});
