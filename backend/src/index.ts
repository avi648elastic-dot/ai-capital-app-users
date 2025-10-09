import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';

import authRoutes from './routes/auth';
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
import { schedulerService } from './services/schedulerService';

// Load environment variables
dotenv.config();

const app = express();

// ✅ Render מחייב להשתמש ב־process.env.PORT
const PORT = Number(process.env.PORT) || 10000;

// 🔒 אבטחה
app.use(helmet());

// 🧁 Cookie Parser – חובה בשביל לזהות token מה-cookie
app.use(cookieParser());

// 🔄 Rate Limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// ✅ רשימת דומיינים מותרים לגישה
const allowedOrigins = [
  'https://ai-capital.vercel.app',
  'https://ai-capital-app7-qalnn40zw-avi648elastic-dots-projects.vercel.app',
  'https://ai-capital-app7.onrender.com',
  'http://localhost:3000',
  'https://ai-capital-app7-git-main-avi648elastic-dots-projects.vercel.app',
  'https://ai-capital-app7.vercel.app',
  'https://ai-capital-app7-c08qh68ux-avi648elastic-dots-projects.vercel.app',
];

// ⚙️ CORS – כולל credentials כדי להעביר cookies
app.use(
  cors({
    origin: true, // Allow all origins temporarily
    credentials: true, // חשוב מאוד — מאפשר שליחת cookies
  })
);

// 🧠 Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 📁 Serve static files (for avatar uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ✅ מסלולים ראשיים
app.use('/api/auth', authRoutes);
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

// 🩺 בדיקת בריאות השרת
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
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
  res.send('✅ AiCapital Backend is Running and Healthy! CORS: ALL_ORIGINS_ALLOWED - VERSION 2.0');
});

// ⚠️ טיפול בשגיאות כלליות
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

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

// 🚀 הפעלת השרת
const startServer = async () => {
  try {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      // Don't exit the process, just log the error
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit the process, just log the error
    });

    // Start the server immediately so platform health checks can succeed
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
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
