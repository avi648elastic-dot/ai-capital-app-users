# 💳 Stripe Payment Setup Guide

## ✅ What's Already Done

### Backend Implementation
- ✅ User model updated with Stripe fields (`stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`)
- ✅ Stripe service with full payment processing
- ✅ Webhook handlers that update database automatically
- ✅ All Stripe routes registered (`/api/stripe/*`)
- ✅ Subscription plans configured (Free, Premium $29.99, Premium+ $49.99)

### Frontend Implementation
- ✅ Pricing page (`/pricing`)
- ✅ Upgrade page with Stripe integration (`/upgrade`)
- ✅ Stripe service for checkout sessions
- ✅ Payment flow UI components

## 🔧 What You Need to Do

### Step 1: Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → API keys**
3. Copy the following keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Step 2: Create Stripe Products & Prices

1. In Stripe Dashboard, go to **Products**
2. Create two products:

   **Premium Plan:**
   - Name: `AI-Capital Premium`
   - Description: `Advanced portfolio management with up to 15 stocks`
   - Price: `$29.99/month` (recurring)
   - Copy the **Price ID** (starts with `price_`)

   **Premium+ Plan:**
   - Name: `AI-Capital Premium+`
   - Description: `Professional-grade tools with unlimited stocks`
   - Price: `$49.99/month` (recurring)
   - Copy the **Price ID** (starts with `price_`)

### Step 3: Set Up Webhook Endpoint

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter URL: `https://ai-capital-app7.onrender.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

### Step 4: Add Environment Variables to Render

Go to your Render backend service → **Environment** and add:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Stripe Price IDs (from Step 2)
STRIPE_PREMIUM_PRICE_ID=price_YOUR_PREMIUM_PRICE_ID
STRIPE_PREMIUM_PLUS_PRICE_ID=price_YOUR_PREMIUM_PLUS_PRICE_ID
```

### Step 5: Add Frontend Environment Variable to Vercel

Go to your Vercel project → **Settings → Environment Variables** and add:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

### Step 6: Redeploy Both Services

1. **Backend (Render):** Will auto-deploy when you push changes
2. **Frontend (Vercel):** Will auto-deploy when you push changes

Or manually trigger deployments from their dashboards.

## 🧪 Testing the Payment Flow

### Test in Development Mode

1. Use Stripe test keys (starting with `sk_test_` and `pk_test_`)
2. Go to `/upgrade` page
3. Click "Upgrade to Premium"
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code
5. Complete checkout
6. Verify:
   - User subscription updated in database
   - Subscription shows as "active" in user profile
   - Premium features unlocked

### Stripe Test Cards

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires authentication:** `4000 0025 0000 3155`

## 📊 Monitoring Payments

### Stripe Dashboard
- View all payments in **Payments** tab
- View subscriptions in **Subscriptions** tab
- View customers in **Customers** tab
- View webhook events in **Developers → Webhooks**

### Backend Logs
- All Stripe events are logged with `[STRIPE]` prefix
- Check Render logs for webhook processing
- Look for `✅ [STRIPE]` for successful operations
- Look for `❌ [STRIPE]` for errors

## 🔒 Security Best Practices

1. **Never commit API keys** to git
2. **Use test keys** in development
3. **Use live keys** only in production
4. **Verify webhook signatures** (already implemented)
5. **Use HTTPS** for all endpoints (already configured)

## 🐛 Troubleshooting

### "Setup Required" Badge on Upgrade Page
- **Cause:** Missing `STRIPE_PREMIUM_PRICE_ID` or `STRIPE_PREMIUM_PLUS_PRICE_ID`
- **Fix:** Add Price IDs to Render environment variables

### Webhook Not Receiving Events
- **Cause:** Incorrect webhook URL or secret
- **Fix:** Verify URL is `https://ai-capital-app7.onrender.com/api/stripe/webhook`
- **Fix:** Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard

### Payment Succeeds but User Not Updated
- **Cause:** Webhook not processing correctly
- **Fix:** Check Render logs for webhook errors
- **Fix:** Verify `userId` is in session metadata

### "No Stripe customer found" Error
- **Cause:** User hasn't completed a checkout yet
- **Fix:** User needs to subscribe first before accessing billing portal

## 📈 Current Subscription Plans

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | 1 portfolio, 5 stocks, Basic analytics |
| **Premium** | $29.99/mo | 3 portfolios, 15 stocks, Advanced analytics |
| **Premium+** | $49.99/mo | Unlimited portfolios, 20 stocks, AI insights |

## 🎯 Next Steps After Setup

1. ✅ Test payment flow with test cards
2. ✅ Verify webhook events are received
3. ✅ Check user subscription updates in database
4. ✅ Test subscription cancellation
5. ✅ Test subscription reactivation
6. ✅ Switch to live keys for production

## 📞 Support

If you encounter issues:
1. Check Stripe Dashboard → Developers → Logs
2. Check Render backend logs
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

**Status:** ✅ Implementation complete, awaiting Stripe API keys configuration

