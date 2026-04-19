import { withRetry } from '@/lib/retry'

describe('withRetry', () => {
  it('returns result on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('ok')
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 0 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries and succeeds on second attempt', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok')
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, jitter: false })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws after max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'))
    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 0 }),
    ).rejects.toThrow('always fails')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does not retry when isRetryable returns false', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fatal'))
    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 0 }, () => false),
    ).rejects.toThrow('fatal')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
