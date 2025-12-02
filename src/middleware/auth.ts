import type { Context, Next } from 'hono';
import { extractToken, verifyAccessToken, type AccessTokenPayload } from '../utils/jwt';
import { errorResponse } from '../utils/response';
import { userService } from '../services/user.service';

/**
 * Extend Hono context with user payload
 */
declare module 'hono' {
  interface ContextVariableMap {
    user: AccessTokenPayload;
    userRoles: string[];
  }
}

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to context
 */
export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    const token = extractToken(authHeader);

    if (!token) {
      return errorResponse(c, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    const payload = await verifyAccessToken(token);

    // Attach user to context
    c.set('user', payload);

    // Optionally load user roles for authorization
    const roles = await userService.getUserRoles(payload.userId);
    c.set('userRoles', roles);

    await next();
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Invalid token', 401, 'INVALID_TOKEN');
  }
}

/**
 * Role-based authorization middleware
 * Checks if user has any of the allowed roles
 */
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    const userRoles = c.get('userRoles') || [];

    if (!user) {
      return errorResponse(c, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    // Check if user has any of the allowed roles
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return errorResponse(c, 'Insufficient permissions', 403, 'FORBIDDEN', {
        requiredRoles: allowedRoles,
        userRoles,
      });
    }

    await next();
  };
}

/**
 * Permission-based authorization middleware
 * Checks if user has the required permission
 */
export function requirePermission(resource: string, action: string) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return errorResponse(c, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    // Get user with permissions
    const userWithRoles = await userService.findByIdWithRoles(user.userId);
    if (!userWithRoles) {
      return errorResponse(c, 'User not found', 404, 'USER_NOT_FOUND');
    }

    // Check for wildcard or specific permission
    const requiredPermission = `${resource}:${action}`;
    const hasPermission =
      userWithRoles.permissions.includes('*:*') ||
      userWithRoles.permissions.includes(`${resource}:*`) ||
      userWithRoles.permissions.includes(`*:${action}`) ||
      userWithRoles.permissions.includes(requiredPermission);

    if (!hasPermission) {
      return errorResponse(c, 'Insufficient permissions', 403, 'FORBIDDEN', {
        requiredPermission,
      });
    }

    await next();
  };
}
