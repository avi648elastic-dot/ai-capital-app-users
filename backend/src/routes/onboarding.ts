import express from 'express';
import User from '../models/User';
import Portfolio from '../models/Portfolio';
import { authenticateToken } from '../middleware/auth';
import { portfolioGenerator } from '../services/portfolioGenerator';

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
    const { stocks, totalCapital, riskTolerance } = req.body;
    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({ message: 'Stocks array is required' });
    }

    const user = await User.findById(req.user!._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.portfolioType = 'imported';
    user.portfolioSource = 'imported';
    user.totalCapital = totalCapital || 0;
    user.riskTolerance = riskTolerance || 7;
    await user.save();

    await Portfolio.deleteMany({ userId: req.user!._id });
    const portfolioItems = [];

    for (const stock of stocks) {
      const { stopLoss, takeProfit } = portfolioGenerator.calculateStopLossAndTakeProfit(
        stock.entryPrice,
        riskTolerance || 7
      );

      const item = new Portfolio({
        userId: req.user!._id,
        ticker: stock.ticker.toUpperCase(),
        shares: Number(stock.shares),
        entryPrice: Number(stock.entryPrice),
        currentPrice: Number(stock.currentPrice),
        stopLoss,
        takeProfit,
        notes: stock.notes || '',
      });

      await item.save();
      portfolioItems.push(item);
    }

    user.onboardingCompleted = true;
    await user.save();

    return res.json({
      message: 'Portfolio imported successfully',
      portfolio: portfolioItems,
    });
  } catch (error) {
    console.error('❌ Import portfolio error:', error);
    return res.status(500).json({ message: 'Internal server error' });
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

    if (!['solid', 'dangerous'].includes(portfolioType)) {
      return res.status(400).json({ message: 'Portfolio type must be solid or dangerous' });
    }

    if (!req.user?._id) {
      console.error('❌ [GENERATE PORTFOLIO] No user ID found');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // הפעלת האלגוריתם ליצירת תיק
    console.log('🔍 [GENERATE PORTFOLIO] Generating portfolio...');
    const generatedStocks = portfolioGenerator.generatePortfolio(
      portfolioType,
      Number(totalCapital),
      Number(riskTolerance) || 7
    );
    console.log('✅ [GENERATE PORTFOLIO] Generated stocks:', generatedStocks.length);

    // שדרוג התיק ע"י Decision Engine
    console.log('🔍 [GENERATE PORTFOLIO] Enhancing portfolio...');
    const enhancedStocks = await portfolioGenerator.validateAndEnhancePortfolio(generatedStocks);
    console.log('✅ [GENERATE PORTFOLIO] Enhanced stocks:', enhancedStocks.length);

    // מחיקת תיק קודם (אם יש)
    console.log('🔍 [GENERATE PORTFOLIO] Deleting old portfolio...');
    await Portfolio.deleteMany({ userId: req.user!._id });
    console.log('✅ [GENERATE PORTFOLIO] Old portfolio deleted');

    // שמירת התיק החדש למסד הנתונים
    console.log('🔍 [GENERATE PORTFOLIO] Saving new portfolio...');
    const savedItems = [];
    for (let i = 0; i < enhancedStocks.length; i++) {
      const stock = enhancedStocks[i];
      console.log(`🔍 [GENERATE PORTFOLIO] Saving stock ${i + 1}/${enhancedStocks.length}: ${stock.ticker}`);
      
      const newItem = new Portfolio({
        userId: req.user!._id,
        ticker: stock.ticker,
        shares: stock.shares,
        entryPrice: stock.entryPrice,
        currentPrice: stock.currentPrice,
        stopLoss: stock.stopLoss,
        takeProfit: stock.takeProfit,
        action: stock.action || 'HOLD',
        reason: stock.reason || '',
        color: stock.color || 'yellow',
      });
      await newItem.save();
      savedItems.push(newItem);
      console.log(`✅ [GENERATE PORTFOLIO] Saved stock: ${stock.ticker}`);
    }
    console.log('✅ [GENERATE PORTFOLIO] All stocks saved');

    // עדכון פרטי המשתמש וסימון סיום Onboarding
    console.log('🔍 [GENERATE PORTFOLIO] Updating user...');
    await User.findByIdAndUpdate(req.user!._id, {
      portfolioType,
      portfolioSource: 'ai-generated',
      totalCapital: Number(totalCapital),
      riskTolerance: Number(riskTolerance) || 7,
      onboardingCompleted: true,
    });
    console.log('✅ [GENERATE PORTFOLIO] User updated');

    console.log('✅ [GENERATE PORTFOLIO] Portfolio generation completed successfully');
    return res.json({
      message: 'AI portfolio generated and saved successfully',
      portfolio: savedItems,
    });
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

    await User.findByIdAndUpdate(req.user!._id, { onboardingCompleted: true });

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
    await User.findByIdAndUpdate(req.user!._id, {
      onboardingCompleted: true,
      portfolioType: 'solid',
      portfolioSource: 'imported',
    });

    return res.json({ message: 'Onboarding skipped successfully' });
  } catch (error) {
    console.error('❌ Skip onboarding error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
