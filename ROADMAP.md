# MurMur Cloud Terminal — Roadmap

## v1.0 — Production Slice (Current)

**Scope lock**: Core API + Agent Lifecycle + Basic Observability

### Milestone 1.0 — Foundation ✅
- [x] Project scaffold (Next.js 14, TypeScript strict)
- [x] Config validation at startup
- [x] Structured logging (pino)
- [x] Typed error system with HTTP mappings
- [x] Retry utility with exponential back-off + jitter
- [x] Circuit breaker for external dependencies

### Milestone 1.1 — Agent API ✅
- [x] `POST /api/agents` — create agent
- [x] `GET /api/agents` — list agents (with status filter)
- [x] `GET /api/agents/:id` — get agent
- [x] `PATCH /api/agents/:id` — update agent status
- [x] `DELETE /api/agents/:id` — delete agent
- [x] `POST /api/agents/:id/execute` — execute agent goal
- [x] Agent state machine (pending→running→completed/failed/paused)

### Milestone 1.2 — Reliability ✅
- [x] Circuit breaker around Redis + database
- [x] Retry with back-off on execution
- [x] Health endpoint (`GET /api/health`)
- [x] Readiness endpoint (`GET /api/readiness`)
- [x] Prometheus metrics endpoint (`GET /api/metrics`)

### Milestone 1.3 — Quality Gates ✅
- [x] Unit tests for config, errors, retry, circuit-breaker, agent-manager
- [x] CI pipeline (lint + typecheck + test + build)
- [x] Security scan (CodeQL + npm audit)

### Milestone 1.4 — Hardening (Next)
- [ ] PostgreSQL integration (replace in-memory store)
- [ ] Redis integration (replace stubs)
- [ ] JWT auth enforcement on mutation endpoints
- [ ] Rate limiting per tenant
- [ ] End-to-end smoke tests

---

## v1.5 — Multi-Agent Coordination

**Acceptance criteria**: Multiple agents can collaborate on a single goal, with dependency resolution and shared state.

- [ ] Agent dependency graph
- [ ] Shared context store
- [ ] Parallel execution scheduler
- [ ] Inter-agent messaging over Redis pub/sub

---

## v2.0 — Distributed Constellation Mesh

**Acceptance criteria**: Agents run across multiple nodes with automatic failover and load distribution.

- [ ] Worker pool abstraction (Kubernetes Jobs)
- [ ] Distributed task queue
- [ ] Node health federation
- [ ] Global event mesh

---

## Frozen (until after v1.0 launch)
- Advanced ML model routing
- Multi-cloud deployment
- Plugin system
- Billing and usage tracking
