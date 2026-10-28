import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', referralCode: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [step, setStep] = useState(1); // 1: info, 2: contact

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', form);
      localStorage.setItem('busgo_token', res.data.token);
      navigate('/mes-voyages');
    } catch (e) {
      setErr(e.response?.data?.error || 'Une erreur est survenue. Réessayez.');
    } finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', padding: '13px 14px', borderRadius: 12, border: '2px solid #e8e0d0', fontSize: '.92rem', background: '#fafaf8', outline: 'none', boxSizing: 'border-box', transition: 'border .2s', color: '#1a3a2a' };
  const labelStyle = { display: 'block', fontSize: '.72rem', fontWeight: 800, color: '#8a7d6e', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 7 };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0e1c10 0%,#1a3a2a 40%,#0e1c10 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 16px 32px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <Navbar />

      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#007a5e,#00a87d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 4px 16px rgba(0,122,94,.4)' }}>🚌</div>
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '2rem', fontWeight: 700, color: '#fff' }}>bus<span style={{ color: '#fcd116' }}>GO</span></span>
            </div>
          </Link>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.88rem', marginTop: 10 }}>Créez votre compte en quelques secondes 🎉</p>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 4, background: s <= step ? '#fcd116' : 'rgba(255,255,255,.15)', transition: 'background .3s' }} />
          ))}
        </div>
        <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '.78rem', textAlign: 'center', marginBottom: 20 }}>
          Étape {step} sur 2 — {step === 1 ? 'Informations personnelles' : 'Coordonnées'}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', boxShadow: '0 24px 80px rgba(0,0,0,.35)' }}>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: '#1a3a2a', marginBottom: 24, fontWeight: 700 }}>
            {step === 1 ? 'Votre identité' : 'Vos coordonnées'}
          </h2>

          {err && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: '.86rem' }}>
              ⚠️ {err}
            </div>
          )}

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : submit}>
            {step === 1 && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Nom complet</label>
                  <input type="text" required placeholder="Jean-Baptiste Mvondo" value={form.name}
                    onChange={e => set('name', e.target.value)} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#007a5e'}
                    onBlur={e => e.target.style.borderColor = '#e8e0d0'} />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Adresse email</label>
                  <input type="email" required placeholder="vous@exemple.com" value={form.email}
                    onChange={e => set('email', e.target.value)} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#007a5e'}
                    onBlur={e => e.target.style.borderColor = '#e8e0d0'} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPwd ? 'text' : 'password'} required placeholder="8 caractères minimum" value={form.password}
                      onChange={e => set('password', e.target.value)} minLength={6}
                      style={{ ...inputStyle, paddingRight: 44 }}
                      onFocus={e => e.target.style.borderColor = '#007a5e'}
                      onBlur={e => e.target.style.borderColor = '#e8e0d0'} />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a7d6e', fontSize: '.85rem', padding: 4 }}>
                      {showPwd ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {form.password && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex:1, height:3, borderRadius:2, background: form.password.length >= i*2 ? (form.password.length >= 8 ? '#007a5e' : '#fcd116') : '#e8e0d0' }} />
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit"
                  style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#007a5e,#00a87d)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 16px rgba(0,122,94,.35)', letterSpacing: '.02em' }}>
                  Continuer →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Numéro de téléphone</label>
                  <input type="tel" required placeholder="+237 6XX XXX XXX" value={form.phone}
                    onChange={e => set('phone', e.target.value)} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#007a5e'}
                    onBlur={e => e.target.style.borderColor = '#e8e0d0'} />
                  <div style={{ fontSize: '.75rem', color: '#8a7d6e', marginTop: 5 }}>Utilisé pour la confirmation SMS de vos billets</div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Code de parrainage <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optionnel)</span></label>
                  <input type="text" placeholder="BUSGO-XXXXX" value={form.referralCode}
                    onChange={e => set('referralCode', e.target.value)} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#007a5e'}
                    onBlur={e => e.target.style.borderColor = '#e8e0d0'} />
                </div>

                {/* Benefits reminder */}
                <div style={{ background: '#f0f9f5', border: '1px solid #a7f3d0', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#065f46', marginBottom: 8 }}>✅ En créant votre compte vous bénéficiez de :</div>
                  {['Réservation en ligne instantanée', 'Confirmation SMS gratuite', 'Suivi de vos voyages', 'Annulation flexible'].map(b => (
                    <div key={b} style={{ fontSize: '.8rem', color: '#047857', display: 'flex', gap: 7, alignItems: 'center', lineHeight: 1.9 }}>
                      <span style={{ color: '#007a5e' }}>→</span> {b}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStep(1)}
                    style={{ flex:1, padding:'14px', background:'#f0ece4', color:'#6b5d4f', border:'none', borderRadius:14, fontWeight:700, cursor:'pointer', fontSize:'.92rem' }}>
                    ← Retour
                  </button>
                  <button type="submit" disabled={loading}
                    style={{ flex:2, padding:'14px', background: loading ? '#9ca3af' : 'linear-gradient(135deg,#007a5e,#00a87d)', color:'#fff', border:'none', borderRadius:14, fontWeight:800, cursor: loading ? 'not-allowed' : 'pointer', fontSize:'1rem', boxShadow: loading ? 'none' : '0 4px 16px rgba(0,122,94,.35)' }}>
                    {loading ? '⏳ Création…' : '🎉 Créer mon compte'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0ece4' }}>
            <p style={{ color: '#8a7d6e', fontSize: '.85rem' }}>
              Déjà un compte ?{' '}
              <Link to="/connexion" style={{ color: '#007a5e', fontWeight: 700, textDecoration: 'none' }}>Se connecter</Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`* { box-sizing: border-box }`}</style>
    </div>
  );
}
