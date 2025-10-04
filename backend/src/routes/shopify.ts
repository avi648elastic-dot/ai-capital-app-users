import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

const router = express.Router();

// Middleware לאימות משתמש
const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user; // ✅ הוספת המשתמש ל־Request
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ✅ שמירת פרטי Shopify API למשתמש
router.post('/connect', authMiddleware, async (req: any, res: Response) => {
  try {
    const { apiKey, apiSecret, shopDomain } = req.body;

    if (!apiKey || !apiSecret || !shopDomain) {
      return res.status(400).json({ message: 'Missing Shopify credentials' });
    }

    const user = req.user as IUser;
    user.apiKey = apiKey;
    user.apiSecret = apiSecret;
    user.shopDomain = shopDomain;
    await user.save();

    res.json({ message: 'Shopify credentials saved successfully' });
  } catch (error: any) {
    console.error('Error saving Shopify credentials:', error);
    res.status(500).json({ message: 'Failed to save Shopify credentials', error: error.message });
  }
});

// ✅ בדיקה אם יש חיבור קיים ל־Shopify
router.get('/status', authMiddleware, async (req: any, res: Response) => {
  try {
    const user = req.user as IUser;
    if (!user.apiKey || !user.shopDomain) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      shopDomain: user.shopDomain,
      apiKey: '***' + user.apiKey.slice(-4),
    });
  } catch (error: any) {
    console.error('Error checking Shopify connection:', error);
    res.status(500).json({ message: 'Failed to check Shopify connection', error: error.message });
  }
});

// ✅ קבלת מוצרים מהחנות Shopify
router.get('/products', authMiddleware, async (req: any, res: Response) => {
  try {
    const user = req.user as IUser;

    if (!user.apiKey || !user.apiSecret || !user.shopDomain) {
      return res.status(400).json({ message: 'Shopify credentials not found' });
    }

    const response = await axios.get(
      `https://${user.shopDomain}/admin/api/2023-10/products.json`,
      {
        headers: {
          'X-Shopify-Access-Token': user.apiSecret,
        },
      }
    );

    res.json({ products: response.data.products });
  } catch (error: any) {
    console.error('Error fetching Shopify products:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

export default router;
