const router  = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const prisma   = new PrismaClient();

function genRef() {
  return 'BG-' + Date.now().toString(36).toUpperCase() + '-' +
         Math.random().toString(36).substring(2, 5).toUpperCase();
}
function genValidationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function genQRData(bookingId, validationCode) {
  return `busgo:${bookingId}:${validationCode}`;
}

// ─── Méthode de paiement : mapping frontend → enum Prisma ───────────────────
const PAY_MAP = {
  momo:    'MTN_MOMO',
  om:      'ORANGE_MONEY',
  card:    'CARD',
  cash:    'CARD',       // fallback — pas d'enum CASH dans le schema
  especes: 'CARD',
  MTN_MOMO:     'MTN_MOMO',
  ORANGE_MONEY: 'ORANGE_MONEY',
  CARD:         'CARD',
};

// ─── POST /api/bookings — Créer une réservation ──────────────────────────────
router.post('/', authenticate, async (req, res) => {
  // Accepte les deux formats : ancien (seatNum/passengerName) et nouveau (passengers/seats)
  const {
    tripId,
    // nouveau format (BookingFlow.jsx)
    passengers,
    seats,
    paymentMethod,
    paymentPhone,
    // ancien format (legacy)
    seatNum,
    passengerName,
    passengerPhone,
    pax,
  } = req.body;

  if (!tripId || !paymentMethod) {
    return res.status(400).json({ error: 'tripId et paymentMethod sont requis' });
  }

  // Normalisation
  const nbPax         = seats || pax || (passengers?.length) || 1;
  const mainPassenger = passengers?.[0] || { name: passengerName, phone: passengerPhone };
  const mainSeat      = seatNum || 1;
  const payMethod     = PAY_MAP[paymentMethod] || 'MTN_MOMO';

  if (!mainPassenger?.name) {
    return res.status(400).json({ error: 'Le nom du passager principal est requis' });
  }

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip)                         return res.status(404).json({ error: 'Trajet introuvable' });
    if (trip.status === 'CANCELLED')   return res.status(409).json({ error: 'Ce voyage a été annulé' });
    if (trip.availableSeats < nbPax)   return res.status(409).json({ error: `Seulement ${trip.availableSeats} place(s) disponible(s)` });

    const serviceFee   = 500 * nbPax;
    const totalPrice   = trip.price * nbPax + serviceFee;
    const bookingId    = genRef();
    const validCode    = genValidationCode();
    const qrData       = genQRData(bookingId, validCode);

    // Trouver les premiers sièges libres si pas spécifiés
    const takenSeats = await prisma.seatSlot.findMany({
      where: { tripId, status: { in: ['CONFIRMED', 'PENDING'] } },
      select: { seatNum: true },
    });
    const takenNums = new Set(takenSeats.map(s => s.seatNum));
    const freeSeats = [];
    for (let n = 1; n <= trip.totalSeats && freeSeats.length < nbPax; n++) {
      if (!takenNums.has(n)) freeSeats.push(n);
    }
    if (freeSeats.length < nbPax) {
      return res.status(409).json({ error: 'Pas assez de sièges consécutifs disponibles' });
    }
    const assignedSeat = freeSeats[0];

    const booking = await prisma.$transaction(async (tx) => {
      const bk = await tx.booking.create({
        data: {
          id:             bookingId,
          tripId,
          userId:         req.user?.id || null,
          seatNum:        assignedSeat,
          pax:            parseInt(nbPax),
          paymentMethod:  payMethod,
          unitPrice:      trip.price,
          serviceFee,
          totalPrice,
          travelDate:     trip.departureTime.toISOString().split('T')[0],
          passengerName:  mainPassenger.name,
          passengerPhone: paymentPhone || mainPassenger.phone || '',
          validationCode: validCode,
          status:         'CONFIRMED',
        },
      });

      // Créer les SeatSlots pour chaque siège attribué
      for (const sn of freeSeats) {
        await tx.seatSlot.upsert({
          where:  { tripId_seatNum: { tripId, seatNum: sn } },
          update: { bookingId: bk.id, status: 'CONFIRMED' },
          create: { tripId, seatNum: sn, bookingId: bk.id, status: 'CONFIRMED' },
        });
      }

      await tx.trip.update({
        where: { id: tripId },
        data:  { availableSeats: { decrement: parseInt(nbPax) } },
      });

      // Points de fidélité (1 point par 100 FCFA)
      if (req.user?.id) {
        const points = Math.floor(totalPrice / 100);
        await tx.user.update({
          where: { id: req.user.id },
          data:  { loyaltyPoints: { increment: points } },
        });
        await tx.loyaltyLog.create({
          data: { userId: req.user.id, points, action: 'BOOKING', bookingId: bk.id },
        });
      }

      return bk;
    });

    res.status(201).json({
      booking: {
        ...booking,
        seats:          freeSeats,
        qrData,
        passengers:     passengers || [{ name: mainPassenger.name, phone: paymentPhone || mainPassenger.phone }],
      },
      message: `Réservation ${bookingId} confirmée ! Code: ${validCode}`,
    });
  } catch (e) {
    console.error('[BOOKING ERROR]', e);
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/bookings/agency/:agencyId — Réservations d'une agence ─────────
// IMPORTANT : doit être AVANT /:id pour ne pas être capturé par ce paramètre
router.get('/agency/:agencyId', authenticate, requireRole('ADMIN', 'AGENCY'), async (req, res) => {
  const { agencyId } = req.params;
  if (req.user.role === 'AGENCY' && req.user.agencyId !== agencyId) {
    return res.status(403).json({ error: 'Accès limité à votre agence' });
  }
  try {
    const bookings = await prisma.booking.findMany({
      where:   { trip: { agencyId } },
      include: {
        trip: { include: { from: true, to: true } },
        user: { select: { name: true, email: true, phone: true } },
        seatSlots: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ bookings });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/bookings/trip/:tripId/seats — Plan de sièges d'un voyage ──────
router.get('/trip/:tripId/seats', authenticate, async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where:   { id: req.params.tripId },
      include: { seatSlots: { include: { booking: { select: { passengerName: true, status: true } } } } },
    });
    if (!trip) return res.status(404).json({ error: 'Voyage introuvable' });
    const seats = [];
    for (let n = 1; n <= trip.totalSeats; n++) {
      const slot = trip.seatSlots.find(s => s.seatNum === n);
      seats.push({ num: n, status: slot ? slot.status : 'AVAILABLE', passenger: slot?.booking?.passengerName || null });
    }
    res.json({ tripId: trip.id, totalSeats: trip.totalSeats, availableSeats: trip.availableSeats, seats });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/bookings/my — Mes réservations ────────────────────────────────
router.get('/my', authenticate, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where:   { userId: req.user.id },
      include: {
        trip: {
          include: {
            agency: { select: { name: true, logo: true, slug: true } },
            from:   { select: { name: true, city: true, id: true } },
            to:     { select: { name: true, city: true, id: true } },
          },
        },
        seatSlots: { select: { seatNum: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ bookings: bookings.map(b => ({
      ...b,
      qrData: genQRData(b.id, b.validationCode || ''),
      reference: b.id,
    }))});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/bookings/:id — Détail d'une réservation ───────────────────────
router.get('/:id', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where:   { id: req.params.id },
      include: {
        trip: { include: { agency: true, from: true, to: true } },
        seatSlots: true,
      },
    });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
    res.json({ ...booking, qrData: genQRData(booking.id, booking.validationCode || '') });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /api/bookings/:id/cancel ──────────────────────────────────────────
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'AGENCY') {
      return res.status(403).json({ error: 'Accès interdit' });
    }
    if (booking.status === 'CANCELLED') return res.status(400).json({ error: 'Déjà annulée' });

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
      await tx.seatSlot.updateMany({ where: { bookingId: booking.id }, data: { status: 'CANCELLED', bookingId: null } });
      await tx.trip.update({ where: { id: booking.tripId }, data: { availableSeats: { increment: booking.pax } } });
    });

    res.json({ message: 'Réservation annulée avec succès' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /api/bookings/:id/validate — Scan QR / validation embarquement ────
router.post('/:id/validate', authenticate, requireRole('ADMIN', 'AGENCY'), async (req, res) => {
  const { code, qrData } = req.body;

  // Accepte soit le code à 6 chiffres soit le QR complet
  const validationCode = code || (qrData?.split(':')?.[2]);

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { trip: { include: { agency: true } } },
    });
    if (!booking)                          return res.status(404).json({ error: 'Réservation introuvable' });
    if (booking.status === 'VALIDATED')    return res.status(400).json({ error: 'Déjà validée' });
    if (booking.status === 'CANCELLED')    return res.status(400).json({ error: 'Réservation annulée' });
    if (booking.validationCode !== validationCode) {
      return res.status(400).json({ error: 'Code de validation incorrect' });
    }

    // Un gestionnaire d'agence ne peut valider que les réservations de son agence
    if (req.user.role === 'AGENCY' && req.user.agencyId !== booking.trip.agencyId) {
      return res.status(403).json({ error: 'Vous ne gérez pas cette agence' });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data:  { status: 'VALIDATED', validatedAt: new Date() },
    });

    res.json({ ...updated, message: '✅ Passager validé — bon voyage !' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
