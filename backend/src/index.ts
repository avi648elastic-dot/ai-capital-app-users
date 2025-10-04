import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import portfolioRoutes from './routes/portfolio';
import shopifyRoutes from './routes/shopify';
import onboardingRoutes from './routes/onboarding';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT; // ✅ Render מגדיר את זה אוטומטית — לא נוגעים!

// 🧠 Helper: timestamped log
const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);

// --- Security Middleware ---
app.use(helmet());

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// --- Allowed Origins (CORS) ---
const allowedOrigins = [
  'https://ai-capital-app7-qalnn40zw-avi648elastic-dots-projects.vercel.app',
  'https://ai-capital-app7.onrender.com',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        log(`❌ Blocked CORS from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// --- Body Parsing ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/admin', adminRoutes);

// --- Health Check (Render מזהה לפי זה שהאפליקציה חיה) ---
app.get('/', (req, res) => {
  res.send('✅ AiCapital Backend is Running!');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// --- Error Handling ---
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  log(`❗ Error: ${err.message}`);
  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

// --- 404 Handler ---
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// --- MongoDB Connection ---
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) throw new Error('Missing MONGODB_URI in environment');
    await mongoose.connect(mongoURI);
    log('✅ MongoDB connected successfully');
  } catch (error) {
    log(`❌ MongoDB connection error: ${(error as Error).message}`);
    process.exit(1);
  }
};

// --- Start Server ---
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    log(`🚀 Server running on port ${PORT}`);
    log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // 🛑 Graceful shutdown (Render שולחת SIGTERM)
  process.on('SIGTERM', () => {
    log('🧹 SIGTERM received. Closing server gracefully...');
    server.close(() => {
      log('✅ Server closed. Exiting process.');
      process.exit(0);
    });
  });
};

// --- Global Error Handling ---
process.on('unhandledRejection', (err: any) => {
  log(`💥 Unhandled Promise Rejection: ${err.message}`);
  process.exit(1);
});

process.on('uncaughtException', (err: any) => {
  log(`💥 Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// --- Run ---
startServer();
