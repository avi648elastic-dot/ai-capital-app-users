## STRIPE SETUP
- [ ] Create Stripe account + Products (Premium $9.99, Premium+ $19.99)
- [ ] Enable test mode; collect keys → .env
- [ ] Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PREMIUM(+)

## BACKEND (`backend/src/routes/stripe.ts`)
- [ ] Install stripe
- [ ] Create POST /api/stripe/create-checkout-session
- [ ] Create POST /api/stripe/webhook (verify signature)
- [ ] Handle events: checkout.session.completed, subscription.updated, subscription.deleted
- [ ] Helper updateUserSubscription()

## FRONTEND (/app/upgrade/page.tsx)
- [ ] Add two plan cards with Upgrade buttons
- [ ] Call API → redirect to Stripe URL
- [ ] Create success and cancel pages
- [ ] Show plan status in UserContext

## SUBSCRIPTION ENFORCEMENT
- [ ] Middleware checkPlanLimit()
- [ ] Frontend feature guards by plan
- [ ] Weekly cron → auto-downgrade expired

## TEST & DEPLOY
- [ ] Test with Stripe test card 4242 4242 4242 4242
- [ ] Simulate webhooks via Stripe CLI
- [ ] Deploy + set Render webhook URL
- [ ] Switch to live mode after verification
