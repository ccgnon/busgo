const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/users/profile
router.get('/profile', authenticate, async (req, res) => {
  const { password:_, ...user } = req.user;
  const logs = await prisma.loyaltyLog.findMany({
    where:{ userId:user.id }, orderBy:{ createdAt:'desc' }, take:10
  });
  res.json({ ...user, loyaltyLogs: logs });
});

// PATCH /api/users/profile
router.patch('/profile', authenticate, async (req, res) => {
  const { name, phone } = req.body;
  try {
    const updated = await prisma.user.update({
      where:{ id:req.user.id },
      data: { name, phone },
      select:{ id:true, email:true, name:true, phone:true, role:true, loyaltyPoints:true, loyaltyTier:true }
    });
    res.json(updated);
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// GET /api/users/notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifs = await prisma.notification.findMany({
      where:{ userId:req.user.id },
      orderBy:{ createdAt:'desc' }, take:30
    });
    res.json(notifs);
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// PATCH /api/users/notifications/:id/read
router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where:{ id:req.params.id, userId:req.user.id }, data:{ read:true }
    });
    res.json({ ok:true });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

module.exports = router;
