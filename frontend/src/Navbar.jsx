import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { user, logout } = useStore();
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab]   = useState('login');
  const navigate = useNavigate();
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Bande drapeau */}
      <div className="flag-stripe" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, borderRadius: 0 }} />

      <nav style={{
        background: 'rgba(10,26,15,.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '62px',
        position: 'sticky',
        top: '3px',
        zIndex: 100,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          {/* Étoile camerounaise */}
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--green-mid), var(--green))',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 0 16px var(--green-glow)',
          }}>🚌</div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.5px',
            }}>
              <span style={{ color: 'var(--green-light)' }}>bus</span>
              <span style={{ color: 'var(--gold)' }}>GO</span>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', lineHeight: 1 }}>
              Cameroun
            </div>
          </div>
        </Link>

        {/* Indicateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)', animation: 'pulse 2s infinite' }} />
          Mobilité Cameroun
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user ? (
            <>
              <Link to="/bookings">
                <button style={btnGhost}>Mes billets</button>
              </Link>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '5px 12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)',
                fontSize: '13px', fontWeight: 500,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(135deg,var(--green-mid),var(--gold))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: '#fff',
                }}>{initials}</div>
                {user.name.split(' ')[0]}
              </div>
              <button style={btnGhost} onClick={() => { logout(); navigate('/'); }}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/bookings"><button style={btnGhost}>Mes billets</button></Link>
              <button style={btnGhost} onClick={() => { setAuthTab('login'); setShowAuth(true); }}>Connexion</button>
              <button style={btnPrimary} onClick={() => { setAuthTab('register'); setShowAuth(true); }}>Créer un compte</button>
            </>
          )}
        </div>
      </nav>

      {showAuth && <AuthModal defaultTab={authTab} onClose={() => setShowAuth(false)} />}
    </>
  );
}

const btnGhost = {
  padding: '7px 16px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)', background: 'transparent',
  color: 'var(--muted)', fontSize: '13px', fontWeight: 500,
};
const btnPrimary = {
  padding: '7px 16px', borderRadius: 'var(--radius-sm)',
  border: 'none', background: 'var(--green-mid)',
  color: '#fff', fontSize: '13px', fontWeight: 600,
};
