import pino from 'pino'
import { getConfig } from './config'

let _logger: pino.Logger | null = null

export function getLogger(name?: string): pino.Logger {
  if (!_logger) {
    const cfg = getConfig()
    _logger = pino({
      level: cfg.LOG_LEVEL,
      base: { service: 'murmur-cloud-terminal', env: cfg.NODE_ENV },
      timestamp: pino.stdTimeFunctions.isoTime,
      ...(cfg.NODE_ENV !== 'production' && {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }),
    })
  }
  return name ? _logger.child({ component: name }) : _logger
}
