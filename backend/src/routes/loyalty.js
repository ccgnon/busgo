// src/routes/loyalty.js — Programme fidélité et parrainage
const express = require('express');
const router  = express.Router();
const prisma  = require('../lib/prisma');
const { authRequired } = require('../middleware/auth');
const { TIERS, generateReferralCode } = require('../services/loyalty');

// GET /api/loyalty/me — Mon profil fidélité
router.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, name: true, loyaltyPoints: true, loyaltyTier: true, referralCode: true },
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    if (!user.referralCode) {
      user.referralCode = await generateReferralCode(user.id);
    }

    const tier  = TIERS[user.loyaltyTier] || TIERS.BRONZE;
    const next_ = Object.entries(TIERS).find(([k, v]) => v.min > user.loyaltyPoints);

    const logs = await prisma.loyaltyLog.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take:    10,
    });

    const referrals = await prisma.referral.count({
      where: { referrerId: req.user.id },
    });

    res.json({
      points:       user.loyaltyPoints,
      tier:         user.loyaltyTier,
      tierLabel:    tier.label,
      tierBadge:    tier.badge,
      discount:     tier.discount,
      referralCode: user.referralCode,
      referrals,
      nextTier: next_ ? {
        name:   next_[1].label,
        points: next_[1].min,
        needed: next_[1].min - user.loyaltyPoints,
      } : null,
      logs: logs.map(l => ({ points: l.points, reason: l.reason, date: l.createdAt })),
    });
  } catch (err) { next(err); }
});

// GET /api/loyalty/referral/:code — Vérifier un code parrainage
router.get('/referral/:code', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { referralCode: req.params.code },
      select: { id: true, name: true, loyaltyTier: true },
    });
    if (!user) return res.status(404).json({ valid: false, error: 'Code invalide' });
    res.json({ valid: true, referrerName: user.name.split(' ')[0], tier: user.loyaltyTier });
  } catch (err) { next(err); }
});

module.exports = router;
