const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const agencies = await prisma.agency.findMany({
      where: { active: true },
      select: { id:true, name:true, slug:true, logo:true, description:true, verified:true }
    });
    res.json(agencies);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:slug', async (req, res) => {
  try {
    const agency = await prisma.agency.findUnique({
      where: { slug: req.params.slug },
      include: { trips: { where:{ status:'SCHEDULED' }, take: 20 } }
    });
    if (!agency) return res.status(404).json({ error: 'Agence introuvable' });
    res.json(agency);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
