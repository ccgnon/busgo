const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();

router.use(authenticate, requireRole('ADMIN'));

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalBookings, totalRevenue, totalUsers, totalTrips] = await Promise.all([
      prisma.booking.count({ where:{ status:{ not:'CANCELLED' } } }),
      prisma.booking.aggregate({ where:{ status:{ not:'CANCELLED' } }, _sum:{ totalPrice:true } }),
      prisma.user.count({ where:{ role:'USER' } }),
      prisma.trip.count({ where:{ status:'SCHEDULED' } }),
    ]);
    res.json({
      totalBookings,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      totalUsers,
      totalTrips,
    });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// GET /api/admin/bookings
router.get('/bookings', async (req, res) => {
  const { page=1, limit=20, status } = req.query;
  try {
    const where = status ? { status } : {};
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where, skip:(page-1)*limit, take:parseInt(limit),
        include:{ trip:{ include:{ from:true, to:true, agency:true } }, user:{ select:{ name:true, email:true } } },
        orderBy:{ createdAt:'desc' }
      }),
      prisma.booking.count({ where }),
    ]);
    res.json({ bookings, total, pages: Math.ceil(total/limit) });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

module.exports = router;
