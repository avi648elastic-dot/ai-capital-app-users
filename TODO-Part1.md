# 🧭 AI-Capital Production Hardening Plan
**Goal:** Strengthen the app from MVP → production-grade for paid tiers  
**Duration:** ~1 week sprint  

---

## SECURITY & MIDDLEWARE (`backend/src/app.ts`)
- [ ] Install `helmet`, `express-rate-limit`, `cors`, `cookie-parser`
- [ ] Add `helmet()` and `rateLimit()` (300 req/min)
- [ ] Restrict CORS to Vercel + admin domains; enable credentials
- [ ] Add CSRF protection (`csurf`)
- [ ] Secure cookies (`httpOnly`, `sameSite=Lax`, `secure` in prod)
- [ ] Central error handler middleware (JSON + logging)

## REQUEST VALIDATION (`backend/src/middleware/validate.ts`)
- [ ] Install `zod`
- [ ] Create `validate(schema)` middleware
- [ ] Define request schemas in `backend/src/schemas/*`
- [ ] Apply validation to all API routes (auth, onboarding, portfolio)
- [ ] Reject invalid symbols / missing params before controller logic

## DATA & INDEX OPTIMIZATION (`backend/src/models`)
- [ ] Add MongoDB indexes:
  - users: `{ email: 1 } unique`
  - portfolios: `{ userId: 1, type: 1 }`
  - historicaldata: `{ symbol: 1, date: -1 }`
- [ ] Add pre-save hook to enforce stock limit per plan
- [ ] Run `Model.ensureIndexes()` on startup
- [ ] Benchmark heavy queries with `.explain()`

## MARKET-DATA SERVICE (`backend/src/services/stockDataService.ts`)
- [ ] Install `lru-cache`
- [ ] Implement symbol-scoped LRU cache (max 2000, ttl 20s)
- [ ] Add retry/backoff logic (3 tries, 500ms delay)
- [ ] Build provider fallback chain: [finnhub, alphaVantage, yahoo]
- [ ] Add circuit breaker (disable provider on repeated errors)
- [ ] Cache historical data; only request deltas
- [ ] Log provider latency and cache hit rate

## CRON & JOB STABILITY (`backend/src/services/schedulerService.ts`)
- [ ] Install and connect `redis` (`REDIS_URL`)
- [ ] Implement distributed lock (SET NX PX)
- [ ] Wrap cron jobs with `withLock()` helper
- [ ] Upsert by `(portfolioId, symbol, date)` to prevent duplicates
- [ ] Add job logs: "Skipped run – lock held"
- [ ] Gracefully handle provider downtime (retry next cycle)

## HEALTH & LOGGING
- [ ] Install `pino` + `pino-http`
- [ ] Add `requestId` middleware (uuid)
- [ ] Log method, path, duration, and requestId
- [ ] Implement `/healthz` endpoint returning `{ status, uptime }`
- [ ] Configure Render health check to `/healthz`
- [ ] Integrate optional Sentry or Logtail transport

## FRONTEND API CONSOLIDATION (`frontend/lib/api.ts`)
- [ ] Create centralized `api.ts` for all fetch requests
- [ ] Add Zod validation for responses
- [ ] Unify error handling (map status → toast)
- [ ] Use SWR/React-Query for caching
- [ ] Apply consistent base URL from env
- [ ] Add type-safe DTOs for each API call

## FRONTEND UX POLISH
- [ ] Add tooltips for "This month %" vs "Last month %"
- [ ] Display "Last updated: …" under market indices
- [ ] Add plan-based feature flags (Free / Premium / Premium+)
- [ ] Use unified number formatters (currency, percent)
- [ ] Add skeleton loaders for async sections
- [ ] Confirm full mobile responsiveness on major screens

## TESTING INFRASTRUCTURE
- [ ] Install `jest`, `supertest`, `ts-jest`
- [ ] Unit tests:
  - [ ] DecisionEngine scoring
  - [ ] StockDataService fallback chain
  - [ ] Portfolio limit enforcement
- [ ] Integration tests:
  - [ ] Auth → onboarding → portfolio add → decision fetch
- [ ] E2E tests with Playwright:
  - [ ] login → add stock → see decision
- [ ] Add `"test": "jest"` to package.json
- [ ] Configure CI to run tests before deploy

## DEVOPS & ENVIRONMENT
- [ ] Convert Dockerfile to multi-stage build (build → run)
- [ ] Ensure `NODE_ENV=production` and `npm ci --omit=dev`
- [ ] Add `.env.example` with all required vars (no secrets)
- [ ] Update `docker-compose.yml` to reference `.env`
- [ ] Add Render health checks and env var docs
- [ ] Enable auto-deploy triggers from GitHub main branch
- [ ] Stream Pino logs to Sentry or Logtail

## DOCUMENTATION (`/docs`)
- [ ] `Architecture.md` – overview + diagram
- [ ] `DataProviders.md` – API sources + fallback logic
- [ ] `DecisionEngine.md` – weights, signals, risk scoring
- [ ] `Runbook.md` – deploy & troubleshooting
- [ ] Update root `README.md` with production setup + paid tiers

## DEPLOY VALIDATION CHECKLIST
- [ ] All env vars configured on Render + Vercel
- [ ] Redis lock tested successfully
- [ ] `/healthz` returns ok in Render dashboard
- [ ] Rate limiter verified (no 429s under load)
- [ ] Sentry receiving backend error events
- [ ] Test Premium user limit enforcement (3 portfolios × 15 stocks)
- [ ] Run end-to-end smoke test on live deployment
