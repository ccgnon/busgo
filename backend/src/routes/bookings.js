const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();

function genRef() {
  return 'BG-' + Math.random().toString(36).substring(2,8).toUpperCase();
}
function genValidationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/bookings — Créer une réservation
router.post('/', async (req, res) => {
  const { tripId, seatNum, pax=1, paymentMethod, passengerName, passengerPhone, userId } = req.body;
  if (!tripId || !seatNum || !paymentMethod || !passengerName || !passengerPhone) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  try {
    // Vérifier disponibilité (verrou Redis possible ici)
    const trip = await prisma.trip.findUnique({ where:{ id:tripId } });
    if (!trip) return res.status(404).json({ error: 'Trajet introuvable' });
    if (trip.availableSeats < pax) return res.status(409).json({ error: 'Plus de places disponibles' });

    // Vérifier si le siège est déjà pris
    const seatTaken = await prisma.seatSlot.findUnique({
      where: { tripId_seatNum: { tripId, seatNum: parseInt(seatNum) } }
    });
    if (seatTaken && ['CONFIRMED','BOARDING'].includes(seatTaken.status)) {
      return res.status(409).json({ error: 'Ce siège est déjà réservé' });
    }

    const serviceFee = 500;
    const totalPrice = trip.price * pax + serviceFee;
    const bookingId  = genRef();
    const validationCode = genValidationCode();

    const booking = await prisma.$transaction(async (tx) => {
      // Créer la réservation
      const bk = await tx.booking.create({
        data: {
          id: bookingId, tripId, userId: userId||null,
          seatNum: parseInt(seatNum), pax: parseInt(pax),
          paymentMethod, unitPrice: trip.price,
          serviceFee, totalPrice,
          travelDate: trip.departureTime.toISOString().split('T')[0],
          passengerName, passengerPhone,
          validationCode,
          status: 'CONFIRMED',
        }
      });
      // Créer/mettre à jour le slot de siège
      await tx.seatSlot.upsert({
        where: { tripId_seatNum: { tripId, seatNum: parseInt(seatNum) } },
        update: { bookingId: bk.id, status: 'CONFIRMED' },
        create: { tripId, seatNum: parseInt(seatNum), bookingId: bk.id, status: 'CONFIRMED' },
      });
      // Décrementer les places
      await tx.trip.update({
        where: { id: tripId },
        data: { availableSeats: { decrement: parseInt(pax) } }
      });
      return bk;
    });

    // TODO: Envoyer SMS Africa's Talking
    // await sendSMS(passengerPhone, `busGO: Réservation ${bookingId} confirmée. Code validation: ${validationCode}`)

    res.status(201).json({
      ...booking,
      message: `Réservation ${bookingId} confirmée ! Code: ${validationCode}`
    });
  } catch (e) {
    console.error('[BOOKING ERROR]', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/bookings/my — Mes réservations
router.get('/my', authenticate, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        trip: {
          include: {
            agency: { select:{ name:true, logo:true } },
            from:   { select:{ name:true, city:true } },
            to:     { select:{ name:true, city:true } },
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/bookings/:id — Détail réservation
router.get('/:id', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        trip: { include: { agency:true, from:true, to:true } }
      }
    });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
    res.json(booking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/bookings/:id/cancel
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({ where:{ id:req.params.id } });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès interdit' });
    }
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Déjà annulée' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where:{ id:booking.id }, data:{ status:'CANCELLED', cancelledAt: new Date() }
      });
      await tx.seatSlot.updateMany({
        where:{ bookingId:booking.id }, data:{ status:'CANCELLED', bookingId:null }
      });
      await tx.trip.update({
        where:{ id:booking.tripId },
        data:{ availableSeats:{ increment:booking.pax } }
      });
    });
    res.json({ message: 'Réservation annulée' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/bookings/:id/validate — Valider à l'embarquement
router.post('/:id/validate', authenticate, requireRole('ADMIN','AGENCY'), async (req, res) => {
  const { code } = req.body;
  try {
    const booking = await prisma.booking.findUnique({ where:{ id:req.params.id } });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
    if (booking.validationCode !== code) return res.status(400).json({ error: 'Code invalide' });
    if (booking.status === 'VALIDATED') return res.status(400).json({ error: 'Déjà validée' });

    const updated = await prisma.booking.update({
      where:{ id:booking.id },
      data:{ status:'VALIDATED', validatedAt: new Date() }
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
