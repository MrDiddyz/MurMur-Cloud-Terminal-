import { getLogger } from '@/lib/logger'
import { withRetry } from '@/lib/retry'
import { CircuitBreaker } from '@/lib/circuit-breaker'
import { getAgent, updateAgentStatus } from './agent-manager'

const logger = getLogger('execution-engine')

const redisBreaker = new CircuitBreaker('redis', { failureThreshold: 3, timeoutMs: 15_000 })
const dbBreaker = new CircuitBreaker('database', { failureThreshold: 3, timeoutMs: 15_000 })

export interface ExecutionResult {
  agentId: string
  success: boolean
  startedAt: string
  completedAt: string
  output?: string
  error?: string
}

export interface ExecutionStats {
  total: number
  successful: number
  failed: number
  successRate: number
  averageDurationMs: number
}

const executionHistory: ExecutionResult[] = []
const maxHistory = 1_000

export async function executeAgent(agentId: string): Promise<ExecutionResult> {
  const agent = getAgent(agentId)
  const startedAt = new Date().toISOString()
  logger.info({ agentId }, 'Starting agent execution')

  updateAgentStatus(agentId, 'running')

  try {
    const output = await withRetry(
      async () => {
        // Simulated execution — real implementation connects to worker pool
        logger.debug({ agentId, goal: agent.goal }, 'Executing agent goal')
        await new Promise((resolve) => setTimeout(resolve, 10))
        return `Goal processed: ${agent.goal}`
      },
      { maxAttempts: 3, baseDelayMs: 100 },
      (err) => !(err instanceof Error && err.message.includes('fatal')),
    )

    updateAgentStatus(agentId, 'completed')
    const completedAt = new Date().toISOString()
    logger.info({ agentId, startedAt, completedAt }, 'Agent execution completed')
    return { agentId, success: true, startedAt, completedAt, output }
  } catch (err) {
    updateAgentStatus(agentId, 'failed')
    const completedAt = new Date().toISOString()
    const errorMsg = err instanceof Error ? err.message : String(err)
    logger.error({ agentId, err: errorMsg }, 'Agent execution failed')
    return { agentId, success: false, startedAt, completedAt, error: errorMsg }
  }
}

export async function publishEvent(channel: string, payload: unknown): Promise<void> {
  await redisBreaker.execute(async () => {
    await withRetry(
      async () => {
        // Placeholder: real implementation uses ioredis publish
        logger.debug({ channel, payload }, 'Publishing event (stub)')
      },
      { maxAttempts: 2, baseDelayMs: 50 },
    )
  })
}

export async function persistResult(result: ExecutionResult): Promise<void> {
  executionHistory.unshift(result)
  if (executionHistory.length > maxHistory) {
    executionHistory.length = maxHistory
  }

  await dbBreaker.execute(async () => {
    await withRetry(
      async () => {
        // Placeholder: real implementation uses pg/supabase
        logger.debug({ agentId: result.agentId }, 'Persisting result (stub)')
      },
      { maxAttempts: 2, baseDelayMs: 100 },
    )
  })
}

export function getCircuitBreakerStatus(): Record<string, string> {
  return {
    redis: redisBreaker.getState(),
    database: dbBreaker.getState(),
  }
}

function getDurationMs(result: ExecutionResult): number {
  const duration = Date.parse(result.completedAt) - Date.parse(result.startedAt)
  return Number.isFinite(duration) && duration >= 0 ? duration : 0
}

export function listExecutionResults(limit = 50): ExecutionResult[] {
  const safeLimit = Math.max(0, Math.min(limit, maxHistory))
  return executionHistory.slice(0, safeLimit)
}

export function getExecutionStats(): ExecutionStats {
  const total = executionHistory.length
  const successful = executionHistory.filter((result) => result.success).length
  const failed = total - successful
  const totalDurationMs = executionHistory.reduce((acc, result) => acc + getDurationMs(result), 0)

  return {
    total,
    successful,
    failed,
    successRate: total === 0 ? 0 : successful / total,
    averageDurationMs: total === 0 ? 0 : totalDurationMs / total,
  }
}

export function _clearExecutionHistory(): void {
  executionHistory.length = 0
}
