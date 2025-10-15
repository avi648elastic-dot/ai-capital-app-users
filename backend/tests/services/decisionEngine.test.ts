import { decisionEngine } from '../../src/services/decisionEngine';

describe('Decision Engine', () => {
  describe('calculateScore', () => {
    it('should return a score between 0 and 100', () => {
      const mockData = {
        price: 150,
        change: 2.5,
        changePercent: 1.67,
        volume: 1000000,
        avgVolume: 800000,
        pe: 25,
        marketCap: 2500000000000,
        rsi: 55,
        macd: 0.5,
        sma20: 148,
        sma50: 145,
        sma200: 140
      };

      const score = decisionEngine.calculateScore(mockData);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return high score for strong bullish signals', () => {
      const bullishData = {
        price: 150,
        change: 5,
        changePercent: 3.45,
        volume: 2000000, // High volume
        avgVolume: 800000,
        pe: 15, // Low PE (undervalued)
        marketCap: 2500000000000,
        rsi: 35, // Oversold
        macd: 2.0, // Strong bullish MACD
        sma20: 145,
        sma50: 140,
        sma200: 130 // Strong uptrend
      };

      const score = decisionEngine.calculateScore(bullishData);
      expect(score).toBeGreaterThan(70);
    });

    it('should return low score for bearish signals', () => {
      const bearishData = {
        price: 150,
        change: -5,
        changePercent: -3.23,
        volume: 500000, // Low volume
        avgVolume: 800000,
        pe: 35, // High PE (overvalued)
        marketCap: 2500000000000,
        rsi: 75, // Overbought
        macd: -2.0, // Bearish MACD
        sma20: 155,
        sma50: 160,
        sma200: 170 // Downtrend
      };

      const score = decisionEngine.calculateScore(bearishData);
      expect(score).toBeLessThan(40);
    });

    it('should handle missing data gracefully', () => {
      const incompleteData = {
        price: 150,
        change: 2.5,
        changePercent: 1.67,
        volume: 1000000,
        avgVolume: 800000,
        pe: undefined, // Missing PE
        marketCap: undefined, // Missing market cap
        rsi: undefined, // Missing RSI
        macd: undefined, // Missing MACD
        sma20: 148,
        sma50: 145,
        sma200: 140
      };

      const score = decisionEngine.calculateScore(incompleteData);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getRecommendation', () => {
    it('should return BUY for high scores', () => {
      const recommendation = decisionEngine.getRecommendation(75);
      expect(recommendation).toBe('BUY');
    });

    it('should return HOLD for medium scores', () => {
      const recommendation = decisionEngine.getRecommendation(50);
      expect(recommendation).toBe('HOLD');
    });

    it('should return SELL for low scores', () => {
      const recommendation = decisionEngine.getRecommendation(25);
      expect(recommendation).toBe('SELL');
    });

    it('should handle edge cases correctly', () => {
      expect(decisionEngine.getRecommendation(70)).toBe('BUY');
      expect(decisionEngine.getRecommendation(55)).toBe('HOLD');
      expect(decisionEngine.getRecommendation(45)).toBe('HOLD');
      expect(decisionEngine.getRecommendation(30)).toBe('SELL');
    });
  });

  describe('getConfidence', () => {
    it('should return high confidence for consistent signals', () => {
      const consistentScores = [75, 78, 72, 76, 74];
      const confidence = decisionEngine.getConfidence(consistentScores);
      expect(confidence).toBeGreaterThan(80);
    });

    it('should return low confidence for inconsistent signals', () => {
      const inconsistentScores = [20, 80, 30, 75, 25];
      const confidence = decisionEngine.getConfidence(inconsistentScores);
      expect(confidence).toBeLessThan(60);
    });

    it('should handle single score', () => {
      const singleScore = [75];
      const confidence = decisionEngine.getConfidence(singleScore);
      expect(confidence).toBe(100); // Perfect confidence for single score
    });
  });

  describe('analyzeStock', () => {
    it('should return complete analysis object', () => {
      const mockData = {
        price: 150,
        change: 2.5,
        changePercent: 1.67,
        volume: 1000000,
        avgVolume: 800000,
        pe: 25,
        marketCap: 2500000000000,
        rsi: 55,
        macd: 0.5,
        sma20: 148,
        sma50: 145,
        sma200: 140
      };

      const analysis = decisionEngine.analyzeStock(mockData);
      
      expect(analysis).toHaveProperty('score');
      expect(analysis).toHaveProperty('recommendation');
      expect(analysis).toHaveProperty('confidence');
      expect(analysis).toHaveProperty('reasoning');
      expect(analysis).toHaveProperty('signals');
      
      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
      expect(['BUY', 'HOLD', 'SELL']).toContain(analysis.recommendation);
      expect(analysis.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis.confidence).toBeLessThanOrEqual(100);
      expect(Array.isArray(analysis.reasoning)).toBe(true);
      expect(typeof analysis.signals).toBe('object');
    });

    it('should include technical analysis signals', () => {
      const mockData = {
        price: 150,
        change: 2.5,
        changePercent: 1.67,
        volume: 1000000,
        avgVolume: 800000,
        pe: 25,
        marketCap: 2500000000000,
        rsi: 55,
        macd: 0.5,
        sma20: 148,
        sma50: 145,
        sma200: 140
      };

      const analysis = decisionEngine.analyzeStock(mockData);
      
      expect(analysis.signals).toHaveProperty('momentum');
      expect(analysis.signals).toHaveProperty('volume');
      expect(analysis.signals).toHaveProperty('volatility');
      expect(analysis.signals).toHaveProperty('fundamentals');
      expect(analysis.signals).toHaveProperty('trend');
    });
  });

  describe('Performance', () => {
    it('should analyze stock within acceptable time', () => {
      const mockData = {
        price: 150,
        change: 2.5,
        changePercent: 1.67,
        volume: 1000000,
        avgVolume: 800000,
        pe: 25,
        marketCap: 2500000000000,
        rsi: 55,
        macd: 0.5,
        sma20: 148,
        sma50: 145,
        sma200: 140
      };

      const startTime = Date.now();
      decisionEngine.analyzeStock(mockData);
      const endTime = Date.now();
      
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});
