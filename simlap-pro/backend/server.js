require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const db = require('./database');
const { AuthService, authMiddleware } = require('./auth');
const telemetryParser = require('./telemetry-parser');
const aiAnalyzer = require('./ai-analyzer');
const stripeHandler = require('./stripe-handler');

const app = express();
const PORT = process.env.PORT || 3001;
const authService = new AuthService();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/json', limit: '10mb' })); // For Stripe webhooks

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.txt', '.ibt', '.ldx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext) || file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload CSV or telemetry files.'));
    }
  }
});

// Ensure uploads directory exists
async function ensureDirectories() {
  const dirs = ['uploads', 'data'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      // Directory already exists
    }
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    stripe_configured: stripeHandler.isConfigured()
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await authService.register(email, password);
    res.json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Usage tracking
async function checkUsageLimit(userId, subscriptionTier) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Get or create usage stats for current month
  let usage = await db.get(
    'SELECT * FROM usage_stats WHERE user_id = ? AND month = ?',
    [userId, currentMonth]
  );

  if (!usage) {
    await db.run(
      'INSERT INTO usage_stats (user_id, month, analyses_count) VALUES (?, ?, 0)',
      [userId, currentMonth]
    );
    usage = { analyses_count: 0 };
  }

  // Check limits
  const limits = {
    free: 3,
    pro: Infinity
  };

  const limit = limits[subscriptionTier] || limits.free;
  const hasReachedLimit = usage.analyses_count >= limit;

  return {
    current: usage.analyses_count,
    limit: limit === Infinity ? 'unlimited' : limit,
    hasReachedLimit
  };
}

async function incrementUsage(userId) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  await db.run(
    `INSERT INTO usage_stats (user_id, month, analyses_count)
     VALUES (?, ?, 1)
     ON CONFLICT(user_id, month)
     DO UPDATE SET analyses_count = analyses_count + 1`,
    [userId, currentMonth]
  );
}

