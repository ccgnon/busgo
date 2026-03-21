// src/tools/busgoClient.js
// Couche d'accès à l'API busGO — utilisée par l'agent comme outils

const axios = require('axios');

const api = axios.create({
  baseURL: process.env.BUSGO_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
});

let _token = null;

// ── Auth ──────────────────────────────────────────────────────────────────────
async function getToken() {
  if (_token) return _token;
  try {
    const res = await api.post('/auth/login', {
      email:    process.env.AGENT_USER_EMAIL    || 'demo@busgo.fr',
      password: process.env.AGENT_USER_PASSWORD || 'demo1234',
    });
    _token = res.data.token;
    return _token;
  } catch {
    return null; // Agent peut fonctionner sans auth pour les recherches
  }
}

async function authHeader() {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Tool: search_trips ────────────────────────────────────────────────────────
async function searchTrips({ from, to, date, pax = 1 }) {
  const res = await api.get('/trips/search', {
    params: { from, to, date, pax },
  });
  return res.data;
}

// ── Tool: get_trip_detail ─────────────────────────────────────────────────────
async function getTripDetail({ trip_id }) {
  const res = await api.get(`/trips/${trip_id}`);
  return res.data;
}

// ── Tool: get_stations ────────────────────────────────────────────────────────
async function getStations() {
  const res = await api.get('/trips/stations');
  return res.data;
}

// ── Tool: create_booking ──────────────────────────────────────────────────────
async function createBooking({ trip_id, seat, pax, payment_method, date }) {
  const headers = await authHeader();
  const res = await api.post('/bookings', {
    tripId:        trip_id,
    seat,
    pax,
    paymentMethod: payment_method || 'card',
    date,
  }, { headers });
  return res.data;
}

// ── Tool: get_booking ─────────────────────────────────────────────────────────
async function getBooking({ booking_id }) {
  const headers = await authHeader();
  const res = await api.get(`/bookings/${booking_id}`, { headers });
  return res.data;
}

// ── Tool: cancel_booking ──────────────────────────────────────────────────────
async function cancelBooking({ booking_id }) {
  const headers = await authHeader();
  const res = await api.delete(`/bookings/${booking_id}`, { headers });
  return res.data;
}

// ── Tool: get_my_bookings ─────────────────────────────────────────────────────
async function getMyBookings() {
  const headers = await authHeader();
  const res = await api.get('/bookings', { headers });
  return res.data;
}

// ── Tool: check_api_health ────────────────────────────────────────────────────
async function checkHealth() {
  const res = await axios.get(
    (process.env.BUSGO_API_URL || 'http://localhost:4000/api').replace('/api', '/health')
  );
  return res.data;
}

module.exports = {
  searchTrips,
  getTripDetail,
  getStations,
  createBooking,
  getBooking,
  cancelBooking,
  getMyBookings,
  checkHealth,
};
