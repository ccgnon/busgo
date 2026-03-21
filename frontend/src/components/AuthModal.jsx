// src/components/AuthModal.jsx
import { useState } from 'react';
import { useStore } from '../store';

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 200, animation: 'fadeIn .2s ease',
};
const modal = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xl)', padding: '28px', width: '400px',
  maxWidth: '95vw', position: 'relative',
};
const tabs = { display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '4px' };
const tabStyle = (active) => ({
  flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--radius-sm)',
  background: active ? 'var(--surface)' : 'transparent',
  color: active ? 'var(--text)' : 'var(--muted)', fontWeight: 500, fontSize: '14px',
  border: active ? '1px solid var(--border)' : '1px solid transparent',
  transition: '.15s',
});
const field = { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' };
const label = { fontSize: '12px', color: 'var(--muted)', fontWeight: 500 };
const input = {
  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  padding: '10px 12px', color: 'var(--text)', fontSize: '14px', outline: 'none', width: '100%',
};
const submitBtn = {
  width: '100%', background: 'var(--accent)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '15px', fontWeight: 700,
  marginTop: '8px', transition: '.15s',
};
const errorBox = {
  background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
  borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '13px',
  color: '#f87171', marginBottom: '12px',
};

export default function AuthModal({ defaultTab = 'login', onClose }) {
  const [tab, setTab] = useState(defaultTab);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const { login, register, authLoading, authError, clearAuthError } = useStore();

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); clearAuthError(); };

  const submit = async (e) => {
    e.preventDefault();
    const ok = tab === 'login'
      ? await login(form.email, form.password)
      : await register(form.email, form.password, form.name);
    if (ok) onClose();
  };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', color: 'var(--muted)', fontSize: '20px' }}>×</button>

        <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>
          {tab === 'login' ? 'Connexion' : 'Créer un compte'}
        </div>

        <div style={tabs}>
          <button style={tabStyle(tab === 'login')} onClick={() => setTab('login')}>Connexion</button>
          <button style={tabStyle(tab === 'register')} onClick={() => setTab('register')}>Inscription</button>
        </div>

        {authError && <div style={errorBox}>{authError}</div>}

        <form onSubmit={submit}>
          {tab === 'register' && (
            <div style={field}>
              <label style={label}>Nom complet</label>
              <input style={input} type="text" placeholder="Jean Dupont" value={form.name} onChange={set('name')} required />
            </div>
          )}
          <div style={field}>
            <label style={label}>Email</label>
            <input style={input} type="email" placeholder="jean@email.com" value={form.email} onChange={set('email')} required />
          </div>
          <div style={field}>
            <label style={label}>Mot de passe</label>
            <input style={input} type="password" placeholder={tab === 'register' ? 'Min. 8 caractères' : '••••••••'} value={form.password} onChange={set('password')} required />
          </div>

          {tab === 'login' && (
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
              Compte démo : <strong style={{ color: 'var(--text)' }}>demo@busgo.fr</strong> / <strong style={{ color: 'var(--text)' }}>demo1234</strong>
            </div>
          )}

          <button style={submitBtn} type="submit" disabled={authLoading}>
            {authLoading ? 'Chargement…' : tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
