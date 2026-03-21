// src/routes/bookings.js — busGO Cameroun
const express = require('express');
const router  = express.Router();
const prisma  = require('../lib/prisma');
const { authRequired, authOptional } = require('../middleware/auth');
const { generateTicketPDF }       = require('../services/pdf');
const { sendBookingConfirmationSMS, sendCancellationSMS, sendValidationSMS } = require('../services/sms');
const { sendBookingConfirmationEmail, sendCancellationEmail, sendValidationEmail } = require('../services/email');
const { awardPoints }             = require('../services/loyalty');

const VALID_METHODS = ['card','paypal','applepay','googlepay','mtn_momo','orange_money'];
const SERVICE_FEE   = 500; // FCFA

// ── Générer un code de validation à 6 chiffres ────────────────────────────────
function genValidationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── Générer un ID de réservation ──────────────────────────────────────────────
function genBookingId() {
  return 'BG' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

// ── Valider le format date YYYY-MM-DD ─────────────────────────────────────────
function isValidDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T12:00:00');
  return !isNaN(d.getTime());
}

// ── Vérifier que la date n'est pas passée ─────────────────────────────────────
function isFutureOrToday(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  return dateStr >= today;
}

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/bookings — Créer une réservation
// ══════════════════════════════════════════════════════════════════════════════
router.post('/', authOptional, async (req, res, next) => {
  const {
    tripId, seat, pax, paymentMethod, date,
    passengerName, passengerPhone,
  } = req.body;

  // ── Validation des champs obligatoires ────────────────────────────────────
  const errs = [];
  if (!tripId)                                    errs.push('tripId requis');
  if (!seat || isNaN(parseInt(seat)))             errs.push('seat (numéro) requis');
  if (!pax  || isNaN(parseInt(pax)))              errs.push('pax (nb passagers) requis');
  if (!paymentMethod)                             errs.push('paymentMethod requis');
  if (!VALID_METHODS.includes(paymentMethod))     errs.push(`paymentMethod invalide (${VALID_METHODS.join(', ')})`);
  if (!date)                                      errs.push('date requis (YYYY-MM-DD)');
  if (date && !isValidDate(date))                 errs.push('date invalide (format YYYY-MM-DD)');
  if (date && isValidDate(date) && !isFutureOrToday(date))
                                                  errs.push('La date de voyage est déjà passée');

  const seatNum = parseInt(seat);
  const count   = parseInt(pax);

  if (!isNaN(count) && (count < 1 || count > 9)) errs.push('Nombre de passagers : 1 à 9 maximum');
  if (!isNaN(seatNum) && (seatNum < 1 || seatNum > 100)) errs.push('Numéro de siège invalide');

  if (errs.length > 0)
    return res.status(400).json({ error: errs[0], details: errs });

  try {
    const booking = await prisma.$transaction(async (tx) => {

      // 1. Vérifier que le trajet existe et est actif
      const trip = await tx.trip.findUnique({
        where:   { id: tripId },
        include: { from: true, to: true },
      });
      if (!trip)         throw Object.assign(new Error('Trajet introuvable'), { status: 404 });
      if (!trip.active)  throw Object.assign(new Error('Ce trajet n\'est plus disponible'), { status: 410 });

      // 2. Vérifier que le siège existe et est libre (verrouillage anti double-booking)
      const slot = await tx.seatSlot.findUnique({
        where: { tripId_seatNum: { tripId, seatNum } },
      });
      if (!slot)
        throw Object.assign(new Error(`Le siège ${seatNum} n'existe pas sur ce trajet`), { status: 400 });
      if (slot.status === 'TAKEN')
        throw Object.assign(new Error(`Le siège ${seatNum} est déjà réservé`), { status: 409 });

      // 3. Calculer les prix en FCFA
      const unitPrice  = trip.price;          // Prix unitaire FCFA
      const serviceFee = trip.serviceFee || SERVICE_FEE;
      const totalPrice = (unitPrice * count) + serviceFee;

      // 4. Créer la réservation + marquer siège TAKEN atomiquement
      const bookingId        = genBookingId();
      const validationCode   = genValidationCode();

      // N'utiliser userId que si c'est un vrai compte utilisateur (pas le compte service agent)
      const SERVICE_IDS = ['user_agent', 'user_demo'];
      const realUserId = req.user?.id && !SERVICE_IDS.includes(req.user.id)
        ? req.user.id : null;

      const newBooking = await tx.booking.create({
        data: {
          id:             bookingId,
          tripId,
          userId:         realUserId,
          seatNum,
          pax:            count,
          paymentMethod,
          unitPrice,
          serviceFee,
          totalPrice,
          travelDate:     date,
          passengerName:  passengerName || req.user?.name || null,
          passengerPhone: passengerPhone || null,
          validationCode,
          status:         'CONFIRMED',
          seatSlots:      { connect: { id: slot.id } },
        },
        include: { trip: { include: { from: true, to: true } } },
      });

      await tx.seatSlot.update({
        where: { id: slot.id },
        data:  { status: 'TAKEN' },
      });

      return newBooking;
    });

    // ── Post-booking : PDF, SMS, Email, Fidélité ──────────────────────
    // Récupérer l'email de l'utilisateur pour les notifications
    let userEmail = null;
    if (req.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.id }, select: { email: true }
      });
      userEmail = dbUser?.email;
    }
    const formattedBooking = { ...formatBooking(booking), userEmail };

    // Générer le PDF en arrière-plan (non bloquant)
    generateTicketPDF(formattedBooking).then(async ({ url }) => {
      await prisma.booking.update({ where: { id: booking.id }, data: { pdfUrl: url } });
    }).catch(e => console.error('[PDF]', e.message));

    // Envoyer SMS de confirmation
    sendBookingConfirmationSMS(formattedBooking)
      .catch(e => console.error('[SMS]', e.message));

    // Envoyer email de confirmation
    sendBookingConfirmationEmail(formattedBooking)
      .catch(e => console.error('[EMAIL]', e.message));

    // Points de fidélité
    const pointsEarned = await awardPoints(
      req.user?.id || null,
      booking.totalPrice,
      booking.id
    ).catch(() => 0);

    if (pointsEarned > 0) {
      await prisma.booking.update({
        where: { id: booking.id },
        data:  { loyaltyEarned: pointsEarned },
      });
    }

    res.status(201).json({
      success: true,
      booking: { ...formattedBooking, loyaltyEarned: pointsEarned },
      message: 'Réservation confirmée ! Présentez votre code de validation à bord.',
    });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/bookings/:id/validate — Valider un billet (contrôleur à bord)
