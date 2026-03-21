// src/services/pdf.js — Génération de billets PDF avec QR code
const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const fs          = require('fs');
const path        = require('path');

const OUT_DIR = path.join(__dirname, '../../uploads/tickets');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function generateTicketPDF(booking) {
  return new Promise(async (resolve, reject) => {
    try {
      const qrData = JSON.stringify({
        id:   booking.id,
        code: booking.validationCode,
        trip: `${booking.trip?.from}→${booking.trip?.to}`,
        date: booking.travelDate,
      });

      const qrBuffer = await QRCode.toBuffer(qrData, {
        width: 150, margin: 1,
        color: { dark: '#1a6b3c', light: '#ffffff' },
      });

      const filename = `ticket_${booking.id}.pdf`;
      const filepath = path.join(OUT_DIR, filename);
      const doc      = new PDFDocument({ size: 'A5', margin: 30 });
      const stream   = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // ── En-tête ────────────────────────────────────────────────────────────
      // Bande verte
      doc.rect(0, 0, doc.page.width, 60).fill('#1a6b3c');

      // Logo texte
      doc.font('Helvetica-Bold').fontSize(28).fillColor('#ffffff')
         .text('bus', 20, 15, { continued: true })
         .fillColor('#e8a020').text('GO');

      doc.font('Helvetica').fontSize(10).fillColor('#aaddaa')
         .text('Cameroun', 20, 42);

      doc.font('Helvetica').fontSize(10).fillColor('#ffffff')
         .text('BILLET OFFICIEL', 0, 22, { align: 'right', width: doc.page.width - 20 });

      // Bande tricolore
      const bw = doc.page.width / 3;
      doc.rect(0, 60, bw, 4).fill('#1a6b3c');
      doc.rect(bw, 60, bw, 4).fill('#c0392b');
      doc.rect(bw * 2, 60, bw, 4).fill('#e8a020');

      // ── Référence ──────────────────────────────────────────────────────────
      doc.rect(0, 64, doc.page.width, 32).fill('#f0faf4');
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#1a6b3c')
         .text(booking.id, 0, 72, { align: 'center' });

      // ── Corps ──────────────────────────────────────────────────────────────
      const y0 = 105;
      const lh = 22;

      const row = (label, value, y, bold = false) => {
        doc.font('Helvetica').fontSize(9).fillColor('#888888').text(label, 20, y);
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11)
           .fillColor('#1a1a1a').text(value, 20, y + 11);
      };

      row('TRAJET',    `${booking.trip?.from || '?'} → ${booking.trip?.to || '?'}`, y0, true);
      row('COMPAGNIE', booking.trip?.company || '?', y0 + lh * 2);
      row('DÉPART',    booking.trip?.dep || booking.trip?.depTime || '?', y0 + lh * 4);
      row('DATE',      booking.travelDate || '?', y0 + lh * 4, false);

      // Colonne droite
      if (booking.trip?.dep) {
        doc.font('Helvetica').fontSize(9).fillColor('#888888')
           .text('DATE', 200, y0 + lh * 4);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a1a1a')
           .text(booking.travelDate, 200, y0 + lh * 4 + 11);
      }

      row('SIÈGE',     `N° ${booking.seatNum}`, y0 + lh * 6);
      row('PASSAGERS', `${booking.pax} passager(s)`, y0 + lh * 6);

      if (booking.passengerName) {
        row('PASSAGER', booking.passengerName, y0 + lh * 8, true);
      }

      // Prix
      doc.rect(0, y0 + lh * 10, doc.page.width, 28).fill('#1a6b3c');
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#ffffff')
         .text(`${Number(booking.totalPrice).toLocaleString('fr-FR')} FCFA`, 0, y0 + lh * 10 + 7, { align: 'center' });

      // ── QR Code ────────────────────────────────────────────────────────────
      const qrY = y0 + lh * 12;
      doc.image(qrBuffer, doc.page.width / 2 - 75, qrY, { width: 150 });

      doc.font('Helvetica').fontSize(8).fillColor('#888888')
         .text('Présentez ce code au contrôleur à bord', 0, qrY + 155, { align: 'center' });

      // Code validation
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#1a6b3c')
         .text(booking.validationCode || '------', 0, qrY + 168, { align: 'center', characterSpacing: 8 });

      // ── Pied de page ───────────────────────────────────────────────────────
      doc.rect(0, doc.page.height - 24, doc.page.width, 24).fill('#0f2416');
      doc.font('Helvetica').fontSize(7).fillColor('#aaddaa')
         .text('busGO Cameroun · www.busgo.cm · Ce billet est personnel et non cessible', 0, doc.page.height - 17, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve({ filepath, filename, url: `/uploads/tickets/${filename}` });
      });
      stream.on('error', reject);

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateTicketPDF, OUT_DIR };
