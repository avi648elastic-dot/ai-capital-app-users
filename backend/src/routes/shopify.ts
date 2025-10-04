import { Request, Response } from 'express';
import User from '../models/User';

import express from 'express';
import axios from 'axios';
import User from '../models/User';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ✅ Middleware לאימות משתמש
const authMiddleware = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
    req.user = await User.findById(decoded.id);

    if (!req.user) return res.status(404).json({ message: 'User not found' });

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ✅ שמירת פרטי Shopify API למשתמש
router.post('/connect', authMiddleware, async (req, res) => {
  try {
    const { apiKey, apiSecret, shopDomain } = req.body;

    if (!apiKey || !apiSecret || !shopDomain) {
      return res.status(400).json({ message: 'Missing Shopify credentials' });
    }

    req.user.apiKey = apiKey;
    req.user.apiSecret = apiSecret;
    req.user.shopDomain = shopDomain;
    await req.user.save();

    res.json({ message: 'Shopify credentials saved successfully' });
  } catch (error: any) {
    console.error('Error saving Shopify credentials:', error);
    res.status(500).json({ message: 'Failed to save Shopify credentials', error: error.message });
  }
});

// ✅ בדיקה אם יש חיבור קיים ל־Shopify
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const { apiKey, shopDomain } = req.user;

    if (!apiKey || !shopDomain) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      shopDomain: req.user.shopDomain,
      apiKey: '***' + req.user.apiKey.slice(-4),
    });
  } catch (error: any) {
    console.error('Error checking Shopify connection:', error);
    res.status(500).json({ message: 'Failed to check Shopify connection', error: error.message });
  }
});

// ✅ קבלת מוצרים מהחנות
router.get('/products', authMiddleware, async (req, res) => {
  try {
    const { apiKey, apiSecret, shopDomain } = req.user;

    if (!apiKey || !apiSecret || !shopDomain) {
      return res.status(400).json({ message: 'Shopify credentials not found' });
    }

    const response = await axios.get(`https://${shopDomain}/admin/api/2023-10/products.json`, {
      headers: {
        'X-Shopify-Access-Token': apiSecret,
      },
    });

    res.json({ products: response.data.products });
  } catch (error: any) {
    console.error('Error fetching Shopify products:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

export default router;
