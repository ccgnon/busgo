// src/routes/admin.js — Dashboard administrateur busGO
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const prisma  = require('../lib/prisma');
const { adminOnly } = require('../middleware/auth');

router.use(adminOnly);

// ── GET /api/admin/stats ───────────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalTrips, activeTrips, totalBookings, confirmedBookings,
      cancelledBookings, totalUsers, totalAgencies, totalStations,
      revenue, recentBookings,
    ] = await Promise.all([
      prisma.trip.count(),
      prisma.trip.count({ where: { active: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.user.count(),
      prisma.agency.count(),
      prisma.station.count(),
      prisma.booking.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { totalPrice: true },
        _avg: { totalPrice: true },
      }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { trip: { include: { from: true, to: true } } },
      }),
    ]);

    // Réservations par jour (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dailyBookings = await prisma.booking.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: true,
    });

    // Top compagnies
    const topCompanies = await prisma.trip.groupBy({
      by: ['company'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    res.json({
      trips:     { total: totalTrips, active: activeTrips },
      bookings:  { total: totalBookings, confirmed: confirmedBookings, cancelled: cancelledBookings },
      users:     totalUsers,
      agencies:  totalAgencies,
      stations:  totalStations,
      revenue: {
        total:   Math.round(revenue._sum.totalPrice || 0),
        average: Math.round(revenue._avg.totalPrice || 0),
      },
      recentBookings: recentBookings.map(b => ({
        id: b.id, status: b.status, totalPrice: b.totalPrice,
        travelDate: b.travelDate, createdAt: b.createdAt,
        passengerName: b.passengerName,
        trip: b.trip ? { from: b.trip.from.name, to: b.trip.to.name, dep: b.trip.depTime, company: b.trip.company } : null,
      })),
      topCompanies: topCompanies.map(c => ({ company: c.company, trips: c._count.id })),
    });
  } catch (err) { next(err); }
});

// ── GET /api/admin/bookings ────────────────────────────────────────────────────
router.get('/bookings', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (status) where.status = status;
    if (search) where.OR = [
      { id:             { contains: search, mode: 'insensitive' } },
      { passengerName:  { contains: search, mode: 'insensitive' } },
      { passengerPhone: { contains: search, mode: 'insensitive' } },
      { validationCode: { contains: search, mode: 'insensitive' } },
    ];

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { trip: { include: { from: true, to: true } } },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({ bookings: bookings.map(fmt), total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

// ── GET /api/admin/users ───────────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { agency: { select: { name: true } }, _count: { select: { bookings: true } } },
    });
    res.json(users.map(u => ({
      id: u.id, email: u.email, name: u.name, role: u.role,
      phone: u.phone, agency: u.agency?.name || null,
      bookings: u._count.bookings, createdAt: u.createdAt,
    })));
  } catch (err) { next(err); }
});

// ── PATCH /api/admin/users/:id ─────────────────────────────────────────────────
router.patch('/users/:id', async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data:  { role },
    });
    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (err) { next(err); }
});

// ── GET /api/admin/agencies ────────────────────────────────────────────────────
router.get('/agencies', async (req, res, next) => {
  try {
    const agencies = await prisma.agency.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { trips: true, users: true } },
      },
    });
    res.json(agencies.map(a => ({
      id: a.id, name: a.name, slug: a.slug, email: a.email,
      phone: a.phone, active: a.active, verified: a.verified,
      trips: a._count.trips, users: a._count.users, createdAt: a.createdAt,
    })));
  } catch (err) { next(err); }
});

// ── POST /api/admin/agencies ───────────────────────────────────────────────────
router.post('/agencies', async (req, res, next) => {
  try {
    const { name, email, phone, description } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name et email requis' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const agency = await prisma.agency.create({
      data: { name, slug, email, phone, description },
    });
    res.status(201).json(agency);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Agence déjà existante' });
    next(err);
  }
});

// ── PATCH /api/admin/agencies/:id ─────────────────────────────────────────────
router.patch('/agencies/:id', async (req, res, next) => {
  try {
    const { active, verified, name, email, phone } = req.body;
    const agency = await prisma.agency.update({
      where: { id: req.params.id },
      data:  { active, verified, name, email, phone },
    });
    res.json(agency);
  } catch (err) { next(err); }
});

// ── GET /api/admin/trips ───────────────────────────────────────────────────────
router.get('/trips', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, active } = req.query;
    const skip  = (parseInt(page)-1) * parseInt(limit);
    const where = {};
    if (active !== undefined) where.active = active === 'true';
    if (search) where.OR = [
      { company: { contains: search, mode: 'insensitive' } },
    ];
    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          from: true, to: true,
          agency: { select: { name: true } },
          _count: { select: { bookings: true, seatSlots: true } },
        },
      }),
      prisma.trip.count({ where }),
    ]);
    res.json({
      trips: trips.map(t => ({
        id: t.id, company: t.company, depTime: t.depTime, arrTime: t.arrTime,
        from: t.from.name, to: t.to.name, price: t.price, active: t.active,
        agency: t.agency?.name || null, totalSeats: t.totalSeats,
        bookings: t._count.bookings, durationMin: t.durationMin,
        amenities: t.amenities, createdAt: t.createdAt,
      })),
      total, page: parseInt(page), pages: Math.ceil(total/parseInt(limit)),
    });
  } catch (err) { next(err); }
});

// ── PATCH /api/admin/trips/:id ─────────────────────────────────────────────────
router.patch('/trips/:id', async (req, res, next) => {
  try {
    const { active, price } = req.body;
    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data:  { active, price },
    });
    res.json({ id: trip.id, active: trip.active, price: trip.price });
  } catch (err) { next(err); }
});

// ── DELETE /api/admin/trips/:id ────────────────────────────────────────────────
router.delete('/trips/:id', async (req, res, next) => {
  try {
    await prisma.trip.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

function fmt(b) {
  return {
    id: b.id, status: b.status, totalPrice: b.totalPrice,
    travelDate: b.travelDate, seatNum: b.seatNum, pax: b.pax,
    paymentMethod: b.paymentMethod, validationCode: b.validationCode,
    passengerName: b.passengerName, passengerPhone: b.passengerPhone,
    createdAt: b.createdAt, cancelledAt: b.cancelledAt,
    trip: b.trip ? { from: b.trip.from.name, to: b.trip.to.name, dep: b.trip.depTime, company: b.trip.company } : null,
  };
}

module.exports = router;
