import request from 'supertest';
import { app } from '../../src/index';
import mongoose from 'mongoose';
import User from '../../src/models/User';
import Portfolio from '../../src/models/Portfolio';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Portfolio API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aicapital-test');
  });

  afterAll(async () => {
    await Portfolio.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Portfolio.deleteMany({});
    await User.deleteMany({});

    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123', 10);
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      subscriptionTier: 'premium'
    });

    userId = user._id.toString();
    token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'test-secret');
  });

  describe('GET /api/portfolio', () => {
    it('should get empty portfolio for new user', async () => {
      const response = await request(app)
        .get('/api/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should get portfolio items for user', async () => {
      // Create test portfolio items
      await Portfolio.create([
        {
          userId,
          ticker: 'AAPL',
          shares: 10,
          entryPrice: 150,
          currentPrice: 155,
          portfolioType: 'solid',
          portfolioId: 'solid-1',
          action: 'HOLD'
        },
        {
          userId,
          ticker: 'MSFT',
          shares: 5,
          entryPrice: 300,
          currentPrice: 310,
          portfolioType: 'risky',
          portfolioId: 'risky-1',
          action: 'BUY'
        }
      ]);

      const response = await request(app)
        .get('/api/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].ticker).toBe('AAPL');
      expect(response.body[1].ticker).toBe('MSFT');
    });

    it('should not get portfolio without authentication', async () => {
      await request(app)
        .get('/api/portfolio')
        .expect(401);
    });
  });

  describe('POST /api/portfolio', () => {
    it('should add new stock to portfolio', async () => {
      const stockData = {
        ticker: 'AAPL',
        shares: 10,
        entryPrice: 150,
        currentPrice: 155,
        portfolioType: 'solid',
        portfolioId: 'solid-1'
      };

      const response = await request(app)
        .post('/api/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .send(stockData)
        .expect(201);

      expect(response.body.ticker).toBe('AAPL');
      expect(response.body.shares).toBe(10);
      expect(response.body.portfolioType).toBe('solid');
    });

    it('should not add stock with invalid data', async () => {
      const invalidData = {
        ticker: '', // Invalid empty ticker
        shares: -5, // Invalid negative shares
        entryPrice: 150,
        currentPrice: 155,
        portfolioType: 'solid',
        portfolioId: 'solid-1'
      };

      const response = await request(app)
        .post('/api/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toContain('validation');
    });

    it('should enforce portfolio limits for free users', async () => {
      // Update user to free tier
      await User.findByIdAndUpdate(userId, { subscriptionTier: 'free' });

      // Create 10 stocks (free limit)
      for (let i = 0; i < 10; i++) {
        await Portfolio.create({
          userId,
          ticker: `STOCK${i}`,
          shares: 10,
          entryPrice: 100,
          currentPrice: 105,
          portfolioType: 'solid',
          portfolioId: 'solid-1',
          action: 'HOLD'
        });
      }

      // Try to add 11th stock
      const stockData = {
        ticker: 'LIMIT_TEST',
        shares: 10,
        entryPrice: 100,
        currentPrice: 105,
        portfolioType: 'solid',
        portfolioId: 'solid-1'
      };

      const response = await request(app)
        .post('/api/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .send(stockData)
        .expect(400);

      expect(response.body.message).toContain('Free users are limited to 10 stocks');
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
        portfolioType: 'solid',
        portfolioId: 'solid-1',
        action: 'HOLD'
      });
      portfolioId = portfolio._id.toString();
    });

    it('should update portfolio item', async () => {
      const updateData = {
        shares: 15,
        entryPrice: 160
      };

      const response = await request(app)
        .put(`/api/portfolio/${portfolioId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.shares).toBe(15);
      expect(response.body.entryPrice).toBe(160);
    });

    it('should not update non-existent portfolio item', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      await request(app)
        .put(`/api/portfolio/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ shares: 15 })
        .expect(404);
    });

    it('should not update other user\'s portfolio', async () => {
      // Create another user and portfolio
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: await bcrypt.hash('TestPassword123', 10)
      });

      const otherPortfolio = await Portfolio.create({
        userId: otherUser._id,
        ticker: 'MSFT',
        shares: 5,
        entryPrice: 300,
        currentPrice: 310,
        portfolioType: 'solid',
        portfolioId: 'solid-1',
        action: 'HOLD'
      });

      await request(app)
        .put(`/api/portfolio/${otherPortfolio._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ shares: 15 })
        .expect(403);
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
        portfolioType: 'solid',
        portfolioId: 'solid-1',
        action: 'HOLD'
      });
      portfolioId = portfolio._id.toString();
    });

    it('should delete portfolio item', async () => {
      await request(app)
        .delete(`/api/portfolio/${portfolioId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify it's deleted
      const portfolio = await Portfolio.findById(portfolioId);
      expect(portfolio).toBeNull();
    });

    it('should not delete non-existent portfolio item', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      await request(app)
        .delete(`/api/portfolio/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
