const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d';

class AuthService {
  async register(email, password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.run(
        'INSERT INTO users (email, password) VALUES (?, ?)',
        [email, hashedPassword]
      );

      const user = await db.get('SELECT id, email, subscription_tier FROM users WHERE id = ?', [result.id]);
      const token = this.generateToken(user);

      return { user, token };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  async login(email, password) {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        subscription_tier: user.subscription_tier,
        subscription_status: user.subscription_status
      },
      token
    };
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        subscription_tier: user.subscription_tier
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async updateSubscription(userId, tier, stripeCustomerId, stripeSubscriptionId, status) {
    await db.run(
      `UPDATE users
       SET subscription_tier = ?,
           stripe_customer_id = ?,
           stripe_subscription_id = ?,
           subscription_status = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [tier, stripeCustomerId, stripeSubscriptionId, status, userId]
    );
  }

  async getUserById(userId) {
    return await db.get('SELECT id, email, subscription_tier, subscription_status FROM users WHERE id = ?', [userId]);
  }
}

// Middleware to verify JWT token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const authService = new AuthService();
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { AuthService, authMiddleware };
