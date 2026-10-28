import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ transparent = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem('busgo_token');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const logout = () => {
    localStorage.removeItem('busgo_token');
    navigate('/');
  };

  const bg = transparent && !scrolled
    ? 'rgba(14,26,18,.0)'
    : 'rgba(14,26,18,.95)';

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 64,
      background: bg,
      backdropFilter: scrolled || !transparent ? 'blur(20px)' : 'none',
      borderBottom: scrolled || !transparent ? '1px solid rgba(255,255,255,.08)' : 'none',
      transition: 'all .3s ease',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(16px, 4vw, 40px)',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg,#007a5e,#00a87d)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(0,120,90,.4)'
        }}>🚌</div>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: '1.25rem', fontWeight: 700, color: '#fff', letterSpacing: '-.01em' }}>
          bus<span style={{ color: '#fcd116' }}>GO</span>
        </span>
        <span style={{
          background: '#fcd116', color: '#1a3a2a', fontSize: '.6rem',
          fontWeight: 800, letterSpacing: '.08em', padding: '2px 7px',
          borderRadius: 5, textTransform: 'uppercase'
        }}>CMR</span>
      </Link>

      {/* Desktop links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, '@media(max-width:640px)': { display: 'none' } }}>
        {[
          { to: '/', label: 'Accueil' },
          { to: '/search', label: 'Voyages' },
        ].map(({ to, label }) => (
          <Link key={to} to={to} style={{
            padding: '6px 14px', borderRadius: 8,
            color: isActive(to) ? '#fcd116' : 'rgba(255,255,255,.8)',
            textDecoration: 'none', fontSize: '.85rem', fontWeight: 600,
            background: isActive(to) ? 'rgba(252,209,22,.12)' : 'transparent',
            transition: 'all .2s',
          }}>{label}</Link>
        ))}

        {token ? (
          <>
            <Link to="/mes-voyages" style={{
              padding: '6px 14px', borderRadius: 8,
              color: isActive('/mes-voyages') ? '#fcd116' : 'rgba(255,255,255,.8)',
              textDecoration: 'none', fontSize: '.85rem', fontWeight: 600,
              background: isActive('/mes-voyages') ? 'rgba(252,209,22,.12)' : 'transparent',
            }}>Mes voyages</Link>
            <button onClick={logout} style={{
              padding: '8px 18px', borderRadius: 10,
              background: 'rgba(255,255,255,.1)', color: '#fff',
              border: '1px solid rgba(255,255,255,.2)',
              fontSize: '.85rem', fontWeight: 600, cursor: 'pointer',
            }}>Déconnexion</button>
          </>
        ) : (
          <>
            <Link to="/connexion" style={{
              padding: '8px 18px', borderRadius: 10,
              background: 'rgba(255,255,255,.1)', color: '#fff',
              border: '1px solid rgba(255,255,255,.2)',
              textDecoration: 'none', fontSize: '.85rem', fontWeight: 600,
            }}>Connexion</Link>
            <Link to="/inscription" style={{
              padding: '8px 18px', borderRadius: 10,
              background: 'linear-gradient(135deg,#fcd116,#f59e0b)',
              color: '#1a3a2a', textDecoration: 'none',
              fontSize: '.85rem', fontWeight: 800,
              boxShadow: '0 2px 8px rgba(252,209,22,.35)',
            }}>S'inscrire</Link>
          </>
        )}
      </div>
    </nav>
  );
}
