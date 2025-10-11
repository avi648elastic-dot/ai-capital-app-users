# 🚀 AI-Capital Runbook

## Deployment Guide

### Prerequisites

- GitHub account with repository access
- Render account (backend hosting)
- Vercel account (frontend hosting)
- MongoDB Atlas account
- API keys (Alpha Vantage, Finnhub, FMP)

---

## Production Deployment

### 1. Backend (Render)

#### Initial Setup
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name**: `ai-capital-backend`
   - **Region**: Choose closest to users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free or Starter

#### Environment Variables
Add ALL variables from `env.example`:
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-app.vercel.app
ALPHA_VANTAGE_API_KEY_1=...
ALPHA_VANTAGE_API_KEY_2=...
... (all 12 API keys)
SENTRY_DSN=...
NODE_ENV=production
```

#### Health Check
- **Path**: `/api/health`
- **Expected Response**: `{ "status": "healthy" }`

#### Auto-Deploy
- ✅ Enabled on `main` branch pushes
- Build time: 2-3 minutes
- Zero-downtime deployment

---

### 2. Frontend (Vercel)

#### Initial Setup
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import GitHub repository
4. Configure:
   - **Framework**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Environment Variables
```
NEXT_PUBLIC_API_URL=https://ai-capital-backend.onrender.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

#### Auto-Deploy
- ✅ Enabled on `main` branch pushes
- Build time: 1-2 minutes
- Edge network deployment

---

## Local Development

### Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (copy from env.example)
cp ../env.example .env

# Edit .env with your keys
# nano .env

# Run in development mode
npm run dev

# Or build and run
npm run build
npm start
```

**Expected Output:**
```
✅ [LOGGER] Pino logger initialized
🔑 [API KEYS] Alpha Vantage keys loaded: 4
🚀 Server running on port 5000
✅ MongoDB connected successfully
```

---

### Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Run development server
npm run dev
```

**Access:** http://localhost:3000

---

## Monitoring

### Health Checks

#### Backend Health
```bash
curl https://ai-capital-backend.onrender.com/api/health
```

Expected:
```json
{
  "status": "healthy",
  "uptime": 12345,
  "timestamp": "2025-10-11T22:00:00.000Z"
}
```

#### Frontend Health
```bash
curl https://your-app.vercel.app
```

Expected: HTML response with status 200

---

### Logs

#### Render Logs
1. Go to Render Dashboard
2. Select `ai-capital-backend`
3. Click "Logs" tab
4. Filter by:
   - ❌ Errors: `level:"error"`
   - ⚠️ Warnings: `level:"warn"`
   - 🔍 Specific feature: `[WATCHLIST]` or `[DECISION ENGINE]`

#### Vercel Logs
1. Go to Vercel Dashboard
2. Select project
3. Click "Deployments"
4. Click on deployment → "Logs"

---

### Sentry (Error Tracking)

