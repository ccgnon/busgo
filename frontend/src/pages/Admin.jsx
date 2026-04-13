import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useNotif } from '../components/NotificationSystem';
import {
  adminStats, adminBookings, adminUsers, adminPatchUser, adminDeleteUser, adminCreateUser,
  adminAgencies, adminCreateAgency, adminPatchAgency, adminDeleteAgency,
  adminTrips, adminPatchTrip, adminDeleteTrip,
  cancelBooking,
} from '../services/api';

const FCFA = n => Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
const dt   = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';

/* ── Icons SVG ───────────────────────────────────────────────────────────── */
function Icon({ d, size=16, stroke='currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}
const I = {
  chart:   'M3 3v18h18M7 16l4-4 4 4 4-4',
  ticket:  'M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4Z',
  bus:     'M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a4 4 0 0 1 4 4v6M13 17h6M17 21v-4m-8 4v-4M5 9h12M5 13h12',
  users:   'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  building:'M3 21h18M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2M3 21V7m18 14V7M8 21v-5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v5M3 7h18',
  cash:    'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  x:       'M18 6 6 18M6 6l12 12',
  plus:    'M12 5v14M5 12h14',
  edit:    'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z',
  trash:   'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2',
  shield:  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  search:  'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  eye:     'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0',
  lock:    'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  warn:    'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  check:   'M20 6 9 17l-5-5',
  filter:  'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  down:    'M7 10l5 5 5-5',
  mail:    'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  phone:   'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.09 3.18 2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16z',
};

/* ── Composants utilitaires ─────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    CONFIRMED:{ cls:'badge-green', label:'Confirmé' },
    VALIDATED:{ cls:'badge-green', label:'Validé' },
    CANCELLED:{ cls:'badge-red',   label:'Annulé' },
    EXPIRED:  { cls:'badge-muted', label:'Expiré' },
  };
  const { cls, label } = map[status] || { cls:'badge-muted', label: status };
  return <span className={`badge ${cls}`}>{label}</span>;
}

function StatCard({ label, value, sub, color, icon, onClick }) {
  return (
    <div className="stat-card fade-up" onClick={onClick}
      style={{ borderTop:`2px solid ${color}`, cursor:onClick?'pointer':'default', transition:'transform .15s' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.transform='translateY(-2px)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.transform='none')}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div className="stat-label">{label}</div>
        <div style={{ color, opacity:.7 }}><Icon d={icon} size={18}/></div>
      </div>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

/* ── Modal générique ─────────────────────────────────────────────────────── */
function Modal({ title, onClose, children, width=480 }) {
  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal fade-up" style={{ maxWidth:width }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800 }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4 }}>
            <Icon d={I.x} size={20}/>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Modal de confirmation suppression ────────────────────────────────────── */
function ConfirmDelete({ title, message, onConfirm, onCancel, loading }) {
  return (
    <Modal title="⚠️ Confirmer la suppression" onClose={onCancel}>
      <div style={{ textAlign:'center', padding:'8px 0 20px' }}>
        <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(192,57,43,.15)', border:'1px solid rgba(192,57,43,.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:24 }}>
          🗑️
        </div>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, marginBottom:8 }}>{title}</h3>
        <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>{message}</p>
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ flex:1, justifyContent:'center' }}>Annuler</button>
        <button className="btn" onClick={onConfirm} disabled={loading}
          style={{ flex:1, justifyContent:'center', background:'var(--c-red-500)', color:'#fff', border:'none', opacity:loading?.5:1 }}>
          {loading ? 'Suppression…' : 'Supprimer définitivement'}
        </button>
      </div>
    </Modal>
  );
}

/* ── Champ de formulaire ─────────────────────────────────────────────────── */
function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:11, color:'var(--text-muted)', marginBottom:5, fontWeight:500, textTransform:'uppercase', letterSpacing:.6 }}>
        {label} {required && <span style={{ color:'var(--c-red-400)' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── Barre de recherche ──────────────────────────────────────────────────── */
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position:'relative', flex:1 }}>
      <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}>
        <Icon d={I.search} size={14}/>
      </span>
      <input className="input" placeholder={placeholder || 'Rechercher…'}
        value={value} onChange={e => onChange(e.target.value)}
        style={{ paddingLeft:36, fontSize:13 }}/>
    </div>
  );
}

