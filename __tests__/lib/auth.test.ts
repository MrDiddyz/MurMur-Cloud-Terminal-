import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { requireRole, signToken, verifyToken } from '@/lib/auth'
import { resetConfig } from '@/lib/config'

describe('auth', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv, JWT_SECRET: 'a'.repeat(32), JWT_ISSUER: 'murmur-cloud-terminal' }
    resetConfig()
  })

  afterEach(() => {
    process.env = originalEnv
    resetConfig()
  })

  it('verifies valid tokens', async () => {
    const token = await signToken({ sub: 'user-1', role: 'admin' })
    const payload = await verifyToken(token)

    expect(payload.sub).toBe('user-1')
    expect(payload.role).toBe('admin')
  })

  it('rejects tokens with invalid role payload', async () => {
    const secret = new TextEncoder().encode('a'.repeat(32))
    const token = await new SignJWT({ sub: 'user-1', role: 'invalid-role' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('murmur-cloud-terminal')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret)

    await expect(verifyToken(token)).rejects.toThrow('Invalid token payload')
  })

  it('rejects tokens with missing required payload fields', async () => {
    const secret = new TextEncoder().encode('a'.repeat(32))
    const token = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('murmur-cloud-terminal')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret)

    await expect(verifyToken(token)).rejects.toThrow('Invalid token payload')
  })

  it('returns 401 when bearer token is invalid', async () => {
    const wrapped = requireRole(async () => NextResponse.json({ ok: true }), 'admin')
    const req = new Request('http://localhost/api/test', {
      headers: { authorization: 'Bearer invalid-token' },
    })

    const res = await wrapped(req as never)
    expect(res.status).toBe(401)
  })

  it('returns 403 when role is not allowed', async () => {
    const token = await signToken({ sub: 'user-1', role: 'viewer' })
    const wrapped = requireRole(async () => NextResponse.json({ ok: true }), 'admin')
    const req = new Request('http://localhost/api/test', {
      headers: { authorization: `Bearer ${token}` },
    })

    const res = await wrapped(req as never)
    expect(res.status).toBe(403)
  })
})