1. Go to [Sentry Dashboard](https://sentry.io)
2. View errors by:
   - Environment (production/development)
   - Time range
   - Error type
3. Click error for:
   - Stack trace
   - User context
   - Breadcrumbs

---

## Troubleshooting

### Issue: Backend Not Responding

**Symptoms:**
- Frontend shows "Network Error"
- API requests timeout
- Health check fails

**Diagnosis:**
```bash
# Check Render deployment status
# In Render Dashboard → ai-capital-backend

# Check logs for errors
# Look for: "Server started successfully"

# Test API directly
curl https://ai-capital-backend.onrender.com/api/health
```

**Solutions:**
1. Check Render build logs for errors
2. Verify environment variables are set
3. Check MongoDB connection (MONGODB_URI)
4. Restart service in Render dashboard
5. Check if Render plan has exceeded limits

---

### Issue: Authentication Failing

**Symptoms:**
- "Invalid token" errors
- Constant redirects to login
- 401 Unauthorized responses

**Diagnosis:**
```bash
# Check JWT_SECRET is set in Render
# Verify FRONTEND_URL matches actual Vercel URL
# Check cookie settings in browser (should see 'token' cookie)
```

**Solutions:**
1. Ensure JWT_SECRET is same across deployments
2. Clear browser cookies
3. Check CORS settings allow credentials
4. Verify FRONTEND_URL in env vars

---

### Issue: Stock Data Not Loading

**Symptoms:**
- "Fallback Data (APIs unavailable)"
- Empty portfolio/watchlist
- No price updates

**Diagnosis:**
```bash
# Check Render logs for API errors
# Look for: "[ALPHA VANTAGE]" or "[FINNHUB]" errors

# Test API keys
curl "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=AAPL&apikey=YOUR_KEY"
```

**Solutions:**
1. Verify all 12 API keys are valid
2. Check API key rate limits
3. Wait 10 minutes for cache to clear
4. Check if APIs are down (status pages)

---

### Issue: Watchlist Save Failing

**Symptoms:**
- "Failed to save" error
- Price alerts not persisting
- Network errors in console

**Diagnosis:**
```bash
# Check browser console for detailed error
# Check Render logs for "[WATCHLIST ALERT]"
# Verify authentication token exists
```

**Solutions:**
1. Clear browser cache
2. Re-login to get fresh token
3. Check Render logs for specific error
4. Verify MongoDB connection

---

### Issue: Slow Performance

**Symptoms:**
- Pages take >5 seconds to load
- API requests timeout
- Charts don't render

**Diagnosis:**
```bash
# Check Render metrics (CPU, Memory)
# Look for MongoDB slow query logs
# Check API response times in network tab
```

**Solutions:**
1. Check MongoDB indexes are created
2. Verify LRU cache is working (check logs)
3. Reduce concurrent API calls
4. Upgrade Render plan if resource limited
5. Enable Redis for better caching

---

## Database Operations

### MongoDB Atlas

#### Connect to Database
```bash
# Using MongoDB Shell
mongosh "mongodb+srv://cluster.mongodb.net/aicapital" --username YOUR_USERNAME
```

#### Check Indexes
```javascript
// In MongoDB Shell
use aicapital

// List all indexes
db.users.getIndexes()
db.portfolios.getIndexes()
db.watchlists.getIndexes()
db.notifications.getIndexes()
```

#### Backup Database
```bash
# Using mongodump
mongodump --uri="mongodb+srv://..." --out=./backup-2025-10-11
```

#### Restore Database
```bash
# Using mongorestore
mongorestore --uri="mongodb+srv://..." ./backup-2025-10-11
```

---

## Scaling Considerations

### Current Limits (Free Tier)

**Render Free:**
- 512 MB RAM
- Shared CPU
- Spins down after 15 min inactivity
- 750 hours/month

**Vercel Free:**
- 100 GB bandwidth/month
- 100 hours serverless execution
- Unlimited deployments

**MongoDB Atlas Free:**
- 512 MB storage
- Shared cluster
- Backup not included

### When to Upgrade

**Backend (Render Starter - $7/month):**
- Constant uptime needed
- >500 active users
- >1 million API calls/month

**Frontend (Vercel Pro - $20/month):**
- Commercial use
- Analytics needed
- >100 GB bandwidth

**Database (MongoDB M10 - $57/month):**
- >500 MB data
- Backup & restore needed
- Performance optimization

---

## Emergency Procedures

### Complete System Outage

1. **Check Status Pages:**
   - Render: https://status.render.com
   - Vercel: https://vercel-status.com
   - MongoDB: https://status.cloud.mongodb.com

2. **Verify Deployments:**
   - Render → Check latest deployment status
   - Vercel → Check latest deployment status

3. **Rollback if Needed:**
   ```bash
   # In GitHub
   git revert HEAD
   git push origin main
   
   # Or in Render/Vercel dashboard:
   # Select previous deployment → "Redeploy"
   ```

4. **Notify Users:**
   - Post on social media
   - Send email notification
   - Update status page

---

### Data Loss

1. **Restore from MongoDB Backup:**
   ```bash
   mongorestore --uri="..." ./backup-latest
   ```

2. **Check Recent Changes:**
   ```bash
   git log --oneline -10
   ```

3. **Contact Support:**
   - Render Support
   - MongoDB Support

---

## Maintenance Tasks

### Daily
- [ ] Check Render logs for errors
- [ ] Verify health check is passing
- [ ] Monitor API usage (nearing limits?)

### Weekly
- [ ] Review Sentry errors
- [ ] Check database size
- [ ] Verify scheduled jobs running
- [ ] Test critical user flows

### Monthly
- [ ] Database backup
- [ ] Security updates (`npm audit`)
- [ ] Performance review
- [ ] API key rotation if needed

---

## Contact & Support

### Internal Team
- **Backend Lead**: [Your Name]
- **Frontend Lead**: [Your Name]
- **DevOps**: [Your Name]

### External Services
- **Render Support**: https://render.com/support
- **Vercel Support**: https://vercel.com/support
- **MongoDB Support**: https://support.mongodb.com

### On-Call Escalation
1. Check Render/Vercel dashboards
2. Review error logs
3. Check Sentry for patterns
4. Rollback if critical
5. Fix and redeploy

---

**Remember**: The system is designed for high reliability with multiple fallbacks. Most issues can be resolved by checking logs and verifying environment variables! 🚀

