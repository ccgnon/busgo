// src/handlers/telegram.js — busGO Cameroun avec réservation réelle en BD
const TelegramBot = require('node-telegram-bot-api');
const { processMessage } = require('./agent');
const memory  = require('../memory/conversationMemory');
const busgo   = require('../tools/busgoClient');

const processing     = new Set();
const bookingSessions = new Map(); // userId → session de réservation

// ═══════════════════════════════════════════════════════════════════════════════
function createBot(token) {
  const bot = new TelegramBot(token, { polling: true });

  // ── /start ──────────────────────────────────────────────────────────────────
  bot.onText(/\/start/, async (msg) => {
    const { id: chatId } = msg.chat;
    const name = msg.from?.first_name || 'voyageur';
    const isLoggedIn = !!busgo.getUserToken(chatId);
    await bot.sendMessage(chatId,
`🚌 *Bienvenue sur busGO Cameroun, ${name} !*

Je suis BusBot — je réserve vos billets de bus directement dans notre système.

${isLoggedIn ? '✅ Vous êtes connecté à votre compte.' : '💡 Connectez-vous pour sauvegarder vos réservations : /login'}

🔍 Rechercher · 🎫 Réserver · 📋 Mes billets · 🌤️ Météo`,
      { parse_mode: 'Markdown',
        reply_markup: { keyboard: [
          ['🔍 Rechercher un bus', '🎫 Réserver'],
          ['📋 Mes réservations',  '🌤️ Météo'],
          ['👤 Mon compte',        '❓ Aide'],
        ], resize_keyboard: true }
      }
    );
  });

  // ── /login ───────────────────────────────────────────────────────────────────
  bot.onText(/\/login/, async (msg) => {
    const chatId = msg.chat.id;
    bookingSessions.set(chatId, { step: 'login_email' });
    await bot.sendMessage(chatId,
      '👤 *Connexion à votre compte busGO*\n\nEntrez votre adresse email :',
      { parse_mode: 'Markdown', reply_markup: { force_reply: true } }
    );
  });

  // ── /register ────────────────────────────────────────────────────────────────
  bot.onText(/\/register/, async (msg) => {
    const chatId = msg.chat.id;
    bookingSessions.set(chatId, { step: 'register_name' });
    await bot.sendMessage(chatId,
      '📝 *Créer un compte busGO*\n\nEntrez votre nom complet :',
      { parse_mode: 'Markdown', reply_markup: { force_reply: true } }
    );
  });

  // ── /logout ──────────────────────────────────────────────────────────────────
  bot.onText(/\/logout/, async (msg) => {
    const chatId = msg.chat.id;
    await busgo.logoutUser(chatId);
    memory.reset(chatId);
    await bot.sendMessage(chatId, '👋 Déconnecté. À bientôt !');
  });

  // ── /help ────────────────────────────────────────────────────────────────────
  bot.onText(/\/help|❓ Aide/, async (msg) => {
    await bot.sendMessage(msg.chat.id,
`🆘 *Aide BusBot Cameroun*

*Commandes :*
/start      → Accueil
/reserver   → Réserver un billet (guidé)
/mesbillets → Mes réservations
/login      → Se connecter
/register   → Créer un compte
/logout     → Se déconnecter
/reset      → Réinitialiser la conversation
/status     → État de la plateforme

*Questions naturelles :*
• "Bus Yaoundé Douala demain"
• "Météo à Kribi"
• "Mes réservations"
• "Annule BG3A7F2E1"`,
      { parse_mode: 'Markdown' }
    );
  });

  // ── /reset ───────────────────────────────────────────────────────────────────
  bot.onText(/\/reset/, async (msg) => {
    const chatId = msg.chat.id;
    memory.reset(chatId);
    bookingSessions.delete(chatId);
    await bot.sendMessage(chatId, '♻️ Conversation réinitialisée.');
  });

  // ── /status ──────────────────────────────────────────────────────────────────
  bot.onText(/\/status/, async (msg) => {
    try {
      const h    = await busgo.checkHealth();
      const icon = h.db === 'connected' ? '✅' : '❌';
      await bot.sendMessage(msg.chat.id,
        `${icon} *busGO API*\nStatut : ${h.status}\nBase de données : ${h.db}`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      await bot.sendMessage(msg.chat.id, `❌ API inaccessible : ${e.message}`);
    }
  });

  // ── /mesbillets ──────────────────────────────────────────────────────────────
  bot.onText(/\/mesbillets|📋 Mes réservations/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendChatAction(chatId, 'typing');
    try {
      const data     = await busgo.getMyBookings({ userId: chatId });
      const bookings = data.bookings || [];
      if (bookings.length === 0) {
        await bot.sendMessage(chatId, '📋 Aucune réservation trouvée.\n\nUtilisez /reserver pour réserver un billet.');
        return;
      }
      let text = `📋 *Vos réservations (${bookings.length})*\n\n`;
      const kb = [];
      for (const b of bookings.slice(0, 5)) {
        const statusIcon = b.status === 'CONFIRMED' ? '✅' : b.status === 'VALIDATED' ? '🟢' : '❌';
        text += `${statusIcon} *${b.id}*\n`;
        text += `   🚌 ${b.trip?.from} → ${b.trip?.to}\n`;
        text += `   📅 ${b.travelDate} · 🕐 ${b.trip?.dep}\n`;
        text += `   💺 Siège ${b.seatNum || b.seat} · 💰 *${Number(b.totalPrice).toLocaleString('fr-FR')} FCFA*\n`;
        if (b.validationCode && b.status === 'CONFIRMED') {
          text += `   🔑 Code validation : \`${b.validationCode}\`\n`;
        }
        text += '\n';
        if (b.status === 'CONFIRMED') {
          kb.push([{ text: `❌ Annuler ${b.id}`, callback_data: `cancel_${b.id}` }]);
        }
      }
      await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: kb.length ? { inline_keyboard: kb } : undefined,
      });
    } catch (e) {
      await bot.sendMessage(chatId, `❌ Erreur : ${e.message}\n\nConnectez-vous avec /login`);
    }
  });

  // ── /mon compte ──────────────────────────────────────────────────────────────
  bot.onText(/\/compte|👤 Mon compte/, async (msg) => {
    const chatId = msg.chat.id;
    const token  = busgo.getUserToken(chatId);
    if (!token) {
      await bot.sendMessage(chatId,
        '👤 Vous n\'êtes pas connecté.\n\n/login → Se connecter\n/register → Créer un compte'
      );
      return;
    }
    try {
      const user = await busgo.getMe(chatId);
      await bot.sendMessage(chatId,
        `👤 *Mon compte*\n\nNom : ${user.name}\nEmail : ${user.email}\n\n/logout → Se déconnecter`,
        { parse_mode: 'Markdown' }
      );
    } catch {
      await bot.sendMessage(chatId, '❌ Session expirée. /login pour vous reconnecter.');
    }
  });

  // ── /reserver — tunnel guidé ──────────────────────────────────────────────────
  bot.onText(/\/reserver|🎫 Réserver/, async (msg) => {
    const chatId = msg.chat.id;
    bookingSessions.set(chatId, { step: 'ask_from' });
    memory.reset(chatId);

    const villes = ['Yaoundé','Douala','Bafoussam','Bamenda','Ngaoundéré',
                    'Garoua','Kribi','Buea','Ebolowa','Bertoua','Maroua','Limbé'];
    const kb = chunkArray(villes, 3).map(row =>
      row.map(v => ({ text: v, callback_data: `from_${v}` }))
    );

    await bot.sendMessage(chatId,
      '🚌 *Réservation de billet*\n\n📍 Ville de *départ* :',
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: kb } }
    );
  });

  // ── Callbacks boutons inline ──────────────────────────────────────────────────
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const msgId  = query.message.message_id;
    const data   = query.data;
    await bot.answerCallbackQuery(query.id);

    // Ville départ
    if (data.startsWith('from_')) {
      const from    = data.replace('from_', '');
      const session = bookingSessions.get(chatId) || {};
      session.from  = from;
      session.step  = 'ask_to';
      bookingSessions.set(chatId, session);

      const villes = ['Yaoundé','Douala','Bafoussam','Bamenda','Ngaoundéré',
                      'Garoua','Kribi','Buea','Ebolowa','Bertoua','Maroua','Limbé']
                     .filter(v => v !== from);
      const kb = chunkArray(villes, 3).map(row =>
        row.map(v => ({ text: v, callback_data: `to_${v}` }))
      );
      await bot.editMessageText(
        `🚌 *Réservation*\n📍 Départ : *${from}*\n\n🏁 Ville d'*arrivée* :`,
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: kb } }
      );
      return;
    }

    // Ville arrivée
    if (data.startsWith('to_')) {
      const to      = data.replace('to_', '');
      const session = bookingSessions.get(chatId) || {};
      session.to    = to;
      session.step  = 'ask_date';
      bookingSessions.set(chatId, session);

      const dates = nextDays(5);
      const kb = [
        dates.slice(0, 3).map(d => ({ text: d.label, callback_data: `date_${d.value}` })),
        dates.slice(3, 5).map(d => ({ text: d.label, callback_data: `date_${d.value}` })),
      ];
      await bot.editMessageText(
        `🚌 *Réservation*\n📍 ${session.from} → *${to}*\n\n📅 *Date* de voyage :`,
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: kb } }
      );
      return;
    }

    // Date
    if (data.startsWith('date_')) {
      const date    = data.replace('date_', '');
      const session = bookingSessions.get(chatId) || {};
      session.date  = date;
      session.step  = 'ask_pax';
      bookingSessions.set(chatId, session);

      const kb = [[1,2,3,4].map(n => ({
        text: `${n} pax`, callback_data: `pax_${n}`
      }))];
      await bot.editMessageText(
        `🚌 *Réservation*\n📍 ${session.from} → ${session.to}\n📅 ${formatDate(date)}\n\n👥 *Passagers* :`,
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: kb } }
      );
      return;
    }

    // Passagers → recherche
    if (data.startsWith('pax_')) {
      const pax     = parseInt(data.replace('pax_', ''));
      const session = bookingSessions.get(chatId) || {};
      session.pax   = pax;
      session.step  = 'select_trip';
      bookingSessions.set(chatId, session);

      await bot.editMessageText(
        `⏳ Recherche des bus ${session.from} → ${session.to}...`,
        { chat_id: chatId, message_id: msgId }
      );

      try {
        const result = await busgo.searchTrips({
          from: session.from, to: session.to,
          date: session.date, pax,
        });
        const trips = result.trips || [];

        if (trips.length === 0) {
          await bot.editMessageText(
            `😕 Aucun bus disponible\n${session.from} → ${session.to}\n${formatDate(session.date)}\n\nEssayez une autre date ou /reserver`,
            { chat_id: chatId, message_id: msgId }
          );
          bookingSessions.delete(chatId);
          return;
        }

        session.trips = trips;
        bookingSessions.set(chatId, session);

        let text = `🚌 *${trips.length} bus disponible(s)*\n`;
        text += `📍 ${session.from} → ${session.to} · ${formatDate(session.date)}\n\n`;

        const kb = trips.slice(0, 8).map((t, i) => {
          text += `*${i+1}.* ${t.company}\n`;
          text += `   🕐 ${t.dep||t.depTime} → ${t.arr||t.arrTime}  ⏱ ${fmtDur(t.dur||t.durationMin)}\n`;
          text += `   💰 *${Number(t.unitPrice||t.price).toLocaleString('fr-FR')} FCFA*  💺 ${t.availableSeats} places\n\n`;
          return [{ text: `${i+1}. ${t.company} · ${t.dep||t.depTime} · ${Number(t.unitPrice||t.price).toLocaleString('fr-FR')} FCFA`, callback_data: `trip_${t.id}` }];
        });
        kb.push([{ text: '❌ Annuler', callback_data: 'cancel_flow' }]);

        await bot.editMessageText(text, {
          chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: kb }
        });
      } catch (e) {
        await bot.editMessageText(`❌ Erreur recherche : ${e.message}`, { chat_id: chatId, message_id: msgId });
      }
      return;
    }

    // Sélection trajet → sièges
    if (data.startsWith('trip_')) {
      const tripId  = data.replace('trip_', '');
      const session = bookingSessions.get(chatId) || {};
      session.tripId = tripId;
      session.step   = 'select_seat';
      bookingSessions.set(chatId, session);

      await bot.editMessageText('⏳ Chargement des sièges...', { chat_id: chatId, message_id: msgId });

      try {
        const detail = await busgo.getTripDetail({ trip_id: tripId });
        session.trip = detail;
        bookingSessions.set(chatId, session);

        // Calculer sièges libres
        const total      = detail.totalSeats || 70;
        const taken      = detail.takenSeats || [];
        const freeSeats  = Array.from({ length: total }, (_, i) => i + 1)
          .filter(n => !taken.includes(n));

        if (freeSeats.length === 0) {
          await bot.editMessageText('😕 Bus complet. Choisissez un autre trajet.',
            { chat_id: chatId, message_id: msgId }
          );
          return;
        }

        const seatRows = chunkArray(freeSeats.slice(0, 30), 5).map(row =>
          row.map(n => ({ text: `💺${n}`, callback_data: `seat_${n}` }))
        );
        seatRows.push([{ text: '❌ Annuler', callback_data: 'cancel_flow' }]);

        const tripInfo = `*${detail.company}*  ${detail.dep||detail.depTime} → ${detail.arr||detail.arrTime}\n💰 ${Number(detail.price).toLocaleString('fr-FR')} FCFA/pers.`;
        await bot.editMessageText(
          `🎫 *Choisissez votre siège*\n\n${tripInfo}\n\n${freeSeats.length} sièges libres :`,
          { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: seatRows } }
        );
      } catch (e) {
        await bot.editMessageText(`❌ Erreur : ${e.message}`, { chat_id: chatId, message_id: msgId });
      }
      return;
    }

    // Siège sélectionné → paiement
    if (data.startsWith('seat_')) {
      const seat    = parseInt(data.replace('seat_', ''));
      const session = bookingSessions.get(chatId) || {};
      session.seat  = seat;
      session.step  = 'select_payment';
      bookingSessions.set(chatId, session);

      const trip  = session.trip;
      const total = Number(trip?.price || 0) * session.pax + 500;

      const kb = [
        [
          { text: '🟡 MTN MoMo',      callback_data: 'PAY:mtn_momo' },
          { text: '🟠 Orange Money',   callback_data: 'PAY:orange_money' },
        ],
        [
          { text: '💳 Carte bancaire', callback_data: 'PAY:card' },
          { text: '🅿️ PayPal',         callback_data: 'PAY:paypal' },
        ],
        [{ text: '❌ Annuler', callback_data: 'cancel_flow' }],
      ];

      await bot.editMessageText(
`💳 *Mode de paiement*

🚌 ${session.from} → ${session.to}
🏢 ${trip?.company}
📅 ${formatDate(session.date)} · ${trip?.dep||trip?.depTime}
💺 Siège ${seat} · 👥 ${session.pax} pax
💰 *Total : ${total.toLocaleString('fr-FR')} FCFA*
_(dont 500 FCFA de frais de service)_`,
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: kb } }
      );
      return;
    }

    // Paiement → demander nom passager
    if (data.startsWith('PAY:')) {
      const payMethod = data.replace('PAY:', '');
      const session   = bookingSessions.get(chatId) || {};
      session.payMethod = payMethod;
      session.step      = 'ask_passenger_name';
      bookingSessions.set(chatId, session);

      await bot.editMessageText(
        '👤 *Nom du passager*\n\nEntrez le nom complet du passager principal :',
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[
            { text: '⏭️ Ignorer', callback_data: 'skip_passenger' }
          ]]}
        }
      );
      return;
    }

    // Ignorer le nom passager → confirmation directe
    if (data === 'skip_passenger') {
      const session = bookingSessions.get(chatId) || {};
      session.passengerName  = null;
      session.passengerPhone = null;
      await showConfirmation(bot, chatId, msgId, session);
      return;
    }

    // Confirmer réservation → ÉCRITURE EN BD
    if (data === 'confirm_booking') {
      const session = bookingSessions.get(chatId);
      if (!session) {
        await bot.editMessageText('❌ Session expirée. /reserver pour recommencer.', { chat_id: chatId, message_id: msgId });
        return;
      }

      await bot.editMessageText('⏳ *Réservation en cours...*\n_Écriture dans la base de données_',
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown' }
      );

      try {
        // ── APPEL API → BD ──────────────────────────────────────────────────
        const result = await busgo.createBooking({
          trip_id:        session.tripId,
          seat:           session.seat,
          pax:            session.pax,
          payment_method: session.payMethod,
          date:           session.date,
          userId:         chatId,              // ← Lier à l'utilisateur Telegram
          passengerName:  session.passengerName,
          passengerPhone: session.passengerPhone,
        });

        const booking = result.booking;
        bookingSessions.delete(chatId);
        memory.reset(chatId);

        console.log(`✅ RÉSERVATION BD : ${booking.id} | User Telegram: ${chatId}`);

        // ── Billet de confirmation ──────────────────────────────────────────
        await bot.editMessageText(
`🎉 *Réservation confirmée en base de données !*

━━━━━━━━━━━━━━━━━━━━━━
🎫 *BILLET busGO*
━━━━━━━━━━━━━━━━━━━━━━
📌 Réf : \`${booking.id}\`
🚌 ${session.from} → ${session.to}
🏢 ${session.trip?.company || booking.trip?.company}
📅 ${formatDate(session.date)}
🕐 Départ : ${session.trip?.dep || session.trip?.depTime}
💺 Siège : ${session.seat}
👥 ${session.pax} passager(s)
${session.passengerName ? `👤 ${session.passengerName}\n` : ''}💰 *${Number(booking.totalPrice).toLocaleString('fr-FR')} FCFA*

🔑 *Code de validation : \`${booking.validationCode}\`*
_Présentez ce code au contrôleur à bord_
━━━━━━━━━━━━━━━━━━━━━━
✅ Bon voyage ! 🇨🇲`,
          { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[
              { text: '📋 Mes réservations', callback_data: 'my_bookings' },
              { text: '🔍 Nouveau trajet',   callback_data: 'new_search'  },
            ]]}
          }
        );

      } catch (e) {
        const errMsg = e.response?.data?.error || e.response?.data?.details?.[0] || e.message;
        console.error(`❌ Booking error [${chatId}]:`, errMsg);
        await bot.editMessageText(
          `❌ *Échec de la réservation*\n\n${errMsg}\n\nTapez /reserver pour réessayer.`,
          { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown' }
        );
      }
      return;
    }

    // Annulation d'une réservation existante
    if (data.startsWith('cancel_') && !data.startsWith('cancel_flow')) {
      const bookingId = data.replace('cancel_', '');
      await bot.editMessageText(
        `⚠️ Confirmer l'annulation de *${bookingId}* ?`,
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[
            { text: '✅ Oui, annuler',  callback_data: `do_cancel_${bookingId}` },
            { text: '❌ Non, garder',   callback_data: 'my_bookings' },
          ]]}
        }
      );
      return;
    }

    if (data.startsWith('do_cancel_')) {
      const bookingId = data.replace('do_cancel_', '');
      try {
        await busgo.cancelBooking({ booking_id: bookingId, userId: chatId });
        await bot.editMessageText(
          `✅ Réservation *${bookingId}* annulée en base de données.`,
          { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown' }
        );
        console.log(`🗑️ ANNULATION BD : ${bookingId} | User Telegram: ${chatId}`);
      } catch (e) {
        await bot.editMessageText(
          `❌ Impossible d'annuler : ${e.response?.data?.error || e.message}`,
          { chat_id: chatId, message_id: msgId }
        );
      }
      return;
    }

    // Navigation
    if (data === 'cancel_flow') {
      bookingSessions.delete(chatId);
      await bot.editMessageText('❌ Réservation annulée.', { chat_id: chatId, message_id: msgId });
      return;
    }
    if (data === 'my_bookings') {
      bot.emit('message', { chat: { id: chatId }, from: query.from, text: '/mesbillets' });
      return;
    }
    if (data === 'new_search') {
      bot.emit('message', { chat: { id: chatId }, from: query.from, text: '/reserver' });
      return;
    }
  });

  // ── Messages texte ───────────────────────────────────────────────────────────
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text   = msg.text?.trim();
    if (!text) return;

    // Boutons clavier
    if (text === '🔍 Rechercher un bus') {
      await bot.sendMessage(chatId, 'Dites-moi votre trajet !\n_Ex: "Bus Yaoundé Douala demain"_', { parse_mode: 'Markdown' });
      return;
    }
    if (text === '🎫 Réserver')          { bot.emit('message', { ...msg, text: '/reserver' }); return; }
    if (text === '📋 Mes réservations')  { bot.emit('message', { ...msg, text: '/mesbillets' }); return; }
    if (text === '👤 Mon compte')        { bot.emit('message', { ...msg, text: '/compte' }); return; }
    if (text === '❓ Aide')              { bot.emit('message', { ...msg, text: '/help' }); return; }
    if (text.startsWith('/'))            return;

    // ── Tunnel login/register ──────────────────────────────────────────────────
    const session = bookingSessions.get(chatId);
    if (session?.step === 'login_email') {
      session.email = text;
      session.step  = 'login_password';
      bookingSessions.set(chatId, session);
      await bot.sendMessage(chatId, '🔑 Entrez votre mot de passe :', { reply_markup: { force_reply: true } });
      return;
    }
    if (session?.step === 'login_password') {
      try {
        const result = await busgo.loginUser(chatId, session.email, text);
        bookingSessions.delete(chatId);
        await bot.sendMessage(chatId, `✅ Connecté en tant que *${result.user.name}* !\n\nVos prochaines réservations seront liées à votre compte.`, { parse_mode: 'Markdown' });
      } catch (e) {
        await bot.sendMessage(chatId, `❌ Connexion échouée : ${e.response?.data?.error || e.message}\n\nRéessayez avec /login`);
        bookingSessions.delete(chatId);
      }
      return;
    }
    if (session?.step === 'register_name') {
      session.name = text;
      session.step = 'register_email';
      bookingSessions.set(chatId, session);
      await bot.sendMessage(chatId, '📧 Entrez votre adresse email :', { reply_markup: { force_reply: true } });
      return;
    }
    if (session?.step === 'register_email') {
      session.email = text;
      session.step  = 'register_password';
      bookingSessions.set(chatId, session);
      await bot.sendMessage(chatId, '🔑 Choisissez un mot de passe (8 caractères min) :', { reply_markup: { force_reply: true } });
      return;
    }
    if (session?.step === 'register_password') {
      try {
        const result = await busgo.registerUser(chatId, session.email, text, session.name);
        bookingSessions.delete(chatId);
        await bot.sendMessage(chatId, `✅ Compte créé ! Bienvenue *${result.user.name}* 🎉\n\nVos réservations seront sauvegardées dans votre compte.`, { parse_mode: 'Markdown' });
      } catch (e) {
        await bot.sendMessage(chatId, `❌ Erreur : ${e.response?.data?.error || e.message}`);
        bookingSessions.delete(chatId);
      }
      return;
    }

    // Nom passager dans le tunnel réservation
    if (session?.step === 'ask_passenger_name') {
      session.passengerName = text;
      session.step          = 'ask_passenger_phone';
      bookingSessions.set(chatId, session);
      await bot.sendMessage(chatId, '📱 Numéro de téléphone du passager (optionnel) :', {
        reply_markup: { inline_keyboard: [[
          { text: '⏭️ Ignorer', callback_data: 'skip_phone' }
        ]]}
      });
      return;
    }
    if (session?.step === 'ask_passenger_phone') {
      session.passengerPhone = text;
      // Trouver le dernier message du bot pour éditer
      await showConfirmationNewMsg(bot, chatId, session);
      return;
    }

    // ── Agent IA pour messages libres ──────────────────────────────────────────
    if (processing.has(chatId)) {
      await bot.sendMessage(chatId, '⏳ Patientez...');
      return;
    }
    processing.add(chatId);
    await bot.sendChatAction(chatId, 'typing');

    try {
      console.log(`\n📩 [${chatId}] ${msg.from?.first_name}: ${text}`);
      const response = await processMessage(chatId, text);
      await sendLongMessage(bot, chatId, response);
    } catch (err) {
      console.error(`❌ [${chatId}]:`, err?.message);
      await bot.sendMessage(chatId, `⚠️ Erreur : \`${err?.message}\`\n\n/reset pour recommencer.`, { parse_mode: 'Markdown' });
    } finally {
      processing.delete(chatId);
    }
  });

  bot.on('polling_error', (err) => {
    if (err.message?.includes('401')) console.error('❌ TELEGRAM 401 — Token invalide');
    else console.error('Telegram error:', err.code, err.message);
  });

  return bot;
}

