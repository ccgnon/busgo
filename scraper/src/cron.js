// src/cron.js — Mise à jour automatique toutes les nuits à 2h
require('dotenv').config({ path: require('path').join(__dirname, '../../backend/.env') });
const cron = require('node-cron');
const { execSync } = require('child_process');

console.log('⏰ busGO Scraper CRON démarré');
console.log('   Mise à jour automatique tous les jours à 02:00\n');

// Toutes les nuits à 2h du matin
cron.schedule('0 2 * * *', () => {
  console.log(`\n[${new Date().toISOString()}] 🔄 Lancement scraping automatique...`);
  try {
    execSync('node src/index.js', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Scraping terminé');
  } catch (e) {
    console.error('❌ Erreur scraping:', e.message);
  }
}, { timezone: 'Africa/Douala' });

// Aussi au démarrage
console.log('🚀 Premier scraping au démarrage...');
require('./index');
