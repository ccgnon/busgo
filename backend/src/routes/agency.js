// src/routes/agency.js — Portail agence : gestion de leurs propres trajets
const express = require('express');
const router  = express.Router();
const prisma  = require('../lib/prisma');
const { agencyOrAdmin } = require('../middleware/auth');

router.use(agencyOrAdmin);

// Helper : agencyId de l'utilisateur connecté (ou null si admin)
function getAgencyId(req) {
  if (req.dbUser.role === 'ADMIN') return req.query.agencyId || null;
  return req.dbUser.agencyId;
}

// ── GET /api/agency/me ─────────────────────────────────────────────────────────
router.get('/me', async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    if (!agencyId) return res.json({ admin: true, user: req.dbUser });
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      include: { _count: { select: { trips: true, users: true } } },
    });
    res.json(agency);
  } catch (err) { next(err); }
});

// ── GET /api/agency/stats ──────────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    const tripWhere  = agencyId ? { agencyId } : {};

    const [totalTrips, activeTrips, revenue, recentBookings, topRoutes] = await Promise.all([
      prisma.trip.count({ where: { ...tripWhere } }),
      prisma.trip.count({ where: { ...tripWhere, active: true } }),
      prisma.booking.aggregate({
        where: { status: 'CONFIRMED', trip: tripWhere },
        _sum:  { totalPrice: true },
        _count: true,
        _avg:  { totalPrice: true },
      }),
      prisma.booking.findMany({
        take: 8, orderBy: { createdAt: 'desc' },
        where: { trip: tripWhere },
        include: { trip: { include: { from: true, to: true } } },
      }),
      prisma.booking.groupBy({
        by: ['tripId'],
        where: { status: 'CONFIRMED', trip: tripWhere },
        _count: { id: true },
        _sum:   { totalPrice: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    res.json({
      trips: { total: totalTrips, active: activeTrips },
      revenue: {
        total:    Math.round(revenue._sum.totalPrice || 0),
        bookings: revenue._count,
        average:  Math.round(revenue._avg.totalPrice || 0),
      },
      recentBookings: recentBookings.map(b => ({
        id: b.id, status: b.status, totalPrice: b.totalPrice,
        travelDate: b.travelDate, passengerName: b.passengerName,
        createdAt: b.createdAt,
        trip: b.trip ? { from: b.trip.from.name, to: b.trip.to.name, dep: b.trip.depTime } : null,
      })),
    });
  } catch (err) { next(err); }
});

// ── GET /api/agency/trips ──────────────────────────────────────────────────────
router.get('/trips', async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    const { page = 1, limit = 20, active } = req.query;
    const skip  = (parseInt(page)-1) * parseInt(limit);
    const where = agencyId ? { agencyId } : {};
    if (active !== undefined) where.active = active === 'true';

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where, skip, take: parseInt(limit),
        orderBy: [{ fromId: 'asc' }, { depTime: 'asc' }],
        include: {
          from: true, to: true,
          _count: { select: { bookings: true } },
          seatSlots: { where: { status: 'FREE' }, select: { id: true } },
        },
      }),
      prisma.trip.count({ where }),
    ]);

    res.json({
      trips: trips.map(t => ({
        id: t.id, company: t.company, from: t.from.name, to: t.to.name,
        depTime: t.depTime, arrTime: t.arrTime, durationMin: t.durationMin,
        price: t.price, active: t.active, totalSeats: t.totalSeats,
        freeSeats: t.seatSlots.length, bookings: t._count.bookings,
        amenities: t.amenities, stops: t.stops, rating: t.rating,
        createdAt: t.createdAt,
      })),
      total, page: parseInt(page), pages: Math.ceil(total/parseInt(limit)),
    });
  } catch (err) { next(err); }
});

// ── POST /api/agency/trips ─────────────────────────────────────────────────────
router.post('/trips', async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    const { fromCity, toCity, depTime, arrTime, durationMin, price, totalSeats = 70, amenities = [], stops = 0 } = req.body;

    if (!fromCity || !toCity || !depTime || !arrTime || !price)
      return res.status(400).json({ error: 'fromCity, toCity, depTime, arrTime, price requis' });

    const [fromStation, toStation] = await Promise.all([
      prisma.station.findFirst({ where: { name: { equals: fromCity, mode: 'insensitive' } } }),
      prisma.station.findFirst({ where: { name: { equals: toCity,   mode: 'insensitive' } } }),
    ]);
    if (!fromStation) return res.status(400).json({ error: `Gare inconnue : ${fromCity}` });
    if (!toStation)   return res.status(400).json({ error: `Gare inconnue : ${toCity}` });

    const agency = agencyId ? await prisma.agency.findUnique({ where: { id: agencyId } }) : null;

    const trip = await prisma.trip.create({
      data: {
        fromId: fromStation.id, toId: toStation.id,
        depTime, arrTime,
        durationMin: parseInt(durationMin) || 0,
        price: parseFloat(price), priceFCFA: parseFloat(price),
        company: agency?.name || req.dbUser.name,
        agencyId: agencyId || null,
        totalSeats: parseInt(totalSeats),
        amenities, stops: parseInt(stops),
        serviceFee: 500,
        seatSlots: {
          create: Array.from({ length: parseInt(totalSeats) }, (_, i) => ({
            seatNum: i + 1, status: 'FREE',
          })),
        },
      },
      include: { from: true, to: true },
    });

    res.status(201).json({
      id: trip.id, from: trip.from.name, to: trip.to.name,
      depTime: trip.depTime, price: trip.price, company: trip.company,
    });
  } catch (err) { next(err); }
});

// ── PATCH /api/agency/trips/:id ────────────────────────────────────────────────
router.patch('/trips/:id', async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) return res.status(404).json({ error: 'Trajet introuvable' });
    if (agencyId && trip.agencyId !== agencyId)
      return res.status(403).json({ error: 'Ce trajet n\'appartient pas à votre agence' });

    const { depTime, arrTime, price, active, amenities, durationMin, stops } = req.body;
    const updated = await prisma.trip.update({
      where: { id: req.params.id },
      data:  { depTime, arrTime, price, active, amenities, durationMin, stops },
    });
    res.json({ id: updated.id, active: updated.active, price: updated.price });
  } catch (err) { next(err); }
});

// ── DELETE /api/agency/trips/:id ───────────────────────────────────────────────
router.delete('/trips/:id', async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) return res.status(404).json({ error: 'Trajet introuvable' });
    if (agencyId && trip.agencyId !== agencyId)
      return res.status(403).json({ error: 'Ce trajet n\'appartient pas à votre agence' });
    await prisma.trip.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── GET /api/agency/bookings ───────────────────────────────────────────────────
router.get('/bookings', async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page)-1) * parseInt(limit);
    const tripWhere = agencyId ? { agencyId } : {};

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where:   { trip: tripWhere },
        skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { trip: { include: { from: true, to: true } } },
      }),
      prisma.booking.count({ where: { trip: tripWhere } }),
    ]);

    res.json({
      bookings: bookings.map(b => ({
        id: b.id, status: b.status, totalPrice: b.totalPrice,
        travelDate: b.travelDate, seatNum: b.seatNum, pax: b.pax,
        passengerName: b.passengerName, passengerPhone: b.passengerPhone,
        validationCode: b.validationCode, createdAt: b.createdAt,
        trip: b.trip ? { from: b.trip.from.name, to: b.trip.to.name, dep: b.trip.depTime, company: b.trip.company } : null,
      })),
      total, page: parseInt(page), pages: Math.ceil(total/parseInt(limit)),
    });
  } catch (err) { next(err); }
});

module.exports = router;
