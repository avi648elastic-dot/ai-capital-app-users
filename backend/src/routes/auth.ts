import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();

/**
 * 📌 SIGNUP - רישום משתמש חדש
 */
router.post('/signup', async (req: Request, res: Response) => {
  console.log("📩 [SIGNUP] Incoming request");
  console.log("👉 Body:", req.body);

  try {
    const { name, email, password } = req.body;

    // בדיקה שחסרים נתונים
    if (!name || !email || !password) {
      console.warn("⚠️ Missing fields:", { name, email, password });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // בדיקה אם המשתמש כבר קיים
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn("⚠️ User already exists:", email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // הצפנת הסיסמה
    const hashedPassword = await bcrypt.hash(password, 10);

    // יצירת משתמש חדש
    const user = new User({
      name,
      email,
      password: hashedPassword,
      subscriptionActive: true,
      onboardingCompleted: false, // חשוב מאוד – שלא יידלג על התהליך
    });

    await user.save();

    // יצירת טוקן JWT
    const token = jwt.sign(
      { id: String(user._id), email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    console.log(`✅ Signup successful for ${email}`);

    // החזרת תגובה ללקוח
    return res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        subscriptionActive: user.subscriptionActive,
      },
    });
  } catch (error: any) {
    console.error("❌ Signup error:", error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * 📌 LOGIN - כניסה למערכת
 */
router.post('/login', async (req: Request, res: Response) => {
  console.log("📩 [LOGIN] Incoming request");
  console.log("👉 Body:", req.body);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.warn("⚠️ Missing credentials");
      return res.status(400).json({ message: 'Missing email or password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.warn("⚠️ User not found:", email);
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn("⚠️ Invalid password for:", email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: String(user._id), email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    console.log(`✅ Login successful for ${email}`);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        subscriptionActive: user.subscriptionActive,
      },
    });
  } catch (error: any) {
    console.error("❌ Login error:", error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * 📌 ME - שליפת נתוני משתמש לפי הטוקן
 */
router.get('/me', async (req: any, res: Response) => {
  console.log("📩 [ME] Checking token and returning user info");

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.warn("⚠️ No token provided");
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.warn("⚠️ User not found by ID:", decoded.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`✅ User fetched: ${user.email}`);

    return res.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        subscriptionActive: user.subscriptionActive,
      },
    });
  } catch (error: any) {
    console.error('❌ Auth check error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

export default router;
