import { Request, Response, NextFunction } from 'express';
import { loggerService } from '../services/loggerService';

/**
 * 🔍 Request ID Middleware
 * Generates unique request ID for tracking requests across the application
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate or use existing request ID
  const requestId = req.headers['x-request-id'] as string || loggerService.generateRequestId();
  
  // Set request ID in logger service
  loggerService.setRequestId(requestId);
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Add request ID to request object for easy access
  (req as any).requestId = requestId;
  
  // Log the request start
  loggerService.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  
  next();
};
