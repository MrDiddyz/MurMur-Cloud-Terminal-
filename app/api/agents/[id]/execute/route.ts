import { NextRequest, NextResponse } from 'next/server'
import { executeAgent, persistResult } from '@/services/execution-engine'
import { toApiError } from '@/lib/errors'
import { getLogger } from '@/lib/logger'

const logger = getLogger('api:agents:execute')

type RouteParams = { params: { id: string } }

export async function POST(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const result = await executeAgent(params.id)
    await persistResult(result)
    return NextResponse.json({ result }, { status: result.success ? 200 : 422 })
  } catch (err) {
    const { statusCode, body } = toApiError(err)
    logger.error({ agentId: params.id, err }, 'POST /api/agents/:id/execute failed')
    return NextResponse.json(body, { status: statusCode })
  }
}
