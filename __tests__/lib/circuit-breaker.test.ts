import { CircuitBreaker } from '@/lib/circuit-breaker'

describe('CircuitBreaker', () => {
  it('starts CLOSED', () => {
    const cb = new CircuitBreaker('test')
    expect(cb.getState()).toBe('CLOSED')
  })

  it('passes through successful calls', async () => {
    const cb = new CircuitBreaker('test')
    const result = await cb.execute(() => Promise.resolve('ok'))
    expect(result).toBe('ok')
    expect(cb.getState()).toBe('CLOSED')
  })

  it('opens after failure threshold', async () => {
    const cb = new CircuitBreaker('test', { failureThreshold: 2, timeoutMs: 10_000, successThreshold: 2 })
    const fail = () => Promise.reject(new Error('fail'))
    await expect(cb.execute(fail)).rejects.toThrow()
    await expect(cb.execute(fail)).rejects.toThrow()
    expect(cb.getState()).toBe('OPEN')
  })

  it('rejects calls when OPEN', async () => {
    const cb = new CircuitBreaker('test', { failureThreshold: 1, timeoutMs: 10_000, successThreshold: 1 })
    await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow()
    await expect(cb.execute(() => Promise.resolve('ok'))).rejects.toThrow('OPEN')
  })
})
