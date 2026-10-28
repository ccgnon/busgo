const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/trips/search?from=YDE&to=DLA&date=2026-10-15&pax=1
router.get('/search', async (req, res) => {
  const { from, to, date, pax = 1 } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from et to requis' });

  try {
    const startOfDay = date ? new Date(date) : new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const trips = await prisma.trip.findMany({
      where: {
        fromId: from,
        toId: to,
        status: { in: ['SCHEDULED', 'BOARDING'] },
        departureTime: { gte: startOfDay, lte: endOfDay },
        availableSeats: { gte: parseInt(pax) },
      },
      include: {
        agency: { select: { id:true, name:true, slug:true, logo:true, verified:true } },
        from:   { select: { id:true, name:true, terminal:true, city:true } },
        to:     { select: { id:true, name:true, terminal:true, city:true } },
      },
      orderBy: { departureTime: 'asc' },
    });
    res.json(trips);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/trips/:id
router.get('/:id', async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        agency: true,
        from:   true,
        to:     true,
        seatSlots: { select: { seatNum:true, status:true } },
      },
    });
    if (!trip) return res.status(404).json({ error: 'Trajet introuvable' });
    res.json(trip);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/trips/:id/seats
router.get('/:id/seats', async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({ where:{ id:req.params.id } });
    if (!trip) return res.status(404).json({ error: 'Trajet introuvable' });

    const taken = await prisma.seatSlot.findMany({
      where: { tripId:req.params.id, status:{ in:['CONFIRMED','BOARDING','VALIDATED'] } },
      select: { seatNum:true, status:true },
    });
    const takenNums = taken.map(s => s.seatNum);
    const seats = Array.from({ length: trip.totalSeats }, (_, i) => ({
      seatNum: i + 1,
      status: takenNums.includes(i + 1) ? 'taken' : 'free',
    }));
    res.json({ tripId: req.params.id, totalSeats: trip.totalSeats, seats });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/trips — Admin/Agency
router.post('/', authenticate, requireRole('ADMIN','AGENCY'), async (req, res) => {
  const { agencyId, fromId, toId, departureTime, arrivalTime, price, totalSeats, busType, amenities } = req.body;
  try {
    const trip = await prisma.trip.create({
      data: {
        agencyId, fromId, toId,
        departureTime: new Date(departureTime),
        arrivalTime:   new Date(arrivalTime),
        price, totalSeats: totalSeats||70, availableSeats: totalSeats||70,
        busType: busType||'Standard', amenities: amenities||[],
      },
      include: { agency:true, from:true, to:true }
    });
    res.status(201).json(trip);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/trips/:id/status
router.patch('/:id/status', authenticate, requireRole('ADMIN','AGENCY'), async (req, res) => {
  const { status } = req.body;
  const valid = ['SCHEDULED','BOARDING','DEPARTED','ARRIVED','CANCELLED'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide' });
  try {
    const trip = await prisma.trip.update({
      where: { id:req.params.id }, data: { status }
    });
    res.json(trip);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
