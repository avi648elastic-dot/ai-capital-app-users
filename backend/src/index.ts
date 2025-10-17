import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import * as Sentry from '@sentry/node';
import { loggerService } from './services/loggerService';
import { requestIdMiddleware } from './middleware/requestId';
import csrfProtection, { csrfErrorHandler, generateCsrfToken } from './middleware/csrf';
import { authenticateToken } from './middleware/auth';

import authRoutes from './routes/auth';
import googleAuthRoutes from './routes/googleAuth';
import User from './models/User';
import portfolioRoutes from './routes/portfolio';
import shopifyRoutes from './routes/shopify';
import onboardingRoutes from './routes/onboarding';
import adminRoutes from './routes/admin';
import marketsRoutes from './routes/markets';
import portfoliosRoutes from './routes/portfolios';
import riskManagementRoutes from './routes/riskManagement';
import analyticsRoutes from './routes/analytics';
import stocksRoutes from './routes/stocks';
import performanceRoutes from './routes/performance';
import subscriptionRoutes from './routes/subscription';
import userRoutes from './routes/user';
import notificationRoutes from './routes/notifications';
import watchlistRoutes from './routes/watchlist';
import stripeRoutes from './routes/stripe';
import stripeWebhookRoutes from './routes/stripeWebhooks';
import leaderboardRoutes from './routes/leaderboard';
import transactionsRoutes from './routes/transactions';
import expertPortfolioRoutes from './routes/expertPortfolio';
import adminSetupRoutes from './routes/adminSetup';
import aiInsightsRoutes from './routes/aiInsights';
import { schedulerService } from './services/schedulerService';
import { watchlistMonitorService } from './services/watchlistMonitorService';
import { watchlistAlertService } from './services/watchlistAlertService';
import { queryBenchmark } from './services/queryBenchmark';

// Load environment variables
dotenv.config();

const app = express();

// Initialize Sentry - Temporarily disabled for deployment
// if (process.env.SENTRY_DSN) {
//   Sentry.init({
//     dsn: process.env.SENTRY_DSN,
//     environment: process.env.NODE_ENV || 'development',
//     tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
//   });
// }

// ✅ Render מחייב להשתמש ב־process.env.PORT
const PORT = Number(process.env.PORT) || 10000;

// Sentry middleware - Temporarily disabled
// if (process.env.SENTRY_DSN) {
//   app.use(Sentry.requestHandler());
//   app.use(Sentry.tracingHandler());
// }

// 🔒 Enhanced Security Configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://finnhub.io", "https://www.alphavantage.co"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for Vercel/Render
}));

// 🧁 Secure Cookie Parser with enhanced security
app.use(cookieParser());

// 🔍 Request ID middleware for tracking
app.use(requestIdMiddleware);

