# AiCapital for Users

A full-stack portfolio management application with AI-powered trading decisions, built with Next.js, Express, MongoDB, and TypeScript.

## Features

- **Smart Onboarding Flow**: Guided setup for new users with portfolio import or AI generation
- **User Authentication**: Secure login/signup with JWT tokens
- **Portfolio Management**: Add, edit, and track your stock positions
- **AI Decision Engine**: Automated BUY/HOLD/SELL recommendations based on:
  - Stop loss and take profit rules
  - Performance vs TOP30/TOP60 stocks
  - Monthly performance trends
  - Price vs entry analysis
- **AI Portfolio Generation**: Automatic stock selection and allocation based on risk preferences
- **Portfolio Types**: Solid (conservative) and Dangerous (aggressive) portfolio options
- **Real-time Data**: Integration with Finnhub and Financial Modeling Prep APIs for live market data
- **Professional UI**: Dark theme with TailwindCSS
- **Charts & Analytics**: Portfolio visualization with Recharts
- **Admin Dashboard**: Complete user and portfolio management system
- **Subscription Management**: Shopify webhook integration
- **Docker Support**: Production-ready containerization

## Tech Stack

### Frontend
- Next.js 14 (React 18)
- TypeScript
- TailwindCSS
- Recharts
- Axios
- Lucide React

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- Finnhub API
- Financial Modeling Prep API
- Bcryptjs

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Finnhub API Key (free at https://finnhub.io/register)
- Financial Modeling Prep API Key (free at https://financialmodelingprep.com/developer/docs)
- Docker (optional)

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FINNHUB_API_KEY=your_finnhub_api_key
FMP_API_KEY=your_fmp_api_key
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key
GOOGLE_SHEETS_SHEET_ID=your_google_sheet_id
```

**Important**: 
- Get your free Finnhub API key at https://finnhub.io/register (60 calls/minute)
- Get your free FMP API key at https://financialmodelingprep.com/developer/docs (250 calls/day)
- The system will work with mock data if no API keys are provided
- Finnhub provides real-time quotes, FMP provides historical data and market cap

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aicapital-users
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   Create `backend/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/aicapital
   JWT_SECRET=your-super-secret-jwt-key-here
   GOOGLE_SHEETS_API_KEY=your-google-sheets-api-key
   GOOGLE_SHEETS_SHEET_ID=your-google-sheet-id
   NODE_ENV=development
   ```

   Create `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB locally
   mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   ```

5. **Run the application**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:frontend  # Frontend on http://localhost:3000
   npm run dev:backend   # Backend on http://localhost:5000
   ```

### Docker Setup

1. **Using Docker Compose (Recommended)**
   ```bash
   docker-compose up -d
   ```

2. **Using Docker directly**
   ```bash
   docker build -t aicapital-users .
   docker run -p 3000:3000 -p 5000:5000 aicapital-users
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Onboarding
- `GET /api/onboarding/status` - Check onboarding completion status
- `POST /api/onboarding/check-existing` - Set portfolio preference
- `POST /api/onboarding/import-portfolio` - Import existing portfolio
- `POST /api/onboarding/generate-portfolio` - Generate AI portfolio
- `POST /api/onboarding/confirm-portfolio` - Confirm and save portfolio
- `POST /api/onboarding/skip` - Skip onboarding

### Portfolio
- `GET /api/portfolio` - Get user portfolio
- `POST /api/portfolio/add` - Add new stock
- `PUT /api/portfolio/:id` - Update stock
- `DELETE /api/portfolio/:id` - Delete stock
- `GET /api/portfolio/decisions` - Update AI decisions

### Admin
- `GET /api/admin/users` - Get all users with portfolio stats
- `GET /api/admin/users/:id/portfolio` - Get specific user's portfolio
- `PUT /api/admin/users/:id/activate` - Activate user subscription
- `PUT /api/admin/users/:id/deactivate` - Deactivate user subscription
- `DELETE /api/admin/users/:id/portfolio` - Reset user portfolio
- `GET /api/admin/stats` - Get system statistics

### Shopify Integration
- `POST /api/shopify/webhook` - Subscription webhook
- `POST /api/shopify/mock-subscription` - Mock subscription for testing

## Onboarding Flow

The application features a comprehensive onboarding process for new users:

### Step 1: Portfolio Preference
- **Existing Portfolio**: Users can import their current stock holdings
- **New Portfolio**: Users can create an AI-generated portfolio from scratch

### Step 2a: Import Existing Portfolio
- Enter stock tickers, shares, entry prices, and current prices
- Set total portfolio value and risk tolerance
- System automatically calculates stop losses and take profits
- AI decisions are applied to imported stocks

### Step 2b: AI Portfolio Generation
- Choose portfolio type: **Solid** (conservative) or **Dangerous** (aggressive)
- Set investment amount and risk tolerance
- AI selects and allocates stocks based on:
  - Market performance data
  - Volatility analysis
  - Risk-weighted distribution
  - Portfolio type preferences

### Step 3: Portfolio Confirmation
- Review generated or imported portfolio
- See calculated stop losses, take profits, and allocations
- Confirm to save portfolio and complete onboarding

### Admin Dashboard
- Complete user management system
- View all users and their portfolio statistics
- Activate/deactivate user subscriptions
- Reset user portfolios
- Monitor system-wide performance metrics

## User Experience Flow

### **New User Journey**

1. **Registration**: Create account with email and password
2. **Onboarding**: Guided setup process
   - Choose to import existing portfolio or create new AI portfolio
   - For imports: Enter stock details, set risk tolerance
   - For AI generation: Select portfolio type (Solid/Dangerous), set investment amount
3. **Portfolio Review**: Confirm generated or imported portfolio
4. **Dashboard Access**: Full portfolio management with AI decisions

### **Daily Usage**

- **Portfolio Monitoring**: View real-time P&L and AI recommendations
- **Decision Updates**: Refresh AI decisions based on latest market data
- **Portfolio Management**: Add, edit, or remove stocks
- **Analytics**: Review charts and performance metrics
- **Admin Functions**: Manage users and system (admin only)

## AI Decision Algorithm

The `decideActionEnhanced` function uses a scoring system:

### Absolute Rules (Priority 1)
- If current price ≤ stop loss → **SELL**
- If current price ≥ take profit → **SELL**

### Scoring System (Priority 2)
- **Current vs TOP60** (30% weight)
  - >90% of TOP60 → +1
  - <70% of TOP60 → -1
- **This Month %** (20% weight)
  - >10% → +1
  - <-10% → -1
- **Last Month %** (20% weight)
  - >10% → +1
  - <-10% → -1
- **Price vs Entry** (30% weight)
  - Current > Entry → +1
  - Current < Entry → -1

### Decision Logic
- Score ≥ +2 → **BUY**
- Score ≤ -2 → **SELL**
- Else → **HOLD**

## Google Sheets Integration

1. Create a Google Sheet with columns:
   - Symbol
   - Current
   - TOP30D
   - TOP60D
   - %ThisMonth
   - %LastMonth

2. Get API credentials from Google Cloud Console
3. Add credentials to environment variables
4. The system will automatically fetch and use this data

## Shopify Integration

The application includes webhook endpoints for subscription management:

- `POST /api/shopify/webhook` - Handles subscription events
- `POST /api/shopify/mock-subscription` - For testing subscription changes

## Project Structure

```
aicapital-users/
├── frontend/                 # Next.js frontend
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── package.json
│   └── tailwind.config.js
├── backend/                 # Express backend
│   ├── src/
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Auth middleware
│   └── package.json
├── docker-compose.yml      # Docker services
├── Dockerfile             # Multi-stage build
└── README.md
```

## Development

### Adding New Features

1. **Frontend**: Add components in `frontend/components/`
2. **Backend**: Add routes in `backend/src/routes/`
3. **Database**: Add models in `backend/src/models/`

### Testing

```bash
# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test
```

### Building for Production

```bash
npm run build
```

## Deployment

### Environment Variables (Production)

```env
NODE_ENV=production
MONGODB_URI=mongodb://your-mongodb-uri
JWT_SECRET=your-production-jwt-secret
GOOGLE_SHEETS_API_KEY=your-google-api-key
GOOGLE_SHEETS_SHEET_ID=your-sheet-id
```

### Docker Deployment

1. Build the image:
   ```bash
   docker build -t aicapital-users .
   ```

2. Run with environment variables:
   ```bash
   docker run -e MONGODB_URI=your-uri -e JWT_SECRET=your-secret aicapital-users
   ```

### Cloud Deployment

The application is ready for deployment on:
- Vercel (frontend)
- Railway/Render (backend)
- MongoDB Atlas (database)
- Docker Hub (containers)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@aicapital.com or create an issue in the repository.

---

**Note**: This is a demo application. For production use, ensure proper security measures, error handling, and data validation are implemented.
