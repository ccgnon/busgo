// src/services/cron.js — Tâches planifiées busGO
const cron   = require('node-cron');
const prisma = require('../lib/prisma');
const { sendReminderSMS } = require('./sms');
const { sendReminderEmail } = require('./email');

function startCronJobs() {

  // ── Marquer les billets expirés (chaque nuit à 1h) ─────────────────────────
  cron.schedule('0 1 * * *', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res   = await prisma.booking.updateMany({
      where:  { status: 'CONFIRMED', travelDate: { lt: today } },
      data:   { status: 'EXPIRED' },
    });
    if (res.count > 0) console.log(`[CRON] ${res.count} billets marqués EXPIRED`);
  }, { timezone: 'Africa/Douala' });

  // ── Rappels SMS J-1 (chaque jour à 14h) ────────────────────────────────────
  cron.schedule('0 14 * * *', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const bookings = await prisma.booking.findMany({
      where: {
        status:        'CONFIRMED',
        travelDate:    tomorrowStr,
        passengerPhone: { not: null },
        smsSentAt:     null,
      },
      include: { trip: { include: { from: true, to: true } } },
      take: 100,
    });

    for (const b of bookings) {
      try {
        const formatted = {
          ...b,
          trip: b.trip ? {
            from:    b.trip.from.name,
            to:      b.trip.to.name,
            dep:     b.trip.depTime,
            company: b.trip.company,
          } : null,
        };
        // Récupérer l'email
        let userEmail = null;
        if (b.userId) {
          const u = await prisma.user.findUnique({ where:{ id: b.userId }, select:{ email:true } });
          userEmail = u?.email;
        }
        const formattedWithEmail = { ...formatted, userEmail };

        const [smsResult] = await Promise.allSettled([
          sendReminderSMS(formattedWithEmail),
          sendReminderEmail(formattedWithEmail),
        ]);
        if (smsResult.value?.success || smsResult.status === 'fulfilled') {
          await prisma.booking.update({
            where: { id: b.id },
            data:  { smsSentAt: new Date() },
          });
        }
      } catch (e) {
        console.error(`[CRON SMS] Error for ${b.id}:`, e.message);
      }
    }
    if (bookings.length > 0)
      console.log(`[CRON] ${bookings.length} rappels SMS envoyés`);
  }, { timezone: 'Africa/Douala' });

  // ── Mettre à jour les tiers de fidélité (chaque dimanche à 3h) ─────────────
  cron.schedule('0 3 * * 0', async () => {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true, loyaltyPoints: true, loyaltyTier: true },
    });
    const { getTier } = require('./loyalty');
    let updated = 0;
    for (const u of users) {
      const newTier = getTier(u.loyaltyPoints);
      if (newTier !== u.loyaltyTier) {
        await prisma.user.update({ where: { id: u.id }, data: { loyaltyTier: newTier } });
        updated++;
      }
    }
    if (updated > 0) console.log(`[CRON] ${updated} tiers fidélité mis à jour`);
  }, { timezone: 'Africa/Douala' });

  console.log('⏰ Tâches CRON démarrées (Africa/Douala)');
}

module.exports = { startCronJobs };
