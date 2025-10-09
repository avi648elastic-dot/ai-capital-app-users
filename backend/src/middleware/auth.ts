import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireSubscription = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Allow access for all authenticated users (both free and premium)
  // Premium features will be checked at the individual route level
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
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