# Current Sprint - Priority Tasks

## ✅ COMPLETED (Already Done)
- [x] Google OAuth integration
- [x] Theme switching (light/dark mode)
- [x] Language support (English/Hebrew/Arabic) with forced LTR
- [x] Portfolio table text visibility in both themes
- [x] Action color indicators (BUY=green, SELL=red, HOLD=gold)
- [x] Mobile interface scaling (30% scale)
- [x] Translation consistency
- [x] Render deployment TypeScript errors fixed
- [x] User model updated with Google OAuth support
- [x] Redis connection with graceful degradation
- [x] Helmet, CORS, rate limiting security
- [x] Distributed locks for schedulers
- [x] Database indexes
- [x] Health check endpoint
- [x] Request ID middleware
- [x] Notification system

## 🚀 HIGH PRIORITY (Sprint 1)
### Security & Validation
- [ ] Add CSRF protection (csurf)
- [ ] Apply Zod validation to all routes (currently partial)
- [ ] Add pre-save hook for stock-limit per plan

### Performance & Reliability
- [ ] Add lru-cache to stockDataService with 20s TTL
- [ ] Implement circuit breaker for API providers
- [ ] Provider fallback chain (Alpha Vantage → Finnhub → FMP)
- [ ] Optimize historical data storage (persist deltas only)

### Frontend Polish
- [ ] Centralize API calls in frontend/lib/api.ts
- [ ] Add SWR/React-Query for caching
- [ ] Add tooltips for stock metrics
- [ ] Skeleton loaders for loading states
- [ ] Mobile QA pass

## 💰 MEDIUM PRIORITY (Sprint 2)
### Stripe Integration
- [ ] Create Stripe account + Products
- [ ] Backend Stripe routes
- [ ] Frontend upgrade page
- [ ] Subscription enforcement middleware
- [ ] Test with Stripe test cards

### Analytics & Admin
- [ ] Event tracking (login, add_stock, decision_view)
- [ ] Admin analytics dashboard
- [ ] MRR and churn rate calculations

## 📚 DOCUMENTATION (Sprint 3)
- [ ] Update README with all features
- [ ] Architecture.md
- [ ] DataProviders.md
- [ ] DecisionEngine.md
- [ ] API documentation

## 🧪 TESTING (Sprint 4)
- [ ] Unit tests for decision engine
- [ ] Integration tests for auth flow
- [ ] E2E tests with Playwright

## 📝 NOTES
- Test locally before each push
- Run build checks
- Ask before pushing to production
- Mark tasks as complete in TODO files as we go

