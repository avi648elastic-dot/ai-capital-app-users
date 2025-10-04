import express from 'express';
import User from '../models/User';
import Portfolio from '../models/Portfolio';
import { authenticateToken } from '../middleware/auth';
import { portfolioGenerator } from '../services/portfolioGenerator';

const router = express.Router();

// Check onboarding status
router.get('/status', authenticateToken, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      onboardingCompleted: user?.onboardingCompleted || false,
      portfolioType: user?.portfolioType,
      portfolioSource: user?.portfolioSource,
    });
  } catch (error) {
    console.error('Get onboarding status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Step 1: Check if user has existing portfolio
router.post('/check-existing', authenticateToken, async (req: any, res) => {
  try {
    const { hasExistingPortfolio } = req.body;

    if (hasExistingPortfolio) {
      await User.findByIdAndUpdate(req.user._id, { portfolioSource: 'imported' });
    } else {
      await User.findByIdAndUpdate(req.user._id, { portfolioSource: 'ai-generated' });
    }

    res.json({ message: 'Portfolio preference saved' });
  } catch (error) {
    console.error('Check existing portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Step 2a: Import existing portfolio
router.post('/import-portfolio', authenticateToken, async (req: any, res) => {
  try {
    const { stocks, totalCapital, riskTolerance } = req.body;

    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({ message: 'Stocks array is required' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      portfolioType: 'imported',
      portfolioSource: 'imported',
      totalCapital,
      riskTolerance: riskTolerance || 7,
    });

    const portfolioItems = [];
    for (const stock of stocks) {
      const { stopLoss, takeProfit } = portfolioGenerator.calculateStopLossAndTakeProfit(
        stock.entryPrice,
        riskTolerance || 7
      );

      const portfolioItem = new Portfolio({
        userId: req.user._id,
        ticker: stock.ticker.toUpperCase(),
        shares: Number(stock.shares),
        entryPrice: Number(stock.entryPrice),
        currentPrice: Number(stock.currentPrice),
        stopLoss,
        takeProfit,
        notes: stock.notes || '',
      });

      await portfolioItem.save();
      portfolioItems.push(portfolioItem);
    }

    await User.findByIdAndUpdate(req.user._id, { onboardingCompleted: true });

    res.json({
      message: 'Portfolio imported successfully',
      portfolio: portfolioItems,
    });
  } catch (error) {
    console.error('Import portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Step 2b: Generate AI portfolio
router.post('/generate-portfolio', authenticateToken, async (req: any, res) => {
  try {
    const { portfolioType, totalCapital, riskTolerance } = req.body;

    if (!portfolioType || !totalCapital) {
      return res.status(400).json({ message: 'Portfolio type and total capital are required' });
    }

    if (!['solid', 'dangerous'].includes(portfolioType)) {
      return res.status(400).json({ message: 'Portfolio type must be solid or dangerous' });
    }

    const generatedStocks = portfolioGenerator.generatePortfolio(
      portfolioType,
      Number(totalCapital),
      Number(riskTolerance) || 7
    );

    const enhancedStocks = await portfolioGenerator.validateAndEnhancePortfolio(generatedStocks);

    await User.findByIdAndUpdate(req.user._id, {
      portfolioType,
      portfolioSource: 'ai-generated',
      totalCapital: Number(totalCapital),
      riskTolerance: Number(riskTolerance) || 7,
    });

    res.json({
      message: 'Portfolio generated successfully',
      portfolio: enhancedStocks,
      portfolioType,
    });
  } catch (error) {
    console.error('Generate portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Step 3: Confirm and save generated portfolio
router.post('/confirm-portfolio', authenticateToken, async (req: any, res) => {
  try {
    const { portfolio } = req.body;

    if (!portfolio || !Array.isArray(portfolio)) {
      return res.status(400).json({ message: 'Portfolio array is required' });
    }

    await Portfolio.deleteMany({ userId: req.user._id });

    const portfolioItems = [];
    for (const stock of portfolio) {
      const portfolioItem = new Portfolio({
        userId: req.user._id,
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

      await portfolioItem.save();
      portfolioItems.push(portfolioItem);
    }

    await User.findByIdAndUpdate(req.user._id, { onboardingCompleted: true });

    res.json({
      message: 'Portfolio confirmed and saved',
      portfolio: portfolioItems,
    });
  } catch (error) {
    console.error('Confirm portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Skip onboarding
router.post('/skip', authenticateToken, async (req: any, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      onboardingCompleted: true,
      portfolioType: 'solid',
      portfolioSource: 'imported',
    });

    res.json({ message: 'Onboarding skipped' });
  } catch (error) {
    console.error('Skip onboarding error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
