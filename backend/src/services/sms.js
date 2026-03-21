// src/services/sms.js — SMS via Africa's Talking (Cameroun)
const axios = require('axios');

const AT_USERNAME = process.env.AT_USERNAME || 'sandbox';
const AT_API_KEY  = process.env.AT_API_KEY  || 'sandbox_key';
const AT_SENDER   = process.env.AT_SENDER   || 'busGO';
const SANDBOX     = AT_USERNAME === 'sandbox';
const BASE_URL    = SANDBOX
  ? 'https://api.sandbox.africastalking.com/version1/messaging'
  : 'https://api.africastalking.com/version1/messaging';

function normalizePhone(phone) {
  if (!phone) return null;
  let n = String(phone).replace(/[\s\-\(\)\.]/g, '');
  if (n.length < 8 || n.length > 15) return null;
  if (!n.startsWith('+')) {
    if (n.startsWith('237'))      n = '+' + n;
    else if (n.length === 9)      n = '+237' + n;
    else if (n.startsWith('00')) n = '+' + n.slice(2);
  }
  return n;
}

async function sendSMS(phone, message) {
  const normalized = normalizePhone(phone);
  if (!normalized) return { skipped: true, reason: 'invalid_phone' };

  if (SANDBOX) {
    console.log(`[SMS SANDBOX] → ${normalized}\n${message}`);
    return { success: true, sandbox: true, to: normalized };
  }

  try {
    const params = new URLSearchParams({
      username: AT_USERNAME, to: normalized, message, from: AT_SENDER,
    });
    const res = await axios.post(BASE_URL, params.toString(), {
      headers: { 'apiKey': AT_API_KEY, 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      timeout: 10000,
    });
    const ok = (res.data?.SMSMessageData?.Recipients || []).some(r => r.status === 'Success');
    console.log(`[SMS] ${normalized}: ${ok ? '✅' : '❌'}`);
    return { success: ok, data: res.data };
  } catch (err) {
    console.error('[SMS Error]', err.message);
    return { success: false, error: err.message };
  }
}

async function sendBookingConfirmationSMS(booking) {
  if (!booking.passengerPhone) return { skipped: true };
  return sendSMS(booking.passengerPhone,
    `busGO: Reservation confirmee!\n` +
    `Ref: ${booking.id}\n` +
    `${booking.trip?.from} -> ${booking.trip?.to}\n` +
    `${booking.travelDate} dep.${booking.trip?.dep || booking.trip?.depTime || '?'}\n` +
    `Siege ${booking.seatNum} | ${booking.pax}pax\n` +
    `Code: ${booking.validationCode}\n` +
    `${Number(booking.totalPrice).toLocaleString('fr-FR')} FCFA - Bon voyage! 🇨🇲`
  );
}

async function sendCancellationSMS(booking) {
  if (!booking.passengerPhone) return { skipped: true };
  return sendSMS(booking.passengerPhone,
    `busGO: Annulation confirmee\nRef: ${booking.id}\n` +
    `${booking.trip?.from} -> ${booking.trip?.to}\n` +
    `Remboursement sous 48h. Support: +237 600 000 000`
  );
}

async function sendReminderSMS(booking) {
  if (!booking.passengerPhone) return { skipped: true };
  return sendSMS(booking.passengerPhone,
    `busGO RAPPEL: Voyage demain!\n` +
    `${booking.trip?.from} -> ${booking.trip?.to}\n` +
    `Depart: ${booking.trip?.dep || booking.trip?.depTime || '?'}\n` +
    `Code: ${booking.validationCode}\nSoyez a la gare 15min avant.`
  );
}

async function sendValidationSMS(booking) {
  if (!booking.passengerPhone) return { skipped: true };
  return sendSMS(booking.passengerPhone,
    `busGO: Billet valide!\n${booking.trip?.from} -> ${booking.trip?.to}\nBon voyage! 🇨🇲`
  );
}

module.exports = { sendSMS, normalizePhone, sendBookingConfirmationSMS, sendCancellationSMS, sendReminderSMS, sendValidationSMS };