// ══════════════════════════════════════════════════════════════════════════════
router.post('/:id/validate', async (req, res, next) => {
  const { code } = req.body;

  if (!code)
    return res.status(400).json({ error: 'Code de validation requis' });

  try {
    const booking = await prisma.booking.findUnique({
      where:   { id: req.params.id },
      include: { trip: { include: { from: true, to: true } } },
    });

    if (!booking)
      return res.status(404).json({ error: 'Réservation introuvable' });

    if (booking.status === 'CANCELLED')
      return res.status(409).json({ error: 'Cette réservation a été annulée' });

    if (booking.status === 'VALIDATED')
      return res.status(409).json({
        error: 'Billet déjà validé',
        validatedAt: booking.validatedAt,
      });

    // Vérifier que la date de voyage est aujourd'hui ou dans le futur proche
    const today = new Date().toISOString().split('T')[0];
    if (booking.travelDate < today)
      return res.status(410).json({ error: 'Ce billet a expiré (date de voyage passée)' });

    // Vérifier le code
    if (booking.validationCode !== code)
      return res.status(401).json({ error: 'Code de validation incorrect' });

    // Marquer comme validé
    const validated = await prisma.booking.update({
      where:   { id: booking.id },
      data:    { status: 'VALIDATED', validatedAt: new Date() },
      include: { trip: { include: { from: true, to: true } } },
    });
    // Notifications de validation
    const validFmt = formatBooking(validated);
    sendValidationSMS(validFmt).catch(() => {});
    sendValidationEmail(validFmt).catch(() => {});

    res.json({
      success:     true,
      message:     '✅ Billet validé — bon voyage !',
      booking:     formatBooking(validated),
    });

  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/bookings/validate/:code — Vérifier par code (scan QR)
// ══════════════════════════════════════════════════════════════════════════════
router.get('/check/:code', async (req, res, next) => {
  try {
    const booking = await prisma.booking.findFirst({
      where:   { validationCode: req.params.code },
      include: { trip: { include: { from: true, to: true } } },
    });

    if (!booking)
      return res.status(404).json({ valid: false, error: 'Code introuvable' });

    const today = new Date().toISOString().split('T')[0];
    const expired = booking.travelDate < today;

    res.json({
      valid:   booking.status === 'CONFIRMED' && !expired,
      booking: formatBooking(booking),
      expired,
    });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/bookings — Mes réservations
// Supporte : JWT (userId), ?telegramId=xxx, ?phone=xxx
// ══════════════════════════════════════════════════════════════════════════════
router.get('/', authOptional, async (req, res, next) => {
  try {
    const { telegramId, phone } = req.query;
    let where = {};

    if (req.user?.id) {
      // Connecté avec JWT
      where = { userId: req.user.id };
    } else if (telegramId) {
      // Réservations liées à un telegramId (stocké dans passengerPhone ou notes)
      where = { passengerPhone: String(telegramId) };
    } else if (phone) {
      where = { passengerPhone: phone };
    } else {
      return res.status(401).json({ error: 'Authentification requise (JWT, telegramId ou phone)' });
    }

    const rows = await prisma.booking.findMany({
      where,
      include: { trip: { include: { from: true, to: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ count: rows.length, bookings: rows.map(formatBooking) });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/bookings/:id
// ══════════════════════════════════════════════════════════════════════════════
router.get('/:id', async (req, res, next) => {
  try {
    const row = await prisma.booking.findUnique({
      where:   { id: req.params.id },
      include: { trip: { include: { from: true, to: true } } },
    });
    if (!row) return res.status(404).json({ error: 'Réservation introuvable' });
    res.json(formatBooking(row));
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/bookings/:id — Annuler
// ══════════════════════════════════════════════════════════════════════════════
router.delete('/:id', authOptional, async (req, res, next) => {
  try {
    const row = await prisma.booking.findUnique({
      where:   { id: req.params.id },
      include: { seatSlots: true },
    });
    if (!row) return res.status(404).json({ error: 'Réservation introuvable' });
    if (row.status === 'CANCELLED')
      return res.status(409).json({ error: 'Réservation déjà annulée' });
    if (row.status === 'VALIDATED')
      return res.status(409).json({ error: 'Impossible d\'annuler un billet déjà utilisé' });

    // Vérifier que le voyage n'a pas déjà eu lieu
    const today = new Date().toISOString().split('T')[0];
    if (row.travelDate < today)
      return res.status(410).json({ error: 'Impossible d\'annuler un voyage passé' });

    await prisma.$transaction([
      prisma.seatSlot.updateMany({
        where: { bookingId: row.id },
        data:  { status: 'FREE', bookingId: null },
      }),
      prisma.booking.update({
        where: { id: row.id },
        data:  { status: 'CANCELLED', cancelledAt: new Date() },
      }),
    ]);

    const cancelFmt = formatBooking(row);
    sendCancellationSMS(cancelFmt).catch(() => {});
    sendCancellationEmail(cancelFmt).catch(() => {});
    res.json({ success: true, message: 'Réservation annulée avec succès' });
  } catch (err) { next(err); }
});

// ── Helper formatage réponse ───────────────────────────────────────────────────
function formatBooking(b) {
  return {
    id:             b.id,
    tripId:         b.tripId,
    trip: b.trip ? {
      from:    b.trip.from.name,
      to:      b.trip.to.name,
      dep:     b.trip.depTime,
      arr:     b.trip.arrTime,
      company: b.trip.company,
      date:    b.travelDate,
    } : null,
    seat:           b.seatNum,
    pax:            b.pax,
    paymentMethod:  b.paymentMethod,
    unitPrice:      b.unitPrice,
    serviceFee:     b.serviceFee,
    totalPrice:     b.totalPrice,
    travelDate:     b.travelDate,
    passengerName:  b.passengerName,
    passengerPhone: b.passengerPhone,
    validationCode: b.validationCode,
    validatedAt:    b.validatedAt,
    status:         b.status,
    userId:         b.userId,
    createdAt:      b.createdAt,
    cancelledAt:    b.cancelledAt,
    pdfUrl:         b.pdfUrl,
    loyaltyEarned:  b.loyaltyEarned,
  };
}

module.exports = router;
