import { NextRequest, NextResponse } from 'next/server'
import { executeAgent, persistResult } from '@/services/execution-engine'
import { toApiError } from '@/lib/errors'
import { getLogger } from '@/lib/logger'

const logger = getLogger('api:agents:execute')

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params
  try {
    const result = await executeAgent(id)
    await persistResult(result)
    return NextResponse.json({ result }, { status: result.success ? 200 : 422 })
  } catch (err) {
    const { statusCode, body } = toApiError(err)
    logger.error({ agentId: id, err }, 'POST /api/agents/:id/execute failed')
    return NextResponse.json(body, { status: statusCode })
  }
}
