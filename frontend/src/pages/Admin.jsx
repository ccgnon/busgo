import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';

const TABS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
  { id: 'trips', label: 'Voyages', icon: '🚌' },
  { id: 'bookings', label: 'Réservations', icon: '🎫' },
  { id: 'users', label: 'Utilisateurs', icon: '👥' },
];

const CITY = { YDE:'Yaoundé', DLA:'Douala', BFT:'Bafoussam', NGD:'Ngaoundéré', LIM:'Limbé', BUE:'Buéa', EDO:'Ébolowa', BSG:'Bertoua' };

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sideOpen, setSideOpen] = useState(false);

  const token = localStorage.getItem('busgo_token');

  useEffect(() => {
    if (!token) { navigate('/connexion'); return; }
    Promise.all([
      api.get('/api/admin/stats').catch(() => ({ data: {} })),
      api.get('/api/admin/trips').catch(() => ({ data: [] })),
      api.get('/api/admin/bookings').catch(() => ({ data: [] })),
      api.get('/api/admin/users').catch(() => ({ data: [] })),
    ]).then(([s, t, b, u]) => {
      setStats(s.data.stats || s.data || {});
      setTrips(t.data.trips || t.data || []);
      setBookings(b.data.bookings || b.data || []);
      setUsers(u.data.users || u.data || []);
    }).finally(() => setLoading(false));
  }, [token, navigate]);

  const fmt = d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = d => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const KPI = ({ icon, label, value, sub, accent }) => (
    <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #e8e0d0', padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
      <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, color: accent || '#1a3a2a', letterSpacing: '-.02em' }}>{value ?? '—'}</div>
      <div style={{ fontWeight: 700, color: '#1a3a2a', fontSize: '.85rem', marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: '.75rem', color: '#8a7d6e' }}>{sub}</div>}
    </div>
  );

  const badgeStatus = (s) => {
    const cfg = { CONFIRMED: ['#dcfce7','#166534'], PENDING: ['#fef9c3','#854d0e'], CANCELLED: ['#fee2e2','#991b1b'], COMPLETED: ['#f3f4f6','#374151'] };
    const [bg, col] = cfg[s] || ['#f3f4f6','#374151'];
    return <span style={{ background: bg, color: col, fontSize: '.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: 50 }}>{s}</span>;
  };

  const thStyle = { padding: '10px 14px', fontSize: '.68rem', fontWeight: 800, color: '#8a7d6e', textTransform: 'uppercase', letterSpacing: '.08em', textAlign: 'left', borderBottom: '2px solid #e8e0d0', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '12px 14px', fontSize: '.85rem', color: '#1a3a2a', borderBottom: '1px solid #f0ece4', verticalAlign: 'middle' };

  return (
    <div style={{ minHeight: '100vh', background: '#f0ece4', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1a3a2a,#2d5c3f)', paddingTop: 64 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px clamp(16px,4vw,32px) 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.4rem,3vw,1.9rem)', color: '#fff', fontWeight: 700, marginBottom: 4 }}>Administration busGO CMR</h1>
            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.85rem' }}>Gestion de la plateforme</p>
          </div>
          <Link to="/" style={{ padding: '8px 18px', background: 'rgba(255,255,255,.12)', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: '.82rem', fontWeight: 700 }}>← Retour au site</Link>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)' }}>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '2px solid rgba(255,255,255,.1)' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.85rem', fontWeight: 700, color: tab === t.id ? '#fcd116' : 'rgba(255,255,255,.55)', borderBottom: `3px solid ${tab === t.id ? '#fcd116' : 'transparent'}`, marginBottom: -2, display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', transition: 'color .2s' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px clamp(16px,4vw,32px)' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #e8e0d0', borderTopColor: '#007a5e', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#8a7d6e' }}>Chargement…</p>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {!loading && tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
              <KPI icon="🎫" label="Réservations" value={stats?.totalBookings?.toLocaleString('fr-FR')} sub="Total" accent="#007a5e" />
              <KPI icon="🚌" label="Voyages actifs" value={stats?.activeTrips?.toLocaleString('fr-FR')} sub="Aujourd'hui + à venir" accent="#1a3a2a" />
              <KPI icon="👥" label="Utilisateurs" value={stats?.totalUsers?.toLocaleString('fr-FR')} sub="Comptes inscrits" accent="#ce1126" />
              <KPI icon="💰" label="Revenu" value={stats?.totalRevenue ? `${(stats.totalRevenue/1000).toFixed(0)}k FCFA` : '—'} sub="Total encaissé" accent="#c4692a" />
            </div>

            {/* Recent bookings */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e8e0d0', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #e8e0d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 700, color: '#1a3a2a', fontSize: '1rem' }}>Dernières réservations</h3>
                <button onClick={() => setTab('bookings')} style={{ fontSize: '.78rem', color: '#007a5e', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Voir tout →</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['Référence', 'Voyageur', 'Trajet', 'Date', 'Statut', 'Montant'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {bookings.slice(0, 6).map(b => (
                      <tr key={b.id}>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '.78rem', color: '#6b5d4f' }}>{b.reference || b.id?.slice(0,8).toUpperCase()}</td>
                        <td style={tdStyle}>{b.user?.name || '—'}</td>
                        <td style={{ ...tdStyle, fontSize: '.8rem' }}>{CITY[b.trip?.from?.code] || '?'} → {CITY[b.trip?.to?.code] || '?'}</td>
                        <td style={{ ...tdStyle, fontSize: '.78rem', color: '#6b5d4f' }}>{b.createdAt ? fmt(b.createdAt) : '—'}</td>
                        <td style={tdStyle}>{badgeStatus(b.status)}</td>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>{b.totalPrice?.toLocaleString('fr-FR')} FCFA</td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#8a7d6e' }}>Aucune réservation</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TRIPS ── */}
        {!loading && tab === 'trips' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: '#1a3a2a' }}>Voyages ({trips.length})</h2>
            </div>
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e8e0d0', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['Agence', 'Trajet', 'Départ', 'Arrivée', 'Prix', 'Places dispo', 'Type'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {trips.map(t => (
                      <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background = '#fafaf8'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>{t.agency?.name || '—'}</td>
                        <td style={tdStyle}><span style={{ fontWeight: 700 }}>{CITY[t.from?.code] || t.from?.city}</span><span style={{ color: '#8a7d6e' }}> → </span><span style={{ fontWeight: 700 }}>{CITY[t.to?.code] || t.to?.city}</span></td>
                        <td style={tdStyle}>{t.departureTime ? fmtTime(t.departureTime) : '—'}</td>
                        <td style={tdStyle}>{t.arrivalTime ? fmtTime(t.arrivalTime) : '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#007a5e' }}>{t.price?.toLocaleString('fr-FR')} FCFA</td>
                        <td style={tdStyle}>
                          <span style={{ color: t.availableSeats < 5 ? '#ce1126' : '#007a5e', fontWeight: 700 }}>
                            {t.availableSeats ?? t.totalSeats ?? '—'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontSize: '.78rem', color: '#6b5d4f' }}>{t.busType || 'Standard'}</td>
                      </tr>
                    ))}
                    {trips.length === 0 && (
                      <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#8a7d6e' }}>Aucun voyage</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {!loading && tab === 'bookings' && (
          <div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: '#1a3a2a', marginBottom: 20 }}>Réservations ({bookings.length})</h2>
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e8e0d0', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['Référence', 'Voyageur', 'Email', 'Trajet', 'Passagers', 'Statut', 'Total', 'Date'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id} onMouseEnter={e => e.currentTarget.style.background = '#fafaf8'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '.78rem' }}>{b.reference || b.id?.slice(0,8).toUpperCase()}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{b.user?.name || '—'}</td>
                        <td style={{ ...tdStyle, fontSize: '.78rem', color: '#6b5d4f' }}>{b.user?.email || '—'}</td>
                        <td style={{ ...tdStyle, fontSize: '.8rem' }}>{CITY[b.trip?.from?.code] || '?'} → {CITY[b.trip?.to?.code] || '?'}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{b.seats || b.passengerCount || 1}</td>
                        <td style={tdStyle}>{badgeStatus(b.status)}</td>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>{b.totalPrice?.toLocaleString('fr-FR')} FCFA</td>
                        <td style={{ ...tdStyle, fontSize: '.78rem', color: '#6b5d4f' }}>{b.createdAt ? fmt(b.createdAt) : '—'}</td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#8a7d6e' }}>Aucune réservation</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {!loading && tab === 'users' && (
          <div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: '#1a3a2a', marginBottom: 20 }}>Utilisateurs ({users.length})</h2>
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e8e0d0', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['Nom', 'Email', 'Téléphone', 'Rôle', 'Réservations', 'Inscrit le'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} onMouseEnter={e => e.currentTarget.style.background = '#fafaf8'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>{u.name || '—'}</td>
                        <td style={{ ...tdStyle, fontSize: '.83rem', color: '#6b5d4f' }}>{u.email}</td>
                        <td style={{ ...tdStyle, fontSize: '.83rem' }}>{u.phone || '—'}</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: 50, background: u.role === 'ADMIN' ? '#fee2e2' : u.role === 'AGENCY' ? '#fef9c3' : '#dcfce7', color: u.role === 'ADMIN' ? '#991b1b' : u.role === 'AGENCY' ? '#854d0e' : '#166534' }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{u._count?.bookings ?? u.bookingsCount ?? '—'}</td>
                        <td style={{ ...tdStyle, fontSize: '.78rem', color: '#6b5d4f' }}>{u.createdAt ? fmt(u.createdAt) : '—'}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#8a7d6e' }}>Aucun utilisateur</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg) } } * { box-sizing:border-box }`}</style>
    </div>
  );
}
