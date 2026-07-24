require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const { default: rateLimit, ipKeyGenerator } = require('express-rate-limit');

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.BACKEND_PORT || 4000;
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS && !process.env.FRONTEND_URL) throw new Error('CORS_ORIGINS or FRONTEND_URL is required in production');

// Build allowed origins from env. CORS_ORIGINS is a comma-separated list,
// otherwise fall back to FRONTEND_URL or localhost dev defaults.
const buildAllowedOrigins = () => {
  if (process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  }
  const front = process.env.FRONTEND_URL;
  if (front) return [front];
  return ['http://localhost:3000', 'http://127.0.0.1:3000'];
};
const ALLOWED_ORIGINS = buildAllowedOrigins();

// Socket.IO setup with restricted CORS
const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);

  // Allow clients to join a lot-specific room
  socket.on('join:lot', (lotId) => {
    socket.join(`lot:${lotId}`);
  });

  socket.on('leave:lot', (lotId) => {
    socket.leave(`lot:${lotId}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

// Security headers (helmet). crossOriginResourcePolicy relaxed so frontend can
// fetch images served from this origin from a different origin.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // CSP managed at frontend / reverse proxy level
}));

// CORS — env-driven allowlist
app.use(cors({
  origin: (origin, cb) => {
    // Allow non-browser tools (no origin) and matching origins.
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// AI rate limiter: 20 requests per user per hour
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => {
    if (req.user) return String(req.user.id || req.user.userId);
    return ipKeyGenerator(req);
  },
  message: { error: 'Too many AI requests. Limit is 20 per hour per user.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/consignors', require('./routes/consignors'));
app.use('/api/items', require('./routes/items'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/bidders', require('./routes/bidders'));
app.use('/api/live-auctions', require('./routes/liveAuctions'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/shipping', require('./routes/shipping'));
app.use('/api/conditions', require('./routes/conditions'));
app.use('/api/storage', require('./routes/storage'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/reports', require('./routes/reports'));
if (process.env.ENABLE_EXPERIMENTAL_AI === 'true') app.use('/api/ai', aiRateLimiter, require('./routes/ai'));
app.use('/api/runtime-ai', require('./routes/runtimeAi'));
app.use('/api/photography', require('./routes/photography'));
app.use('/api/catalog', require('./routes/catalog'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/unsold-lots', require('./routes/unsoldLots'));
app.use('/api/appraisals', require('./routes/appraisals'));
app.use('/api/estates', require('./routes/estates'));
app.use('/api/lots', require('./routes/lots'));
app.use('/api/analytics', require('./routes/analyticsAuction'));
app.use('/api/custom-views', require('./routes/customViews'));
app.use('/api/governed-auction', require('./routes/governedAuction'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

httpServer.listen(PORT, () => {
  console.log(`Auction House backend running on port ${PORT}`);
  console.log(`CORS allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

module.exports = { app, io };
