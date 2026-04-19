# AGENTS.md — AI Agent Guidelines for MurMur Cloud Terminal

## Project Context

MurMur Cloud Terminal is a Next.js 14 TypeScript application providing a REST API for autonomous AI agent lifecycle management. The codebase uses strict TypeScript, Zod validation, pino logging, and circuit-breaker patterns.

## Repository Structure

```
app/                  Next.js App Router pages and API routes
  api/
    agents/           Agent CRUD + execution endpoints
    health/           Health check
    readiness/        Kubernetes readiness probe
    metrics/          Prometheus metrics
lib/                  Shared utilities
  config.ts           Env config with Zod validation
  logger.ts           Pino structured logger
  errors.ts           Typed AppError + helpers
  retry.ts            Exponential back-off retry
  circuit-breaker.ts  Circuit breaker pattern
  auth.ts             JWT sign/verify + route guard
services/             Business logic
  agent-manager.ts    Agent CRUD + state machine
  execution-engine.ts Agent execution + event/db stubs
__tests__/            Jest unit tests (mirrors src structure)
docs/                 Runbook and release checklist
```

## Coding Standards

- **TypeScript strict** — no `any`, no `// @ts-ignore`
- **Error handling** — always use `AppError` from `lib/errors.ts`; use `toApiError()` in route handlers
- **Logging** — always use `getLogger('component-name')` from `lib/logger.ts`
- **Validation** — Zod schemas for all user-supplied input; validate at the API boundary
- **External calls** — wrap with `withRetry` and `CircuitBreaker` from lib/
- **State transitions** — agent status changes must go through `updateAgentStatus()` which enforces the FSM

## API Conventions

- Routes live in `app/api/<resource>/route.ts`
- Dynamic segments: `app/api/<resource>/[id]/route.ts`
- Always return `NextResponse.json(...)` with explicit status codes
- Errors: use `toApiError(err)` to convert any error to `{ statusCode, body }`
- 201 for creation, 204 for deletion, 200 for reads/updates, 422 for failed execution

## Testing

- Test files in `__tests__/` mirroring the source structure
- Mock `pino` and `pino-pretty` in all service tests (avoids transport issues)
- Use `_clearStore()` in `beforeEach` for agent-manager tests
- Run: `npm run test` (jest) or `npm run test:coverage`

## Agent Status Machine

```
pending → running → completed
pending → failed
running → paused → running
running → failed
paused  → failed
```

Terminal states (`completed`, `failed`) have no outgoing transitions.

## Environment Variables

See `.env.example` for the full list. Key vars:
- `JWT_SECRET` — must be ≥ 32 characters
- `DATABASE_URL` — PostgreSQL connection string (optional; in-memory fallback active)
- `REDIS_URL` — Redis connection string (optional; stubs active)
- `LOG_LEVEL` — one of: trace, debug, info, warn, error, fatal

## What NOT to Do

- Do not bypass the `updateAgentStatus()` FSM — write directly to the store
- Do not use `console.log` — use `getLogger()`
- Do not throw plain `Error` in service/API code — use `AppError` helpers
- Do not add new environment variables without updating `.env.example` and `lib/config.ts`
- Do not modify `.github/workflows/datadog-synthetics.yml`
