# Contributing to MurMur Cloud Terminal

## Development Setup

```bash
git clone https://github.com/MrDiddyz/MurMur-Cloud-Terminal-.git
cd MurMur-Cloud-Terminal-
cp .env.example .env.local
npm install
npm run dev
```

## Quality Gates

All contributions must pass:

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript strict check
npm run test        # Jest unit tests
npm run build       # Next.js production build
```

## Branching

- `main` — protected, requires CI green + 1 review
- `feature/*` — new features
- `fix/*` — bug fixes
- `chore/*` — maintenance

## Pull Request Checklist

- [ ] Tests added/updated for changed behaviour
- [ ] `npm run typecheck` passes
- [ ] No new ESLint warnings
- [ ] Documentation updated if API changed

## Code Conventions

- TypeScript strict mode — no `any`
- All errors use `AppError` from `lib/errors.ts`
- All logging uses `getLogger()` from `lib/logger.ts`
- All external calls use `withRetry` + `CircuitBreaker`
- Zod schemas for all user-supplied input

## Commit Format

```
type(scope): short description

feat(agents): add bulk execution endpoint
fix(auth): handle expired token on refresh
chore(ci): pin actions to SHA
```
