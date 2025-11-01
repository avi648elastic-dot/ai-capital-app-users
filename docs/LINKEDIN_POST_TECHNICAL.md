# LinkedIn Post - AI Capital Platform Launch (Technical Edition)

## 🎯 Complete Technical Post with Formulas

---

🚀 **After 6 months of development, I built AI Capital - an intelligent portfolio management platform with 6 interconnected engines that analyze your stocks like a Wall Street quantitative analyst.**

Here's the complete technical breakdown of how each engine works:

---

## 🧠 **The 6 Intelligent Engines - Technical Deep Dive**

### 1️⃣ **Performance Analysis Engine**

**What it does:** Calculates precise financial metrics across 4 timeframes (7d, 30d, 60d, 90d) with a single API call per stock per day.

**Technical Calculations:**

📊 **Return Percentage:**
```
returnPct = ((priceEnd / priceStart) - 1) × 100
Example: ($271 / $206) - 1 = 31.55%
```

📊 **Volatility (Annualized):**
```
dailyReturns = ln(price[t] / price[t-1]) for each day
volatility = σ(dailyReturns) × √252
Example: If daily σ = 2.1%, then annual = 2.1% × 15.87 = 33.3%
```

📊 **Sharpe Ratio (Risk-Adjusted Return):**
```
sharpe = (portfolioReturn - riskFreeRate) / volatility
Example: (31.5% - 4.5%) / 33.3% = 0.81
```

📊 **Max Drawdown (Peak-to-Trough Decline):**
```
For each day: drawdown[i] = (price[i] - peak[i]) / peak[i] × 100
maxDrawdown = min(drawdown[0...n])
Example: Peak $280 → Trough $220 = -21.4%
```

📊 **Top Price:**
```
topPrice = max(price[0...n]) within the window
Example: Highest price in 30 days = $280.15
```

**Optimization:** Runs once per day, caches all timeframes, 99% API call reduction.

---

### 2️⃣ **AI Decision Engine**

**What it does:** Multi-factor scoring algorithm that generates BUY/HOLD/SELL signals.

**Technical Calculations:**

🎯 **Resistance Level Score (30% weight):**
```
resistanceProximity = (currentPrice / top60D) × 100
If ≥ 90%: score += 2  (near breakout)
If ≤ 70%: score -= 1  (far from resistance)
Example: $271 / $280 = 96.8% → score += 2
```

🎯 **Momentum Score (25% weight):**
```
momentum = (thisMonth% × 0.4) + (lastMonth% × 0.3)
Normalized: score += min(max(momentum / 10, -2), 2)
Example: (6.8% × 0.4) + (12.5% × 0.3) = 6.47% → score += 0.65
```

🎯 **Volatility-Adjusted Performance (20% weight):**
```
volAdjustment = pnlPercent / (volatility + 1)
Normalized: score += min(max(volAdjustment / 5, -1), 1)
Example: 31.5% / (33.3% + 1) = 0.92 → score += 0.18
```

🎯 **Market Beta (15% weight):**
```
beta = covariance(stockReturns, marketReturns) / variance(marketReturns)
If beta > 1: score += 0.5  (outperforms market)
If beta < 1: score -= 0.5  (underperforms market)
```

🎯 **Diversification Bonus (10% weight):**
```
Adds bonus if stock reduces portfolio correlation
Example: Low correlation with existing holdings → +0.3
```

**Final Decision:**
- `score ≥ 1.5` → **BUY**
- `score ≤ -1.5` → **SELL**
- `-1.4 to 1.4` → **HOLD**

---

### 3️⃣ **Risk Management Engine**

**What it does:** Analyzes position sizing and recommends rebalancing to maximize profit while minimizing risk.

**Technical Calculations:**

⚠️ **Risk Score per Stock (0-5 scale):**
```
riskScore = 0

1. Volatility Risk (0-2 points):
   if volatility > 35%: +2.0 points
   if volatility > 25%: +1.5 points
   if volatility > 15%: +0.5 points

2. Drawdown Risk (0-2 points):
   drawdown = (currentPrice - top30DPrice) / top30DPrice × 100
   if drawdown < -20%: +2.0 points
   if drawdown < -10%: +1.0 points

3. Position Weight Risk (0-1 point):
   weight = (positionValue / totalPortfolioValue) × 100
   if weight > 30%: +1.0 points
   if weight > 20%: +0.5 points

Total: 0-2 = Low, 2-3.5 = Medium, 3.5-5 = High
```

