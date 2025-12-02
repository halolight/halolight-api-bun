import type { Context } from 'hono';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
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
export function successResponse<T>(c: Context, data: T, statusCode = 200, meta?: ApiResponse['meta']) {
  return c.json<ApiResponse<T>>(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    statusCode
  );
}

/**
 * Error response helper
 */
export function errorResponse(
  c: Context,
  message: string,
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  details?: any
) {
  return c.json<ApiResponse>(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    statusCode
  );
}

/**
 * Pagination response helper
 */
export function paginatedResponse<T>(
  c: Context,
  data: T[],
  page: number,
  pageSize: number,
  total: number
) {
  const totalPages = Math.ceil(total / pageSize);

  return successResponse(
    c,
    data,
    200,
    {
      page,
      pageSize,
      total,
      totalPages,
    }
  );
}
