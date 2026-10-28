import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', form);
      localStorage.setItem('busgo_token', res.data.token);
      if (res.data.user?.role === 'ADMIN') navigate('/admin');
      else navigate('/mes-voyages');
    } catch (e) {
      setErr(e.response?.data?.error || 'Email ou mot de passe incorrect.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0e1c10 0%,#1a3a2a 40%,#0e1c10 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 16px 32px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <Navbar />

      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#007a5e,#00a87d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 4px 16px rgba(0,122,94,.4)' }}>🚌</div>
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '2rem', fontWeight: 700, color: '#fff' }}>bus<span style={{ color: '#fcd116' }}>GO</span></span>
            </div>
          </Link>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.88rem', marginTop: 10 }}>Bon retour parmi nous 👋</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', boxShadow: '0 24px 80px rgba(0,0,0,.35)' }}>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: '#1a3a2a', marginBottom: 24, fontWeight: 700 }}>Connexion</h2>

          {err && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: '.86rem', display: 'flex', gap: 8, alignItems: 'center' }}>
              ⚠️ {err}
            </div>
          )}

          <form onSubmit={submit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 800, color: '#8a7d6e', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 7 }}>Email</label>
              <input type="email" required placeholder="vous@exemple.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '2px solid #e8e0d0', fontSize: '.92rem', background: '#fafaf8', outline: 'none', boxSizing: 'border-box', transition: 'border .2s', color: '#1a3a2a' }}
                onFocus={e => e.target.style.borderColor = '#007a5e'}
                onBlur={e => e.target.style.borderColor = '#e8e0d0'} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 800, color: '#8a7d6e', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 7 }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} required placeholder="••••••••" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ width: '100%', padding: '13px 44px 13px 14px', borderRadius: 12, border: '2px solid #e8e0d0', fontSize: '.92rem', background: '#fafaf8', outline: 'none', boxSizing: 'border-box', transition: 'border .2s', color: '#1a3a2a' }}
                  onFocus={e => e.target.style.borderColor = '#007a5e'}
                  onBlur={e => e.target.style.borderColor = '#e8e0d0'} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a7d6e', fontSize: '.85rem', padding: 4 }}>
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? '#9ca3af' : 'linear-gradient(135deg,#007a5e,#00a87d)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', boxShadow: loading ? 'none' : '0 4px 16px rgba(0,122,94,.35)', transition: 'all .2s', letterSpacing: '.02em' }}>
              {loading ? '⏳ Connexion…' : 'Se connecter →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0ece4' }}>
            <p style={{ color: '#8a7d6e', fontSize: '.85rem' }}>
              Pas encore de compte ?{' '}
              <Link to="/inscription" style={{ color: '#007a5e', fontWeight: 700, textDecoration: 'none' }}>S'inscrire gratuitement →</Link>
            </p>
          </div>

          {/* Demo accounts */}
          <div style={{ marginTop: 20, padding: '14px 16px', background: '#f8f4ee', borderRadius: 12, border: '1px dashed #d4c9b5' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#8a7d6e', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Comptes de démonstration</div>
            {[
              { role: 'Admin', email: 'admin@busgo.cm', pwd: 'busgo2026', color: '#ce1126' },
              { role: 'Utilisateur', email: 'test@busgo.cm', pwd: 'busgo2026', color: '#007a5e' },
            ].map(a => (
              <div key={a.role} onClick={() => setForm({ email: a.email, password: a.pwd })}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0ece4'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div>
                  <span style={{ fontSize: '.7rem', fontWeight: 800, color: a.color, padding: '2px 7px', borderRadius: 5, background: a.color+'18', marginRight: 8 }}>{a.role}</span>
                  <span style={{ fontSize: '.8rem', color: '#6b5d4f', fontFamily: 'monospace' }}>{a.email}</span>
                </div>
                <span style={{ fontSize: '.72rem', color: '#8a7d6e' }}>Cliquer pour remplir</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`* { box-sizing: border-box }`}</style>
    </div>
  );
}
