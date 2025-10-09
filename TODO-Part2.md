# 💳 Stripe Subscription Integration
**Goal:** Enable paid plans (Premium / Premium+) with auto billing

---

## STRIPE SETUP
- [ ] Create Stripe account + Products ( Premium $9.99  |  Premium+ $19.99 )
- [ ] Enable test mode; collect keys → `.env`
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PREMIUM(+)`

## BACKEND INTEGRATION (`backend/src/services/stripeService.ts`)
- [ ] Install `stripe` package
- [ ] Create customer on signup (store `customerId` in User model)
- [ ] Implement `createCheckoutSession()` for upgrades
- [ ] Add webhook handler for subscription events:
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] Update `user.subscriptionTier` based on webhook events
- [ ] Handle failed payments (downgrade to Free after 3 failures)

## FRONTEND SUBSCRIPTION UI (`frontend/app/(app)/subscription/page.tsx`)
- [ ] Replace mock pricing with Stripe Checkout buttons
- [ ] Add loading states during payment flow
- [ ] Handle success/cancel redirects from Stripe
- [ ] Display current plan + billing cycle
- [ ] Add "Manage Billing" link (Stripe Customer Portal)

## SUBSCRIPTION FEATURE GATING
- [ ] Update `User` model with `subscriptionTier`, `subscriptionStatus`, `customerId`
- [ ] Add middleware to check plan limits:
  - [ ] Free: 1 portfolio, 10 stocks max
  - [ ] Premium: 3 portfolios, 15 stocks max
  - [ ] Premium+: 5 portfolios, 20 stocks max
- [ ] Block API endpoints that exceed plan limits
- [ ] Show upgrade prompts in UI when limits reached

## BILLING & CUSTOMER PORTAL
- [ ] Add route `/api/stripe/create-portal-session` (Customer Portal)
- [ ] Allow users to update payment method, view invoices, cancel
- [ ] Handle cancellation (keep access until period end)
- [ ] Send email notifications for billing events

## TESTING & VALIDATION
- [ ] Test complete flow: signup → upgrade → billing → cancellation
- [ ] Verify webhook events update user tier correctly
- [ ] Test failed payment scenarios
- [ ] Confirm feature gating works for each tier
- [ ] Test Customer Portal functionality

## PRODUCTION DEPLOYMENT
- [ ] Switch Stripe to live mode
- [ ] Update webhook endpoints to production URLs
- [ ] Add monitoring for failed payments
- [ ] Set up Stripe Dashboard alerts
- [ ] Document billing procedures for support