// Telemetry analysis routes
app.post('/api/analyze/upload', authMiddleware, upload.single('telemetry'), async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionTier = req.user.subscription_tier || 'free';

    // Check usage limits
    const usage = await checkUsageLimit(userId, subscriptionTier);
    if (usage.hasReachedLimit) {
      return res.status(403).json({
        error: 'Usage limit reached',
        message: 'You have reached your monthly analysis limit. Please upgrade to Pro for unlimited analyses.',
        usage
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { simType, trackName, carName } = req.body;

    // Parse telemetry file
    const telemetryData = await telemetryParser.parseFile(req.file.path, simType || 'unknown');
    telemetryData.trackName = trackName || 'Unknown Track';
    telemetryData.carName = carName || 'Unknown Car';

    // Analyze with AI
    const analysis = await aiAnalyzer.analyzeLap(telemetryData);

    // Save to database
    const result = await db.run(
      `INSERT INTO lap_analyses (user_id, sim_type, track_name, car_name, lap_time, telemetry_data, ai_insights)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        telemetryData.simType,
        telemetryData.trackName,
        telemetryData.carName,
        telemetryData.lapTime,
        JSON.stringify(telemetryData),
        JSON.stringify(analysis)
      ]
    );

    // Increment usage
    await incrementUsage(userId);

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      id: result.id,
      telemetryData,
      analysis,
      usage: await checkUsageLimit(userId, subscriptionTier)
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze/demo', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionTier = req.user.subscription_tier || 'free';

    // Check usage limits
    const usage = await checkUsageLimit(userId, subscriptionTier);
    if (usage.hasReachedLimit) {
      return res.status(403).json({
        error: 'Usage limit reached',
        message: 'You have reached your monthly analysis limit. Please upgrade to Pro for unlimited analyses.',
        usage
      });
    }

    const { trackName, carName } = req.body;

    // Generate demo telemetry
    const telemetryData = telemetryParser.generateDemoData(
      trackName || 'Spa-Francorchamps',
      carName || 'GT3'
    );

    // Analyze with AI
    const analysis = await aiAnalyzer.analyzeLap(telemetryData);

    // Save to database
    const result = await db.run(
      `INSERT INTO lap_analyses (user_id, sim_type, track_name, car_name, lap_time, telemetry_data, ai_insights)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'demo',
        telemetryData.trackName,
        telemetryData.carName,
        telemetryData.lapTime,
        JSON.stringify(telemetryData),
        JSON.stringify(analysis)
      ]
    );

    // Increment usage
    await incrementUsage(userId);

    res.json({
      id: result.id,
      telemetryData,
      analysis,
      usage: await checkUsageLimit(userId, subscriptionTier)
    });
  } catch (error) {
    console.error('Demo analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analyze/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const analyses = await db.all(
      `SELECT id, sim_type, track_name, car_name, lap_time, created_at
       FROM lap_analyses
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    res.json(analyses);
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analyze/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const analysisId = req.params.id;

    const analysis = await db.get(
      `SELECT * FROM lap_analyses WHERE id = ? AND user_id = ?`,
      [analysisId, userId]
    );

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({
      id: analysis.id,
      simType: analysis.sim_type,
      trackName: analysis.track_name,
      carName: analysis.car_name,
      lapTime: analysis.lap_time,
      telemetryData: JSON.parse(analysis.telemetry_data),
      analysis: JSON.parse(analysis.ai_insights),
      createdAt: analysis.created_at
    });
  } catch (error) {
    console.error('Analysis fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/usage', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionTier = req.user.subscription_tier || 'free';

    const usage = await checkUsageLimit(userId, subscriptionTier);
    res.json(usage);
  } catch (error) {
    console.error('Usage fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe payment routes
app.post('/api/payment/create-checkout', authMiddleware, async (req, res) => {
  try {
    if (!stripeHandler.isConfigured()) {
      return res.status(503).json({
        error: 'Payment system not configured',
        message: 'Please configure Stripe to enable payments'
      });
    }

    const userId = req.user.id;
    const userEmail = req.user.email;
    const { priceId, returnUrl } = req.body;

    const session = await stripeHandler.createCheckoutSession(
      userId,
      userEmail,
      priceId || process.env.STRIPE_PRICE_ID,
      returnUrl || 'http://localhost:3000/dashboard'
    );

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payment/create-portal', authMiddleware, async (req, res) => {
  try {
    if (!stripeHandler.isConfigured()) {
      return res.status(503).json({ error: 'Payment system not configured' });
    }

    const user = await authService.getUserById(req.user.id);

    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: 'No subscription found' });
    }

    const { returnUrl } = req.body;

    const session = await stripeHandler.createCustomerPortalSession(
      user.stripe_customer_id,
      returnUrl || 'http://localhost:3000/dashboard'
    );

    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    await stripeHandler.handleWebhook(req.body, signature);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Stats endpoint for dashboard
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const totalAnalyses = await db.get(
      'SELECT COUNT(*) as count FROM lap_analyses WHERE user_id = ?',
      [userId]
    );

    const bestLap = await db.get(
      'SELECT track_name, car_name, lap_time FROM lap_analyses WHERE user_id = ? ORDER BY lap_time ASC LIMIT 1',
      [userId]
    );

    const recentTracks = await db.all(
      `SELECT DISTINCT track_name, COUNT(*) as count
       FROM lap_analyses
       WHERE user_id = ?
       GROUP BY track_name
       ORDER BY count DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      totalAnalyses: totalAnalyses.count,
      bestLap,
      recentTracks
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await ensureDirectories();
    await db.init();

    app.listen(PORT, () => {
      console.log(`\n🚀 SimLap Pro Backend running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`💳 Stripe configured: ${stripeHandler.isConfigured()}`);
      console.log(`\n✅ Ready to accept requests!\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
