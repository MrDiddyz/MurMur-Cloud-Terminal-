import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import { getConfig } from './config'
import { forbidden, toApiError, unauthorized } from './errors'

export interface JWTPayload {
  sub: string
  role: 'admin' | 'operator' | 'viewer'
  iat?: number
  exp?: number
}

function isValidJWTPayload(payload: unknown): payload is JWTPayload {
  if (typeof payload !== 'object' || payload === null) return false

  const candidate = payload as Record<string, unknown>
  if (typeof candidate.sub !== 'string' || candidate.sub.trim().length === 0) return false
  if (!['admin', 'operator', 'viewer'].includes(String(candidate.role))) return false

  if (candidate.iat !== undefined && typeof candidate.iat !== 'number') return false
  if (candidate.exp !== undefined && typeof candidate.exp !== 'number') return false
  return true
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
    if (!isValidJWTPayload(payload)) {
      throw unauthorized('Invalid token payload')
    }
    return payload
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
        throw forbidden('Insufficient permissions')
      }
      return handler(req, payload)
    } catch (err: unknown) {
      const { statusCode, body } = toApiError(err)
      return NextResponse.json(body, { status: statusCode })
    }
  }
}
