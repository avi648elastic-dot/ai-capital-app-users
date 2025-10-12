/**
 * 🔒 Cron Job Locking Service with Redis
 * 
 * Implements distributed locking for cron jobs to prevent duplicate execution
 * across multiple instances. Uses Redis for coordination.
 */

import { createClient, RedisClientType } from 'redis';
import { loggerService } from './loggerService';

interface LockOptions {
  ttl?: number; // Time to live in seconds
  retryDelay?: number; // Delay between retry attempts in ms
  maxRetries?: number; // Maximum number of retry attempts
}

interface LockResult {
  acquired: boolean;
  lockKey?: string;
  error?: string;
}

class CronLockService {
  private redis: RedisClientType | null = null;
  private connected = false;

  constructor() {
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis() {
    try {
      if (!process.env.REDIS_URL) {
        loggerService.warn('🔴 [CRON LOCK] Redis URL not configured - cron locking disabled');
        return;
      }

      this.redis = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              loggerService.error('🔴 [CRON LOCK] Redis connection failed after 10 retries');
              return new Error('Max retries reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.redis.on('error', (error) => {
        loggerService.error('🔴 [CRON LOCK] Redis error:', { error: error.message });
        this.connected = false;
      });

      this.redis.on('connect', () => {
        loggerService.info('🟢 [CRON LOCK] Redis connected successfully');
        this.connected = true;
      });

      this.redis.on('disconnect', () => {
        loggerService.warn('🟡 [CRON LOCK] Redis disconnected');
        this.connected = false;
      });

      await this.redis.connect();
    } catch (error) {
      loggerService.error('🔴 [CRON LOCK] Failed to initialize Redis:', { error });
      this.connected = false;
    }
  }

  /**
   * Acquire a distributed lock for a cron job
   */
  async acquireLock(
    jobName: string,
    options: LockOptions = {}
  ): Promise<LockResult> {
    const {
      ttl = 300, // 5 minutes default
      retryDelay = 1000, // 1 second default
      maxRetries = 3
    } = options;

    const lockKey = `cron:lock:${jobName}`;
    const lockValue = `${Date.now()}-${process.pid}-${Math.random()}`;

    // If Redis is not available, allow execution (fallback mode)
    if (!this.redis || !this.connected) {
      loggerService.warn(`🟡 [CRON LOCK] Redis unavailable - allowing ${jobName} to run without lock`);
      return { acquired: true, lockKey };
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Try to set the lock with NX (only if not exists) and EX (expiration)
        const result = await this.redis.set(lockKey, lockValue, {
          NX: true, // Only set if key doesn't exist
          EX: ttl // Set expiration time
        });

        if (result === 'OK') {
          loggerService.info(`🔒 [CRON LOCK] Lock acquired for ${jobName}`, {
            lockKey,
            attempt,
            ttl
          });
          return { acquired: true, lockKey };
        } else {
          loggerService.info(`⏳ [CRON LOCK] Lock already held for ${jobName}`, {
            lockKey,
            attempt,
            maxRetries
          });

          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      } catch (error) {
        loggerService.error(`🔴 [CRON LOCK] Error acquiring lock for ${jobName}`, {
          error: (error as Error).message,
          attempt
        });

        if (attempt === maxRetries) {
          return { acquired: false, error: (error as Error).message };
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    loggerService.warn(`⏰ [CRON LOCK] Failed to acquire lock for ${jobName} after ${maxRetries} attempts`);
    return { acquired: false, error: 'Max retries exceeded' };
  }

  /**
   * Release a distributed lock
   */
  async releaseLock(lockKey: string): Promise<boolean> {
    if (!this.redis || !this.connected) {
      loggerService.warn(`🟡 [CRON LOCK] Redis unavailable - cannot release lock ${lockKey}`);
      return true; // Return true in fallback mode
    }

    try {
      const result = await this.redis.del(lockKey);
      loggerService.info(`🔓 [CRON LOCK] Lock released: ${lockKey}`, { result });
      return result > 0;
    } catch (error) {
      loggerService.error(`🔴 [CRON LOCK] Error releasing lock ${lockKey}:`, { error });
      return false;
    }
  }

  /**
   * Check if a lock exists
   */
  async isLocked(jobName: string): Promise<boolean> {
    if (!this.redis || !this.connected) {
      return false; // No lock if Redis unavailable
    }

    try {
      const lockKey = `cron:lock:${jobName}`;
      const exists = await this.redis.exists(lockKey);
      return exists === 1;
    } catch (error) {
      loggerService.error(`🔴 [CRON LOCK] Error checking lock for ${jobName}:`, { error });
      return false;
    }
  }

  /**
   * Get lock information
   */
  async getLockInfo(jobName: string): Promise<{ exists: boolean; ttl: number; value?: string }> {
    if (!this.redis || !this.connected) {
      return { exists: false, ttl: 0 };
    }

    try {
      const lockKey = `cron:lock:${jobName}`;
      const exists = await this.redis.exists(lockKey);
      
      if (exists === 0) {
        return { exists: false, ttl: 0 };
      }

      const ttl = await this.redis.ttl(lockKey);
      const value = await this.redis.get(lockKey);

      return { exists: true, ttl, value };
    } catch (error) {
      loggerService.error(`🔴 [CRON LOCK] Error getting lock info for ${jobName}:`, { error });
      return { exists: false, ttl: 0 };
    }
  }

  /**
   * Force release all locks (emergency function)
   */
  async forceReleaseAllLocks(): Promise<number> {
    if (!this.redis || !this.connected) {
      loggerService.warn('🟡 [CRON LOCK] Redis unavailable - cannot force release locks');
      return 0;
    }

    try {
      const keys = await this.redis.keys('cron:lock:*');
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(keys);
      loggerService.warn(`🚨 [CRON LOCK] Force released ${result} locks`, { keys });
      return result;
    } catch (error) {
      loggerService.error('🔴 [CRON LOCK] Error force releasing locks:', { error });
      return 0;
    }
  }

  /**
   * Wrapper function to execute a job with automatic locking
   */
  async withLock<T>(
    jobName: string,
    jobFunction: () => Promise<T>,
    options: LockOptions = {}
  ): Promise<T | null> {
    const lockResult = await this.acquireLock(jobName, options);

    if (!lockResult.acquired) {
      loggerService.info(`⏭️ [CRON LOCK] Skipping ${jobName} - lock held by another instance`);
      return null;
    }

    try {
      loggerService.info(`🚀 [CRON LOCK] Executing ${jobName}`);
      const result = await jobFunction();
      loggerService.info(`✅ [CRON LOCK] Completed ${jobName}`);
      return result;
    } catch (error) {
      loggerService.error(`❌ [CRON LOCK] Error in ${jobName}:`, { error });
      throw error;
    } finally {
      if (lockResult.lockKey) {
        await this.releaseLock(lockResult.lockKey);
      }
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      if (!this.redis || !this.connected) {
        return {
          status: 'unhealthy',
          details: { error: 'Redis not connected' }
        };
      }

      // Test Redis connection
      await this.redis.ping();
      
      return {
        status: 'healthy',
        details: {
          connected: this.connected,
          redisUrl: process.env.REDIS_URL ? 'configured' : 'not configured'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown() {
    if (this.redis && this.connected) {
      try {
        await this.redis.quit();
        loggerService.info('🔴 [CRON LOCK] Redis connection closed');
      } catch (error) {
        loggerService.error('🔴 [CRON LOCK] Error closing Redis connection:', { error });
      }
    }
  }
}

// Export singleton instance
export const cronLockService = new CronLockService();
export default cronLockService;
