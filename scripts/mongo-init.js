// MongoDB initialization script for AiCapital
db = db.getSiblingDB('aicapital');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 6
        },
        subscriptionTier: {
          bsonType: 'string',
          enum: ['free', 'premium', 'premiumplus']
        }
      }
    }
  }
});

db.createCollection('portfolios', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'ticker', 'shares', 'entryPrice'],
      properties: {
        userId: {
          bsonType: 'objectId'
        },
        ticker: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 10
        },
        shares: {
          bsonType: 'number',
          minimum: 0
        },
        entryPrice: {
          bsonType: 'number',
          minimum: 0
        },
        portfolioType: {
          bsonType: 'string',
          enum: ['solid', 'risky']
        }
      }
    }
  }
});

db.createCollection('historicaldata', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['ticker', 'date', 'price'],
      properties: {
        ticker: {
          bsonType: 'string'
        },
        date: {
          bsonType: 'date'
        },
        price: {
          bsonType: 'number',
          minimum: 0
        }
      }
    }
  }
});

db.createCollection('notifications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'title', 'type'],
      properties: {
        userId: {
          bsonType: 'objectId'
        },
        title: {
          bsonType: 'string',
          minLength: 1
        },
        message: {
          bsonType: 'string'
        },
        type: {
          bsonType: 'string',
          enum: ['info', 'warning', 'success', 'error', 'action']
        },
        priority: {
          bsonType: 'string',
          enum: ['low', 'medium', 'high', 'urgent']
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });
db.users.createIndex({ subscriptionTier: 1 });

db.portfolios.createIndex({ userId: 1 });
db.portfolios.createIndex({ ticker: 1 });
db.portfolios.createIndex({ portfolioType: 1 });
db.portfolios.createIndex({ userId: 1, ticker: 1 }, { unique: true });

db.historicaldata.createIndex({ ticker: 1, date: 1 }, { unique: true });
db.historicaldata.createIndex({ ticker: 1 });
db.historicaldata.createIndex({ date: 1 });

db.notifications.createIndex({ userId: 1 });
db.notifications.createIndex({ createdAt: 1 });
db.notifications.createIndex({ readAt: 1 });
db.notifications.createIndex({ type: 1 });
db.notifications.createIndex({ priority: 1 });

// Create TTL index for notifications (auto-delete after 30 days)
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

print('✅ MongoDB initialization completed successfully!');
print('📊 Created collections: users, portfolios, historicaldata, notifications');
print('🔍 Created indexes for optimal performance');
print('⏰ Set up TTL for notifications (30 days)');
