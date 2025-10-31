import express from 'express';
import User from '../models/User';
import Portfolio from '../models/Portfolio';
import { authenticateToken } from '../middleware/auth';
import { portfolioGenerator } from '../services/portfolioGenerator';
import { volatilityService } from '../services/volatilityService';
import { loggerService } from '../services/loggerService';

const router = express.Router();

/**
 * 📌 STEP 0 – בדיקה אם המשתמש כבר עבר Onboarding
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [ONBOARDING STATUS] Checking for user:', req.user!._id);
    const user = await User.findById(req.user!._id);
    if (!user) {
      console.log('❌ [ONBOARDING STATUS] User not found:', req.user!._id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('📊 [ONBOARDING STATUS] User data:', {
      id: user._id,
      email: user.email,
      onboardingCompleted: user.onboardingCompleted,
      portfolioType: user.portfolioType,
      portfolioSource: user.portfolioSource
    });

    const response = {
      onboardingCompleted: user.onboardingCompleted || false,
      portfolioType: user.portfolioType || null,
      portfolioSource: user.portfolioSource || null,
    };

    console.log('✅ [ONBOARDING STATUS] Response:', response);
    return res.json(response);
  } catch (error) {
    console.error('❌ Get onboarding status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * 📌 STEP 1 – המשתמש בוחר אם יש לו תיק קיים או רוצה שה-AI ייצור אחד
 */
router.post('/check-existing', authenticateToken, async (req, res) => {
  try {
    const { hasExistingPortfolio } = req.body;
    if (typeof hasExistingPortfolio !== 'boolean') {
      return res.status(400).json({ message: 'Invalid hasExistingPortfolio flag' });
    }

    const updateData = {
      portfolioSource: hasExistingPortfolio ? 'imported' : 'ai-generated',
    };

    await User.findByIdAndUpdate(req.user!._id, updateData);
    return res.json({ message: 'Portfolio preference saved', ...updateData });
  } catch (error) {
    console.error('❌ Check existing portfolio error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * 📌 STEP 2A – המשתמש מייבא תיק קיים (stocks ידניים)
 */
router.post('/import-portfolio', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [IMPORT PORTFOLIO] Starting import process...');
    const { stocks, totalCapital, riskTolerance } = req.body;
    
    console.log('🔍 [IMPORT PORTFOLIO] Request data:', { stocks, totalCapital, riskTolerance });
    
    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      console.log('❌ [IMPORT PORTFOLIO] No stocks provided');
      return res.status(400).json({ message: 'Stocks array is required' });
    }

    console.log('🔍 [IMPORT PORTFOLIO] Finding user:', req.user!._id);
    const user = await User.findById(req.user!._id);
    if (!user) {
      console.log('❌ [IMPORT PORTFOLIO] User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🔍 [IMPORT PORTFOLIO] Updating user data...');
    user.portfolioType = 'imported';
    user.portfolioSource = 'imported';
    user.totalCapital = totalCapital || 0;
    user.riskTolerance = riskTolerance || 7;
    await user.save();

    console.log('🔍 [IMPORT PORTFOLIO] Clearing existing portfolio...');
    await Portfolio.deleteMany({ userId: req.user!._id });
    const portfolioItems = [];

    console.log('🔍 [IMPORT PORTFOLIO] Processing stocks...');
    for (const stock of stocks) {
      console.log('🔍 [IMPORT PORTFOLIO] Processing stock:', stock.ticker);
      
      const { stopLoss, takeProfit } = portfolioGenerator.calculateStopLossAndTakeProfit(
        stock.entryPrice,
        riskTolerance || 7
      );

      console.log('🔍 [IMPORT PORTFOLIO] Stop loss/take profit:', { stopLoss, takeProfit });

      // For imported portfolios, default to HOLD action
      // AI decisions will be calculated later by the scheduler
      const item = new Portfolio({
        userId: req.user!._id,
        ticker: stock.ticker.toUpperCase(),
        shares: Number(stock.shares),
        entryPrice: Number(stock.entryPrice),
        currentPrice: Number(stock.currentPrice),
        stopLoss,
        takeProfit,
        notes: stock.notes || '',
        portfolioType: 'solid', // Imported portfolios default to solid
        portfolioId: 'solid-1', // Default portfolio ID
        action: 'HOLD', // Default to HOLD for imported stocks
        reason: 'Portfolio imported - AI analysis pending',
        color: 'yellow',
      });

      console.log('🔍 [IMPORT PORTFOLIO] Saving portfolio item...');
      await item.save();
      portfolioItems.push(item);
    }

    console.log('🔍 [IMPORT PORTFOLIO] Completing onboarding...');
    // Grant 30-day premium+ trial when onboarding completes
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 days from now
    
    user.onboardingCompleted = true;
    user.subscriptionTier = 'premium+';
    user.subscriptionActive = true;
    user.trialStartDate = now;
    user.trialEndDate = trialEndDate;
    user.isTrialActive = true;
    
    await user.save();
    console.log(`✅ [IMPORT PORTFOLIO] User granted 30-day premium+ trial (expires: ${trialEndDate.toISOString()})`);

    console.log('✅ [IMPORT PORTFOLIO] Import completed successfully');
    return res.json({
      message: 'Portfolio imported successfully',
      portfolio: portfolioItems,
    });
  } catch (error: any) {
    console.error('❌ Import portfolio error:', error);
    console.error('❌ Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error'
    });
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error?.message || 'Unknown error') : 'Server error'
    });
  }
});