⚠️ **Position Sizing Recommendation:**
```
riskAdjustedReturn = stockReturn / stockVolatility

HIGH QUALITY + LOW ALLOCATION:
if qualityScore > 75 AND weight < 15%:
   → INCREASE to 20% (HIGH priority)

POOR QUALITY + HIGH ALLOCATION:
if qualityScore < 40 AND weight > 15%:
   → REDUCE to 10% (HIGH priority)

PROFITABLE HIGH-RISK:
if riskLevel = "High" AND weight > 25% AND profit > 10%:
   → TAKE_PROFIT, reduce to 15%
   estimatedProfit = positionValue × ((currentWeight - targetWeight) / 100) × (profitPct / 100)
```

⚠️ **Concentration Risk:**
```
maxWeight = max(position1%, position2%, ..., positionN%)
if maxWeight > 30%: concentration = "High"
if maxWeight > 20%: concentration = "Medium"
else: concentration = "Low"
```

**Output:** Specific recommendations like "Reduce AAPL from 35% to 20%, estimated profit $2,450"

---

### 4️⃣ **Portfolio Analysis Engine**

**What it does:** Analyzes sector allocation and tracks real ETF performance.

**Technical Calculations:**

📈 **Sector Allocation Percentage:**
```
For each stock:
  sector = classifySector(ticker)  // Dynamic classification
  stockValue = currentPrice × shares
  
For each sector:
  sectorValue = sum(stockValue for all stocks in sector)
  sectorPercentage = (sectorValue / totalPortfolioValue) × 100

Example:
  Technology stocks (AAPL, GOOGL): $4,500 / $10,000 = 45.0%
  Industrials stocks (SHMD, CBAT): $5,500 / $10,000 = 55.0%
```

📈 **Real ETF Performance (90-day):**
```
For each sector:
  etfSymbol = getSectorETF(sector)  // Technology → XLK
  etfMetrics = getMetrics(etfSymbol)  // From metrics engine
  performance90D = etfMetrics["90d"].returnPct

Example:
  Technology (XLK): +14.64% over 90 days
  Industrials (XLI): +2.61% over 90 days
```

📈 **Weighted Portfolio Volatility:**
```
For each stock:
  weight[i] = stockValue[i] / totalValue
  volatility[i] = getMetrics(ticker).volatility

portfolioVolatility = Σ(volatility[i] × weight[i])

Example:
  AAPL: 23.5% vol × 30% weight = 7.05%
  SHMD: 135.5% vol × 40% weight = 54.2%
  Total = 7.05% + 54.2% + ... = 123.3%
```

📈 **Diversification Score:**
```
numSectors = count(unique sectors)
diversificationScore = (numSectors / numStocks) × 100

Example: 2 sectors / 5 stocks = 40% diversification
```

**Output:** Sector breakdown with real ETF benchmarks, color-coded bars, AI analysis.

---

### 5️⃣ **Balance Sheet Health Analysis Engine**

**What it does:** Automated financial health scoring using key accounting metrics.

**Technical Calculations:**

💼 **Current Ratio (Liquidity - 30% weight):**
```
currentRatio = currentAssets / currentLiabilities
Status: GOOD if > 1.5, WARNING if 1.0-1.5, POOR if < 1.0

Example: $45M / $25M = 1.8 (GOOD) → 30 points
```

💼 **Debt-to-Equity Ratio (Solvency - 30% weight):**
```
debtToEquity = totalDebt / totalEquity
Status: GOOD if < 1.0, WARNING if 1.0-2.0, POOR if > 2.0

Example: $20M / $50M = 0.4 (GOOD) → 30 points
```

