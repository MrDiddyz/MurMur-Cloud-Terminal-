import { NextResponse } from 'next/server'
import { getCircuitBreakerStatus } from '@/services/execution-engine'

export async function GET(): Promise<NextResponse> {
  const breakers = getCircuitBreakerStatus()
  const allHealthy = Object.values(breakers).every((s) => s !== 'OPEN')

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      version: process.env.npm_package_version ?? '1.0.0',
      timestamp: new Date().toISOString(),
      dependencies: {
        redis: breakers.redis,
        database: breakers.database,
      },
    },
    { status: allHealthy ? 200 : 503 },
  )
}
