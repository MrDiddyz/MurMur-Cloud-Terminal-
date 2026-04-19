import { randomUUID } from 'crypto'
import { getLogger } from '@/lib/logger'
import { notFound, validationError, AppError } from '@/lib/errors'

const logger = getLogger('agent-manager')

export type AgentStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed'

export interface Agent {
  id: string
  name: string
  goal: string
  status: AgentStatus
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
}

export interface CreateAgentInput {
  name: string
  goal: string
  metadata?: Record<string, unknown>
}

// In-memory store (replace with DB layer when DATABASE_URL is configured)
const store = new Map<string, Agent>()

function conflictError(message: string): AppError {
  return new AppError(message, 'CONFLICT', 409)
}

export function createAgent(input: CreateAgentInput): Agent {
  if (!input.name?.trim()) throw validationError('Agent name is required')
  if (!input.goal?.trim()) throw validationError('Agent goal is required')
  if (Array.from(store.values()).some((a) => a.name === input.name && a.status !== 'completed')) {
    throw conflictError(`Agent with name "${input.name}" already exists`)
  }

  const now = new Date().toISOString()
  const agent: Agent = {
    id: randomUUID(),
    name: input.name.trim(),
    goal: input.goal.trim(),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    metadata: input.metadata ?? {},
  }
  store.set(agent.id, agent)
  logger.info({ agentId: agent.id, name: agent.name }, 'Agent created')
  return agent
}

export function getAgent(id: string): Agent {
  const agent = store.get(id)
  if (!agent) throw notFound(`Agent ${id}`)
  return agent
}

export function listAgents(statusFilter?: AgentStatus): Agent[] {
  const agents = Array.from(store.values())
  return statusFilter ? agents.filter((a) => a.status === statusFilter) : agents
}

export function updateAgentStatus(id: string, status: AgentStatus): Agent {
  const agent = getAgent(id)
  const validTransitions: Record<AgentStatus, AgentStatus[]> = {
    pending: ['running', 'failed'],
    running: ['paused', 'completed', 'failed'],
    paused: ['running', 'failed'],
    completed: [],
    failed: [],
  }
  if (!validTransitions[agent.status].includes(status)) {
    throw validationError(`Cannot transition from ${agent.status} to ${status}`)
  }
  agent.status = status
  agent.updatedAt = new Date().toISOString()
  store.set(id, agent)
  logger.info({ agentId: id, status }, 'Agent status updated')
  return agent
}

export function deleteAgent(id: string): void {
  const agent = getAgent(id)
  if (agent.status === 'running') throw validationError('Cannot delete a running agent. Stop it first.')
  store.delete(id)
  logger.info({ agentId: id }, 'Agent deleted')
}

export function _clearStore(): void {
  store.clear()
}
