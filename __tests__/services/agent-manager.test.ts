import {
  createAgent,
  getAgent,
  listAgents,
  updateAgentStatus,
  deleteAgent,
  _clearStore,
} from '@/services/agent-manager'

// Mock pino to avoid transport issues in tests
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

// Mock pino-pretty
jest.mock('pino-pretty', () => ({}))

describe('agent-manager', () => {
  beforeEach(() => {
    _clearStore()
  })

  describe('createAgent', () => {
    it('creates an agent with valid input', () => {
      const agent = createAgent({ name: 'test-agent', goal: 'do something' })
      expect(agent.id).toBeDefined()
      expect(agent.name).toBe('test-agent')
      expect(agent.status).toBe('pending')
    })

    it('throws on missing name', () => {
      expect(() => createAgent({ name: '', goal: 'goal' })).toThrow()
    })

    it('throws on missing goal', () => {
      expect(() => createAgent({ name: 'agent', goal: '' })).toThrow()
    })

    it('throws on duplicate active agent name', () => {
      createAgent({ name: 'agent', goal: 'goal' })
      expect(() => createAgent({ name: 'agent', goal: 'goal2' })).toThrow()
    })

    it('throws on duplicate active agent name after trimming', () => {
      createAgent({ name: 'agent', goal: 'goal' })
      expect(() => createAgent({ name: ' agent ', goal: 'goal2' })).toThrow()
    })
  })

  describe('getAgent', () => {
    it('retrieves a created agent', () => {
      const created = createAgent({ name: 'a', goal: 'g' })
      expect(getAgent(created.id).id).toBe(created.id)
    })

    it('throws for unknown id', () => {
      expect(() => getAgent('unknown')).toThrow()
    })
  })

  describe('listAgents', () => {
    it('returns all agents', () => {
      createAgent({ name: 'a1', goal: 'g1' })
      createAgent({ name: 'a2', goal: 'g2' })
      expect(listAgents()).toHaveLength(2)
    })

    it('filters by status', () => {
      createAgent({ name: 'a1', goal: 'g1' })
      expect(listAgents('running')).toHaveLength(0)
      expect(listAgents('pending')).toHaveLength(1)
    })
  })

  describe('updateAgentStatus', () => {
    it('transitions pending -> running', () => {
      const agent = createAgent({ name: 'a', goal: 'g' })
      const updated = updateAgentStatus(agent.id, 'running')
      expect(updated.status).toBe('running')
    })

    it('throws on invalid transition', () => {
      const agent = createAgent({ name: 'a', goal: 'g' })
      expect(() => updateAgentStatus(agent.id, 'completed')).toThrow()
    })
  })

  describe('deleteAgent', () => {
    it('deletes a non-running agent', () => {
      const agent = createAgent({ name: 'a', goal: 'g' })
      deleteAgent(agent.id)
      expect(listAgents()).toHaveLength(0)
    })

    it('throws when deleting a running agent', () => {
      const agent = createAgent({ name: 'a', goal: 'g' })
      updateAgentStatus(agent.id, 'running')
      expect(() => deleteAgent(agent.id)).toThrow()
    })
  })
})
