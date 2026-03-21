// src/services/email.js — Service email busGO avec templates HTML
// Supporte : Gmail, SMTP custom, Mailtrap (tests), Brevo, SendGrid
const nodemailer = require('nodemailer');

// ── Configuration du transporteur ────────────────────────────────────────────
function createTransporter() {
  const service = process.env.EMAIL_SERVICE || 'smtp';

  // Mailtrap (sandbox gratuit pour les tests)
  if (process.env.MAILTRAP_USER) {
    return nodemailer.createTransporter({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });
  }

  // Gmail (activer "Mots de passe d'application" dans les paramètres Google)
  if (service === 'gmail') {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Mot de passe d'application, pas le vrai mot de passe
      },
    });
  }

  // SMTP générique (Brevo, SendGrid, OVH, etc.)
  return nodemailer.createTransporter({
    host:   process.env.SMTP_HOST || 'localhost',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
  });
}

const FROM_NAME    = process.env.EMAIL_FROM_NAME || 'busGO Cameroun';
const FROM_ADDRESS = process.env.EMAIL_FROM      || 'noreply@busgo.cm';
const SANDBOX_MODE = !process.env.EMAIL_USER && !process.env.MAILTRAP_USER;

// ── Styles communs ───────────────────────────────────────────────────────────
const CSS = `
  body { margin:0; padding:0; background:#f0f4f0; font-family: Arial, sans-serif; }
  .wrap { max-width:600px; margin:0 auto; background:#ffffff; }
  .header { background:#1a6b3c; padding:24px 32px; }
  .header-logo { color:#ffffff; font-size:28px; font-weight:900; margin:0; }
  .header-logo span { color:#e8a020; }
  .stripe { height:4px; display:flex; }
  .stripe-g { flex:1; background:#1a6b3c; }
  .stripe-r { flex:1; background:#c0392b; }
  .stripe-y { flex:1; background:#e8a020; }
  .body { padding:32px; }
  .title { font-size:22px; font-weight:700; color:#1a6b3c; margin:0 0 16px; }
  .ticket { background:#f0faf4; border:1px solid #b8dfc8; border-radius:12px; padding:20px 24px; margin:20px 0; }
  .ticket-ref { font-size:22px; font-weight:900; color:#1a6b3c; letter-spacing:2px; text-align:center; margin-bottom:16px; }
  .row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e8f5ee; font-size:14px; }
  .row:last-child { border-bottom:none; }
  .row label { color:#666; }
  .row value { font-weight:600; color:#1a1a1a; }
  .code-box { background:#1a6b3c; border-radius:10px; padding:16px; text-align:center; margin:20px 0; }
  .code-label { color:#aaddaa; font-size:12px; text-transform:uppercase; letter-spacing:1px; }
  .code-value { color:#ffffff; font-size:28px; font-weight:900; letter-spacing:8px; margin-top:6px; }
  .price-box { background:#e8a020; border-radius:8px; padding:12px 20px; text-align:center; margin:16px 0; }
  .price-val { color:#ffffff; font-size:24px; font-weight:900; }
  .btn { display:inline-block; background:#1a6b3c; color:#ffffff; text-decoration:none;
         padding:12px 28px; border-radius:8px; font-weight:700; font-size:14px; margin:16px 0; }
  .footer { background:#0f2416; padding:20px 32px; text-align:center; }
  .footer p { color:#7aad8a; font-size:12px; margin:4px 0; }
  .alert-box { background:#fff3cd; border:1px solid #ffc107; border-radius:8px; padding:14px 18px; margin:16px 0; }
  .cancel-header { background:#c0392b; padding:24px 32px; }
  .loyalty-box { background:#fff8e6; border:1px solid #f0c040; border-radius:10px; padding:14px 18px; margin:16px 0; text-align:center; }
`;

function htmlWrap(headerColor, headerContent, bodyContent) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${CSS}</style></head><body>
<div class="wrap">
  <div class="header" style="background:${headerColor}">
    ${headerContent}
  </div>
  <div class="stripe">
    <div class="stripe-g"></div>
    <div class="stripe-r"></div>
    <div class="stripe-y"></div>
  </div>
  <div class="body">${bodyContent}</div>
  <div class="footer">
    <p><strong style="color:#2db866">bus<span style="color:#e8a020">GO</span></strong> Cameroun</p>
    <p>Votre partenaire de voyage interurbain au Cameroun 🇨🇲</p>
    <p style="margin-top:8px;">Pour toute assistance : support@busgo.cm · +237 600 000 000</p>
  </div>
