// src/store/index.js
import { create } from 'zustand';
import { login as apiLogin, register as apiRegister, getMe } from '../services/api';

export const useStore = create((set, get) => ({
  // ── Auth ────────────────────────────────────────
  user: null,
  token: localStorage.getItem('busgo_token') || null,
  authLoading: false,
  authError: null,

  initAuth: async () => {
    const token = localStorage.getItem('busgo_token');
    if (!token) return;
    try {
      const user = await getMe();
      set({ user, token });
    } catch {
      localStorage.removeItem('busgo_token');
      set({ user: null, token: null });
    }
  },

  login: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const { token, user } = await apiLogin(email, password);
      localStorage.setItem('busgo_token', token);
      set({ token, user, authLoading: false });
      return true;
    } catch (err) {
      set({ authLoading: false, authError: err.error || 'Erreur de connexion' });
      return false;
    }
  },

  register: async (email, password, name) => {
    set({ authLoading: true, authError: null });
    try {
      const { token, user } = await apiRegister(email, password, name);
      localStorage.setItem('busgo_token', token);
      set({ token, user, authLoading: false });
      return true;
    } catch (err) {
      set({ authLoading: false, authError: err.error || 'Erreur d\'inscription' });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('busgo_token');
    set({ user: null, token: null });
  },

  clearAuthError: () => set({ authError: null }),

  // ── Search / Booking flow ────────────────────────
  searchParams: { from: 'Yaoundé', to: 'Douala', date: new Date().toISOString().split('T')[0], pax: 1 },
  searchResults: null,
  searchLoading: false,
  searchError: null,

  setSearchParams: (params) =>
    set(s => ({ searchParams: { ...s.searchParams, ...params } })),

  setSearchResults: (data) => set({ searchResults: data }),
  setSearchLoading: (v) => set({ searchLoading: v }),
  setSearchError: (e) => set({ searchError: e }),

  selectedTrip: null,
  selectedSeat: null,
  currentBooking: null,

  selectTrip: (trip) => set({ selectedTrip: trip, selectedSeat: null }),
  selectSeat: (seat) => set({ selectedSeat: seat }),
  setCurrentBooking: (b) => set({ currentBooking: b }),
  resetBookingFlow: () => set({ selectedTrip: null, selectedSeat: null, currentBooking: null }),
}));
