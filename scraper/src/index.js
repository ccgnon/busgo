// src/index.js
require('dotenv').config({ path: require('path').join(__dirname, '../../backend/.env') });

const { SOURCES }                                      = require('./sources');
const { scrapeWebsite, scrapeIntercityMobility }       = require('./scrapers/aiScraper');
const { VERIFIED_TRIPS }                               = require('./parsers/manualData');
const { importTrips, ensureStations }                  = require('./utils/dbImporter');

async function run() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   🚌 busGO Scraper — Alimentation base Cameroun  ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const totalStats = { total: 0, imported: 0, skipped: 0, errors: 0, invalid: 0 };

  // ── 1. S'assurer que les stations existent ──────────────────────────────────
  console.log('📍 Vérification des stations...');
  await ensureStations();

  // ── 2. Importer les données vérifiées manuellement ─────────────────────────
  console.log(`\n📋 Import des données vérifiées (${VERIFIED_TRIPS.length} trajets)...`);
  const manualStats = await importTrips(VERIFIED_TRIPS, 'manual');
  console.log(`   ✓ Manuel : ${manualStats.imported} importés, ${manualStats.skipped} doublons, ${manualStats.invalid} invalides`);
  mergeStats(totalStats, manualStats);

  // ── 3. Scraping web des plateformes actives ─────────────────────────────────
  if (process.env.GROQ_API_KEY) {
    console.log('\n🌐 Scraping des plateformes en ligne...');

    // Intercity Mobility (spécialisé Cameroun)
    try {
      console.log('\n→ Intercity Mobility...');
      const icResult = await scrapeIntercityMobility();
      if (icResult.trips.length > 0) {
        const icStats = await importTrips(icResult.trips, 'intercitymobility');
        console.log(`   ✓ Intercity : ${icStats.imported} importés, ${icStats.skipped} doublons`);
        mergeStats(totalStats, icStats);
      }
    } catch (e) {
      console.log(`   ⚠️  Intercity inaccessible : ${e.message}`);
    }

    // Autres sources actives
    for (const source of SOURCES.filter(s => s.active && s.type === 'web' && s.id !== 'intercitymobility')) {
      try {
        const result = await scrapeWebsite(source);
        if (result.trips.length > 0) {
          const stats = await importTrips(result.trips, source.id);
          console.log(`   ✓ ${source.name} : ${stats.imported} importés, ${stats.skipped} doublons`);
          mergeStats(totalStats, stats);
        }
        await new Promise(r => setTimeout(r, 2000)); // Pause entre les sources
      } catch (e) {
        console.log(`   ⚠️  ${source.name} inaccessible : ${e.message}`);
      }
    }
  } else {
    console.log('\n⚠️  GROQ_API_KEY manquante — scraping IA désactivé (données manuelles uniquement)');
  }

  // ── 4. Résumé final ─────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        ✅ Import terminé !            ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Total traités  : ${String(totalStats.total).padEnd(16)} ║`);
  console.log(`║  ✅ Importés    : ${String(totalStats.imported).padEnd(16)} ║`);
  console.log(`║  ⏭️  Doublons    : ${String(totalStats.skipped).padEnd(16)} ║`);
  console.log(`║  ❌ Invalides   : ${String(totalStats.invalid).padEnd(16)} ║`);
  console.log(`║  🔥 Erreurs DB  : ${String(totalStats.errors).padEnd(16)} ║`);
  console.log('╚══════════════════════════════════════╝\n');

  process.exit(0);
}

function mergeStats(total, stats) {
  for (const key of Object.keys(total)) {
    total[key] += stats[key] || 0;
  }
}

run().catch(err => {
  console.error('\n❌ Erreur fatale:', err.message);
  process.exit(1);
});
