import { NextRequest, NextResponse } from 'next/server'
import { validationError, toApiError } from '@/lib/errors'
import { getLogger } from '@/lib/logger'
import { getExecutionStats, listExecutionResults } from '@/services/execution-engine'

const logger = getLogger('api:analytics')
const defaultLimit = 20
const maxLimit = 100

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const limitParam = req.nextUrl.searchParams.get('limit')
    const parsedLimit = limitParam === null ? defaultLimit : Number.parseInt(limitParam, 10)

    if (!Number.isFinite(parsedLimit) || !Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > maxLimit) {
      throw validationError(`Invalid limit. Must be an integer between 1 and ${maxLimit}`)
    }

    return NextResponse.json({
      stats: getExecutionStats(),
      recentExecutions: listExecutionResults(parsedLimit),
    })
  } catch (err) {
    const { statusCode, body } = toApiError(err)
    logger.error({ err }, 'GET /api/analytics failed')
    return NextResponse.json(body, { status: statusCode })
  }
}
