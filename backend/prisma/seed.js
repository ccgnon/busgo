// prisma/seed.js — busGO Cameroun
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// ─── Gares routières du Cameroun ─────────────────────────────────────────────
const STATIONS = [
  { id: 'YDE', name: 'Yaoundé',      terminal: 'Gare Routière de Mvan',         lat:  3.8480,  lng: 11.5021 },
  { id: 'DLA', name: 'Douala',       terminal: 'Gare Routière de Bonabéri',     lat:  4.0483,  lng:  9.7043 },
  { id: 'BFO', name: 'Bafoussam',    terminal: 'Gare Routière Centrale',        lat:  5.4737,  lng: 10.4174 },
  { id: 'BDA', name: 'Bamenda',      terminal: 'Gare Routière Commercial Ave',  lat:  5.9631,  lng: 10.1591 },
  { id: 'NGD', name: 'Ngaoundéré',   terminal: 'Gare Routière du Centre',       lat:  7.3267,  lng: 13.5836 },
  { id: 'GAR', name: 'Garoua',       terminal: 'Gare Routière de Garoua',       lat:  9.3017,  lng: 13.3972 },
  { id: 'KSL', name: 'Kribi',        terminal: 'Gare Routière de Kribi',        lat:  2.9393,  lng:  9.9071 },
  { id: 'BUE', name: 'Buea',         terminal: 'Gare Routière de Buea Town',    lat:  4.1527,  lng:  9.2408 },
  { id: 'EBO', name: 'Ebolowa',      terminal: 'Gare Routière Centrale',        lat:  2.9000,  lng: 11.1500 },
  { id: 'BER', name: 'Bertoua',      terminal: 'Gare Routière de Bertoua',      lat:  4.5766,  lng: 13.6836 },
  { id: 'MDK', name: 'Maroua',       terminal: 'Gare Routière de Maroua',       lat: 10.5908,  lng: 14.3159 },
  { id: 'LIM', name: 'Limbé',        terminal: 'Gare Routière de Limbé',        lat:  4.0227,  lng:  9.1986 },
];

// ─── Compagnies de transport camerounaises ────────────────────────────────────
// Bibilong, Vatican Express, Touristique Express, General Express, Garanti Express,
// Amour Mezam, Finexs, Avenir, Binam, Horizon Express

