import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmé', bg: '#dcfce7', color: '#166534', icon: '✅' },
  PENDING:   { label: 'En attente', bg: '#fef9c3', color: '#854d0e', icon: '⏳' },
  CANCELLED: { label: 'Annulé', bg: '#fee2e2', color: '#991b1b', icon: '❌' },
  COMPLETED: { label: 'Terminé', bg: '#f3f4f6', color: '#374151', icon: '🏁' },
};

const CITY = { YDE:'Yaoundé', DLA:'Douala', BFT:'Bafoussam', NGD:'Ngaoundéré', LIM:'Limbé', BUE:'Buéa', EDO:'Ébolowa', BSG:'Bertoua', GAR:'Garoua', MRU:'Maroua', BAM:'Bamenda', KMB:'Kumba' };

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const [filter, setFilter] = useState('all');

  const token = localStorage.getItem('busgo_token');

  useEffect(() => {
    if (!token) { navigate('/connexion'); return; }
    api.get('/api/bookings/my')
      .then(r => setBookings(r.data.bookings || r.data || []))
      .catch(() => setErr('Impossible de charger vos réservations.'))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const cancel = async (id) => {
    if (!window.confirm('Annuler cette réservation ?')) return;
    setCancelling(id);
    try {
      await api.post(`/api/bookings/${id}/cancel`, {});
      setBookings(b => b.map(bk => bk.id === id ? { ...bk, status: 'CANCELLED' } : bk));
    } catch { alert('Erreur lors de l\'annulation.'); }
    finally { setCancelling(null); }
  };

  const fmt = d => new Date(d).toLocaleString('fr-FR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const fmtTime = d => new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  const fmtDate = d => new Date(d).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' });

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div style={{ minHeight: '100vh', background: '#f0ece4', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1a3a2a,#2d5c3f)', paddingTop: 64 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px clamp(16px,4vw,32px) 28px' }}>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: '#fff', fontWeight: 700, marginBottom: 6 }}>
            🎫 Mes voyages
          </h1>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.9rem' }}>
            {bookings.length} réservation{bookings.length > 1 ? 's' : ''} au total
          </p>

          {/* Filter tabs */}
          {bookings.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 20, flexWrap: 'wrap' }}>
              {[['all', 'Toutes'], ['CONFIRMED', 'Confirmées'], ['PENDING', 'En attente'], ['CANCELLED', 'Annulées'], ['COMPLETED', 'Terminées']].map(([val, lbl]) => (
                <button key={val} onClick={() => setFilter(val)}
                  style={{ padding: '6px 16px', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '.8rem', fontWeight: 700, background: filter === val ? '#fcd116' : 'rgba(255,255,255,.12)', color: filter === val ? '#1a3a2a' : 'rgba(255,255,255,.75)', transition: 'all .2s' }}>
                  {lbl}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px clamp(16px,4vw,32px)' }}>
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #e8e0d0', borderTopColor: '#007a5e', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#8a7d6e' }}>Chargement de vos réservations…</p>
          </div>
        )}

        {/* Error */}
        {!loading && err && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#b91c1c', padding: '16px 20px', borderRadius: 14 }}>⚠️ {err}</div>
        )}

        {/* Empty */}
        {!loading && !err && bookings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1.5px solid #e8e0d0', marginTop: 12 }}>
            <div style={{ fontSize: '4rem', marginBottom: 20 }}>🎫</div>
            <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: '#1a3a2a', marginBottom: 10 }}>Aucune réservation</h3>
            <p style={{ color: '#8a7d6e', marginBottom: 28, maxWidth: 320, margin: '0 auto 28px' }}>Vous n'avez pas encore réservé de voyage. Explorez nos destinations !</p>
            <Link to="/" style={{ padding: '12px 28px', background: '#007a5e', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>Trouver un voyage →</Link>
          </div>
        )}

        {/* Booking cards */}
        {filtered.map(bk => {
          const status = STATUS_CONFIG[bk.status] || STATUS_CONFIG.PENDING;
          const canCancel = bk.status === 'CONFIRMED' || bk.status === 'PENDING';
          return (
            <div key={bk.id} style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e8e0d0', marginBottom: 16, overflow: 'hidden', boxShadow: '0 2px 14px rgba(0,0,0,.05)' }}>
              {/* Status banner */}
              <div style={{ background: status.bg, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: status.color, fontWeight: 700, fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {status.icon} {status.label}
                </span>
                <span style={{ color: '#8a7d6e', fontSize: '.75rem' }}>Réservé le {fmt(bk.createdAt)}</span>
              </div>

              <div style={{ padding: '20px' }}>
                {/* Route */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a3a2a' }}>
                      {bk.trip?.departureTime ? fmtTime(bk.trip.departureTime) : '--:--'}
                    </div>
                    <div style={{ fontSize: '.78rem', color: '#8a7d6e', fontWeight: 600 }}>
                      {CITY[bk.trip?.from?.code] || bk.trip?.from?.city || '—'}
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 80 }}>
                    <div style={{ fontSize: '.72rem', color: '#8a7d6e' }}>
                      {bk.trip?.departureTime ? fmtDate(bk.trip.departureTime) : ''}
                    </div>
                    <div style={{ height: 3, width: '100%', background: 'linear-gradient(to right,#007a5e,#fcd116)', borderRadius: 3 }} />
                    <div style={{ fontSize: '.7rem', color: '#8a7d6e' }}>
                      {bk.trip?.agency?.name || 'Agence'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a3a2a' }}>
                      {bk.trip?.arrivalTime ? fmtTime(bk.trip.arrivalTime) : '--:--'}
                    </div>
                    <div style={{ fontSize: '.78rem', color: '#8a7d6e', fontWeight: 600 }}>
                      {CITY[bk.trip?.to?.code] || bk.trip?.to?.city || '—'}
                    </div>
                  </div>
                </div>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Référence', value: bk.reference || bk.id?.slice(0,8).toUpperCase(), mono: true },
                    { label: 'Code validation', value: bk.validationCode || '——', mono: true, highlight: true },
                    { label: 'Passagers', value: `${bk.seats || bk.passengerCount || 1} siège(s)` },
                    { label: 'Total payé', value: `${bk.totalPrice?.toLocaleString('fr-FR') || '—'} FCFA`, bold: true },
                  ].map(d => (
                    <div key={d.label} style={{ background: d.highlight ? '#f0fdf4' : '#f8f4ee', borderRadius: 10, padding: '10px 14px', border: d.highlight ? '1px solid #86efac' : 'none' }}>
                      <div style={{ fontSize: '.68rem', fontWeight: 700, color: '#8a7d6e', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>{d.label}</div>
                      <div style={{ fontFamily: d.mono ? 'monospace' : 'inherit', fontSize: d.bold ? '1rem' : '.88rem', fontWeight: d.bold ? 800 : 700, color: d.highlight ? '#166534' : '#1a3a2a', letterSpacing: d.mono ? '.05em' : 0 }}>
                        {d.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {canCancel && (
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={() => cancel(bk.id)} disabled={cancelling === bk.id}
                      style={{ padding: '9px 20px', background: cancelling === bk.id ? '#e5e7eb' : '#fef2f2', color: '#b91c1c', border: '1.5px solid #fca5a5', borderRadius: 10, fontWeight: 700, cursor: cancelling === bk.id ? 'not-allowed' : 'pointer', fontSize: '.85rem' }}>
                      {cancelling === bk.id ? '⏳ Annulation…' : '❌ Annuler ce voyage'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Filtered empty */}
        {!loading && !err && bookings.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: 20, border: '1.5px solid #e8e0d0' }}>
            <p style={{ color: '#8a7d6e' }}>Aucune réservation dans cette catégorie.</p>
          </div>
        )}

        {/* New trip CTA */}
        {!loading && !err && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: '#007a5e', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700, boxShadow: '0 4px 16px rgba(0,122,94,.25)' }}>
              🔍 Réserver un nouveau voyage
            </Link>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg) } } * { box-sizing:border-box }`}</style>
    </div>
  );
}
