// routes/admin.js — Routes administrateur busGO
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const prisma  = require('../lib/prisma');
const { adminOnly } = require('../middleware/auth');

// ── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', adminOnly, async (req, res, next) => {
  try {
    const [
      totalTrips, activeTrips, totalBookings, confirmed, cancelled, users, agencies,
      revenue, recent, topCo,
    ] = await Promise.all([
      prisma.trip.count(),
      prisma.trip.count({ where: { active: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.user.count(),
      prisma.agency.count(),
      prisma.booking.aggregate({ where: { status: 'CONFIRMED' }, _sum: { totalPrice: true }, _avg: { totalPrice: true } }),
      prisma.booking.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { trip: { include: { from: true, to: true } } } }),
      prisma.trip.groupBy({ by: ['company'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 }),
    ]);
    res.json({
      trips: { total: totalTrips, active: activeTrips },
      bookings: { total: totalBookings, confirmed, cancelled },
      users, agencies,
      revenue: { total: Math.round(revenue._sum.totalPrice || 0), average: Math.round(revenue._avg.totalPrice || 0) },
      recentBookings: recent.map(b => ({
        id: b.id, status: b.status, totalPrice: b.totalPrice, travelDate: b.travelDate,
        passengerName: b.passengerName, createdAt: b.createdAt,
        trip: b.trip ? { from: b.trip.from.name, to: b.trip.to.name, company: b.trip.company } : null,
      })),
      topCompanies: topCo.map(c => ({ company: c.company, trips: c._count.id })),
    });
  } catch (err) { next(err); }
});

// ── GET /api/admin/bookings ──────────────────────────────────────────────────
router.get('/bookings', adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (status) where.status = status;
    if (search) where.OR = [
      { id:             { contains: search, mode: 'insensitive' } },
      { passengerName:  { contains: search, mode: 'insensitive' } },
      { passengerPhone: { contains: search } },
      { validationCode: { contains: search } },
    ];
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
        include: { trip: { include: { from: true, to: true } } },
      }),
      prisma.booking.count({ where }),
    ]);
    res.json({
      bookings: bookings.map(b => ({
        id: b.id, status: b.status, totalPrice: b.totalPrice, travelDate: b.travelDate,
        seatNum: b.seatNum, pax: b.pax, paymentMethod: b.paymentMethod,
        passengerName: b.passengerName, passengerPhone: b.passengerPhone,
        validationCode: b.validationCode, createdAt: b.createdAt,
        trip: b.trip ? { from: b.trip.from.name, to: b.trip.to.name, company: b.trip.company, depTime: b.trip.depTime } : null,
      })),
      total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) { next(err); }
});

// ── DELETE /api/admin/bookings/:id (annuler) ─────────────────────────────────
router.delete('/bookings/:id', adminOnly, async (req, res, next) => {
  try {
    const b = await prisma.booking.update({
      where: { id: req.params.id },
      data:  { status: 'CANCELLED', cancelledAt: new Date() },
    });
    await prisma.seatSlot.updateMany({
      where: { bookingId: req.params.id },
      data:  { status: 'FREE', bookingId: null },
    });
    res.json({ success: true, booking: b });
  } catch (err) { next(err); }
});

// ── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', adminOnly, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        agency: { select: { name: true } },
        _count: { select: { bookings: true } },
      },
    });
    res.json(users.map(u => ({
      id: u.id, email: u.email, name: u.name, role: u.role,
      phone: u.phone, agency: u.agency?.name || null,
      agencyId: u.agencyId,
      bookings: u._count.bookings,
      loyaltyPoints: u.loyaltyPoints,
      createdAt: u.createdAt,
    })));
  } catch (err) { next(err); }
});

// ── POST /api/admin/users — créer un utilisateur ─────────────────────────────
router.post('/users', adminOnly, async (req, res, next) => {
  try {
    const { name, email, password, role, phone, agencyId } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email et password requis' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Mot de passe : 8 caractères minimum' });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email déjà utilisé' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name, email, passwordHash,
        role:     role || 'USER',
        phone:    phone || null,
        agencyId: agencyId || null,
      },
    });
    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) { next(err); }
});

