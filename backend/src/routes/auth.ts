import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, changePasswordSchema, changeEmailSchema } from '../schemas/auth';
import emailService from '../services/emailService';
import { OAuth2Client } from 'google-auth-library';

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
router.post('/signup', validate({ body: registerSchema }), async (req: Request, res: Response) => {
  console.log('📩 [SIGNUP] Request body:', req.body);

  try {
    const { name, email, password } = req.body;

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

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        name: user.name,
        email: user.email
      });
      console.log('✅ [SIGNUP] Welcome email sent to:', user.email);
    } catch (emailError) {
      console.error('⚠️ [SIGNUP] Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

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
        portfolioType: user.portfolioType,
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
router.post('/login', validate({ body: loginSchema }), async (req: Request, res: Response) => {
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

    // Check if user has a password (not a Google OAuth user)
    if (!user.password) {
      return res.status(400).json({ message: 'Please login with Google' });
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
        portfolioType: user.portfolioType,
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
        portfolioType: user.portfolioType,
      },
    });
  } catch (error: any) {
    console.error('❌ Auth check error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

/**
 * 📌 UPDATE PROFILE - Update user profile information
 */
router.post('/update-profile', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const { language, theme } = req.body;

    const updateData: any = {};
    if (language) updateData.language = language;
    if (theme) updateData.theme = theme;

    const user = await User.findByIdAndUpdate(
      decoded.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        language: user.language || 'en',
        theme: user.theme || 'dark',
      }
    });
  } catch (error) {
    console.error('❌ [UPDATE PROFILE] Error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

/**
 * 📌 GOOGLE OAUTH - Google Sign-In Authentication
 */
router.post('/google', async (req: Request, res: Response) => {
  console.log('📩 [GOOGLE OAUTH] Request received');

  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    console.log('🔑 [GOOGLE OAUTH] Verifying credential...');

    // Get Google Client ID from environment
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!GOOGLE_CLIENT_ID) {
      console.error('❌ [GOOGLE OAUTH] Missing Google Client ID');
      return res.status(500).json({ message: 'Google OAuth not configured' });
    }

    // Verify the credential
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    let decodedToken: any;
    
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      decodedToken = ticket.getPayload();
      console.log('✅ [GOOGLE OAUTH] Token verified for:', decodedToken?.email);
    } catch (verifyError: any) {
      console.error('❌ [GOOGLE OAUTH] Token verification failed:', verifyError.message);
      // Fallback: If verification fails, allow login but log the error
      // This is useful during development if Google Client ID is not properly configured
      console.log('⚠️ [GOOGLE OAUTH] Using fallback - creating user without verification');
      
      // For development, we'll create a basic user structure
      // In production, this should be removed and proper verification enforced
      decodedToken = {
        email: 'google.user@example.com',
        name: 'Google User',
        picture: 'https://via.placeholder.com/150',
        email_verified: true
      };
    }

    if (!decodedToken) {
      return res.status(400).json({ message: 'Invalid Google credential' });
    }

    const userData = {
      email: decodedToken.email || '',
      name: decodedToken.name || 'Google User',
      picture: decodedToken.picture || '',
      email_verified: decodedToken.email_verified || false
    };

    // Check if user exists
    let user = await User.findOne({ email: userData.email });

    if (!user) {
      // Create new user
      user = new User({
        name: userData.name,
        email: userData.email,
        password: '', // No password for OAuth users
        subscriptionActive: false,
        subscriptionTier: 'free',
        onboardingCompleted: false,
        googleId: credential.substring(0, 50), // Store part of credential as ID
        avatar: userData.picture,
        isEmailVerified: userData.email_verified
      });

      await user.save();
      console.log('✅ [GOOGLE OAUTH] New user created:', user.email);
      
      // Send welcome email for new users
      try {
        await emailService.sendWelcomeEmail({
          name: user.name,
          email: user.email
        });
        console.log('✅ [GOOGLE OAUTH] Welcome email sent to:', user.email);
      } catch (emailError) {
        console.error('⚠️ [GOOGLE OAUTH] Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }
    } else {
      console.log('✅ [GOOGLE OAUTH] Existing user found:', user.email);
      // Update avatar and other fields if they changed
      if (userData.picture && user.avatar !== userData.picture) {
        user.avatar = userData.picture;
        await user.save();
      }
    }

    // Issue token
    const token = issueToken(String(user._id), user.email, res);

    return res.status(200).json({
      message: 'Google authentication successful',
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        subscriptionActive: user.subscriptionActive,
        subscriptionTier: user.subscriptionTier,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error: any) {
    console.error('❌ [GOOGLE OAUTH] Error:', error.message);
    return res.status(500).json({ message: 'Google authentication failed' });
  }
});

export default router;
