// src/utils/formatter.js
// Helpers de formatage pour les messages Telegram

function fmtPrice(price) {
  return typeof price === 'number'
    ? price.toFixed(2).replace('.', ',') + ' €'
    : price;
}

function fmtDuration(minutes) {
  if (!minutes) return '?';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  } catch { return dateStr; }
}

// Escape Markdown V1 special chars for Telegram
function escMd(text) {
  if (!text) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

module.exports = { fmtPrice, fmtDuration, fmtDate, escMd };
