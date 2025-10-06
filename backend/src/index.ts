import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import portfolioRoutes from './routes/portfolio';
import shopifyRoutes from './routes/shopify';
import onboardingRoutes from './routes/onboarding';
import adminRoutes from './routes/admin';

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

// ✅ מסלולים ראשיים
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/admin', adminRoutes);

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

// 🌐 דף בית בסיסי
app.get('/', (req, res) => {
  res.send('✅ AiCapital Backend is Running and Healthy!');
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
    process.exit(1);
  }
};

// 🧯 טיפול בחריגות בלתי צפויות
process.on('unhandledRejection', (err: any) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err: any) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();