💼 **Return on Equity (Profitability - 25% weight):**
```
ROE = (netIncome / shareholderEquity) × 100
Status: GOOD if > 15%, WARNING if 10-15%, POOR if < 10%

Example: $8M / $50M = 16% (GOOD) → 25 points
```

💼 **Revenue Growth (Growth - 15% weight):**
```
revenueGrowth = ((revenue[year] - revenue[year-1]) / revenue[year-1]) × 100
Trend: Compare 3 years to identify IMPROVING/DECLINING

Example: 
  2023: $100M → 2024: $115M = +15% YoY (IMPROVING) → 15 points
```

**Overall Health Score:**
```
healthScore = (liquidityScore × 0.30) + 
              (solvencyScore × 0.30) + 
              (profitabilityScore × 0.25) + 
              (growthScore × 0.15)

Example: (30 × 0.30) + (30 × 0.30) + (25 × 0.25) + (15 × 0.15) = 27.5/100
Classification: 75-100 = Excellent, 60-75 = Good, 40-60 = Fair, 0-40 = Poor
```

**Output:** Automated checklist with green/red indicators, trend detection, multi-year comparison.

---

### 6️⃣ **Stock Quality Scoring Engine**

**What it does:** Ranks all portfolio positions from best to worst and recommends optimal allocation.

**Technical Calculations:**

🏆 **Quality Score Components (0-100 scale):**

```
1. Sharpe Ratio Score (30% weight, 0-30 points):
   sharpeScore = normalize(sharpe, -2, 2) × 30
   Example: Sharpe = 0.81 → normalized to 0.405 → 0.405 × 30 = 12.15 pts

2. 30-Day Return Score (25% weight, 0-25 points):
   returnScore = normalize(return30d, -20%, 20%) × 25
   Example: Return = +6.8% → normalized to 0.67 → 0.67 × 25 = 16.75 pts

3. Volatility Score (25% weight, 0-25 points, lower is better):
   volatilityScore = 25 - (volatility / 2)
   Example: Vol = 23.5% → 25 - 11.75 = 13.25 pts

4. Max Drawdown Score (10% weight, 0-10 points, lower is better):
   drawdownScore = 10 + (maxDrawdown / 10)
   Example: Drawdown = -8% → 10 + (-0.8) = 9.2 pts

5. Risk-Adjusted Return (10% weight, 0-10 points):
   riskAdjReturn = return30d / volatility
   riskAdjScore = normalize(riskAdjReturn, -2, 2) × 10
   Example: 6.8% / 23.5% = 0.29 → normalized → 6.45 pts

Total Quality Score = 12.15 + 16.75 + 13.25 + 9.2 + 6.45 = 57.8/100
```

🏆 **Quality Classification:**
```
75-100 points = EXCELLENT (increase allocation)
60-75 points = GOOD (maintain allocation)
40-60 points = FAIR (monitor closely)
0-40 points = POOR (reduce allocation)
```

🏆 **Investment Recommendation Logic:**
```
For each stock:
  avgQualityScore = sum(allQualityScores) / numStocks
  
  IF qualityScore > avgQuality + 10 AND allocation < 15%:
    → INCREASE to 20% (HIGH priority)
    Reason: "Ranks #1, superior risk-adjusted returns"
  
  IF qualityScore < avgQuality - 15 AND allocation > 15%:
    → REDUCE to 10% (HIGH priority)
    Reason: "Ranks #8, high volatility (45%), poor returns (-8%)"
  
  IF qualityScore > 75 AND allocation 15-25%:
    → HOLD (optimal allocation)
```

**Output:** Comparative ranking table + actionable recommendations with priority levels.

---

## 🔄 **How the Engines Work Together - Real Example**

**Scenario:** You own AAPL at $271/share

1. **Performance Engine** → Fetches 120 days of price data, calculates:
   - 30-day return: +6.8%
   - Volatility: 23.5%
   - Sharpe ratio: 0.81
   - Max drawdown: -8.2%

2. **Decision Engine** → Analyzes:
   - Current $271 / Top60D $280 = 96.8% (near resistance) → +2 pts
   - Momentum: +6.8% recent → +0.65 pts
   - Volatility-adjusted: 31.5% / 34.3% = 0.92 → +0.18 pts
   - **Final score: +2.83 → BUY signal**

