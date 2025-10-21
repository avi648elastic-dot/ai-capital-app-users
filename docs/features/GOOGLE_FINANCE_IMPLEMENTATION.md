# 📊 Google Finance Formula Implementation

## Overview

This implementation replicates your Google Sheet logic for stock analysis and decision-making. It fetches 90 days of price data and extracts the same metrics you use in your spreadsheet.

## ✅ What Was Implemented

### 1. **New Service: `googleFinanceFormulasService.ts`**
   - Fetches 90 days of daily price data (like your Google Sheet formula)
   - Extracts metrics:
     - **Current** - Latest price
     - **TOP 30D** - Highest price in last 30 days
     - **TOP 60D** - Highest price in last 60 days
     - **% This Month** - Current month performance
     - **% Last Month** - Previous month performance
   - **10-minute cache** (as you requested)
   - **Multiple API fallbacks**: Alpha Vantage → Finnhub → FMP
   - **Error handling**: Shows error if all APIs fail

### 2. **Updated Decision Engine: `decisionEngine.ts`**
   - **NO FIXED TRACKING LIST** - Fetches data dynamically for any stock
   - Uses the new Google Finance service
   - Applies your scoring system (thresholds: 3/-3)
   - Processes stocks in parallel for better performance
   - Returns errors when data fetch fails (as requested)

### 3. **Test Endpoints: `/api/stocks/*`**
   - **GET `/api/stocks/test-metrics/:symbol`** - Test metrics for a single stock
   - **POST `/api/stocks/test-decision`** - Test decision engine
   - **POST `/api/stocks/test-batch`** - Test multiple stocks at once
   - **GET `/api/stocks/cache-stats`** - View cache statistics
   - **POST `/api/stocks/clear-cache`** - Clear cache for testing

## 🧪 How to Test

### Test Single Stock Metrics
```bash
GET http://localhost:3000/api/stocks/test-metrics/QS
```

**Expected Response:**
```json
{
  "success": true,
  "symbol": "QS",
  "metrics": {
    "current": 16.22,
    "top30D": 18.50,
    "top60D": 17.20,
    "thisMonthPercent": "-12.30%",
    "lastMonthPercent": "8.50%",
    "volatility": "65.00%",
    "marketCap": "$7.00B"
  },
  "dataSource": "alpha_vantage",
  "timestamp": "2025-10-10T12:00:00.000Z",
  "cacheAge": "0s"
}
```

### Test Decision Engine
```bash
POST http://localhost:3000/api/stocks/test-decision
Content-Type: application/json

{
  "ticker": "QS",
  "entryPrice": 18.50,
  "currentPrice": 16.22,
  "stopLoss": 15.00,
  "takeProfit": 25.00
}
```

**Expected Response:**
```json
{
  "success": true,
  "ticker": "QS",
  "decision": {
    "action": "HOLD",
    "reason": "Weak vs TOP60, Poor monthly performance",
    "color": "yellow",
    "score": -2
  },
  "input": {
    "entryPrice": 18.50,
    "currentPrice": 16.22,
    "stopLoss": 15.00,
    "takeProfit": 25.00,
    "priceChange": "-12.32%"
  }
}
```

### Test Multiple Stocks (Your Portfolio)
```bash
POST http://localhost:3000/api/stocks/test-batch
Content-Type: application/json

{
  "symbols": ["QS", "UEC", "HIMX", "ONCY", "AQST", "AEG", "HST"]
}
```

## 📋 Comparison with Your Google Sheet

| Google Sheet Formula | Our Implementation |
|---------------------|-------------------|
| `=GOOGLEFINANCE(A2,"price",TODAY()-90,TODAY(),"DAILY")` | `googleFinanceFormulasService.getStockMetrics()` |
| `=MAX(B2:AF2)` (TOP 30D) | Calculated from 90-day data |
| `=MAX(B2:BG2)` (TOP 60D) | Calculated from 90-day data |
| Manual ticker change in column A | Dynamic - works for any stock |
| Manual Java execution | Automatic - runs on every portfolio view |

## 🔄 How It Works Now

1. **User views portfolio** → System fetches real-time data
2. **Decision engine called** → Fetches 90-day metrics (cached for 10 min)
3. **Scoring system applied** → Same logic as your Google Sheet
4. **BUY/SELL/HOLD decision** → Displayed to user

## 🚀 Benefits Over Legacy System

1. **No manual work** - Automatically fetches data for all stocks
2. **Real-time updates** - Refreshes every 10 minutes
3. **Scalable** - Works for any number of stocks
4. **Error handling** - Shows clear errors when data unavailable
5. **Multiple fallbacks** - Uses 3 different APIs for reliability
6. **Parallel processing** - Analyzes multiple stocks simultaneously

## 📊 API Data Sources

1. **Alpha Vantage** (Primary) - Best for historical data
2. **Finnhub** (Fallback 1) - Good for real-time data
3. **FMP** (Fallback 2) - Reliable backup

## ⚙️ Configuration

### Environment Variables
```env
ALPHA_VANTAGE_API_KEY=your_key_here
FINNHUB_API_KEY=your_key_here
FMP_API_KEY=your_key_here
```

### Cache Settings
- **TTL**: 10 minutes (600,000ms)
- **Max Size**: 1000 stocks
- **Strategy**: LRU (Least Recently Used)

## 🔧 Future Enhancements

1. **Portfolio Building** - Use TOP 30D percentages to select best stocks
2. **Advanced Analytics** - More metrics from 90-day data
3. **Custom Timeframes** - Allow users to choose different periods
4. **Historical Backtesting** - Test strategies on past data

## 📝 Notes

- The system now works **exactly like your Google Sheet** but automated
- No more manual ticker changes or Java execution
- All portfolio stocks get analyzed automatically
- Errors are shown clearly when data is unavailable
- Cache ensures fast performance and respects API limits

## 🎯 Next Steps

1. **Test with your portfolio** - Compare results with your Google Sheet
2. **Verify metrics match** - Ensure TOP 30D, TOP 60D, etc. are correct
3. **Check performance** - Monitor cache hit rates and API usage
4. **Deploy to production** - Once testing is complete

---

**Created**: October 10, 2025  
**Status**: ✅ Ready for Testing

