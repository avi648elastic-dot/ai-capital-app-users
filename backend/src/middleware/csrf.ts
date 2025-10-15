import csrf from 'csurf';
import { Request, Response, NextFunction } from 'express';
import { loggerService } from '../services/loggerService';

// CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 3600000, // 1 hour
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  value: (req: Request) => {
    // Get CSRF token from header or body
    return req.headers['x-csrf-token'] as string || req.body._csrf;
  }
});

// CSRF error handler
export const csrfErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN') {
    loggerService.warn(`CSRF token validation failed for ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer')
    });
    
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      message: 'Please refresh the page and try again'
    });
  }
  next(err);
};

// Generate CSRF token endpoint
export const generateCsrfToken = (req: Request, res: Response) => {
  try {
    const token = req.csrfToken();
    loggerService.info(`CSRF token generated`);
    
    res.json({
      success: true,
      csrfToken: token
    });
  } catch (error: any) {
    loggerService.error('Failed to generate CSRF token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate CSRF token'
    });
  }
};

export default csrfProtection;
