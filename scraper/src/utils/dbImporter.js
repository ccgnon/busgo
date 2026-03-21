// src/utils/dbImporter.js
// Valide et importe les trajets scrapés dans la base busGO

const { PrismaClient } = require('@prisma/client');
const { CITIES_CM, COMPANIES } = require('../sources');

const prisma = new PrismaClient();

// ── Normaliser un nom de ville ────────────────────────────────────────────────
const CITY_ALIASES = {
  'yaounde':      'Yaoundé',
  'yaoundé':      'Yaoundé',
  'douala':       'Douala',
  'bafoussam':    'Bafoussam',
  'bamenda':      'Bamenda',
  'ngaoundere':   'Ngaoundéré',
  'ngaoundéré':   'Ngaoundéré',
  'garoua':       'Garoua',
  'kribi':        'Kribi',
  'buea':         'Buea',
  'ebolowa':      'Ebolowa',
  'bertoua':      'Bertoua',
  'maroua':       'Maroua',
  'limbe':        'Limbé',
  'limbé':        'Limbé',
};

function normalizeCity(name) {
  if (!name) return null;
  const key = name.toLowerCase().trim().replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a');
  return CITY_ALIASES[key] || CITY_ALIASES[name.toLowerCase().trim()] || null;
}

// ── Valider un trajet scrapé ──────────────────────────────────────────────────
function validateTrip(trip) {
  const errors = [];

  const from = normalizeCity(trip.from);
  const to   = normalizeCity(trip.to);

  if (!from) errors.push(`Ville départ inconnue: "${trip.from}"`);
  if (!to)   errors.push(`Ville arrivée inconnue: "${trip.to}"`);
  if (from === to) errors.push('Départ = Arrivée');

  // Valider le format des horaires
  if (!trip.depTime || !/^\d{1,2}:\d{2}$/.test(trip.depTime)) errors.push(`Heure départ invalide: "${trip.depTime}"`);
  if (!trip.arrTime || !/^\d{1,2}:\d{2}$/.test(trip.arrTime)) errors.push(`Heure arrivée invalide: "${trip.arrTime}"`);

  // Prix en FCFA (entre 500 et 50000)
  const price = Number(trip.price);
  if (isNaN(price) || price < 500 || price > 50000) errors.push(`Prix invalide: ${trip.price}`);

  if (!trip.company || trip.company.length < 2) errors.push('Compagnie manquante');

  return {
    valid: errors.length === 0,
    errors,
    normalized: {
      from,
      to,
      depTime:     trip.depTime,
      arrTime:     trip.arrTime,
      durationMin: trip.durationMin || estimateDuration(from, to),
      price,
      company:     trip.company,
      stops:       trip.stops || 0,
      amenities:   trip.amenities || COMPANIES[trip.company]?.amenities || ['ac'],
    },
  };
}

// ── Estimer la durée si non fournie ──────────────────────────────────────────
const DISTANCE_MAP = {
  'Yaoundé-Douala':       250, 'Douala-Yaoundé':       250,
  'Yaoundé-Bafoussam':    240, 'Bafoussam-Yaoundé':    240,
  'Yaoundé-Ngaoundéré':   330, 'Ngaoundéré-Yaoundé':   330,
  'Yaoundé-Kribi':        170, 'Kribi-Yaoundé':         170,
  'Yaoundé-Ebolowa':      150, 'Ebolowa-Yaoundé':       150,
  'Yaoundé-Bertoua':      350, 'Bertoua-Yaoundé':       350,
  'Douala-Bafoussam':     190, 'Bafoussam-Douala':      190,
  'Douala-Bamenda':       350, 'Bamenda-Douala':        350,
  'Douala-Limbé':          70, 'Limbé-Douala':           70,
  'Douala-Buea':           60, 'Buea-Douala':            60,
  'Bafoussam-Bamenda':     75, 'Bamenda-Bafoussam':      75,
  'Ngaoundéré-Garoua':   220, 'Garoua-Ngaoundéré':    220,
  'Garoua-Maroua':        200, 'Maroua-Garoua':         200,
};

