import type { Context, Next } from 'hono';
import { ZodError } from 'zod';
import { errorResponse } from '../utils/response';

/**
 * Global error handler middleware
 */
export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error('❌ Error:', error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return errorResponse(c, 'Validation error', 400, 'VALIDATION_ERROR', {
        errors: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    // Handle custom errors with statusCode
    if (error instanceof Error && 'statusCode' in error) {
      const statusCode = (error as Error & { statusCode: number }).statusCode as 400 | 401 | 403 | 404 | 500;
      return errorResponse(c, error.message, statusCode, 'APPLICATION_ERROR');
    }

    // Generic error
    return errorResponse(c, error instanceof Error ? error.message : 'Internal server error', 500, 'INTERNAL_ERROR');
  }
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(c: Context) {
  return errorResponse(c, 'Route not found', 404, 'NOT_FOUND');
}
