# 🔴 Redis Setup Guide for AI Capital

## 📋 **Overview**

Redis is used in AI Capital for:
- **Distributed Cron Job Locking**: Prevents duplicate execution across multiple instances
- **Session Management**: Fast session storage and retrieval
- **API Response Caching**: Reduces external API calls and improves performance
- **Rate Limiting**: Tracks API request counts per user/IP

---

## 🚀 **Local Development Setup**

### **Option 1: Docker Compose (Recommended)**

The project includes a Redis container in `docker-compose.yml`:

```bash
# Start Redis with MongoDB and backend
docker-compose up -d redis

# Check Redis is running
docker ps | grep redis

# Test Redis connection
docker exec -it aicapital-redis redis-cli ping
# Expected output: PONG
```

**Redis Configuration:**
- **Port**: `6379`
- **Password**: `redispassword`
- **Connection URL**: `redis://:redispassword@localhost:6379`

### **Option 2: Local Redis Installation**

#### **Windows:**
```powershell
# Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
# Or use WSL2 with Linux installation

# Via Chocolatey
choco install redis-64

# Start Redis
redis-server
```

#### **macOS:**
```bash
# Install via Homebrew
brew install redis

# Start Redis
brew services start redis

# Test connection
redis-cli ping
```

#### **Linux (Ubuntu/Debian):**
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli ping
```

---

## ☁️ **Production Deployment**

### **Render.com Setup**

1. **Create Redis Instance:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click **"New +"** → **"Redis"**
   - Choose plan:
     - **Free**: 25MB (good for testing)
     - **Starter**: $7/mo, 256MB (recommended for production)
     - **Standard**: $15/mo, 1GB (for high-traffic apps)
   - Name: `aicapital-redis`
   - Click **"Create Redis"**

2. **Get Connection Details:**
   - After creation, copy the **Internal Redis URL**
   - Format: `redis://red-xxxxx:6379`

3. **Configure Environment Variable:**
   - Go to your backend service on Render
   - Navigate to **Environment** tab
   - Add variable:
     ```
     REDIS_URL=redis://red-xxxxx:6379
     ```
   - Click **"Save Changes"**

4. **Verify Connection:**
   - Check deployment logs for:
     ```
     ✅ [REDIS] Connected successfully
     ```

### **AWS ElastiCache Setup**

```bash
# Create ElastiCache Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id aicapital-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1

# Get endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id aicapital-redis \
  --show-cache-node-info

# Set environment variable
REDIS_URL=redis://aicapital-redis.xxxxx.cache.amazonaws.com:6379
```

### **Heroku Redis**

```bash
# Add Redis add-on
heroku addons:create heroku-redis:mini -a aicapital

# Get connection URL
heroku config:get REDIS_URL -a aicapital

# Environment variable is automatically set as REDIS_URL
```

---

## 🔧 **Configuration in AI Capital**

### **Environment Variables**

Add to your `.env` file:

```bash
# Local Development
REDIS_URL=redis://:redispassword@localhost:6379

# Production (Render/Heroku/AWS)
REDIS_URL=redis://your-redis-url:6379
```

### **Backend Integration**

The Redis service is automatically initialized in `backend/src/services/redisService.ts`:

```typescript
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error('Max retries reached');
      return Math.min(retries * 100, 3000);
    }
  }
});

await client.connect();
```

---

## 🔒 **Distributed Cron Job Locking**

### **How It Works**

AI Capital uses Redis to ensure cron jobs run only once across multiple instances:

```typescript
// Acquire lock before running job
const lockKey = `cron:lock:${jobName}`;
const lockAcquired = await redisService.set(
  lockKey, 
  'locked', 
  { NX: true, EX: 300 } // 5-minute lock
);

if (!lockAcquired) {
  console.log('Job already running in another instance');
  return;
}

try {
  // Run job
  await updatePortfolioMetrics();
} finally {
  // Release lock
  await redisService.del(lockKey);
}
```

### **Cron Jobs Using Redis**

