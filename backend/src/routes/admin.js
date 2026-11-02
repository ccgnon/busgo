/**
 * busGO CMR — Routes administration (ADMIN uniquement)
 * CRUD complet : agences, utilisateurs, réservations, voyages
 */

const router  = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt  = require('bcryptjs');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendBookingConfirmation, sendBookingCancellation } = require('../services/mailer');

const prisma = new PrismaClient();

// Toutes les routes de ce routeur nécessitent ADMIN
router.use(authenticate, requireRole('ADMIN'));

// ─── STATS ────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalBookings, revenueAgg, totalUsers, activeTrips, totalAgencies, pendingBookings] = await Promise.all([
      prisma.booking.count({ where: { status: { not: 'CANCELLED' } } }),
      prisma.booking.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { totalPrice: true } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.trip.count({ where: { status: 'SCHEDULED' } }),
      prisma.agency.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
    ]);
    res.json({
      stats: {
        totalBookings,
        totalRevenue: revenueAgg._sum.totalPrice || 0,
        totalUsers,
        activeTrips,
        totalAgencies,
        pendingBookings,
      }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── VOYAGES ──────────────────────────────────────────────────────────────────
router.get('/trips', async (req, res) => {
  const { page = 1, limit = 50, agencyId } = req.query;
  try {
    const where = agencyId ? { agencyId } : {};
    const trips = await prisma.trip.findMany({
      where, skip: (page - 1) * limit, take: parseInt(limit),
      include: {
        agency: { select: { id: true, name: true, slug: true } },
        from:   { select: { id: true, name: true, city: true } },
        to:     { select: { id: true, name: true, city: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { departureTime: 'asc' },
    });
    res.json({ trips });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── RÉSERVATIONS ─────────────────────────────────────────────────────────────
router.get('/bookings', async (req, res) => {
  const { page = 1, limit = 50, status, agencyId } = req.query;
  try {
    const where = {};
    if (status)   where.status  = status;
    if (agencyId) where.trip    = { agencyId };
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    parseInt(limit),
        include: {
          trip: { include: { from: true, to: true, agency: { select: { id: true, name: true } } } },
          user: { select: { id: true, name: true, email: true, phone: true } },
          seatSlots: { select: { seatNum: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);
    res.json({ bookings, total, pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/admin/bookings/:id — modifier statut ou info d'une réservation
router.patch('/bookings/:id', async (req, res) => {
  const { status, passengerName, passengerPhone, pax, reason } = req.body;
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        trip: { include: { from: true, to: true, agency: true } },
        user: true,
      },
    });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });

    const data = {};
    if (passengerName)  data.passengerName  = passengerName;
    if (passengerPhone) data.passengerPhone = passengerPhone;
    if (pax)            data.pax            = parseInt(pax);
    if (status) {
      data.status = status;
      if (status === 'CANCELLED') {
        data.cancelledAt = new Date();
        // Libérer les sièges
        await prisma.$transaction([
          prisma.seatSlot.updateMany({ where: { bookingId: booking.id }, data: { status: 'CANCELLED', bookingId: null } }),
          prisma.trip.update({ where: { id: booking.tripId }, data: { availableSeats: { increment: booking.pax } } }),
        ]);
        // Envoyer e-mail annulation
        if (booking.user?.email) {
          sendBookingCancellation(booking, booking.trip, booking.user, reason).catch(e => console.warn('Mail annulation KO:', e.message));
        }
      }
    }

    const updated = await prisma.booking.update({ where: { id: req.params.id }, data });
    res.json({ booking: updated, message: 'Réservation mise à jour' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/admin/bookings/:id — annuler + supprimer
router.delete('/bookings/:id', async (req, res) => {
  const { reason } = req.body;
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { trip: { include: { from: true, to: true, agency: true } }, user: true },
    });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });

    await prisma.$transaction([
      prisma.seatSlot.deleteMany({ where: { bookingId: booking.id } }),
      prisma.trip.update({ where: { id: booking.tripId }, data: { availableSeats: { increment: booking.pax } } }),
      prisma.booking.delete({ where: { id: booking.id } }),
    ]);

    if (booking.user?.email) {
      sendBookingCancellation(booking, booking.trip, booking.user, reason).catch(e => console.warn('Mail KO:', e.message));
    }
    res.json({ message: 'Réservation supprimée' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/bookings/:id/resend-email — renvoyer le mail de confirmation
router.post('/bookings/:id/resend-email', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { trip: { include: { from: true, to: true, agency: true } }, user: true },
    });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
    if (!booking.user?.email) return res.status(400).json({ error: 'Pas d\'adresse e-mail associée' });

    await sendBookingConfirmation(booking, booking.trip, booking.user);
    res.json({ message: `E-mail renvoyé à ${booking.user.email}` });
  } catch (e) {
    console.error('[RESEND EMAIL]', e);
    res.status(500).json({ error: 'Impossible d\'envoyer l\'e-mail : ' + e.message });
  }
});

// ─── UTILISATEURS ─────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const { page = 1, limit = 50, role, search } = req.query;
  try {
    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name:  { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    parseInt(limit),
        select: {
          id: true, email: true, name: true, phone: true, role: true,
          agencyId: true, loyaltyPoints: true, loyaltyTier: true,
          createdAt: true, agency: { select: { name: true, slug: true } },
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/users — créer un utilisateur (avec rôle)
router.post('/users', async (req, res) => {
  const { email, password, name, phone, role, agencyId } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'email, password, name requis' });
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'E-mail déjà utilisé' });
    if (role === 'AGENCY' && !agencyId) return res.status(400).json({ error: 'agencyId requis pour le rôle AGENCY' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, phone, role: role || 'USER', agencyId: agencyId || null },
      select: { id: true, email: true, name: true, phone: true, role: true, agencyId: true, createdAt: true },
    });
    res.status(201).json({ user, message: 'Utilisateur créé' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res) => {
  const { name, phone, role, agencyId, password } = req.body;
  try {
    const data = {};
    if (name)     data.name     = name;
    if (phone)    data.phone    = phone;
    if (role)     data.role     = role;
    if (agencyId !== undefined) data.agencyId = agencyId || null;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, name: true, phone: true, role: true, agencyId: true },
    });
    res.json({ user, message: 'Utilisateur mis à jour' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── AGENCES ──────────────────────────────────────────────────────────────────
router.get('/agencies', async (req, res) => {
  try {
    const agencies = await prisma.agency.findMany({
      include: {
        _count: { select: { trips: true, users: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ agencies });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/agencies — créer une agence
router.post('/agencies', async (req, res) => {
  const { name, slug, email, phone, logo, description, commission, verified } = req.body;
  if (!name || !slug || !email) return res.status(400).json({ error: 'name, slug, email requis' });
  try {
    const agency = await prisma.agency.create({
      data: {
        name, slug, email,
        phone:       phone       || null,
        logo:        logo        || null,
        description: description || null,
        commission:  parseFloat(commission || 0.04),
        verified:    !!verified,
        active:      true,
      },
    });
    res.status(201).json({ agency, message: 'Agence créée avec succès' });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Nom ou slug déjà utilisé' });
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/agencies/:id
router.patch('/agencies/:id', async (req, res) => {
  const { name, email, phone, logo, description, commission, verified, active } = req.body;
  try {
    const data = {};
    if (name        !== undefined) data.name        = name;
    if (email       !== undefined) data.email       = email;
    if (phone       !== undefined) data.phone       = phone;
    if (logo        !== undefined) data.logo        = logo;
    if (description !== undefined) data.description = description;
    if (commission  !== undefined) data.commission  = parseFloat(commission);
    if (verified    !== undefined) data.verified    = !!verified;
    if (active      !== undefined) data.active      = !!active;

    const agency = await prisma.agency.update({ where: { id: req.params.id }, data });
    res.json({ agency, message: 'Agence mise à jour' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/admin/agencies/:id
router.delete('/agencies/:id', async (req, res) => {
  try {
    // Vérifier qu'il n'y a pas de voyages actifs
    const activeTrips = await prisma.trip.count({
      where: { agencyId: req.params.id, status: { in: ['SCHEDULED', 'BOARDING', 'DEPARTED'] } },
    });
    if (activeTrips > 0) {
      return res.status(409).json({ error: `Impossible de supprimer : ${activeTrips} voyage(s) actif(s) lié(s) à cette agence` });
    }
    await prisma.agency.delete({ where: { id: req.params.id } });
    res.json({ message: 'Agence supprimée' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
