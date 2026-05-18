import { NextResponse } from 'next/server'
import { listAgents } from '@/services/agent-manager'
import { getCircuitBreakerStatus, getExecutionStats } from '@/services/execution-engine'

export async function GET(): Promise<NextResponse> {
  const agents = listAgents()
  const executionStats = getExecutionStats()
  const statusCounts = agents.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1
    return acc
  }, {})

  const lines = [
    '# HELP murmur_agents_total Total number of agents by status',
    '# TYPE murmur_agents_total gauge',
    ...Object.entries(statusCounts).map(
      ([status, count]) => `murmur_agents_total{status="${status}"} ${count}`,
    ),
    '',
    '# HELP murmur_circuit_breaker_state Circuit breaker state (0=CLOSED,1=HALF_OPEN,2=OPEN)',
    '# TYPE murmur_circuit_breaker_state gauge',
    ...Object.entries(getCircuitBreakerStatus()).map(([name, state]) => {
      const val = state === 'CLOSED' ? 0 : state === 'HALF_OPEN' ? 1 : 2
      return `murmur_circuit_breaker_state{name="${name}"} ${val}`
    }),
    '',
    '# HELP murmur_agent_executions_total Total number of persisted agent executions',
    '# TYPE murmur_agent_executions_total counter',
    `murmur_agent_executions_total{outcome="success"} ${executionStats.successful}`,
    `murmur_agent_executions_total{outcome="failure"} ${executionStats.failed}`,
    '',
    '# HELP murmur_agent_execution_avg_duration_ms Average execution duration in milliseconds',
    '# TYPE murmur_agent_execution_avg_duration_ms gauge',
    `murmur_agent_execution_avg_duration_ms ${executionStats.averageDurationMs}`,
  ]

  return new NextResponse(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; version=0.0.4' },
  })
}
