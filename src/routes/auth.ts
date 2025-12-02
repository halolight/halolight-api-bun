import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authService } from '../services/auth.service';
import { loginSchema, registerSchema } from '../db/schema';
import { successResponse, errorResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

/**
 * Auth routes
 */
export const authRoutes = new Hono();

/**
 * POST /auth/register
 * Register a new user
 */
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const result = await authService.register(data);

    return successResponse(
      c,
      {
        user: result.user,
        token: result.token,
      },
      201
    );
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Registration failed',
      400,
      'REGISTRATION_FAILED'
    );
  }
});

/**
 * POST /auth/login
 * Login user
 */
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');
    const result = await authService.login(email, password);

    return successResponse(c, {
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Login failed',
      401,
      'LOGIN_FAILED'
    );
  }
});

/**
 * GET /auth/me
 * Get current user profile
 */
authRoutes.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const profile = await authService.getCurrentUser(user.userId);

    if (!profile) {
      return errorResponse(c, 'User not found', 404, 'USER_NOT_FOUND');
    }

    return successResponse(c, profile);
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Failed to get profile',
      500,
      'PROFILE_FETCH_FAILED'
    );
  }
});
