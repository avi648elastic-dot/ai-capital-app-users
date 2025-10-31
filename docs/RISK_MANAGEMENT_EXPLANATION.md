# Risk Management Page - How It Works

## Current Implementation Status

### ✅ What's Working (Real Data)
The Risk Management page currently uses **real data** from the `/api/analytics/risk-analytics` endpoint:

1. **Volatility Calculation**: Uses `volatilityService` to fetch real volatility data for all stocks
2. **Risk Score Calculation**: Calculates 0-5 point risk score based on:
   - Real volatility (>35% = +2 points, >25% = +1.5 points, >15% = +0.5 points)
   - Recent drawdown (calculated from current price vs recent high)
   - Portfolio weight/concentration (>30% = +1 point, >20% = +0.5 points)
3. **Risk Level Classification**: Based on volatility service risk levels (Low/Medium/High/Extreme)
4. **Portfolio Metrics**: 
   - Average risk score
   - Diversification score (based on unique sectors)
   - Concentration risk (max position weight)

### ⚠️ What's Missing (Dummy/Incomplete Data)
1. **Drawdown Calculation**: Currently uses `(currentPrice / currentPrice) - 1` which always equals 0 - needs to use actual historical high
2. **Max Drawdown**: Not calculated from real historical data
3. **Position-Level Alerts**: Stop loss proximity, take profit zones not fully integrated
4. **Real-Time Risk Changes**: Doesn't show alerts when prices cross thresholds

---

## How It SHOULD Work (Complete Implementation)

### 1. **Individual Stock Risk Analysis**

For each stock in the portfolio, calculate:

#### Risk Score Components (0-100 scale):

1. **Volatility Risk (0-30 points)**
   ```js
   // Use real volatility from metrics engine
   const volatility = await getMetrics(ticker).metrics["30d"].volatilityAnnual;
   if (volatility > 50) riskScore += 30;
   else if (volatility > 35) riskScore += 25;
   else if (volatility > 25) riskScore += 15;
   else if (volatility > 15) riskScore += 8;
   ```

2. **Max Drawdown Risk (0-25 points)**
   ```js
   // Calculate from historical price data
   const maxDrawdown = calculateMaxDrawdown(ticker, 30); // 30-day window
   if (maxDrawdown < -30) riskScore += 25;  // Extreme drawdown
   else if (maxDrawdown < -20) riskScore += 18;
   else if (maxDrawdown < -10) riskScore += 10;
   ```

3. **Position Size Risk (0-20 points)**
   ```js
   const weight = (positionValue / totalPortfolioValue) * 100;
   if (weight > 30) riskScore += 20;  // Too concentrated
   else if (weight > 20) riskScore += 12;
   else if (weight > 15) riskScore += 6;
   ```

4. **Stop Loss Proximity (0-15 points)**
   ```js
   const stopLossDistance = ((currentPrice - stopLoss) / currentPrice) * 100;
   if (stopLossDistance < 2) riskScore += 15;  // Very close to stop
   else if (stopLossDistance < 5) riskScore += 10;
   else if (stopLossDistance < 10) riskScore += 5;
   ```

5. **Recent Performance Risk (0-10 points)**
   ```js
   const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
   if (pnlPercent < -30) riskScore += 10;  // Large loss
   else if (pnlPercent < -15) riskScore += 6;
   else if (pnlPercent < -5) riskScore += 3;
   ```

#### Risk Level Classification:
- **Low (0-25)**: Safe, well-diversified, low volatility
- **Medium (26-50)**: Moderate risk, acceptable volatility
- **High (51-75)**: Elevated risk, high volatility, concentration issues
- **Extreme (76-100)**: Critical risk, immediate action needed

---

### 2. **Portfolio-Level Risk Metrics**

#### Overall Portfolio Risk Score:
```js
// Weighted average of position risks
const portfolioRisk = positionRisks.reduce((sum, pos) => {
  const weight = pos.portfolioPercentage / 100;
  return sum + (pos.riskScore * weight);
}, 0);
```

#### Diversification Score (0-100%):
```js
// Based on:
// 1. Number of unique sectors (sector diversity)
// 2. Equal weight distribution (concentration risk)
// 3. Correlation between positions (if available)

const sectorCount = new Set(stocks.map(s => s.sector)).size;
const weightVariance = calculateVariance(stocks.map(s => s.weight));
const diversificationScore = 
  (sectorCount / stocks.length * 60) +  // 60% weight on sector diversity
  (40 - weightVariance);  // 40% weight on equal distribution
```

