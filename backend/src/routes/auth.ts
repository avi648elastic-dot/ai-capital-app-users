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
  console.log("👉 Headers:", req.headers);
  console.log("👉 Body:", req.body);

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.warn("⚠️ Missing fields in signup:", { name, email, password });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn("⚠️ Email already in use:", email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      subscriptionActive: true,
      onboardingCompleted: false
    });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    console.log("✅ Signup successful for:", email);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user
    });
  } catch (error: any) {
    console.error("❌ Signup error:", error.message, error.stack);
    res.status(500).json({ message: 'Internal server error' });
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
      { id: user._id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    console.log("✅ Login successful for:", email);

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error: any) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * 📌 ME - שליפת נתוני משתמש לפי הטוקן
 */
router.get('/me', async (req: any, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (error: any) {
    console.error('❌ Auth check error:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

export default router;