/* ── Bouton action tableau ────────────────────────────────────────────────── */
function ActionBtn({ icon, label, onClick, color='var(--text-muted)', danger }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      title={label}
      style={{
        width:30, height:30, borderRadius:'var(--r-sm)', border:'1px solid var(--border-md)',
        background: h ? (danger ? 'rgba(192,57,43,.15)' : 'var(--bg-elevated)') : 'transparent',
        color: h && danger ? 'var(--c-red-400)' : color,
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        transition:'all .12s', flexShrink:0,
      }}>
      <Icon d={icon} size={13}/>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE ADMIN
════════════════════════════════════════════════════════════════════════════ */
export default function Admin() {
  const { user } = useStore();
  const navigate = useNavigate();
  const { success, error: notifError, info, warning, addInbox } = useNotif();

  const [tab,       setTab]      = useState('dashboard');
  const [data,      setData]     = useState(null);
  const [bookings,  setBookings] = useState([]);
  const [users,     setUsers]    = useState([]);
  const [agencies,  setAgencies] = useState([]);
  const [trips,     setTrips]    = useState([]);
  const [loading,   setLoading]  = useState(false);
  const [modal,     setModal]    = useState(null);   // 'newAgency'|'editAgency'|'newUser'|'editUser'|'editTrip'|'deleteConfirm'
  const [selected,  setSelected] = useState(null);   // objet sélectionné pour édition
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, label }
  const [deleting,  setDeleting] = useState(false);
  const [search,    setSearch]   = useState('');
  const [roleFilter,setRoleFilter] = useState('ALL');
  const [statusFilter,setStatusFilter] = useState('ALL');

  /* ── Chargement données ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'dashboard') setData(await adminStats());
      if (tab === 'bookings')  setBookings((await adminBookings()).bookings || []);
      if (tab === 'users')     setUsers(await adminUsers());
      if (tab === 'agencies')  setAgencies(await adminAgencies());
      if (tab === 'trips')     setTrips((await adminTrips()).trips || []);
    } catch(e) { notifError('Erreur de chargement des données'); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  if (!user) { navigate('/login'); return null; }
  if (user.role !== 'ADMIN') return (
    <div style={{ maxWidth:480, margin:'120px auto', textAlign:'center', padding:'0 24px' }}>
      <div style={{ fontSize:48, marginBottom:16, opacity:.3 }}>🔐</div>
      <h2 style={{ fontFamily:'var(--font-display)', marginBottom:8 }}>Accès réservé</h2>
      <p style={{ color:'var(--text-muted)', marginBottom:24 }}>Votre compte n'a pas les droits administrateur.</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Retour à l'accueil</button>
    </div>
  );

  /* ── Suppression générique ── */
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { type, id } = deleteTarget;
      if (type === 'user')    { await adminDeleteUser(id); }
      if (type === 'agency')  { await adminDeleteAgency(id); }
      if (type === 'trip')    { await adminDeleteTrip(id); }
      if (type === 'booking') { await cancelBooking(id); }
      success(`${deleteTarget.label} supprimé avec succès`);
      setModal(null);
      setDeleteTarget(null);
      load();
    } catch (e) {
      notifError(e.error || 'Erreur lors de la suppression');
    } finally { setDeleting(false); }
  }

  function askDelete(type, id, label) {
    setDeleteTarget({ type, id, label });
    setModal('deleteConfirm');
  }

  /* ── Filtres ── */
  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole   = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const filteredBookings = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.id?.toLowerCase().includes(q) || b.passengerName?.toLowerCase().includes(q) || b.validationCode?.includes(q);
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredAgencies = agencies.filter(a => {
    const q = search.toLowerCase();
    return !q || a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q);
  });

  const filteredTrips = trips.filter(t => {
    const q = search.toLowerCase();
    return !q || t.from?.toLowerCase().includes(q) || t.to?.toLowerCase().includes(q) || t.company?.toLowerCase().includes(q);
  });

  const TABS = [
    { id:'dashboard', label:'Vue globale',    icon:I.chart   },
    { id:'bookings',  label:'Réservations',   icon:I.ticket  },
    { id:'trips',     label:'Trajets',         icon:I.bus     },
    { id:'agencies',  label:'Agences',         icon:I.building},
    { id:'users',     label:'Utilisateurs',    icon:I.users   },
  ];

  return (
    <div style={{ maxWidth:1300, margin:'0 auto', padding:'28px 24px 80px' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, gap:16, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:900, marginBottom:4 }}>
            Dashboard Admin
          </h1>
          <p style={{ color:'var(--text-muted)', fontSize:12 }}>
            busGO Cameroun — Panneau d'administration
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost" onClick={load} style={{ padding:'8px 14px', fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
            <Icon d={I.refresh} size={13}/> Actualiser
          </button>
          {/* Actions rapides selon l'onglet */}
          {tab === 'agencies' && (
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-ghost" onClick={() => setModal('inviteAgency')} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
                ✉️ Inviter une agence
              </button>
              <button className="btn btn-primary" onClick={() => setModal('newAgency')} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Icon d={I.plus} size={14}/> Nouvelle agence
              </button>
            </div>
          )}
          {tab === 'users' && (
            <button className="btn btn-primary" onClick={() => { setSelected(null); setModal('newUser'); }} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Icon d={I.plus} size={14}/> Nouvel utilisateur
            </button>
          )}
        </div>
      </div>

      {/* ── Navigation tabs ── */}
      <div style={{ display:'flex', gap:4, background:'var(--bg-raised)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:4, marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => { setTab(t.id); setSearch(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}
            style={{
              flex:1, minWidth:100, padding:'9px 14px', borderRadius:'var(--r-sm)',
              border: tab===t.id ? '1px solid var(--border-md)' : 'none',
              background: tab===t.id ? 'var(--bg-elevated)' : 'transparent',
              color: tab===t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize:12, fontWeight: tab===t.id ? 600 : 400,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              transition:'all .15s',
            }}>
            <Icon d={t.icon} size={13}/> {t.label}
          </button>
        ))}
      </div>

      {/* ── Loader ── */}
      {loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:90, borderRadius:'var(--r-lg)' }}/>)}
        </div>
      )}

      {/* ════════════════════════════════════════
          VUE GLOBALE (Dashboard)
      ════════════════════════════════════════ */}
      {tab === 'dashboard' && data && !loading && (
        <div className="fade-in">
          {/* Stats cliquables */}
          <div className="grid-4" style={{ marginBottom:20 }}>
            <StatCard label="Réservations confirmées" value={data.bookings?.confirmed} sub={`${data.bookings?.total} total · ${data.bookings?.cancelled} annulées`} color="var(--c-green-300)" icon={I.ticket} onClick={() => setTab('bookings')}/>
            <StatCard label="Recettes totales"         value={FCFA(data.revenue?.total)} sub={`Moy. ${FCFA(data.revenue?.average)} / billet`} color="var(--c-gold-400)" icon={I.cash}/>
            <StatCard label="Trajets actifs"           value={data.trips?.active}  sub={`${data.trips?.total} total`} color="var(--c-green-400)" icon={I.bus} onClick={() => setTab('trips')}/>
            <StatCard label="Utilisateurs"             value={data.users}          sub={`${data.agencies} agences`}  color="var(--text-secondary)" icon={I.users} onClick={() => setTab('users')}/>
          </div>

          <div className="grid-2" style={{ gap:16 }}>
            {/* Réservations récentes */}
            <div className="card fade-up delay-1" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span className="card-title">Réservations récentes</span>
                <button className="btn btn-ghost" onClick={() => setTab('bookings')} style={{ fontSize:11, padding:'4px 10px' }}>Voir tout</button>
              </div>
              {(data.recentBookings || []).slice(0, 8).map(b => (
                <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 18px', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--c-green-200)', marginBottom:2 }}>{b.id}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{b.trip?.from} → {b.trip?.to} · {b.passengerName || '—'}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <StatusBadge status={b.status}/>
                    <div style={{ fontSize:12, color:'var(--c-gold-400)', marginTop:3 }}>{FCFA(b.totalPrice)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Top compagnies */}
              <div className="card fade-up delay-2" style={{ padding:0, overflow:'hidden' }}>
                <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span className="card-title">Top compagnies</span>
                </div>
                {(data.topCompanies || []).map((c, i) => (
                  <div key={c.company} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 18px', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:26, height:26, borderRadius:'var(--r-sm)', background:'var(--bg-elevated)', border:'1px solid var(--border-md)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--c-green-300)', flexShrink:0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex:1, fontSize:13 }}>{c.company}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{c.trips} trajets</div>
                  </div>
                ))}
              </div>

              {/* Résumé rapide */}
              <div className="card fade-up delay-3" style={{ padding:'16px 18px' }}>
                <div className="card-title" style={{ marginBottom:14 }}>Résumé rapide</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    ['Taux d\'annulation', data.bookings?.total ? `${Math.round((data.bookings.cancelled / data.bookings.total) * 100)}%` : '0%', 'var(--c-red-400)'],
                    ['Taux de validation', data.bookings?.total ? `${Math.round((data.bookings.confirmed / data.bookings.total) * 100)}%` : '0%', 'var(--c-green-300)'],
                    ['Agences actives',    `${data.agencies} agences`, 'var(--c-gold-400)'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                      <span style={{ color:'var(--text-muted)' }}>{label}</span>
                      <span style={{ fontWeight:600, color }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          RÉSERVATIONS
      ════════════════════════════════════════ */}
      {tab === 'bookings' && !loading && (
        <div className="fade-in">
          {/* Barre d'outils */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par ID, passager, code…"/>
            <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ width:'auto', fontSize:12, padding:'10px 12px' }}>
              <option value="ALL">Tous les statuts</option>
              <option value="CONFIRMED">Confirmé</option>
              <option value="VALIDATED">Validé</option>
              <option value="CANCELLED">Annulé</option>
              <option value="EXPIRED">Expiré</option>
            </select>
            <div style={{ fontSize:12, color:'var(--text-muted)', flexShrink:0 }}>
              {filteredBookings.length} résultat{filteredBookings.length>1?'s':''}
            </div>
          </div>

          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>{['Référence','Trajet','Passager','Téléphone','Date voyage','Siège','Total','Mode paiement','Statut','Code','Actions'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr><td colSpan={11} style={{ textAlign:'center', padding:32, color:'var(--text-muted)' }}>Aucune réservation trouvée</td></tr>
                  ) : filteredBookings.map(b => (
                    <tr key={b.id}>
                      <td><span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--c-green-200)' }}>{b.id}</span></td>
                      <td style={{ fontSize:12, whiteSpace:'nowrap' }}>{b.trip?.from} → {b.trip?.to}</td>
                      <td style={{ fontSize:12 }}>{b.passengerName || '—'}</td>
                      <td style={{ fontSize:11, color:'var(--text-muted)' }}>{b.passengerPhone || '—'}</td>
                      <td style={{ fontSize:12, whiteSpace:'nowrap' }}>{b.travelDate}</td>
                      <td style={{ textAlign:'center', fontSize:12 }}>{b.seatNum}</td>
                      <td style={{ color:'var(--c-gold-400)', fontWeight:600, fontSize:12, whiteSpace:'nowrap' }}>{FCFA(b.totalPrice)}</td>
                      <td style={{ fontSize:11 }}>
                        <span className="badge badge-muted">{b.paymentMethod}</span>
                      </td>
                      <td><StatusBadge status={b.status}/></td>
                      <td><span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--c-green-300)' }}>{b.validationCode}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          {b.status === 'CONFIRMED' && (
                            <ActionBtn icon={I.x} label="Annuler" danger
                              onClick={() => askDelete('booking', b.id, `Réservation ${b.id}`)}/>
                          )}
                          <ActionBtn icon={I.trash} label="Supprimer" danger
                            onClick={() => askDelete('booking', b.id, `Réservation ${b.id}`)}/>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TRAJETS
      ════════════════════════════════════════ */}
      {tab === 'trips' && !loading && (
        <div className="fade-in">
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par ville, compagnie…"/>
            <div style={{ fontSize:12, color:'var(--text-muted)', flexShrink:0 }}>
              {filteredTrips.length} trajet{filteredTrips.length>1?'s':''}
            </div>
          </div>

          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>{['Trajet','Compagnie','Agence','Départ','Arrivée','Prix','Sièges','Réservations','Statut','Actions'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredTrips.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign:'center', padding:32, color:'var(--text-muted)' }}>Aucun trajet trouvé</td></tr>
                  ) : filteredTrips.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight:500, fontSize:13, whiteSpace:'nowrap' }}>{t.from} → {t.to}</td>
                      <td style={{ fontSize:12 }}>{t.company}</td>
                      <td style={{ fontSize:12, color:'var(--text-muted)' }}>{t.agency || '—'}</td>
                      <td style={{ fontSize:12 }}>{t.depTime}</td>
                      <td style={{ fontSize:12 }}>{t.arrTime}</td>
                      <td style={{ color:'var(--c-gold-400)', fontSize:12 }}>{FCFA(t.price)}</td>
                      <td style={{ textAlign:'center', fontSize:12 }}>{t.totalSeats}</td>
                      <td style={{ textAlign:'center', fontSize:12 }}><span style={{ fontWeight:600, color: t.bookings > 0 ? 'var(--c-green-300)' : 'var(--text-muted)' }}>{t.bookings}</span></td>
                      <td>
                        <span className={`badge ${t.active ? 'badge-green' : 'badge-red'}`}>
                          {t.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          <ActionBtn icon={t.active ? I.x : I.check} label={t.active ? 'Désactiver' : 'Activer'}
                            color={t.active ? 'var(--c-red-400)' : 'var(--c-green-300)'}
                            onClick={async () => { await adminPatchTrip(t.id, { active:!t.active }); load(); success(`Trajet ${t.active?'désactivé':'activé'}`); }}/>
                          <ActionBtn icon={I.edit} label="Modifier"
                            onClick={() => { setSelected(t); setModal('editTrip'); }}/>
                          <ActionBtn icon={I.trash} label="Supprimer" danger
                            onClick={() => askDelete('trip', t.id, `${t.from} → ${t.to} (${t.company})`)}/>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          AGENCES
      ════════════════════════════════════════ */}
      {tab === 'agencies' && !loading && (
        <div className="fade-in">
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une agence…"/>
            <div style={{ fontSize:12, color:'var(--text-muted)', flexShrink:0 }}>
              {filteredAgencies.length} agence{filteredAgencies.length>1?'s':''}
            </div>
          </div>

          {filteredAgencies.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-muted)' }}>
              <div style={{ fontSize:40, marginBottom:12, opacity:.3 }}>🏢</div>
              <p>Aucune agence trouvée</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
              {filteredAgencies.map(a => (
                <div key={a.id} className="card" style={{ padding:0, overflow:'hidden' }}>
                  {/* Bande couleur */}
                  <div style={{ height:3, background: a.active ? 'var(--c-green-400)' : 'var(--c-red-500)' }}/>
                  <div style={{ padding:'18px 20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                      <div>
                        <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, marginBottom:3 }}>{a.name}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', display:'flex', flexDirection:'column', gap:2 }}>
                          <span>✉️ {a.email}</span>
                          {a.phone && <span>📞 {a.phone}</span>}
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end', flexShrink:0 }}>
                        {a.verified && <span className="badge badge-green">✓ Vérifié</span>}
                        <span className={`badge ${a.active ? 'badge-green' : 'badge-red'}`}>
                          {a.active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>

                    {/* Stats agence */}
                    <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                      {[['🚌', 'Trajets', a.trips], ['👥', 'Agents', a.users]].map(([icon, k, v]) => (
                        <div key={k} style={{ flex:1, background:'var(--bg-elevated)', borderRadius:'var(--r-md)', padding:'10px 12px', textAlign:'center' }}>
                          <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.5, marginBottom:2 }}>{icon} {k}</div>
                          <div style={{ fontSize:20, fontWeight:700, fontFamily:'var(--font-display)' }}>{v}</div>
                        </div>
                      ))}
                      <div style={{ flex:1, background:'var(--bg-elevated)', borderRadius:'var(--r-md)', padding:'10px 12px', textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.5, marginBottom:2 }}>📅 Créée</div>
                        <div style={{ fontSize:11, fontWeight:600 }}>{dt(a.createdAt)}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:6 }}>
                      <button className="btn btn-ghost" style={{ fontSize:11, padding:'7px 0', justifyContent:'center' }}
                        onClick={async () => { await adminPatchAgency(a.id, { active:!a.active }); load(); success(`Agence ${a.active?'désactivée':'activée'}`); }}>
                        {a.active ? '🔴 Désactiver' : '🟢 Activer'}
                      </button>
                      <button className="btn btn-ghost" style={{ fontSize:11, padding:'7px 0', justifyContent:'center' }}
                        onClick={async () => { await adminPatchAgency(a.id, { verified:!a.verified }); load(); showToast(a.verified?'Vérification retirée':'Agence vérifiée'); }}>
                        {a.verified ? '❌ Retirer vérif.' : '✅ Vérifier'}
                      </button>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      <button className="btn btn-ghost" style={{ fontSize:11, padding:'7px 0', justifyContent:'center' }}
                        onClick={() => { setSelected(a); setModal('editAgency'); }}>
                        ✏️ Modifier
                      </button>
                      <button className="btn btn-danger" style={{ fontSize:11, padding:'7px 0', justifyContent:'center' }}
                        onClick={() => askDelete('agency', a.id, a.name)}>
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          UTILISATEURS
      ════════════════════════════════════════ */}
      {tab === 'users' && !loading && (
        <div className="fade-in">
          {/* Filtres */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par nom, email…"/>
            <div style={{ display:'flex', gap:6 }}>
              {['ALL','USER','AGENCY','ADMIN'].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  style={{
                    padding:'8px 14px', borderRadius:'var(--r-full)', fontSize:12, fontWeight:600,
                    border: roleFilter===r ? '1px solid var(--c-green-400)' : '1px solid var(--border-md)',
                    background: roleFilter===r ? 'var(--c-green-700)' : 'var(--bg-elevated)',
                    color: roleFilter===r ? 'var(--c-green-100)' : 'var(--text-muted)',
                    cursor:'pointer', transition:'all .12s',
                  }}>
                  {r === 'ALL' ? '👥 Tous' : r === 'ADMIN' ? '🔴 Admin' : r === 'AGENCY' ? '🟡 Agence' : '🟢 User'}
                </button>
              ))}
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', flexShrink:0 }}>
              {filteredUsers.length} utilisateur{filteredUsers.length>1?'s':''}
            </div>
          </div>

          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>{['Nom','Email','Rôle','Agence','Réservations','Points fidélité','Inscrit le','Actions'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign:'center', padding:32, color:'var(--text-muted)' }}>Aucun utilisateur trouvé</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--c-green-700)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--c-green-200)', flexShrink:0 }}>
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span style={{ fontWeight:500, fontSize:13 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize:12, color:'var(--text-muted)' }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role==='ADMIN'?'badge-red':u.role==='AGENCY'?'badge-gold':'badge-muted'}`}>
                          {u.role==='ADMIN'?'🔴':u.role==='AGENCY'?'🏢':'👤'} {u.role}
                        </span>
                      </td>
                      <td style={{ fontSize:12 }}>{u.agency || '—'}</td>
                      <td style={{ textAlign:'center', fontSize:12, fontWeight:600, color: u.bookings > 0 ? 'var(--c-green-300)' : 'var(--text-muted)' }}>{u.bookings}</td>
                      <td style={{ textAlign:'center', fontSize:12, color:'var(--c-gold-400)' }}>{u.loyaltyPoints || 0} pts</td>
                      <td style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{dt(u.createdAt)}</td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          {/* Changer le rôle */}
                          <select
                            value={u.role}
                            onChange={async e => {
                              await adminPatchUser(u.id, { role: e.target.value });
                              success(`Rôle changé → ${e.target.value}`);
                              load();
                            }}
                            style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-md)', borderRadius:'var(--r-sm)', padding:'5px 8px', color:'var(--text-primary)', fontSize:11, cursor:'pointer' }}>
                            <option value="USER">USER</option>
                            <option value="AGENCY">AGENCY</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          {/* Éditer */}
                          <ActionBtn icon={I.edit} label="Modifier"
                            onClick={() => { setSelected(u); setModal('editUser'); }}/>
                          {/* Supprimer */}
                          <ActionBtn icon={I.trash} label="Supprimer" danger
                            onClick={() => askDelete('user', u.id, `${u.name} (${u.email})`)}/>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MODALES
      ════════════════════════════════════════ */}

      {/* Confirmation de suppression */}
      {modal === 'deleteConfirm' && deleteTarget && (
        <ConfirmDelete
          title={`Supprimer ${deleteTarget.label} ?`}
          message={`Cette action est irréversible. ${
            deleteTarget.type === 'user'    ? 'Toutes les réservations associées seront conservées mais l\'utilisateur ne pourra plus se connecter.' :
            deleteTarget.type === 'agency'  ? 'L\'agence et tous ses accès seront supprimés. Les trajets seront conservés.' :
            deleteTarget.type === 'trip'    ? 'Le trajet sera supprimé. Les réservations existantes seront annulées.' :
            deleteTarget.type === 'booking' ? 'La réservation sera annulée et le siège sera libéré.' : ''
          }`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => { setModal(null); setDeleteTarget(null); }}
        />
      )}

      {/* Invitation agence par email */}
      {modal === 'inviteAgency' && (
        <Modal title="✉️ Inviter une agence" onClose={() => setModal(null)}>
          <InviteAgencyForm
            onSend={async (data) => {
              // Simuler envoi email d'invitation
              await new Promise(r => setTimeout(r, 1200));
              setModal(null);
              success(`Invitation envoyée à ${data.email}`, {
                title: 'Email envoyé',
              });
              addInbox({
                icon: '✉️',
                title: 'Invitation envoyée',
                msg: `${data.agencyName} (${data.email}) — en attente de confirmation`,
              });
            }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Nouvelle agence */}
      {modal === 'newAgency' && (
        <Modal title="Nouvelle agence" onClose={() => setModal(null)}>
          <AgencyForm
            onSave={async d => { await adminCreateAgency(d); setModal(null); load(); success('Agence créée avec succès'); }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Modifier agence */}
      {modal === 'editAgency' && selected && (
        <Modal title={`Modifier : ${selected.name}`} onClose={() => setModal(null)}>
          <AgencyForm
            initial={selected}
            onSave={async d => { await adminPatchAgency(selected.id, d); setModal(null); load(); success('Agence mise à jour'); }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Nouvel utilisateur */}
      {modal === 'newUser' && (
        <Modal title="Nouvel utilisateur" onClose={() => setModal(null)}>
          <UserForm
            onSave={async d => {
              await adminCreateUser(d);
              setModal(null); load(); success('Utilisateur créé avec succès');
            }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Modifier utilisateur */}
      {modal === 'editUser' && selected && (
        <Modal title={`Modifier : ${selected.name}`} onClose={() => setModal(null)}>
          <UserEditForm
            user={selected}
            agencies={agencies}
            onSave={async d => { await adminPatchUser(selected.id, d); setModal(null); load(); success('Utilisateur mis à jour'); }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Modifier trajet */}
      {modal === 'editTrip' && selected && (
        <Modal title={`Modifier trajet : ${selected.from} → ${selected.to}`} onClose={() => setModal(null)}>
          <TripEditForm
            trip={selected}
            onSave={async d => { await adminPatchTrip(selected.id, d); setModal(null); load(); success('Trajet mis à jour'); }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

/* ── Formulaire Agence ───────────────────────────────────────────────────── */
function AgencyForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '', email: initial?.email || '',
    phone: initial?.phone || '', description: initial?.description || '',
  });
  const s = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <Field label="Nom de l'agence" required>
        <input className="input" value={form.name} onChange={s('name')} placeholder="Bibilong Voyages"/>
      </Field>
      <Field label="Email" required>
        <input className="input" type="email" value={form.email} onChange={s('email')} placeholder="contact@agence.cm"/>
      </Field>
      <Field label="Téléphone">
        <input className="input" value={form.phone} onChange={s('phone')} placeholder="+237 6XX XXX XXX"/>
      </Field>
      <Field label="Description">
        <textarea className="input" value={form.description} onChange={s('description')} rows={3}
          placeholder="Présentation de l'agence…" style={{ resize:'vertical' }}/>
      </Field>
      <div style={{ display:'flex', gap:8, marginTop:20 }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ flex:1, justifyContent:'center' }}>Annuler</button>
        <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} disabled={loading || !form.name || !form.email}
          onClick={async () => { setLoading(true); try { await onSave(form); } finally { setLoading(false); } }}>
          {loading ? 'Enregistrement…' : initial ? 'Mettre à jour' : "Créer l'agence"}
        </button>
      </div>
    </div>
  );
}

/* ── Formulaire Nouvel utilisateur ───────────────────────────────────────── */
function UserForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'USER', phone:'' });
  const s = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <Field label="Nom complet" required>
        <input className="input" value={form.name} onChange={s('name')} placeholder="Jean Kamga"/>
      </Field>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Email" required>
          <input className="input" type="email" value={form.email} onChange={s('email')} placeholder="jean@email.cm"/>
        </Field>
        <Field label="Téléphone">
          <input className="input" type="tel" value={form.phone} onChange={s('phone')} placeholder="+237 6XX XXX XXX"/>
        </Field>
      </div>
      <Field label="Mot de passe" required>
        <input className="input" type="password" value={form.password} onChange={s('password')} placeholder="Minimum 8 caractères"/>
      </Field>
      <Field label="Rôle">
        <select className="input" value={form.role} onChange={s('role')}>
          <option value="USER">👤 Utilisateur</option>
          <option value="AGENCY">🏢 Agence</option>
          <option value="ADMIN">🔴 Administrateur</option>
        </select>
      </Field>

      {form.role === 'ADMIN' && (
        <div style={{ padding:'12px 14px', background:'rgba(192,57,43,.1)', border:'1px solid rgba(192,57,43,.2)', borderRadius:'var(--r-md)', fontSize:12, color:'var(--c-red-400)', marginBottom:14, display:'flex', gap:8 }}>
          <Icon d={I.warn} size={14}/> Vous créez un compte administrateur avec accès complet.
        </div>
      )}

      <div style={{ display:'flex', gap:8, marginTop:16 }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ flex:1, justifyContent:'center' }}>Annuler</button>
        <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }}
          disabled={loading || !form.name || !form.email || form.password.length < 8}
          onClick={async () => { setLoading(true); try { await onSave(form); } finally { setLoading(false); } }}>
          {loading ? 'Création…' : 'Créer le compte'}
        </button>
      </div>
    </div>
  );
}

/* ── Formulaire Modifier utilisateur ─────────────────────────────────────── */
function UserEditForm({ user, agencies, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:     user.name || '',
    phone:    user.phone || '',
    role:     user.role || 'USER',
    agencyId: user.agencyId || '',
  });
  const s = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'var(--bg-elevated)', borderRadius:'var(--r-md)', marginBottom:18 }}>
        <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--c-green-700)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'var(--c-green-200)', flexShrink:0 }}>
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600 }}>{user.name}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{user.email}</div>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <span className={`badge ${user.role==='ADMIN'?'badge-red':user.role==='AGENCY'?'badge-gold':'badge-muted'}`}>
            {user.role}
          </span>
        </div>
      </div>

      <Field label="Nom complet" required>
        <input className="input" value={form.name} onChange={s('name')}/>
      </Field>
      <Field label="Téléphone">
        <input className="input" type="tel" value={form.phone} onChange={s('phone')} placeholder="+237 6XX XXX XXX"/>
      </Field>
      <Field label="Rôle">
        <select className="input" value={form.role} onChange={s('role')}>
          <option value="USER">👤 Utilisateur</option>
          <option value="AGENCY">🏢 Agence</option>
          <option value="ADMIN">🔴 Administrateur</option>
        </select>
      </Field>
      {form.role === 'AGENCY' && agencies.length > 0 && (
        <Field label="Agence associée">
          <select className="input" value={form.agencyId} onChange={s('agencyId')}>
            <option value="">— Aucune agence —</option>
            {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
      )}

      {form.role === 'ADMIN' && user.role !== 'ADMIN' && (
        <div style={{ padding:'10px 12px', background:'rgba(192,57,43,.1)', border:'1px solid rgba(192,57,43,.2)', borderRadius:'var(--r-md)', fontSize:12, color:'var(--c-red-400)', marginBottom:14 }}>
          ⚠️ Vous accordez les droits administrateur à cet utilisateur.
        </div>
      )}

      <div style={{ display:'flex', gap:8, marginTop:16 }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ flex:1, justifyContent:'center' }}>Annuler</button>
        <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} disabled={loading}
          onClick={async () => { setLoading(true); try { await onSave(form); } finally { setLoading(false); } }}>
          {loading ? 'Enregistrement…' : 'Mettre à jour'}
        </button>
      </div>
    </div>
  );
}

/* ── Formulaire Modifier trajet ───────────────────────────────────────────── */
function TripEditForm({ trip, onSave, onCancel }) {
  const [form, setForm] = useState({
    price:   trip.price || '',
    depTime: trip.depTime || '',
    arrTime: trip.arrTime || '',
    active:  trip.active ?? true,
  });
  const s = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <div style={{ padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:'var(--r-md)', marginBottom:16, fontSize:13, fontWeight:600 }}>
        🚌 {trip.from} → {trip.to} · {trip.company}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Heure de départ">
          <input className="input" type="time" value={form.depTime} onChange={s('depTime')}/>
        </Field>
        <Field label="Heure d'arrivée">
          <input className="input" type="time" value={form.arrTime} onChange={s('arrTime')}/>
        </Field>
      </div>
      <Field label="Prix (FCFA)" required>
        <input className="input" type="number" value={form.price} onChange={s('price')} placeholder="Ex: 3500"/>
      </Field>
      <Field label="Statut">
        <div style={{ display:'flex', gap:8 }}>
          {[['true','🟢 Actif'],['false','🔴 Inactif']].map(([v,l]) => (
            <button key={v} type="button" onClick={() => setForm(f => ({ ...f, active: v==='true' }))}
              style={{
                flex:1, padding:'10px', borderRadius:'var(--r-md)', fontSize:13, fontWeight:600,
                border: String(form.active)===v ? `2px solid ${v==='true'?'var(--c-green-400)':'var(--c-red-400)'}` : '1px solid var(--border-md)',
                background: String(form.active)===v ? (v==='true'?'rgba(35,144,79,.15)':'rgba(192,57,43,.1)') : 'var(--bg-elevated)',
                color: String(form.active)===v ? (v==='true'?'var(--c-green-300)':'var(--c-red-400)') : 'var(--text-muted)',
                cursor:'pointer', transition:'all .12s',
              }}>{l}</button>
          ))}
        </div>
      </Field>
      <div style={{ display:'flex', gap:8, marginTop:16 }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ flex:1, justifyContent:'center' }}>Annuler</button>
        <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} disabled={loading}
          onClick={async () => { setLoading(true); try { await onSave({ price:parseFloat(form.price), depTime:form.depTime, arrTime:form.arrTime, active:form.active }); } finally { setLoading(false); } }}>
          {loading ? 'Enregistrement…' : 'Mettre à jour'}
        </button>
      </div>
    </div>
  );
}

/* ── Formulaire Invitation agence ─────────────────────────────────────────── */
function InviteAgencyForm({ onSend, onCancel }) {
  const [form, setForm] = useState({ agencyName:'', email:'', contactName:'', phone:'', message:'' });
  const [loading, setLoading] = useState(false);
  const s = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const DEFAULT_MSG = `Bonjour,\n\nNous vous invitons à rejoindre la plateforme busGO Cameroun en tant que partenaire agence.\n\nEn rejoignant busGO, vous bénéficiez de :\n• Gestion de vos trajets en ligne\n• Vente de billets digitaux 24h/24\n• Tableau de bord avec statistiques en temps réel\n• Paiements via MTN MoMo et Orange Money\n\nCliquez sur le lien ci-dessous pour créer votre compte agence :\n[LIEN D'INVITATION]\n\nCordialement,\nL'équipe busGO Cameroun`;

  useEffect(() => {
    if (!form.message) setForm(f => ({ ...f, message: DEFAULT_MSG }));
  }, []);

  return (
    <div>
      <div style={{ padding:'12px 14px', background:'rgba(35,144,79,.08)', border:'1px solid rgba(35,144,79,.2)', borderRadius:'var(--r-md)', marginBottom:18, fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>
        📧 Un email d'invitation sera envoyé au gestionnaire de l'agence avec un lien pour créer son compte et accéder au portail partenaire.
      </div>

      <Field label="Nom de l'agence" required>
        <input className="input" value={form.agencyName} onChange={s('agencyName')} placeholder="Ex: Bibilong Voyages"/>
      </Field>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Email du gestionnaire" required>
          <input className="input" type="email" value={form.email} onChange={s('email')} placeholder="gestionnaire@agence.cm"/>
        </Field>
        <Field label="Nom du contact" required>
          <input className="input" value={form.contactName} onChange={s('contactName')} placeholder="Jean Kamga"/>
        </Field>
      </div>

      <Field label="Téléphone">
        <input className="input" type="tel" value={form.phone} onChange={s('phone')} placeholder="+237 6XX XXX XXX"/>
      </Field>

      <Field label="Message personnalisé">
        <textarea className="input" rows={8} value={form.message} onChange={s('message')} style={{ resize:'vertical', fontSize:12, lineHeight:1.7 }}/>
      </Field>

      <div style={{ display:'flex', gap:8, marginTop:18 }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ flex:1, justifyContent:'center' }}>Annuler</button>
        <button className="btn btn-primary" style={{ flex:2, justifyContent:'center' }}
          disabled={loading || !form.agencyName || !form.email || !form.contactName}
          onClick={async () => {
            setLoading(true);
            try { await onSend(form); }
            finally { setLoading(false); }
          }}>
          {loading ? '⏳ Envoi en cours…' : '✉️ Envoyer l\'invitation'}
        </button>
      </div>
    </div>
  );
}
