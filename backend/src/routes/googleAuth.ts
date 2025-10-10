import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth login/signup
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture || user.avatar;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        email,
        name: name || email.split('@')[0],
        googleId,
        avatar: picture,
        subscriptionTier: 'free',
        onboardingCompleted: false,
        isEmailVerified: true, // Google emails are pre-verified
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        isAdmin: user.isAdmin 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        subscriptionTier: user.subscriptionTier,
        onboardingCompleted: user.onboardingCompleted,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

export default router;
