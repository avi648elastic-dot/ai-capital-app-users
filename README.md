# AiCapital V2 - AI-Powered Portfolio Management Platform

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)

**A full-stack, AI-powered portfolio management application with real-time market data, intelligent trading decisions, and comprehensive analytics.**

[Live Demo](https://ai-capital-app7.vercel.app) | [Documentation](#documentation) | [API Reference](#api-endpoints)

</div>

---

> **🚀 DEPLOYMENT STATUS (Updated: October 10, 2025)**  
> ✅ **Production Ready** - Application is fully functional and deployed  
> ✅ **Redis Issue Fixed** - See [RENDER_DEPLOYMENT_FIX.md](RENDER_DEPLOYMENT_FIX.md) for details  
> ✅ **70% Complete** - MVP ready, see [PROGRESS_SUMMARY.md](PROGRESS_SUMMARY.md) for full status  
> 📋 **TODO Lists** - See [TODO-Part1.md](TODO-Part1.md) through [TODO-Part4.md](TODO-Part4.md) for remaining tasks

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Subscription Plans](#subscription-plans)
- [AI Decision Engine](#ai-decision-engine)
- [API Documentation](#api-endpoints)
- [Deployment](#deployment)
- [Mobile Optimization](#mobile-optimization)
- [Legal & Compliance](#legal--compliance)
- [Contributing](#contributing)

---

## 🎯 Overview

AiCapital V2 is a sophisticated portfolio management platform that combines artificial intelligence with real-time market data to provide intelligent trading recommendations. The platform features a modern, mobile-first UI with comprehensive analytics, multi-portfolio support, and a tiered subscription model.

### What Makes AiCapital Unique?

- **AI-Powered Decisions**: Automated BUY/HOLD/SELL recommendations based on multiple market indicators
- **Real-Time Data**: Integration with Finnhub, Alpha Vantage, and Yahoo Finance APIs
- **Multi-Portfolio Management**: Support for both Solid (conservative) and Risky (aggressive) portfolios
- **Comprehensive Analytics**: Advanced performance metrics including Sharpe Ratio, volatility, and drawdown analysis
- **Mobile-First Design**: Fully optimized responsive UI for all devices
- **Subscription Tiers**: Free, Premium, and Premium+ plans with feature gating

---

## ✨ Key Features

### 🎨 User Interface & Experience

- **Modern Dark/Light Themes**: Clean, professional interface with theme switching
- **Responsive Design**: Mobile-first approach with optimized layouts for all screen sizes
- **Persistent Navigation**: Efficient left sidebar navigation that persists across pages
- **Real-Time Updates**: Live portfolio data with manual and scheduled refresh options
- **Interactive Charts**: Beautiful, responsive charts powered by Recharts and custom SVG components

### 📊 Portfolio Management

- **Multi-Portfolio Support**: 
  - Free: 1 portfolio (10 stocks)
  - Premium: 6 portfolios (3 Solid + 3 Risky, 15 stocks each)
  - Premium+: 10 portfolios (5 Solid + 5 Risky, 20 stocks each)
- **Portfolio Types**:
  - **Solid Portfolios**: Conservative, low-risk investments
  - **Risky Portfolios**: Aggressive, high-reward strategies
- **Import/Export**: CSV import for existing portfolios
- **Real-Time Tracking**: Live P&L, percentage gains, and performance metrics
- **Exchange Information**: Automatic detection of stock exchanges (NYSE, NASDAQ, etc.)

### 🤖 AI Decision Engine

The platform's core intelligence system analyzes multiple factors:

- **Stop Loss & Take Profit**: Automatic risk management
- **Performance Comparison**: Analysis vs TOP30D and TOP60D benchmarks
- **Monthly Trends**: This month and last month performance tracking
- **Price Analysis**: Current price vs entry price evaluation
- **Scoring System**: Weighted decision-making algorithm
- **Real-Time Updates**: Scheduled portfolio updates every 30 minutes

### 📈 Analytics & Reporting

- **Performance Page**: 
  - Dynamic calculations with 7d, 30d, 60d, 90d timeframes
  - Sharpe Ratio and volatility metrics
  - Max drawdown analysis
  - Total return tracking
- **Portfolio Analysis**:
  - Comprehensive portfolio overview
  - Risk metrics and assessment
  - Sector distribution analysis
  - AI-powered insights
- **Risk Management**: 
  - Portfolio risk scoring
  - Diversification analysis
  - Volatility tracking
- **Watchlist**: Track stocks of interest
- **Reports**: Market news and earnings reports

### 🔐 Authentication & Security

- **JWT-Based Authentication**: Secure token-based auth system
- **Password Encryption**: Bcrypt hashing for user passwords
- **Protected Routes**: Middleware-based route protection
- **Session Management**: Secure cookie-based sessions
- **Email Validation**: Duplicate email prevention

### 👤 User Management

- **Profile Management**: 
  - Avatar upload (1MB max, JPEG/PNG/WebP)
  - Name and email updates
  - Subscription tier display
- **Settings**:
  - Theme switching (Dark/Light)
  - Language preferences
  - Notification settings
  - Account management
- **Onboarding Flow**:
  - Step 0: Terms & Privacy acceptance, theme selection
  - Step 1: Portfolio preference (Import/Create)
  - Step 2a: Import existing portfolio
  - Step 2b: AI portfolio generation
  - Step 3: Portfolio confirmation

### 👨‍💼 Admin Dashboard

- **User Management**: View all users with portfolio statistics
- **Portfolio Monitoring**: Real-time P&L tracking for all users
- **User Actions**:
  - Activate/Deactivate subscriptions
  - Reset portfolios
  - Refresh individual user data
  - Update all prices system-wide
- **System Statistics**: Platform-wide metrics and analytics

### 🌐 Market Data

- **Markets Overview**: 
  - Real-time index tracking (SPY, QQQ, DIA, IWM)
  - Descriptive labels (S&P 500, NASDAQ, DOW, Russell 2000)
  - Featured stocks with live prices
- **Real-Time Quotes**: Live stock prices from multiple data sources
- **Historical Data**: Price history for performance calculations
- **Exchange Detection**: Automatic stock exchange identification

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.0.4 | React framework with App Router |
| **React** | 18.2.0 | UI library |
| **TypeScript** | 5.0+ | Type safety |
| **Tailwind CSS** | 3.3+ | Utility-first CSS |
| **Recharts** | 2.10+ | Data visualization |
| **Axios** | 1.6+ | HTTP client |
| **Lucide React** | Latest | Icon library |
| **js-cookie** | 3.0+ | Cookie management |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express.js** | 4.18+ | Web framework |
| **TypeScript** | 5.0+ | Type safety |
| **MongoDB** | 7.0+ | Database |
| **Mongoose** | 8.0+ | ODM |
| **JWT** | 9.0+ | Authentication |
| **Bcryptjs** | 2.4+ | Password hashing |
| **Multer** | 1.4+ | File uploads |
| **Node-cron** | 3.0+ | Scheduled tasks |

### APIs & Services

- **Finnhub API**: Real-time stock quotes and company data
- **Alpha Vantage API**: Historical data and technical indicators
- **Yahoo Finance**: Backup data source
- **MongoDB Atlas**: Cloud database hosting
- **Vercel**: Frontend deployment
- **Render**: Backend deployment

### DevOps

- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Git**: Version control
- **GitHub**: Repository hosting
- **Vercel**: CI/CD for frontend
- **Render**: CI/CD for backend

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Desktop    │  │    Tablet    │  │    Mobile    │      │
│  │   Browser    │  │   Browser    │  │   Browser    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  App Router  │  Components  │  Contexts  │  Hooks    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Persistent Layout  │  Theme System  │  Auth Context │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Auth Middleware  │  Routes  │  Controllers          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Services Layer                                       │  │
│  │  • Decision Engine  • Stock Data  • Scheduler        │  │
│  │  • Analytics  • Sector Analysis  • Historical Data   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   MongoDB Database       │  │   External APIs          │
│  • Users                 │  │  • Finnhub               │
│  • Portfolios            │  │  • Alpha Vantage         │
│  • Historical Data       │  │  • Yahoo Finance         │
└──────────────────────────┘  └──────────────────────────┘
```

### Project Structure

```
aicapital-users/
├── frontend/
│   ├── app/
│   │   ├── (app)/                    # Authenticated app pages
│   │   │   ├── layout.tsx           # Persistent navigation layout
│   │   │   ├── dashboard/           # Main dashboard
│   │   │   ├── analytics/           # Analytics pages
│   │   │   │   ├── page.tsx        # Main analytics
│   │   │   │   ├── performance/    # Performance metrics
│   │   │   │   ├── portfolio-analysis/
│   │   │   │   ├── risk-management/
│   │   │   │   ├── watchlist/
│   │   │   │   └── reports/
│   │   │   ├── subscription/        # Subscription management
│   │   │   ├── profile/            # User profile
│   │   │   ├── settings/           # App settings
│   │   │   └── admin/              # Admin dashboard
│   │   ├── onboarding/             # Onboarding flow
│   │   ├── page.tsx                # Login/Signup
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles
│   ├── components/
│   │   ├── Charts.tsx              # Chart components
│   │   ├── Header.tsx              # Top header
│   │   ├── Navigation.tsx          # Desktop navigation
│   │   ├── MobileNavigation.tsx    # Mobile navigation
│   │   ├── ResponsiveNavigation.tsx # Combined navigation
│   │   ├── PortfolioTable.tsx      # Portfolio table
│   │   ├── PortfolioSummary.tsx    # Portfolio cards
│   │   ├── MarketOverview.tsx      # Market indices
│   │   ├── ThemeToggle.tsx         # Theme switcher
│   │   ├── LegalDisclaimer.tsx     # Legal notices
│   │   └── onboarding/             # Onboarding components
│   ├── contexts/
│   │   ├── ThemeContext.tsx        # Theme management
│   │   └── LanguageContext.tsx     # i18n support
│   ├── hooks/
│   │   └── useDevice.ts            # Device detection
│   └── utils/
│       └── subscriptionLimits.ts   # Plan limits
│
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.ts             # User model
│   │   │   ├── Portfolio.ts        # Portfolio model
│   │   │   └── HistoricalData.ts   # Price history
│   │   ├── routes/
│   │   │   ├── auth.ts             # Authentication
│   │   │   ├── onboarding.ts       # Onboarding flow
│   │   │   ├── portfolio.ts        # Single portfolio
│   │   │   ├── portfolios.ts       # Multiple portfolios
│   │   │   ├── analytics.ts        # Analytics data
│   │   │   ├── performance.ts      # Performance metrics
│   │   │   ├── stocks.ts           # Stock data
│   │   │   ├── subscription.ts     # Subscription management
│   │   │   ├── user.ts             # User management
│   │   │   └── admin.ts            # Admin functions
│   │   ├── services/
│   │   │   ├── decisionEngine.ts   # AI decision logic
│   │   │   ├── stockDataService.ts # Stock data fetching
│   │   │   ├── schedulerService.ts # Cron jobs
│   │   │   ├── sectorService.ts    # Sector analysis
│   │   │   ├── dynamicSectorService.ts
│   │   │   ├── historicalDataService.ts
│   │   │   └── googleSheetsSimulator.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT verification
│   │   │   └── requireSubscription.ts
│   │   └── index.ts                # Server entry point
│   ├── uploads/                    # User avatars
│   └── package.json
│
├── docker-compose.yml              # Docker services
├── Dockerfile                      # Multi-stage build
├── render.yaml                     # Render deployment config
├── package.json                    # Root package
└── README.md                       # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** 7.0+ ([Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git** ([Download](https://git-scm.com/downloads))
- **API Keys** (all free):
  - [Finnhub API Key](https://finnhub.io/register) - 60 calls/minute
  - [Alpha Vantage API Key](https://www.alphavantage.co/support/#api-key) - 25 calls/day
  - Optional: [Yahoo Finance](https://rapidapi.com/apidojo/api/yahoo-finance1/)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/aicapital-users.git
cd aicapital-users
```

#### 2. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm run install:all

# Or install individually
cd frontend && npm install
cd ../backend && npm install
```

#### 3. Environment Configuration

**Backend Environment** (`backend/.env`):

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/aicapital
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aicapital

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# API Keys
FINNHUB_API_KEY=your_finnhub_api_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here

# Optional
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key
GOOGLE_SHEETS_SHEET_ID=your_sheet_id
```

**Frontend Environment** (`frontend/.env.local`):

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

#### 4. Start MongoDB

**Option A: Local MongoDB**
```bash
mongod
```

**Option B: Docker MongoDB**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

**Option C: MongoDB Atlas**
- Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get your connection string
- Update `MONGODB_URI` in backend `.env`

#### 5. Run the Application

**Development Mode** (with hot reload):

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run dev:frontend  # Frontend: http://localhost:3000
npm run dev:backend   # Backend: http://localhost:5000
```

**Production Mode**:

```bash
# Build both
npm run build

# Start production servers
npm start
```

#### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

### Docker Setup

#### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Using Docker Directly

```bash
# Build image
docker build -t aicapital-users .

# Run container
docker run -p 3000:3000 -p 5000:5000 \
  -e MONGODB_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  aicapital-users
```

### First-Time Setup

1. **Create Admin User**:
   - Navigate to http://localhost:3000
   - Click "Sign Up"
   - Register with email and password
   - Complete onboarding

2. **Test the System**:
   - Add a test stock (e.g., AAPL)
   - View AI recommendations
   - Check analytics page
   - Test mobile responsiveness

3. **Admin Access**:
   - Navigate to `/admin`
   - View all users and portfolios
   - Test user management features

---

## 💳 Subscription Plans

### Plan Comparison

| Feature | Free | Premium | Premium+ |
|---------|------|---------|----------|
| **Price** | $0 | $9.99/mo or $79/year | $17.99/mo or $149.99/year |
| **Portfolios** | 1 | 6 (3 Solid + 3 Risky) | 10 (5 Solid + 5 Risky) |
| **Stocks per Portfolio** | 10 | 15 | 20 |
| **AI Engine** | ✅ Basic | ✅ Advanced | ✅ Premium |
| **Performance Tracking** | ✅ | ✅ | ✅ |
| **Portfolio Analysis** | ❌ | ✅ | ✅ |
| **Risk Management** | ❌ | ✅ | ✅ |
| **Watchlist** | ❌ | ✅ | ✅ |
| **Reports** | ❌ | ✅ | ✅ |
| **Custom Reports** | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ |

### Upgrading Plans

Users can upgrade their plan from the `/subscription` page. The system enforces limits based on the user's subscription tier stored in MongoDB.

---

## 🤖 AI Decision Engine

### Algorithm Overview

The AI Decision Engine (`decisionEngine.ts`) uses a sophisticated scoring system to generate BUY/HOLD/SELL recommendations.

### Decision Factors

#### 1. Absolute Rules (Highest Priority)

```typescript
if (currentPrice <= stopLoss) return { action: 'SELL', reason: 'Stop loss triggered' };
if (currentPrice >= takeProfit) return { action: 'SELL', reason: 'Take profit reached' };
```

#### 2. Scoring System

| Factor | Weight | Condition | Score |
|--------|--------|-----------|-------|
| **Current vs TOP60** | 30% | > 90% of TOP60 | +1 |
| | | < 70% of TOP60 | -1 |
| **This Month %** | 20% | > +10% | +1 |
| | | < -10% | -1 |
| **Last Month %** | 20% | > +10% | +1 |
| | | < -10% | -1 |
| **Price vs Entry** | 30% | Current > Entry | +1 |
| | | Current < Entry | -1 |

#### 3. Final Decision Logic

```typescript
if (score >= 2) return 'BUY';
if (score <= -2) return 'SELL';
return 'HOLD';
```

### Example Calculation

```
Stock: AAPL
Current Price: $180
Entry Price: $170
Stop Loss: $160
Take Profit: $200
TOP60: $175
This Month: +8%
Last Month: +12%

Scoring:
- Current vs TOP60: $180 > $175 (102%) → +1 (>90%)
- This Month: +8% → 0 (between -10% and +10%)
- Last Month: +12% → +1 (>10%)
- Price vs Entry: $180 > $170 → +1

Total Score: +3 → BUY
```

### Scheduled Updates

The system automatically updates portfolio decisions every 30 minutes using `node-cron`:

```typescript
// Every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  await updatePortfolioDecisions();
});
```

---

## 📡 API Endpoints

### Authentication

#### POST `/api/auth/signup`
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "subscriptionTier": "free"
  }
}
```

#### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### GET `/api/auth/me`
Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

---

### Portfolio Management

#### GET `/api/portfolio`
Get user's current portfolio with real-time data.

**Response:**
```json
{
  "success": true,
  "portfolio": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "ticker": "AAPL",
      "companyName": "Apple Inc.",
      "shares": 10,
      "entryPrice": 170.00,
      "currentPrice": 180.00,
      "stopLoss": 160.00,
      "takeProfit": 200.00,
      "action": "BUY",
      "reason": "Strong performance vs benchmarks",
      "color": "green",
      "exchange": "NASDAQ",
      "pnl": 100.00,
      "pnlPercentage": 5.88
    }
  ]
}
```

#### POST `/api/portfolio/add`
Add a new stock to portfolio.

**Request:**
```json
{
  "ticker": "AAPL",
  "shares": 10,
  "entryPrice": 170.00,
  "portfolioType": "solid"
}
```

#### PUT `/api/portfolio/:id`
Update existing stock position.

#### DELETE `/api/portfolio/:id`
Remove stock from portfolio.

---

### Analytics

#### GET `/api/analytics/portfolio-analysis`
Get comprehensive portfolio analysis.

**Response:**
```json
{
  "success": true,
  "portfolioPerformance": [...],
  "sectorAllocation": [...],
  "riskAssessment": {
    "overallRisk": "Medium",
    "volatility": 0.15,
    "sharpeRatio": 1.2
  }
}
```

#### GET `/api/performance`
Get performance metrics with dynamic calculations.

**Query Parameters:**
- `period`: 7d, 30d, 60d, 90d

**Response:**
```json
{
  "success": true,
  "metrics": [
    {
      "ticker": "AAPL",
      "currentPrice": 180.00,
      "price90d": 160.00,
      "sharpeRatio": 1.5,
      "volatility": 0.12,
      "maxDrawdown": -8.5,
      "totalReturn": 12.5
    }
  ]
}
```

---

### Admin

#### GET `/api/admin/users`
Get all users with portfolio statistics.

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "subscriptionTier": "premium",
      "portfolioValue": 50000,
      "pnl": 5000,
      "pnlPercentage": 10.0,
      "stockCount": 8,
      "isActive": true
    }
  ]
}
```

#### POST `/api/admin/users/:userId/refresh`
Manually refresh a specific user's portfolio data.

#### POST `/api/admin/update-all-prices`
Trigger system-wide price update for all users.

---

### User Management

#### GET `/api/user/profile`
Get user profile data.

#### PUT `/api/user/profile`
Update user profile.

**Request:**
```json
{
  "name": "John Doe Updated",
  "email": "newemail@example.com"
}
```

#### POST `/api/user/avatar`
Upload user avatar.

**Request:** `multipart/form-data`
- `avatar`: Image file (max 1MB, JPEG/PNG/WebP)

---

## 🌐 Deployment

> **⚠️ IMPORTANT:** If you're experiencing Redis connection errors on Render, see [RENDER_DEPLOYMENT_FIX.md](RENDER_DEPLOYMENT_FIX.md) for the complete fix guide.

### Frontend Deployment (Vercel)

1. **Connect Repository**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Select the `frontend` directory as root

2. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

3. **Build Settings**:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Backend Deployment (Render)

1. **Create Web Service**:
   - Go to [Render](https://render.com)
   - New → Web Service
   - Connect your GitHub repository

2. **Configuration**:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Health Check Path: `/healthz`

3. **Environment Variables** (Required):
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-production-secret-min-32-chars
   SESSION_SECRET=your-session-secret-min-32-chars
   ```

4. **Optional Environment Variables**:
   ```
   # Stock Data APIs (at least one recommended)
   FINNHUB_API_KEY=your-key
   ALPHA_VANTAGE_API_KEY=your-key
   FINANCIAL_MODELING_PREP_API_KEY=your-key
   
   # Redis (optional - app works without it)
   REDIS_URL=redis://your-redis-url:6379
   
   # Monitoring (optional)
   SENTRY_DSN=your-sentry-dsn
   
   # Payments (when ready)
   STRIPE_SECRET_KEY=your-stripe-key
   STRIPE_WEBHOOK_SECRET=your-webhook-secret
   ```

5. **Important Notes**:
   - ✅ Redis is **optional** - app runs without it
   - ✅ Health check should point to `/healthz`
   - ✅ JWT_SECRET should be at least 32 characters
   - ✅ Get at least one stock data API key (Finnhub is free)

6. **Troubleshooting**:
   - Redis errors? See [RENDER_DEPLOYMENT_FIX.md](RENDER_DEPLOYMENT_FIX.md)
   - Health check failing? Check MONGODB_URI connection
   - CORS errors? Add your frontend URL to `allowedOrigins` in `backend/src/index.ts`

### Database (MongoDB Atlas)

1. **Create Cluster**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free M0 cluster

2. **Network Access**:
   - Add IP: `0.0.0.0/0` (allow all)

3. **Database User**:
   - Create user with read/write permissions

4. **Get Connection String**:
   - Connect → Drivers → Copy connection string
   - Update `MONGODB_URI` in your environment

---

## 📱 Mobile Optimization

The application is fully optimized for mobile devices with:

### Responsive Design Patterns

- **Breakpoints**:
  - `sm`: 640px (tablets)
  - `md`: 768px (small laptops)
  - `lg`: 1024px (desktops)
  - `xl`: 1280px (large screens)

- **Mobile-First Approach**:
  ```tsx
  // Text sizes
  className="text-2xl sm:text-3xl lg:text-4xl"
  
  // Spacing
  className="px-4 sm:px-6 lg:px-8"
  
  // Grid layouts
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
  ```

### Mobile Features

- **Touch-Optimized**: Larger tap targets (min 44x44px)
- **Responsive Navigation**: Hamburger menu on mobile, sidebar on desktop
- **Optimized Charts**: Responsive SVG charts that scale properly
- **Efficient Layouts**: 2-column grids on mobile to reduce empty space
- **Full-Width Buttons**: Better UX on mobile devices
- **Persistent Navigation**: Efficient page transitions without re-rendering nav

---

## ⚖️ Legal & Compliance

### Investment Disclaimer

The application includes comprehensive legal disclaimers:

- **Risk Warning**: Investment risks and potential losses
- **No Financial Advice**: AI recommendations are not professional advice
- **GDPR Compliance**: Data protection and privacy rights
- **Terms of Service**: User agreements and responsibilities
- **Privacy Policy**: Data collection and usage policies

### Onboarding Legal Flow

Users must accept Terms of Service and Privacy Policy during onboarding (Step 0). Legal documents are displayed in modal windows with full text visibility.

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the Repository**
2. **Create Feature Branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make Changes**:
   - Follow TypeScript best practices
   - Add comments for complex logic
   - Update documentation
4. **Test Thoroughly**:
   - Test on multiple devices
   - Check mobile responsiveness
   - Verify API endpoints
5. **Commit Changes**:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
6. **Push to Branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open Pull Request**

### Commit Message Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or auxiliary tool changes

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: [GitHub Issues](https://github.com/your-username/aicapital-users/issues)
- **Email**: support@aicapital.com
- **Discord**: [Join our community](https://discord.gg/aicapital)

### Reporting Bugs

When reporting bugs, please include:
- Browser/device information
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Console errors

---

## 🎯 Roadmap

### Version 2.1 (Q1 2025)
- [ ] Real-time WebSocket updates
- [ ] Advanced charting with TradingView
- [ ] Social trading features
- [ ] Mobile app (React Native)

### Version 2.2 (Q2 2025)
- [ ] Options trading support
- [ ] Crypto portfolio tracking
- [ ] Advanced backtesting
- [ ] AI-powered portfolio rebalancing

### Version 3.0 (Q3 2025)
- [ ] Multi-language support
- [ ] Dark/Light/Custom themes
- [ ] API for third-party integrations
- [ ] White-label solution

---

## 🙏 Acknowledgments

- **Next.js Team**: Amazing React framework
- **Vercel**: Excellent hosting platform
- **MongoDB**: Reliable database solution
- **Finnhub**: Real-time market data
- **Alpha Vantage**: Historical data and indicators
- **Tailwind CSS**: Beautiful utility-first CSS
- **Recharts**: Powerful charting library

---

## 📊 Statistics

![GitHub stars](https://img.shields.io/github/stars/your-username/aicapital-users?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/aicapital-users?style=social)
![GitHub issues](https://img.shields.io/github/issues/your-username/aicapital-users)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-username/aicapital-users)

---

<div align="center">

**Built with ❤️ by the AiCapital Team**

[Website](https://ai-capital-app7.vercel.app) • [GitHub](https://github.com/your-username/aicapital-users) • [Documentation](https://docs.aicapital.com)

**Last Updated**: October 10, 2025 | **Version**: 2.0.1

📝 **Recent Changes:**
- Fixed Redis deployment issue (made optional)
- Updated security middleware
- Added comprehensive health checks
- Improved error handling and logging

📚 **Documentation:**
- [RENDER_DEPLOYMENT_FIX.md](RENDER_DEPLOYMENT_FIX.md) - Deployment troubleshooting
- [PROGRESS_SUMMARY.md](PROGRESS_SUMMARY.md) - Current development status
- [TODO-Part1.md](TODO-Part1.md) to [TODO-Part4.md](TODO-Part4.md) - Roadmap

</div>
