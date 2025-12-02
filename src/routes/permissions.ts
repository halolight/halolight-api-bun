import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { permissionService } from '../services/permission.service';
import { createPermissionSchema } from '../db/schema';
import { successResponse, errorResponse } from '../utils/response';
import { authMiddleware, requireRole } from '../middleware/auth';

/**
 * Permission routes
 */
export const permissionRoutes = new Hono();

// All routes require authentication
permissionRoutes.use('*', authMiddleware);

/**
 * GET /permissions
 * Get all permissions
 */
permissionRoutes.get('/', async (c) => {
  try {
    const permissions = await permissionService.findAll();
    return successResponse(c, permissions);
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Failed to fetch permissions',
      500,
      'FETCH_FAILED',
    );
  }
});

/**
 * GET /permissions/grouped
 * Get permissions grouped by resource
 */
permissionRoutes.get('/grouped', async (c) => {
  try {
    const grouped = await permissionService.getGroupedByResource();
    return successResponse(c, grouped);
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Failed to fetch permissions',
      500,
      'FETCH_FAILED',
    );
  }
});

/**
 * GET /permissions/:id
 * Get permission by ID
 */
permissionRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const permission = await permissionService.findById(id);

    if (!permission) {
      return errorResponse(c, 'Permission not found', 404, 'NOT_FOUND');
    }

    return successResponse(c, permission);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch permission', 500, 'FETCH_FAILED');
  }
});

/**
 * POST /permissions
 * Create new permission
 */
permissionRoutes.post('/', requireRole('admin'), zValidator('json', createPermissionSchema), async (c) => {
  try {
    const data = c.req.valid('json');

    // Check if permission already exists
    const exists = await permissionService.exists(data.action, data.resource);
    if (exists) {
      return errorResponse(c, 'Permission already exists', 409, 'CONFLICT');
    }

    const permission = await permissionService.create(data);
    return successResponse(c, permission, 201);
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Failed to create permission',
      400,
      'CREATE_FAILED',
    );
  }
});

/**
 * DELETE /permissions/:id
 * Delete permission
 */
permissionRoutes.delete('/:id', requireRole('admin'), async (c) => {
  try {
    const { id } = c.req.param();

    const deleted = await permissionService.delete(id);

    if (!deleted) {
      return errorResponse(c, 'Permission not found', 404, 'NOT_FOUND');
    }

    return successResponse(c, { message: 'Permission deleted successfully' });
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Failed to delete permission',
      400,
      'DELETE_FAILED',
    );
  }
});
