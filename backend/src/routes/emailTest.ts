import { Router, Request, Response } from 'express';
import emailService from '../services/emailService';
import { authenticateToken } from '../middleware/auth';
import User from '../models/User';

const router = Router();

/**
 * Get email service status (Admin only)
 */
router.get('/status', authenticateToken, async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }
    
    const status = emailService.getStatus();
    
    return res.json({
      success: true,
      status
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get email service status',
      error: error.message
    });
  }
});

/**
 * Send test welcome email
 */
router.post('/send-welcome', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email and name are required'
      });
    }
    
    // Basic email validation
    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }
    
    const success = await emailService.sendWelcomeEmail({ email, name });
    
    if (success) {
      return res.json({
        success: true,
        message: 'Welcome email sent successfully',
        to: email
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send welcome email'
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error sending welcome email',
      error: error.message
    });
  }
});

/**
 * Send test notification email
 */
router.post('/send-notification', async (req: Request, res: Response) => {
  try {
    const { email, title, message, type } = req.body;
    
    if (!email || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Email, title, and message are required'
      });
    }
    
    // Validate type
    const validTypes = ['info', 'warning', 'success', 'error', 'action'];
    const notificationType = validTypes.includes(type) ? type : 'info';
    
    const success = await emailService.sendNotificationEmail(email, {
      title,
      message,
      type: notificationType,
      actionData: req.body.actionData
    });
    
    if (success) {
      return res.json({
        success: true,
        message: 'Notification email sent successfully',
        to: email
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send notification email'
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error sending notification email',
      error: error.message
    });
  }
});

/**
 * Send test password reset email
 */
router.post('/send-password-reset', async (req: Request, res: Response) => {
  try {
    const { email, userName } = req.body;
    
    if (!email || !userName) {
      return res.status(400).json({
        success: false,
        message: 'Email and userName are required'
      });
    }
    
    // Generate a dummy reset token for testing
    const resetToken = 'test-reset-token-' + Date.now();
    
    const success = await emailService.sendPasswordResetEmail(email, resetToken, userName);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Password reset email sent successfully',
        to: email,
        note: 'This is a test email with a dummy reset token'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error sending password reset email',
      error: error.message
    });
  }
});

/**
 * Send test verification email
 */
router.post('/send-verification', async (req: Request, res: Response) => {
  try {
    const { email, userName } = req.body;
    
    if (!email || !userName) {
      return res.status(400).json({
        success: false,
        message: 'Email and userName are required'
      });
    }
    
    // Generate a dummy verification token for testing
    const verificationToken = 'test-verify-token-' + Date.now();
    
    const success = await emailService.sendVerificationEmail(email, verificationToken, userName);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Verification email sent successfully',
        to: email,
        note: 'This is a test email with a dummy verification token'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error sending verification email',
      error: error.message
    });
  }
});

export default router;

