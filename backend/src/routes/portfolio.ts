import express from 'express';
import Portfolio from '../models/Portfolio';
import { authenticateToken, requireSubscription } from '../middleware/auth';
import { decisionEngine } from '../services/decisionEngine';
import { stockDataService } from '../services/stockDataService';
import { optimizedStockDataService } from '../services/optimizedStockDataService';
import { volatilityService } from '../services/volatilityService';
import { reputationService } from '../services/reputationService';
import { validate, validatePartial } from '../middleware/validate';
import { stockSchema, updatePortfolioSchema, portfolioQuerySchema } from '../schemas/portfolio';
import { checkPortfolioLimits, checkStockLimits } from '../middleware/portfolioLimits';
import { z } from 'zod';
import DeletedTransactionAudit from '../models/DeletedTransactionAudit';
import { portfolioCache } from '../middleware/cache';

const router = express.Router();

// Test endpoint to verify bypass is working
router.post('/test', authenticateToken, requireSubscription, async (req, res) => {
  console.log('🧪 [TEST] Test endpoint called');
  console.log('🧪 [TEST] User:', req.user);
  res.json({ 
    success: true, 
    message: 'Test endpoint working',
    user: req.user ? req.user.email : 'No user'
  });
});

// Get user portfolio with real-time prices - OPTIMIZED WITH CACHING
router.get('/', authenticateToken, validate({ query: portfolioQuerySchema }), portfolioCache, async (req, res) => {
  try {
    console.log('🔍 [PORTFOLIO] Fetching portfolio for user:', req.user!._id);
    
    const portfolio = await Portfolio.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    
    if (portfolio.length === 0) {
      return res.json({ portfolio: [], totals: { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 } });
    }

    // Get unique tickers
    const tickers = [...new Set(portfolio.map(item => item.ticker))];
    console.log('🔍 [PORTFOLIO] Updating prices for tickers:', tickers);

    // Fetch real-time data for all tickers - OPTIMIZED BATCH PROCESSING
    console.log('🔍 [PORTFOLIO] Fetching real-time data for tickers:', tickers);
    let realTimeData: Map<string, any>;
    try {
      // Use optimized service with batch processing
      realTimeData = await optimizedStockDataService.getMultipleStockData(tickers);
      console.log('✅ [PORTFOLIO] Fetched real-time data for', realTimeData.size, 'stocks (OPTIMIZED)');
    } catch (stockDataError) {
      console.error('❌ [PORTFOLIO] Error fetching stock data, using stored prices:', stockDataError);
      realTimeData = new Map(); // Empty map, will use stored prices as fallback
    }
    
    // Log the actual data we got
    realTimeData.forEach((data, symbol) => {
      console.log(`📊 [PORTFOLIO] ${symbol}: $${data.current} (vs stored: $${portfolio.find(p => p.ticker === symbol)?.currentPrice})`);
    });

    // 🚨 CRITICAL FIX: Calculate portfolio volatility
    let portfolioVolatility = 0;
    try {
      const portfolioTickers = [...new Set(portfolio.map(item => item.ticker))];
      const portfolioVolatilityMetrics = await volatilityService.calculatePortfolioVolatility(portfolioTickers);
      if (portfolioVolatilityMetrics) {
        portfolioVolatility = portfolioVolatilityMetrics.volatility;
        console.log(`📊 [PORTFOLIO] Portfolio volatility calculated: ${portfolioVolatility.toFixed(2)}% (${portfolioVolatilityMetrics.riskLevel})`);
      }
    } catch (error) {
      console.error('❌ [PORTFOLIO] Error calculating portfolio volatility:', error);
    }

    // Update portfolio with real-time prices, exchange info, and recalculate decisions
    const updatedPortfolio = await Promise.all(portfolio.map(async item => {
      const realTimeStock = realTimeData.get(item.ticker);
      let currentPrice = realTimeStock?.current || item.currentPrice; // Fallback to stored price

      // 🔄 EMERGENCY FALLBACK: If price missing/zero, fetch this symbol individually
      if (!currentPrice || currentPrice <= 0) {
        try {
          const singleData = await stockDataService.getStockData(item.ticker);
          if (singleData && singleData.current && singleData.current > 0) {
            currentPrice = singleData.current;
            console.log(`✅ [PORTFOLIO] Recovered price for ${item.ticker} via single fetch: $${currentPrice}`);
          } else {
            console.warn(`⚠️ [PORTFOLIO] No price for ${item.ticker} even after single fetch`);
          }
        } catch (e) {
          console.warn(`⚠️ [PORTFOLIO] Single fetch failed for ${item.ticker}:`, (e as Error).message);
        }
      }
      
      console.log(`🔍 [PORTFOLIO] ${item.ticker}: Entry=${item.entryPrice}, Current=${currentPrice}, StopLoss=${item.stopLoss}, RealTime=${realTimeStock?.current || 'N/A'}`);
      
      // Recalculate decision with real-time data
      const decision = await decisionEngine.decideActionEnhanced({
        ticker: item.ticker,
        entryPrice: item.entryPrice,
        currentPrice: currentPrice,
        stopLoss: item.stopLoss,
        takeProfit: item.takeProfit,
      });

      console.log(`🔍 [PORTFOLIO] ${item.ticker} Decision: ${decision.action} - ${decision.reason}`);
      
      // Fetch exchange information
      let exchange = '—';
      try {
        const { default: axios } = await import('axios');
        const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY_1 || process.env.FINNHUB_API_KEY;
        
        // Quick mapping by suffix first
        if (item.ticker.endsWith('.TO')) exchange = 'TSX';
        else if (item.ticker.endsWith('.SW')) exchange = 'SWISS';
        else if (item.ticker.endsWith('.L')) exchange = 'LSE';
        else if (item.ticker.includes(':')) {
          exchange = item.ticker.split(':')[0].toUpperCase();
        } else {
          // Use Finnhub API
          const response = await axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${item.ticker}&token=${FINNHUB_API_KEY}`);
          const data = response.data;
          
          if (data && data.exchange) {
            let exchangeName = (data.exchange || '').toUpperCase();
            
            // Map exchange names to standard format
            if (/NASDAQ/.test(exchangeName)) exchange = 'NASDAQ';
            else if (/NEW YORK STOCK EXCHANGE|NYSE/.test(exchangeName)) exchange = 'NYSE';
            else if (/TORONTO|TSX/.test(exchangeName)) exchange = 'TSX';
            else if (/EURONEXT/.test(exchangeName)) exchange = 'EURONEXT';
            else if (/SWISS|SIX/.test(exchangeName)) exchange = 'SWISS';
            else if (/LSE|LONDON/.test(exchangeName)) exchange = 'LSE';
            else if (/AMEX|AMERICAN/.test(exchangeName)) exchange = 'AMEX';
            else exchange = exchangeName;
          }
        }
      } catch (exchangeError) {
        console.warn(`⚠️ [PORTFOLIO] Could not fetch exchange for ${item.ticker}:`, exchangeError);
        exchange = '—';
      }
      
      const reason = currentPrice && currentPrice > 0 ? decision.reason : (item.reason || 'Unable to fetch data');
      return {
        ...item.toObject(),
        currentPrice: currentPrice,
        action: decision.action,
        reason,
        color: decision.color,
        exchange: exchange
      };
    }));

    // Calculate totals with real-time prices
    const totals = updatedPortfolio.reduce((acc, item) => {
      const cost = item.entryPrice * item.shares;
      const value = item.currentPrice * item.shares;
      const pnl = value - cost;
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

      return {
        initial: acc.initial + cost,
        current: acc.current + value,
        totalPnL: acc.totalPnL + pnl,
        totalPnLPercent: acc.initial > 0 ? (acc.totalPnL / acc.initial) * 100 : 0,
      };
    }, { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });

    // Calculate and add volatility data to each portfolio item
    try {
      const portfolioWithVolatility = await Promise.all(
        updatedPortfolio.map(async (item) => {
          // Get the portfolio this stock belongs to
          const portfolioId = item.portfolioId || `${item.portfolioType}-1`;
          
          // Get all stocks in this portfolio
          const portfolioStocks = updatedPortfolio.filter(
            stock => (stock.portfolioId || `${stock.portfolioType}-1`) === portfolioId
          );
          
          // Calculate volatility for this portfolio
          const tickers = portfolioStocks.map(stock => stock.ticker);
          const portfolioVolatility = await volatilityService.calculatePortfolioVolatility(tickers);
          
          return {
            ...item,
            volatility: portfolioVolatility,
            lastVolatilityUpdate: new Date().toISOString()
          };
        })
      );

      console.log('✅ [PORTFOLIO] Portfolio updated with real-time prices and volatility');
      res.json({ 
        portfolio: portfolioWithVolatility, 
        totals,
        portfolioVolatility: portfolioVolatility // 🚨 CRITICAL FIX: Include overall portfolio volatility
      });
    } catch (volatilityError) {
      console.warn('⚠️ [PORTFOLIO] Volatility calculation failed, using portfolio without volatility:', volatilityError);
      console.log('✅ [PORTFOLIO] Portfolio updated with real-time prices (no volatility)');
      res.json({ 
        portfolio: updatedPortfolio, 
        totals,
        portfolioVolatility: portfolioVolatility // 🚨 CRITICAL FIX: Include overall portfolio volatility even if individual calculation failed
      });
    }
  } catch (error: any) {
    console.error('❌ [PORTFOLIO] Get portfolio error:', error);
    const errorMessage = error.message || 'Internal server error';
    res.status(500).json({ 
      message: 'Failed to load portfolio',
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Please try again later',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add stock to portfolio - RESTORED FUNCTIONALITY
router.post('/add', async (req, res) => {
  try {
    console.log('🎯 [PORTFOLIO ADD] ===== REQUEST RECEIVED =====');
    console.log('🔍 [PORTFOLIO ADD] Request body:', JSON.stringify(req.body, null, 2));
    
    // Create temporary user for testing
    const tempUser = {
      _id: 'temp-user-id',
      email: 'avi648elastic@gmail.com',
      name: 'Temporary User',
      subscriptionTier: 'premium',
      subscriptionActive: true
    };
    req.user = tempUser as any;

    const { ticker, shares, entryPrice, currentPrice, stopLoss, stoploss, takeProfit, takeprofit, notes, portfolioType, portfolioId } = req.body;
    
    // Handle field name variations
    const finalStopLoss = stopLoss || stoploss;
    const finalTakeProfit = takeProfit || takeprofit;

    console.log('🔍 [PORTFOLIO ADD] Field name handling:', {
      stopLoss: stopLoss,
      stoploss: stoploss,
      finalStopLoss: finalStopLoss,
      takeProfit: takeProfit,
      takeprofit: takeprofit,
      finalTakeProfit: finalTakeProfit
    });

    // Basic validation
    if (!ticker || !shares || !entryPrice || !currentPrice) {
      console.error('❌ [PORTFOLIO ADD] Missing required fields');
      return res.status(400).json({ 
        message: 'Missing required fields',
        received: { ticker, shares, entryPrice, currentPrice }
      });
    }

    // Convert to numbers
    const numericShares = Number(shares) || 1;
    const numericEntryPrice = Number(entryPrice) || 1;
    const numericCurrentPrice = Number(currentPrice) || 1;

    console.log('🔍 [PORTFOLIO ADD] Numeric conversion:', {
      shares: numericShares,
      entryPrice: numericEntryPrice,
      currentPrice: numericCurrentPrice
    });

    // Portfolio settings - map frontend values to valid database values
    const validPortfolioTypes = ['solid', 'risky'];
    const finalPortfolioType = validPortfolioTypes.includes(portfolioType) ? portfolioType : 'solid';
    const finalPortfolioId = portfolioId || 'solid-1';
    
    console.log('🔍 [PORTFOLIO ADD] Portfolio type mapping:', {
      received: portfolioType,
      mapped: finalPortfolioType,
      validTypes: validPortfolioTypes
    });

    console.log('🔍 [PORTFOLIO ADD] Creating portfolio item...');

    const portfolioItem = new Portfolio({
      userId: req.user!._id,
      ticker: ticker.toUpperCase().trim(),
      shares: numericShares,
      entryPrice: numericEntryPrice,
      currentPrice: numericCurrentPrice,
      stopLoss: finalStopLoss ? Number(finalStopLoss) : undefined,
      takeProfit: finalTakeProfit ? Number(finalTakeProfit) : undefined,
      notes: notes || '',
      portfolioType: finalPortfolioType,
      portfolioId: finalPortfolioId,
    });

    console.log('🔍 [PORTFOLIO ADD] Portfolio item created:', portfolioItem);

    // SIMPLIFIED: Skip decision engine for now to isolate the issue
    console.log('🔍 [PORTFOLIO ADD] Skipping decision engine for debugging');
    portfolioItem.action = 'HOLD';
    portfolioItem.reason = 'Added to portfolio';
    portfolioItem.color = 'yellow';

    console.log('🔍 [PORTFOLIO ADD] Saving portfolio item...');
    try {
      await portfolioItem.save();
      console.log('✅ [PORTFOLIO ADD] Portfolio item saved successfully');
    } catch (saveError: any) {
      console.error('❌ [PORTFOLIO ADD] Database save error:', saveError);
      console.error('❌ [PORTFOLIO ADD] Save error details:', {
        name: saveError?.name || 'Unknown',
        message: saveError?.message || 'Unknown error',
        code: saveError?.code || 'No code',
        stack: saveError?.stack || 'No stack trace'
      });
      throw saveError; // Re-throw to be caught by outer try-catch
    }

    res.status(201).json({ 
      message: 'Stock added successfully', 
      portfolioItem: portfolioItem.toObject() 
    });
  } catch (error: any) {
    console.error('❌ [PORTFOLIO ADD] Error adding stock:', error);
    console.error('❌ [PORTFOLIO ADD] Error stack:', error.stack);
    console.error('❌ [PORTFOLIO ADD] Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update stock in portfolio
router.put('/:id', authenticateToken, requireSubscription, validate({ body: updatePortfolioSchema, params: z.object({ id: z.string().min(1) }) }), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    // Do not allow updating currentPrice directly via this endpoint to keep data integrity
    if (Object.prototype.hasOwnProperty.call(updates, 'currentPrice')) {
      delete updates.currentPrice;
    }

    const portfolioItem = await Portfolio.findOne({ _id: id, userId: req.user!._id });
    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        (portfolioItem as any)[key] = updates[key];
      }
    });

    // Recalculate decision
    const decision = await decisionEngine.decideActionEnhanced({
      ticker: portfolioItem.ticker,
      entryPrice: portfolioItem.entryPrice,
      currentPrice: portfolioItem.currentPrice,
      stopLoss: portfolioItem.stopLoss,
      takeProfit: portfolioItem.takeProfit,
    });

    portfolioItem.action = decision.action;
    portfolioItem.reason = decision.reason;
    portfolioItem.color = decision.color;

    await portfolioItem.save();

    res.json({ message: 'Portfolio item updated successfully', portfolioItem });
  } catch (error) {
    console.error('Update portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete stock from portfolio - WITH REPUTATION TRACKING
router.delete('/:id', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { id } = req.params;
    const { exitPrice } = req.body; // Get exit price from request body

    // Find the portfolio item first (don't delete yet)
    const portfolioItem = await Portfolio.findOne({ _id: id, userId: req.user!._id });
    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    console.log('🏆 [PORTFOLIO DELETE] Closing position for reputation tracking:', {
      ticker: portfolioItem.ticker,
      entryPrice: portfolioItem.entryPrice,
      exitPrice: exitPrice || portfolioItem.currentPrice,
      shares: portfolioItem.shares
    });

    // Calculate exit price (use provided price or current price)
    const finalExitPrice = exitPrice || portfolioItem.currentPrice;

    // Update reputation BEFORE deleting the position
    try {
      await reputationService.updateReputationOnPositionClose(
        req.user!._id.toString(),
        portfolioItem,
        finalExitPrice,
        'manual_delete'
      );
      console.log('✅ [PORTFOLIO DELETE] Reputation updated successfully');
    } catch (reputationError) {
      console.error('⚠️ [PORTFOLIO DELETE] Reputation update failed:', reputationError);
      // Continue with deletion even if reputation update fails
    }

    // Write audit log BEFORE deletion
    try {
      const auditEntry = await DeletedTransactionAudit.create({
        userId: req.user!._id,
        transactionId: id,
        type: 'delete',
        beforeSnapshot: portfolioItem.toObject(),
        amount: finalExitPrice * portfolioItem.shares, // Total exit value, not P&L
        ticker: portfolioItem.ticker,
        portfolioId: portfolioItem.portfolioId,
        deletedBy: req.user!._id,
        deletedAt: new Date(),
        reason: 'manual_delete'
      });
      console.log('✅ [AUDIT] Deleted transaction audit logged:', {
        ticker: portfolioItem.ticker,
        amount: auditEntry.amount,
        shares: portfolioItem.shares,
        exitPrice: finalExitPrice
      });
    } catch (auditErr) {
      console.error('❌ [AUDIT] Failed to write delete audit:', (auditErr as Error).message);
      console.error('❌ [AUDIT] Error details:', auditErr);
    }

    // Now delete the portfolio item
    await Portfolio.findOneAndDelete({ _id: id, userId: req.user!._id });

    // Get updated user reputation for response
    const userReputation = await reputationService.getUserReputationSummary(req.user!._id.toString());

    res.json({ 
      message: 'Portfolio item deleted successfully and reputation updated',
      reputation: userReputation,
      realizedPnL: (finalExitPrice - portfolioItem.entryPrice) * portfolioItem.shares
    });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update all portfolio decisions with real-time data
router.get('/decisions', authenticateToken, requireSubscription, async (req, res) => {
  try {
    console.log('🔍 [DECISIONS] Updating portfolio decisions for user:', req.user!._id);
    
    const portfolio = await Portfolio.find({ userId: req.user!._id });
    
    if (portfolio.length === 0) {
      return res.json({ message: 'No portfolio items found', portfolio: [] });
    }

    // Get unique tickers and fetch real-time data
    const tickers = [...new Set(portfolio.map(item => item.ticker))];
    console.log('🔍 [DECISIONS] Fetching real-time data for:', tickers);
    
    const realTimeData = await stockDataService.getMultipleStockData(tickers);
    console.log('✅ [DECISIONS] Fetched real-time data for', realTimeData.size, 'stocks');
    
    const updatedPortfolio = await Promise.all(
      portfolio.map(async (item) => {
        // Get real-time price
        const realTimeStock = realTimeData.get(item.ticker);
        const currentPrice = realTimeStock?.current || item.currentPrice;
        
        // Update current price in database
        item.currentPrice = currentPrice;
        
        // Get decision based on real-time data
        const decision = await decisionEngine.decideActionEnhanced({
          ticker: item.ticker,
          entryPrice: item.entryPrice,
          currentPrice: currentPrice,
          stopLoss: item.stopLoss,
          takeProfit: item.takeProfit,
        });

        item.action = decision.action;
        item.reason = decision.reason;
        item.color = decision.color;
        
        return item.save();
      })
    );

    console.log('✅ [DECISIONS] Portfolio decisions updated with real-time data');
    res.json({ message: 'Portfolio decisions updated with real-time data', portfolio: updatedPortfolio });
  } catch (error) {
    console.error('❌ [DECISIONS] Update decisions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
