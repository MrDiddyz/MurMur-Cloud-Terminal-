# MurMur Cloud Terminal — Operations Runbook

## Health Checks

| Endpoint | Expected | Action if failing |
|---|---|---|
| `GET /api/health` | `{"status":"healthy"}` 200 | Check circuit breaker states in response; investigate Redis/DB |
| `GET /api/readiness` | `{"ready":true}` 200 | Pod not ready; check logs for startup errors |
| `GET /api/metrics` | Prometheus text 200 | Check application logs |
| `GET /api/analytics?limit=20` | JSON stats + recent executions 200 | Validate execution flow and persistence path |

## Circuit Breaker Recovery

If `GET /api/health` returns `"status":"degraded"`:

1. Check which dependency is `OPEN` in the response `dependencies` field
2. Verify that service (Redis or database) is reachable
3. Circuit breaker auto-transitions to `HALF_OPEN` after `timeoutMs` (default 30 s)
4. If service is restored, the next successful call will close the circuit
5. If service remains down, investigate infrastructure

## Incident Response

### P0 — Service completely down
1. Check pod logs: look for startup errors or panic
2. Verify env vars: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`
3. Roll back to previous deployment if introduced by a release
4. Escalate to on-call platform engineer

### P1 — Agents stuck in `running`
1. `GET /api/agents?status=running` — list stuck agents
2. `PATCH /api/agents/:id` with `{"status":"failed"}` to unstick
3. Check execution-engine logs for the agent ID
4. Investigate Redis connectivity (event publish failures)

### P2 — High error rate
1. Check `GET /api/metrics` for `murmur_agents_total{status="failed"}`
2. Check `GET /api/analytics` for success/failure ratios and average durations
3. Review structured logs filtered by `"component":"execution-engine"`
4. Check circuit breaker states

## Log Queries

Structured logs use JSON. Key fields:

```
service       = "murmur-cloud-terminal"
component     = "agent-manager" | "execution-engine" | "api:agents"
agentId       = "<uuid>"
```

Example filter (jq):
```bash
kubectl logs deployment/murmur -f | jq 'select(.component == "execution-engine" and .level == "error")'
```

## Rollback Procedure

1. Identify the last good release tag
2. `kubectl set image deployment/murmur app=murmur:$LAST_GOOD_TAG`
3. Verify `GET /api/health` returns healthy
4. Open post-mortem issue
