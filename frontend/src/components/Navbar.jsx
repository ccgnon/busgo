import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';

function BusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="3"/>
      <path d="M2 11h20"/>
      <circle cx="7" cy="19" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="17" cy="19" r="1.5" fill="currentColor" stroke="none"/>
      <path d="M7 6V4M17 6V4"/>
    </svg>
  );
}

function CMStar({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  );
}

export default function Navbar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, logout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  function handleLogout() {
    logout();
    navigate('/');
    setMenuOpen(false);
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.tricolor}>
        <div style={{ flex:1, background:'var(--c-green-400)' }}/>
        <div style={{ flex:1, background:'var(--c-red-500)' }}/>
        <div style={{ flex:1, background:'var(--c-gold-400)' }}/>
      </div>

      <div style={styles.inner}>
        {/* Logo */}
        <button onClick={() => navigate('/')} style={styles.logo}>
          <div style={styles.logoIcon}>
            <BusIcon />
          </div>
          <div>
            <div style={styles.logoText}>
              <span style={{ color:'var(--c-green-300)' }}>bus</span>
              <span style={{ color:'var(--c-gold-400)' }}>GO</span>
            </div>
            <div style={styles.logoSub}>Cameroun</div>
          </div>
        </button>

        {/* Nav Links */}
        <div style={styles.links}>
          <NavLink active={isActive('/')} onClick={() => navigate('/')}>
            Réserver
          </NavLink>
          {user && (
            <NavLink active={isActive('/bookings')} onClick={() => navigate('/bookings')}>
              Mes billets
            </NavLink>
          )}
          {user?.role === 'ADMIN' && (
            <NavLink active={isActive('/admin')} onClick={() => navigate('/admin')} accent="green">
              <CMStar size={10}/> Admin
            </NavLink>
          )}
          {user?.role === 'AGENCY' && (
            <NavLink active={isActive('/agency')} onClick={() => navigate('/agency')} accent="gold">
              Agence
            </NavLink>
          )}
        </div>

        {/* Auth */}
        <div style={styles.auth}>
          {user ? (
            <div style={styles.userMenu}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={styles.userBtn}
              >
                <div style={styles.avatar}>
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span style={{ fontSize:13, color:'var(--text-secondary)' }} className="hide-mobile">
                  {user.name?.split(' ')[0]}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--text-muted)">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </button>

              {menuOpen && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{user.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{user.email}</div>
                    <div style={{ marginTop:4 }}>
                      <span className={`badge badge-${user.role === 'ADMIN' ? 'red' : user.role === 'AGENCY' ? 'gold' : 'green'}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <div style={styles.dropdownDivider}/>
                  <DropItem onClick={() => { navigate('/bookings'); setMenuOpen(false); }}>
                    🎫 Mes billets
                  </DropItem>
                  {user.role === 'ADMIN' && (
                    <DropItem onClick={() => { navigate('/admin'); setMenuOpen(false); }}>
                      ⚙️ Dashboard Admin
                    </DropItem>
                  )}
                  {user.role === 'AGENCY' && (
                    <DropItem onClick={() => { navigate('/agency'); setMenuOpen(false); }}>
                      🏢 Portail Agence
                    </DropItem>
                  )}
                  <div style={styles.dropdownDivider}/>
                  <DropItem onClick={handleLogout} danger>
                    Déconnexion
                  </DropItem>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-ghost" style={{ padding:'8px 16px', fontSize:13 }}
                onClick={() => navigate('/login')}>
                Connexion
              </button>
              <button className="btn btn-primary" style={{ padding:'8px 16px', fontSize:13 }}
                onClick={() => navigate('/login?mode=register')}>
                Créer un compte
              </button>
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <div
          style={{ position:'fixed', inset:0, zIndex:99 }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  );
}

function NavLink({ children, active, onClick, accent }) {
  const colors = {
    green: 'var(--c-green-300)',
    gold:  'var(--c-gold-400)',
  };
  return (
    <button onClick={onClick} style={{
      background: 'none',
      border: 'none',
      padding: '6px 14px',
      borderRadius: 'var(--r-sm)',
      fontSize: 14,
      fontWeight: active ? 600 : 400,
      color: active
        ? (accent ? colors[accent] : 'var(--text-primary)')
        : 'var(--text-muted)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      transition: 'color .15s',
      position: 'relative',
    }}>
      {children}
      {active && (
        <span style={{
          position: 'absolute',
          bottom: -1,
          left: 14,
          right: 14,
          height: 2,
          background: accent ? colors[accent] : 'var(--c-green-400)',
          borderRadius: 'var(--r-full)',
        }}/>
      )}
    </button>
  );
}

function DropItem({ children, onClick, danger }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        background: hover ? 'var(--bg-elevated)' : 'none',
        border: 'none',
        padding: '9px 16px',
        fontSize: 13,
        color: danger ? 'var(--c-red-400)' : 'var(--text-secondary)',
        cursor: 'pointer',
        borderRadius: 'var(--r-sm)',
        transition: 'all .1s',
      }}>
      {children}
    </button>
  );
}

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(8,15,10,.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border)',
  },
  tricolor: {
    display: 'flex',
    height: 2,
  },
  inner: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 24px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 'var(--r-md)',
    background: 'var(--c-green-700)',
    border: '1px solid var(--border-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--c-green-200)',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1,
  },
  logoSub: {
    fontSize: 9,
    color: 'var(--text-muted)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  auth: {
    flexShrink: 0,
  },
  userMenu: {
    position: 'relative',
  },
  userBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-md)',
    borderRadius: 'var(--r-full)',
    padding: '5px 12px 5px 5px',
    cursor: 'pointer',
    transition: 'all .15s',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--c-green-600)',
    color: 'var(--c-green-100)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 220,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-md)',
    borderRadius: 'var(--r-lg)',
    boxShadow: '0 20px 50px rgba(0,0,0,.4), var(--glow-green)',
    overflow: 'hidden',
    zIndex: 101,
    animation: 'fadeUp .2s var(--ease) both',
  },
  dropdownHeader: {
    padding: '14px 16px',
    background: 'var(--bg-elevated)',
  },
  dropdownDivider: {
    height: 1,
    background: 'var(--border)',
    margin: '4px 0',
  },
};
