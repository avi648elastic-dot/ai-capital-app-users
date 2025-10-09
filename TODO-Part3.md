# 📊 Analytics & User Retention
**Goal:** Understand usage + reduce churn + track revenue

---

## USER ANALYTICS (`backend/src/services/analyticsService.ts`)
- [ ] Track user actions: login, portfolio_add, decision_view, upgrade_click
- [ ] Store in `user_events` collection with timestamp, userId, action, metadata
- [ ] Add page view tracking (frontend → backend)
- [ ] Implement cohort analysis (retention by signup week)
- [ ] Track feature usage by subscription tier

## ADMIN ANALYTICS DASHBOARD (`frontend/app/(app)/admin/analytics/page.tsx`)
- [ ] User growth chart (daily/weekly signups)
- [ ] Revenue metrics (MRR, ARR, churn rate)
- [ ] Feature adoption rates
- [ ] Geographic distribution of users
- [ ] Most popular stocks/tickers
- [ ] Portfolio performance distribution

## USER RETENTION TOOLS
- [ ] Email sequences for inactive users (7, 14, 30 days)
- [ ] Onboarding completion tracking
- [ ] Feature discovery prompts for new users
- [ ] Usage-based upgrade suggestions
- [ ] Win-back campaigns for churned users

## PERFORMANCE MONITORING
- [ ] Add performance metrics to admin dashboard
- [ ] Track API response times
- [ ] Monitor error rates by endpoint
- [ ] Database query performance monitoring
- [ ] Frontend Core Web Vitals tracking

## A/B TESTING FRAMEWORK
- [ ] Create simple A/B testing service
- [ ] Test different onboarding flows
- [ ] Test pricing page layouts
- [ ] Test feature placement in UI
- [ ] Track conversion rates by variant

## DATA EXPORT & REPORTING
- [ ] CSV export for user data (GDPR compliant)
- [ ] Weekly/monthly reports for stakeholders
- [ ] Automated alerts for key metrics
- [ ] Integration with Google Analytics (optional)
- [ ] Custom dashboard widgets for key metrics
