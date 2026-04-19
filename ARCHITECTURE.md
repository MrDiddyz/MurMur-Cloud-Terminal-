# MurMur Cloud Terminal — Architecture

## Overview

MurMur Cloud Terminal is a cloud-native execution environment for autonomous AI agents. It provides lifecycle management, secure goal execution, real-time event propagation, and structured observability.

---

## Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser / CLI)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                      Next.js App Layer                           │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────────┐ │
│  │  /api/agents │  │  /api/health  │  │  /api/metrics (Prom)  │ │
│  └──────┬───────┘  └───────────────┘  └───────────────────────┘ │
└─────────┼───────────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────────┐
│                    Service Layer                                  │
│  ┌──────────────────┐    ┌────────────────────────────────────┐  │
│  │   AgentManager   │    │         ExecutionEngine            │  │
│  │  - CRUD + FSM    │    │  - withRetry + CircuitBreaker      │  │
│  │  - In-mem store  │    │  - Event publish (Redis stub)      │  │
│  │  (→ Postgres)    │    │  - Result persist (Postgres stub)  │  │
│  └──────────────────┘    └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                          │
┌─────────▼──────────┐   ┌──────────▼─────────┐
│  PostgreSQL /       │   │  Redis Event Bus    │
│  Supabase           │   │  (ioredis)          │
└────────────────────┘   └────────────────────┘
```

---

## Data Flows

### Agent Creation
1. `POST /api/agents` → JSON body validated with Zod
2. `AgentManager.createAgent()` validates name uniqueness + creates record
3. Agent saved in store (id, name, goal, status=pending, timestamps)
4. 201 response returned

### Agent Execution
1. `POST /api/agents/:id/execute`
2. `ExecutionEngine.executeAgent(id)` → transitions agent to `running`
3. Goal processed (with retry, max 3 attempts, exponential back-off)
4. On success → agent → `completed`, result persisted via `dbBreaker`
5. On failure → agent → `failed`
6. Event published to Redis channel via `redisBreaker`

### Health Check
1. `GET /api/health` → reads circuit breaker states
2. Returns `healthy` (200) or `degraded` (503) based on breaker states

---

## Failure Modes

| Scenario | Behaviour |
|---|---|
| Redis unavailable | `redisBreaker` opens after 3 failures; event publish skipped; agent execution continues |
| Database unavailable | `dbBreaker` opens; result persist skipped; agent marked completed/failed locally |
| Agent goal panics | Caught in try/catch; agent set to `failed`; error logged |
| Invalid JWT | 401 returned; request rejected before handler |
| Schema validation failure | 400 returned with field-level details |

---

## State Machine (Agent)

```
pending ──▶ running ──▶ completed
   │            │
   └──▶ failed  └──▶ paused ──▶ running
                    │
                    └──▶ failed
```

---

## Security

- **JWT authentication** (HS256, 8-hour TTL) on control-plane endpoints
- **Role-based access control**: `admin`, `operator`, `viewer`
- **Security headers**: X-Frame-Options, CSP, X-Content-Type-Options
- **Input validation**: Zod schemas on all API routes
- **Config validation**: Startup-time check with clear error messages

---

## Observability

| Signal | Location | Format |
|---|---|---|
| Structured logs | stdout | JSON (pino); pretty in dev |
| Prometheus metrics | `GET /api/metrics` | OpenMetrics text |
| Health check | `GET /api/health` | JSON |
| Readiness probe | `GET /api/readiness` | JSON |
| Circuit breaker state | included in health + metrics | — |

---

## Infrastructure Requirements

| Component | Minimum | Notes |
|---|---|---|
| Node.js | 20 LTS | Required by Next.js 14 |
| PostgreSQL | 15 | Optional in v1; in-memory fallback active |
| Redis | 7 | Optional in v1; stubs active |
| Memory | 512 MB | Per pod |
| CPU | 0.25 vCPU | Per pod |

---

## Ownership

| Area | Owner |
|---|---|
| API Layer | Platform team |
| Execution Engine | AI Infra team |
| Database / Persistence | Data team |
| Observability | SRE |
