import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

/**
 * 📊 Enhanced Logging Service with Pino
 */
class LoggerService {
  private logger: pino.Logger;
  private requestId: string | null = null;

  constructor() {
    // Configure Pino logger
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      } : undefined,
      formatters: {
        level: (label) => {
          return { level: label };
        }
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });

    console.log('✅ [LOGGER] Pino logger initialized');
  }

  /**
   * Generate request ID for tracking
   */
  generateRequestId(): string {
    this.requestId = uuidv4();
    return this.requestId;
  }

  /**
   * Get current request ID
   */
  getRequestId(): string | null {
    return this.requestId;
  }

  /**
   * Set request ID
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Enhanced log with request context
   */
  private logWithContext(level: string, message: string, data?: any): void {
    const logData = {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      ...data
    };

    switch (level) {
      case 'trace':
        this.logger.trace(logData, message);
        break;
      case 'debug':
        this.logger.debug(logData, message);
        break;
      case 'info':
        this.logger.info(logData, message);
        break;
      case 'warn':
        this.logger.warn(logData, message);
        break;
      case 'error':
        this.logger.error(logData, message);
        break;
      case 'fatal':
        this.logger.fatal(logData, message);
        break;
      default:
        this.logger.info(logData, message);
    }
  }

  /**
   * Log levels
   */
  trace(message: string, data?: any): void {
    this.logWithContext('trace', message, data);
  }

  debug(message: string, data?: any): void {
    this.logWithContext('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.logWithContext('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.logWithContext('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.logWithContext('error', message, data);
  }

  fatal(message: string, data?: any): void {
    this.logWithContext('fatal', message, data);
  }

  /**
   * API Request logging
   */
  logRequest(req: any, res: any, responseTime: number): void {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId: this.requestId,
    };

    if (res.statusCode >= 400) {
      this.warn('API Request', logData);
    } else {
      this.info('API Request', logData);
    }
  }

  /**
   * Database operation logging
   */
  logDatabase(operation: string, collection: string, duration?: number, error?: any): void {
    const logData = {
      operation,
      collection,
      duration: duration ? `${duration}ms` : undefined,
      error: error?.message,
      requestId: this.requestId,
    };

    if (error) {
      this.error(`Database ${operation}`, logData);
    } else {
      this.debug(`Database ${operation}`, logData);
    }
  }

  /**
   * Stock data operation logging
   */
  logStockData(operation: string, symbol: string, provider: string, duration?: number, error?: any): void {
    const logData = {
      operation,
      symbol,
      provider,
      duration: duration ? `${duration}ms` : undefined,
      error: error?.message,
      requestId: this.requestId,
    };

    if (error) {
      this.warn(`Stock Data ${operation}`, logData);
    } else {
      this.debug(`Stock Data ${operation}`, logData);
    }
  }

  /**
   * Security event logging
   */
  logSecurity(event: string, details: any): void {
    this.warn(`Security Event: ${event}`, {
      ...details,
      requestId: this.requestId,
      severity: 'HIGH'
    });
  }

  /**
   * Performance monitoring
   */
  logPerformance(operation: string, duration: number, details?: any): void {
    this.info(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...details,
      requestId: this.requestId,
    });
  }

  /**
   * Get logger instance for direct use
   */
  getLogger(): pino.Logger {
    return this.logger;
  }
}

// Export singleton instance
export const loggerService = new LoggerService();
export default loggerService;
