const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email, password, name, phone } = req.body;
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email déjà utilisé' });

    const hash = await bcrypt.hash(password, 12);
    const referralCode = `${name.split(' ')[0].toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
    const user = await prisma.user.create({
      data: { email, password: hash, name, phone, referralCode },
      select: { id:true, email:true, name:true, phone:true, role:true, loyaltyPoints:true, loyaltyTier:true, referralCode:true }
    });
    res.status(201).json({ user, token: signToken(user.id) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token: signToken(user.id) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const { password: _, ...safeUser } = req.user;
  res.json(safeUser);
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, [
  body('oldPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const ok = await bcrypt.compare(oldPassword, req.user.password);
  if (!ok) return res.status(400).json({ error: 'Ancien mot de passe incorrect' });
  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where:{ id:req.user.id }, data:{ password:hash } });
  res.json({ message: 'Mot de passe mis à jour' });
});

module.exports = router;
