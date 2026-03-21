// src/routes/reviews.js — Avis et notation voyageurs
const express = require('express');
const router  = express.Router();
const prisma  = require('../lib/prisma');
const { authRequired, authOptional } = require('../middleware/auth');

// POST /api/reviews — Soumettre un avis
router.post('/', authOptional, async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;
    if (!bookingId || !rating) return res.status(400).json({ error: 'bookingId et rating requis' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Note entre 1 et 5' });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true },
    });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
    if (booking.status !== 'CONFIRMED' && booking.status !== 'VALIDATED')
      return res.status(400).json({ error: 'Vous ne pouvez noter qu\'un voyage effectué' });

    const review = await prisma.review.upsert({
      where:  { bookingId },
      create: { bookingId, tripId: booking.tripId, userId: req.user?.id || null, rating, comment },
      update: { rating, comment },
    });

    // Recalculer la note moyenne du trajet
    const agg = await prisma.review.aggregate({
      where:   { tripId: booking.tripId },
      _avg:    { rating: true },
      _count:  { id: true },
    });
    await prisma.trip.update({
      where: { id: booking.tripId },
      data:  {
        rating:      parseFloat((agg._avg.rating || 4).toFixed(1)),
        ratingCount: agg._count.id,
      },
    });

    res.status(201).json(review);
  } catch (err) { next(err); }
});

// GET /api/reviews/trip/:tripId — Avis d'un trajet
router.get('/trip/:tripId', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where:   { tripId: req.params.tripId },
      orderBy: { createdAt: 'desc' },
      take:    20,
      include: { booking: { select: { passengerName: true } } },
    });
    const agg = await prisma.review.aggregate({
      where:  { tripId: req.params.tripId },
      _avg:   { rating: true },
      _count: { id: true },
    });
    res.json({
      reviews: reviews.map(r => ({
        id: r.id, rating: r.rating, comment: r.comment,
        passengerName: r.booking?.passengerName || 'Voyageur anonyme',
        createdAt: r.createdAt,
      })),
      avgRating: parseFloat((agg._avg.rating || 0).toFixed(1)),
      count: agg._count.id,
    });
  } catch (err) { next(err); }
});

module.exports = router;
