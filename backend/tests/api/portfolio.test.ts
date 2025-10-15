import request from 'supertest';
import app from '../../src/index';
import User from '../../src/models/User';
import Portfolio from '../../src/models/Portfolio';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Portfolio API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Clean up test database
    await User.deleteMany({});
    await Portfolio.deleteMany({});

    // Create test user and get token
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      subscriptionTier: 'premium'
    });

    userId = user._id.toString();
    authToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});
  });

  describe('GET /api/portfolio', () => {
    it('should get empty portfolio for new user', async () => {
      const response = await request(app)
        .get('/api/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.portfolio).toEqual([]);
      expect(response.body.totals.initial).toBe(0);
      expect(response.body.totals.current).toBe(0);
      expect(response.body.totals.totalPnL).toBe(0);
      expect(response.body.totals.totalPnLPercent).toBe(0);
    });

    it('should get portfolio with stocks', async () => {
      // Create test portfolio items
      await Portfolio.create([
        {
          userId,
          ticker: 'AAPL',
          shares: 10,
          entryPrice: 150,
          currentPrice: 155,
          action: 'BUY',
          portfolioType: 'solid',
          portfolioId: 'solid-1'
        },
        {
          userId,
          ticker: 'GOOGL',
          shares: 5,
          entryPrice: 2800,
          currentPrice: 2850,
          action: 'BUY',
          portfolioType: 'solid',
          portfolioId: 'solid-1'
        }
      ]);

      const response = await request(app)
        .get('/api/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.portfolio).toHaveLength(2);
      expect(response.body.totals.initial).toBe(44000); // (10*150) + (5*2800)
      expect(response.body.totals.current).toBe(44750); // (10*155) + (5*2850)
      expect(response.body.totals.totalPnL).toBe(750);
    });

    it('should filter by portfolio type', async () => {
      // Create mixed portfolio
      await Portfolio.create([
        {
          userId,
          ticker: 'AAPL',
          shares: 10,
          entryPrice: 150,
          currentPrice: 155,
          action: 'BUY',
          portfolioType: 'solid',
          portfolioId: 'solid-1'
        },
        {
          userId,
          ticker: 'TSLA',
          shares: 5,
          entryPrice: 800,
          currentPrice: 850,
          action: 'BUY',
          portfolioType: 'risky',
          portfolioId: 'risky-1'
        }
      ]);

      const response = await request(app)
        .get('/api/portfolio?portfolioType=solid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.portfolio).toHaveLength(1);
      expect(response.body.portfolio[0].ticker).toBe('AAPL');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/portfolio')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });
  });

  describe('POST /api/portfolio/add', () => {
    it('should add stock to portfolio', async () => {
      const stockData = {
        ticker: 'AAPL',
        shares: 10,
        entryPrice: 150,
        currentPrice: 155,
        stopLoss: 140,
        takeProfit: 170,
        notes: 'Test stock',
        portfolioType: 'solid',
        portfolioId: 'solid-1'
      };

      const response = await request(app)
        .post('/api/portfolio/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(stockData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('added successfully');

      // Verify stock was added to database
      const portfolio = await Portfolio.findOne({ userId, ticker: 'AAPL' });
      expect(portfolio).toBeTruthy();
      expect(portfolio?.shares).toBe(10);
      expect(portfolio?.entryPrice).toBe(150);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        ticker: 'AAPL'
        // Missing other required fields
      };

      const response = await request(app)
        .post('/api/portfolio/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should validate ticker format', async () => {
      const stockData = {
        ticker: 'invalid-ticker-format',
        shares: 10,
        entryPrice: 150,
        currentPrice: 155,
        portfolioType: 'solid',
        portfolioId: 'solid-1'
      };

      const response = await request(app)
        .post('/api/portfolio/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(stockData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid ticker format');
    });

    it('should enforce stock limits for free users', async () => {
      // Create free user
      const freeUser = await User.create({
        email: 'free@example.com',
        password: 'hashedpassword',
        name: 'Free User',
        subscriptionTier: 'free'
      });

      const freeToken = jwt.sign(
        { userId: freeUser._id, email: freeUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Add 10 stocks (free limit)
      for (let i = 0; i < 10; i++) {
        await Portfolio.create({
          userId: freeUser._id,
          ticker: `STOCK${i}`,
          shares: 1,
          entryPrice: 100,
          currentPrice: 105,
          action: 'BUY',
          portfolioType: 'solid',
          portfolioId: 'solid-1'
        });
      }

      // Try to add 11th stock
      const stockData = {
        ticker: 'EXTRA',
        shares: 1,
        entryPrice: 100,
        currentPrice: 105,
        portfolioType: 'solid',
        portfolioId: 'solid-1'
      };

      const response = await request(app)
        .post('/api/portfolio/add')
        .set('Authorization', `Bearer ${freeToken}`)
        .send(stockData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('limit exceeded');
    });

    it('should require authentication', async () => {
      const stockData = {
        ticker: 'AAPL',
        shares: 10,
        entryPrice: 150,
        currentPrice: 155,
        portfolioType: 'solid',
        portfolioId: 'solid-1'
      };

      const response = await request(app)
        .post('/api/portfolio/add')
        .send(stockData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });
  });

  describe('PUT /api/portfolio/:id', () => {
    let portfolioId: string;

    beforeEach(async () => {
      const portfolio = await Portfolio.create({
        userId,
        ticker: 'AAPL',
        shares: 10,
        entryPrice: 150,
        currentPrice: 155,
        action: 'BUY',
        portfolioType: 'solid',
        portfolioId: 'solid-1'
      });
      portfolioId = portfolio._id.toString();
    });

    it('should update portfolio item', async () => {
      const updateData = {
        shares: 15,
        currentPrice: 160,
        notes: 'Updated notes'
      };

      const response = await request(app)
        .put(`/api/portfolio/${portfolioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');

      // Verify update in database
      const updatedPortfolio = await Portfolio.findById(portfolioId);
      expect(updatedPortfolio?.shares).toBe(15);
      expect(updatedPortfolio?.currentPrice).toBe(160);
      expect(updatedPortfolio?.notes).toBe('Updated notes');
    });

    it('should not update non-existent portfolio item', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { shares: 15 };

      const response = await request(app)
        .put(`/api/portfolio/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should not update other user\'s portfolio', async () => {
      // Create another user
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'hashedpassword',
        name: 'Other User'
      });

      const otherPortfolio = await Portfolio.create({
        userId: otherUser._id,
        ticker: 'GOOGL',
        shares: 5,
        entryPrice: 2800,
        currentPrice: 2850,
        action: 'BUY',
        portfolioType: 'solid',
        portfolioId: 'solid-1'
      });

      const updateData = { shares: 10 };

      const response = await request(app)
        .put(`/api/portfolio/${otherPortfolio._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not authorized');
    });
  });

  describe('DELETE /api/portfolio/:id', () => {
    let portfolioId: string;

    beforeEach(async () => {
      const portfolio = await Portfolio.create({
        userId,
        ticker: 'AAPL',
        shares: 10,
        entryPrice: 150,
        currentPrice: 155,
        action: 'BUY',
        portfolioType: 'solid',
        portfolioId: 'solid-1'
      });
      portfolioId = portfolio._id.toString();
    });

    it('should delete portfolio item', async () => {
      const response = await request(app)
        .delete(`/api/portfolio/${portfolioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify deletion in database
      const deletedPortfolio = await Portfolio.findById(portfolioId);
      expect(deletedPortfolio).toBeNull();
    });

    it('should not delete non-existent portfolio item', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/portfolio/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should not delete other user\'s portfolio', async () => {
      // Create another user
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'hashedpassword',
        name: 'Other User'
      });

      const otherPortfolio = await Portfolio.create({
        userId: otherUser._id,
        ticker: 'GOOGL',
        shares: 5,
        entryPrice: 2800,
        currentPrice: 2850,
        action: 'BUY',
        portfolioType: 'solid',
        portfolioId: 'solid-1'
      });

      const response = await request(app)
        .delete(`/api/portfolio/${otherPortfolio._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not authorized');
    });
  });
});