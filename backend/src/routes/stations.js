const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/stations
router.get('/', async (req, res) => {
  try {
    const stations = await prisma.station.findMany({ orderBy: { name: 'asc' } });
    res.json(stations);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/stations/:id/routes — Villes desservies depuis cette station
router.get('/:id/routes', async (req, res) => {
  try {
    const routes = await prisma.trip.findMany({
      where: { fromId: req.params.id, status: 'SCHEDULED' },
      select: { to: true },
      distinct: ['toId'],
    });
    res.json(routes.map(r => r.to));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