// 🍪 Secure Cookie Configuration
app.use((req, res, next) => {
  // Set secure cookie defaults
  res.cookie('test', 'value', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  next();
});

// 🛡️ CSRF Protection (Manual Implementation) - DISABLED FOR LOGIN FIX
app.use((req, res, next) => {
  // Skip CSRF for GET requests and health checks
  if (req.method === 'GET' || req.path.includes('/health') || req.path.includes('/test')) {
    return next();
  }
  
  // 🚨 EMERGENCY: Skip CSRF for all API routes during login fix
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // For other requests, check for CSRF token
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.cookies['csrf-token'];
  
  if (csrfToken && sessionToken && csrfToken === sessionToken) {
    return next();
  }
  
  // Allow requests from trusted origins (same-origin policy)
  const origin = req.get('origin') || req.get('referer');
  if (origin && (origin.includes('localhost') || origin.includes('vercel.app') || origin.includes('onrender.com'))) {
    return next();
  }
  
  // For development, be more permissive
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // Block suspicious requests
  res.status(403).json({
    success: false,
    message: 'CSRF protection: Invalid or missing token',
    requestId: loggerService.getRequestId(),
  });
});

// 🔄 Enhanced Rate Limiting (300 req/min as per TODO)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute as specified in TODO
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 🚨 EMERGENCY FIX: Ultra-permissive CORS for immediate login fix
const isAllowedOrigin = (origin?: string) => {
  if (!origin) return false;
  const patterns = [
    /^https?:\/\/localhost:(3000|3001)$/,
    /^https?:\/\/127\.0\.0\.1:(3000|3001)$/,
    /^https?:\/\/([a-z0-9-]+)\.vercel\.app$/i,
    /^https?:\/\/(.*\.)?ai-capital\.info$/i,
    /^https?:\/\/ai-capital-app7\.vercel\.app$/i, // Add specific Vercel domain
    /^https?:\/\/ai-capital-app7\.onrender\.com$/i, // Add Render domain
  ];
  return patterns.some((p) => p.test(origin));
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser clients
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error('CORS: Origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'X-CSRF-Token',
      'Cache-Control',
      'Pragma'
    ],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// 🧠 Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 📁 Serve static files (for avatar uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 🚨 EMERGENCY FIX: Explicit preflight handler for login
app.options('*', (req, res) => {
  const origin = req.headers.origin as string | undefined;
  
  console.log(`🔄 [PREFLIGHT] Handling OPTIONS request for: ${req.url} from origin: ${origin}`);
  
  if (origin && isAllowedOrigin(origin)) {
    // Set all necessary CORS headers for allowed origin
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers, X-CSRF-Token, Cache-Control, Pragma');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    
    console.log(`✅ [PREFLIGHT] CORS headers set for allowed origin: ${origin}`);
    res.status(204).send();
  } else {
    console.log(`❌ [PREFLIGHT] Origin not allowed: ${origin}`);
    res.status(403).json({ error: 'Origin not allowed' });
  }
});

// 🚨 EMERGENCY FIX: Additional CORS headers for all responses
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  
  if (origin && isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

// CSRF Protection - Apply to all routes except health checks and auth
app.use((req, res, next) => {
  // Skip CSRF for health checks, auth endpoints, webhooks, and admin setup
  if (req.path.startsWith('/api/health') || 
      req.path.startsWith('/api/auth') || 
      req.path.startsWith('/api/stripe/webhook') ||
      req.path.startsWith('/api/debug') ||
      req.path.startsWith('/api/admin-setup')) {
    return next();
  }
  return csrfProtection(req, res, next);
});

// CSRF error handler
app.use(csrfErrorHandler);

// CSRF token endpoint
app.get('/api/csrf-token', generateCsrfToken);

// ✅ מסלולים ראשיים
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/markets', marketsRoutes);
app.use('/api/portfolios', portfoliosRoutes);
app.use('/api/risk', riskManagementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/stripe', stripeWebhookRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/expert-portfolio', expertPortfolioRoutes);
app.use('/api/admin-setup', adminSetupRoutes);
app.use('/api/ai-insights', aiInsightsRoutes);

// 🩺 בדיקת בריאות השרת
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    mongoState: mongoose.connection.readyState,
    requestId: loggerService.getRequestId(),
  };
  
  loggerService.info('Health check requested', healthData);
  res.json(healthData);
});

// 🏥 Enhanced /healthz endpoint for Render healthcheck
app.get('/healthz', (req, res) => {
  const startTime = Date.now();
  
  try {
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      mongoState: mongoose.connection.readyState,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      requestId: loggerService.getRequestId(),
      responseTime: `${Date.now() - startTime}ms`,
    };

    // Check critical services
    const isHealthy = mongoose.connection.readyState === 1;
    
    if (isHealthy) {
      loggerService.info('Healthz check passed', healthData);
      res.status(200).json(healthData);
    } else {
      loggerService.error('Healthz check failed - MongoDB not connected', healthData);
      res.status(503).json({
        ...healthData,
        status: 'ERROR',
        message: 'MongoDB connection not healthy'
      });
    }
  } catch (error) {
    const errorData = {
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: loggerService.getRequestId(),
      responseTime: `${Date.now() - startTime}ms`,
    };
    
    loggerService.error('Healthz check error', errorData);
    res.status(500).json(errorData);
  }
});

// 🧪 Test endpoint for debugging
app.get('/api/test', (req, res) => {
  console.log('🧪 [TEST] Frontend reached backend successfully');
  res.json({ message: 'Backend is reachable from frontend', timestamp: new Date().toISOString() });
});

