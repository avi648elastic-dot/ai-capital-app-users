## SECURITY & MIDDLEWARE (`backend/src/app.ts`)
- [x] Install helmet, express-rate-limit, cors, cookie-parser
- [x] Add helmet() and rateLimit() (300 req/min)
- [x] Restrict CORS to Vercel + admin domains; enable credentials
- [ ] Add CSRF protection (csurf)
- [x] Secure cookies (httpOnly, sameSite=Lax, secure in prod)
- [x] Central error handler middleware (JSON + logging)

## REQUEST VALIDATION (`backend/src/middleware/validate.ts`)
- [x] Install zod
- [x] Build validate(schema) middleware
- [x] Create schemas in /schemas
- [ ] Apply to all auth / portfolio routes (partially done, needs full coverage)

## DATA & INDEX OPTIMIZATION (`backend/src/models`)
- [x] Add indexes (users, portfolios, historicaldata)
- [ ] Pre-save hook for stock-limit per plan
- [x] Run ensureIndexes() on startup

## MARKET-DATA SERVICE (`backend/src/services/stockDataService.ts`)
- [ ] Add lru-cache with 20 s TTL + provider fallback + retry
- [ ] Circuit breaker on provider failures
- [ ] Persist historical deltas only

## CRON & JOB STABILITY (`backend/src/services/schedulerService.ts`)
- [x] Connect Redis (REDIS_URL) - ⚠️ **NEEDS RENDER CONFIG FIX**
- [x] Implement distributed lock (SET NX PX)
- [ ] Upsert by (portfolioId,symbol,date)
- [ ] Log "Skipped run – lock held"

## HEALTH & LOGGING
- [x] Use pino + requestId middleware
- [x] /healthz → { status, uptime }
- [x] Configure Render healthcheck

## FRONTEND API (`frontend/lib/api.ts`)
- [ ] Centralize fetch calls + Zod validation + error mapper
- [ ] Use SWR / React-Query cache

## FRONTEND UX POLISH
- [ ] Tooltips for "This month %" vs "Last month %"
- [ ] Plan-based feature flags & formatters
- [ ] Skeleton loaders + mobile QA

## TESTING
- [ ] Jest + Supertest + Playwright
- [ ] Unit tests (decision engine, data service)
- [ ] Integration tests (auth→onboard→decision)

## DEVOPS
- [ ] Multi-stage Dockerfile (build→run)
- [ ] .env.example (no secrets)
- [ ] Render health + Sentry logs

## DOCUMENTATION (/docs)
- [ ] Architecture.md
- [ ] DataProviders.md
- [ ] DecisionEngine.md
- [ ] Runbook.md
- [ ] Update README with paid-tier notes
