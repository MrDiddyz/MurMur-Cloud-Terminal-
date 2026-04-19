import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAgent, listAgents, AgentStatus } from '@/services/agent-manager'
import { toApiError, validationError } from '@/lib/errors'
import { getLogger } from '@/lib/logger'

const logger = getLogger('api:agents')

const createAgentSchema = z.object({
  name: z.string().min(1).max(128),
  goal: z.string().min(1).max(2048),
  metadata: z.record(z.unknown()).optional(),
})

const statusValues: AgentStatus[] = ['pending', 'running', 'paused', 'completed', 'failed']

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const statusParam = req.nextUrl.searchParams.get('status')
    if (statusParam && !statusValues.includes(statusParam as AgentStatus)) {
      throw validationError(`Invalid status filter. Must be one of: ${statusValues.join(', ')}`)
    }
    const agents = listAgents(statusParam as AgentStatus | undefined)
    return NextResponse.json({ agents, total: agents.length })
  } catch (err) {
    const { statusCode, body } = toApiError(err)
    logger.error({ err }, 'GET /api/agents failed')
    return NextResponse.json(body, { status: statusCode })
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      throw validationError('Request body must be valid JSON')
    }

    const parsed = createAgentSchema.safeParse(body)
    if (!parsed.success) {
      throw validationError('Invalid request body', parsed.error.flatten())
    }

    const agent = createAgent(parsed.data)
    return NextResponse.json({ agent }, { status: 201 })
  } catch (err) {
    const { statusCode, body } = toApiError(err)
    logger.error({ err }, 'POST /api/agents failed')
    return NextResponse.json(body, { status: statusCode })
  }
}
