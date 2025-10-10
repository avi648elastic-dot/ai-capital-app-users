import express from 'express';
import Portfolio from '../models/Portfolio';
import { authenticateToken, requireSubscription } from '../middleware/auth';
import { decisionEngine } from '../services/decisionEngine';
import { stockDataService } from '../services/stockDataService';
import { volatilityService } from '../services/volatilityService';

const router = express.Router();

// Get user portfolio with real-time prices
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [PORTFOLIO] Fetching portfolio for user:', req.user!._id);
    
    const portfolio = await Portfolio.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    
    if (portfolio.length === 0) {
      return res.json({ portfolio: [], totals: { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 } });
    }

    // Get unique tickers
    const tickers = [...new Set(portfolio.map(item => item.ticker))];
    console.log('🔍 [PORTFOLIO] Updating prices for tickers:', tickers);

    // Fetch real-time data for all tickers
    console.log('🔍 [PORTFOLIO] Fetching real-time data for tickers:', tickers);
    const realTimeData = await stockDataService.getMultipleStockData(tickers);
    console.log('✅ [PORTFOLIO] Fetched real-time data for', realTimeData.size, 'stocks');
    
    // Log the actual data we got
    realTimeData.forEach((data, symbol) => {
      console.log(`📊 [PORTFOLIO] ${symbol}: $${data.current} (vs stored: $${portfolio.find(p => p.ticker === symbol)?.currentPrice})`);
    });

    // Update portfolio with real-time prices, exchange info, and recalculate decisions
    const updatedPortfolio = await Promise.all(portfolio.map(async item => {
      const realTimeStock = realTimeData.get(item.ticker);
      const currentPrice = realTimeStock?.current || item.currentPrice; // Fallback to stored price
      
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
        const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd3crne9r01qmnfgf0q70d3crne9r01qmnfgf0q7g';
        
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
      
      return {
        ...item.toObject(),
        currentPrice: currentPrice,
        action: decision.action,
        reason: decision.reason,
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
          const portfolioVolatility = await volatilityService.calculatePortfolioVolatility(req.user!._id.toString(), portfolioId);
          
          return {
            ...item,
            volatility: portfolioVolatility,
            lastVolatilityUpdate: new Date().toISOString()
          };
        })
      );

      console.log('✅ [PORTFOLIO] Portfolio updated with real-time prices and volatility');
      res.json({ portfolio: portfolioWithVolatility, totals });
    } catch (volatilityError) {
      console.warn('⚠️ [PORTFOLIO] Volatility calculation failed, using portfolio without volatility:', volatilityError);
      console.log('✅ [PORTFOLIO] Portfolio updated with real-time prices (no volatility)');
      res.json({ portfolio: updatedPortfolio, totals });
    }
  } catch (error) {
    console.error('❌ [PORTFOLIO] Get portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add stock to portfolio
router.post('/add', authenticateToken, requireSubscription, async (req, res) => {
  try {
    console.log('🔍 [PORTFOLIO ADD] Adding stock for user:', req.user!._id);
    console.log('🔍 [PORTFOLIO ADD] Request body:', req.body);

    const { ticker, shares, entryPrice, currentPrice, stopLoss, takeProfit, notes, portfolioType, portfolioId } = req.body;

    // Enhanced validation
    if (!ticker || !shares || !entryPrice || !currentPrice) {
      console.error('❌ [PORTFOLIO ADD] Missing required fields');
      return res.status(400).json({ 
        message: 'Ticker, shares, entry price, and current price are required',
        received: { ticker, shares, entryPrice, currentPrice }
      });
    }

    // Validate portfolio type
    const validPortfolioTypes = ['solid', 'risky'];
    const finalPortfolioType = portfolioType && validPortfolioTypes.includes(portfolioType) ? portfolioType : 'solid';

    // Check stock limits based on subscription tier
    const User = (await import('../models/User')).default;
    const user = await User.findById(req.user!._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Determine portfolioId - use provided or default to first portfolio
    const finalPortfolioId = portfolioId || `${finalPortfolioType}-1`;

    // Count existing stocks in the target portfolio
    const existingStocksCount = await Portfolio.countDocuments({ 
      userId: req.user!._id,
      portfolioId: finalPortfolioId
    });

    console.log('🔍 [PORTFOLIO ADD] User tier:', user.subscriptionTier);
    console.log('🔍 [PORTFOLIO ADD] Existing stocks in', finalPortfolioType, ':', existingStocksCount);

    // Enforce limits
    if (user.subscriptionTier === 'free') {
      // Free users: max 10 stocks per portfolio
      if (existingStocksCount >= 10) {
        return res.status(403).json({ 
          message: '🔒 Free users are limited to 10 stocks per portfolio. Upgrade to Premium to add up to 15 stocks per portfolio and manage up to 3 portfolios of each type!',
          limit: 10,
          current: existingStocksCount,
          tier: 'free'
        });
      }

      // Enforce portfolio type for free users
      if (user.portfolioType !== finalPortfolioType) {
        return res.status(403).json({ 
          message: `🔒 Free users can only add stocks to their ${user.portfolioType} portfolio. Upgrade to Premium to unlock both portfolio types!`,
          allowedType: user.portfolioType,
          requestedType: finalPortfolioType
        });
      }
    } else if (user.subscriptionTier === 'premium') {
      // Premium users: max 15 stocks per portfolio
      if (existingStocksCount >= 15) {
        return res.status(403).json({ 
          message: '⭐ Premium users are limited to 15 stocks per portfolio. Upgrade to Premium+ for up to 20 stocks per portfolio and 5 portfolios of each type!',
          limit: 15,
          current: existingStocksCount,
          tier: 'premium'
        });
      }
    }

    // Validate numeric values
    const numericShares = Number(shares);
    const numericEntryPrice = Number(entryPrice);
    const numericCurrentPrice = Number(currentPrice);

    if (isNaN(numericShares) || numericShares <= 0) {
      return res.status(400).json({ message: 'Shares must be a positive number' });
    }

    if (isNaN(numericEntryPrice) || numericEntryPrice <= 0) {
      return res.status(400).json({ message: 'Entry price must be a positive number' });
    }

    if (isNaN(numericCurrentPrice) || numericCurrentPrice <= 0) {
      return res.status(400).json({ message: 'Current price must be a positive number' });
    }

    // Validate optional fields
    let numericStopLoss, numericTakeProfit;
    if (stopLoss) {
      numericStopLoss = Number(stopLoss);
      if (isNaN(numericStopLoss) || numericStopLoss <= 0) {
        return res.status(400).json({ message: 'Stop loss must be a positive number' });
      }
    }

    if (takeProfit) {
      numericTakeProfit = Number(takeProfit);
      if (isNaN(numericTakeProfit) || numericTakeProfit <= 0) {
        return res.status(400).json({ message: 'Take profit must be a positive number' });
      }
    }

    console.log('🔍 [PORTFOLIO ADD] Creating portfolio item with validated data');

    const portfolioItem = new Portfolio({
      userId: req.user!._id,
      ticker: ticker.toUpperCase().trim(),
      shares: numericShares,
      entryPrice: numericEntryPrice,
      currentPrice: numericCurrentPrice,
      stopLoss: numericStopLoss || undefined,
      takeProfit: numericTakeProfit || undefined,
      notes: notes || '',
      portfolioType: finalPortfolioType,
      portfolioId: finalPortfolioId,
    });

    console.log('🔍 [PORTFOLIO ADD] Portfolio item created:', portfolioItem);

    // Get decision for this stock with error handling
    try {
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

      console.log('🔍 [PORTFOLIO ADD] Decision made:', decision);
    } catch (decisionError) {
      console.warn('⚠️ [PORTFOLIO ADD] Decision engine error, using defaults:', decisionError);
      portfolioItem.action = 'HOLD';
      portfolioItem.reason = 'Added to portfolio';
      portfolioItem.color = 'yellow';
    }

    console.log('🔍 [PORTFOLIO ADD] Saving portfolio item...');
    await portfolioItem.save();
    console.log('✅ [PORTFOLIO ADD] Portfolio item saved successfully');

    res.status(201).json({ 
      message: 'Stock added successfully', 
      portfolioItem: portfolioItem.toObject() 
    });
  } catch (error: any) {
    console.error('❌ [PORTFOLIO ADD] Error adding stock:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate entry. This stock may already exist in your portfolio.' 
      });
    }

    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Update stock in portfolio
router.put('/:id', authenticateToken, requireSubscription, async (req, res) => {
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

// Delete stock from portfolio
router.delete('/:id', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { id } = req.params;

    const portfolioItem = await Portfolio.findOneAndDelete({ _id: id, userId: req.user!._id });
    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    res.json({ message: 'Portfolio item deleted successfully' });
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
