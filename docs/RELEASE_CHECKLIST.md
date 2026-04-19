# Release Checklist

## Pre-Release

- [ ] All CI checks green (lint, typecheck, tests, build)
- [ ] Security scan shows no high/critical vulnerabilities (`npm audit --audit-level=high`)
- [ ] CHANGELOG updated
- [ ] Version bumped in `package.json`
- [ ] `.env.example` reflects any new environment variables

## Staging Validation

- [ ] `GET /api/health` returns `{"status":"healthy"}`
- [ ] `GET /api/readiness` returns `{"ready":true}`
- [ ] `POST /api/agents` creates an agent successfully
- [ ] `POST /api/agents/:id/execute` runs and completes
- [ ] `GET /api/metrics` returns Prometheus text
- [ ] No error spikes in logs over 10-minute soak

## Production Rollout

- [ ] Deploy to 10% of traffic (canary)
- [ ] Monitor error rate for 15 minutes
- [ ] If error rate < 1%, promote to 100%
- [ ] If error rate > 1%, roll back immediately

## Post-Release

- [ ] `GET /api/health` healthy on all pods
- [ ] Confirm circuit breakers are CLOSED
- [ ] Tag the release in GitHub
- [ ] Notify stakeholders

## Rollback Criteria

Trigger rollback if within 30 minutes of deploy:
- Error rate > 5%
- P99 latency > 2 s on `/api/agents`
- Any circuit breaker transitions to OPEN
- Any unhandled exception in logs
