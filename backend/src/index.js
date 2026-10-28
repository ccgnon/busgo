require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// ── Sécurité ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' }
});
app.use(limiter);

// ── Parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Statiques ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/trips',        require('./routes/trips'));
app.use('/api/bookings',     require('./routes/bookings'));
app.use('/api/stations',     require('./routes/stations'));
app.use('/api/agencies',     require('./routes/agencies'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/admin',        require('./routes/admin'));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'busgo-api',
    version: '1.0.0',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée', path: req.path });
});

// ── Erreurs globales ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (process.env.NODE_ENV === 'development') console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Seed automatique si DB vide ───────────────────────────────────────────
async function autoSeed() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const count = await prisma.agency.count();
    if (count === 0) {
      console.log('🌱 DB vide détectée — lancement du seed initial…');
      require('child_process').execSync('node prisma/seed.js', {
        cwd: __dirname + '/../',
        stdio: 'inherit',
      });
      console.log('✅ Seed terminé.');
    } else {
      console.log(`✅ DB opérationnelle (${count} agence(s) déjà présente(s)).`);
    }
    await prisma.$disconnect();
  } catch (e) {
    console.warn('⚠️  Auto-seed ignoré :', e.message);
  }
}

// ── Démarrage ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`\n🚌 busGO API démarrée`);
  console.log(`📡 Port       : ${PORT}`);
  console.log(`🌍 Env        : ${process.env.NODE_ENV}`);
  console.log(`🔗 Health     : http://localhost:${PORT}/health`);
  console.log(`📚 API        : http://localhost:${PORT}/api\n`);
  await autoSeed();
});
