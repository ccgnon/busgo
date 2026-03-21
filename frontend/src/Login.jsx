// src/pages/Login.jsx — Connexion Admin / Agence
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

function CMStar({ size = 14, color = 'var(--gold)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login, authLoading, authError, clearAuthError } = useStore();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [mode,     setMode]     = useState('admin'); // 'admin' | 'agency'

  async function handleSubmit(e) {
    e.preventDefault();
    clearAuthError();
    const ok = await login(email, password);
    if (ok) {
      // Récupérer le user depuis le store pour connaître son rôle
      const { user } = useStore.getState();
      if (user?.role === 'ADMIN')        navigate('/admin');
      else if (user?.role === 'AGENCY')  navigate('/agency');
      else navigate('/');
    }
  }

  return (
    <div style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px', position: 'relative', zIndex: 1,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            {['var(--green)', 'var(--red)', 'var(--gold)'].map((c, i) => (
              <div key={i} style={{ width: 32, height: 3, background: c, borderRadius: 99 }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,var(--green-mid),var(--green))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              🚌
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, lineHeight: 1 }}>
                <span style={{ color: 'var(--green-light)' }}>bus</span>
                <span style={{ color: 'var(--gold)' }}>GO</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>Cameroun</div>
            </div>
          </div>
        </div>

        {/* Toggle Admin / Agence */}
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {[['admin','🔐 Administrateur'],['agency','🏢 Agence']].map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)} style={{
              flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: mode === k ? 'linear-gradient(135deg,var(--green-mid),var(--green-light))' : 'transparent',
              color: mode === k ? '#fff' : 'var(--muted)',
              fontWeight: mode === k ? 700 : 400,
              fontSize: 13, transition: '.2s',
              fontFamily: 'var(--font-body)',
            }}>{l}</button>
          ))}
        </div>

        {/* Carte de connexion */}
        <div style={{
          background: 'linear-gradient(135deg,var(--surface),var(--surface2))',
          border: '1px solid var(--border2)',
          borderRadius: 20, padding: 28,
          boxShadow: '0 0 40px var(--green-glow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <CMStar size={14} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800 }}>
              {mode === 'admin' ? 'Espace Administrateur' : 'Portail Agence'}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Adresse email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder={mode === 'admin' ? 'admin@busgo.cm' : 'contact@agence.cm'}
                required autoFocus
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Mot de passe</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={inputStyle}
              />
            </div>

            {authError && (
              <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)' }}>
                ❌ {authError}
              </div>
            )}

            <button type="submit" disabled={authLoading} style={{
              background: authLoading ? 'var(--border)' : 'linear-gradient(135deg,var(--green-mid),var(--green-light))',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '13px', fontSize: 14, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-display)',
              boxShadow: authLoading ? 'none' : '0 4px 20px var(--green-glow)',
              transition: '.2s',
            }}>
              {authLoading ? '⏳ Connexion...' : `Se connecter ${mode === 'admin' ? '— Admin' : '— Agence'}`}
            </button>
          </form>

          {/* Comptes de test */}
          <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 10 }}>
              Comptes de test
            </div>
            {mode === 'admin' ? (
              <div style={{ fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)' }}>Email</span>
                  <span style={{ fontFamily: 'monospace', cursor: 'pointer', color: 'var(--green-light)' }}
                    onClick={() => setEmail('admin@busgo.cm')}>admin@busgo.cm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Mot de passe</span>
                  <span style={{ fontFamily: 'monospace', cursor: 'pointer', color: 'var(--green-light)' }}
                    onClick={() => setPassword('admin1234')}>admin1234</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                  ⚠️ Créer ce compte d'abord via pgAdmin :<br />
                  <code style={{ fontSize: 10 }}>UPDATE "User" SET role='ADMIN' WHERE email='demo@busgo.cm';</code>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12 }}>
                <div style={{ color: 'var(--muted)', fontSize: 11, lineHeight: 1.6 }}>
                  Créer un compte agence via le dashboard Admin, puis changer le rôle de l'utilisateur en AGENCY dans pgAdmin.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Retour accueil */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={() => navigate('/')} style={{
            background: 'transparent', border: 'none', color: 'var(--muted)',
            fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
          }}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5, fontWeight: 500 };
const inputStyle  = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border2)',
  borderRadius: 9, padding: '10px 14px', color: 'var(--text)', fontSize: 14,
  outline: 'none', transition: '.15s', boxSizing: 'border-box',
};
