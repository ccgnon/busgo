import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Admin() {
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('dashboard');

  useEffect(() => {
    const token = localStorage.getItem('busgo_token');
    if (!token) { navigate('/connexion'); return; }
    const h = { headers: { Authorization: `Bearer ${token}` } };
    Promise.all([
      axios.get('/api/admin/stats', h),
      axios.get('/api/admin/bookings', h)
    ]).then(([s, b]) => {
      setStats(s.data.stats || s.data);
      setBookings(b.data.bookings || b.data || []);
    }).catch(e => {
      if (e.response?.status === 403) navigate('/');
      else if (e.response?.status === 401) navigate('/connexion');
    }).finally(() => setLoading(false));
  }, [navigate]);

  const STATUS_COLOR = { PENDING:'#f59e0b', CONFIRMED:'#007a5e', CANCELLED:'#ce1126', COMPLETED:'#3b82f6', VALIDATED:'#007a5e' };
  const fmt = d => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit' });
  const fmtT = d => new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });

  const S = {
    page: { minHeight:'100vh', background:'#f0f2f5', display:'flex', flexDirection:'column' },
    topbar: { background:'#1a3a2a', color:'#fff', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' },
    layout: { display:'flex', flex:1 },
    sidebar: { width:200, background:'#fff', borderRight:'1px solid #e8e0d0', padding:'16px 0', flexShrink:0 },
    navItem: (active) => ({ display:'block', padding:'10px 20px', color: active?'#007a5e':'#4a4035', fontWeight: active?700:500, fontSize:'.88rem', cursor:'pointer', borderLeft: active?'3px solid #007a5e':'3px solid transparent', background: active?'#f0faf7':'transparent', textDecoration:'none' }),
    main: { flex:1, padding:24, overflowX:'auto' },
    statCard: { background:'#fff', borderRadius:14, padding:'20px 24px', border:'1px solid #e8e0d0', flex:1, minWidth:150 },
    tableHead: { background:'#f8f4ee', fontSize:'.75rem', fontWeight:700, color:'#8a7d6e', textTransform:'uppercase', letterSpacing:'.05em', padding:'10px 14px', textAlign:'left' },
    tableCell: { padding:'12px 14px', fontSize:'.83rem', color:'#4a4035', borderBottom:'1px solid #f0ece0' },
  };

  if (loading) return <div style={S.page}><div style={S.topbar}><span>🚌 busGO Admin</span></div><div style={{textAlign:'center', padding:80, color:'#8a7d6e'}}>Chargement…</div></div>;

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <Link to="/" style={{color:'#fcd116', textDecoration:'none', fontWeight:700, fontFamily:'Georgia,serif', fontSize:'1.1rem'}}>🚌 busGO</Link>
          <span style={{color:'rgba(255,255,255,.4)'}}>›</span>
          <span style={{fontSize:'.85rem', opacity:.8, fontWeight:600}}>Admin</span>
        </div>
        <button onClick={() => { localStorage.removeItem('busgo_token'); navigate('/connexion'); }}
          style={{background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', color:'#fff', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:'.8rem'}}>
          Déconnexion
        </button>
      </div>

      <div style={S.layout}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          {[
            { id:'dashboard', label:'📊 Tableau de bord' },
            { id:'bookings',  label:'🎫 Réservations' },
            { id:'trips',     label:'🚌 Voyages' },
          ].map(item => (
            <div key={item.id} style={S.navItem(tab === item.id)} onClick={() => setTab(item.id)}>
              {item.label}
            </div>
          ))}
        </div>

        {/* Main */}
        <div style={S.main}>
          {/* Dashboard */}
          {tab === 'dashboard' && stats && (
            <>
              <h2 style={{fontFamily:'Georgia,serif', color:'#1a3a2a', marginBottom:20}}>Tableau de bord</h2>
              <div style={{display:'flex', gap:16, flexWrap:'wrap', marginBottom:28}}>
                {[
                  { label:'Réservations', value: stats.totalBookings, icon:'🎫', color:'#007a5e' },
                  { label:'Revenus (FCFA)', value: stats.totalRevenue?.toLocaleString('fr-FR'), icon:'💰', color:'#c4692a' },
                  { label:'Utilisateurs', value: stats.totalUsers, icon:'👥', color:'#3b82f6' },
                  { label:'Voyages', value: stats.totalTrips, icon:'🚌', color:'#8b5cf6' },
                ].map((c,i) => (
                  <div key={i} style={S.statCard}>
                    <div style={{fontSize:'1.6rem', marginBottom:6}}>{c.icon}</div>
                    <div style={{fontSize:'1.7rem', fontWeight:700, color: c.color}}>{c.value ?? '—'}</div>
                    <div style={{color:'#8a7d6e', fontSize:'.8rem', marginTop:2}}>{c.label}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'#fff', borderRadius:14, padding:'20px 24px', border:'1px solid #e8e0d0'}}>
                <h3 style={{color:'#1a3a2a', marginBottom:12, fontSize:'1rem', fontWeight:700}}>Activité récente</h3>
                <p style={{color:'#8a7d6e', fontSize:'.85rem'}}>Voir l'onglet Réservations pour le détail.</p>
              </div>
            </>
          )}

          {/* Bookings */}
          {tab === 'bookings' && (
            <>
              <h2 style={{fontFamily:'Georgia,serif', color:'#1a3a2a', marginBottom:20}}>Réservations</h2>
              <div style={{background:'#fff', borderRadius:14, border:'1px solid #e8e0d0', overflow:'hidden'}}>
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                  <thead>
                    <tr>
                      {['Référence','Passager','Trajet','Date départ','Places','Total','Statut'].map(h => (
                        <th key={h} style={S.tableHead}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 && (
                      <tr><td colSpan={7} style={{...S.tableCell, textAlign:'center', padding:40, color:'#8a7d6e'}}>Aucune réservation</td></tr>
                    )}
                    {bookings.map(b => (
                      <tr key={b.id}>
                        <td style={S.tableCell}><span style={{fontFamily:'monospace', fontWeight:700, fontSize:'.82rem', color:'#1a3a2a'}}>{b.reference}</span></td>
                        <td style={S.tableCell}>{b.passengerName || b.user?.name || '—'}</td>
                        <td style={S.tableCell}>{b.trip?.from?.code || '—'} → {b.trip?.to?.code || '—'}</td>
                        <td style={S.tableCell}>{b.trip?.departureTime ? `${fmt(b.trip.departureTime)} ${fmtT(b.trip.departureTime)}` : '—'}</td>
                        <td style={S.tableCell}>{b.seatNumbers?.join(', ') || '—'}</td>
                        <td style={S.tableCell}><strong style={{color:'#007a5e'}}>{b.totalPrice?.toLocaleString('fr-FR')} F</strong></td>
                        <td style={S.tableCell}>
                          <span style={{padding:'2px 10px', borderRadius:20, background:`${STATUS_COLOR[b.status] || '#8a7d6e'}22`, color: STATUS_COLOR[b.status] || '#8a7d6e', fontSize:'.72rem', fontWeight:700, whiteSpace:'nowrap'}}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Trips placeholder */}
          {tab === 'trips' && (
            <>
              <h2 style={{fontFamily:'Georgia,serif', color:'#1a3a2a', marginBottom:20}}>Voyages programmés</h2>
              <div style={{background:'#fff', borderRadius:14, padding:'40px', border:'1px solid #e8e0d0', textAlign:'center', color:'#8a7d6e'}}>
                <div style={{fontSize:'2.5rem', marginBottom:12}}>🚌</div>
                <p>Gestion des voyages disponible via l'API REST.</p>
                <code style={{fontSize:'.8rem', background:'#f0ece0', padding:'4px 10px', borderRadius:6}}>POST /api/trips</code>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
