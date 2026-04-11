import { create } from 'zustand';

const API = '/api';
const token = () => localStorage.getItem('busgo_token');

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...opts.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) return Promise.reject(data);
  return data;
}

export const useStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────
  user:        null,
  token:       localStorage.getItem('busgo_token') || null,
  authLoading: false,
  authError:   null,

  initAuth: async () => {
    const t = localStorage.getItem('busgo_token');
    if (!t) return;
    try {
      const me = await apiFetch('/auth/me');
      set({ user: { ...me, role: me.role || 'USER' }, token: t });
    } catch {
      localStorage.removeItem('busgo_token');
      set({ user: null, token: null });
    }
  },

  login: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const { token: t, user } = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('busgo_token', t);
      set({ token: t, user: { ...user, role: user.role || 'USER' }, authLoading: false });
      return true;
    } catch (err) {
      set({ authLoading: false, authError: err.error || 'Erreur de connexion' });
      return false;
    }
  },

  register: async (email, password, name) => {
    set({ authLoading: true, authError: null });
    try {
      const { token: t, user } = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      localStorage.setItem('busgo_token', t);
      set({ token: t, user: { ...user, role: user.role || 'USER' }, authLoading: false });
      return true;
    } catch (err) {
      set({ authLoading: false, authError: err.error || "Erreur d'inscription" });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('busgo_token');
    set({ user: null, token: null });
  },

  clearAuthError: () => set({ authError: null }),

  // ── Search / Booking flow ──────────────────────────────────────
  searchParams: {
    from: 'Yaoundé',
    to:   'Douala',
    date: new Date().toISOString().split('T')[0],
    pax:  1,
  },

  setSearchParams: params => set(s => ({ searchParams: { ...s.searchParams, ...params } })),

  selectedTrip:   null,
  selectedSeat:   null,
  selectedSeats:  [],
  currentBooking: null,

  selectTrip: trip => set({ selectedTrip: trip, selectedSeat: null, selectedSeats: [] }),
  selectSeat: seat => set({ selectedSeat: seat, selectedSeats: seat ? [seat] : [] }),
  toggleSeat: (seat, maxSeats) => set(s => {
    const seats = s.selectedSeats || [];
    if (seats.includes(seat)) return { selectedSeats: seats.filter(x => x !== seat) };
    if (seats.length >= maxSeats) return s;
    return { selectedSeats: [...seats, seat].sort((a,b) => a-b), selectedSeat: seat };
  }),
  setCurrentBooking: b  => set({ currentBooking: b }),
  resetBookingFlow:  () => set({ selectedTrip: null, selectedSeat: null, selectedSeats: [] }),
}));
