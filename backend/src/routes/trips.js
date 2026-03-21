// src/routes/trips.js
const express = require('express');
const router  = express.Router();
const prisma  = require('../lib/prisma');
const { enrichTripsWithDynamicPrices } = require('../services/dynamicPricing');

// ── GET /api/trips/stations ────────────────────────────────────────────────────
router.get('/stations', async (req, res, next) => {
  try {
    const stations = await prisma.station.findMany({ orderBy: { name: 'asc' } });
    res.json(stations);
  } catch (err) { next(err); }
});

// ── GET /api/trips/search?from=Paris&to=Lyon&date=2026-03-15&pax=1 ─────────────
router.get('/search', async (req, res, next) => {
  try {
    const { from, to, date, pax = '1' } = req.query;

    if (!from || !to)   return res.status(400).json({ error: 'from et to sont requis' });
    if (from === to)    return res.status(400).json({ error: 'Départ et arrivée doivent être différents' });

    const count = parseInt(pax, 10);
    if (isNaN(count) || count < 1 || count > 9)
      return res.status(400).json({ error: 'Nombre de passagers invalide (1-9)' });

    const trips = await prisma.trip.findMany({
      where: {
        active: true,
        from:   { name: { equals: from, mode: 'insensitive' } },
        to:     { name: { equals: to,   mode: 'insensitive' } },
      },
      include: {
        from: true,
        to:   true,
        seatSlots: { select: { seatNum: true, status: true } },
      },
      orderBy: { depTime: 'asc' },
    });

    const results = trips
      .map(t => {
        const freeSeats = t.seatSlots.filter(s => s.status === 'FREE').length;
        return {
          id:             t.id,
          from:           t.from.name,
          to:             t.to.name,
          fromStation:    t.from,
          toStation:      t.to,
          dep:            t.depTime,
          arr:            t.arrTime,
          dur:            t.durationMin,
          stops:          t.stops,
          unitPrice:      t.price,
          totalPrice:     Math.round(t.price * count + 500),
          company:        t.company,
          totalSeats:     t.totalSeats,
          availableSeats: freeSeats,
          amenities:      t.amenities,
          rating:         t.rating,
        };
      })
      .filter(t => t.availableSeats >= count);

    const enriched = await enrichTripsWithDynamicPrices(results, date);
    res.json({
      from, to,
      date: date || new Date().toISOString().split('T')[0],
      pax: count,
      count: enriched.length,
      trips: enriched,
    });
  } catch (err) { next(err); }
});

// ── GET /api/trips/:id — full detail including seat map ────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        from:      true,
        to:        true,
        seatSlots: { orderBy: { seatNum: 'asc' } },
      },
    });
    if (!trip) return res.status(404).json({ error: 'Trajet introuvable' });

    const takenSeats     = trip.seatSlots.filter(s => s.status === 'TAKEN').map(s => s.seatNum);
    const availableSeats = trip.totalSeats - takenSeats.length;

    res.json({
      id:             trip.id,
      from:           trip.from.name,
      to:             trip.to.name,
      fromStation:    trip.from,
      toStation:      trip.to,
      dep:            trip.depTime,
      arr:            trip.arrTime,
      dur:            trip.durationMin,
      stops:          trip.stops,
      price:          trip.price,
      company:        trip.company,
      totalSeats:     trip.totalSeats,
      availableSeats,
      takenSeats,
      amenities:      trip.amenities,
      rating:         trip.rating,
    });
  } catch (err) { next(err); }
});

module.exports = router;
