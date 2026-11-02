import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';

const CITY = { YDE:'Yaoundé', DLA:'Douala', BFT:'Bafoussam', NGD:'Ngaoundéré', LIM:'Limbé', BUE:'Buéa', EDO:'Ébolowa', BSG:'Bertoua', GAR:'Garoua', MRU:'Maroua', BAM:'Bamenda', KMB:'Kumba' };

// ─── Utilitaires UI ───────────────────────────────────────────────────────────
const fmt     = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—';
const fmtTime = d => d ? new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) : '—';
const cityOf  = s => s ? (CITY[s.id] || s.city || s.name || s.id) : '—';

const STATUS_CFG = {
  CONFIRMED: { bg:'#dcfce7', col:'#166534', label:'Confirmé'  },
  PENDING:   { bg:'#fef9c3', col:'#854d0e', label:'En attente'},
  CANCELLED: { bg:'#fee2e2', col:'#991b1b', label:'Annulé'    },
  COMPLETED: { bg:'#f3f4f6', col:'#374151', label:'Terminé'   },
  VALIDATED: { bg:'#dbeafe', col:'#1e40af', label:'Validé'    },
};

const Badge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return <span style={{ background:c.bg, color:c.col, fontSize:'.7rem', fontWeight:800, padding:'3px 10px', borderRadius:50 }}>{c.label}</span>;
};

const RoleBadge = ({ role }) => {
  const cfg = { ADMIN:['#fee2e2','#991b1b'], AGENCY:['#fef9c3','#854d0e'], USER:['#dcfce7','#166534'] };
  const [bg, col] = cfg[role] || cfg.USER;
  return <span style={{ background:bg, color:col, fontSize:'.7rem', fontWeight:800, padding:'3px 10px', borderRadius:50 }}>{role}</span>;
};

const thStyle = { padding:'10px 14px', fontSize:'.68rem', fontWeight:800, color:'#8a7d6e', textTransform:'uppercase', letterSpacing:'.08em', textAlign:'left', borderBottom:'2px solid #e8e0d0', whiteSpace:'nowrap' };
const tdStyle = { padding:'12px 14px', fontSize:'.85rem', color:'#1a3a2a', borderBottom:'1px solid #f0ece4', verticalAlign:'middle' };

const Btn = ({ onClick, children, color='#007a5e', small, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ padding: small ? '5px 12px' : '9px 18px', background: disabled ? '#e5e7eb' : color, color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: small ? '.75rem' : '.85rem', whiteSpace:'nowrap' }}>
    {children}
  </button>
);

const inputStyle = { width:'100%', padding:'10px 13px', borderRadius:10, border:'1.5px solid #e8e0d0', fontSize:'.88rem', background:'#fafaf8', outline:'none', boxSizing:'border-box', color:'#1a3a2a' };
const labelStyle = { display:'block', fontSize:'.7rem', fontWeight:800, color:'#8a7d6e', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:5 };

