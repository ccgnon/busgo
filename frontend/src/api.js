import axios from 'axios';

// En production Render, VITE_API_URL = 'https://busgo-back.onrender.com'
// En dev local, on laisse vide → le proxy Vite prend le relais
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
});

// Injecter automatiquement le token JWT si présent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('busgo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
