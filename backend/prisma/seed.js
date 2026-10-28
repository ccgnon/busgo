/**
 * busGO CMR — Seed complet
 * Agences de voyages camerounaises, gestionnaires, stations, trajets, sièges, réservations de démo
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// ─── Utilitaires ─────────────────────────────────────────────────────────────
const hashPwd = (p) => bcrypt.hashSync(p, 10);

function futureDate(daysFromNow, hour = 8, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function cuid() {
  return 'c' + Math.random().toString(36).substring(2, 12) +
         Math.random().toString(36).substring(2, 12);
}

function bookingId() {
  return 'BG-' + Date.now().toString(36).toUpperCase() + '-' +
         Math.random().toString(36).substring(2, 5).toUpperCase();
}

function validationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Stations ────────────────────────────────────────────────────────────────
const STATIONS = [
  { id: 'YDE', name: 'Yaoundé', terminal: 'Gare Routière de Mvan', lat: 3.8480, lng: 11.5021, city: 'Yaoundé', region: 'Centre' },
  { id: 'DLA', name: 'Douala',  terminal: 'Gare Routière de Bonabéri', lat: 4.0511, lng: 9.7679, city: 'Douala', region: 'Littoral' },
  { id: 'BFT', name: 'Bafoussam', terminal: 'Gare Routière de Bafoussam', lat: 5.4737, lng: 10.4173, city: 'Bafoussam', region: 'Ouest' },
  { id: 'NGD', name: 'Ngaoundéré', terminal: 'Gare de Ngaoundéré', lat: 7.3267, lng: 13.5836, city: 'Ngaoundéré', region: 'Adamaoua' },
  { id: 'LIM', name: 'Limbé',  terminal: 'Gare Routière de Limbé', lat: 4.0187, lng: 9.2050, city: 'Limbé', region: 'Sud-Ouest' },
  { id: 'BUE', name: 'Buéa',   terminal: 'Gare Centrale de Buéa', lat: 4.1597, lng: 9.2311, city: 'Buéa', region: 'Sud-Ouest' },
  { id: 'EDO', name: 'Ébolowa', terminal: 'Gare Routière d\'Ébolowa', lat: 2.9000, lng: 11.1500, city: 'Ébolowa', region: 'Sud' },
  { id: 'BSG', name: 'Bertoua', terminal: 'Gare Routière de Bertoua', lat: 4.5767, lng: 13.6863, city: 'Bertoua', region: 'Est' },
  { id: 'GAR', name: 'Garoua',  terminal: 'Gare Routière de Garoua', lat: 9.3014, lng: 13.3948, city: 'Garoua', region: 'Nord' },
  { id: 'MRU', name: 'Maroua',  terminal: 'Gare Routière de Maroua', lat: 10.5954, lng: 14.3172, city: 'Maroua', region: 'Extrême-Nord' },
  { id: 'BAM', name: 'Bamenda', terminal: 'Gare Routière de Bamenda', lat: 5.9597, lng: 10.1458, city: 'Bamenda', region: 'Nord-Ouest' },
  { id: 'KMB', name: 'Kumba',   terminal: 'Gare Centrale de Kumba', lat: 4.6333, lng: 9.4400, city: 'Kumba', region: 'Sud-Ouest' },
];

// ─── Agences ─────────────────────────────────────────────────────────────────
const AGENCIES = [
  {
    id:          'ag-general',
    name:        'Général Express',
    slug:        'general-express',
    email:       'contact@general-express.cm',
    phone:       '+237 222 22 22 22',
    logo:        'https://ui-avatars.com/api/?name=GE&background=007a5e&color=fff&size=128',
    description: 'Fondée en 1985, Général Express est l\'une des plus anciennes agences de voyages interurbains du Cameroun. Dessert toutes les grandes villes.',
    verified:    true,
    commission:  0.04,
  },
  {
    id:          'ag-buca',
    name:        'Buca Voyages',
    slug:        'buca-voyages',
    email:       'reservations@buca-voyages.cm',
    phone:       '+237 233 33 33 33',
    logo:        'https://ui-avatars.com/api/?name=BV&background=e63946&color=fff&size=128',
    description: 'Buca Voyages assure des liaisons régulières entre Douala, Buéa, Limbé et Kumba avec des bus modernes climatisés.',
    verified:    true,
    commission:  0.04,
  },
  {
    id:          'ag-touristique',
    name:        'Touristique Express',
    slug:        'touristique-express',
    email:       'info@touristique-express.cm',
    phone:       '+237 244 44 44 44',
    logo:        'https://ui-avatars.com/api/?name=TE&background=f4a261&color=fff&size=128',
    description: 'Touristique Express opère sur les axes Centre-Ouest et Centre-Nord avec une flotte de 50 véhicules.',
    verified:    true,
    commission:  0.04,
  },
  {
    id:          'ag-vatican',
    name:        'Vatican Express',
    slug:        'vatican-express',
    email:       'contact@vatican-express.cm',
    phone:       '+237 255 55 55 55',
    logo:        'https://ui-avatars.com/api/?name=VX&background=6d28d9&color=fff&size=128',
    description: 'Vatican Express est réputé pour ses voyages confortables Yaoundé–Douala avec départ toutes les heures.',
    verified:    true,
    commission:  0.035,
  },
  {
    id:          'ag-united',
    name:        'United Express',
    slug:        'united-express',
    email:       'booking@united-express.cm',
    phone:       '+237 266 66 66 66',
    logo:        'https://ui-avatars.com/api/?name=UE&background=0369a1&color=fff&size=128',
    description: 'United Express couvre les routes du Grand Nord camerounais (Ngaoundéré, Garoua, Maroua) avec des bus longue distance.',
    verified:    true,
    commission:  0.04,
  },
  {
    id:          'ag-amour',
    name:        'Amour Mezam',
    slug:        'amour-mezam',
    email:       'info@amour-mezam.cm',
    phone:       '+237 277 77 77 77',
    logo:        'https://ui-avatars.com/api/?name=AM&background=be185d&color=fff&size=128',
    description: 'Amour Mezam dessert les régions du Nord-Ouest et de l\'Ouest, notamment Bamenda, Bafoussam et Kumba.',
    verified:    true,
    commission:  0.04,
  },
  {
    id:          'ag-finexs',
    name:        'Finexs',
    slug:        'finexs',
    email:       'contact@finexs.cm',
    phone:       '+237 288 88 88 88',
    logo:        'https://ui-avatars.com/api/?name=FX&background=065f46&color=fff&size=128',
    description: 'Finexs est spécialisé dans le transport rapide Douala–Yaoundé avec des minibus Mercedes Sprinter climatisés.',
    verified:    true,
    commission:  0.04,
  },
  {
    id:          'ag-solidarity',
    name:        'Solidarity Transport',
    slug:        'solidarity-transport',
    email:       'info@solidarity.cm',
    phone:       '+237 299 99 99 99',
    logo:        'https://ui-avatars.com/api/?name=ST&background=92400e&color=fff&size=128',
    description: 'Solidarity Transport opère sur l\'axe Yaoundé–Ébolowa–Kribi et relie les villes du Sud du Cameroun.',
    verified:    false,
    commission:  0.05,
  },
  {
    id:          'ag-guaranti',
    name:        'Guaranti Express',
    slug:        'guaranti-express',
    email:       'contact@guaranti.cm',
    phone:       '+237 691 00 11 22',
    logo:        'https://ui-avatars.com/api/?name=GX&background=1d4ed8&color=fff&size=128',
    description: 'Guaranti Express — réseau national couvrant 8 régions avec des bus VIP 36 places.',
    verified:    true,
    commission:  0.04,
  },
  {
    id:          'ag-central',
    name:        'Central Voyages',
    slug:        'central-voyages',
    email:       'info@central-voyages.cm',
    phone:       '+237 652 34 56 78',
    logo:        'https://ui-avatars.com/api/?name=CV&background=dc2626&color=fff&size=128',
    description: 'Central Voyages assure des liaisons quotidiennes Douala–Bafoussam–Bamenda avec des bus 52 places.',
    verified:    true,
    commission:  0.045,
  },
];

// ─── Gestionnaires AGENCY (un par agence) ────────────────────────────────────
function makeManagers(agencies) {
  return agencies.map(ag => ({
    id:       'usr-mgr-' + ag.slug.replace(/-/g, '').substring(0, 8),
    email:    'manager@' + ag.slug + '.cm',
    password: hashPwd('Manager@123'),
    name:     'Gestionnaire ' + ag.name,
    phone:    ag.phone,
    role:     'AGENCY',
    agencyId: ag.id,
  }));
}

// ─── Utilisateurs normaux de démonstration ───────────────────────────────────
const DEMO_USERS = [
  { id: 'usr-demo-1', email: 'alice@demo.cm',  password: hashPwd('Demo@123'), name: 'Alice Ngo Bello',    phone: '+237 670 11 22 33', role: 'USER' },
  { id: 'usr-demo-2', email: 'paul@demo.cm',   password: hashPwd('Demo@123'), name: 'Paul Kamga',         phone: '+237 681 44 55 66', role: 'USER' },
  { id: 'usr-demo-3', email: 'marie@demo.cm',  password: hashPwd('Demo@123'), name: 'Marie Tchinda',      phone: '+237 692 77 88 99', role: 'USER' },
  { id: 'usr-admin',  email: 'admin@busgo.cm', password: hashPwd('Admin@123'), name: 'Admin busGO',       phone: '+237 699 00 00 00', role: 'ADMIN' },
];

// ─── Définition des routes (trajets récurrents) ───────────────────────────────
// [fromId, toId, durationH, priceXAF, agencyId, busType, amenities]
const ROUTES = [
  // Axe Yaoundé ↔ Douala (Vatican + Finexs + Général)
  ['YDE', 'DLA', 4.0, 3500,  'ag-vatican',    'VIP 36 places',  ['Climatisation','WiFi','USB','Siège inclinable']],
  ['DLA', 'YDE', 4.0, 3500,  'ag-vatican',    'VIP 36 places',  ['Climatisation','WiFi','USB','Siège inclinable']],
  ['YDE', 'DLA', 4.5, 3000,  'ag-finexs',     'Sprinter 16pax', ['Climatisation','Eau minérale']],
  ['DLA', 'YDE', 4.5, 3000,  'ag-finexs',     'Sprinter 16pax', ['Climatisation','Eau minérale']],
  ['YDE', 'DLA', 5.0, 2500,  'ag-general',    'Standard 70pax', ['Climatisation']],
  ['DLA', 'YDE', 5.0, 2500,  'ag-general',    'Standard 70pax', ['Climatisation']],

  // Axe Douala ↔ Bafoussam (Touristique + Central)
  ['DLA', 'BFT', 4.5, 3000,  'ag-touristique','Standard 52pax', ['Climatisation','TV']],
  ['BFT', 'DLA', 4.5, 3000,  'ag-touristique','Standard 52pax', ['Climatisation','TV']],
  ['DLA', 'BFT', 5.0, 2800,  'ag-central',    'Standard 52pax', ['Climatisation']],
  ['BFT', 'DLA', 5.0, 2800,  'ag-central',    'Standard 52pax', ['Climatisation']],

  // Axe Yaoundé ↔ Bafoussam (Général + Touristique)
  ['YDE', 'BFT', 5.0, 4000,  'ag-general',    'Standard 70pax', ['Climatisation']],
  ['BFT', 'YDE', 5.0, 4000,  'ag-general',    'Standard 70pax', ['Climatisation']],
  ['YDE', 'BFT', 4.5, 4500,  'ag-touristique','VIP 36 places',  ['Climatisation','WiFi','Repas']],

  // Axe Yaoundé ↔ Ngaoundéré (United)
  ['YDE', 'NGD', 9.0, 8000,  'ag-united',     'Couchette 40pax',['Climatisation','WC','Repas','WiFi']],
  ['NGD', 'YDE', 9.0, 8000,  'ag-united',     'Couchette 40pax',['Climatisation','WC','Repas','WiFi']],

  // Axe Ngaoundéré ↔ Garoua ↔ Maroua (United)
  ['NGD', 'GAR', 3.5, 3500,  'ag-united',     'Standard 52pax', ['Climatisation']],
  ['GAR', 'MRU', 4.0, 4000,  'ag-united',     'Standard 52pax', ['Climatisation']],
  ['MRU', 'GAR', 4.0, 4000,  'ag-united',     'Standard 52pax', ['Climatisation']],

  // Axe Douala ↔ Buéa ↔ Limbé (Buca)
  ['DLA', 'BUE', 2.5, 1500,  'ag-buca',       'Minibus 20pax',  ['Climatisation']],
  ['BUE', 'DLA', 2.5, 1500,  'ag-buca',       'Minibus 20pax',  ['Climatisation']],
  ['DLA', 'LIM', 2.0, 1500,  'ag-buca',       'Minibus 20pax',  ['Climatisation']],
  ['LIM', 'DLA', 2.0, 1500,  'ag-buca',       'Minibus 20pax',  ['Climatisation']],
  ['BUE', 'LIM', 0.5, 500,   'ag-buca',       'Minibus 20pax',  ['Climatisation']],

  // Axe Douala ↔ Kumba (Amour Mezam)
  ['DLA', 'KMB', 3.0, 2500,  'ag-amour',      'Standard 52pax', ['Climatisation']],
  ['KMB', 'DLA', 3.0, 2500,  'ag-amour',      'Standard 52pax', ['Climatisation']],

  // Axe Bamenda ↔ Bafoussam ↔ Douala (Amour Mezam + Central)
  ['BAM', 'BFT', 3.0, 2500,  'ag-amour',      'Standard 52pax', ['Climatisation']],
  ['BFT', 'BAM', 3.0, 2500,  'ag-amour',      'Standard 52pax', ['Climatisation']],
  ['BAM', 'DLA', 6.0, 5000,  'ag-central',    'Standard 52pax', ['Climatisation']],

  // Axe Yaoundé ↔ Ébolowa (Solidarity)
  ['YDE', 'EDO', 3.0, 2500,  'ag-solidarity', 'Standard 52pax', ['Climatisation']],
  ['EDO', 'YDE', 3.0, 2500,  'ag-solidarity', 'Standard 52pax', ['Climatisation']],

  // Axe Yaoundé ↔ Bertoua (Général)
  ['YDE', 'BSG', 5.0, 5000,  'ag-general',    'Standard 70pax', ['Climatisation']],
  ['BSG', 'YDE', 5.0, 5000,  'ag-general',    'Standard 70pax', ['Climatisation']],

  // Axe Guaranti (national)
  ['YDE', 'GAR', 12.0, 12000, 'ag-guaranti',  'VIP 36 places',  ['Climatisation','WC','Repas','WiFi','USB']],
  ['DLA', 'BAM', 6.5, 6000,   'ag-guaranti',  'VIP 36 places',  ['Climatisation','WiFi','USB']],
];

// Heures de départ typiques
const DEPARTURE_HOURS = [5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22];

function busSeatCount(busType) {
  if (busType.includes('16'))  return 16;
  if (busType.includes('20'))  return 20;
  if (busType.includes('36'))  return 36;
  if (busType.includes('40'))  return 40;
  if (busType.includes('52'))  return 52;
  return 70;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 Démarrage du seed busGO CMR…\n');

  // 1. Stations
  console.log('📍 Upsert des stations…');
  for (const s of STATIONS) {
    await prisma.station.upsert({ where: { id: s.id }, update: s, create: s });
  }
  console.log(`   ✅ ${STATIONS.length} stations`);

  // 2. Agences
  console.log('🚌 Upsert des agences…');
  for (const ag of AGENCIES) {
    await prisma.agency.upsert({
      where:  { slug: ag.slug },
      update: { name: ag.name, email: ag.email, phone: ag.phone, logo: ag.logo, description: ag.description, verified: ag.verified, commission: ag.commission },
      create: ag,
    });
  }
  console.log(`   ✅ ${AGENCIES.length} agences`);

  // 3. Gestionnaires d'agences
  console.log('👤 Création des gestionnaires d\'agences…');
  const managers = makeManagers(AGENCIES);
  for (const m of managers) {
    await prisma.user.upsert({
      where:  { email: m.email },
      update: { name: m.name, role: m.role, agencyId: m.agencyId },
      create: m,
    });
  }
  console.log(`   ✅ ${managers.length} gestionnaires (role AGENCY)`);

  // 4. Utilisateurs démo
  console.log('👥 Création des utilisateurs démo…');
  for (const u of DEMO_USERS) {
    await prisma.user.upsert({
      where:  { email: u.email },
      update: { name: u.name, role: u.role },
      create: u,
    });
  }
  console.log(`   ✅ ${DEMO_USERS.length} utilisateurs (dont 1 admin)`);

  // 5. Voyages — on génère des voyages sur 14 jours (J+1 à J+14)
  console.log('🗓️  Génération des voyages…');
  const tripIds = [];

  for (const [fromId, toId, durationH, price, agencyId, busType, amenities] of ROUTES) {
    const totalSeats = busSeatCount(busType);

    // 2–3 départs par jour pour chaque route, sur 14 jours
    const hoursPerRoute = DEPARTURE_HOURS.slice(0, 3);

    for (let day = 1; day <= 14; day++) {
      for (const hour of hoursPerRoute) {
        const dep = futureDate(day, hour, 0);
        const arr = new Date(dep.getTime() + durationH * 3600_000);

        const trip = await prisma.trip.create({
          data: {
            agencyId,
            fromId,
            toId,
            departureTime:  dep,
            arrivalTime:    arr,
            price,
            totalSeats,
            availableSeats: totalSeats,
            busType,
            amenities,
            status: 'SCHEDULED',
          },
        });
        tripIds.push(trip.id);
      }
    }
  }
  console.log(`   ✅ ${tripIds.length} voyages programmés`);

  // 6. Quelques réservations de démo (pour tester la validation QR)
  console.log('🎫 Création des réservations de démo…');
  const demoTrips = tripIds.slice(0, 6);
  const demoUserIds = ['usr-demo-1', 'usr-demo-2', 'usr-demo-3'];
  let bookingCount = 0;

  const demoBookingsData = [
    { userId: 'usr-demo-1', tripIdx: 0, seatNum: 5,  name: 'Alice Ngo Bello',   phone: '+237 670 11 22 33', pax: 1, pay: 'MTN_MOMO' },
    { userId: 'usr-demo-1', tripIdx: 1, seatNum: 12, name: 'Alice Ngo Bello',   phone: '+237 670 11 22 33', pax: 2, pay: 'MTN_MOMO' },
    { userId: 'usr-demo-2', tripIdx: 2, seatNum: 3,  name: 'Paul Kamga',        phone: '+237 681 44 55 66', pax: 1, pay: 'ORANGE_MONEY' },
    { userId: 'usr-demo-3', tripIdx: 3, seatNum: 8,  name: 'Marie Tchinda',     phone: '+237 692 77 88 99', pax: 3, pay: 'CARD' },
    { userId: 'usr-demo-2', tripIdx: 4, seatNum: 20, name: 'Paul Kamga',        phone: '+237 681 44 55 66', pax: 1, pay: 'MTN_MOMO' },
    { userId: 'usr-demo-3', tripIdx: 5, seatNum: 1,  name: 'Marie Tchinda',     phone: '+237 692 77 88 99', pax: 1, pay: 'ORANGE_MONEY' },
  ];

  for (const bd of demoBookingsData) {
    const tripId    = demoTrips[bd.tripIdx];
    if (!tripId) continue;

    const trip      = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) continue;

    const serviceFee = 500 * bd.pax;
    const totalPrice = trip.price * bd.pax + serviceFee;
    const valCode    = validationCode();
    const bkId       = bookingId();

    const bk = await prisma.booking.create({
      data: {
        id:             bkId,
        tripId,
        userId:         bd.userId,
        seatNum:        bd.seatNum,
        pax:            bd.pax,
        paymentMethod:  bd.pay,
        unitPrice:      trip.price,
        serviceFee,
        totalPrice,
        travelDate:     trip.departureTime.toISOString().split('T')[0],
        passengerName:  bd.name,
        passengerPhone: bd.phone,
        validationCode: valCode,
        status:         'CONFIRMED',
      },
    });

    // SeatSlots pour chaque siège
    for (let i = 0; i < bd.pax; i++) {
      const sn = bd.seatNum + i;
      await prisma.seatSlot.upsert({
        where:  { tripId_seatNum: { tripId, seatNum: sn } },
        update: { bookingId: bk.id, status: 'CONFIRMED' },
        create: { tripId, seatNum: sn, bookingId: bk.id, status: 'CONFIRMED' },
      });
    }

    // Mettre à jour les sièges disponibles
    await prisma.trip.update({
      where: { id: tripId },
      data:  { availableSeats: { decrement: bd.pax } },
    });

    bookingCount++;
  }
  console.log(`   ✅ ${bookingCount} réservations de démo`);

  // 7. Récapitulatif
  const counts = {
    stations: await prisma.station.count(),
    agencies: await prisma.agency.count(),
    users:    await prisma.user.count(),
    trips:    await prisma.trip.count(),
    bookings: await prisma.booking.count(),
    seats:    await prisma.seatSlot.count(),
  };

  console.log('\n📊 Récapitulatif :');
  console.log(`   🗺️  Stations    : ${counts.stations}`);
  console.log(`   🚌 Agences     : ${counts.agencies}`);
  console.log(`   👤 Utilisateurs: ${counts.users} (dont ${AGENCIES.length} gestionnaires AGENCY + 1 ADMIN)`);
  console.log(`   🗓️  Voyages     : ${counts.trips}`);
  console.log(`   🎫 Réservations: ${counts.bookings}`);
  console.log(`   💺 SeatSlots   : ${counts.seats}`);
  console.log('\n✅ Seed terminé avec succès !');
  console.log('\n🔑 Comptes de démo :');
  console.log('   Admin    : admin@busgo.cm           / Admin@123');
  console.log('   User 1   : alice@demo.cm            / Demo@123');
  console.log('   User 2   : paul@demo.cm             / Demo@123');
  console.log('   User 3   : marie@demo.cm            / Demo@123');
  console.log('   Managers : manager@<slug>.cm        / Manager@123');
  console.log('   Exemple  : manager@general-express.cm / Manager@123\n');
}

main()
  .catch((e) => { console.error('❌ Erreur seed :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
