// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const prisma = require('./lib/prisma');
const tripsRouter = require('./routes/trips');
const bookingsRouter = require('./routes/bookings');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const agencyRouter = require('./routes/agency');

const app = express();

// ── Configuration de base ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

// Indique à Express qu'il est derrière un proxy (important sur Render, Fly.io, etc.)
// Cela permet à req.ip et express-rate-limit de récupérer l'IP réelle du client
app.set('trust proxy', 1); // 1 = un seul proxy (valeur la plus courante sur Render)

// ── Sécurité ──────────────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',                    // Développement local
  'https://busgo-4q84.onrender.com',          // Ton frontend Render (adapte le nom exact)
  // Ajoute d'autres domaines si besoin (ex: domaine perso busgo.cm plus tard)
];

app.use(cors({
  origin: (origin, callback) => {
    // Autorise les requêtes sans origin (ex: Postman, curl) et les origins listées
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origine non autorisée : ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                 // Limite à 200 requêtes par IP
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes' },
  standardHeaders: true,    // Retourne les headers RateLimit-*
  legacyHeaders: false,
});
app.use(limiter);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Parsing du body ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Routes API ────────────────────────────────────────────────────────────────
app.use('/api/trips', tripsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/agency', agencyRouter);

// ── Route racine (pour éviter le 404 brut quand on ouvre l'URL) ───────────────
app.get('/', (req, res) => {
  res.json({
    message: "🚌 Bienvenue sur l'API busGO !",
    status: 'online',
    documentation: 'Utilisez /api/* pour les endpoints (ex: /api/auth, /api/trips)',
    health: '/health',
    mode: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      db: 'connected',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── 404 Not Found ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} introuvable` });
});

// ── Gestionnaire d'erreurs global ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : err.message || 'Erreur inconnue',
  });
});

// ── Démarrage du serveur ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost:' + PORT}`
    : `http://localhost:${PORT}`;

  console.log(`\n🚌 busGO API démarrée !`);
  console.log(`   URL : ${baseUrl}`);
  console.log(`   Health check : ${baseUrl}/health`);
  console.log(`   Exemple recherche : ${baseUrl}/api/trips/search?from=Paris&to=Lyon`);
  console.log(`   Mode : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Prisma Studio : npm run db:studio (local seulement)\n`);
});

module.exports = app;