/**
 * 📌 STEP 2B – המשתמש מבקש מה-AI לבנות תיק ולשמור אותו
 */
router.post('/generate-portfolio', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [GENERATE PORTFOLIO] Request body:', req.body);
    console.log('🔍 [GENERATE PORTFOLIO] User ID:', req.user?._id);
    
    const { portfolioType, totalCapital, riskTolerance } = req.body;

    if (!portfolioType || !totalCapital) {
      return res.status(400).json({ message: 'Portfolio type and total capital are required' });
    }

    if (!['solid', 'risky'].includes(portfolioType)) {
      return res.status(400).json({ message: 'Portfolio type must be solid or risky' });
    }

    if (!req.user?._id) {
      console.error('❌ [GENERATE PORTFOLIO] No user ID found');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // הפעלת האלגוריתם ליצירת תיק עם נתוני Volatility
    loggerService.info(`🔍 [GENERATE PORTFOLIO] Generating ${portfolioType} portfolio with volatility insights...`);
    const generatedStocks = await portfolioGenerator.generatePortfolio(
      portfolioType,
      Number(totalCapital),
      Number(riskTolerance) || 7
    );
    loggerService.info(`✅ [GENERATE PORTFOLIO] Generated ${generatedStocks.length} stocks with volatility data`);

    // Calculate portfolio-level volatility insights
    const tickers = generatedStocks.map(stock => stock.ticker);
    const portfolioVolatilityMetrics = await volatilityService.calculatePortfolioVolatility(tickers);
    
    if (portfolioVolatilityMetrics) {
      loggerService.info(`📊 [GENERATE PORTFOLIO] Portfolio volatility: ${portfolioVolatilityMetrics.volatility}% (${portfolioVolatilityMetrics.riskLevel})`);
    }

    // שדרוג התיק ע"י Decision Engine
    console.log('🔍 [GENERATE PORTFOLIO] Enhancing portfolio...');
    const enhancedStocks = await portfolioGenerator.validateAndEnhancePortfolio(generatedStocks);
    console.log('✅ [GENERATE PORTFOLIO] Enhanced stocks:', enhancedStocks.length);

    // מחיקת תיק קודם (אם יש)
    console.log('🔍 [GENERATE PORTFOLIO] Deleting old portfolio...');
    try {
      await Portfolio.deleteMany({ userId: req.user!._id });
      console.log('✅ [GENERATE PORTFOLIO] Old portfolio deleted');
    } catch (deleteError) {
      console.error('❌ [GENERATE PORTFOLIO] Error deleting old portfolio:', deleteError);
      // Continue anyway
    }

    // שמירת התיק החדש למסד הנתונים
    console.log('🔍 [GENERATE PORTFOLIO] Saving new portfolio...');
    const savedItems = [];
    try {
      for (let i = 0; i < enhancedStocks.length; i++) {
        const stock = enhancedStocks[i];
        console.log(`🔍 [GENERATE PORTFOLIO] Saving stock ${i + 1}/${enhancedStocks.length}: ${stock.ticker}`);
        // Ensure we have a realistic current price; if missing, attempt a realtime fetch
        let currentPrice = Number(stock.currentPrice);
        if (!currentPrice || currentPrice <= 0) {
          try {
            const { stockDataService } = await import('../services/stockDataService');
            const rt = await stockDataService.getStockData(stock.ticker);
            if (rt?.current) currentPrice = Number(rt.current.toFixed(2));
          } catch (rtErr) {
            console.warn('⚠️ [GENERATE PORTFOLIO] Realtime price fetch failed for', stock.ticker, rtErr);
          }
        }
        if (!currentPrice || currentPrice <= 0) {
          // Final fallback to entry price so we never store 0
          currentPrice = Number(stock.entryPrice);
        }

        const newItem = new Portfolio({
          userId: req.user!._id,
          ticker: stock.ticker,
          shares: stock.shares,
          // Align entry with current at time of portfolio creation so P&L starts at 0
          entryPrice: currentPrice,
          currentPrice,
          stopLoss: stock.stopLoss,
          takeProfit: stock.takeProfit,
          action: stock.action || 'HOLD',
          reason: stock.reason || '',
          color: stock.color || 'yellow',
          portfolioType: portfolioType, // Add portfolio type
        });
        await newItem.save();
        savedItems.push(newItem);
        console.log(`✅ [GENERATE PORTFOLIO] Saved stock: ${stock.ticker}`);
      }
      console.log('✅ [GENERATE PORTFOLIO] All stocks saved');
    } catch (saveError) {
      console.error('❌ [GENERATE PORTFOLIO] Error saving portfolio:', saveError);
      return res.status(500).json({ message: 'Error saving portfolio to database' });
    }

    // עדכון פרטי המשתמש וסימון סיום Onboarding
    // Grant 30-day premium+ trial when onboarding completes
    console.log('🔍 [GENERATE PORTFOLIO] Updating user...');
    try {
      const now = new Date();
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 days from now
      
      await User.findByIdAndUpdate(req.user!._id, {
        portfolioType,
        portfolioSource: 'ai-generated',
        totalCapital: Number(totalCapital),
        riskTolerance: Number(riskTolerance) || 7,
        onboardingCompleted: true,
        subscriptionTier: 'premium+',
        subscriptionActive: true,
        trialStartDate: now,
        trialEndDate: trialEndDate,
        isTrialActive: true,
      });
      console.log(`✅ [GENERATE PORTFOLIO] User granted 30-day premium+ trial (expires: ${trialEndDate.toISOString()})`);
    } catch (userError) {
      console.error('❌ [GENERATE PORTFOLIO] Error updating user:', userError);
      // Continue anyway - portfolio is saved
    }

    loggerService.info('✅ [GENERATE PORTFOLIO] Portfolio generation completed successfully');
    
    // Prepare response with volatility insights
    const response = {
      message: 'AI portfolio generated and saved successfully with volatility insights',
      portfolio: savedItems,
      volatilityInsights: portfolioVolatilityMetrics ? {
        portfolioVolatility: portfolioVolatilityMetrics.volatility,
        riskLevel: portfolioVolatilityMetrics.riskLevel,
        riskColor: portfolioVolatilityMetrics.riskColor,
        diversificationRatio: portfolioVolatilityMetrics.diversificationRatio,
        concentrationRisk: portfolioVolatilityMetrics.concentrationRisk,
        confidence: portfolioVolatilityMetrics.confidence
      } : null,
      portfolioType,
      dataSource: 'Google Finance 90-Day Data'
    };
    
    return res.json(response);
  } catch (error) {
    console.error('❌ Generate portfolio error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * 📌 STEP 3 – אישור תיק סופי (למקרה של עריכה ידנית)
 */
router.post('/confirm-portfolio', authenticateToken, async (req, res) => {
  try {
    const { portfolio } = req.body;
    if (!portfolio || !Array.isArray(portfolio)) {
      return res.status(400).json({ message: 'Portfolio array is required' });
    }

    await Portfolio.deleteMany({ userId: req.user!._id });
    const items = [];

    for (const stock of portfolio) {
      const item = new Portfolio({
        userId: req.user!._id,
        ticker: stock.ticker.toUpperCase(),
        shares: Number(stock.shares),
        entryPrice: Number(stock.entryPrice),
        currentPrice: Number(stock.currentPrice),
        stopLoss: Number(stock.stopLoss),
        takeProfit: Number(stock.takeProfit),
        action: stock.action || 'HOLD',
        reason: stock.reason || '',
        color: stock.color || 'yellow',
        notes: stock.notes || '',
      });

      await item.save();
      items.push(item);
    }

    // Grant 30-day premium+ trial when onboarding completes
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 days from now
    
    await User.findByIdAndUpdate(req.user!._id, { 
      onboardingCompleted: true,
      subscriptionTier: 'premium+',
      subscriptionActive: true,
      trialStartDate: now,
      trialEndDate: trialEndDate,
      isTrialActive: true,
    });
    console.log(`✅ [CONFIRM PORTFOLIO] User granted 30-day premium+ trial (expires: ${trialEndDate.toISOString()})`);

    return res.json({
      message: 'Portfolio confirmed and saved successfully',
      portfolio: items,
    });
  } catch (error) {
    console.error('❌ Confirm portfolio error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * 🧪 TEST MODE – דילוג על Onboarding
 */
router.post('/skip', authenticateToken, async (req, res) => {
  try {
    // Grant 30-day premium+ trial when skipping onboarding (test mode)
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 days from now
    
    await User.findByIdAndUpdate(req.user!._id, {
      onboardingCompleted: true,
      portfolioType: 'solid',
      portfolioSource: 'imported',
      subscriptionTier: 'premium+',
      subscriptionActive: true,
      trialStartDate: now,
      trialEndDate: trialEndDate,
      isTrialActive: true,
    });
    console.log(`✅ [SKIP ONBOARDING] User granted 30-day premium+ trial (expires: ${trialEndDate.toISOString()})`);

    return res.json({ message: 'Onboarding skipped successfully' });
  } catch (error) {
    console.error('❌ Skip onboarding error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
