// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('busgo_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize errors
api.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err.response?.data || { error: 'Erreur réseau' })
);

// ── Trips ─────────────────────────────────────────────────
export const searchTrips = (from, to, date, pax) =>
  api.get('/trips/search', { params: { from, to, date, pax } });

export const getTrip = (id) =>
  api.get(`/trips/${id}`);

export const getStations = () =>
  api.get('/trips/stations');

// ── Bookings ──────────────────────────────────────────────
export const createBooking = (payload) =>
  api.post('/bookings', payload);

export const getBooking = (id) =>
  api.get(`/bookings/${id}`);

export const getMyBookings = () =>
  api.get('/bookings');

export const cancelBooking = (id) =>
  api.delete(`/bookings/${id}`);

// ── Auth ──────────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (email, password, name) =>
  api.post('/auth/register', { email, password, name });

export const getMe = () =>
  api.get('/auth/me');

export default api;

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminStats     = ()        => api.get('/admin/stats');
export const adminBookings  = (p)       => api.get('/admin/bookings', { params: p });
export const adminUsers     = ()        => api.get('/admin/users');
export const adminPatchUser = (id, d)   => api.patch(`/admin/users/${id}`, d);
export const adminAgencies  = ()        => api.get('/admin/agencies');
export const adminCreateAgency = (d)    => api.post('/admin/agencies', d);
export const adminPatchAgency  = (id,d) => api.patch(`/admin/agencies/${id}`, d);
export const adminTrips     = (p)       => api.get('/admin/trips', { params: p });
export const adminPatchTrip = (id, d)   => api.patch(`/admin/trips/${id}`, d);
export const adminDeleteTrip= (id)      => api.delete(`/admin/trips/${id}`);

// ── Agency ────────────────────────────────────────────────────────────────────
export const agencyMe       = ()        => api.get('/agency/me');
export const agencyStats    = ()        => api.get('/agency/stats');
export const agencyTrips    = (p)       => api.get('/agency/trips', { params: p });
export const agencyCreateTrip = (d)     => api.post('/agency/trips', d);
export const agencyPatchTrip  = (id,d)  => api.patch(`/agency/trips/${id}`, d);
export const agencyDeleteTrip = (id)    => api.delete(`/agency/trips/${id}`);
export const agencyBookings = (p)       => api.get('/agency/bookings', { params: p });

// ── Fidélité & parrainage ──────────────────────────────────────────────────────
export const getLoyalty     = ()         => api.get('/loyalty/me');
export const checkReferral  = (code)     => api.get(`/loyalty/referral/${code}`);

// ── Avis ──────────────────────────────────────────────────────────────────────
export const submitReview   = (d)        => api.post('/reviews', d);
export const getTripReviews = (tripId)   => api.get(`/reviews/trip/${tripId}`);

// ── Téléchargement billet PDF ─────────────────────────────────────────────────
export const downloadTicket = (bookingId) =>
  api.get(`/bookings/${bookingId}`, {}).then(b => b.pdfUrl
    ? window.open(b.pdfUrl, '_blank')
    : alert('PDF non encore généré, réessayez dans quelques instants'));
