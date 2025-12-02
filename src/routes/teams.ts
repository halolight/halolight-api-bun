import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { teamService } from '../services/team.service';
import { createTeamSchema, updateTeamSchema, paginationSchema } from '../db/schema';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

/**
 * Team routes
 */
export const teamRoutes = new Hono();

// All routes require authentication
teamRoutes.use('*', authMiddleware);

/**
 * GET /teams
 * Get all teams with pagination
 */
teamRoutes.get('/', zValidator('query', paginationSchema), async (c) => {
  try {
    const { page, pageSize, search } = c.req.valid('query');
    const { teams, total } = await teamService.findAll(page, pageSize, { search });

    return paginatedResponse(c, teams, total, page, pageSize);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch teams', 500, 'FETCH_FAILED');
  }
});

/**
 * GET /teams/:id
 * Get team by ID with members
 */
teamRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const team = await teamService.findById(id);

    if (!team) {
      return errorResponse(c, 'Team not found', 404, 'NOT_FOUND');
    }

    return successResponse(c, team);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch team', 500, 'FETCH_FAILED');
  }
});

/**
 * POST /teams
 * Create new team
 */
teamRoutes.post('/', zValidator('json', createTeamSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const user = c.get('user');

    const team = await teamService.create(data, user.userId);
    return successResponse(c, team, 201);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to create team', 400, 'CREATE_FAILED');
  }
});

/**
 * PATCH /teams/:id
 * Update team
 */
teamRoutes.patch('/:id', zValidator('json', updateTeamSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.valid('json');
    const user = c.get('user');

    // Check if user is owner
    const isOwner = await teamService.isOwner(id, user.userId);
    if (!isOwner) {
      return errorResponse(c, 'Only team owner can update team', 403, 'FORBIDDEN');
    }

    const team = await teamService.update(id, data);

    if (!team) {
      return errorResponse(c, 'Team not found', 404, 'NOT_FOUND');
    }

    return successResponse(c, team);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to update team', 400, 'UPDATE_FAILED');
  }
});

/**
 * DELETE /teams/:id
 * Delete team
 */
teamRoutes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    // Check if user is owner
    const isOwner = await teamService.isOwner(id, user.userId);
    if (!isOwner) {
      return errorResponse(c, 'Only team owner can delete team', 403, 'FORBIDDEN');
    }

    const deleted = await teamService.delete(id);

    if (!deleted) {
      return errorResponse(c, 'Team not found', 404, 'NOT_FOUND');
    }

    return successResponse(c, { message: 'Team deleted successfully' });
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to delete team', 400, 'DELETE_FAILED');
  }
});

/**
 * POST /teams/:id/members
 * Add member to team
 */
const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.string().default('member'),
});

teamRoutes.post('/:id/members', zValidator('json', addMemberSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const { userId, role } = c.req.valid('json');
    const currentUser = c.get('user');

    // Check if current user is owner
    const isOwner = await teamService.isOwner(id, currentUser.userId);
    if (!isOwner) {
      return errorResponse(c, 'Only team owner can add members', 403, 'FORBIDDEN');
    }

    await teamService.addMember(id, userId, role);

    const team = await teamService.findById(id);
    return successResponse(c, team);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to add member', 400, 'ADD_MEMBER_FAILED');
  }
});

/**
 * DELETE /teams/:id/members/:userId
 * Remove member from team
 */
teamRoutes.delete('/:id/members/:userId', async (c) => {
  try {
    const { id, userId } = c.req.param();
    const currentUser = c.get('user');

    // Check if current user is owner
    const isOwner = await teamService.isOwner(id, currentUser.userId);
    if (!isOwner) {
      return errorResponse(c, 'Only team owner can remove members', 403, 'FORBIDDEN');
    }

    // Cannot remove owner
    if (await teamService.isOwner(id, userId)) {
      return errorResponse(c, 'Cannot remove team owner', 400, 'CANNOT_REMOVE_OWNER');
    }

    await teamService.removeMember(id, userId);

    return successResponse(c, { message: 'Member removed successfully' });
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Failed to remove member',
      400,
      'REMOVE_MEMBER_FAILED',
    );
  }
});
