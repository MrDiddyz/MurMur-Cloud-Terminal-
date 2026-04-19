export interface RetryOptions {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  jitter?: boolean
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 5000,
  jitter: true,
}

function computeDelay(attempt: number, opts: RetryOptions): number {
  const exponential = Math.min(opts.baseDelayMs * 2 ** attempt, opts.maxDelayMs)
  return opts.jitter ? exponential * (0.5 + Math.random() * 0.5) : exponential
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  isRetryable: (err: unknown) => boolean = () => true,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown
  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt + 1 >= opts.maxAttempts || !isRetryable(err)) {
        throw err
      }
      const delay = computeDelay(attempt, opts)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
}