// 📈 Markets overview (indexes + featured stocks)
app.get('/api/markets/overview', async (req, res) => {
  try {
    console.log('🔍 [MARKETS] Starting markets overview fetch...');
    
    const user = (req as any).user; // may be undefined
    let featured: string[] | undefined;
    try {
      if (user) {
        const { default: User } = await import('./models/User');
        const u = await User.findById(user._id);
        featured = u?.featuredTickers as string[] | undefined;
      }
    } catch {}
    
    const tickers = ['SPY','QQQ','DIA', ...(featured && featured.length === 4 ? featured : ['AAPL','MSFT','AMZN','TSLA'])];
    console.log('🔍 [MARKETS] Requesting tickers:', tickers);
    
    const symbolMap: Record<string,string> = { };
    const fetchSymbols = tickers.map(t => symbolMap[t] || t);
    console.log('🔍 [MARKETS] Fetch symbols:', fetchSymbols);
    
    const { stockDataService } = await import('./services/stockDataService');
    const dataMap = await stockDataService.getMultipleStockData(fetchSymbols);
    console.log('🔍 [MARKETS] Got dataMap size:', dataMap.size);
    console.log('🔍 [MARKETS] DataMap keys:', Array.from(dataMap.keys()));
    const toObj = (t: string) => {
      let key = symbolMap[t] || t;
      let d = dataMap.get(key);
      
      // No special handling
      
      if (d) {
        return { 
          symbol: t, 
          price: d.current, 
          thisMonthPercent: d.thisMonthPercent || 0 
        };
      } else {
        // Return default values instead of null
        console.warn(`⚠️ [MARKETS] No data found for ${t} (key: ${key})`);
        return { 
          symbol: t, 
          price: 0, 
          thisMonthPercent: 0 
        };
      }
    };
    res.json({
      indexes: {
        SPY: toObj('SPY'),
        QQQ: toObj('QQQ'),
        DIA: toObj('DIA'),
      },
      featured: [toObj('AAPL'), toObj('MSFT'), toObj('AMZN'), toObj('TSLA')],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Markets overview error:', error);
    res.status(500).json({ message: 'Failed to fetch markets overview' });
  }
});

// 🔧 Database cleanup endpoint to fix portfolio types
app.post('/api/fix-portfolio-types', async (req, res) => {
  try {
    const { default: Portfolio } = await import('./models/Portfolio');
    
    console.log('🔧 [CLEANUP] Fixing portfolio types from dangerous to risky...');
    
    const result = await Portfolio.updateMany(
      { portfolioType: 'dangerous' },
      { $set: { portfolioType: 'risky' } }
    );
    
    console.log(`✅ [CLEANUP] Updated ${result.modifiedCount} portfolios from dangerous to risky`);
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} portfolios from dangerous to risky`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ [CLEANUP] Error fixing portfolio types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix portfolio types',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// 🧪 API Test endpoint to check if our APIs are working
app.get('/api/test-apis', async (req, res) => {
  try {
    const { stockDataService } = await import('./services/stockDataService');
    
    console.log('🧪 [API TEST] Testing stock data APIs...');
    
    // Test with common symbols
    const testSymbols = ['AAPL', 'SPY', 'QQQ', 'DIA'];
    const results: any = {};
    
    for (const symbol of testSymbols) {
      try {
        console.log(`🧪 [API TEST] Testing ${symbol}...`);
        const data = await stockDataService.getStockData(symbol);
        results[symbol] = {
          success: !!data,
          current: data?.current || null,
          volatility: data?.volatility || null,
          source: data ? 'API' : 'Failed'
        };
        console.log(`✅ [API TEST] ${symbol}: $${data?.current || 'Failed'}`);
      } catch (error) {
        results[symbol] = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          source: 'Error'
        };
        console.error(`❌ [API TEST] ${symbol}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    res.json({
      status: 'API Test Complete',
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total: testSymbols.length,
        successful: Object.values(results).filter((r: any) => r.success).length,
        failed: Object.values(results).filter((r: any) => !r.success).length
      }
    });
  } catch (error) {
    console.error('❌ [API TEST] Test failed:', error);
    res.status(500).json({
      status: 'API Test Failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// 🏥 Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongoState: mongoose.connection.readyState,
  });
});

// 🧪 Simple test endpoint (no DB required)
app.get('/api/simple-test', (req, res) => {
  console.log('🧪 [SIMPLE TEST] Basic server test');
  res.json({ 
    status: 'OK', 
    message: 'Server is running without database',
    timestamp: new Date().toISOString(),
    mongoState: mongoose.connection.readyState,
    corsEnabled: 'ALL_ORIGINS_ALLOWED'
  });
});

// 🧪 Test stock data endpoint
app.get('/api/test-stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`🧪 [STOCK TEST] Testing stock data for ${symbol}`);
    
    const { stockDataService } = await import('./services/stockDataService');
    const stockData = await stockDataService.getStockData(symbol);
    
    if (stockData) {
      res.json({
        status: 'OK',
        symbol,
        data: stockData,
        message: 'Real-time data fetched successfully'
      });
    } else {
      res.status(500).json({
        status: 'ERROR',
        symbol,
        message: 'Failed to fetch stock data'
      });
    }
  } catch (error) {
    console.error('❌ [STOCK TEST] Error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Stock data test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🧪 Test Google Finance service endpoint
app.get('/api/test-google-finance/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`🧪 [GOOGLE FINANCE TEST] Testing Google Finance service for ${symbol}`);
    
    const { googleFinanceFormulasService } = await import('./services/googleFinanceFormulasService');
    const metrics = await googleFinanceFormulasService.getStockMetrics(symbol);
    
    res.json({
      status: 'OK',
      symbol: metrics.symbol,
      data: metrics,
      message: 'Google Finance service data fetched successfully'
    });
  } catch (error: any) {
    console.error('❌ [GOOGLE FINANCE TEST] Error:', error);
    res.status(500).json({
      status: 'ERROR',
      symbol: req.params.symbol,
      message: error.message || 'Internal server error'
    });
  }
});

// 🧪 Simple stock price endpoint (bypasses problematic service)
app.get('/api/simple-price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`🧪 [SIMPLE PRICE] Getting simple price for ${symbol}`);
    
    // Use the working stockDataService instead
    const { stockDataService } = await import('./services/stockDataService');
    const stockData = await stockDataService.getStockData(symbol);
    
    if (stockData) {
      res.json({
        success: true,
        symbol: stockData.symbol,
        price: stockData.current,
        dataSource: 'stockDataService',
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: true,
        symbol: symbol,
        price: 0,
        dataSource: 'FALLBACK - No data',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('❌ [SIMPLE PRICE] Error:', error);
    res.json({
      success: true,
      symbol: req.params.symbol,
      price: 0,
      dataSource: 'FALLBACK - Error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 🔑 Debug API keys endpoint
app.get('/api/debug/keys', (req, res) => {
  const keys = {
    ALPHA_VANTAGE_API_KEY_1: process.env.ALPHA_VANTAGE_API_KEY_1 ? 'SET' : 'NOT SET',
    ALPHA_VANTAGE_API_KEY_2: process.env.ALPHA_VANTAGE_API_KEY_2 ? 'SET' : 'NOT SET',
    ALPHA_VANTAGE_API_KEY_3: process.env.ALPHA_VANTAGE_API_KEY_3 ? 'SET' : 'NOT SET',
    ALPHA_VANTAGE_API_KEY_4: process.env.ALPHA_VANTAGE_API_KEY_4 ? 'SET' : 'NOT SET',
    FINNHUB_API_KEY_1: process.env.FINNHUB_API_KEY_1 ? 'SET' : 'NOT SET',
    FINNHUB_API_KEY_2: process.env.FINNHUB_API_KEY_2 ? 'SET' : 'NOT SET',
    FINNHUB_API_KEY_3: process.env.FINNHUB_API_KEY_3 ? 'SET' : 'NOT SET',
    FINNHUB_API_KEY_4: process.env.FINNHUB_API_KEY_4 ? 'SET' : 'NOT SET',
    FMP_API_KEY_1: process.env.FMP_API_KEY_1 ? 'SET' : 'NOT SET',
    FMP_API_KEY_2: process.env.FMP_API_KEY_2 ? 'SET' : 'NOT SET',
    FMP_API_KEY_3: process.env.FMP_API_KEY_3 ? 'SET' : 'NOT SET',
    FMP_API_KEY_4: process.env.FMP_API_KEY_4 ? 'SET' : 'NOT SET',
    FINNHUB_API_KEY: process.env.FINNHUB_API_KEY ? 'SET' : 'NOT SET',
    FMP_API_KEY: process.env.FMP_API_KEY ? 'SET' : 'NOT SET',
    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY ? 'SET' : 'NOT SET'
  };

  res.json({
    success: true,
    keys,
    timestamp: new Date().toISOString()
  });
});

// 📊 Query benchmark endpoint (admin only)
app.get('/api/debug/benchmark', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById((req as any).user?.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = (req as any).user?.id;
    const results = await queryBenchmark.runBenchmarkSuite(userId);
    
    res.json({
      success: true,
      benchmark: results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    loggerService.error('Benchmark failed:', error);
    res.status(500).json({
      success: false,
      error: 'Benchmark failed',
      message: error.message
    });
  }
});

// 🔴 Redis debug endpoint
app.get('/api/debug/redis', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById((req as any).user?.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { redisService } = await import('./services/redisService');
    
    // Test Redis connection
    const startTime = Date.now();
    let redisStatus = 'disconnected';
    let responseTime = 0;
    let error = null;

    try {
      await redisService.ping();
      redisStatus = 'connected';
      responseTime = Date.now() - startTime;
    } catch (err: any) {
      redisStatus = 'error';
      error = err.message;
      responseTime = Date.now() - startTime;
    }

    // Get Redis info if connected
    let redisInfo = null;
    if (redisStatus === 'connected') {
      try {
        redisInfo = await redisService.info();
      } catch (err) {
        // Ignore info errors
      }
    }

    res.json({
      success: true,
      redis: {
        status: redisStatus,
        responseTime,
        error,
        info: redisInfo ? {
          version: redisInfo.redis_version,
          uptime: redisInfo.uptime_in_seconds,
          connectedClients: redisInfo.connected_clients,
          usedMemory: redisInfo.used_memory_human,
          keyspaceHits: redisInfo.keyspace_hits,
          keyspaceMisses: redisInfo.keyspace_misses,
          hitRate: redisInfo.keyspace_hits / (redisInfo.keyspace_hits + redisInfo.keyspace_misses) * 100
        } : null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    loggerService.error('Redis debug failed:', error);
    res.status(500).json({
      success: false,
      error: 'Redis debug failed',
      message: error.message
    });
  }
});

// 📊 Scheduler status endpoint
app.get('/api/scheduler/status', (req, res) => {
  const status = schedulerService.getStatus();
  res.json({
    status: 'OK',
    scheduler: status,
    timestamp: new Date().toISOString()
  });
});

// 🔧 Manual trigger endpoints (for testing)
app.post('/api/scheduler/update-stocks', (req, res) => {
  schedulerService.triggerStockDataUpdate();
  res.json({ message: 'Stock data update triggered' });
});

app.post('/api/scheduler/update-portfolios', (req, res) => {
  schedulerService.triggerPortfolioUpdate();
  res.json({ message: 'Portfolio update triggered' });
});

// 🔧 Test endpoint to trigger both updates
app.post('/api/scheduler/test-update', async (req, res) => {
  try {
    console.log('🔧 [MANUAL] Triggering test update...');
    await schedulerService.triggerStockDataUpdate();
    await schedulerService.triggerPortfolioUpdate();
    res.json({ message: 'Test update completed successfully' });
  } catch (error) {
    console.error('❌ [MANUAL] Test update failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Test update failed', error: errorMessage });
  }
});

// 🔧 Test portfolio update endpoint
app.post('/api/test-portfolio-update', async (req, res) => {
  try {
    console.log('🔧 [MANUAL] Testing portfolio update...');
    const { stockDataService } = await import('./services/stockDataService');
    
    // Test with some common stocks
    const testStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'];
    const realTimeData = await stockDataService.getMultipleStockData(testStocks);
    
    res.json({
      message: 'Portfolio update test completed',
      stocks: Array.from(realTimeData.entries()).map(([symbol, data]) => ({
        symbol,
        current: data.current,
        top30D: data.top30D,
        volatility: data.volatility
      }))
    });
  } catch (error) {
    console.error('❌ [MANUAL] Portfolio update test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Portfolio update test failed', error: errorMessage });
  }
});

// 🌐 דף בית בסיסי
app.get('/', (req, res) => {
  res.send('✅ AiCapital Backend is Running and Healthy! Enhanced Security Active - VERSION 2.1');
});

// ⚠️ Enhanced Central Error Handler Middleware (JSON + logging)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log error with request context using Pino logger
  loggerService.error('Application Error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: loggerService.getRequestId(),
    errorType: err.name,
    statusCode: err.status || 500,
  });

  // Handle different error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.details || err.message,
      requestId: loggerService.getRequestId(),
    });
  }

  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access',
      requestId: loggerService.getRequestId(),
    });
  }

  if (err.name === 'ForbiddenError' || err.status === 403) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden access',
      requestId: loggerService.getRequestId(),
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message || 'Internal server error',
    requestId: loggerService.getRequestId(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.details 
    }),
  });
});

