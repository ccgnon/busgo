/**
 * busGO CMR — Service d'envoi d'e-mails (Nodemailer)
 * Configure via variables d'environnement :
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * Fallback : mode "ethereal" (test) si pas de SMTP configuré
 */

const nodemailer = require('nodemailer');

let _transport = null;

async function getTransport() {
  if (_transport) return _transport;

  if (process.env.SMTP_HOST) {
    _transport = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    // Mode test — les e-mails sont loggués dans la console
    const test = await nodemailer.createTestAccount();
    _transport = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: test.user, pass: test.pass },
    });
    console.log('📧 Mailer test (Ethereal) — url de prévisualisation affichée dans les logs');
  }
  return _transport;
}

const FROM = process.env.SMTP_FROM || '"busGO CMR 🚌" <noreply@busgo.cm>';

// ─── Templates HTML ──────────────────────────────────────────────────────────

function baseTemplate(body) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f0ece4;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#1a3a2a,#2d5c3f);padding:28px 32px;text-align:center}
  .logo{color:#fcd116;font-size:1.6rem;font-weight:800;letter-spacing:-.02em;font-family:Georgia,serif}
  .tagline{color:rgba(255,255,255,.6);font-size:.8rem;margin-top:4px}
  .body{padding:32px}
  .title{font-family:Georgia,serif;font-size:1.4rem;color:#1a3a2a;margin:0 0 16px}
  .card{background:#f8f4ee;border-radius:14px;padding:20px;margin:20px 0}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e8e0d0;font-size:.9rem}
  .row:last-child{border-bottom:none}
  .label{color:#8a7d6e;font-weight:600}
  .value{color:#1a3a2a;font-weight:700;text-align:right}
  .badge{display:inline-block;padding:4px 14px;border-radius:50px;font-size:.75rem;font-weight:800}
  .badge-green{background:#dcfce7;color:#166534}
  .badge-red{background:#fee2e2;color:#991b1b}
  .badge-yellow{background:#fef9c3;color:#854d0e}
  .code-box{background:#1a3a2a;border-radius:12px;padding:20px;text-align:center;margin:24px 0}
  .code{font-family:monospace;font-size:2rem;font-weight:800;color:#fcd116;letter-spacing:.15em}
  .btn{display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#007a5e,#00a87d);color:#fff;text-decoration:none;border-radius:12px;font-weight:800;font-size:.95rem;margin:20px 0}
  .footer{background:#f8f4ee;padding:20px 32px;text-align:center;font-size:.75rem;color:#8a7d6e;border-top:1px solid #e8e0d0}
  .divider{height:1px;background:#e8e0d0;margin:20px 0}
  p{color:#4b5563;line-height:1.7;margin:0 0 12px}
</style></head>
<body><div class="wrap">${body}<div class="footer">
  © ${new Date().getFullYear()} busGO CMR · Réservations de bus interurbains au Cameroun<br>
  Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre directement.
</div></div></body></html>`;
}

// ─── sendBookingConfirmation ─────────────────────────────────────────────────
async function sendBookingConfirmation(booking, trip, user) {
  const transport = await getTransport();
  const from  = trip.from?.name || trip.from?.city || '—';
  const to    = trip.to?.name   || trip.to?.city   || '—';
  const dep   = new Date(trip.departureTime).toLocaleString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const arr   = new Date(trip.arrivalTime  ).toLocaleString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  const agency = trip.agency?.name || 'Agence partenaire';

  const html = baseTemplate(`
    <div class="header">
      <div class="logo">🚌 busGO CMR</div>
      <div class="tagline">Votre billet de voyage</div>
    </div>
    <div class="body">
      <h1 class="title">Réservation confirmée ✅</h1>
      <p>Bonjour <strong>${user?.name || booking.passengerName || 'Voyageur'}</strong>,<br>
         Votre réservation a bien été enregistrée. Bon voyage !</p>

      <div class="card">
        <div class="row"><span class="label">Référence</span><span class="value" style="font-family:monospace">${booking.id}</span></div>
        <div class="row"><span class="label">Agence</span><span class="value">${agency}</span></div>
        <div class="row"><span class="label">Trajet</span><span class="value">${from} → ${to}</span></div>
        <div class="row"><span class="label">Départ</span><span class="value">${dep}</span></div>
        <div class="row"><span class="label">Arrivée</span><span class="value">${arr}</span></div>
        <div class="row"><span class="label">Passager principal</span><span class="value">${booking.passengerName || '—'}</span></div>
        <div class="row"><span class="label">Nombre de places</span><span class="value">${booking.pax}</span></div>
        <div class="row"><span class="label">Mode de paiement</span><span class="value">${booking.paymentMethod?.replace('_',' ')}</span></div>
        <div class="row"><span class="label">Montant total</span><span class="value" style="color:#007a5e;font-size:1.1rem">${booking.totalPrice?.toLocaleString('fr-FR')} FCFA</span></div>
      </div>

      <div class="code-box">
        <div style="color:rgba(255,255,255,.7);font-size:.8rem;margin-bottom:8px">CODE DE VALIDATION EMBARQUEMENT</div>
        <div class="code">${booking.validationCode || '——'}</div>
        <div style="color:rgba(255,255,255,.5);font-size:.72rem;margin-top:8px">Présentez ce code à l'agent au moment de l'embarquement</div>
      </div>

      <p style="font-size:.82rem;color:#8a7d6e">⏰ Présentez-vous à la gare au moins <strong>30 minutes avant le départ</strong>.<br>
      📵 En cas de problème, contactez l'agence ${agency} : ${trip.agency?.phone || ''}</p>
    </div>
  `);

  const info = await transport.sendMail({
    from, to: user?.email || booking.passengerPhone,
    subject: `🎫 Réservation ${booking.id} — ${from} → ${to}`,
    html,
  });
  if (nodemailer.getTestMessageUrl(info)) {
    console.log('📧 Mail de confirmation (test) :', nodemailer.getTestMessageUrl(info));
  }
  return info;
}

// ─── sendBookingCancellation ─────────────────────────────────────────────────
async function sendBookingCancellation(booking, trip, user, reason) {
  const transport = await getTransport();
  const from  = trip?.from?.name || trip?.from?.city || '—';
  const to    = trip?.to?.name   || trip?.to?.city   || '—';

  const html = baseTemplate(`
    <div class="header">
      <div class="logo">🚌 busGO CMR</div>
      <div class="tagline">Annulation de réservation</div>
    </div>
    <div class="body">
      <h1 class="title">Réservation annulée ❌</h1>
      <p>Bonjour <strong>${user?.name || booking.passengerName || 'Voyageur'}</strong>,<br>
         Votre réservation a été annulée.${reason ? ` Motif : <em>${reason}</em>.` : ''}</p>
      <div class="card">
        <div class="row"><span class="label">Référence</span><span class="value" style="font-family:monospace">${booking.id}</span></div>
        <div class="row"><span class="label">Trajet</span><span class="value">${from} → ${to}</span></div>
        <div class="row"><span class="label">Montant</span><span class="value">${booking.totalPrice?.toLocaleString('fr-FR')} FCFA</span></div>
        <div class="row"><span class="label">Statut</span><span class="value"><span class="badge badge-red">Annulé</span></span></div>
      </div>
      <p style="font-size:.85rem">Si vous avez des questions, contactez notre support à <a href="mailto:support@busgo.cm">support@busgo.cm</a>.</p>
    </div>
  `);

  const info = await transport.sendMail({
    from, to: user?.email || '',
    subject: `❌ Annulation réservation ${booking.id}`,
    html,
  });
  if (nodemailer.getTestMessageUrl(info)) {
    console.log('📧 Mail annulation (test) :', nodemailer.getTestMessageUrl(info));
  }
  return info;
}

// ─── sendBookingUpdate ───────────────────────────────────────────────────────
async function sendBookingUpdate(booking, trip, user, changes) {
  const transport = await getTransport();
  const from  = trip?.from?.name || trip?.from?.city || '—';
  const to    = trip?.to?.name   || trip?.to?.city   || '—';

  const changesHtml = Object.entries(changes)
    .map(([k, v]) => `<div class="row"><span class="label">${k}</span><span class="value">${v}</span></div>`)
    .join('');

  const html = baseTemplate(`
    <div class="header">
      <div class="logo">🚌 busGO CMR</div>
      <div class="tagline">Modification de réservation</div>
    </div>
    <div class="body">
      <h1 class="title">Votre réservation a été modifiée 📝</h1>
      <p>Bonjour <strong>${user?.name || booking.passengerName || 'Voyageur'}</strong>,<br>
         Votre réservation <strong>${booking.id}</strong> (${from} → ${to}) a été mise à jour par l'agence.</p>
      <div class="card">
        <div style="font-size:.75rem;font-weight:800;color:#8a7d6e;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">Modifications apportées</div>
        ${changesHtml}
      </div>
      <div class="code-box">
        <div style="color:rgba(255,255,255,.7);font-size:.8rem;margin-bottom:8px">CODE DE VALIDATION</div>
        <div class="code">${booking.validationCode || '——'}</div>
      </div>
    </div>
  `);

  const info = await transport.sendMail({
    from, to: user?.email || '',
    subject: `📝 Modification réservation ${booking.id}`,
    html,
  });
  if (nodemailer.getTestMessageUrl(info)) {
    console.log('📧 Mail modification (test) :', nodemailer.getTestMessageUrl(info));
  }
  return info;
}

module.exports = { sendBookingConfirmation, sendBookingCancellation, sendBookingUpdate };
