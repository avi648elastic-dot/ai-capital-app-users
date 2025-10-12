# 🚀 Render Auto-Deploy Setup Guide

## Overview

This guide explains how to configure automatic deployments on Render for the AI Capital application when changes are pushed to GitHub.

## Prerequisites

- ✅ Render account with AI Capital project configured
- ✅ GitHub repository connected to Render
- ✅ Backend and Frontend services deployed on Render

## Auto-Deploy Configuration

### 1️⃣ **Backend Auto-Deploy Setup**

#### **Step 1: Navigate to Backend Service**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service (e.g., `ai-capital-app7`)

#### **Step 2: Configure Auto-Deploy**
1. Click **"Settings"** tab
2. Scroll to **"Build & Deploy"** section
3. Set **"Auto-Deploy"** to **"Yes"**
4. Select **Branch**: `main`
5. Set **Root Directory**: `backend/`

#### **Step 3: Advanced Settings**
```
Build Command: npm run build
Start Command: npm start
Environment: Node
```

#### **Step 4: Environment Variables**
Ensure these are set in Render dashboard:
```
NODE_ENV=production
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
REDIS_URL=<your-redis-url>
# ... all other required env vars
```

### 2️⃣ **Frontend Auto-Deploy Setup**

#### **Step 1: Navigate to Frontend Service**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your frontend service (e.g., `ai-capital-frontend`)

#### **Step 2: Configure Auto-Deploy**
1. Click **"Settings"** tab
2. Scroll to **"Build & Deploy"** section
3. Set **"Auto-Deploy"** to **"Yes"**
4. Select **Branch**: `main`
5. Set **Root Directory**: `frontend/`

#### **Step 3: Advanced Settings**
```
Build Command: npm run build
Publish Directory: .next
Environment: Node
```

#### **Step 4: Environment Variables**
```
NEXT_PUBLIC_API_URL=https://ai-capital-app7.onrender.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-key>
# ... other frontend env vars
```

## Deployment Triggers

### **Automatic Triggers**
- ✅ **Push to `main` branch**: Triggers both backend and frontend deployment
- ✅ **Pull Request merged**: Triggers deployment after merge
- ✅ **Manual Deploy**: Available via Render dashboard

### **Manual Deploy Options**
1. **Via Render Dashboard**:
   - Go to service → "Manual Deploy" → "Deploy latest commit"
   
2. **Via Render CLI**:
   ```bash
   # Install Render CLI
   npm install -g @render/cli
   
   # Login to Render
   render login
   
   # Deploy specific service
   render deploy --service <service-name>
   ```

## Deployment Process

### **Backend Deployment Flow**
```
1. GitHub webhook triggers Render
2. Render clones repository
3. Installs dependencies: npm ci --omit=dev
4. Builds TypeScript: npm run build
5. Starts application: npm start
6. Health check: GET /healthz
7. Service available at: https://ai-capital-app7.onrender.com
```

### **Frontend Deployment Flow**
```
1. GitHub webhook triggers Render
2. Render clones repository
3. Installs dependencies: npm ci --omit=dev
4. Builds Next.js: npm run build
5. Deploys static files to CDN
6. Service available at: https://ai-capital-frontend.onrender.com
```

## Monitoring Deployments

### **Deploy Status**
- **In Progress**: Deployment is running
- **Live**: Deployment successful and service is running
- **Failed**: Deployment failed (check logs)

### **Deployment Logs**
1. Go to service → **"Logs"** tab
2. View real-time deployment logs
3. Check for build errors or startup issues

### **Health Checks**
- **Backend**: `GET /healthz` returns `{ status: "ok", uptime: "..." }`
- **Frontend**: Static files served correctly

## Troubleshooting

### **Common Issues**

#### **1. Build Failures**
```
Error: Module not found: Can't resolve '@stripe/stripe-js'
```
**Solution**: Ensure `package.json` includes all dependencies

#### **2. Environment Variable Issues**
```
Error: JWT_SECRET is required
```
**Solution**: Add missing environment variables in Render dashboard

#### **3. Database Connection Issues**
```
Error: MongoServerError: Authentication failed
```
**Solution**: Verify MongoDB connection string and credentials

#### **4. Redis Connection Issues**
```
Error: Redis connection failed
```
**Solution**: Verify Redis URL and connection settings

### **Debugging Steps**
1. **Check Build Logs**: Look for compilation errors
2. **Check Runtime Logs**: Look for startup errors
3. **Verify Environment Variables**: All required vars are set
4. **Test Health Endpoints**: `/healthz` should return success
5. **Check External Dependencies**: MongoDB, Redis connections

## Advanced Configuration

### **Custom Build Commands**
```bash
# Backend custom build
npm ci --omit=dev && npm run build && npm run test

# Frontend custom build  
npm ci --omit=dev && npm run build && npm run lint
```

### **Deployment Notifications**
Configure webhook notifications:
1. Go to service → **"Settings"** → **"Notifications"**
2. Add webhook URL for deployment status
3. Get notified on success/failure

### **Branch-Based Deployments**
- **Production**: `main` branch → Production URLs
- **Staging**: `develop` branch → Staging URLs
- **Feature**: `feature/*` branches → Preview URLs

## Best Practices

### **✅ Do's**
- Always test locally before pushing to `main`
- Use environment variables for configuration
- Monitor deployment logs for errors
- Keep dependencies up to date
- Use semantic versioning for releases

### **❌ Don'ts**
- Don't push broken code to `main`
- Don't hardcode secrets in code
- Don't ignore deployment failures
- Don't skip testing before deployment

## Security Considerations

### **Environment Variables**
- Store secrets in Render dashboard (not in code)
- Use different values for staging/production
- Rotate secrets regularly

### **Access Control**
- Limit who can merge to `main` branch
- Use branch protection rules
- Require pull request reviews

## Performance Optimization

### **Build Optimization**
- Use `.dockerignore` and `.gitignore` effectively
- Cache dependencies between builds
- Optimize Docker images for size

### **Deployment Speed**
- Use parallel deployments for multiple services
- Optimize build commands for speed
- Use CDN for static assets

## Monitoring & Alerts

### **Health Monitoring**
```bash
# Backend health check
curl https://ai-capital-app7.onrender.com/healthz

# Expected response
{
  "status": "ok",
  "uptime": "2h 15m 30s",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### **Uptime Monitoring**
- Use external monitoring services (UptimeRobot, Pingdom)
- Set up alerts for service downtime
- Monitor response times and error rates

---

## Summary

✅ **Auto-deploy is now configured**:
- Backend: Auto-deploys on `main` branch pushes
- Frontend: Auto-deploys on `main` branch pushes
- Manual deploys available via dashboard
- Health checks monitor deployment success

🚀 **Deployment Process**:
1. Push code to GitHub `main` branch
2. Render automatically detects changes
3. Builds and deploys services
4. Health checks verify deployment success
5. Services are live and accessible

📊 **Monitoring**:
- Real-time deployment logs
- Health check endpoints
- Error notifications and alerts

The AI Capital application now has fully automated deployments! 🎉
