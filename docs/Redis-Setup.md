# 🔴 Redis Setup Guide for AI Capital

**Last Updated:** October 15, 2025  
**Version:** 2.0

---

## 📋 Overview

Redis is used in AI Capital for caching, distributed locks, and session management. The application is designed to work with or without Redis, providing graceful degradation when Redis is unavailable.

---

## 🚀 Quick Setup (Render)

### Option 1: Render Redis (Recommended)
1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Sign in to your account

2. **Create Redis Instance**
   - Click "New +" → "Redis"
   - Choose "Free" plan (30MB storage)
   - Name: `ai-capital-redis`
   - Region: Choose closest to your backend
   - Click "Create Redis"

3. **Get Connection Details**
   - Copy the "Internal Database URL"
   - Format: `redis://red-xxxxx:6379`

4. **Add to Environment Variables**
   - Go to your backend service settings
   - Add environment variable:
     - Key: `REDIS_URL`
     - Value: `redis://red-xxxxx:6379`

5. **Redeploy Backend**
   - Trigger a new deployment
   - Check logs for: `✅ Redis connected successfully`

---

### Option 2: External Redis (Upstash)
1. **Create Upstash Account**
   - Visit [upstash.com](https://upstash.com)
   - Sign up for free account

2. **Create Redis Database**
   - Click "Create Database"
   - Name: `ai-capital`
   - Region: Choose closest to your backend
   - Click "Create"

3. **Get Connection Details**
   - Copy the "REST URL" or "Redis URL"
   - Format: `redis://default:password@host:port`

4. **Add to Environment Variables**
   - Add to your backend service:
     - Key: `REDIS_URL`
     - Value: Your Upstash Redis URL

---

## 🔧 Local Development Setup

### 1. Install Redis Locally

#### Windows (WSL2)
```bash
# Install Redis in WSL2
sudo apt update
sudo apt install redis-server

# Start Redis
sudo service redis-server start

# Test connection
redis-cli ping
# Should return: PONG
```

#### macOS (Homebrew)
```bash
# Install Redis
brew install redis

# Start Redis
brew services start redis

# Test connection
redis-cli ping
# Should return: PONG
```

#### Docker (All Platforms)
```bash
# Run Redis in Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Test connection
docker exec -it redis redis-cli ping
# Should return: PONG
```

### 2. Environment Variables
```bash
# .env.local
REDIS_URL=redis://localhost:6379
```

---

## 🧪 Testing Redis Connection

### 1. Backend Health Check
```bash
# Check if Redis is connected
curl https://ai-capital-app7.onrender.com/api/health

# Response should include:
{
  "status": "OK",
  "redis": {
    "status": "connected",
    "responseTime": 5
  }
}
```

### 2. Debug Endpoint
```bash
# Check Redis status (admin only)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://ai-capital-app7.onrender.com/api/debug/redis
```

### 3. Manual Testing
```bash
# Connect to Redis CLI
redis-cli

# Test basic operations
SET test "Hello Redis"
GET test
# Should return: "Hello Redis"

# Test expiration
SET key "value" EX 10
TTL key
# Should return: 10

# Exit
EXIT
```

---

## 📊 Redis Usage in AI Capital

### 1. **Caching**
```typescript
// Stock data caching (20 seconds TTL)
await redis.set(`stock:${ticker}`, JSON.stringify(data), 20);

// Portfolio caching (5 minutes TTL)
await redis.set(`portfolio:${userId}`, JSON.stringify(portfolio), 300);
```

### 2. **Distributed Locks**
```typescript
// Prevent duplicate operations
const lockKey = `lock:portfolio:${userId}`;
const acquired = await redis.set(lockKey, 'locked', 'PX', 30000, 'NX');

if (acquired) {
  try {
    // Perform operation
  } finally {
    await redis.del(lockKey);
  }
}
```

### 3. **Session Management**
```typescript
// Store user sessions
await redis.set(`session:${sessionId}`, JSON.stringify(userData), 3600);

// Rate limiting
const key = `rate_limit:${ip}`;
const current = await redis.incr(key);
if (current === 1) {
  await redis.expire(key, 60);
}
```

---

## 🔍 Monitoring & Debugging

### 1. **Redis Commands**
```bash
# Monitor all commands in real-time
redis-cli MONITOR

# Get Redis info
redis-cli INFO

# Check memory usage
redis-cli INFO memory

# List all keys
redis-cli KEYS "*"

# Check specific key
redis-cli GET "stock:AAPL"
```

### 2. **Application Logs**
```bash
# Check backend logs for Redis status
# Look for these messages:
✅ Redis connected successfully
❌ Redis connection failed
⚠️ Redis operation failed, using fallback
```

### 3. **Performance Metrics**
```bash
# Check Redis performance
redis-cli INFO stats

# Key metrics to monitor:
# - connected_clients
# - used_memory
# - keyspace_hits
# - keyspace_misses
# - instantaneous_ops_per_sec
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. **Connection Refused**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:**
- Ensure Redis is running: `redis-cli ping`
- Check Redis URL in environment variables
- Verify firewall settings

#### 2. **Authentication Failed**
```
Error: NOAUTH Authentication required
```
**Solution:**
- Check if Redis requires password
- Update REDIS_URL to include password: `redis://:password@host:port`

#### 3. **Memory Limit Exceeded**
```
Error: OOM command not allowed when used memory > 'maxmemory'
```
**Solution:**
- Increase Redis memory limit
- Implement key expiration
- Use Redis eviction policies

#### 4. **Timeout Errors**
```
Error: Redis connection timeout
```
**Solution:**
- Check network connectivity
- Increase timeout settings
- Verify Redis server is responsive

---

## ⚡ Performance Optimization

### 1. **Connection Pooling**
```typescript
// Configure Redis connection pool
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxLoadingTimeout: 1000,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  db: 0
});
```

### 2. **Memory Optimization**
```typescript
// Use appropriate data types
// Instead of storing large objects as strings
await redis.hset(`user:${id}`, {
  name: 'John',
  email: 'john@example.com'
});

// Use expiration for temporary data
await redis.setex(`temp:${id}`, 300, 'data');
```

### 3. **Batch Operations**
```typescript
// Use pipeline for multiple operations
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.set('key3', 'value3');
await pipeline.exec();
```

---

## 🔒 Security Best Practices

### 1. **Network Security**
- Use Redis AUTH for password protection
- Bind Redis to localhost only in development
- Use SSL/TLS in production
- Implement firewall rules

### 2. **Data Security**
- Don't store sensitive data in Redis
- Use appropriate expiration times
- Implement key naming conventions
- Regular security audits

### 3. **Access Control**
```typescript
// Use namespaced keys
const key = `app:${environment}:${userId}:${resource}`;

// Implement key patterns
const pattern = `app:prod:user:*:portfolio`;
const keys = await redis.keys(pattern);
```

---

## 📈 Scaling Considerations

### 1. **Redis Clustering**
- For high availability
- Automatic failover
- Horizontal scaling
- Data sharding

### 2. **Redis Sentinel**
- Monitoring
- Notifications
- Automatic failover
- Configuration management

### 3. **Memory Management**
- Monitor memory usage
- Implement eviction policies
- Use appropriate data types
- Regular cleanup

---

## 🎯 Production Checklist

- [ ] Redis instance created and configured
- [ ] Environment variables set correctly
- [ ] Connection tested and verified
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Security measures in place
- [ ] Performance monitoring active
- [ ] Documentation updated

---

## 📚 Related Documentation

- [Architecture](./Architecture.md) - System overview
- [Runbook](./Runbook.md) - Operations guide
- [API Reference](./API.md) - Endpoint documentation

---

**Last Updated:** October 15, 2025  
**Maintained by:** AI Capital Development Team