// components/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { NotifBell } from './NotificationSystem';

export default function Navbar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, logout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const isActive = p => location.pathname === p;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive:true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
    : '?';

  return (
    <>
      <div style={{ position:'fixed', top:0, left:0, right:0, height:3, display:'flex', zIndex:200 }}>
        <div style={{ flex:1, background:'var(--c-green-400)' }}/>
        <div style={{ flex:1, background:'var(--c-red-500)' }}/>
        <div style={{ flex:1, background:'var(--c-gold-400)' }}/>
      </div>

      <nav style={{
        position:'fixed', top:3, left:0, right:0, zIndex:100,
        background: scrolled ? 'rgba(6,16,10,.96)' : 'rgba(6,16,10,.82)',
        backdropFilter:'blur(20px)',
        borderBottom: scrolled ? '1px solid var(--border-md)' : '1px solid transparent',
        transition:'all .3s',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,.3)' : 'none',
      }}>
        <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:64 }}>

          {/* Logo */}
          <button onClick={() => navigate('/')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:'var(--r-sm)', background:'linear-gradient(135deg,var(--c-green-500),var(--c-green-700))', border:'1px solid var(--c-green-400)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--glow-green)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="7" width="20" height="11" rx="3"/>
                <path d="M2 12h20M7 7V5m10 2V5"/>
                <circle cx="7" cy="19" r="1.5" fill="currentColor" stroke="none"/>
                <circle cx="17" cy="19" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, lineHeight:1 }}>
                <span style={{ color:'var(--c-green-300)' }}>bus</span>
                <span style={{ color:'var(--c-gold-400)' }}>GO</span>
              </div>
              <div style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:'1.5px', textTransform:'uppercase', marginTop:1 }}>
                Cameroun
              </div>
            </div>
          </button>

          {/* Nav links */}
          <div style={{ display:'flex', alignItems:'center', gap:4 }} className="hide-mobile">
            {[
              { path:'/',        label:'🚌 Réserver' },
              ...(user ? [{ path:'/bookings', label:'🎫 Mes billets' }] : []),
              ...(user?.role==='ADMIN'  ? [{ path:'/admin',  label:'⚙️ Admin',  accent:'red' }] : []),
              ...(user?.role==='AGENCY' ? [{ path:'/agency', label:'🏢 Agence', accent:'gold' }] : []),
            ].map(({ path, label, accent }) => (
              <NavBtn key={path} active={isActive(path)} accent={accent} onClick={() => navigate(path)}>
                {label}
              </NavBtn>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {user?.role === 'ADMIN' && <NotifBell />}

            {user ? (
              <div ref={menuRef} style={{ position:'relative' }}>
                <button onClick={() => setMenuOpen(!menuOpen)} style={{
                  display:'flex', alignItems:'center', gap:9,
                  background:'var(--bg-elevated)', border:'1px solid var(--border-md)',
                  borderRadius:'var(--r-md)', padding:'6px 12px 6px 6px',
                  cursor:'pointer', transition:'all .15s',
                  boxShadow: menuOpen ? 'var(--glow-green)' : 'none',
                  borderColor: menuOpen ? 'var(--border-lg)' : 'var(--border-md)',
                }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,var(--c-green-600),var(--c-green-800))', border:'2px solid var(--c-green-500)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:12, fontWeight:800, color:'var(--c-green-100)' }}>
                    {initials}
                  </div>
                  <div style={{ textAlign:'left' }} className="hide-mobile">
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', lineHeight:1.2 }}>{user.name?.split(' ')[0]}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:1 }}>
                      {user.role==='ADMIN' ? '🔴 Admin' : user.role==='AGENCY' ? '🏢 Agence' : '👤 Voyageur'}
                    </div>
                  </div>
                  <span style={{ color:'var(--text-muted)', fontSize:10, transform:`rotate(${menuOpen?180:0}deg)`, transition:'transform .2s', display:'inline-block' }}>▼</span>
                </button>

                {menuOpen && (
                  <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'var(--bg-card)', border:'1px solid var(--border-md)', borderRadius:'var(--r-lg)', padding:8, minWidth:210, boxShadow:'var(--shadow-xl)', animation:'fadeDown .2s var(--ease-spring)', zIndex:200 }}>
                    <div style={{ padding:'10px 12px 12px', borderBottom:'1px solid var(--border)', marginBottom:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,var(--c-green-600),var(--c-green-800))', border:'2px solid var(--c-green-500)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:14, fontWeight:800, color:'var(--c-green-100)' }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>{user.name}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{user.email}</div>
                        </div>
                      </div>
                    </div>
                    {[
                      { label:'🎫 Mes billets', path:'/bookings' },
                      ...(user.role==='ADMIN'  ? [{ label:'⚙️ Administration', path:'/admin' }] : []),
                      ...(user.role==='AGENCY' ? [{ label:'🏢 Mon agence',     path:'/agency' }] : []),
                    ].map(item => (
                      <DropItem key={item.path} onClick={() => { navigate(item.path); setMenuOpen(false); }}>{item.label}</DropItem>
                    ))}
                    <div style={{ borderTop:'1px solid var(--border)', marginTop:6, paddingTop:6 }}>
                      <DropItem onClick={() => { logout(); navigate('/'); setMenuOpen(false); }} danger>🚪 Déconnexion</DropItem>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button className="btn btn-primary" style={{ padding:'9px 18px', fontSize:13 }} onClick={() => navigate('/login')}>
                Connexion
              </button>
            )}
          </div>
        </div>
      </nav>
      <div style={{ height:67 }}/>
    </>
  );
}

function NavBtn({ children, active, accent, onClick }) {
  const col = accent==='red' ? 'var(--c-red-400)' : accent==='gold' ? 'var(--c-gold-400)' : 'var(--c-green-300)';
  return (
    <button onClick={onClick} style={{
      padding:'7px 14px', borderRadius:'var(--r-sm)',
      background: active ? 'var(--bg-elevated)' : 'transparent',
      border: active ? '1px solid var(--border-md)' : '1px solid transparent',
      color: active ? (accent ? col : 'var(--text-primary)') : 'var(--text-muted)',
      fontSize:13, fontWeight: active ? 600 : 400,
      cursor:'pointer', transition:'all .15s',
    }}>{children}</button>
  );
}

function DropItem({ children, onClick, danger }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width:'100%', padding:'9px 12px', borderRadius:'var(--r-sm)', background: h ? (danger?'rgba(192,57,43,.1)':'var(--bg-elevated)') : 'transparent', border:'none', color: danger&&h ? 'var(--c-red-400)' : 'var(--text-primary)', fontSize:13, cursor:'pointer', textAlign:'left', transition:'all .12s', display:'block' }}>
      {children}
    </button>
  );
}