// ── PATCH /api/admin/users/:id ───────────────────────────────────────────────
router.patch('/users/:id', adminOnly, async (req, res, next) => {
  try {
    const { role, agencyId, name, phone } = req.body;
    const data = {};
    if (role)     data.role     = role;
    if (name)     data.name     = name;
    if (phone !== undefined) data.phone = phone;
    if (agencyId !== undefined) data.agencyId = agencyId || null;
    const u = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json({ id: u.id, email: u.email, role: u.role, name: u.name });
  } catch (err) { next(err); }
});

// ── DELETE /api/admin/users/:id ──────────────────────────────────────────────
router.delete('/users/:id', adminOnly, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── GET /api/admin/agencies ──────────────────────────────────────────────────
router.get('/agencies', adminOnly, async (req, res, next) => {
  try {
    const agencies = await prisma.agency.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { trips: true, users: true } } },
    });
    res.json(agencies.map(a => ({
      id: a.id, name: a.name, slug: a.slug, email: a.email, phone: a.phone,
      active: a.active, verified: a.verified,
      trips: a._count.trips, users: a._count.users,
      createdAt: a.createdAt,
    })));
  } catch (err) { next(err); }
});

// ── POST /api/admin/agencies ─────────────────────────────────────────────────
router.post('/agencies', adminOnly, async (req, res, next) => {
  try {
    const { name, email, phone, description } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name et email requis' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const agency = await prisma.agency.create({ data: { name, slug, email, phone, description } });
    res.status(201).json(agency);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Une agence avec ce nom ou cet email existe déjà' });
    next(err);
  }
});

// ── PATCH /api/admin/agencies/:id ────────────────────────────────────────────
router.patch('/agencies/:id', adminOnly, async (req, res, next) => {
  try {
    const { active, verified, name, email, phone, description } = req.body;
    const data = {};
    if (active    !== undefined) data.active    = active;
    if (verified  !== undefined) data.verified  = verified;
    if (name)      data.name      = name;
    if (email)     data.email     = email;
    if (phone      !== undefined) data.phone     = phone;
    if (description!== undefined) data.description = description;
    const a = await prisma.agency.update({ where: { id: req.params.id }, data });
    res.json(a);
  } catch (err) { next(err); }
});

// ── DELETE /api/admin/agencies/:id ───────────────────────────────────────────
router.delete('/agencies/:id', adminOnly, async (req, res, next) => {
  try {
    // Détacher les utilisateurs de l'agence avant suppression
    await prisma.user.updateMany({
      where: { agencyId: req.params.id },
      data:  { agencyId: null, role: 'USER' },
    });
    await prisma.agency.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── GET /api/admin/trips ─────────────────────────────────────────────────────
router.get('/trips', adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, active } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where = active !== undefined ? { active: active === 'true' } : {};
    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
        include: {
          from: true, to: true,
          agency: { select: { name: true } },
          _count: { select: { bookings: true } },
        },
      }),
      prisma.trip.count({ where }),
    ]);
    res.json({
      trips: trips.map(t => ({
        id: t.id, company: t.company,
        from: t.from.name, to: t.to.name,
        depTime: t.depTime, arrTime: t.arrTime,
        price: t.price, active: t.active,
        agency: t.agency?.name || null,
        totalSeats: t.totalSeats,
        bookings: t._count.bookings,
        createdAt: t.createdAt,
      })),
      total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) { next(err); }
});

// ── PATCH /api/admin/trips/:id ───────────────────────────────────────────────
router.patch('/trips/:id', adminOnly, async (req, res, next) => {
  try {
    const { price, active, depTime, arrTime } = req.body;
    const data = {};
    if (price   !== undefined) data.price   = parseFloat(price);
    if (active  !== undefined) data.active  = active;
    if (depTime !== undefined) data.depTime = depTime;
    if (arrTime !== undefined) data.arrTime = arrTime;
    const t = await prisma.trip.update({ where: { id: req.params.id }, data });
    res.json({ id: t.id, active: t.active, price: t.price });
  } catch (err) { next(err); }
});

// ── DELETE /api/admin/trips/:id ──────────────────────────────────────────────
router.delete('/trips/:id', adminOnly, async (req, res, next) => {
  try {
    await prisma.booking.updateMany({
      where: { tripId: req.params.id, status: 'CONFIRMED' },
      data:  { status: 'CANCELLED', cancelledAt: new Date() },
    });
    await prisma.seatSlot.deleteMany({ where: { tripId: req.params.id } });
    await prisma.trip.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