1. **Daily Portfolio Updates** (`schedulerService.ts`)
   - Lock: `cron:lock:portfolio-update`
   - Frequency: Daily at 4 PM EST
   - Timeout: 5 minutes

2. **Watchlist Alert Checks** (`watchlistAlertService.ts`)
   - Lock: `cron:lock:watchlist-alerts`
   - Frequency: Every 5 minutes
   - Timeout: 2 minutes

3. **Notification Cleanup** (`notificationService.ts`)
   - Lock: `cron:lock:notification-cleanup`
   - Frequency: Daily at midnight
   - Timeout: 5 minutes

---

## 📊 **Monitoring & Troubleshooting**

### **Check Redis Status**

```bash
# Via Redis CLI
redis-cli ping
redis-cli info stats

# Via Docker
docker exec -it aicapital-redis redis-cli ping

# Check key count
redis-cli DBSIZE

# View all keys (use carefully in production!)
redis-cli KEYS "*"
```

### **Common Issues**

#### **Connection Refused**

```bash
# Symptom
Error: connect ECONNREFUSED 127.0.0.1:6379

# Solution
# 1. Check Redis is running
docker ps | grep redis
redis-cli ping

# 2. Verify REDIS_URL environment variable
echo $REDIS_URL

# 3. Check firewall/security groups
```

#### **Authentication Failed**

```bash
# Symptom
Error: NOAUTH Authentication required

# Solution
# Update connection URL with password
REDIS_URL=redis://:yourpassword@localhost:6379
```

#### **Lock Not Releasing**

```bash
# Symptom
Cron job not running, logs show "lock held"

# Solution
# Manually release lock (emergency only!)
redis-cli DEL "cron:lock:portfolio-update"

# Or flush all locks
redis-cli KEYS "cron:lock:*" | xargs redis-cli DEL
```

### **Performance Monitoring**

```bash
# Monitor commands in real-time
redis-cli MONITOR

# Get memory usage
redis-cli INFO memory

# Check slowlog
redis-cli SLOWLOG GET 10
```

---

## 🧪 **Testing Redis Connection**

### **Simple Connection Test**

```bash
# Create test script
cat > test-redis.js << 'EOF'
const { createClient } = require('redis');

(async () => {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  client.on('error', (err) => console.error('Redis Error:', err));
  
  await client.connect();
  console.log('✅ Connected to Redis');
  
  await client.set('test-key', 'Hello Redis!');
  const value = await client.get('test-key');
  console.log('✅ Test value:', value);
  
  await client.del('test-key');
  await client.quit();
  console.log('✅ Test completed');
})();
EOF

# Run test
node test-redis.js
```

---

## 🔐 **Security Best Practices**

1. **Use Strong Passwords**
   ```bash
   # Generate secure password
   openssl rand -base64 32
   ```

2. **Enable TLS in Production**
   ```typescript
   const client = createClient({
     url: process.env.REDIS_URL,
     socket: {
       tls: true,
       rejectUnauthorized: true
     }
   });
   ```

3. **Restrict Access**
   - Use VPC/private networks
   - Configure firewall rules
   - Limit access to backend instances only

4. **Set Max Memory Policy**
   ```bash
   # In redis.conf
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

---

## 📚 **Additional Resources**

- [Redis Documentation](https://redis.io/documentation)
- [Node Redis Client](https://github.com/redis/node-redis)
- [Render Redis Guide](https://render.com/docs/redis)
- [AWS ElastiCache](https://aws.amazon.com/elasticache/)

---

## ✅ **Checklist for Production**

- [ ] Redis instance created on Render/AWS/Heroku
- [ ] `REDIS_URL` environment variable set
- [ ] Backend successfully connects to Redis
- [ ] Cron jobs acquire/release locks correctly
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place
- [ ] Security rules applied (passwords, TLS, firewall)

---

**Need help?** Check the [Runbook.md](./Runbook.md) for troubleshooting steps or reach out to the development team.

