// src/server.js
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const prisma      = require('./lib/prisma');

const tripsRouter    = require('./routes/trips');
const bookingsRouter = require('./routes/bookings');
const authRouter     = require('./routes/auth');
const adminRouter    = require('./routes/admin');
const agencyRouter   = require('./routes/agency');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes' },
});
app.use(limiter);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/trips',    tripsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/auth',     authRouter);
app.use('/api/admin',    adminRouter);
app.use('/api/agency',   agencyRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', version: '1.0.0', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} introuvable` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : err.message,
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚌 busGO API     →  http://localhost:${PORT}`);
  console.log(`   Health        →  http://localhost:${PORT}/health`);
  console.log(`   Trips search  →  http://localhost:${PORT}/api/trips/search?from=Paris&to=Lyon`);
  console.log(`   Prisma Studio →  npm run db:studio`);
  console.log(`   Mode          →  ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