// ── Afficher la confirmation ──────────────────────────────────────────────────
async function showConfirmation(bot, chatId, msgId, session) {
  const trip  = session.trip;
  const total = Number(trip?.price || 0) * session.pax + 500;

  const payLabels = {
    mtn_momo: '🟡 MTN MoMo', orange_money: '🟠 Orange Money',
    card: '💳 Carte', paypal: '🅿️ PayPal',
  };

  await bot.editMessageText(
`✅ *Récapitulatif de réservation*

🚌 ${session.from} → ${session.to}
🏢 *${trip?.company}*
📅 ${formatDate(session.date)}
🕐 ${trip?.dep||trip?.depTime} → ${trip?.arr||trip?.arrTime}
💺 Siège *${session.seat}*
👥 ${session.pax} passager(s)
${session.passengerName ? `👤 ${session.passengerName}\n` : ''}💳 ${payLabels[session.payMethod] || session.payMethod}
💰 Prix : ${Number(trip?.price||0).toLocaleString('fr-FR')} FCFA × ${session.pax}
📌 Frais : 500 FCFA
━━━━━━━━━━━━━━━━
💰 *Total : ${total.toLocaleString('fr-FR')} FCFA*

Confirmez-vous cette réservation ?`,
    { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[
        { text: '✅ Confirmer et réserver', callback_data: 'confirm_booking' },
        { text: '❌ Annuler',               callback_data: 'cancel_flow' },
      ]]}
    }
  );
}

