const jwt    = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const SECRET = process.env.JWT_SECRET || 'busgo_dev_secret_change_in_prod';

function verifyToken(req) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try { return jwt.verify(token, SECRET); }
  catch { return null; }
}

const authOptional = (req, res, next) => {
  req.user = verifyToken(req);
  next();
};

const authRequired = (req, res, next) => {
  req.user = verifyToken(req);
  if (!req.user) return res.status(401).json({ error: 'Authentification requise' });
  next();
};

const adminOnly = async (req, res, next) => {
  req.user = verifyToken(req);
  if (!req.user) return res.status(401).json({ error: 'Authentification requise' });
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user || user.role !== 'ADMIN')
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  req.dbUser = user;
  next();
};

const agencyOrAdmin = async (req, res, next) => {
  req.user = verifyToken(req);
  if (!req.user) return res.status(401).json({ error: 'Authentification requise' });
  const user = await prisma.user.findUnique({
    where:   { id: req.user.id },
    include: { agency: true },
  });
  if (!user || !['ADMIN','AGENCY'].includes(user.role))
    return res.status(403).json({ error: 'Accès réservé aux agences et administrateurs' });
  req.dbUser = user;
  next();
};

module.exports = { authOptional, authRequired, adminOnly, agencyOrAdmin };
