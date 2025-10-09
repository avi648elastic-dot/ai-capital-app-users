import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user._id;
    const ext = path.extname(file.originalname);
    const filename = `avatar_${userId}${ext}`;
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

// Upload avatar endpoint
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const userId = (req as any).user._id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Delete old avatar if exists
    const user = await User.findById(userId);
    if (user && user.avatarUrl) {
      const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(user.avatarUrl));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Save new avatar URL to user
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatarUrl },
      { new: true, select: '-password' }
    );

    console.log(`✅ [USER] Avatar updated for user ${userId}`);

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      user: updatedUser,
      avatarUrl
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
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

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
router.put('/profile', authenticateToken, async (req, res) => {
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

export default router;
