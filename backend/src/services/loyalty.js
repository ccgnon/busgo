// src/services/loyalty.js — Programme de fidélité busGO
const prisma = require('../lib/prisma');

// 1 point par tranche de 1000 FCFA dépensée
const POINTS_PER_1000 = 1;

const TIERS = {
  BRONZE:   { min: 0,   discount: 0,    label: 'Bronze',   badge: '🥉' },
  SILVER:   { min: 50,  discount: 0.05, label: 'Argent',   badge: '🥈' },
  GOLD:     { min: 200, discount: 0.10, label: 'Or',       badge: '🥇' },
  PLATINUM: { min: 500, discount: 0.15, label: 'Platine',  badge: '💎' },
};

function getTier(points) {
  if (points >= 500) return 'PLATINUM';
  if (points >= 200) return 'GOLD';
  if (points >= 50)  return 'SILVER';
  return 'BRONZE';
}

function calculatePoints(totalPrice) {
  return Math.floor(totalPrice / 1000) * POINTS_PER_1000;
}

function getDiscount(tier) {
  return TIERS[tier]?.discount || 0;
}

async function awardPoints(userId, totalPrice, bookingId) {
  if (!userId) return 0;
  const points = calculatePoints(totalPrice);
  if (points <= 0) return 0;

  const user = await prisma.user.update({
    where: { id: userId },
    data:  { loyaltyPoints: { increment: points } },
  });

  const newTier = getTier(user.loyaltyPoints);
  if (newTier !== user.loyaltyTier) {
    await prisma.user.update({
      where: { id: userId },
      data:  { loyaltyTier: newTier },
    });
  }

  await prisma.loyaltyLog.create({
    data: {
      userId,
      points,
      reason: `Réservation ${bookingId}`,
    },
  });

  return points;
}

async function processReferral(referralCode, newUserId) {
  if (!referralCode) return;
  try {
    const referrer = await prisma.user.findUnique({ where: { referralCode } });
    if (!referrer || referrer.id === newUserId) return;

    await prisma.referral.create({
      data: { referrerId: referrer.id, referredId: newUserId },
    });

    // Bonus parrain : 500 points
    await prisma.user.update({
      where: { id: referrer.id },
      data:  { loyaltyPoints: { increment: 500 } },
    });
    await prisma.loyaltyLog.create({
      data: { userId: referrer.id, points: 500, reason: 'Parrainage accepté' },
    });
  } catch (e) {
    console.error('Referral error:', e.message);
  }
}

async function generateReferralCode(userId) {
  const code = 'BG' + Math.random().toString(36).substring(2, 8).toUpperCase();
  await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
}

module.exports = { awardPoints, processReferral, generateReferralCode, getTier, getDiscount, TIERS, calculatePoints };
