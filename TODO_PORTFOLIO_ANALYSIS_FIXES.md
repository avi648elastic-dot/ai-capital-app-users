# Portfolio Analysis Page - TODO List

## Critical Issues to Fix

### ✅ 1. SHMD Sector Mapping Issue
- [ ] **Problem**: SHMD showing as "Other" instead of "Industrials"
- [ ] **Root Cause**: Hardcoded mapping exists but may not be triggered correctly
- [ ] **Location**: `backend/src/services/sectorPerformanceService.ts` line 323
- [ ] **Fix**: Add logging to verify ticker format, ensure SHMD mapping is triggered
- [ ] **Test**: Verify SHMD appears as "Industrials" in Sector Segmentation

### ✅ 2. Automatic Sector Assignment on Stock Add
- [ ] **Problem**: When user adds stock to portfolio, sector is NOT automatically checked and saved
- [ ] **Current Status**: NO sector assignment in `/api/portfolio/add` route
- [ ] **Location**: `backend/src/routes/portfolio.ts` lines 231-310
- [ ] **Required**: Integrate `SectorLookupService.getSectorForStock()` when stock is added
- [ ] **Implementation**: 
  - [ ] Call sector lookup before saving portfolio item
  - [ ] Add `sector` field to Portfolio model (if not exists)
  - [ ] Store sector in database when stock is added
  - [ ] Update existing stocks to populate sectors
- [ ] **Test**: Add a new stock and verify sector is saved

### ✅ 3. Portfolio Performance Chart Flat
- [ ] **Problem**: Chart shows flat line with no meaningful variation
- [ ] **Root Cause**: `portfolioPerformance` data may have all same values OR insufficient variance
- [ ] **Location**: Frontend `frontend/app/(app)/analytics/portfolio-analysis/page.tsx` line 705
- [ ] **Debug Steps**:
  - [ ] Add console.log to log `portfolioPerformance` array received from backend
  - [ ] Check if `totalValue` has sufficient variance
  - [ ] Verify `RealPortfolioChart` component is receiving correct data format
  - [ ] Check if backend generates 4 weekly data points with meaningful variation
- [ ] **Fix**: Ensure backend `generateMonthlyPortfolioPerformance` creates realistic variation
- [ ] **Test**: Verify chart shows realistic trend (not flat)

### ✅ 4. Best Day / Worst Day Showing 0.0%
- [ ] **Problem**: Performance Summary shows "+0.0%" for Best Day and "0.0%" for Worst Day
- [ ] **Root Cause**: `dailyChangePercent` values in `portfolioPerformance` are all 0 or too small
- [ ] **Location**: Frontend line 737-739
- [ ] **Fix**: 
  - [ ] Verify backend generates realistic `dailyChangePercent` values
  - [ ] Check if calculation is: `((dayValue - previousDayValue) / previousDayValue) * 100`
  - [ ] Ensure at least 2-3% variation in daily change
- [ ] **Test**: Verify Best Day and Worst Day show non-zero percentages

### ✅ 5. Trend Analysis Not Connected to Real Data
- [ ] **Problem**: Trend Analysis uses `riskAssessment?.avgVolatility` which may not reflect portfolio performance
- [ ] **Root Cause**: Should use `portfolioPerformance` data for trend, not risk assessment
- [ ] **Location**: Frontend line 763-790
- [ ] **Fix**: 
  - [ ] Calculate trend from `portfolioPerformance[portfolioPerformance.length - 1]?.totalPnLPercent`
  - [ ] Use actual portfolio volatility from `portfolioPerformance` data
  - [ ] Remove dependency on `riskAssessment` for trend calculation
- [ ] **Test**: Verify "Trend", "Volatility", and "Risk Level" reflect actual portfolio performance

### ✅ 6. Performance Metrics Inconsistency
- [ ] **Problem**: "30 Day Return" vs sector performance may show different values
- [ ] **Root Cause**: Different data sources for portfolio vs sector metrics
- [ ] **Location**: Lines 447-464
- [ ] **Fix**: Ensure all metrics use consistent data source (either portfolio-specific or sector ETF data)
- [ ] **Test**: Verify 30 Day Return matches sector performance within reasonable margin

## Implementation Priority

1. **HIGH**: Fix SHMD sector mapping (affects user experience immediately)
2. **HIGH**: Add automatic sector assignment (core functionality missing)
3. **MEDIUM**: Fix flat portfolio chart (affects visual appeal)
4. **MEDIUM**: Fix Best/Worst Day 0.0% (affects data credibility)
5. **LOW**: Fix trend analysis connection (nice-to-have)
6. **LOW**: Fix performance metrics consistency (polish)

## Next Steps

1. Add logging to trace SHMD through the system
2. Implement automatic sector lookup in `/api/portfolio/add` route
3. Add sector field to Portfolio model if missing
4. Review backend data generation for realistic variation
5. Test each fix individually before moving to next item
