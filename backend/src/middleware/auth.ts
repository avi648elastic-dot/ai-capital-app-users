import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔍 [AUTH] Authenticating token for:', req.url);
  console.log('🔍 [AUTH] Auth header present:', !!authHeader);
  console.log('🔍 [AUTH] Token present:', !!token);

  // Handle authentication normally - no bypasses

  if (!token) {
    console.log('❌ [AUTH] No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    console.log('🔍 [AUTH] Token decoded successfully for user:', decoded.id);
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('❌ [AUTH] User not found for ID:', decoded.id);
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('✅ [AUTH] User authenticated successfully:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.log('❌ [AUTH] Token verification failed:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireSubscription = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 🆓 FREE APP MODE: Bypass all subscription checks - app is free for Google Play approval
  // TO RE-ENABLE RESTRICTIONS AFTER GOOGLE APPROVAL: Comment out the next() below and uncomment the old logic
  console.log('✅ [SUBSCRIPTION] FREE MODE - All features unlocked');
  console.log('✅ [SUBSCRIPTION] Request method:', req.method);
  console.log('✅ [SUBSCRIPTION] Request URL:', req.url);
  
  // Only check authentication, not subscription tier
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  next();
  
  // UNCOMMENT THIS CODE BLOCK TO RE-ENABLE SUBSCRIPTION RESTRICTIONS:
  /*
  // TEMPORARY FIX: Bypass subscription check for ALL delete and post operations
  if (req.method === 'DELETE' || req.method === 'POST') {
    console.log('🔧 [SUBSCRIPTION] TEMPORARY BYPASS for operation');
    console.log('🔧 [SUBSCRIPTION] Request URL:', req.url);
    return next();
  }
  
  // Allow access for all authenticated users (both free and premium)
  // Premium features will be checked at the individual route level
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
  */
};

export const authenticateAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if user is admin (allow multiple admin emails or users with admin role)
    const adminEmails = ['avi648elastic@gmail.com', 'admin@aicapital.com'];
    const isAdminEmail = adminEmails.includes(user.email);
    const isAdminRole = user.email === 'admin' || user.name === 'admin';
    
    if (!isAdminEmail && !isAdminRole) {
      console.log(`❌ [AUTH] Admin access denied for user: ${user.email} (${user.name})`);
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    console.log(`✅ [AUTH] Admin access granted for user: ${user.email} (${user.name})`);

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};