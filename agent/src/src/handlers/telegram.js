// src/handlers/telegram.js
const TelegramBot = require('node-telegram-bot-api');
const { processMessage } = require('./agent');
const memory = require('../memory/conversationMemory');

const processing = new Set();

function createBot(token) {
  const bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const name   = msg.from?.first_name || 'voyageur';
    await bot.sendMessage(chatId, `
🚌 *Bienvenue sur busGO, ${name} !*

Je suis BusBot, votre assistant de voyage intelligent. Je peux vous aider à :

🔍 *Rechercher* des trajets entre les grandes villes françaises
🎫 *Réserver* vos billets directement dans cette conversation
📋 *Gérer* vos réservations existantes

*Villes disponibles :* Paris, Lyon, Marseille, Bordeaux, Toulouse, Nice, Nantes, Lille, Strasbourg

Dites-moi simplement où vous souhaitez aller !

_Exemple : "Je veux aller de Paris à Lyon demain pour 2 personnes"_
    `.trim(), { parse_mode: 'Markdown' });
  });

  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, `
🆘 *Aide BusBot*

*Commandes :*
/start  → Bienvenue
/help   → Cette aide
/reset  → Nouvelle conversation
/status → État de la plateforme

*Exemples de questions :*
• "Bus Paris Lyon demain matin"
• "Le moins cher pour Marseille ?"
• "Je prends le bus de 10h pour 2 personnes"
• "Mes réservations"
• "Annule ma réservation BG3A7F2E1"
    `.trim(), { parse_mode: 'Markdown' });
  });

  bot.onText(/\/reset/, async (msg) => {
    const chatId = msg.chat.id;
    memory.reset(chatId);
    await bot.sendMessage(chatId, '♻️ Conversation réinitialisée. Comment puis-je vous aider ?');
  });

  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const { checkHealth } = require('../tools/busgoClient');
      const health = await checkHealth();
      const icon = health.db === 'connected' ? '✅' : '❌';
      await bot.sendMessage(chatId,
        `${icon} *Plateforme busGO*\nStatut : ${health.status}\nDB : ${health.db}\nVersion : ${health.version}`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      await bot.sendMessage(chatId, `❌ API inaccessible : ${e.message}`);
    }
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text   = msg.text?.trim();
    if (!text || text.startsWith('/')) return;

    if (processing.has(chatId)) {
      await bot.sendMessage(chatId, '⏳ Je traite votre demande précédente, patientez…');
      return;
    }
    processing.add(chatId);
    await bot.sendChatAction(chatId, 'typing');

    try {
      console.log(`\n📩 [${chatId}] ${msg.from?.first_name}: ${text}`);
      const response = await processMessage(chatId, text);
      console.log(`📤 [${chatId}] Response (${response.length} chars)`);
      await sendLongMessage(bot, chatId, response);
    } catch (err) {
      // Log complet pour diagnostic
      console.error(`\n❌ AGENT ERROR for [${chatId}]:`);
      console.error('  Message:', err?.message);
      console.error('  Status:', err?.status);
      console.error('  Stack:', err?.stack?.split('\n').slice(0,4).join('\n'));

      // Envoyer le détail de l'erreur à l'utilisateur pour debug
      const detail = err?.message || String(err);
      await bot.sendMessage(chatId,
        `⚠️ Erreur : \`${detail}\`\n\nTapez /reset pour recommencer.`,
        { parse_mode: 'Markdown' }
      );
    } finally {
      processing.delete(chatId);
    }
  });

  bot.on('polling_error', (err) => {
    if (err.code === 'ETELEGRAM' && err.message.includes('401')) {
      console.error('\n❌ TELEGRAM 401 Unauthorized');
      console.error('   Votre TELEGRAM_BOT_TOKEN est invalide.');
      console.error('   Vérifiez agent/.env → TELEGRAM_BOT_TOKEN\n');
    } else {
      console.error('Telegram polling error:', err.code, err.message);
    }
  });

  return bot;
}

async function sendLongMessage(bot, chatId, text) {
  const MAX = 4000;
  if (text.length <= MAX) {
    try {
      await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch {
      // Si le markdown échoue, envoyer en texte brut
      await bot.sendMessage(chatId, text);
    }
    return;
  }
  const parts = [];
  let current = '';
  for (const line of text.split('\n')) {
    if ((current + '\n' + line).length > MAX) {
      if (current) parts.push(current.trim());
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }
  if (current) parts.push(current.trim());
  for (const part of parts) {
    try {
      await bot.sendMessage(chatId, part, { parse_mode: 'Markdown' });
    } catch {
      await bot.sendMessage(chatId, part);
    }
    await new Promise(r => setTimeout(r, 300));
  }
}

module.exports = { createBot };
