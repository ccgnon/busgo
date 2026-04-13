// components/NotificationSystem.jsx
// Système de notifications global : toasts + cloche navbar + panel
import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react';

/* ── Contexte global ────────────────────────────────────────────────────── */
const NotifContext = createContext(null);

export function useNotif() {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotif doit être dans <NotifProvider>');
  return ctx;
}

/* ── Provider ────────────────────────────────────────────────────────────── */
export function NotifProvider({ children }) {
  const [toasts,    setToasts]    = useState([]);
  const [inbox,     setInbox]     = useState([]);    // cloche admin
  const [panelOpen, setPanelOpen] = useState(false);
  const counter = useRef(0);

  // Afficher un toast
  const toast = useCallback((msg, { type='success', title, duration=4500, action } = {}) => {
    const id = ++counter.current;
    setToasts(prev => [{ id, msg, type, title, action }, ...prev].slice(0, 5));
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
    return id;
  }, []);

  // Raccourcis
  const success = (msg, opts) => toast(msg, { type:'success', ...opts });
  const error   = (msg, opts) => toast(msg, { type:'error',   ...opts });
  const info    = (msg, opts) => toast(msg, { type:'info',    ...opts });
  const warning = (msg, opts) => toast(msg, { type:'warning', ...opts });

  // Ajouter une notif dans la cloche
  const addInbox = useCallback((notif) => {
    setInbox(prev => [{ id: Date.now(), read: false, createdAt: new Date().toISOString(), ...notif }, ...prev].slice(0, 50));
  }, []);

  const markAllRead = () => setInbox(prev => prev.map(n => ({ ...n, read: true })));
  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  const unread = inbox.filter(n => !n.read).length;

  return (
    <NotifContext.Provider value={{ toast, success, error, info, warning, addInbox, inbox, unread, panelOpen, setPanelOpen, markAllRead }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </NotifContext.Provider>
  );
}

/* ── Icônes toast ─────────────────────────────────────────────────────────── */
const TOAST_ICONS = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };

/* ── Container de toasts ──────────────────────────────────────────────────── */
function ToastContainer({ toasts, dismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
          <span className="toast-icon">{TOAST_ICONS[t.type]}</span>
          <div className="toast-body">
            {t.title && <div className="toast-title">{t.title}</div>}
            <div className="toast-msg">{t.msg}</div>
            {t.action && (
              <button
                onClick={e => { e.stopPropagation(); t.action.fn(); dismiss(t.id); }}
                style={{ marginTop:6, fontSize:11, fontWeight:700, background:'none', border:'1px solid currentColor', borderRadius:6, padding:'3px 10px', cursor:'pointer', color:'inherit', opacity:.8 }}>
                {t.action.label}
              </button>
            )}
          </div>
          <button className="toast-close" onClick={e => { e.stopPropagation(); dismiss(t.id); }}>×</button>
        </div>
      ))}
    </div>
  );
}

/* ── Cloche de notifications (dans la Navbar) ────────────────────────────── */
export function NotifBell() {
  const { inbox, unread, panelOpen, setPanelOpen, markAllRead } = useNotif();
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setPanelOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [setPanelOpen]);

  return (
    <div ref={ref} style={{ position:'relative' }} className="notif-bell">
      <button
        onClick={() => { setPanelOpen(!panelOpen); if (!panelOpen && unread > 0) markAllRead(); }}
        style={{
          width:38, height:38, borderRadius:'var(--r-sm)',
          background: panelOpen ? 'var(--bg-elevated)' : 'transparent',
          border:'1px solid var(--border)',
          color:'var(--text-muted)', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all .15s',
        }}>
        🔔
        {unread > 0 && (
          <span style={{
            position:'absolute', top:-4, right:-4,
            background:'var(--c-red-400)', color:'#fff',
            borderRadius:'var(--r-full)', fontSize:9, fontWeight:800,
            padding:'1px 5px', border:'2px solid var(--bg)',
            minWidth:16, textAlign:'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {panelOpen && (
        <div className="notif-panel">
          {/* Header panel */}
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:13, fontWeight:700 }}>Notifications</div>
            {inbox.length > 0 && (
              <button onClick={markAllRead}
                style={{ fontSize:11, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}>
                Tout lire
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ maxHeight:360, overflowY:'auto' }}>
            {inbox.length === 0 ? (
              <div style={{ padding:'28px 16px', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>
                <div style={{ fontSize:28, marginBottom:8, opacity:.4 }}>🔔</div>
                Aucune notification
              </div>
            ) : inbox.slice(0, 12).map(n => (
              <div key={n.id} style={{
                padding:'12px 16px', borderBottom:'1px solid var(--border)',
                background: n.read ? 'transparent' : 'rgba(35,144,79,.05)',
                display:'flex', gap:10, cursor:'pointer',
              }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{n.icon || '📌'}</span>
                <div style={{ flex:1 }}>
                  {n.title && <div style={{ fontSize:12, fontWeight:600, marginBottom:2 }}>{n.title}</div>}
                  <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.5 }}>{n.msg}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4, opacity:.6 }}>
                    {new Date(n.createdAt).toLocaleString('fr-FR', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' })}
                  </div>
                </div>
                {!n.read && (
                  <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--c-green-400)', flexShrink:0, marginTop:4 }}/>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