#### Concentration Risk:
```js
const maxPosition = Math.max(...positions.map(p => p.weight));
if (maxPosition > 30) concentration = 'High';
else if (maxPosition > 20) concentration = 'Medium';
else concentration = 'Low';
```

---

### 3. **Real-Time Risk Alerts**

Generate alerts for:

#### Stop Loss Alerts:
```js
const stopDistance = ((currentPrice - stopLoss) / currentPrice) * 100;
if (stopDistance < 2) {
  alerts.push({
    type: 'STOP_LOSS',
    severity: 'CRITICAL',
    message: `${ticker} is within 2% of stop loss - immediate action needed`,
    action: 'SELL'
  });
}
```

#### Take Profit Alerts:
```js
if (currentPrice >= takeProfit * 0.95) {
  alerts.push({
    type: 'TAKE_PROFIT',
    severity: 'HIGH',
    message: `${ticker} reached take profit zone - consider selling`,
    action: 'SELL'
  });
}
```

#### Position Size Alerts:
```js
if (weight > 30) {
  alerts.push({
    type: 'POSITION_SIZE',
    severity: 'HIGH',
    message: `${ticker} represents ${weight}% of portfolio - reduce exposure`,
    action: 'REDUCE'
  });
}
```

#### Volatility Alerts:
```js
if (volatility > 50) {
  alerts.push({
    type: 'MARKET_CONDITION',
    severity: 'HIGH',
    message: `${ticker} has extreme volatility (${volatility}%) - high risk`,
    action: 'MONITOR'
  });
}
```

---

### 4. **Data Flow**

```
1. User opens Risk Management page
   ↓
2. Frontend calls: GET /api/analytics/risk-analytics
   ↓
3. Backend:
   a. Fetches user's portfolio from MongoDB
   b. For each stock:
      - Gets real volatility from volatilityService
      - Gets historical data from metrics.engine (for max drawdown)
      - Calculates risk score (0-100)
      - Generates alerts based on thresholds
   c. Calculates portfolio-level metrics:
      - Weighted average risk
      - Diversification score
      - Concentration risk
   d. Returns complete risk analysis
   ↓
4. Frontend displays:
   - Risk overview cards (avg score, diversification, high-risk count)
   - Individual stock risk table
   - Risk recommendations
   - Real-time alerts
```

---

### 5. **Integration with Other Services**

- **Performance Analysis**: Uses 30d/90d return data for recent performance risk
- **Decision Engine**: Aligns risk alerts with BUY/SELL/HOLD signals
- **Metrics Engine**: Fetches volatility and historical price data
- **Volatility Service**: Gets real-time volatility calculations
- **Sector Service**: Uses sector data for diversification scoring

---

### 6. **Automatic Updates**

- Risk analysis should update:
  - **Every 5 minutes** during market hours (via scheduler)
  - **On-demand** when user opens risk management page
  - **Real-time** when alerts are triggered (stop loss hit, etc.)

---

## Current vs. Ideal Implementation

| Feature | Current | Should Be |
|---------|---------|-----------|
| Volatility Data | ✅ Real (from volatilityService) | ✅ Real |
| Max Drawdown | ❌ Always 0 (bug) | ✅ Real (from historical data) |
| Risk Score | ✅ Calculated (0-5 scale) | ⚠️ Should be 0-100 scale |
| Alerts | ⚠️ Partial | ✅ Complete (stop loss, take profit, concentration) |
| Portfolio Risk | ✅ Calculated | ✅ Calculated |
| Diversification | ✅ Basic (sector count) | ⚠️ Could include correlation |
| Real-time Updates | ❌ Manual refresh | ✅ Auto-update every 5 min |

---

## Recommended Improvements

1. **Fix Max Drawdown Calculation**: Use real historical highs from metrics engine
2. **Expand Risk Score**: Change from 0-5 to 0-100 scale for more granularity
3. **Add More Alert Types**: Stop loss proximity, take profit zones, volatility spikes
4. **Real-Time Alerts**: Push notifications when thresholds are crossed
5. **Correlation Analysis**: Calculate correlation between positions for better diversification scoring
6. **Historical Risk Trends**: Show how portfolio risk has changed over time
7. **Risk Scenarios**: "What if" analysis (e.g., what if stock X drops 20%?)

