import request from 'supertest';
import app from '../../src/index';
import User from '../../src/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Auth API', () => {
  beforeEach(async () => {
    // Clean up test database
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should not register user with existing email', async () => {
      // Create existing user
      await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Existing User'
      });

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'New User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'test@example.com'
        // Missing password and name
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('valid email');
    });

    it('should validate password strength', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // Too short
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('password');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User'
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should not login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should not login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create test user and get token
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User'
      });

      userId = user._id.toString();
      authToken = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should not get profile with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId, email: 'test@example.com' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired token
      );

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });
  });

  describe('POST /api/auth/google', () => {
    it('should handle Google OAuth successfully', async () => {
      const googleData = {
        token: 'valid-google-token',
        email: 'google@example.com',
        name: 'Google User',
        picture: 'https://example.com/avatar.jpg'
      };

      // Mock Google token verification
      jest.mock('google-auth-library', () => ({
        OAuth2Client: jest.fn().mockImplementation(() => ({
          verifyIdToken: jest.fn().mockResolvedValue({
            getPayload: () => ({
              email: googleData.email,
              name: googleData.name,
              picture: googleData.picture,
              sub: 'google-user-id'
            })
          })
        }))
      }));

      const response = await request(app)
        .post('/api/auth/google')
        .send(googleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(googleData.email);
    });

    it('should handle invalid Google token', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid Google token');
    });
  });
});