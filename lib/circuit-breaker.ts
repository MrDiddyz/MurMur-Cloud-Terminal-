export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerOptions {
  failureThreshold: number
  successThreshold: number
  timeoutMs: number
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  successThreshold: 2,
  timeoutMs: 30_000,
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failures = 0
  private successes = 0
  private nextAttemptTime = 0
  private readonly opts: CircuitBreakerOptions
  public readonly name: string

  constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.name = name
    this.opts = { ...DEFAULT_OPTIONS, ...options }
  }

  getState(): CircuitState {
    return this.state
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(`Circuit breaker [${this.name}] is OPEN`)
      }
      this.state = 'HALF_OPEN'
      this.successes = 0
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (err) {
      this.onFailure()
      throw err
    }
  }

  private onSuccess(): void {
    this.failures = 0
    if (this.state === 'HALF_OPEN') {
      this.successes++
      if (this.successes >= this.opts.successThreshold) {
        this.state = 'CLOSED'
        this.successes = 0
      }
    }
  }

  private onFailure(): void {
    this.failures++
    if (this.state === 'HALF_OPEN' || this.failures >= this.opts.failureThreshold) {
      this.state = 'OPEN'
      this.nextAttemptTime = Date.now() + this.opts.timeoutMs
      this.failures = 0
    }
  }
}
