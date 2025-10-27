import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * 🔍 Request Validation Middleware
 * Validates request body, query, and params using Zod schemas
 */
export const validate = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query) as any;
      }

      // Validate route parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params) as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const zodError = error as ZodError;
        const errors = zodError.errors || zodError.issues || [];
        console.warn('🔍 [VALIDATION] Request validation failed:', {
          url: req.url,
          method: req.method,
          errors: errors,
          timestamp: new Date().toISOString(),
        });

        return res.status(400).json({
          success: false,
          message: 'Request validation failed',
          errors: errors.map((err: any) => ({
            field: err.path ? err.path.join('.') : 'unknown',
            message: err.message || 'Validation error',
            code: err.code || 'validation_error',
          })),
        });
      }

      // If it's not a Zod error, pass it to the error handler
      next(error);
    }
  };
};

/**
 * 🔍 Partial validation for optional fields
 */
export const validatePartial = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body (partial)
      if (schema.body) {
        req.body = (schema.body as any).partial().parse(req.body);
      }

      // Validate query parameters (partial)
      if (schema.query) {
        req.query = (schema.query as any).partial().parse(req.query) as any;
      }

      // Validate route parameters (partial)
      if (schema.params) {
        req.params = (schema.params as any).partial().parse(req.params) as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const zodError = error as ZodError;
        const errors = zodError.errors || zodError.issues || [];
        console.warn('🔍 [VALIDATION] Partial validation failed:', {
          url: req.url,
          method: req.method,
          errors: errors,
          timestamp: new Date().toISOString(),
        });

        return res.status(400).json({
          success: false,
          message: 'Request validation failed',
          errors: errors.map((err: any) => ({
            field: err.path ? err.path.join('.') : 'unknown',
            message: err.message || 'Validation error',
            code: err.code || 'validation_error',
          })),
        });
      }

      next(error);
    }
  };
};
