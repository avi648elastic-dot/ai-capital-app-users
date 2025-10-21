# 📋 AI Capital - Remaining Tasks

**Last Updated:** October 10, 2025  
**Current Status:** 70% Complete (Production-Ready MVP)

---

## 🔴 HIGH PRIORITY (Do Next - Weeks 1-2)

### 1. Security Hardening
- [ ] **Add CSRF Protection** (`backend/src/middleware/`)
  - Install `csurf` package
  - Create CSRF middleware
  - Apply to all POST/PUT/DELETE endpoints
  - Update frontend to include CSRF tokens in requests
  - **Impact:** Critical security requirement for production

### 2. Complete Request Validation
- [ ] **Apply Zod validation to remaining routes**
  - Add schemas for: notifications, analytics, markets, admin
  - Apply `validate()` middleware to all endpoints
  - Test with invalid inputs
  - **Current Coverage:** ~60% → Target: 100%
  - **Files:** `backend/src/routes/notifications.ts`, `analytics.ts`, `markets.ts`, `admin.ts`

### 3. Performance Optimization
- [ ] **Install LRU Cache for Stock Data**
  - Install `lru-cache` package
  - Add 20-second TTL cache in `stockDataService.ts`
  - Track cache hit/miss rates
  - Log cache performance metrics
  - **Impact:** Reduce API calls by 80-90%

- [ ] **Add Circuit Breaker Pattern**
  - Implement circuit breaker in `stockDataService.ts`
  - Track provider health (open/closed/half-open states)
  - Auto-disable failing providers
  - Auto-recovery after cooldown period
  - **Impact:** Prevent cascade failures

### 4. Core Testing
- [ ] **Write Critical Unit Tests**
  - `decisionEngine.ts` - scoring logic (10+ test cases)
  - `stockDataService.ts` - fallback chain
  - Portfolio calculations - P&L, percentages
  - **Target:** 50% code coverage minimum
  - **Tools:** Jest + Supertest

---

## 🟡 MEDIUM PRIORITY (Weeks 3-4)

### 5. Database Improvements
- [ ] **Add Pre-Save Hook for Stock Limits**
  - Enforce limits in `Portfolio.ts` model
  - Free: 10 stocks, Premium: 15, Premium+: 20
  - Throw validation error if exceeded
  - Test with all subscription tiers

- [ ] **Optimize Historical Data Storage**
  - Store only deltas (price changes)
  - Not full snapshots every time
  - Reduce database size by 60-70%
  - **File:** `backend/src/services/historicalDataService.ts`

### 6. Scheduler Improvements
- [ ] **Update Scheduler Upsert Logic**
  - Upsert by composite key: `(portfolioId, symbol, date)`
  - Prevent duplicate historical data entries
  - Add retry logic for failed updates
  - **File:** `backend/src/services/schedulerService.ts`

### 7. Frontend Enhancements
- [ ] **Create Centralized API Client**
  - Create `frontend/lib/api.ts`
  - Centralize all fetch calls
  - Add Zod response validation
  - Unified error handling and toasts
  - Type-safe DTOs for all endpoints

- [ ] **Add SWR or React Query**
  - Install SWR or React Query
  - Replace manual fetch with hooks
  - Automatic caching and revalidation
  - Optimistic updates
  - **Impact:** Better UX, less API calls

- [ ] **UI Polish**
  - Add tooltips for metrics (hover explanations)
  - Add skeleton loaders to all async sections
  - Loading states for all data fetches
  - Empty states with helpful messages

### 8. Integration Testing
- [ ] **Write Integration Tests**
  - Auth flow: signup → login → logout
  - Onboarding flow: Step 0 → 1 → 2 → 3
  - Portfolio flow: add stock → update → delete
  - Admin flow: view users → refresh → update
  - **Target:** Cover all critical paths

### 9. E2E Testing
- [ ] **Write Playwright Tests**
  - Login and signup flows
  - Add stock to portfolio
  - View AI decisions
  - Check analytics pages
  - Mobile responsiveness
  - **Target:** 5-10 critical scenarios

---

## 🟢 LOW PRIORITY (Weeks 5-8)

### 10. Documentation
- [ ] **Create Architecture Documentation**
  - `docs/Architecture.md`
  - System diagrams (use Mermaid or draw.io)
  - Component overview
  - Data flow diagrams
  - Database schema

- [ ] **Document Data Providers**
  - `docs/DataProviders.md`
  - API endpoints used
  - Rate limits and pricing
  - Fallback chain logic
  - Error handling strategies

- [ ] **Document Decision Engine**
  - `docs/DecisionEngine.md`
  - Scoring algorithm details
  - Weight explanations
  - Signal definitions
  - Example calculations

- [ ] **Create Operations Runbook**
  - `docs/Runbook.md`
  - Deployment procedures
  - Monitoring and alerts
  - Troubleshooting guides
  - Backup and recovery

---

## 💰 PAID FEATURES (Part 2 - Weeks 9-12)

### 11. Stripe Integration
- [ ] **Setup Stripe Account**
  - Create products: Premium ($9.99/mo), Premium+ ($19.99/mo)
  - Get API keys (test and production)
  - Configure webhook endpoint
  - **Estimated Time:** 1 day

- [ ] **Backend Stripe Implementation**
  - Create `backend/src/routes/stripe.ts`
  - POST `/api/stripe/create-checkout-session`
  - POST `/api/stripe/webhook` (verify signature)
  - Handle events: checkout.session.completed, subscription.updated/deleted
  - Update user subscription in database
  - **Estimated Time:** 2-3 days

