import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';
import User from '../models/User';
import { validate, validatePartial } from '../middleware/validate';
import { updateProfileSchema, userSettingsSchema, userQuerySchema } from '../schemas/user';
import pushNotificationService from '../services/pushNotificationService';

const router = express.Router();

// Base64 avatar approach - no file serving needed!

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    console.log('📁 [USER] Upload directory:', uploadDir);
    
    if (!fs.existsSync(uploadDir)) {
      console.log('📁 [USER] Creating upload directory:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Check if directory exists after creation
    if (fs.existsSync(uploadDir)) {
      console.log('✅ [USER] Upload directory exists:', uploadDir);
    } else {
      console.log('❌ [USER] Upload directory creation failed:', uploadDir);
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user._id;
    const ext = path.extname(file.originalname);
    const filename = `avatar_${userId}${ext}`;
    console.log('📝 [USER] Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter for image types
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024, // 1MB limit
  },
  fileFilter: fileFilter
});

// Upload avatar endpoint - BASE64 APPROACH
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    console.log('🔍 [USER] Avatar upload request received');
    console.log('🔍 [USER] User from auth:', (req as any).user);
    console.log('🔍 [USER] File received:', req.file);
    
    const userId = (req as any).user._id;
    
    if (!req.file) {
      console.log('❌ [USER] No file uploaded');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log('📁 [USER] File details:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64String = fileBuffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64String}`;
    
    console.log('🔄 [USER] Converted file to base64, length:', base64String.length);
    
    // Delete the temporary file since we're storing as base64
    fs.unlinkSync(req.file.path);
    console.log('🗑️ [USER] Deleted temporary file:', req.file.path);

    // Save base64 avatar to user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: dataUrl },
      { new: true, select: '-password' }
    );

    console.log(`✅ [USER] Avatar updated for user ${userId} (base64 stored)`);
    console.log('👤 [USER] Updated user avatar length:', updatedUser?.avatar?.length || 0);

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      user: updatedUser,
      avatar: dataUrl
    });

  } catch (error: any) {
    console.error('❌ [USER] Avatar upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 1MB.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar'
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    console.log('🔍 [USER] Profile fetch request for user:', userId);
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.log('❌ [USER] User not found:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('👤 [USER] Profile data:', {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar
    });

    res.json({
      success: true,
      user
    });

  } catch (error: any) {
    console.error('❌ [USER] Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, validate({ body: updateProfileSchema }), async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const { name, email } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    
    // If email is being changed, check if it's already in use
    if (email) {
      const currentUser = await User.findById(userId);
      
      // Only check for duplicates if email is actually changing
      if (currentUser && email !== currentUser.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: 'This email is already in use by another account'
          });
        }
        updateData.email = email;
        console.log(`📧 [USER] Email changed from ${currentUser.email} to ${email} for user ${userId}`);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    console.log(`✅ [USER] Profile updated for user ${userId}`);

    res.json({
      success: true,
      message: 'Profile updated successfully. Please use your new email to log in next time.',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('❌ [USER] Profile update error:', error);
    
    // Handle duplicate email error from MongoDB
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'This email is already in use by another account'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Update user settings (theme, language, etc.)
router.put('/settings', authenticateToken, validate({ body: userSettingsSchema }), async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const { theme, language, notifications, emailUpdates } = req.body;

    console.log(`🔧 [USER] Updating settings for user ${userId}:`, { theme, language, notifications, emailUpdates });

    const updateData: any = {};
    if (theme !== undefined) updateData.theme = theme;
    if (language !== undefined) updateData.language = language;
    // Store notification preferences (we'll add these fields to User schema if needed)
    if (notifications !== undefined) updateData.notifications = notifications;
    if (emailUpdates !== undefined) updateData.emailUpdates = emailUpdates;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`✅ [USER] Settings updated successfully for user ${userId}`);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('❌ [USER] Settings update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

// 📱 Push Notification Routes
router.post('/push/subscribe', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { subscription, userAgent } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription data'
      });
    }

    const success = await pushNotificationService.registerSubscription(
      userId,
      subscription,
      userAgent
    );

    res.json({
      success,
      message: success ? 'Push subscription registered' : 'Failed to register push subscription'
    });

  } catch (error: any) {
    console.error('❌ [PUSH] Subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register push subscription'
    });
  }
});

router.delete('/push/unsubscribe', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Endpoint required'
      });
    }

    const success = await pushNotificationService.removeSubscription(userId, endpoint);

    res.json({
      success,
      message: success ? 'Push subscription removed' : 'Subscription not found'
    });

  } catch (error: any) {
    console.error('❌ [PUSH] Unsubscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove push subscription'
    });
  }
});

router.get('/push/subscriptions', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const subscriptions = pushNotificationService.getUserSubscriptions(userId);

    res.json({
      success: true,
      subscriptions: subscriptions.map(sub => ({
        endpoint: sub.endpoint.substring(0, 50) + '...',
        createdAt: sub.createdAt,
        userAgent: sub.userAgent
      }))
    });

  } catch (error: any) {
    console.error('❌ [PUSH] Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get push subscriptions'
    });
  }
});

router.get('/push/vapid-key', (req, res) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY || '';

    if (!publicKey) {
      return res.status(500).json({
        success: false,
        error: 'VAPID keys not configured'
      });
    }

    res.json({
      success: true,
      publicKey
    });

  } catch (error: any) {
    console.error('❌ [PUSH] VAPID key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get VAPID key'
    });
  }
});

export default router;
