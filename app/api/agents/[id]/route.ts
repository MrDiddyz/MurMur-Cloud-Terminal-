import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAgent, deleteAgent, updateAgentStatus, AgentStatus } from '@/services/agent-manager'
import { toApiError, validationError } from '@/lib/errors'
import { getLogger } from '@/lib/logger'

const logger = getLogger('api:agents:id')

const updateSchema = z.object({
  status: z.enum(['pending', 'running', 'paused', 'completed', 'failed']),
})

type RouteParams = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const agent = getAgent(params.id)
    return NextResponse.json({ agent })
  } catch (err) {
    const { statusCode, body } = toApiError(err)
    return NextResponse.json(body, { status: statusCode })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      throw validationError('Request body must be valid JSON')
    }

    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      throw validationError('Invalid request body', parsed.error.flatten())
    }

    const agent = updateAgentStatus(params.id, parsed.data.status as AgentStatus)
    return NextResponse.json({ agent })
  } catch (err) {
    const { statusCode, body } = toApiError(err)
    logger.error({ agentId: params.id, err }, 'PATCH /api/agents/:id failed')
    return NextResponse.json(body, { status: statusCode })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    deleteAgent(params.id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const { statusCode, body } = toApiError(err)
    logger.error({ agentId: params.id, err }, 'DELETE /api/agents/:id failed')
    return NextResponse.json(body, { status: statusCode })
  }
}