- [ ] **Frontend Upgrade Flow**
  - Create `frontend/app/upgrade/page.tsx`
  - Display plan comparison cards
  - Stripe checkout redirect
  - Success and cancel pages
  - Show current plan in profile
  - **Estimated Time:** 2 days

- [ ] **Subscription Enforcement**
  - Middleware to check plan limits
  - Frontend feature guards (conditional rendering)
  - Weekly cron to auto-downgrade expired users
  - Grace period handling
  - **Estimated Time:** 1-2 days

- [ ] **Testing & Deployment**
  - Test with Stripe test cards
  - Simulate webhooks via Stripe CLI
  - Test upgrade/downgrade flows
  - Test payment failures
  - Deploy webhook URL to production
  - **Estimated Time:** 2 days

---

## 📊 ANALYTICS & RETENTION (Part 3 - Future)

### 12. Event Tracking
- [ ] Add events collection to MongoDB
- [ ] Track: login, add_stock, decision_view, upgrade, etc.
- [ ] Create `/api/admin/analytics/summary` endpoint
- [ ] Calculate MRR (Monthly Recurring Revenue)
- [ ] Calculate churn rate

### 13. Admin Analytics Dashboard
- [ ] Create `/app/admin/analytics/page.tsx`
- [ ] Line charts for MRR and active users (Recharts)
- [ ] Table of churned users (last 7/30 days)
- [ ] Conversion funnel visualization
- [ ] Export data to CSV

### 14. Retention & Engagement
- [ ] Email templates ("Come back to AI Capital")
- [ ] Cron job to detect inactive users (>30 days)
- [ ] Add `invitedBy` and `utmSource` fields to User model
- [ ] Track referral sources
- [ ] Weekly portfolio summary emails

---

## 🚀 MARKETING & GROWTH (Part 4 - Future)

### 15. Public Landing Pages
- [ ] Create `/app/pricing/page.tsx` - Plan comparison
- [ ] Create `/app/about/page.tsx` - About us
- [ ] Create `/app/blog/page.tsx` - Blog/articles
- [ ] Add OpenGraph and JSON-LD metadata
- [ ] SEO optimization

### 16. Marketing Automation
- [ ] Integrate Mailchimp/Brevo/SendGrid
- [ ] Sync users to mailing list
- [ ] Welcome email series
- [ ] Payment failed alert emails
- [ ] Weekly newsletter

### 17. Analytics & Tracking
- [ ] Connect Plausible or GA4
- [ ] Track page views and conversions
- [ ] Monitor user journey
- [ ] A/B testing setup

---

## 📈 Progress Tracking

### Completion by Category:
- ✅ **Core Infrastructure:** 95% complete
- ✅ **Security & Middleware:** 85% complete
- ✅ **Database & Models:** 90% complete
- ✅ **Authentication:** 100% complete
- ✅ **Frontend UI:** 75% complete
- ⏳ **Testing:** 15% complete
- ⏳ **Documentation:** 30% complete
- ❌ **Stripe Integration:** 0% complete
- ❌ **Analytics Tracking:** 0% complete
- ❌ **Marketing Features:** 0% complete

### Overall Progress: **70% Complete**

---

## 🎯 Recommended Execution Order

### Sprint 1 (Week 1-2): Security & Performance
1. Add CSRF protection ✅ **Critical**
2. Complete request validation ✅ **Critical**
3. Add LRU cache ✅ **High impact**
4. Add circuit breaker ✅ **High impact**
5. Write core unit tests ✅ **Quality assurance**

### Sprint 2 (Week 3-4): Polish & Testing
1. Add pre-save hooks
2. Frontend API client
3. Add SWR/React Query
4. UI tooltips and skeleton loaders
5. Integration tests
6. E2E tests (critical flows)

### Sprint 3 (Week 5-6): Documentation & Cleanup
1. Architecture documentation
2. Data providers documentation
3. Decision engine documentation
4. Operations runbook
5. Code cleanup and refactoring

### Sprint 4 (Week 7-10): Monetization
1. Stripe setup
2. Backend Stripe routes
3. Frontend upgrade flow
4. Subscription enforcement
5. Testing and deployment

### Sprint 5+ (Week 11+): Growth
1. Event tracking
2. Admin analytics
3. Retention emails
4. Landing pages
5. Marketing automation

---

## 💡 Quick Wins (Can Do in 1-2 Hours)

These are small tasks that provide immediate value:

1. ✅ **Add tooltips to portfolio metrics** - Better UX
2. ✅ **Add skeleton loaders** - Professional feel
3. ✅ **Update .env.example** - Better onboarding
4. ✅ **Add more inline code comments** - Maintainability
5. ✅ **Create simple health dashboard page** - Monitoring
6. ✅ **Add "Last updated" timestamps** - Transparency
7. ✅ **Improve error messages** - Better debugging
8. ✅ **Add loading states to buttons** - UX polish

---

## 📝 Notes

- **Production-Ready:** The app is already deployable and functional
- **No Blockers:** All remaining tasks are enhancements
- **Incremental:** Can ship to production and iterate
- **Prioritize:** Focus on security and testing before monetization
- **User Feedback:** Consider gathering feedback before building all features

---

## 🆘 Need Help?

- **Deployment Issues:** See `RENDER_DEPLOYMENT_FIX.md`
- **Progress Status:** See `PROGRESS_SUMMARY.md`
- **Quick Reference:** See `QUICK_FIX_SUMMARY.md`
- **Original TODOs:** See `TODO-Part1.md` through `TODO-Part4.md`

---

**Next Action:** Start with Sprint 1 (Security & Performance) 🚀

