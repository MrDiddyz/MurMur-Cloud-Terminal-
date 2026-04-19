export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'TIMEOUT'

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: unknown

  constructor(message: string, code: ErrorCode, statusCode: number, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    Object.setPrototypeOf(this, new.target.prototype)
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined && { details: this.details }),
      },
    }
  }
}

export function notFound(resource: string): AppError {
  return new AppError(`${resource} not found`, 'NOT_FOUND', 404)
}

export function unauthorized(message = 'Unauthorized'): AppError {
  return new AppError(message, 'UNAUTHORIZED', 401)
}

export function forbidden(message = 'Forbidden'): AppError {
  return new AppError(message, 'FORBIDDEN', 403)
}

export function validationError(message: string, details?: unknown): AppError {
  return new AppError(message, 'VALIDATION_ERROR', 400, details)
}

export function internalError(message = 'Internal server error'): AppError {
  return new AppError(message, 'INTERNAL_ERROR', 500)
}

export function serviceUnavailable(message = 'Service unavailable'): AppError {
  return new AppError(message, 'SERVICE_UNAVAILABLE', 503)
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError
}

export function toApiError(err: unknown): { statusCode: number; body: object } {
  if (isAppError(err)) {
    return { statusCode: err.statusCode, body: err.toJSON() }
  }
  const msg = err instanceof Error ? err.message : 'Unexpected error'
  return {
    statusCode: 500,
    body: { error: { code: 'INTERNAL_ERROR', message: msg } },
  }
}
