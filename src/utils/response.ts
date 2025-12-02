import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Success response helper
 */
export function successResponse<T>(
  c: Context,
  data: T,
  statusCode: ContentfulStatusCode = 200,
  meta?: ApiResponse['meta'],
) {
  return c.json<ApiResponse<T>>(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    statusCode,
  );
}

/**
 * Error response helper
 */
export function errorResponse(
  c: Context,
  message: string,
  statusCode: ContentfulStatusCode = 500,
  code = 'INTERNAL_ERROR',
  details?: unknown,
) {
  const errorObj: ApiResponse['error'] = {
    code,
    message,
  };
  if (details !== undefined) {
    errorObj.details = details;
  }
  return c.json<ApiResponse>(
    {
      success: false,
      error: errorObj,
    },
    statusCode,
  );
}

/**
 * Pagination response helper
 */
export function paginatedResponse<T>(c: Context, data: T[], page: number, pageSize: number, total: number) {
  const totalPages = Math.ceil(total / pageSize);

  return successResponse(c, data, 200, {
    page,
    pageSize,
    total,
    totalPages,
  });
}
