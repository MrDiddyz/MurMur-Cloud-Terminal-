import { getConfig, resetConfig } from '@/lib/config'

describe('getConfig', () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    resetConfig()
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
    resetConfig()
  })

  it('returns default values when optional env vars are missing', () => {
    const cfg = getConfig()
    expect(cfg.NODE_ENV).toBeDefined()
    expect(cfg.LOG_LEVEL).toBe('info')
    expect(cfg.ENABLE_WEBSOCKET).toBe(true)
  })

  it('throws when JWT_SECRET is too short', () => {
    process.env.JWT_SECRET = 'short'
    expect(() => getConfig()).toThrow('Configuration validation failed')
  })

  it('accepts a valid JWT_SECRET', () => {
    process.env.JWT_SECRET = 'a'.repeat(32)
    const cfg = getConfig()
    expect(cfg.JWT_SECRET).toBe('a'.repeat(32))
  })

  it('parses LOG_LEVEL from env', () => {
    process.env.LOG_LEVEL = 'debug'
    const cfg = getConfig()
    expect(cfg.LOG_LEVEL).toBe('debug')
  })
})
