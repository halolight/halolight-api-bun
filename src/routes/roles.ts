import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { roleService } from '../services/role.service';
import { createRoleSchema, updateRoleSchema } from '../db/schema';
import { successResponse, errorResponse } from '../utils/response';
import { authMiddleware, requireRole } from '../middleware/auth';

/**
 * Role routes
 */
export const roleRoutes = new Hono();

// All routes require authentication
roleRoutes.use('*', authMiddleware);

/**
 * GET /roles
 * Get all roles with permissions
 */
roleRoutes.get('/', async (c) => {
  try {
    const roles = await roleService.findAll();
    return successResponse(c, roles);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch roles', 500, 'FETCH_FAILED');
  }
});

/**
 * GET /roles/:id
 * Get role by ID with permissions
 */
roleRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const role = await roleService.findById(id);

    if (!role) {
      return errorResponse(c, 'Role not found', 404, 'NOT_FOUND');
    }

    return successResponse(c, role);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch role', 500, 'FETCH_FAILED');
  }
});

/**
 * POST /roles
 * Create new role
 */
roleRoutes.post('/', requireRole('admin'), zValidator('json', createRoleSchema), async (c) => {
  try {
    const data = c.req.valid('json');

    // Check if name already exists
    const exists = await roleService.nameExists(data.name);
    if (exists) {
      return errorResponse(c, 'Role name already exists', 409, 'CONFLICT');
    }

    const role = await roleService.create(data);
    return successResponse(c, role, 201);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to create role', 400, 'CREATE_FAILED');
  }
});

/**
 * PATCH /roles/:id
 * Update role (label and description only, name is immutable)
 */
roleRoutes.patch('/:id', requireRole('admin'), zValidator('json', updateRoleSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.valid('json');

    // Remove name from update data if present (name is immutable)
    const { name: _name, ...updateData } = data;

    const role = await roleService.update(id, updateData);

    if (!role) {
      return errorResponse(c, 'Role not found', 404, 'NOT_FOUND');
    }

    return successResponse(c, role);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to update role', 400, 'UPDATE_FAILED');
  }
});

/**
 * POST /roles/:id/permissions
 * Assign permissions to role
 */
const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

roleRoutes.post('/:id/permissions', requireRole('admin'), zValidator('json', assignPermissionsSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const { permissionIds } = c.req.valid('json');

    // Check if role exists
    const role = await roleService.findById(id);
    if (!role) {
      return errorResponse(c, 'Role not found', 404, 'NOT_FOUND');
    }

    await roleService.assignPermissions(id, permissionIds);

    // Return updated role
    const updatedRole = await roleService.findById(id);
    return successResponse(c, updatedRole);
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Failed to assign permissions',
      400,
      'ASSIGN_FAILED',
    );
  }
});

/**
 * DELETE /roles/:id
 * Delete role (only if no users assigned)
 */
roleRoutes.delete('/:id', requireRole('admin'), async (c) => {
  try {
    const { id } = c.req.param();

    const deleted = await roleService.delete(id);

    if (!deleted) {
      return errorResponse(c, 'Role not found', 404, 'NOT_FOUND');
    }

    return successResponse(c, { message: 'Role deleted successfully' });
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to delete role', 400, 'DELETE_FAILED');
  }
});
