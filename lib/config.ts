import { z } from 'zod'

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32).optional(),
  JWT_ISSUER: z.string().default('murmur-cloud-terminal'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  ENABLE_WEBSOCKET: z.coerce.boolean().default(true),
  ENABLE_METRICS: z.coerce.boolean().default(true),
})

export type Config = z.infer<typeof configSchema>

let _config: Config | null = null

export function getConfig(): Config {
  if (_config) return _config

  const result = configSchema.safeParse(process.env)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Configuration validation failed:\n${issues}`)
  }
  _config = result.data
  return _config
}

export function resetConfig(): void {
  _config = null
}
