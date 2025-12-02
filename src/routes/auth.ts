import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authService } from '../services/auth.service';
import { loginSchema, registerSchema, refreshTokenSchema } from '../db/schema';
import { successResponse, errorResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import { env } from '../utils/env';

/**
 * Auth routes
 */
export const authRoutes = new Hono();

/**
 * Parse JWT expiration string to seconds
 * @example "15m" -> 900, "7d" -> 604800, "1h" -> 3600
 */
function parseExpirationToSeconds(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 minutes
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 900;
  }
}

/**
 * POST /auth/register
 * Register a new user
 */
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const result = await authService.register(data);
    const expiresIn = parseExpirationToSeconds(env.JWT_EXPIRES_IN);

    return successResponse(
      c,
      {
        user: result.user,
        token: result.accessToken,
        expiresIn,
        refreshToken: result.refreshToken,
      },
      201,
    );
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Registration failed', 400, 'REGISTRATION_FAILED');
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
    const expiresIn = parseExpirationToSeconds(env.JWT_EXPIRES_IN);

    return successResponse(c, {
      user: result.user,
      token: result.accessToken,
      expiresIn,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Login failed', 401, 'LOGIN_FAILED');
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
authRoutes.post('/refresh', zValidator('json', refreshTokenSchema), async (c) => {
  try {
    const { refreshToken } = c.req.valid('json');
    const result = await authService.refresh(refreshToken);
    const expiresIn = parseExpirationToSeconds(env.JWT_EXPIRES_IN);

    return successResponse(c, {
      token: result.accessToken,
      expiresIn,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Token refresh failed', 401, 'REFRESH_FAILED');
  }
});

/**
 * POST /auth/logout
 * Logout user (revoke refresh token)
 */
authRoutes.post('/logout', zValidator('json', refreshTokenSchema), async (c) => {
  try {
    const { refreshToken } = c.req.valid('json');
    await authService.logout(refreshToken);

    return successResponse(c, { message: 'Successfully logged out' });
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Logout failed', 400, 'LOGOUT_FAILED');
  }
});

/**
 * POST /auth/logout-all
 * Logout from all devices (requires authentication)
 */
authRoutes.post('/logout-all', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    await authService.logoutAll(user.userId);

    return successResponse(c, { message: 'Successfully logged out from all devices' });
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Logout failed', 400, 'LOGOUT_FAILED');
  }
});

/**
 * GET /auth/me
 * Get current user profile with roles and permissions
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
      'PROFILE_FETCH_FAILED',
    );
  }
});
