# 💳 Complete Stripe Setup Guide for AI Capital

**Last Updated:** October 15, 2025  
**Version:** 2.0

---

## 🎯 Overview

This guide provides complete setup instructions for Stripe integration in AI Capital, including webhooks, subscription management, and billing portal.

---

## 🚀 Quick Setup Checklist

- [ ] Create Stripe account and get API keys
- [ ] Create products and prices in Stripe Dashboard
- [ ] Configure webhook endpoints
- [ ] Set up environment variables
- [ ] Test payment flow
- [ ] Deploy and verify production setup

---

## 1. 🔑 Stripe Account Setup

### Create Stripe Account
1. Go to [stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete account verification
4. Activate your account

### Get API Keys
1. Go to **Developers** → **API Keys**
2. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

---

## 2. 📦 Create Products and Prices

### Create Products
1. Go to **Products** in Stripe Dashboard
2. Click **Add product**

#### Premium Plan
- **Name:** Premium Plan
- **Description:** Advanced features for serious investors
- **Price:** $9.99/month
- **Billing:** Recurring monthly

#### Premium+ Plan
- **Name:** Premium+ Plan  
- **Description:** Professional-grade tools for power users
- **Price:** $19.99/month
- **Billing:** Recurring monthly

### Get Price IDs
1. After creating products, go to **Products**
2. Click on each product
3. Copy the **Price ID** (starts with `price_`)

---

## 3. 🔗 Webhook Configuration

### Create Webhook Endpoint
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL:** `https://your-backend-url.com/api/stripe/webhook`
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`

### Get Webhook Secret
1. After creating the webhook, click on it
2. Go to **Signing secret**
3. Click **Reveal** and copy the secret (starts with `whsec_`)

---

## 4. 🏗️ Environment Variables

### Backend Environment Variables (Render)
Add these to your Render backend service:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id
STRIPE_PREMIUM_PLUS_PRICE_ID=price_your_premium_plus_price_id

# Frontend URL for redirects
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### Frontend Environment Variables (Vercel)
Add these to your Vercel frontend service:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

---

## 5. 🧪 Testing Setup

### Test Mode Configuration
For testing, use test keys:

```bash
# Test Environment Variables
STRIPE_SECRET_KEY=sk_test_your_test_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret
```

### Test Cards
Use these test card numbers:
- **Success:** `4242424242424242`
- **Decline:** `4000000000000002`
- **3D Secure:** `4000002500003155`

---

## 6. 🔧 Backend Configuration

### Webhook Endpoint Setup
The webhook endpoint is already configured at:
```
POST /api/stripe/webhook
```

### Required Middleware
Ensure your webhook endpoint:
1. **Skips CSRF protection** (already configured)
2. **Accepts raw body** for signature verification
3. **Has proper error handling**

### Database Schema
The User model already includes Stripe fields:
```typescript
interface IUser {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  subscriptionEndDate?: Date;
}
```

---

## 7. 🎨 Frontend Integration

### Upgrade Page
The upgrade page is available at `/upgrade` with:
- Plan comparison
- Stripe checkout integration
- Success/error handling

### Subscription Management
Use the `SubscriptionManager` component:
```tsx
import SubscriptionManager from '@/components/SubscriptionManager';

<SubscriptionManager 
  userId={user.id} 
  onSubscriptionChange={handleSubscriptionChange} 
/>
```

---

## 8. 🚀 Deployment Steps

### 1. Deploy Backend
```bash
# Push to your repository
git add .
git commit -m "Add Stripe integration"
git push origin main

# Render will automatically deploy
```

### 2. Deploy Frontend
```bash
# Push to your repository
git add .
git commit -m "Add Stripe frontend integration"
git push origin main

# Vercel will automatically deploy
```

### 3. Update Webhook URL
1. Go to Stripe Dashboard → **Webhooks**
2. Update the endpoint URL to your production backend
3. Test the webhook endpoint

---

## 9. 🧪 Testing Checklist

### Backend Tests
- [ ] Webhook signature verification
- [ ] Subscription creation
- [ ] Payment processing
- [ ] Subscription cancellation
- [ ] Billing portal access

### Frontend Tests
- [ ] Plan selection
- [ ] Checkout flow
- [ ] Success page
- [ ] Error handling
- [ ] Subscription management

### End-to-End Tests
- [ ] Complete subscription flow
- [ ] Payment success
- [ ] Payment failure
- [ ] Subscription cancellation
- [ ] Billing portal

---

## 10. 🔍 Monitoring & Debugging

### Stripe Dashboard
Monitor these metrics:
- **Payments:** Success/failure rates
- **Subscriptions:** Active/cancelled counts
- **Webhooks:** Delivery success rates
- **Customers:** Growth metrics

### Application Logs
Check for these log messages:
```
✅ [STRIPE] Checkout session created
✅ [STRIPE] Subscription created
✅ [STRIPE] Payment succeeded
❌ [STRIPE] Payment failed
⚠️ [STRIPE] Trial ending soon
```

### Debug Endpoints
Test these endpoints:
```bash
# Health check
GET /api/health

# Stripe webhook health
GET /api/stripe/webhook/health

# Debug API keys (admin only)
GET /api/debug/keys
```

---

## 11. 🚨 Common Issues & Solutions

### Issue: Webhook Signature Verification Failed
**Solution:**
- Check webhook secret in environment variables
- Ensure raw body is being sent to webhook
- Verify webhook URL is correct

### Issue: Checkout Session Creation Failed
**Solution:**
- Verify Stripe secret key is correct
- Check price IDs exist in Stripe
- Ensure user authentication is working

### Issue: Subscription Not Updating in Database
**Solution:**
- Check webhook events are being received
- Verify webhook handlers are working
- Check database connection

### Issue: Billing Portal Not Opening
**Solution:**
- Verify customer exists in Stripe
- Check Stripe customer ID in database
- Ensure billing portal is enabled

---

## 12. 🔒 Security Best Practices

### API Key Security
- Never commit API keys to version control
- Use environment variables for all keys
- Rotate keys regularly
- Use test keys for development

### Webhook Security
- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Implement idempotency for webhook handlers
- Log all webhook events

### Data Protection
- Encrypt sensitive data at rest
- Use secure connections (HTTPS)
- Implement proper access controls
- Regular security audits

---

## 13. 📊 Analytics & Reporting

### Key Metrics to Track
- **Conversion Rate:** Free to paid users
- **Churn Rate:** Subscription cancellations
- **Revenue:** Monthly recurring revenue (MRR)
- **Customer Lifetime Value:** Average revenue per user

### Stripe Reporting
Use Stripe's built-in reporting:
- **Dashboard:** Real-time metrics
- **Reports:** Detailed analytics
- **Exports:** CSV/PDF reports

---

## 14. 🎯 Production Checklist

### Before Going Live
- [ ] Switch to live API keys
- [ ] Update webhook URLs to production
- [ ] Test with real payment methods
- [ ] Verify all webhook events work
- [ ] Set up monitoring and alerts
- [ ] Create backup procedures
- [ ] Document support procedures

### Post-Launch
- [ ] Monitor payment success rates
- [ ] Track subscription metrics
- [ ] Respond to customer issues
- [ ] Regular security reviews
- [ ] Performance optimization

---

## 15. 📞 Support Resources

### Stripe Support
- **Documentation:** [stripe.com/docs](https://stripe.com/docs)
- **Support:** Available in Stripe Dashboard
- **Status:** [status.stripe.com](https://status.stripe.com)

### AI Capital Support
- **Documentation:** Check `/docs` folder
- **Issues:** Create GitHub issue
- **Updates:** Check commit history

---

## 🎉 Success!

Once you've completed this setup, you'll have:
- ✅ Complete Stripe payment integration
- ✅ Subscription management system
- ✅ Webhook handling for real-time updates
- ✅ Billing portal for customer self-service
- ✅ Comprehensive error handling and logging
- ✅ Production-ready security measures

Your AI Capital app now has a fully functional payment system! 🚀

---

**Last Updated:** October 15, 2025  
**Maintained by:** AI Capital Development Team
