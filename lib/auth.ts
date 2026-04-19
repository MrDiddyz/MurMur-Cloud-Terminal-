import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import { getConfig } from './config'
import { unauthorized } from './errors'

export interface JWTPayload {
  sub: string
  role: 'admin' | 'operator' | 'viewer'
  iat?: number
  exp?: number
}

function getSecret(): Uint8Array {
  const cfg = getConfig()
  const secret = cfg.JWT_SECRET
  if (!secret) throw unauthorized('Authentication not configured')
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const cfg = getConfig()
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(cfg.JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const cfg = getConfig()
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: cfg.JWT_ISSUER })
    return payload as unknown as JWTPayload
  } catch {
    throw unauthorized('Invalid or expired token')
  }
}

export async function extractToken(req: NextRequest): Promise<JWTPayload> {
  const authHeader = req.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) throw unauthorized('Missing Bearer token')
  return verifyToken(authHeader.slice(7))
}

export function requireRole(
  handler: (req: NextRequest, payload: JWTPayload) => Promise<NextResponse>,
  ...allowedRoles: JWTPayload['role'][]
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const payload = await extractToken(req)
      if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
          { status: 403 },
        )
      }
      return handler(req, payload)
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: err.message } }, { status: 401 })
      }
      return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Auth error' } }, { status: 500 })
    }
  }
}
