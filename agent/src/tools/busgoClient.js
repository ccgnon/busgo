// src/tools/busgoClient.js — Client API busGO avec auth par utilisateur Telegram

const axios = require('axios');

const api = axios.create({
  baseURL: process.env.BUSGO_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
});

// Token par utilisateur Telegram (userId → token JWT)
const _tokens = new Map();
// Compte de service pour les réservations anonymes
let _serviceToken = null;

// ── Auth service (compte agent) ───────────────────────────────────────────────
async function getServiceToken() {
  if (_serviceToken) return _serviceToken;
  try {
    const res = await api.post('/auth/login', {
      email:    process.env.AGENT_USER_EMAIL    || 'demo@busgo.fr',
      password: process.env.AGENT_USER_PASSWORD || 'demo1234',
    });
    _serviceToken = res.data.token;
    console.log('✅ Service token obtenu');
    return _serviceToken;
  } catch (err) {
    console.error('❌ Service login failed:', err.response?.data?.error || err.message);
    return null;
  }
}

// ── Auth utilisateur Telegram ─────────────────────────────────────────────────
async function loginUser(userId, email, password) {
  const res = await api.post('/auth/login', { email, password });
  _tokens.set(String(userId), res.data.token);
  return res.data;
}

async function registerUser(userId, email, password, name) {
  const res = await api.post('/auth/register', { email, password, name });
  _tokens.set(String(userId), res.data.token);
  return res.data;
}

async function logoutUser(userId) {
  _tokens.delete(String(userId));
}

function getUserToken(userId) {
  return _tokens.get(String(userId)) || null;
}

async function getAuthHeader(userId) {
  // Priorité : token utilisateur > token service
  const userToken = getUserToken(userId);
  if (userToken) return { Authorization: `Bearer ${userToken}` };
  const svcToken = await getServiceToken();
  return svcToken ? { Authorization: `Bearer ${svcToken}` } : {};
}

async function getMe(userId) {
  const headers = await getAuthHeader(userId);
  const res = await api.get('/auth/me', { headers });
  return res.data;
}

// ── Recherche trajets ─────────────────────────────────────────────────────────
async function searchTrips({ from, to, date, pax = 1 }) {
  const res = await api.get('/trips/search', { params: { from, to, date, pax } });
  return res.data;
}

async function getTripDetail({ trip_id }) {
  const res = await api.get(`/trips/${trip_id}`);
  return res.data;
}

async function getStations() {
  const res = await api.get('/trips/stations');
  return res.data;
}

// ── Réservation (avec userId pour lier à un compte) ───────────────────────────
async function createBooking({ trip_id, seat, pax, payment_method, date, userId, passengerName, passengerPhone }) {
  const headers = await getAuthHeader(userId);
  const res = await api.post('/bookings', {
    tripId:         trip_id,
    seat:           parseInt(seat, 10),
    pax:            parseInt(pax,  10),
    paymentMethod:  payment_method || 'mtn_momo',
    date,
    passengerName,
    passengerPhone,
  }, { headers });
  return res.data;
}

async function getBooking({ booking_id, userId }) {
  const headers = await getAuthHeader(userId);
  const res = await api.get(`/bookings/${booking_id}`, { headers });
  return res.data;
}

async function cancelBooking({ booking_id, userId }) {
  const headers = await getAuthHeader(userId);
  const res = await api.delete(`/bookings/${booking_id}`, { headers });
  return res.data;
}

async function getMyBookings({ userId }) {
  const headers = await getAuthHeader(userId);
  const res = await api.get('/bookings', { headers });
  return res.data;
}

async function validateBooking({ booking_id, code, userId }) {
  const headers = await getAuthHeader(userId);
  const res = await api.post(`/bookings/${booking_id}/validate`, { code }, { headers });
  return res.data;
}

async function checkHealth() {
  const res = await axios.get(
    (process.env.BUSGO_API_URL || 'http://localhost:4000/api').replace('/api', '/health')
  );
  return res.data;
}

module.exports = {
  loginUser, registerUser, logoutUser, getUserToken, getMe,
  searchTrips, getTripDetail, getStations,
  createBooking, getBooking, cancelBooking, getMyBookings, validateBooking,
  checkHealth,
};