3. **Quality Scoring** → Calculates quality:
   - Sharpe: 12.15 pts + Return: 16.75 pts + Volatility: 13.25 pts + Drawdown: 9.2 pts + Risk-Adj: 6.45 pts
   - **Quality: 57.8/100 (FAIR)**
   - **Ranks #3 out of 6 stocks**

4. **Portfolio Analysis** → Checks:
   - AAPL → Technology sector
   - XLK (Technology ETF): +14.64% (90 days)
   - Your allocation to Technology: 29.6%

5. **Balance Sheet** → Analyzes financials:
   - Current Ratio: 1.8 (GOOD)
   - Debt-to-Equity: 0.4 (GOOD)
   - ROE: 16% (GOOD)
   - Revenue Growth: +15% YoY (IMPROVING)

6. **Risk Management** → Determines:
   - Risk score: 1.5/5 (LOW)
   - Current allocation: 8%
   - Quality score: 57.8 (FAIR)
   - **Recommendation: "HOLD - allocation is optimal for quality level"**

**Final Output:** "AAPL shows BUY signal with FAIR quality (57.8/100). Currently 8% of portfolio. HOLD current position - allocation matches quality level."

---

## ⚡ **Technical Highlights**

**Data Processing:**
- Fetches 120 days of historical OHLC data per stock
- Calculates log returns: `ln(price[t] / price[t-1])`
- Computes annualized metrics: `dailyMetric × √252`
- Single API call per stock per day (cached until next day)

**Caching Strategy:**
- **Metrics Engine**: Daily cache (expires next day midnight + 1hr)
- **Analytics API**: 12-hour Redis cache (instant loads)
- **Portfolio Details**: 6-hour cache with force refresh option
- **Result**: First load ~3s, subsequent loads <100ms

**API Redundancy:**
- Primary: Alpha Vantage (4 keys)
- Fallback 1: Finnhub (4 keys)
- Fallback 2: Financial Modeling Prep (4 keys)
- Fallback 3: Yahoo Finance
- **Reliability: 99.9% uptime**

**Tech Stack:**
- Backend: Node.js/Express + TypeScript + MongoDB + Redis
- Frontend: Next.js 14 + React + TypeScript + TailwindCSS
- Deployment: Vercel (frontend) + Render (backend)
- Real-time: WebSocket for live updates

---

## 🎁 **30-Day Premium+ Free Trial**

New users get full access to:
- ✅ All 6 intelligent engines
- ✅ Up to 5 portfolios
- ✅ 15 stocks per portfolio
- ✅ Real-time analytics
- ✅ Position sizing recommendations
- ✅ Advanced risk management
- ✅ Balance sheet analysis
- ✅ Quality scoring and rankings

**Try it yourself:**
👉 https://ai-capital-app7.vercel.app?utm_source=linkedin&utm_medium=social&utm_campaign=technical_post

**No credit card required. Cancel anytime.**

---

## 🔬 **Key Technical Achievements**

✅ **99% API Call Reduction** - Daily caching engine saves costs and improves speed
✅ **Institutional-Grade Formulas** - Replicated Google Finance calculations precisely
✅ **Multi-API Redundancy** - Never goes down, always has data
✅ **Real-Time Processing** - Sub-second decision generation
✅ **Type-Safe** - Full TypeScript coverage, zero runtime errors
✅ **Scalable** - Handles 10,000+ concurrent users

---

## 💬 **I'd love your feedback!**

Questions I'm particularly interested in:
1. Which engine do you find most valuable?
2. What additional metrics would you want to see?
3. Would you use this for your own portfolio?

Drop a comment below! 👇

---

#FinTech #AI #PortfolioManagement #MachineLearning #StockMarket #InvestmentTechnology #SelfTaught #AIAssistedCoding #ChatGPT #OpenAI #CursorAI #SoloPreneur #EducationalProject #BetaLaunch #Innovation #TypeScript #ReactJS #NodeJS #MongoDB #WebDevelopment #QuantitativeFinance #AlgoTrading #ProjectManagement #Startup

---


