import type { Context, Next } from 'hono';
import { extractToken, verifyToken, type TokenPayload } from '../utils/jwt';
import { errorResponse } from '../utils/response';

/**
 * Extend Hono context with user payload
 */
declare module 'hono' {
  interface ContextVariableMap {
    user: TokenPayload;
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to context
 */
export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    const token = extractToken(authHeader);

    if (!token) {
      return errorResponse(c, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    const payload = await verifyToken(token);

    // Attach user to context
    c.set('user', payload);

    await next();
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : 'Invalid token',
      401,
      'INVALID_TOKEN'
    );
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return errorResponse(c, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(user.role)) {
      return errorResponse(
        c,
        'Insufficient permissions',
        403,
        'FORBIDDEN',
        { requiredRoles: allowedRoles, userRole: user.role }
      );
    }

    await next();
  };
}
