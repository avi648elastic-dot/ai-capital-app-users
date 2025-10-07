import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';

const router = Router();

/**
 * 🛠 פונקציית עזר – הפקת JWT וכתיבה גם כ־cookie
 */
const issueToken = (userId: string, email: string, res: Response) => {
  const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });

  // שולח גם כ-cookie כדי לעבוד בפרודקשן (Vercel + Render)
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000, // שבוע
  });

  return token;
};

/**
 * 📌 SIGNUP - רישום משתמש חדש
 */
router.post('/signup', async (req: Request, res: Response) => {
  console.log('📩 [SIGNUP] Request body:', req.body);

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ [SIGNUP] MongoDB not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({ message: 'Database temporarily unavailable. Please try again.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      subscriptionActive: false, // Free users start with inactive subscription
      subscriptionTier: 'free',  // Explicitly set to free
      onboardingCompleted: false,
    });

    await user.save();
    console.log('✅ [SIGNUP] User created successfully:', user.email);

    const token = issueToken(String(user._id), user.email, res);

    return res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        subscriptionActive: user.subscriptionActive,
        subscriptionTier: user.subscriptionTier,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    console.error('❌ Signup error:', error.message);
    console.error('❌ Signup error details:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * 📌 LOGIN - כניסה למערכת
 */
router.post('/login', async (req: Request, res: Response) => {
  console.log('📩 [LOGIN] Request body:', req.body);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = issueToken(String(user._id), user.email, res);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        subscriptionActive: user.subscriptionActive,
        subscriptionTier: user.subscriptionTier,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    console.error('❌ Login error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * 📌 ME - שליפת נתוני משתמש לפי הטוקן
 */
router.get('/me', async (req: any, res: Response) => {
  console.log('📩 [ME] Token validation attempt');

  try {
    let token: string | undefined;

    // קודם נבדוק אם קיים בכותרת Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // אם לא – נבדוק אם יש cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      console.warn('⚠️ No token provided');
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.warn('⚠️ User not found for token ID:', decoded.id);
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        subscriptionActive: user.subscriptionActive,
        subscriptionTier: user.subscriptionTier,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    console.error('❌ Auth check error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

export default router;
