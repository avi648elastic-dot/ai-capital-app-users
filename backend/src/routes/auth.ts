import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();

// 📌 Signup
router.post('/signup', async (req, res) => {
  console.log("📩 [SIGNUP] Incoming request");
  console.log("👉 Headers:", req.headers);
  console.log("👉 Body:", req.body);

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.warn("⚠️ Missing fields in signup:", { name, email, password });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // בדוק אם המשתמש כבר קיים
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn("⚠️ Email already in use:", email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // הצפן סיסמה
    const hashedPassword = await bcrypt.hash(password, 10);

    // צור משתמש חדש
    const user = new User({
      name,
      email,
      password: hashedPassword,
      subscriptionActive: true,
      onboardingCompleted: false
    });
    await user.save();

    // צור טוקן
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

export default router;
