// busGO — Seed de données initiales
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed busGO...');

  // ── Agences ──────────────────────────────────────────────────────────
  const agencies = await Promise.all([
    prisma.agency.upsert({
      where: { slug: 'voyage-fraicheur' },
      update: {},
      create: {
        name: 'Voyage Fraîcheur', slug: 'voyage-fraicheur',
        email: 'contact@voyagefraicheur.cm', phone: '+237 222 234 001',
        description: 'Leader du transport VIP climatisé depuis 2008.',
        active: true, verified: true, commission: 0.04,
      }
    }),
    prisma.agency.upsert({
      where: { slug: 'general-solidarite' },
      update: {},
      create: {
        name: 'General Solidarité', slug: 'general-solidarite',
        email: 'info@gsolidarite.cm', phone: '+237 222 234 002',
        description: 'Transport économique pour tous les Camerounais.',
        active: true, verified: true, commission: 0.035,
      }
    }),
    prisma.agency.upsert({
      where: { slug: 'grand-tourisme' },
      update: {},
      create: {
        name: 'Grand Tourisme', slug: 'grand-tourisme',
        email: 'booking@grandtourisme.cm', phone: '+237 222 234 003',
        description: 'Voyages longue distance et circuits touristiques.',
        active: true, verified: true, commission: 0.045,
      }
    }),
  ]);
  console.log(`✅ ${agencies.length} agences créées`);

  // ── Stations ─────────────────────────────────────────────────────────
  const stationsData = [
    { id:'YDE', name:'Yaoundé — Mvan', terminal:'Gare Mvan', lat:3.8480, lng:11.5021, city:'Yaoundé', region:'Centre' },
    { id:'DLA', name:'Douala — Bonabéri', terminal:'Gare Bonabéri', lat:4.0483, lng:9.7044, city:'Douala', region:'Littoral' },
    { id:'BFT', name:'Bafoussam — Centre', terminal:'Gare Routière', lat:5.4764, lng:10.4175, city:'Bafoussam', region:'Ouest' },
    { id:'NGD', name:'Ngaoundéré — Gare', terminal:'Gare Routière', lat:7.3235, lng:13.5848, city:'Ngaoundéré', region:'Adamaoua' },
    { id:'LIM', name:'Limbé — Beach Rd', terminal:'Beach Road Terminal', lat:4.0228, lng:9.1867, city:'Limbé', region:'Sud-Ouest' },
    { id:'BUE', name:'Buéa — Long St', terminal:'Long Street Park', lat:4.1527, lng:9.2445, city:'Buéa', region:'Sud-Ouest' },
    { id:'EDO', name:'Ébolowa — Gare', terminal:'Gare Routière', lat:2.9000, lng:11.1500, city:'Ébolowa', region:'Sud' },
    { id:'BSG', name:'Bertoua — Terminus', terminal:'Terminus Central', lat:4.5766, lng:13.6840, city:'Bertoua', region:'Est' },
  ];
  for(const s of stationsData) {
    await prisma.station.upsert({ where:{id:s.id}, update:{}, create:s });
  }
  console.log(`✅ ${stationsData.length} stations créées`);

  // ── Users ─────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('busgo2026', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@busgo.cm' },
    update: {},
    create: {
      email: 'admin@busgo.cm', password: hash,
      name: 'Admin busGO', role: 'ADMIN',
      phone: '+237 222 000 001',
    }
  });
  const testUser = await prisma.user.upsert({
    where: { email: 'test@busgo.cm' },
    update: {},
    create: {
      email: 'test@busgo.cm', password: hash,
      name: 'Jean-Pierre Mbarga', role: 'USER',
      phone: '+237 677 123 456',
      loyaltyPoints: 250, loyaltyTier: 'SILVER',
      referralCode: 'MBARGA2026',
    }
  });
  console.log('✅ Utilisateurs admin et test créés');

  // ── Trips (trajets du jour) ───────────────────────────────────────────
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);

  function makeDate(base, hour, min=0) {
    const d = new Date(base);
    d.setHours(hour, min, 0, 0);
    return d;
  }

  const tripTemplates = [
    { fromId:'YDE', toId:'DLA', agencyIdx:0, price:4500, dh:6,  ah:9,  am:15, busType:'VIP Climatisé',  amenities:['Climatisation','Prises USB','WiFi'] },
    { fromId:'YDE', toId:'DLA', agencyIdx:1, price:4000, dh:8,  ah:11, am:15, busType:'Standard',       amenities:['Ventilation','Bagages inclus'] },
    { fromId:'YDE', toId:'DLA', agencyIdx:2, price:4700, dh:14, ah:17, am:15, busType:'VIP Climatisé',  amenities:['Climatisation','TV bord','Prises USB'] },
    { fromId:'DLA', toId:'YDE', agencyIdx:0, price:4500, dh:7,  ah:10, am:15, busType:'VIP Climatisé',  amenities:['Climatisation','Prises USB'] },
    { fromId:'DLA', toId:'YDE', agencyIdx:1, price:4000, dh:9,  ah:12, am:15, busType:'Standard',       amenities:['Ventilation'] },
    { fromId:'YDE', toId:'BFT', agencyIdx:0, price:5500, dh:7,  ah:11, am:30, busType:'VIP Climatisé',  amenities:['Climatisation','Prises USB'] },
    { fromId:'YDE', toId:'BFT', agencyIdx:1, price:4800, dh:10, ah:14, am:30, busType:'Standard',       amenities:['Ventilation'] },
    { fromId:'YDE', toId:'NGD', agencyIdx:2, price:9000, dh:6,  ah:15, am:0,  busType:'VIP Climatisé',  amenities:['Climatisation','WC bord','TV','Prises USB'] },
    { fromId:'DLA', toId:'LIM', agencyIdx:0, price:2000, dh:8,  ah:9,  am:30, busType:'Standard',       amenities:['Ventilation'] },
    { fromId:'YDE', toId:'EDO', agencyIdx:1, price:3200, dh:9,  ah:12, am:0,  busType:'Standard',       amenities:['Ventilation'] },
  ];

  let tripCount = 0;
  for(const t of tripTemplates) {
    for(const date of [today, tomorrow]) {
      await prisma.trip.create({
        data: {
          agencyId: agencies[t.agencyIdx].id,
          fromId: t.fromId, toId: t.toId,
          departureTime: makeDate(date, t.dh),
          arrivalTime:   makeDate(date, t.ah, t.am),
          price: t.price, totalSeats: 70, availableSeats: 70,
          busType: t.busType, amenities: t.amenities,
          status: 'SCHEDULED',
        }
      });
      tripCount++;
    }
  }
  console.log(`✅ ${tripCount} trajets créés (aujourd'hui + demain)`);

  console.log('\n🎉 Seed terminé avec succès !');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Admin  : admin@busgo.cm / busgo2026');
  console.log('👤 Test   : test@busgo.cm  / busgo2026');
  console.log('🔗 API    : http://localhost:4000/api');
  console.log('🎨 Front  : http://localhost:5173');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(e => { console.error('❌ Seed échoué :', e); process.exit(1); })
  .finally(async () => prisma.$disconnect());