const TRIPS_SEED = [
  // ── Yaoundé ↔ Douala (axe principal ~250km, 3-4h) ─────────────────────────
  { from:'Yaoundé', to:'Douala', dep:'05:30', arr:'09:00', dur:210, stops:0, price:3500,  company:'Bibilong',            amenities:['ac','usb'] },
  { from:'Yaoundé', to:'Douala', dep:'06:00', arr:'09:30', dur:210, stops:0, price:3000,  company:'Vatican Express',     amenities:['ac'] },
  { from:'Yaoundé', to:'Douala', dep:'07:00', arr:'11:00', dur:240, stops:1, price:2500,  company:'Touristique Express', amenities:['ac'] },
  { from:'Yaoundé', to:'Douala', dep:'08:00', arr:'11:30', dur:210, stops:0, price:3500,  company:'General Express',     amenities:['ac','usb','wifi'] },
  { from:'Yaoundé', to:'Douala', dep:'10:00', arr:'13:30', dur:210, stops:0, price:3000,  company:'Garanti Express',     amenities:['ac'] },
  { from:'Yaoundé', to:'Douala', dep:'12:00', arr:'16:00', dur:240, stops:1, price:2500,  company:'Finexs',              amenities:['ac'] },
  { from:'Yaoundé', to:'Douala', dep:'14:00', arr:'17:30', dur:210, stops:0, price:3500,  company:'Bibilong',            amenities:['ac','usb'] },
  { from:'Yaoundé', to:'Douala', dep:'15:00', arr:'19:00', dur:240, stops:0, price:3000,  company:'Vatican Express',     amenities:['ac'] },
  { from:'Yaoundé', to:'Douala', dep:'17:00', arr:'20:30', dur:210, stops:0, price:3500,  company:'General Express',     amenities:['ac','usb','wifi'] },
  { from:'Yaoundé', to:'Douala', dep:'20:00', arr:'00:00', dur:240, stops:0, price:2000,  company:'Binam',               amenities:[] },

  { from:'Douala', to:'Yaoundé', dep:'05:00', arr:'08:30', dur:210, stops:0, price:3500,  company:'Bibilong',            amenities:['ac','usb'] },
  { from:'Douala', to:'Yaoundé', dep:'06:00', arr:'09:30', dur:210, stops:0, price:3000,  company:'Vatican Express',     amenities:['ac'] },
  { from:'Douala', to:'Yaoundé', dep:'07:30', arr:'11:30', dur:240, stops:1, price:2500,  company:'Touristique Express', amenities:['ac'] },
  { from:'Douala', to:'Yaoundé', dep:'09:00', arr:'12:30', dur:210, stops:0, price:3500,  company:'General Express',     amenities:['ac','usb','wifi'] },
  { from:'Douala', to:'Yaoundé', dep:'13:00', arr:'16:30', dur:210, stops:0, price:3000,  company:'Garanti Express',     amenities:['ac'] },
  { from:'Douala', to:'Yaoundé', dep:'16:00', arr:'20:00', dur:240, stops:0, price:3500,  company:'Bibilong',            amenities:['ac','usb'] },
  { from:'Douala', to:'Yaoundé', dep:'19:00', arr:'23:00', dur:240, stops:0, price:2000,  company:'Binam',               amenities:[] },

  // ── Yaoundé ↔ Bafoussam (~240km, 3h30) ───────────────────────────────────
  { from:'Yaoundé',   to:'Bafoussam', dep:'06:00', arr:'09:30', dur:210, stops:0, price:4000,  company:'Touristique Express', amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Bafoussam', dep:'07:30', arr:'11:30', dur:240, stops:1, price:3500,  company:'Amour Mezam',         amenities:['ac'] },
  { from:'Yaoundé',   to:'Bafoussam', dep:'10:00', arr:'14:00', dur:240, stops:0, price:4000,  company:'General Express',     amenities:['ac','wifi'] },
  { from:'Yaoundé',   to:'Bafoussam', dep:'14:00', arr:'18:00', dur:240, stops:0, price:3500,  company:'Vatican Express',     amenities:['ac'] },
  { from:'Bafoussam', to:'Yaoundé',   dep:'05:30', arr:'09:00', dur:210, stops:0, price:4000,  company:'Touristique Express', amenities:['ac','usb'] },
  { from:'Bafoussam', to:'Yaoundé',   dep:'08:00', arr:'12:00', dur:240, stops:1, price:3500,  company:'Amour Mezam',         amenities:['ac'] },
  { from:'Bafoussam', to:'Yaoundé',   dep:'13:00', arr:'17:00', dur:240, stops:0, price:4000,  company:'General Express',     amenities:['ac','wifi'] },

  // ── Douala ↔ Bafoussam (~190km, 3h) ──────────────────────────────────────
  { from:'Douala',    to:'Bafoussam', dep:'06:00', arr:'09:00', dur:180, stops:0, price:3500,  company:'Amour Mezam',         amenities:['ac','usb'] },
  { from:'Douala',    to:'Bafoussam', dep:'08:00', arr:'11:30', dur:210, stops:1, price:3000,  company:'Touristique Express', amenities:['ac'] },
  { from:'Douala',    to:'Bafoussam', dep:'12:00', arr:'15:00', dur:180, stops:0, price:3500,  company:'General Express',     amenities:['ac','wifi'] },
  { from:'Douala',    to:'Bafoussam', dep:'15:00', arr:'18:00', dur:180, stops:0, price:3000,  company:'Finexs',              amenities:['ac'] },
  { from:'Bafoussam', to:'Douala',    dep:'05:30', arr:'08:30', dur:180, stops:0, price:3500,  company:'Amour Mezam',         amenities:['ac','usb'] },
  { from:'Bafoussam', to:'Douala',    dep:'09:00', arr:'12:30', dur:210, stops:1, price:3000,  company:'Touristique Express', amenities:['ac'] },
  { from:'Bafoussam', to:'Douala',    dep:'14:00', arr:'17:00', dur:180, stops:0, price:3500,  company:'General Express',     amenities:['ac','wifi'] },

  // ── Bafoussam ↔ Bamenda (~75km, 1h30) ────────────────────────────────────
  { from:'Bafoussam', to:'Bamenda', dep:'06:30', arr:'08:00', dur:90,  stops:0, price:1500,  company:'Amour Mezam',  amenities:['ac'] },
  { from:'Bafoussam', to:'Bamenda', dep:'09:00', arr:'10:30', dur:90,  stops:0, price:1500,  company:'Finexs',       amenities:['ac'] },
  { from:'Bafoussam', to:'Bamenda', dep:'12:00', arr:'13:30', dur:90,  stops:0, price:1500,  company:'Amour Mezam',  amenities:['ac'] },
  { from:'Bafoussam', to:'Bamenda', dep:'15:00', arr:'16:30', dur:90,  stops:0, price:1500,  company:'Binam',        amenities:[] },
  { from:'Bamenda',   to:'Bafoussam', dep:'06:00', arr:'07:30', dur:90,  stops:0, price:1500, company:'Amour Mezam',  amenities:['ac'] },
  { from:'Bamenda',   to:'Bafoussam', dep:'10:00', arr:'11:30', dur:90,  stops:0, price:1500, company:'Finexs',       amenities:['ac'] },
  { from:'Bamenda',   to:'Bafoussam', dep:'14:00', arr:'15:30', dur:90,  stops:0, price:1500, company:'Amour Mezam',  amenities:['ac'] },

  // ── Yaoundé ↔ Ngaoundéré (~330km, 5h) ────────────────────────────────────
  { from:'Yaoundé',    to:'Ngaoundéré', dep:'06:00', arr:'11:00', dur:300, stops:1, price:6000,  company:'General Express',   amenities:['ac','usb'] },
  { from:'Yaoundé',    to:'Ngaoundéré', dep:'08:00', arr:'14:00', dur:360, stops:2, price:5000,  company:'Garanti Express',   amenities:['ac'] },
  { from:'Yaoundé',    to:'Ngaoundéré', dep:'20:00', arr:'06:00', dur:600, stops:2, price:4500,  company:'Binam',             amenities:[] },
  { from:'Ngaoundéré', to:'Yaoundé',    dep:'06:00', arr:'11:00', dur:300, stops:1, price:6000,  company:'General Express',   amenities:['ac','usb'] },
  { from:'Ngaoundéré', to:'Yaoundé',    dep:'20:00', arr:'06:00', dur:600, stops:2, price:4500,  company:'Horizon Express',   amenities:['ac'] },

  // ── Ngaoundéré ↔ Garoua (~220km, 3h) ─────────────────────────────────────
  { from:'Ngaoundéré', to:'Garoua', dep:'07:00', arr:'10:00', dur:180, stops:0, price:3500,  company:'General Express',  amenities:['ac'] },
  { from:'Ngaoundéré', to:'Garoua', dep:'12:00', arr:'15:00', dur:180, stops:0, price:3000,  company:'Garanti Express',  amenities:['ac'] },
  { from:'Garoua',     to:'Ngaoundéré', dep:'06:30', arr:'09:30', dur:180, stops:0, price:3500, company:'General Express', amenities:['ac'] },
  { from:'Garoua',     to:'Ngaoundéré', dep:'13:00', arr:'16:00', dur:180, stops:0, price:3000, company:'Horizon Express', amenities:['ac'] },

  // ── Garoua ↔ Maroua (~200km, 3h) ─────────────────────────────────────────
  { from:'Garoua', to:'Maroua', dep:'07:00', arr:'10:00', dur:180, stops:0, price:3000,  company:'General Express',  amenities:['ac'] },
  { from:'Garoua', to:'Maroua', dep:'13:00', arr:'16:00', dur:180, stops:1, price:2500,  company:'Garanti Express',  amenities:[] },
  { from:'Maroua', to:'Garoua', dep:'06:00', arr:'09:00', dur:180, stops:0, price:3000,  company:'General Express',  amenities:['ac'] },
  { from:'Maroua', to:'Garoua', dep:'12:00', arr:'15:30', dur:210, stops:1, price:2500,  company:'Horizon Express',  amenities:[] },

  // ── Douala ↔ Limbé (~70km, 1h30) ─────────────────────────────────────────
  { from:'Douala', to:'Limbé', dep:'07:00', arr:'08:30', dur:90,  stops:0, price:1200,  company:'Finexs',   amenities:['ac'] },
  { from:'Douala', to:'Limbé', dep:'10:00', arr:'11:30', dur:90,  stops:0, price:1200,  company:'Binam',    amenities:[] },
  { from:'Douala', to:'Limbé', dep:'14:00', arr:'15:30', dur:90,  stops:0, price:1200,  company:'Finexs',   amenities:['ac'] },
  { from:'Limbé',  to:'Douala', dep:'06:00', arr:'07:30', dur:90,  stops:0, price:1200,  company:'Finexs',  amenities:['ac'] },
  { from:'Limbé',  to:'Douala', dep:'12:00', arr:'13:30', dur:90,  stops:0, price:1200,  company:'Binam',   amenities:[] },

  // ── Douala ↔ Buea (~60km, 1h15) ──────────────────────────────────────────
  { from:'Douala', to:'Buea', dep:'06:30', arr:'07:45', dur:75,  stops:0, price:1000,  company:'Vatican Express', amenities:['ac'] },
  { from:'Douala', to:'Buea', dep:'09:00', arr:'10:15', dur:75,  stops:0, price:1000,  company:'Finexs',          amenities:[] },
  { from:'Douala', to:'Buea', dep:'13:00', arr:'14:15', dur:75,  stops:0, price:1000,  company:'Binam',           amenities:[] },
  { from:'Buea',   to:'Douala', dep:'06:00', arr:'07:15', dur:75,  stops:0, price:1000, company:'Vatican Express', amenities:['ac'] },
  { from:'Buea',   to:'Douala', dep:'11:00', arr:'12:15', dur:75,  stops:0, price:1000, company:'Finexs',          amenities:[] },

  // ── Yaoundé ↔ Kribi (~170km, 3h) ─────────────────────────────────────────
  { from:'Yaoundé', to:'Kribi', dep:'07:00', arr:'10:00', dur:180, stops:0, price:3000,  company:'Touristique Express', amenities:['ac','usb'] },
  { from:'Yaoundé', to:'Kribi', dep:'10:00', arr:'13:30', dur:210, stops:1, price:2500,  company:'Bibilong',            amenities:['ac'] },
  { from:'Yaoundé', to:'Kribi', dep:'14:00', arr:'17:00', dur:180, stops:0, price:3000,  company:'Vatican Express',     amenities:['ac'] },
  { from:'Kribi',   to:'Yaoundé', dep:'06:00', arr:'09:00', dur:180, stops:0, price:3000, company:'Touristique Express', amenities:['ac','usb'] },
  { from:'Kribi',   to:'Yaoundé', dep:'12:00', arr:'15:30', dur:210, stops:1, price:2500, company:'Bibilong',            amenities:['ac'] },

  // ── Yaoundé ↔ Ebolowa (~150km, 2h30) ─────────────────────────────────────
  { from:'Yaoundé', to:'Ebolowa', dep:'07:30', arr:'10:00', dur:150, stops:0, price:2500,  company:'General Express',  amenities:['ac'] },
  { from:'Yaoundé', to:'Ebolowa', dep:'11:00', arr:'13:30', dur:150, stops:0, price:2000,  company:'Finexs',           amenities:[] },
  { from:'Yaoundé', to:'Ebolowa', dep:'15:00', arr:'17:30', dur:150, stops:0, price:2500,  company:'Garanti Express',  amenities:['ac'] },
  { from:'Ebolowa', to:'Yaoundé', dep:'06:00', arr:'08:30', dur:150, stops:0, price:2500,  company:'General Express',  amenities:['ac'] },
  { from:'Ebolowa', to:'Yaoundé', dep:'12:00', arr:'14:30', dur:150, stops:0, price:2000,  company:'Finexs',           amenities:[] },

  // ── Yaoundé ↔ Bertoua (~350km, 5h) ───────────────────────────────────────
  { from:'Yaoundé', to:'Bertoua', dep:'06:00', arr:'11:00', dur:300, stops:1, price:5000,  company:'General Express',   amenities:['ac','usb'] },
  { from:'Yaoundé', to:'Bertoua', dep:'08:00', arr:'14:00', dur:360, stops:2, price:4000,  company:'Horizon Express',   amenities:['ac'] },
  { from:'Bertoua', to:'Yaoundé', dep:'05:30', arr:'10:30', dur:300, stops:1, price:5000,  company:'General Express',   amenities:['ac','usb'] },
  { from:'Bertoua', to:'Yaoundé', dep:'12:00', arr:'18:00', dur:360, stops:2, price:4000,  company:'Horizon Express',   amenities:['ac'] },

  // ── Douala ↔ Bamenda (~350km, 5h) ────────────────────────────────────────
  { from:'Douala',  to:'Bamenda', dep:'06:00', arr:'11:00', dur:300, stops:1, price:5500,  company:'Amour Mezam',  amenities:['ac','usb'] },
  { from:'Douala',  to:'Bamenda', dep:'08:30', arr:'14:30', dur:360, stops:2, price:4500,  company:'Finexs',       amenities:['ac'] },
  { from:'Bamenda', to:'Douala',  dep:'05:30', arr:'10:30', dur:300, stops:1, price:5500,  company:'Amour Mezam',  amenities:['ac','usb'] },
  { from:'Bamenda', to:'Douala',  dep:'09:00', arr:'15:00', dur:360, stops:2, price:4500,  company:'Finexs',       amenities:['ac'] },
];

function takenSeats(rate = 0.3) {
  const taken = [];
  for (let i = 1; i <= 70; i++) {
    if (Math.random() < rate) taken.push(i);
  }
  return taken;
}

async function main() {
  console.log('🌱  Seeding database — busGO Cameroun…');

  // Nettoyer les anciennes données
  await prisma.booking.deleteMany();
  await prisma.seatSlot.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.station.deleteMany();
  console.log('   ✓ Anciennes données supprimées');

  // 1. Stations
  for (const s of STATIONS) {
    await prisma.station.upsert({
      where:  { id: s.id },
      update: { name: s.name, terminal: s.terminal, lat: s.lat, lng: s.lng },
      create: s,
    });
  }
  console.log(`   ✓ ${STATIONS.length} gares camerounaises`);

  const stationMap = Object.fromEntries(STATIONS.map(s => [s.name, s.id]));

  // 2. Trips + SeatSlots (70 sièges — bus interurbains camerounais)
  let tripCount = 0;
  for (const t of TRIPS_SEED) {
    const fromId = stationMap[t.from];
    const toId   = stationMap[t.to];
    if (!fromId || !toId) {
      console.warn(`   ⚠️  Station inconnue: ${t.from} ou ${t.to}`);
      continue;
    }
    const taken = takenSeats();
    await prisma.trip.create({
      data: {
        fromId,
        toId,
        depTime:     t.dep,
        arrTime:     t.arr,
        durationMin: t.dur,
        stops:       t.stops,
        price:       t.price,
        company:     t.company,
        totalSeats:  70,
        amenities:   t.amenities,
        rating:      parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        seatSlots: {
          create: Array.from({ length: 70 }, (_, i) => ({
            seatNum: i + 1,
            status:  taken.includes(i + 1) ? 'TAKEN' : 'FREE',
          })),
        },
      },
    });
    tripCount++;
  }
  console.log(`   ✓ ${tripCount} trajets + slots de sièges (70 sièges/bus)`);

  // 3. Utilisateur démo
  const hash = await bcrypt.hash('demo1234', 10);
  await prisma.user.upsert({
    where:  { email: 'demo@busgo.cm' },
    update: {},
    create: {
      id:           'user_demo',
      email:        'demo@busgo.cm',
      name:         'Kouam Jean',
      passwordHash: hash,
      role:         'USER',
    },
  });
  console.log('   ✓ Utilisateur démo  (demo@busgo.cm / demo1234)');

  // 4. Utilisateur agent
  const agentHash = await bcrypt.hash('demo1234', 10);
  await prisma.user.upsert({
    where:  { email: 'demo@busgo.fr' },
    update: {},
    create: {
      id:           'user_agent',
      email:        'demo@busgo.fr',
      name:         'BusBot Agent',
      passwordHash: agentHash,
      role:         'USER',
    },
  });
  console.log('   ✓ Utilisateur agent (demo@busgo.fr / demo1234)');

  console.log(`
╔════════════════════════════════════════╗
║   ✅  Seed Cameroun terminé !          ║
║   ${STATIONS.length} gares · ${tripCount} trajets · 70 sièges/bus  ║
╚════════════════════════════════════════╝`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