async function showConfirmationNewMsg(bot, chatId, session) {
  const trip  = session.trip;
  const total = Number(trip?.price || 0) * session.pax + 500;
  const payLabels = { mtn_momo:'🟡 MTN MoMo', orange_money:'🟠 Orange Money', card:'💳 Carte', paypal:'🅿️ PayPal' };
  session.step = 'confirm';
  bookingSessions_ref.set(chatId, session);

  await bot.sendMessage(chatId,
`✅ *Récapitulatif*

🚌 ${session.from} → ${session.to} · ${session.trip?.company}
📅 ${formatDate(session.date)} · ${trip?.dep||trip?.depTime}
💺 Siège ${session.seat} · 👥 ${session.pax} pax
👤 ${session.passengerName} · 📱 ${session.passengerPhone}
💳 ${payLabels[session.payMethod]}
💰 *Total : ${total.toLocaleString('fr-FR')} FCFA*

Confirmez-vous ?`,
    { parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[
        { text: '✅ Confirmer', callback_data: 'confirm_booking' },
        { text: '❌ Annuler',   callback_data: 'cancel_flow' },
      ]]}
    }
  );
}

// Référence globale pour showConfirmationNewMsg
let bookingSessions_ref;

// ── Helpers ──────────────────────────────────────────────────────────────────
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function nextDays(n) {
  const jours = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const val   = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Auj.' : i === 1 ? 'Dem.' : `${jours[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`;
    return { value: val, label };
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T12:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
  } catch { return dateStr; }
}

function fmtDur(min) {
  if (!min) return '';
  const h = Math.floor(min/60), m = min%60;
  return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`;
}

async function sendLongMessage(bot, chatId, text) {
  const MAX = 4000;
  if (text.length <= MAX) {
    try { await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' }); }
    catch { await bot.sendMessage(chatId, text); }
    return;
  }
  const parts = [];
  let cur = '';
  for (const line of text.split('\n')) {
    if ((cur + '\n' + line).length > MAX) { if (cur) parts.push(cur.trim()); cur = line; }
    else cur += (cur ? '\n' : '') + line;
  }
  if (cur) parts.push(cur.trim());
  for (const part of parts) {
    try { await bot.sendMessage(chatId, part, { parse_mode: 'Markdown' }); }
    catch { await bot.sendMessage(chatId, part); }
    await new Promise(r => setTimeout(r, 300));
  }
}

// Init ref globale
function createBotWithRef(token) {
  const bot = createBot(token);
  // Patcher showConfirmationNewMsg
  const Map_ref = new Map();
  bookingSessions_ref = Map_ref;
  // On utilise bookingSessions directement
  bookingSessions_ref = bookingSessions;
  return bot;
}

module.exports = { createBot: createBotWithRef };
