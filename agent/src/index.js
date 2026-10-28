require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const Groq  = require('groq-sdk');
const axios = require('axios');
const fs    = require('fs');
const path  = require('path');

/* ─────────────────────────────────────────
   PID LOCK — fix Telegram 409 Conflict
   ───────────────────────────────────────── */
const TOKEN_SUFFIX = (process.env.TELEGRAM_BOT_TOKEN || '').slice(-6);
const LOCK_FILE    = `/tmp/busgo-agent-${TOKEN_SUFFIX}.lock`;

if (fs.existsSync(LOCK_FILE)) {
  const pid = fs.readFileSync(LOCK_FILE, 'utf8').trim();
  try {
    process.kill(parseInt(pid), 0); // check if alive
    console.error(`[AGENT] Another instance is already running (PID ${pid}). Exiting.`);
    process.exit(1);
  } catch {
    // stale lock
    fs.unlinkSync(LOCK_FILE);
  }
}
fs.writeFileSync(LOCK_FILE, String(process.pid));
const cleanLock = () => { try { fs.unlinkSync(LOCK_FILE); } catch {} };
process.on('exit', cleanLock);
process.on('SIGINT',  () => { cleanLock(); process.exit(0); });
process.on('SIGTERM', () => { cleanLock(); process.exit(0); });

/* ─── Clients ─── */
const bot  = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const API  = process.env.BUSGO_API_URL || 'http://backend:4000/api';

/* ─── Session (conversation history) ─── */
bot.use(session({ defaultSession: () => ({ history: [] }) }));

/* ─── System prompt ─── */
const SYSTEM = `Tu es Baobab, l'assistant IA de busGO — la plateforme de réservation de bus au Cameroun.
Tu aides les voyageurs à :
• Trouver des voyages entre villes camerounaises (Yaoundé, Douala, Bafoussam, Ngaoundéré, Limbé, Buéa, Ébolowa, Bertoua…)
• Connaître les prix, horaires, agences disponibles
• Comprendre le processus de réservation et de paiement (MTN MoMo, Orange Money)
• Gérer leurs billets et contacter le support

Répondre toujours en français. Sois chaleureux, concis et utile.
Si tu ne connais pas une information précise, invite l'utilisateur à consulter busGO sur le site web.
Ne jamais inventer des horaires ou des prix — utilise les données réelles quand disponibles.`;

/* ─── Helper: fetch trips from API ─── */
async function searchTrips(from, to, date) {
  try {
    const r = await axios.get(`${API}/trips/search`, { params: { from, to, date, pax: 1 }, timeout: 5000 });
    return r.data.trips || r.data || [];
  } catch {
    return null;
  }
}

/* ─── Helper: chat with Groq ─── */
async function chat(history, userMsg, context = '') {
  const messages = [
    { role: 'system', content: SYSTEM + (context ? '\n\nContexte données réelles:\n' + context : '') },
    ...history.slice(-8), // keep last 8 exchanges
    { role: 'user', content: userMsg }
  ];
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    max_tokens: 512,
    temperature: 0.7,
  });
  return res.choices[0].message.content;
}

/* ─── City code detection ─── */
const CITY_CODES = {
  'yaoundé': 'YDE', 'yaounde': 'YDE', 'yde': 'YDE',
  'douala':  'DLA', 'dla':     'DLA',
  'bafoussam':'BFT','bft':     'BFT',
  "ngaoundéré":'NGD',"ngaoundere":'NGD','ngd':'NGD',
  'limbé':   'LIM', 'limbe':   'LIM', 'lim': 'LIM',
  'buéa':    'BUE', 'buea':    'BUE', 'bue': 'BUE',
  'ébolowa': 'EDO', 'ebolowa': 'EDO', 'edo': 'EDO',
  'bertoua': 'BSG', 'bsg':     'BSG',
};

function detectCities(text) {
  const lower = text.toLowerCase();
  const found = [];
  for (const [key, code] of Object.entries(CITY_CODES)) {
    if (lower.includes(key) && !found.includes(code)) found.push(code);
  }
  return found;
}

/* ─── /start ─── */
bot.start(ctx => ctx.reply(
  `🌿 *Bienvenue chez busGO !*\n\nJe suis *Baobab*, votre assistant voyage au Cameroun. 🇨🇲\n\n` +
  `Je peux vous aider à :\n` +
  `• 🔍 Chercher des voyages (ex: *Yaoundé → Douala demain*)\n` +
  `• 💰 Connaître les tarifs et horaires\n` +
  `• 📱 Guider la réservation\n\n` +
  `Que puis-je faire pour vous aujourd'hui ?`,
  { parse_mode: 'Markdown' }
));

