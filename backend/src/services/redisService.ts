// Redis is completely disabled for deployment
// import { createClient, RedisClientType } from 'redis';
import { loggerService } from './loggerService';

/**
 * 🔄 Redis Service for Distributed Locks and Caching
 */
class RedisService {
  private client: any = null; // Disabled Redis
  private isConnected = false;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 3;

  constructor() {
    // Redis is disabled for deployment
    loggerService.info('Redis service initialized in disabled mode - no Redis connection will be attempted');
  }

  /**
   * Initialize Redis connection - DISABLED
   */
  private async initializeConnection(): Promise<void> {
    // Redis is completely disabled for deployment
    loggerService.info('Redis initialization skipped - Redis is disabled for deployment');
    this.isConnected = false;
    this.client = null;
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get Redis client (with fallback) - DISABLED
   */
  private getClient(): any {
    // Redis is disabled
    return null;
  }

  /**
   * 🔒 Distributed Lock Implementation (SET NX PX)
   */
  async acquireLock(key: string, ttl: number = 30000): Promise<boolean> {
    try {
      const client = this.getClient();
      if (!client) return false;

      const lockKey = `lock:${key}`;
      const lockValue = `${Date.now()}-${Math.random()}`;
      
      // SET key value NX PX milliseconds
      const result = await client.set(lockKey, lockValue, {
        NX: true,
        PX: ttl,
      });

      if (result === 'OK') {
        loggerService.debug('Distributed lock acquired', {
          key: lockKey,
          value: lockValue,
          ttl,
        });
        return true;
      } else {
        loggerService.debug('Distributed lock not acquired (already exists)', {
          key: lockKey,
        });
        return false;
      }
    } catch (error) {
      loggerService.error('Failed to acquire distributed lock', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * 🔓 Release Distributed Lock
   */
  async releaseLock(key: string): Promise<boolean> {
    try {
      const client = this.getClient();
      if (!client) return false;

      const lockKey = `lock:${key}`;
      const result = await client.del(lockKey);
      
      if (result === 1) {
        loggerService.debug('Distributed lock released', { key: lockKey });
        return true;
      } else {
        loggerService.debug('Distributed lock not found or already released', { key: lockKey });
        return false;
      }
    } catch (error) {
      loggerService.error('Failed to release distributed lock', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * 🔄 Execute function with distributed lock
   */
  async withLock<T>(
    key: string, 
    fn: () => Promise<T>, 
    ttl: number = 30000,
    retryDelay: number = 1000,
    maxRetries: number = 3
  ): Promise<T | null> {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      const lockAcquired = await this.acquireLock(key, ttl);
      
      if (lockAcquired) {
        try {
          loggerService.info('Executing function with distributed lock', {
            key,
            attempt: attempts + 1,
          });
          
          const result = await fn();
          return result;
        } finally {
          await this.releaseLock(key);
        }
      } else {
        attempts++;
        if (attempts < maxRetries) {
          loggerService.debug('Lock not acquired, retrying', {
            key,
            attempt: attempts,
            retryDelay,
          });
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          loggerService.warn('Max retry attempts reached for distributed lock', {
            key,
            maxRetries,
          });
        }
      }
    }
    
    return null;
  }

  /**
   * 📊 Set key-value with TTL
   */
  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      const client = this.getClient();
      if (!client) return false;

      if (ttl) {
        await client.setEx(key, Math.floor(ttl / 1000), value);
      } else {
        await client.set(key, value);
      }
      
      return true;
    } catch (error) {
      loggerService.error('Failed to set Redis key', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * 📊 Get value by key
   */
  async get(key: string): Promise<string | null> {
    try {
      const client = this.getClient();
      if (!client) return null;

      return await client.get(key);
    } catch (error) {
      loggerService.error('Failed to get Redis key', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * 🗑️ Delete key
   */
  async del(key: string): Promise<boolean> {
    try {
      const client = this.getClient();
      if (!client) return false;

      const result = await client.del(key);
      return result === 1;
    } catch (error) {
      loggerService.error('Failed to delete Redis key', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * 📊 Get Redis connection status
   */
  getStatus(): { connected: boolean; attempts: number } {
    return {
      connected: this.isConnected,
      attempts: this.connectionAttempts,
    };
  }

  /**
   * 🔄 Close Redis connection
   */
  async close(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        loggerService.info('Redis connection closed');
      }
    } catch (error) {
      loggerService.error('Error closing Redis connection', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Export singleton instance
export const redisService = new RedisService();
export default redisService;
