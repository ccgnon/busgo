const BASE = '/api';

function headers() {
  const t = localStorage.getItem('busgo_token');
  return {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) return Promise.reject(data);
  return data;
}

const get  = path       => req('GET',    path);
const post = (path, b)  => req('POST',   path, b);
const patch= (path, b)  => req('PATCH',  path, b);
const del  = path       => req('DELETE', path);

// ── Auth ───────────────────────────────────────────────────────────────────
export const login    = (email, password) => post('/auth/login',    { email, password });
export const register = (email, password, name) => post('/auth/register', { email, password, name });
export const getMe    = ()                => get('/auth/me');

// ── Trips ──────────────────────────────────────────────────────────────────
export const searchTrips = (from, to, date, pax) =>
  get(`/trips/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&pax=${pax}`);
export const getTrip     = id => get(`/trips/${id}`);
export const getStations = () => get('/trips/stations');

// ── Bookings ───────────────────────────────────────────────────────────────
export const createBooking = payload => post('/bookings', payload);
export const getBooking    = id      => get(`/bookings/${id}`);
export const getMyBookings = ()      => get('/bookings');
export const cancelBooking = id      => del(`/bookings/${id}`);
export const validateBooking = (id, code) => post(`/bookings/${id}/validate`, { code });

// ── Loyalty ────────────────────────────────────────────────────────────────
export const getLoyalty    = ()     => get('/loyalty/me');
export const checkReferral = code   => get(`/loyalty/referral/${code}`);

// ── Reviews ────────────────────────────────────────────────────────────────
export const submitReview   = data   => post('/reviews', data);
export const getTripReviews = tripId => get(`/reviews/trip/${tripId}`);

// ── Admin ──────────────────────────────────────────────────────────────────
export const adminStats        = ()         => get('/admin/stats');
export const adminBookings     = (p = {})   => get(`/admin/bookings?${new URLSearchParams(p)}`);
export const adminUsers        = ()         => get('/admin/users');
export const adminPatchUser    = (id, d)    => patch(`/admin/users/${id}`, d);
export const adminAgencies     = ()         => get('/admin/agencies');
export const adminCreateAgency = d          => post('/admin/agencies', d);
export const adminPatchAgency  = (id, d)    => patch(`/admin/agencies/${id}`, d);
export const adminTrips        = (p = {})   => get(`/admin/trips?${new URLSearchParams(p)}`);
export const adminPatchTrip    = (id, d)    => patch(`/admin/trips/${id}`, d);
export const adminDeleteTrip   = id         => del(`/admin/trips/${id}`);

// ── Agency ─────────────────────────────────────────────────────────────────
export const agencyMe          = ()         => get('/agency/me');
export const agencyStats       = ()         => get('/agency/stats');
export const agencyTrips       = (p = {})   => get(`/agency/trips?${new URLSearchParams(p)}`);
export const agencyCreateTrip  = d          => post('/agency/trips', d);
export const agencyPatchTrip   = (id, d)    => patch(`/agency/trips/${id}`, d);
export const agencyDeleteTrip  = id         => del(`/agency/trips/${id}`);
export const agencyBookings    = (p = {})   => get(`/agency/bookings?${new URLSearchParams(p)}`);