/* ─── /help ─── */
bot.help(ctx => ctx.reply(
  `*Commandes disponibles :*\n\n` +
  `/start — Message d'accueil\n` +
  `/voyages YDE DLA — Chercher un voyage Yaoundé→Douala\n` +
  `/villes — Liste des villes desservies\n\n` +
  `Ou parlez-moi librement ! 😊`,
  { parse_mode: 'Markdown' }
));

/* ─── /villes ─── */
bot.command('villes', ctx => ctx.reply(
  `🗺️ *Villes desservies par busGO :*\n\n` +
  `• Yaoundé (YDE)\n• Douala (DLA)\n• Bafoussam (BFT)\n` +
  `• Ngaoundéré (NGD)\n• Limbé (LIM)\n• Buéa (BUE)\n` +
  `• Ébolowa (EDO)\n• Bertoua (BSG)`,
  { parse_mode: 'Markdown' }
));

/* ─── /voyages FROM TO ─── */
bot.command('voyages', async ctx => {
  const parts = ctx.message.text.split(' ');
  const from = (parts[1] || '').toUpperCase();
  const to   = (parts[2] || '').toUpperCase();
  if (!from || !to) {
    return ctx.reply('Usage: /voyages YDE DLA\nExemple: /voyages YDE DLA pour Yaoundé → Douala');
  }
  await ctx.reply('🔍 Recherche en cours…');
  const date  = new Date().toISOString().split('T')[0];
  const trips = await searchTrips(from, to, date);
  if (!trips) return ctx.reply('❌ Service indisponible. Réessayez dans quelques instants.');
  if (trips.length === 0) return ctx.reply(`Aucun voyage ${from} → ${to} disponible aujourd'hui.`);
  const lines = trips.slice(0, 5).map(t =>
    `🚌 *${t.agency?.name}* — ${new Date(t.departureTime).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} → ${new Date(t.arrivalTime).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}\n` +
    `   💰 ${t.price?.toLocaleString('fr-FR')} FCFA · ${t.availableSeats} places`
  ).join('\n\n');
  await ctx.reply(`🗓️ *Voyages ${from} → ${to} aujourd'hui :*\n\n${lines}\n\n_Réservez sur busGO.cm_`, { parse_mode:'Markdown' });
});

/* ─── Natural language handler ─── */
bot.on('text', async ctx => {
  const text = ctx.message.text;
  if (text.startsWith('/')) return; // skip unknown commands

  // detect city search intent
  const cities = detectCities(text);
  let contextStr = '';
  if (cities.length >= 2) {
    const date  = new Date().toISOString().split('T')[0];
    const trips = await searchTrips(cities[0], cities[1], date);
    if (trips && trips.length > 0) {
      contextStr = `Voyages disponibles ${cities[0]}→${cities[1]} aujourd'hui:\n` +
        trips.slice(0,4).map(t =>
          `- ${t.agency?.name}: départ ${new Date(t.departureTime).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}, arrivée ${new Date(t.arrivalTime).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}, ${t.price?.toLocaleString('fr-FR')} FCFA, ${t.availableSeats} places`
        ).join('\n');
    }
  }

  // update history
  ctx.session.history.push({ role:'user', content: text });
  if (ctx.session.history.length > 20) ctx.session.history = ctx.session.history.slice(-20);

  await ctx.sendChatAction('typing');
  try {
    const reply = await chat(ctx.session.history, text, contextStr);
    ctx.session.history.push({ role:'assistant', content: reply });
    await ctx.reply(reply, { parse_mode:'Markdown' });
  } catch(e) {
    console.error('[AGENT] Groq error:', e.message);
    await ctx.reply('Désolé, une erreur s\'est produite. Réessayez dans un instant. 🙏');
  }
});

/* ─── Launch with webhook cleanup (fix 409) ─── */
async function main() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    console.log('[AGENT] Webhook supprimé, démarrage du polling…');
  } catch(e) {
    console.warn('[AGENT] deleteWebhook failed (non-fatal):', e.message);
  }
  bot.launch();
  console.log('[AGENT] Baobab démarré ✅');
}

main();