function estimateDuration(from, to) {
  const key  = `${from}-${to}`;
  const dist = DISTANCE_MAP[key] || 300;
  // Vitesse moyenne bus camerounais : ~60km/h
  return Math.round((dist / 60) * 60);
}

// ── Vérifier si un trajet similaire existe déjà ──────────────────────────────
async function tripExists(fromId, toId, depTime, company) {
  const existing = await prisma.trip.findFirst({
    where: { fromId, toId, depTime, company },
  });
  return !!existing;
}

// ── Créer les sièges pour un trip ────────────────────────────────────────────
function createSeatSlots(totalSeats, occupancyRate = 0.25) {
  return Array.from({ length: totalSeats }, (_, i) => ({
    seatNum: i + 1,
    status:  Math.random() < occupancyRate ? 'TAKEN' : 'FREE',
  }));
}

// ── Importer un lot de trajets ────────────────────────────────────────────────
async function importTrips(trips, source = 'scraper') {
  const stats = { total: 0, imported: 0, skipped: 0, errors: 0, invalid: 0 };

  // Charger la map stations
  const stations = await prisma.station.findMany();
  const stationByName = Object.fromEntries(stations.map(s => [s.name, s.id]));

  for (const trip of trips) {
    stats.total++;

    // Valider
    const { valid, errors, normalized } = validateTrip(trip);
    if (!valid) {
      console.log(`   ⚠️  Invalide [${trip.from}→${trip.to}] : ${errors.join(', ')}`);
      stats.invalid++;
      continue;
    }

    const fromId = stationByName[normalized.from];
    const toId   = stationByName[normalized.to];

    if (!fromId || !toId) {
      console.log(`   ⚠️  Station absente de la DB : ${normalized.from} ou ${normalized.to}`);
      stats.invalid++;
      continue;
    }

    // Vérifier les doublons
    const exists = await tripExists(fromId, toId, normalized.depTime, normalized.company);
    if (exists) {
      stats.skipped++;
      continue;
    }

    // Insérer
    try {
      const company   = normalized.company;
      const compInfo  = COMPANIES[company] || { seats: 70, amenities: ['ac'] };
      const totalSeats = compInfo.seats || 70;

      await prisma.trip.create({
        data: {
          fromId,
          toId,
          depTime:     normalized.depTime,
          arrTime:     normalized.arrTime,
          durationMin: normalized.durationMin,
          stops:       normalized.stops,
          price:       normalized.price,
          company,
          totalSeats,
          amenities:   normalized.amenities,
          rating:      compInfo.rating || 3.8,
          active:      true,
          seatSlots: {
            create: createSeatSlots(totalSeats),
          },
        },
      });

      console.log(`   ✅ Importé : ${normalized.from} → ${normalized.to} | ${company} ${normalized.depTime} | ${normalized.price} FCFA`);
      stats.imported++;
    } catch (err) {
      console.error(`   ❌ Erreur DB : ${err.message}`);
      stats.errors++;
    }
  }

  return stats;
}

// ── S'assurer que toutes les stations existent ────────────────────────────────
async function ensureStations() {
  const STATION_IDS = {
    'Yaoundé':    'YDE', 'Douala':     'DLA', 'Bafoussam':  'BFO',
    'Bamenda':    'BDA', 'Ngaoundéré': 'NGD', 'Garoua':     'GAR',
    'Kribi':      'KSL', 'Buea':       'BUE', 'Ebolowa':    'EBO',
    'Bertoua':    'BER', 'Maroua':     'MDK', 'Limbé':      'LIM',
  };

  for (const [name, id] of Object.entries(STATION_IDS)) {
    const city = CITIES_CM[name];
    if (!city) continue;
    await prisma.station.upsert({
      where:  { id },
      update: {},
      create: { id, name, terminal: city.terminal, lat: city.lat, lng: city.lng },
    });
  }
  console.log(`   ✓ ${Object.keys(STATION_IDS).length} stations vérifiées`);
}

module.exports = { importTrips, ensureStations, validateTrip, normalizeCity };