// Sentry error handler - Temporarily disabled
// if (process.env.SENTRY_DSN) {
//   app.use(Sentry.errorHandler());
// }

// 🚫 404 – לא נמצא
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// 🧩 חיבור למסד הנתונים
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('❌ Missing MONGODB_URI in environment variables');
    return;
  }

  console.log('🔍 [MONGODB] Attempting to connect to:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs

  const attemptConnect = async (attempt = 1) => {
    try {
      await mongoose.connect(mongoURI);
      console.log('✅ MongoDB connected successfully');
      
      // 📊 Ensure all indexes are created
      await ensureIndexes();
      
    } catch (error) {
      const backoffMs = Math.min(30000, attempt * 5000);
      console.error(`❌ MongoDB connection error (attempt ${attempt}). Retrying in ${backoffMs}ms`, error);
      if (attempt >= 3) {
        console.error('❌ MongoDB connection failed after 3 attempts. Server will continue but database operations may fail.');
        return;
      }
      setTimeout(() => attemptConnect(attempt + 1), backoffMs);
    }
  };

  attemptConnect();
};

// 📊 Ensure MongoDB indexes are created for optimal performance - MAJOR'S FIX
const ensureIndexes = async () => {
  const createIndexSafely = async (collection: any, indexSpec: any, options: any = {}) => {
    try {
      await collection.createIndex(indexSpec, options);
    } catch (error: any) {
      // Ignore index already exists errors (code 86)
      if (error.code !== 86 && error.codeName !== 'IndexKeySpecsConflict') {
        throw error;
      }
    }
  };

  try {
    console.log('📊 [INDEXES] Ensuring MongoDB indexes...');
    
    // Import models to trigger index creation
    await import('./models/User');
    await import('./models/Portfolio');
    await import('./models/Notification');
    await import('./models/Watchlist');
    
    // Get model collections
    const User = mongoose.model('User');
    const Portfolio = mongoose.model('Portfolio');
    const Notification = mongoose.model('Notification');
    const Watchlist = mongoose.model('Watchlist');
    
    // User indexes (with safe creation)
    await createIndexSafely(User.collection, { email: 1 }, { unique: true });
    await createIndexSafely(User.collection, { subscriptionTier: 1 });
    await createIndexSafely(User.collection, { subscriptionActive: 1 });
    await createIndexSafely(User.collection, { createdAt: -1 });
    
    // Portfolio indexes (with safe creation)
    await createIndexSafely(Portfolio.collection, { userId: 1, portfolioType: 1 });
    await createIndexSafely(Portfolio.collection, { userId: 1, portfolioId: 1 });
    await createIndexSafely(Portfolio.collection, { ticker: 1 });
    await createIndexSafely(Portfolio.collection, { action: 1 });
    await createIndexSafely(Portfolio.collection, { createdAt: -1 });
    await createIndexSafely(Portfolio.collection, { updatedAt: -1 });
    await createIndexSafely(Portfolio.collection, { userId: 1, ticker: 1 }, { unique: true });
    
    // Notification indexes (with safe creation)
    await createIndexSafely(Notification.collection, { userId: 1, readAt: 1 });
    await createIndexSafely(Notification.collection, { type: 1 });
    await createIndexSafely(Notification.collection, { priority: 1 });
    await createIndexSafely(Notification.collection, { createdAt: -1 });
    
    // Watchlist indexes (with safe creation)
    await createIndexSafely(Watchlist.collection, { userId: 1 });
    await createIndexSafely(Watchlist.collection, { ticker: 1 });
    await createIndexSafely(Watchlist.collection, { userId: 1, ticker: 1 }, { unique: true });
    await createIndexSafely(Watchlist.collection, { 'priceAlert.enabled': 1 });
    await createIndexSafely(Watchlist.collection, { addedAt: -1 });
    
    console.log('✅ [INDEXES] All MongoDB indexes ensured successfully');
  } catch (error) {
    console.error('❌ [INDEXES] Error ensuring indexes:', error);
  }
};

// 🚀 הפעלת השרת
const startServer = async () => {
  try {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(error);
      }
      // Don't exit the process, just log the error
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(reason);
      }
      // Don't exit the process, just log the error
    });

    // Start the server immediately so platform health checks can succeed
    const server = app.listen(PORT, '0.0.0.0', () => {
      loggerService.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      });
      
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Start watchlist monitoring service
      watchlistMonitorService.startMonitoring();
      loggerService.info('✅ [WATCHLIST MONITOR] Service initialized');
      
      // Start watchlist alert service - MAJOR'S REQUIREMENT
      watchlistAlertService.startMonitoring();
      loggerService.info('✅ [WATCHLIST ALERTS] Service initialized');
    });

    // Handle server errors
    server.on('error', (error: any) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error('❌ Port already in use');
      }
    });

    // Connect to DB in the background with retries
    connectDB();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    // Don't exit the process in production
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// 🧯 Additional error handling for production stability

startServer();
