import { createAgent, _clearStore } from '@/services/agent-manager'
import {
  executeAgent,
  persistResult,
  getExecutionStats,
  listExecutionResults,
  _clearExecutionHistory,
} from '@/services/execution-engine'

jest.mock('pino', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: () => mockLogger,
  }
  const pino = () => mockLogger
  pino.stdTimeFunctions = { isoTime: () => '2024-01-01' }
  return pino
})

jest.mock('pino-pretty', () => ({}))

describe('execution-engine', () => {
  beforeEach(() => {
    _clearStore()
    _clearExecutionHistory()
  })

  it('records successful execution results for analytics', async () => {
    const agent = createAgent({ name: 'execution-agent', goal: 'process work item' })
    const result = await executeAgent(agent.id)
    await persistResult(result)

    const stats = getExecutionStats()
    expect(stats.total).toBe(1)
    expect(stats.successful).toBe(1)
    expect(stats.failed).toBe(0)
    expect(stats.successRate).toBe(1)

    const recent = listExecutionResults(1)
    expect(recent).toHaveLength(1)
    expect(recent[0].agentId).toBe(agent.id)
  })

  it('returns bounded execution history when requesting many records', async () => {
    const agent1 = createAgent({ name: 'execution-agent-1', goal: 'g1' })
    const result1 = await executeAgent(agent1.id)
    await persistResult(result1)

    const agent2 = createAgent({ name: 'execution-agent-2', goal: 'g2' })
    const result2 = await executeAgent(agent2.id)
    await persistResult(result2)

    const all = listExecutionResults(100)
    expect(all).toHaveLength(2)
    expect(all[0].agentId).toBe(agent2.id)
    expect(all[1].agentId).toBe(agent1.id)
  })
})
