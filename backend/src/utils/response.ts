import type { Context } from "hono"

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}

/**
 * Success response
 */
export function success<T>(c: Context, data?: T, message = "ok"): Response {
  return c.json<ApiResponse<T>>({ code: 0, message, data })
}

/**
 * Error response
 */
export function error(
  c: Context,
  message: string,
  code = 1,
  httpStatus = 400
): Response {
  return c.json<ApiResponse>({ code, message }, httpStatus as 200 | 400 | 401 | 403 | 404 | 500)
}

/**
 * Standard result pagination
 */
export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export function paginated<T>(
  c: Context,
  list: T[],
  total: number,
  page: number,
  pageSize: number
): Response {
  return success<PaginatedData<T>>(c, { list, total, page, pageSize })
}

/**
 * Global error handler for Hono app.onError
 */
export function handleError(err: Error, c: Context): Response {
  console.error("Unhandled error:", err.message)
  return c.json<ApiResponse>(
    { code: 500, message: err.message || "Internal server error" },
    500,
  )
}