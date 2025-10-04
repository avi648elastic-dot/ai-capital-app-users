import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();

/**
 * ✅ פונקציה עזר ליצירת JWT
 */
const generateToken = (userId: string, email: string) => {
  return jwt.sign({ id: userId, email }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });
};

/**
 * 📌 SIGNUP - רישום משתמש חדש
 */
router.post('/signup', async (req: Request, res: Response) => {
  console.log('📩 [SIGNUP] Incoming request:', req.body);

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.warn('⚠️ Missing signup fields:', { name, email, password });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn('⚠️ Email already registered:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      subscriptionActive: true,
      onboardingCompleted: false, // 🧠 חשוב – ברירת מחדל
    });

    await user.save();

    const token = generateToken(user._id.toString(), user.email);

    console.log('✅ Signup success:', user.email);

    return res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionActive: user.subscriptionActive,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error: any) {
    console.error('❌ Signup error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * 📌 LOGIN - התחברות משתמש
 */
router.post('/login', async (req: Request, res: Response) => {
  console.log('📩 [LOGIN] Incoming request:', req.body);

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.warn('⚠️ Missing login fields');
      return res.status(400).json({ message: 'Missing email or password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.warn('⚠️ User not found:', email);
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn('⚠️ Invalid password for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id.toString(), user.email);

    console.log('✅ Login success:', user.email);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionActive: user.subscriptionActive,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error: any) {
    console.error('❌ Login error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * 📌 ME - אימות טוקן ושליפת פרטי משתמש
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionActive: user.subscriptionActive,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error: any) {
    console.error('❌ Auth check error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

export default router;
