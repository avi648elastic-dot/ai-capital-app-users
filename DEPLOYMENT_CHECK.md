# Render Backend Deployment Troubleshooting Guide

## Issue
**502 Bad Gateway** errors when accessing backend API from Vercel frontend.

## Error Symptoms
```
GET https://ai-capital-app7.onrender.com/api/user/profile net::ERR_FAILED 502 (Bad Gateway)
GET https://ai-capital-app7.onrender.com/api/notifications?limit=20&unreadOnly=true net::ERR_FAILED 502 (Bad Gateway)
```

## Root Causes
1. **Render backend is down or crashed**
2. **Health check endpoint failing** (`/healthz` or `/health`)
3. **MongoDB connection issues** causing server crash
4. **Environment variables missing** (API keys, MONGODB_URI, JWT_SECRET)
5. **Build process failed** on Render

## Step-by-Step Troubleshooting

### 1. Check Render Dashboard
1. Go to https://dashboard.render.com
2. Find service: `ai-capital-app7`
3. Check **Status**:
   - ✅ "Live" = Running
   - ❌ "Stopped" = Needs restart
   - ❌ "Build failed" = Fix build errors

### 2. Check Logs
1. Click on the service
2. Go to **Logs** tab
3. Look for errors:
   - "MongoDB connection failed"
   - "Missing MONGODB_URI"
   - "Build failed"
   - "Module not found"

### 3. Check Health Endpoint
Open in browser: https://ai-capital-app7.onrender.com/healthz

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-27T...",
  "uptime": 12345,
  "mongoState": 1,
  "memory": {...},
  "responseTime": "5ms"
}
```

**If 502/503:**
- Server is down
- MongoDB connection failed
- Environment variables missing

### 4. Verify Environment Variables
In Render Dashboard → Environment:
- ✅ `MONGODB_URI` - MongoDB connection string
- ✅ `JWT_SECRET` - Authentication secret
- ✅ `NODE_ENV=production`
- ✅ `PORT` (auto-set by Render)
- ✅ All API keys (ALPHA_VANTAGE_API_KEY_1-4, FINNHUB_API_KEY_1-4, FMP_API_KEY_1-4)

### 5. Restart the Service
**Manual Restart:**
1. Render Dashboard → Service
2. Click **"Manual Deploy"**
3. Select **"Clear build cache & deploy"**
4. Click **"Deploy latest commit"**

**Quick Restart:**
1. Render Dashboard → Service
2. Click **"..." menu** → **"Restart"**

### 6. Check Build Process
**Common Build Issues:**

**a) TypeScript Errors:**
- Check if `npm run build` succeeds locally
- Fix TypeScript errors
- Push changes to trigger auto-redeploy

**b) Missing Dependencies:**
- Add missing packages to `package.json`
- Run `npm install` in backend directory
- Push changes

**c) Environment Variable Errors:**
- All required env vars must be set
- Check `.env` file exists (if using)

### 7. Check MongoDB Connection
**Test Command (via Render Shell):**
```bash
# In Render → Service → Shell
curl https://ai-capital-app7.onrender.com/api/health
```

**Expected:**
- Status: OK
- mongoState: 1 (connected)
- Response time < 500ms

**If Failed:**
- MongoDB URI is incorrect
- Network firewall blocking connection
- MongoDB Atlas IP whitelist missing Render IPs

### 8. Monitor Service Health
**Auto-Restart:**
- Render has auto-restart on crashes
- Check logs for crash loops
- Service may be crashing repeatedly

**Health Checks:**
- Render pings `/healthz` endpoint
- If it fails 3 times → Service marked unhealthy
- Manual restart required

### 9. Check Recent Changes
**Last Working State:**
1. Check git history
2. Identify last successful deployment
3. Check what changed since then
4. Revert problematic changes if needed

**Recent Pushes:**
```bash
git log --oneline -10
```

### 10. Force Complete Redeploy
If nothing works:

1. **Stop the service** in Render Dashboard
2. **Clear all environment variables** (backup first!)
3. **Add environment variables** again
4. **Start the service**
5. **Monitor logs** for startup errors

## Quick Fix Commands

### If Server is Running but API Returns 502:

**Check if it's a CORS issue:**
```bash
curl -H "Origin: https://ai-capital-app7.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://ai-capital-app7.onrender.com/api/health
```

**Check if health endpoint works:**
```bash
curl https://ai-capital-app7.onrender.com/healthz
```

### Manual Deployment Trigger:
```bash
# Push a dummy commit to trigger auto-deploy
git commit --allow-empty -m "trigger render deploy"
git push
```

## Common Solutions Summary

| Error | Solution |
|-------|----------|
| 502 Bad Gateway | Restart Render service |
| Build Failed | Check logs, fix errors, redeploy |
| MongoDB not connected | Check MONGODB_URI, verify Atlas whitelist |
| Missing env vars | Add all required vars in Render dashboard |
| CORS errors | Already configured, check backend is running |
| Port in use | Render sets PORT automatically, check config |

## Current Backend Status Check

**Health Endpoint:**
```
https://ai-capital-app7.onrender.com/api/health
```

**Simple Test Endpoint:**
```
https://ai-capital-app7.onrender.com/api/simple-test
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Server is running without database",
  "timestamp": "...",
  "mongoState": 1,
  "corsEnabled": "ALL_ORIGINS_ALLOWED"
}
```

## Next Steps
1. **Check Render Dashboard** - See if service is live
2. **Test health endpoint** - Verify server is responding
3. **Check logs** - Find specific error
4. **Restart service** - Fix immediate 502 errors
5. **Verify MongoDB** - Ensure database connection works

## Quick Wins (Try First)
1. ✅ Restart Render service
2. ✅ Test /healthz endpoint
3. ✅ Check deployment logs
4. ✅ Verify environment variables
5. ✅ Check MongoDB connection status

