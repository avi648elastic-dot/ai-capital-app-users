import express, { Request, Response } from 'express';
import Portfolio from '../models/Portfolio';
import User from '../models/User';
import { authenticateToken, requireSubscription } from '../middleware/auth';
import { portfolioGenerator } from '../services/portfolioGenerator';

const router = express.Router();

// Get all portfolios for a user (grouped by portfolioId)
router.get('/', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ userId: req.user!._id }).sort({ portfolioId: 1, createdAt: -1 });
    
    // Group portfolios by portfolioId and fetch exchange information
    const groupedPortfolios = await Promise.all(
      Object.values(
        portfolios.reduce((acc, item) => {
          const key = item.portfolioId;
          if (!acc[key]) {
            acc[key] = {
              portfolioId: item.portfolioId,
              portfolioType: item.portfolioType,
              portfolioName: item.portfolioName || `${item.portfolioType} Portfolio ${item.portfolioId.split('-')[1]}`,
              stocks: [],
              totals: { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 },
              volatility: item.volatility || 0,
              lastVolatilityUpdate: item.lastVolatilityUpdate
            };
          }
          
          // Calculate totals
          const cost = item.entryPrice * item.shares;
          const value = item.currentPrice * item.shares;
          const pnl = value - cost;
          
          acc[key].totals.initial += cost;
          acc[key].totals.current += value;
          acc[key].totals.totalPnL += pnl;
          acc[key].stocks.push(item);
          
          return acc;
        }, {} as any)
      ).map(async (portfolio: any) => {
        // Fetch exchange information for each stock
        const stocksWithExchange = await Promise.all(
          portfolio.stocks.map(async (stock: any) => {
            let exchange = '—';
            try {
              const { default: axios } = await import('axios');
              const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd3crne9r01qmnfgf0q70d3crne9r01qmnfgf0q7g';
              
              // Quick mapping by suffix first
              if (stock.ticker.endsWith('.TO')) exchange = 'TSX';
              else if (stock.ticker.endsWith('.SW')) exchange = 'SWISS';
              else if (stock.ticker.endsWith('.L')) exchange = 'LSE';
              else if (stock.ticker.includes(':')) {
                exchange = stock.ticker.split(':')[0].toUpperCase();
              } else {
                // Use Finnhub API
                const response = await axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${stock.ticker}&token=${FINNHUB_API_KEY}`);
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
              console.warn(`⚠️ [PORTFOLIOS] Could not fetch exchange for ${stock.ticker}:`, exchangeError);
              exchange = '—';
            }
            
            return {
              ...stock.toObject(),
              exchange: exchange
            };
          })
        );
        
        return {
          ...portfolio,
          stocks: stocksWithExchange
        };
      })
    );

    // Calculate percentages
    groupedPortfolios.forEach((portfolio: any) => {
      portfolio.totals.totalPnLPercent = portfolio.totals.initial > 0 
        ? (portfolio.totals.totalPnL / portfolio.totals.initial) * 100 
        : 0;
    });

    res.json({ portfolios: groupedPortfolios });
  } catch (error) {
    console.error('Get portfolios error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new portfolio
router.post('/create', authenticateToken, requireSubscription, async (req, res) => {
  try {
    console.log('🔍 [CREATE PORTFOLIO] Starting portfolio creation...');
    console.log('🔍 [CREATE PORTFOLIO] Request body:', req.body);
    console.log('🔍 [CREATE PORTFOLIO] User ID:', (req as any).user!._id);
    
    const { 
      portfolioType, 
      portfolioName, 
      initialInvestment, 
      riskTolerance
    } = req.body;
    
    if (!['solid', 'risky'].includes(portfolioType)) {
      return res.status(400).json({ message: 'Invalid portfolio type' });
    }

    // Validate initial investment
    if (initialInvestment && (isNaN(initialInvestment) || initialInvestment <= 0)) {
      return res.status(400).json({ message: 'Initial investment must be a positive number' });
    }

    // Validate risk tolerance (1-10 scale)
    if (riskTolerance && (isNaN(riskTolerance) || riskTolerance < 1 || riskTolerance > 10)) {
      return res.status(400).json({ message: 'Risk tolerance must be between 1 and 10' });
    }

    // Check if user is premium
    const user = await User.findById((req as any).user!._id);
    if (user?.subscriptionTier !== 'premium') {
      return res.status(403).json({ message: 'Premium subscription required to create multiple portfolios' });
    }

    // Count existing portfolios of this type
    const existingCount = await Portfolio.distinct('portfolioId', { 
      userId: (req as any).user!._id, 
      portfolioType 
    });

    if (existingCount.length >= 3) {
      return res.status(403).json({ 
        message: `Maximum 3 ${portfolioType} portfolios allowed for premium users. Upgrade to Premium+ for up to 5 portfolios.` 
      });
    }

    // Generate new portfolio ID
    const nextNumber = existingCount.length + 1;
    const portfolioId = `${portfolioType}-${nextNumber}`;

    console.log('🔍 [CREATE PORTFOLIO] Generating stocks like onboarding...');
    
    // Generate actual stocks using the same logic as onboarding
    const generatedStocks = await portfolioGenerator.generatePortfolio(
      portfolioType,
      Number(initialInvestment),
      Number(riskTolerance) || 7
    );
    console.log('✅ [CREATE PORTFOLIO] Generated stocks:', generatedStocks.length);

    // Enhance portfolio with decision engine
    console.log('🔍 [CREATE PORTFOLIO] Enhancing portfolio...');
    const enhancedStocks = await portfolioGenerator.validateAndEnhancePortfolio(generatedStocks);
    console.log('✅ [CREATE PORTFOLIO] Enhanced stocks:', enhancedStocks.length);

    // Save all stocks to database with the new portfolio ID
    console.log('🔍 [CREATE PORTFOLIO] Saving stocks to database...');
    const savedItems = [];
    try {
      for (let i = 0; i < enhancedStocks.length; i++) {
        const stock = enhancedStocks[i];
        const portfolioData = {
          userId: (req as any).user!._id,
          ticker: stock.ticker,
          shares: stock.shares,
          entryPrice: stock.entryPrice,
          currentPrice: stock.currentPrice,
          date: new Date(),
          action: stock.action || 'HOLD',
          reason: stock.reason || 'AI Generated',
          color: stock.color || 'blue',
          portfolioType,
          portfolioId,
          portfolioName: portfolioName || `${portfolioType} Portfolio ${nextNumber}`,
          volatility: 0,
          lastVolatilityUpdate: new Date()
        };

        const savedItem = await Portfolio.create(portfolioData);
        savedItems.push(savedItem);
        console.log(`✅ [CREATE PORTFOLIO] Saved stock ${i + 1}/${enhancedStocks.length}: ${stock.ticker}`);
      }
    } catch (saveError) {
      console.error('❌ [CREATE PORTFOLIO] Error saving stocks:', saveError);
      throw saveError;
    }

    console.log('✅ [CREATE PORTFOLIO] Portfolio created successfully with', savedItems.length, 'stocks');

    res.json({ 
      message: 'Portfolio created successfully with AI-generated stocks', 
      portfolio: savedItems,
      success: true,
      stocksCount: savedItems.length
    });
  } catch (error) {
    console.error('Create portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get stocks for a specific portfolio
router.get('/:portfolioId', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { portfolioId } = req.params;
    
    const stocks = await Portfolio.find({ 
      userId: req.user!._id, 
      portfolioId 
    }).sort({ createdAt: -1 });

    if (stocks.length === 0) {
      return res.json({ 
        portfolioId, 
        stocks: [], 
        totals: { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 } 
      });
    }

    // Calculate totals
    const totals = stocks.reduce((acc, item) => {
      const cost = item.entryPrice * item.shares;
      const value = item.currentPrice * item.shares;
      const pnl = value - cost;
      
      return {
        initial: acc.initial + cost,
        current: acc.current + value,
        totalPnL: acc.totalPnL + pnl,
        totalPnLPercent: 0 // Will calculate after
      };
    }, { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });

    totals.totalPnLPercent = totals.initial > 0 ? (totals.totalPnL / totals.initial) * 100 : 0;

    res.json({ portfolioId, stocks, totals });
  } catch (error) {
    console.error('Get portfolio stocks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a portfolio (and all its stocks)
router.delete('/:portfolioId', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { portfolioId } = req.params;
    console.log('🗑️ [DELETE PORTFOLIO] Attempting to delete portfolio:', portfolioId);
    console.log('🗑️ [DELETE PORTFOLIO] User ID:', (req as any).user!._id);
    
    // Check if user is premium
    const user = await User.findById((req as any).user!._id);
    console.log('🗑️ [DELETE PORTFOLIO] User found:', user?.email, 'Tier:', user?.subscriptionTier);
    
    if (user?.subscriptionTier !== 'premium') {
      console.log('🗑️ [DELETE PORTFOLIO] User is not premium, denying deletion');
      return res.status(403).json({ message: 'Premium subscription required to manage multiple portfolios' });
    }

    // Check if this is the user's primary portfolio from onboarding
    const onboardingData = await User.findById((req as any).user!._id).select('onboardingCompleted portfolioType');
    console.log('🗑️ [DELETE PORTFOLIO] User onboarding data:', onboardingData);
    
    // Get the primary portfolio ID based on onboarding
    const primaryPortfolioId = onboardingData?.portfolioType ? `${onboardingData.portfolioType}-1` : null;
    console.log('🗑️ [DELETE PORTFOLIO] Primary portfolio ID from onboarding:', primaryPortfolioId);
    
    if (portfolioId === primaryPortfolioId) {
      console.log('🗑️ [DELETE PORTFOLIO] Cannot delete primary portfolio from onboarding:', portfolioId);
      return res.status(403).json({ 
        message: 'Cannot delete your primary portfolio from onboarding. You can only delete additional portfolios created later.' 
      });
    }

    console.log('🗑️ [DELETE PORTFOLIO] Proceeding with deletion...');
    const result = await Portfolio.deleteMany({ 
      userId: (req as any).user!._id, 
      portfolioId 
    });
    
    console.log('🗑️ [DELETE PORTFOLIO] Deletion result:', result);

    res.json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update portfolio volatilities for a specific user
router.post('/update-volatility', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const userId = (req as any).user!._id;
    
    // Import volatility service
    const { volatilityService } = await import('../services/volatilityService');
    
    await volatilityService.updateUserPortfolioVolatilities(userId.toString());
    
    res.json({ message: 'Portfolio volatilities updated successfully' });
  } catch (error) {
    console.error('❌ [PORTFOLIOS] Error updating volatilities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
