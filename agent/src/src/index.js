// src/index.js
require('dotenv').config();

const { createBot } = require('./handlers/telegram');
const memory        = require('./memory/conversationMemory');

// ── Validation des variables d'environnement ──────────────────────────────────
const REQUIRED_ENV = ['TELEGRAM_BOT_TOKEN', 'ANTHROPIC_API_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`\n❌ Variables d'environnement manquantes : ${missing.join(', ')}`);
  console.error('   Copier .env.example → .env et renseigner les valeurs\n');
  process.exit(1);
}

// ── Démarrage ─────────────────────────────────────────────────────────────────
console.log('\n🤖 busGO Agent démarrage…');
console.log(`   API busGO : ${process.env.BUSGO_API_URL || 'http://localhost:4000/api'}`);
console.log(`   Claude    : claude-sonnet-4-20250514`);
console.log(`   Telegram  : polling mode\n`);

const bot = createBot(process.env.TELEGRAM_BOT_TOKEN);

console.log('✅ BusBot est en ligne ! Envoyez /start dans Telegram.\n');

// ── Stats périodiques (debug) ─────────────────────────────────────────────────
setInterval(() => {
  const stats = memory.stats();
  if (stats.activeSessions > 0) {
    console.log(`📊 Sessions actives : ${stats.activeSessions}`);
  }
}, 5 * 60 * 1000); // toutes les 5 minutes

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt de BusBot…');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  bot.stopPolling();
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