</div></body></html>`;
}

function ticketRows(b) {
  const rows = [
    ['Trajet',    `${b.trip?.from || '?'} → ${b.trip?.to || '?'}`],
    ['Compagnie', b.trip?.company || '?'],
    ['Départ',    b.trip?.dep || b.trip?.depTime || '?'],
    ['Date',      b.travelDate || '?'],
    ['Siège',     `N° ${b.seatNum}`],
    ['Passagers', `${b.pax}`],
  ];
  if (b.passengerName) rows.push(['Passager', b.passengerName]);
  return rows.map(([l,v]) =>
    `<div class="row"><span class="label">${l}</span><span class="value">${v}</span></div>`
  ).join('');
}

// ── 1. Confirmation de réservation ────────────────────────────────────────────
async function sendBookingConfirmationEmail(booking) {
  if (!booking.userEmail && !booking.passengerEmail) return { skipped: true };
  const to = booking.userEmail || booking.passengerEmail;

  const loyaltyHtml = booking.loyaltyEarned > 0
    ? `<div class="loyalty-box">
        🏆 Vous avez gagné <strong>${booking.loyaltyEarned} points de fidélité</strong> pour ce voyage !
       </div>`
    : '';

  const pdfBtn = booking.pdfUrl
    ? `<a href="${process.env.APP_URL || 'http://localhost:4000'}${booking.pdfUrl}"
          class="btn">📄 Télécharger mon billet PDF</a>`
    : '';

  const html = htmlWrap(
    '#1a6b3c',
    `<p class="header-logo">bus<span>GO</span></p>
     <p style="color:#aaddaa;margin:4px 0 0;font-size:13px;">Votre réservation est confirmée ! ✅</p>`,
    `<h1 class="title">Réservation confirmée</h1>
     <p style="color:#666;font-size:14px;">Bonjour ${booking.passengerName || 'voyageur'}, votre billet est prêt.</p>

     <div class="ticket">
       <div class="ticket-ref">${booking.id}</div>
       ${ticketRows(booking)}
     </div>

     <div class="price-box">
       <div style="color:#fff3;font-size:12px;">TOTAL PAYÉ</div>
       <div class="price-val">${Number(booking.totalPrice).toLocaleString('fr-FR')} FCFA</div>
     </div>

     <div class="code-box">
       <div class="code-label">Code de validation à présenter à bord</div>
       <div class="code-value">${booking.validationCode}</div>
     </div>

     ${pdfBtn}
     ${loyaltyHtml}

     <div class="alert-box">
       <strong>Important :</strong> Présentez votre code de validation ou votre billet PDF
       au contrôleur à bord. Arrivez à la gare au moins 15 minutes avant le départ.
     </div>`
  );

  return sendEmail({
    to,
    subject: `✅ Billet confirmé — ${booking.trip?.from} → ${booking.trip?.to} · ${booking.travelDate}`,
    html,
    text: `Réservation confirmée — Réf: ${booking.id}\n${booking.trip?.from} → ${booking.trip?.to}\nDate: ${booking.travelDate} · Siège: ${booking.seatNum}\nCode validation: ${booking.validationCode}\nTotal: ${Number(booking.totalPrice).toLocaleString('fr-FR')} FCFA`,
  });
}

// ── 2. Annulation ────────────────────────────────────────────────────────────
async function sendCancellationEmail(booking) {
  if (!booking.userEmail && !booking.passengerEmail) return { skipped: true };
  const to = booking.userEmail || booking.passengerEmail;

  const html = htmlWrap(
    '#c0392b',
    `<p class="header-logo">bus<span style="color:#e8a020">GO</span></p>
     <p style="color:#ffcccc;margin:4px 0 0;font-size:13px;">Votre réservation a été annulée</p>`,
    `<h1 class="title" style="color:#c0392b;">Réservation annulée</h1>
     <p style="color:#666;font-size:14px;">La réservation suivante a été annulée :</p>

     <div class="ticket" style="border-color:#f5c6cb;background:#fff5f5;">
       <div class="ticket-ref" style="color:#c0392b;">${booking.id}</div>
       ${ticketRows(booking)}
     </div>

     <div class="alert-box" style="background:#f8d7da;border-color:#f5c6cb;">
       Le remboursement sera traité sous <strong>48 à 72 heures ouvrables</strong>
       selon votre mode de paiement.
     </div>

     <p style="color:#666;font-size:14px;">
       Vous pouvez effectuer une nouvelle réservation sur
       <a href="${process.env.APP_URL || 'http://localhost:5173'}" style="color:#1a6b3c;">busgo.cm</a>
     </p>`
  );

  return sendEmail({
    to,
    subject: `❌ Annulation — ${booking.id} · ${booking.trip?.from} → ${booking.trip?.to}`,
    html,
    text: `Réservation annulée — Réf: ${booking.id}\n${booking.trip?.from} → ${booking.trip?.to}\nRemboursement sous 48-72h.`,
  });
}

// ── 3. Rappel J-1 ────────────────────────────────────────────────────────────
async function sendReminderEmail(booking) {
  if (!booking.userEmail && !booking.passengerEmail) return { skipped: true };
  const to = booking.userEmail || booking.passengerEmail;

  const html = htmlWrap(
    '#1a6b3c',
    `<p class="header-logo">bus<span>GO</span></p>
     <p style="color:#aaddaa;margin:4px 0 0;font-size:13px;">🔔 Rappel — Votre voyage est demain !</p>`,
    `<h1 class="title">Votre voyage est demain !</h1>
     <p style="color:#666;font-size:14px;">N'oubliez pas votre billet !</p>

     <div class="ticket">
       <div class="ticket-ref">${booking.id}</div>
       ${ticketRows(booking)}
     </div>

     <div class="code-box">
       <div class="code-label">Votre code de validation</div>
       <div class="code-value">${booking.validationCode}</div>
     </div>

     <div class="alert-box">
       ⏰ Soyez à la gare <strong>15 à 20 minutes avant</strong> l'heure de départ.
       Présentez ce code au contrôleur.
     </div>`
  );

  return sendEmail({
    to,
    subject: `⏰ Rappel voyage demain — ${booking.trip?.from} → ${booking.trip?.to} · ${booking.trip?.dep || booking.trip?.depTime}`,
    html,
    text: `Rappel : votre voyage est demain !\n${booking.trip?.from} → ${booking.trip?.to}\nDépart: ${booking.trip?.dep || '?'}\nCode: ${booking.validationCode}`,
  });
}

// ── 4. Validation à bord ─────────────────────────────────────────────────────
async function sendValidationEmail(booking) {
  if (!booking.userEmail && !booking.passengerEmail) return { skipped: true };
  const to = booking.userEmail || booking.passengerEmail;

  const html = htmlWrap(
    '#23904f',
    `<p class="header-logo">bus<span>GO</span></p>
     <p style="color:#aaddaa;margin:4px 0 0;font-size:13px;">✅ Billet validé à bord</p>`,
    `<h1 class="title">Bon voyage ! 🇨🇲</h1>
     <p style="color:#666;font-size:14px;">Votre billet a été validé. Bon voyage !</p>
     <div class="ticket">
       <div class="ticket-ref">${booking.id}</div>
       ${ticketRows(booking)}
     </div>
     <p style="color:#666;font-size:13px;text-align:center;">
       N'oubliez pas de noter votre voyage sur busGO après votre arrivée.
     </p>`
  );

  return sendEmail({
    to,
    subject: `✅ Bon voyage ! ${booking.trip?.from} → ${booking.trip?.to}`,
    html,
    text: `Billet validé — Bon voyage !\n${booking.trip?.from} → ${booking.trip?.to}`,
  });
}

// ── 5. Bienvenue nouvel utilisateur ──────────────────────────────────────────
async function sendWelcomeEmail(user) {
  if (!user.email) return { skipped: true };

  const html = htmlWrap(
    '#1a6b3c',
    `<p class="header-logo">bus<span>GO</span></p>
     <p style="color:#aaddaa;margin:4px 0 0;font-size:13px;">Bienvenue sur busGO Cameroun ! 🎉</p>`,
    `<h1 class="title">Bienvenue, ${user.name} !</h1>
     <p style="color:#666;font-size:14px;">
       Votre compte busGO est créé. Vous pouvez maintenant réserver vos billets de bus
       entre les 12 principales villes du Cameroun.
     </p>

     <div style="background:#f0faf4;border-radius:10px;padding:20px;margin:16px 0;">
       <p style="margin:0 0 10px;font-weight:700;color:#1a6b3c;">Avec busGO vous pouvez :</p>
       <p style="margin:4px 0;font-size:14px;">🚌 Réserver vos billets en ligne 24h/24</p>
       <p style="margin:4px 0;font-size:14px;">💳 Payer par MTN MoMo, Orange Money ou carte</p>
       <p style="margin:4px 0;font-size:14px;">📱 Gérer vos billets depuis votre téléphone</p>
       <p style="margin:4px 0;font-size:14px;">🏆 Cumuler des points de fidélité</p>
       <p style="margin:4px 0;font-size:14px;">🤖 Réserver via notre bot Telegram</p>
     </div>

     <a href="${process.env.APP_URL || 'http://localhost:5173'}" class="btn">
       Réserver mon premier billet →
     </a>

     ${user.referralCode ? `<div class="loyalty-box">
       🎁 Votre code parrainage : <strong style="font-size:18px;letter-spacing:3px;">${user.referralCode}</strong><br>
       <span style="font-size:12px;color:#666;">Partagez-le et gagnez 500 points à chaque ami parrainé !</span>
     </div>` : ''}`
  );

  return sendEmail({
    to:      user.email,
    subject: `🎉 Bienvenue sur busGO Cameroun, ${user.name} !`,
    html,
    text: `Bienvenue sur busGO Cameroun, ${user.name} !\nRéservez vos billets de bus en ligne : ${process.env.APP_URL || 'http://localhost:5173'}`,
  });
}

// ── Envoi générique ──────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, text, attachments = [] }) {
  if (SANDBOX_MODE) {
    console.log(`[EMAIL SANDBOX] To: ${to}`);
    console.log(`[EMAIL SANDBOX] Subject: ${subject}`);
    return { success: true, sandbox: true, messageId: 'sandbox' };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from:        `"${FROM_NAME}" <${FROM_ADDRESS}>`,
      to,
      subject,
      html,
      text,
      attachments,
    });
    console.log(`[EMAIL] Envoyé → ${to} | ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL Error] ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendEmail,
  sendBookingConfirmationEmail,
  sendCancellationEmail,
  sendReminderEmail,
  sendValidationEmail,
  sendWelcomeEmail,
};
