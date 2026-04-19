import {
  AppError,
  notFound,
  unauthorized,
  validationError,
  internalError,
  isAppError,
  toApiError,
} from '@/lib/errors'

describe('AppError', () => {
  it('creates error with correct properties', () => {
    const err = new AppError('test message', 'NOT_FOUND', 404)
    expect(err.message).toBe('test message')
    expect(err.code).toBe('NOT_FOUND')
    expect(err.statusCode).toBe(404)
    expect(err.name).toBe('AppError')
  })

  it('serializes to JSON correctly', () => {
    const err = new AppError('test', 'VALIDATION_ERROR', 400, { field: 'name' })
    const json = err.toJSON()
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.message).toBe('test')
    expect(json.error.details).toEqual({ field: 'name' })
  })
})

describe('error helpers', () => {
  it('notFound returns 404', () => {
    const err = notFound('Agent 123')
    expect(err.statusCode).toBe(404)
    expect(err.message).toContain('Agent 123')
  })

  it('unauthorized returns 401', () => {
    expect(unauthorized().statusCode).toBe(401)
  })

  it('validationError returns 400', () => {
    expect(validationError('bad input').statusCode).toBe(400)
  })

  it('internalError returns 500', () => {
    expect(internalError().statusCode).toBe(500)
  })
})

describe('isAppError', () => {
  it('returns true for AppError', () => {
    expect(isAppError(new AppError('x', 'NOT_FOUND', 404))).toBe(true)
  })

  it('returns false for plain Error', () => {
    expect(isAppError(new Error('x'))).toBe(false)
  })
})

describe('toApiError', () => {
  it('converts AppError correctly', () => {
    const err = notFound('Thing')
    const { statusCode, body } = toApiError(err)
    expect(statusCode).toBe(404)
    expect((body as { error: { code: string } }).error.code).toBe('NOT_FOUND')
  })

  it('converts unknown error to 500', () => {
    const { statusCode } = toApiError(new Error('boom'))
    expect(statusCode).toBe(500)
  })
})
