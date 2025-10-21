# 🚀 SPRINT 1: Performance & Bundle Optimization - Implementation Guide

## 📊 Current Build Status
- ✅ Frontend: Next.js 15.5.5 builds successfully
- ✅ Backend: TypeScript compiles without errors
- ⚠️ Warning: Invalid `swcMinify` config (needs fixing)

---

## 🎯 IMMEDIATE FIXES (Day 1)

### 1. Fix Next.js Config Warning
```bash
# Fix the swcMinify warning
```

**File:** `frontend/next.config.js`
```javascript
// Remove or update swcMinify (deprecated in Next.js 15)
// Replace with:
experimental: {
  optimizePackageImports: ['lucide-react', 'axios'],
  // Remove swcMinify
}
```

### 2. Add Bundle Analyzer
```bash
cd frontend
npm install --save-dev @next/bundle-analyzer
```

**File:** `frontend/next.config.js`
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... existing config
})
```

---

## 🎯 WEEK 1: Bundle Analysis & Optimization

### Day 1-2: Bundle Analysis
```bash
# Analyze current bundle
cd frontend
ANALYZE=true npm run build

# Check bundle sizes
npm run build 2>&1 | grep -E "(First Load JS|Route|Size)"
```

### Day 3-4: Dynamic Imports Implementation

**1. Lazy Load Heavy Components**
```typescript
// frontend/components/LazyCharts.tsx
import dynamic from 'next/dynamic'

export const LazyPortfolioChart = dynamic(
  () => import('./PortfolioChart'),
  { 
    loading: () => <div className="animate-pulse bg-slate-700 h-64 rounded" />,
    ssr: false 
  }
)

export const LazyExpertPortfolio = dynamic(
  () => import('./ExpertPortfolio'),
  { 
    loading: () => <div className="animate-pulse bg-slate-700 h-96 rounded" />,
    ssr: false 
  }
)
```

**2. Route-Based Code Splitting**
```typescript
// frontend/app/(app)/analytics/performance/page.tsx
'use client'

import dynamic from 'next/dynamic'

const PerformanceChart = dynamic(() => import('@/components/PerformanceChart'), {
  loading: () => <div className="animate-pulse bg-slate-700 h-64 rounded" />
})

const RiskMetrics = dynamic(() => import('@/components/RiskMetrics'), {
  loading: () => <div className="animate-pulse bg-slate-700 h-32 rounded" />
})
```

### Day 5-7: Image Optimization

**1. Convert Images to WebP**
```bash
# Install image optimization tools
npm install --save-dev sharp imagemin imagemin-webp

# Convert existing images
npx imagemin public/**/*.{jpg,png} --out-dir=public/optimized --plugin=webp
```

**2. Implement Next.js Image Component**
```typescript
// Replace all <img> tags with Next.js Image
import Image from 'next/image'

// Before
<img src="/logo.png" alt="Logo" className="w-8 h-8" />

// After
<Image 
  src="/logo.png" 
  alt="Logo" 
  width={32} 
  height={32}
  className="w-8 h-8"
  priority // for above-the-fold images
/>
```

---

## 🎯 WEEK 2: Caching & Performance

### Day 8-10: SWR Implementation

**1. Install SWR**
```bash
cd frontend
npm install swr
```

**2. Create SWR Hooks**
```typescript
// frontend/hooks/usePortfolio.ts
import useSWR from 'swr'
import { apiClient } from '@/lib/api'

export function usePortfolio() {
  const { data, error, mutate } = useSWR(
    '/api/portfolio',
    () => apiClient.getPortfolio(),
    {
      refreshInterval: 30000, // 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 10000, // 10 seconds
    }
  )

  return {
    portfolio: data?.portfolio || [],
    loading: !error && !data,
    error,
    refresh: mutate
  }
}
```

**3. Update Components to Use SWR**
```typescript
// frontend/app/(app)/dashboard/page.tsx
import { usePortfolio } from '@/hooks/usePortfolio'

export default function Dashboard() {
  const { portfolio, loading, error, refresh } = usePortfolio()
  
  // Remove manual fetch logic, use SWR data
}
```

### Day 11-14: Backend Caching

**1. Redis Caching for API Responses**
```typescript
// backend/src/middleware/cache.ts
import { redisService } from '../services/redisService'

export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: any, res: any, next: any) => {
    const key = `cache:${req.path}:${JSON.stringify(req.query)}`
    
    try {
      const cached = await redisService.get(key)
      if (cached) {
        return res.json(JSON.parse(cached))
      }
      
      // Store original json method
      const originalJson = res.json
      res.json = function(data: any) {
        // Cache the response
        redisService.set(key, JSON.stringify(data), ttl)
        return originalJson.call(this, data)
      }
      
      next()
    } catch (error) {
      next()
    }
  }
}
```

**2. Apply Caching to Portfolio Routes**
```typescript
// backend/src/routes/portfolio.ts
import { cacheMiddleware } from '../middleware/cache'

// Cache portfolio data for 5 minutes
router.get('/', authenticateToken, cacheMiddleware(300), async (req, res) => {
  // ... existing logic
})
```

---

## 🎯 PERFORMANCE TARGETS & MEASUREMENT

### Bundle Size Targets
- **Initial Bundle:** < 200KB
- **Total Bundle:** < 500KB
- **Vendor Bundle:** < 300KB
- **Route Chunks:** < 100KB each

### Performance Targets
- **Lighthouse Performance:** 90+
- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Time to Interactive:** < 3s
- **Cumulative Layout Shift:** < 0.1

### Measurement Commands
```bash
# Bundle analysis
ANALYZE=true npm run build

# Performance testing
npm run build
npm run start
# Then run Lighthouse audit

# Bundle size check
npm run build 2>&1 | grep -E "(First Load JS|Route|Size)"
```

---

## 🎯 IMPLEMENTATION CHECKLIST

### Week 1 Checklist
- [ ] Fix Next.js config warning
- [ ] Install and configure bundle analyzer
- [ ] Run initial bundle analysis
- [ ] Implement dynamic imports for heavy components
- [ ] Convert all images to WebP format
- [ ] Replace <img> tags with Next.js Image component
- [ ] Test bundle size reduction

### Week 2 Checklist
- [ ] Install and configure SWR
- [ ] Create SWR hooks for data fetching
- [ ] Update components to use SWR
- [ ] Implement Redis caching middleware
- [ ] Apply caching to API routes
- [ ] Test performance improvements
- [ ] Measure and document results

### Success Criteria
- [ ] Bundle size reduced by 30%
- [ ] Lighthouse performance score > 90
- [ ] Page load time < 2 seconds
- [ ] No build warnings or errors
- [ ] All images optimized and using Next.js Image

---

## 🚀 DEPLOYMENT STRATEGY

### Staging Deployment
```bash
# Test on staging first
git checkout -b sprint-1-performance
# ... implement changes
git add .
git commit -m "Sprint 1: Performance optimizations"
git push origin sprint-1-performance
# Deploy to staging for testing
```

### Production Deployment
```bash
# After staging validation
git checkout main
git merge sprint-1-performance
git push origin main
# Deploy to production
```

---

## 📊 MONITORING & METRICS

### Performance Monitoring
- Set up Lighthouse CI
- Monitor Core Web Vitals
- Track bundle size changes
- Monitor API response times

### Key Metrics to Track
- Bundle size (before/after)
- Page load times
- API response times
- User engagement metrics
- Error rates

---

*This implementation guide provides step-by-step instructions for Sprint 1. Each task is designed to be completed in 1-2 days, with clear success criteria and measurement methods.*