// ─── Modal générique ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #e8e0d0', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'#fff', borderRadius:'20px 20px 0 0' }}>
          <h3 style={{ fontFamily:'Georgia,serif', fontWeight:700, color:'#1a3a2a', fontSize:'1.15rem', margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'#f0ece4', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontWeight:700, fontSize:'.9rem', color:'#6b5d4f' }}>✕</button>
        </div>
        <div style={{ padding:'24px' }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KPI = ({ icon, label, value, sub, accent }) => (
  <div style={{ background:'#fff', borderRadius:18, border:'1.5px solid #e8e0d0', padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,0,0,.04)' }}>
    <div style={{ fontSize:'1.6rem', marginBottom:10 }}>{icon}</div>
    <div style={{ fontSize:'clamp(1.4rem,3vw,2rem)', fontWeight:800, color:accent||'#1a3a2a', letterSpacing:'-.02em' }}>{value ?? '—'}</div>
    <div style={{ fontWeight:700, color:'#1a3a2a', fontSize:'.85rem', marginBottom:2 }}>{label}</div>
    {sub && <div style={{ fontSize:'.75rem', color:'#8a7d6e' }}>{sub}</div>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser]         = useState(null);
  const [tab, setTab]           = useState('dashboard');
  const [stats, setStats]       = useState(null);
  const [trips, setTrips]       = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers]       = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState('');

  // Modaux
  const [modalAgency,  setModalAgency]  = useState(null);  // null | 'create' | {agency}
  const [modalUser,    setModalUser]    = useState(null);
  const [modalBooking, setModalBooking] = useState(null);  // null | {booking}

  // Filtres réservations
  const [bookingFilter, setBookingFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');

  const token   = localStorage.getItem('busgo_token');
  const isAdmin = user?.role === 'ADMIN';
  const isAgency = user?.role === 'AGENCY';

  const showToast = (msg, error = false) => {
    setToast(error ? '❌ ' + msg : '✅ ' + msg);
    setTimeout(() => setToast(''), 4000);
  };

  // ─── Chargement initial ───────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!token) { navigate('/connexion'); return; }
    setLoading(true);

    // Récupérer le profil d'abord pour connaître le rôle
    const profileRes = await api.get('/api/users/profile').catch(() => null);
    const profile = profileRes?.data;
    if (!profile) { navigate('/connexion'); return; }
    setUser(profile);

    if (profile.role === 'ADMIN') {
      const [s, t, b, u, ag] = await Promise.all([
        api.get('/api/admin/stats'   ).catch(() => ({ data: {} })),
        api.get('/api/admin/trips'   ).catch(() => ({ data: { trips: [] } })),
        api.get('/api/admin/bookings').catch(() => ({ data: { bookings: [] } })),
        api.get('/api/admin/users'   ).catch(() => ({ data: { users: [] } })),
        api.get('/api/admin/agencies').catch(() => ({ data: { agencies: [] } })),
      ]);
      setStats(s.data.stats || s.data || {});
      setTrips(t.data.trips    || []);
      setBookings(b.data.bookings || []);
      setUsers(u.data.users    || []);
      setAgencies(ag.data.agencies || []);
    } else if (profile.role === 'AGENCY' && profile.agencyId) {
      const [b, t] = await Promise.all([
        api.get(`/api/bookings/agency/${profile.agencyId}`).catch(() => ({ data: { bookings: [] } })),
        api.get('/api/admin/trips', { params: { agencyId: profile.agencyId } }).catch(() => ({ data: { trips: [] } })),
      ]);
      setBookings(b.data.bookings || []);
      setTrips(t.data.trips || []);
      setTab('bookings');
    } else {
      navigate('/');
    }
    setLoading(false);
  }, [token, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─── TABS ─────────────────────────────────────────────────────────────────
  const TABS_ADMIN  = [
    { id:'dashboard', label:'Tableau de bord', icon:'📊' },
    { id:'agencies',  label:'Agences',          icon:'🏢' },
    { id:'bookings',  label:'Réservations',     icon:'🎫' },
    { id:'users',     label:'Utilisateurs',     icon:'👥' },
    { id:'trips',     label:'Voyages',          icon:'🚌' },
  ];
  const TABS_AGENCY = [
    { id:'bookings', label:'Réservations', icon:'🎫' },
    { id:'trips',    label:'Voyages',      icon:'🚌' },
  ];
  const TABS = isAdmin ? TABS_ADMIN : TABS_AGENCY;

  // ─── Actions agences ──────────────────────────────────────────────────────
  const saveAgency = async (form, id) => {
    try {
      if (id) { await api.patch(`/api/admin/agencies/${id}`, form); }
      else     { await api.post('/api/admin/agencies', form); }
      showToast(id ? 'Agence mise à jour' : 'Agence créée');
      setModalAgency(null);
      loadAll();
    } catch (e) { showToast(e.response?.data?.error || 'Erreur', true); }
  };

  const deleteAgency = async (ag) => {
    if (!window.confirm(`Supprimer l'agence "${ag.name}" ?`)) return;
    try {
      await api.delete(`/api/admin/agencies/${ag.id}`);
      showToast('Agence supprimée');
      loadAll();
    } catch (e) { showToast(e.response?.data?.error || 'Erreur suppression', true); }
  };

  // ─── Actions utilisateurs ─────────────────────────────────────────────────
  const saveUser = async (form, id) => {
    try {
      if (id) { await api.patch(`/api/admin/users/${id}`, form); }
      else     { await api.post('/api/admin/users', form); }
      showToast(id ? 'Utilisateur mis à jour' : 'Utilisateur créé');
      setModalUser(null);
      loadAll();
    } catch (e) { showToast(e.response?.data?.error || 'Erreur', true); }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Supprimer l'utilisateur "${u.name}" (${u.email}) ?`)) return;
    try {
      await api.delete(`/api/admin/users/${u.id}`);
      showToast('Utilisateur supprimé');
      loadAll();
    } catch (e) { showToast(e.response?.data?.error || 'Erreur suppression', true); }
  };

  // ─── Actions réservations ─────────────────────────────────────────────────
  const cancelBooking = async (bk, reason) => {
    try {
      if (isAdmin) {
        await api.patch(`/api/admin/bookings/${bk.id}`, { status: 'CANCELLED', reason });
      } else {
        await api.put(`/api/bookings/${bk.id}`, { status: 'CANCELLED', reason });
      }
      showToast('Réservation annulée et client notifié par e-mail');
      setModalBooking(null);
      loadAll();
    } catch (e) { showToast(e.response?.data?.error || 'Erreur annulation', true); }
  };

  const updateBooking = async (bk, data) => {
    try {
      if (isAdmin) {
        await api.patch(`/api/admin/bookings/${bk.id}`, data);
      } else {
        await api.put(`/api/bookings/${bk.id}`, data);
      }
      showToast('Réservation mise à jour');
      setModalBooking(null);
      loadAll();
    } catch (e) { showToast(e.response?.data?.error || 'Erreur mise à jour', true); }
  };

  const deleteBooking = async (bk) => {
    if (!window.confirm(`Supprimer définitivement la réservation ${bk.id} ?`)) return;
    try {
      if (isAdmin) {
        await api.delete(`/api/admin/bookings/${bk.id}`);
      } else {
        await api.delete(`/api/bookings/${bk.id}`);
      }
      showToast('Réservation supprimée');
      setModalBooking(null);
      loadAll();
    } catch (e) { showToast(e.response?.data?.error || 'Erreur suppression', true); }
  };

  const resendEmail = async (bkId) => {
    try {
      const r = await api.post(`/api/bookings/${bkId}/resend-email`);
      showToast(r.data.message || 'E-mail envoyé');
    } catch (e) { showToast(e.response?.data?.error || 'Erreur envoi e-mail', true); }
  };

  // ─── Filtres réservations ─────────────────────────────────────────────────
  const filteredBookings = bookings.filter(b => {
    const matchStatus = bookingFilter === 'all' || b.status === bookingFilter;
    const q = bookingSearch.toLowerCase();
    const matchSearch = !q || b.id?.toLowerCase().includes(q)
      || b.passengerName?.toLowerCase().includes(q)
      || b.user?.name?.toLowerCase().includes(q)
      || b.user?.email?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:'100vh', background:'#f0ece4', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <Navbar />

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background: toast.startsWith('❌') ? '#fef2f2' : '#f0fdf4', border:`1.5px solid ${toast.startsWith('❌') ? '#fca5a5' : '#86efac'}`, color: toast.startsWith('❌') ? '#991b1b' : '#166534', padding:'12px 20px', borderRadius:12, zIndex:2000, fontWeight:700, boxShadow:'0 4px 20px rgba(0,0,0,.12)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1a3a2a,#2d5c3f)', paddingTop:64 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px clamp(16px,4vw,32px) 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.3rem,3vw,1.8rem)', color:'#fff', fontWeight:700, marginBottom:4 }}>
              {isAdmin ? 'Administration busGO CMR' : `Espace gestionnaire — ${user?.agency?.name || 'Mon agence'}`}
            </h1>
            <p style={{ color:'rgba(255,255,255,.55)', fontSize:'.82rem' }}>
              {isAdmin ? `Connecté en tant qu'admin · ${bookings.length} réservations` : `Gestionnaire d'agence · ${bookings.length} réservations`}
            </p>
          </div>
          <Link to="/" style={{ padding:'8px 18px', background:'rgba(255,255,255,.12)', color:'#fff', borderRadius:10, textDecoration:'none', fontSize:'.82rem', fontWeight:700 }}>← Site</Link>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(16px,4vw,32px)' }}>
          <div style={{ display:'flex', gap:0, overflowX:'auto', borderBottom:'2px solid rgba(255,255,255,.1)' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding:'14px 18px', background:'none', border:'none', cursor:'pointer', fontSize:'.85rem', fontWeight:700, color: tab===t.id ? '#fcd116' : 'rgba(255,255,255,.55)', borderBottom:`3px solid ${tab===t.id ? '#fcd116' : 'transparent'}`, marginBottom:-2, display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', transition:'color .2s' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px clamp(16px,4vw,32px)' }}>

        {loading && (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ width:48, height:48, border:'4px solid #e8e0d0', borderTopColor:'#007a5e', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 16px' }} />
            <p style={{ color:'#8a7d6e' }}>Chargement…</p>
          </div>
        )}

        {/* ══ DASHBOARD ══ */}
        {!loading && tab === 'dashboard' && isAdmin && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:16, marginBottom:28 }}>
              <KPI icon="🎫" label="Réservations"  value={stats?.totalBookings?.toLocaleString('fr-FR')}  sub="Hors annulées"   accent="#007a5e" />
              <KPI icon="🚌" label="Voyages actifs" value={stats?.activeTrips?.toLocaleString('fr-FR')}    sub="Programmés"      accent="#1a3a2a" />
              <KPI icon="🏢" label="Agences"         value={stats?.totalAgencies?.toLocaleString('fr-FR')} sub="Partenaires"     accent="#6d28d9" />
              <KPI icon="👥" label="Utilisateurs"    value={stats?.totalUsers?.toLocaleString('fr-FR')}    sub="Comptes USER"    accent="#ce1126" />
              <KPI icon="⏳" label="En attente"       value={stats?.pendingBookings?.toLocaleString('fr-FR')} sub="Réservations"  accent="#c4692a" />
              <KPI icon="💰" label="Revenu total"    value={stats?.totalRevenue ? `${(stats.totalRevenue/1000).toFixed(0)}k FCFA` : '—'} sub="Encaissé"  accent="#0369a1" />
            </div>

            <div style={{ background:'#fff', borderRadius:20, border:'1.5px solid #e8e0d0', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.04)' }}>
              <div style={{ padding:'18px 20px', borderBottom:'1px solid #e8e0d0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ fontWeight:700, color:'#1a3a2a', fontSize:'1rem', margin:0 }}>Dernières réservations</h3>
                <button onClick={() => setTab('bookings')} style={{ fontSize:'.78rem', color:'#007a5e', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>Voir tout →</button>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr>{['Référence','Voyageur','Trajet','Date','Statut','Montant'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {bookings.slice(0,8).map(b => (
                      <tr key={b.id} style={{ cursor:'pointer' }} onClick={() => setModalBooking(b)} onMouseEnter={e=>e.currentTarget.style.background='#fafaf8'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <td style={{ ...tdStyle, fontFamily:'monospace', fontSize:'.78rem', color:'#6b5d4f' }}>{b.id?.slice(0,10)}</td>
                        <td style={tdStyle}>{b.user?.name || b.passengerName || '—'}</td>
                        <td style={{ ...tdStyle, fontSize:'.8rem' }}>{cityOf(b.trip?.from)} → {cityOf(b.trip?.to)}</td>
                        <td style={{ ...tdStyle, fontSize:'.78rem', color:'#6b5d4f' }}>{fmt(b.createdAt)}</td>
                        <td style={tdStyle}><Badge status={b.status} /></td>
                        <td style={{ ...tdStyle, fontWeight:700 }}>{b.totalPrice?.toLocaleString('fr-FR')} FCFA</td>
                      </tr>
                    ))}
                    {bookings.length === 0 && <tr><td colSpan={6} style={{ ...tdStyle, textAlign:'center', color:'#8a7d6e' }}>Aucune réservation</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ AGENCES ══ */}
        {!loading && tab === 'agencies' && isAdmin && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
              <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.4rem', color:'#1a3a2a', margin:0 }}>Agences ({agencies.length})</h2>
              <Btn onClick={() => setModalAgency('create')}>+ Nouvelle agence</Btn>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
              {agencies.map(ag => (
                <div key={ag.id} style={{ background:'#fff', borderRadius:18, border:'1.5px solid #e8e0d0', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                    {ag.logo
                      ? <img src={ag.logo} alt="" style={{ width:48, height:48, borderRadius:12, objectFit:'cover' }} />
                      : <div style={{ width:48, height:48, borderRadius:12, background:'linear-gradient(135deg,#007a5e,#00a87d)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:'1.2rem' }}>{ag.name[0]}</div>
                    }
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, color:'#1a3a2a', fontSize:'1rem', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        {ag.name}
                        {ag.verified && <span style={{ fontSize:'.65rem', background:'#dcfce7', color:'#166534', padding:'2px 8px', borderRadius:50, fontWeight:800 }}>✓ Vérifié</span>}
                        {!ag.active && <span style={{ fontSize:'.65rem', background:'#fee2e2', color:'#991b1b', padding:'2px 8px', borderRadius:50, fontWeight:800 }}>Inactif</span>}
                      </div>
                      <div style={{ fontSize:'.78rem', color:'#8a7d6e', marginTop:2 }}>{ag.email}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, fontSize:'.78rem', color:'#6b5d4f', marginBottom:14, flexWrap:'wrap' }}>
                    <span>🚌 {ag._count?.trips || 0} voyages</span>
                    <span>·</span>
                    <span>👤 {ag._count?.users || 0} gestionnaire(s)</span>
                    <span>·</span>
                    <span>💰 Com. {((ag.commission || 0.04) * 100).toFixed(1)}%</span>
                  </div>
                  {ag.description && <p style={{ fontSize:'.8rem', color:'#8a7d6e', margin:'0 0 14px', lineHeight:1.5 }}>{ag.description.slice(0, 100)}{ag.description.length > 100 ? '…' : ''}</p>}
                  <div style={{ display:'flex', gap:8 }}>
                    <Btn onClick={() => setModalAgency(ag)} small>✏️ Modifier</Btn>
                    <Btn onClick={() => deleteAgency(ag)} color="#dc2626" small>🗑 Supprimer</Btn>
                  </div>
                </div>
              ))}
              {agencies.length === 0 && <p style={{ color:'#8a7d6e', gridColumn:'1/-1' }}>Aucune agence</p>}
            </div>
          </div>
        )}

        {/* ══ RÉSERVATIONS ══ */}
        {!loading && tab === 'bookings' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
              <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.4rem', color:'#1a3a2a', margin:0 }}>
                Réservations ({filteredBookings.length}{filteredBookings.length !== bookings.length ? `/${bookings.length}` : ''})
              </h2>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <input placeholder="🔍 Rechercher…" value={bookingSearch} onChange={e => setBookingSearch(e.target.value)}
                  style={{ ...inputStyle, width:200, padding:'8px 12px' }} />
              </div>
            </div>

            {/* Filtres statut */}
            <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap' }}>
              {[['all','Toutes'],['CONFIRMED','Confirmées'],['PENDING','En attente'],['VALIDATED','Validées'],['CANCELLED','Annulées']].map(([v,l]) => (
                <button key={v} onClick={() => setBookingFilter(v)}
                  style={{ padding:'6px 14px', borderRadius:50, border:'none', cursor:'pointer', fontWeight:700, fontSize:'.78rem', background: bookingFilter===v ? '#007a5e' : '#e8e0d0', color: bookingFilter===v ? '#fff' : '#6b5d4f' }}>
                  {l}
                </button>
              ))}
            </div>

            <div style={{ background:'#fff', borderRadius:20, border:'1.5px solid #e8e0d0', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.04)' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr>
                    {['Référence','Passager','Trajet','Départ','Statut','Montant','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filteredBookings.map(b => (
                      <tr key={b.id} onMouseEnter={e=>e.currentTarget.style.background='#fafaf8'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <td style={{ ...tdStyle, fontFamily:'monospace', fontSize:'.75rem', color:'#6b5d4f' }}>{b.id?.slice(0,12)}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight:700 }}>{b.user?.name || b.passengerName || '—'}</div>
                          <div style={{ fontSize:'.72rem', color:'#8a7d6e' }}>{b.user?.email || ''}</div>
                        </td>
                        <td style={{ ...tdStyle, fontSize:'.82rem' }}>
                          <strong>{cityOf(b.trip?.from)}</strong> → <strong>{cityOf(b.trip?.to)}</strong>
                          {b.trip?.agency && <div style={{ fontSize:'.7rem', color:'#8a7d6e' }}>{b.trip.agency.name}</div>}
                        </td>
                        <td style={{ ...tdStyle, fontSize:'.78rem', color:'#6b5d4f' }}>
                          {b.trip?.departureTime ? fmtTime(b.trip.departureTime) : '—'}<br/>
                          <span style={{ fontSize:'.7rem' }}>{fmt(b.trip?.departureTime)}</span>
                        </td>
                        <td style={tdStyle}><Badge status={b.status} /></td>
                        <td style={{ ...tdStyle, fontWeight:700, color:'#007a5e' }}>{b.totalPrice?.toLocaleString('fr-FR')} FCFA</td>
                        <td style={{ ...tdStyle }}>
                          <div style={{ display:'flex', gap:6 }}>
                            <Btn onClick={() => setModalBooking(b)} small>✏️</Btn>
                            {b.status !== 'CANCELLED' && b.user?.email && (
                              <Btn onClick={() => resendEmail(b.id)} color="#0369a1" small title="Renvoyer l'e-mail">📧</Btn>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredBookings.length === 0 && <tr><td colSpan={7} style={{ ...tdStyle, textAlign:'center', color:'#8a7d6e' }}>Aucune réservation</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ UTILISATEURS ══ */}
        {!loading && tab === 'users' && isAdmin && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
              <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.4rem', color:'#1a3a2a', margin:0 }}>Utilisateurs ({users.length})</h2>
              <Btn onClick={() => setModalUser('create')}>+ Nouvel utilisateur</Btn>
            </div>
            <div style={{ background:'#fff', borderRadius:20, border:'1.5px solid #e8e0d0', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.04)' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr>{['Nom','Email','Téléphone','Rôle','Agence','Réservations','Inscrit','Actions'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} onMouseEnter={e=>e.currentTarget.style.background='#fafaf8'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <td style={{ ...tdStyle, fontWeight:700 }}>{u.name}</td>
                        <td style={{ ...tdStyle, fontSize:'.82rem', color:'#6b5d4f' }}>{u.email}</td>
                        <td style={{ ...tdStyle, fontSize:'.82rem' }}>{u.phone || '—'}</td>
                        <td style={tdStyle}><RoleBadge role={u.role} /></td>
                        <td style={{ ...tdStyle, fontSize:'.8rem', color:'#6b5d4f' }}>{u.agency?.name || '—'}</td>
                        <td style={{ ...tdStyle, textAlign:'center', fontWeight:700 }}>{u._count?.bookings ?? '—'}</td>
                        <td style={{ ...tdStyle, fontSize:'.78rem', color:'#6b5d4f' }}>{fmt(u.createdAt)}</td>
                        <td style={tdStyle}>
                          <div style={{ display:'flex', gap:6 }}>
                            <Btn onClick={() => setModalUser(u)} small>✏️</Btn>
                            <Btn onClick={() => deleteUser(u)} color="#dc2626" small>🗑</Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={8} style={{ ...tdStyle, textAlign:'center', color:'#8a7d6e' }}>Aucun utilisateur</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ VOYAGES ══ */}
        {!loading && tab === 'trips' && (
          <div>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.4rem', color:'#1a3a2a', marginBottom:20 }}>Voyages ({trips.length})</h2>
            <div style={{ background:'#fff', borderRadius:20, border:'1.5px solid #e8e0d0', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.04)' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr>{['Agence','Trajet','Départ','Arrivée','Prix','Dispo/Total','Type'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {trips.map(t => (
                      <tr key={t.id} onMouseEnter={e=>e.currentTarget.style.background='#fafaf8'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <td style={{ ...tdStyle, fontWeight:700 }}>{t.agency?.name || '—'}</td>
                        <td style={tdStyle}><strong>{cityOf(t.from)}</strong> → <strong>{cityOf(t.to)}</strong></td>
                        <td style={tdStyle}>{fmtTime(t.departureTime)}</td>
                        <td style={tdStyle}>{fmtTime(t.arrivalTime)}</td>
                        <td style={{ ...tdStyle, fontWeight:700, color:'#007a5e' }}>{t.price?.toLocaleString('fr-FR')} FCFA</td>
                        <td style={tdStyle}>
                          <span style={{ color: t.availableSeats < 5 ? '#ce1126' : '#007a5e', fontWeight:700 }}>
                            {t.availableSeats ?? '?'}/{t.totalSeats ?? '?'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontSize:'.78rem', color:'#6b5d4f' }}>{t.busType || 'Standard'}</td>
                      </tr>
                    ))}
                    {trips.length === 0 && <tr><td colSpan={7} style={{ ...tdStyle, textAlign:'center', color:'#8a7d6e' }}>Aucun voyage</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ MODAL AGENCE ══ */}
      {modalAgency && (
        <AgencyModal
          agency={typeof modalAgency === 'object' ? modalAgency : null}
          onClose={() => setModalAgency(null)}
          onSave={saveAgency}
        />
      )}

      {/* ══ MODAL UTILISATEUR ══ */}
      {modalUser && (
        <UserModal
          user={typeof modalUser === 'object' ? modalUser : null}
          agencies={agencies}
          onClose={() => setModalUser(null)}
          onSave={saveUser}
        />
      )}

      {/* ══ MODAL RÉSERVATION ══ */}
      {modalBooking && (
        <BookingModal
          booking={modalBooking}
          onClose={() => setModalBooking(null)}
          onCancel={cancelBooking}
          onUpdate={updateBooking}
          onDelete={deleteBooking}
          onResendEmail={resendEmail}
        />
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg) } } * { box-sizing:border-box }`}</style>
    </div>
  );
}

// ─── Modal Agence ─────────────────────────────────────────────────────────────
function AgencyModal({ agency, onClose, onSave }) {
  const [form, setForm] = useState({
    name:        agency?.name        || '',
    slug:        agency?.slug        || '',
    email:       agency?.email       || '',
    phone:       agency?.phone       || '',
    logo:        agency?.logo        || '',
    description: agency?.description || '',
    commission:  agency?.commission  ?? 0.04,
    verified:    agency?.verified    ?? false,
    active:      agency?.active      ?? true,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const autoSlug = (name) => {
    const s = name.toLowerCase().replace(/[éèê]/g,'e').replace(/[àâ]/g,'a').replace(/[ùû]/g,'u').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    set('slug', s);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form, agency?.id);
    setSaving(false);
  };

  return (
    <Modal title={agency ? `Modifier : ${agency.name}` : 'Nouvelle agence'} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Nom de l'agence *">
          <input required style={inputStyle} value={form.name} onChange={e => { set('name', e.target.value); if (!agency) autoSlug(e.target.value); }} />
        </Field>
        <Field label="Slug (URL) *">
          <input required style={inputStyle} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="general-express" />
        </Field>
        <Field label="Email *">
          <input required type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} />
        </Field>
        <Field label="Téléphone">
          <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+237 6XX XX XX XX" />
        </Field>
        <Field label="URL du logo">
          <input style={inputStyle} value={form.logo} onChange={e => set('logo', e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Description">
          <textarea rows={3} style={{ ...inputStyle, resize:'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} />
        </Field>
        <Field label="Commission (ex: 0.04 = 4%)">
          <input type="number" step="0.01" min="0" max="0.2" style={inputStyle} value={form.commission} onChange={e => set('commission', e.target.value)} />
        </Field>
        <div style={{ display:'flex', gap:16, marginBottom:20 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <input type="checkbox" checked={form.verified} onChange={e => set('verified', e.target.checked)} /> Vérifié
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} /> Actif
          </label>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button type="button" onClick={onClose} style={{ flex:1, padding:'11px', background:'#f0ece4', color:'#6b5d4f', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>Annuler</button>
          <button type="submit" disabled={saving} style={{ flex:2, padding:'11px', background: saving ? '#9ca3af' : 'linear-gradient(135deg,#007a5e,#00a87d)', color:'#fff', border:'none', borderRadius:10, fontWeight:800, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Enregistrement…' : agency ? 'Mettre à jour' : 'Créer l\'agence'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal Utilisateur ────────────────────────────────────────────────────────
function UserModal({ user, agencies, onClose, onSave }) {
  const [form, setForm] = useState({
    name:     user?.name     || '',
    email:    user?.email    || '',
    phone:    user?.phone    || '',
    role:     user?.role     || 'USER',
    agencyId: user?.agencyId || '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...form };
    if (!data.password) delete data.password;
    if (!data.agencyId) delete data.agencyId;
    await onSave(data, user?.id);
    setSaving(false);
  };

  return (
    <Modal title={user ? `Modifier : ${user.name}` : 'Nouvel utilisateur'} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Nom complet *"><input required style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} /></Field>
        {!user && <Field label="Email *"><input required type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} /></Field>}
        <Field label="Téléphone"><input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+237 6XX…" /></Field>
        <Field label={user ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}>
          <input type="password" style={inputStyle} value={form.password} onChange={e => set('password', e.target.value)} required={!user} />
        </Field>
        <Field label="Rôle">
          <select style={inputStyle} value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="USER">USER — Voyageur</option>
            <option value="AGENCY">AGENCY — Gestionnaire d'agence</option>
            <option value="ADMIN">ADMIN — Administrateur</option>
          </select>
        </Field>
        {form.role === 'AGENCY' && (
          <Field label="Agence *">
            <select style={inputStyle} value={form.agencyId} onChange={e => set('agencyId', e.target.value)} required>
              <option value="">— Choisir une agence —</option>
              {agencies.map(ag => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
            </select>
          </Field>
        )}
        <div style={{ display:'flex', gap:10, marginTop:8 }}>
          <button type="button" onClick={onClose} style={{ flex:1, padding:'11px', background:'#f0ece4', color:'#6b5d4f', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>Annuler</button>
          <button type="submit" disabled={saving} style={{ flex:2, padding:'11px', background: saving ? '#9ca3af' : 'linear-gradient(135deg,#007a5e,#00a87d)', color:'#fff', border:'none', borderRadius:10, fontWeight:800, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Enregistrement…' : user ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal Réservation ────────────────────────────────────────────────────────
function BookingModal({ booking: bk, onClose, onCancel, onUpdate, onDelete, onResendEmail }) {
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'cancel'
  const [reason, setReason] = useState('');
  const [form, setForm] = useState({
    passengerName:  bk.passengerName  || '',
    passengerPhone: bk.passengerPhone || '',
    pax:            bk.pax            || 1,
    status:         bk.status,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const dep = bk.trip?.departureTime ? new Date(bk.trip.departureTime).toLocaleString('fr-FR', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onUpdate(bk, form);
    setSaving(false);
  };

  const handleCancel = async () => {
    setSaving(true);
    await onCancel(bk, reason);
    setSaving(false);
  };

  return (
    <Modal title={`Réservation ${bk.id?.slice(0,12)}`} onClose={onClose}>
      {/* Infos résumé */}
      <div style={{ background:'#f8f4ee', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            ['Passager', bk.passengerName || bk.user?.name || '—'],
            ['E-mail',   bk.user?.email   || '—'],
            ['Trajet',   `${bk.trip?.from?.city || '?'} → ${bk.trip?.to?.city || '?'}`],
            ['Départ',   dep],
            ['Agence',   bk.trip?.agency?.name || '—'],
            ['Montant',  `${bk.totalPrice?.toLocaleString('fr-FR')} FCFA`],
            ['Places',   `${bk.pax} siège(s)`],
            ['Code QR',  bk.validationCode || '—'],
          ].map(([l,v]) => (
            <div key={l}>
              <div style={{ fontSize:'.65rem', fontWeight:800, color:'#8a7d6e', textTransform:'uppercase', letterSpacing:'.07em' }}>{l}</div>
              <div style={{ fontSize:'.85rem', fontWeight:700, color:'#1a3a2a', wordBreak:'break-word' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:10 }}><Badge status={bk.status} /></div>
      </div>

      {/* Boutons actions */}
      {mode === 'view' && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
          {bk.status !== 'CANCELLED' && bk.status !== 'VALIDATED' && (
            <>
              <Btn onClick={() => setMode('edit')}>✏️ Modifier</Btn>
              <Btn onClick={() => setMode('cancel')} color="#dc2626">❌ Annuler</Btn>
            </>
          )}
          {bk.user?.email && <Btn onClick={() => onResendEmail(bk.id)} color="#0369a1">📧 Renvoyer e-mail</Btn>}
          <Btn onClick={() => onDelete(bk)} color="#6b7280">🗑 Supprimer</Btn>
        </div>
      )}

      {/* Formulaire modification */}
      {mode === 'edit' && (
        <form onSubmit={handleUpdate}>
          <Field label="Nom du passager principal">
            <input style={inputStyle} value={form.passengerName} onChange={e => set('passengerName', e.target.value)} />
          </Field>
          <Field label="Téléphone">
            <input style={inputStyle} value={form.passengerPhone} onChange={e => set('passengerPhone', e.target.value)} />
          </Field>
          <Field label="Nombre de places">
            <input type="number" min={1} max={10} style={inputStyle} value={form.pax} onChange={e => set('pax', e.target.value)} />
          </Field>
          <Field label="Statut">
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="CONFIRMED">Confirmé</option>
              <option value="PENDING">En attente</option>
              <option value="VALIDATED">Validé</option>
              <option value="COMPLETED">Terminé</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </Field>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button type="button" onClick={() => setMode('view')} style={{ flex:1, padding:'10px', background:'#f0ece4', color:'#6b5d4f', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>← Retour</button>
            <button type="submit" disabled={saving} style={{ flex:2, padding:'10px', background: saving ? '#9ca3af' : 'linear-gradient(135deg,#007a5e,#00a87d)', color:'#fff', border:'none', borderRadius:10, fontWeight:800, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Enregistrement…' : '💾 Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {/* Formulaire annulation */}
      {mode === 'cancel' && (
        <div>
          <div style={{ background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:'.85rem', color:'#991b1b' }}>
            ⚠️ Cette action annulera la réservation et libérera les sièges. Un e-mail sera envoyé au client.
          </div>
          <Field label="Motif de l'annulation (optionnel)">
            <textarea rows={3} style={{ ...inputStyle, resize:'vertical' }} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex : annulation du voyage, surréservation, demande du client…" />
          </Field>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setMode('view')} style={{ flex:1, padding:'10px', background:'#f0ece4', color:'#6b5d4f', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>← Retour</button>
            <button onClick={handleCancel} disabled={saving} style={{ flex:2, padding:'10px', background: saving ? '#9ca3af' : '#dc2626', color:'#fff', border:'none', borderRadius:10, fontWeight:800, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Annulation…' : '❌ Confirmer l\'annulation'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
