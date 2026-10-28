import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const STATUS_LABEL = { PENDING:'En attente', CONFIRMED:'Confirmé', CANCELLED:'Annulé', COMPLETED:'Terminé', VALIDATED:'Validé' };
const STATUS_COLOR = { PENDING:'#f59e0b', CONFIRMED:'#007a5e', CANCELLED:'#ce1126', COMPLETED:'#3b82f6', VALIDATED:'#007a5e' };

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('busgo_token');
    if (!token) { navigate('/connexion'); return; }
    axios.get('/api/bookings/my', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setBookings(r.data.bookings || r.data || []))
      .catch(e => setErr(e.response?.status === 401 ? 'Session expirée. Reconnectez-vous.' : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const cancel = async (id) => {
    if (!window.confirm('Annuler cette réservation ?')) return;
    const token = localStorage.getItem('busgo_token');
    try {
      await axios.post(`/api/bookings/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setBookings(b => b.map(x => x.id === id ? {...x, status:'CANCELLED'} : x));
    } catch { alert('Impossible d\'annuler.'); }
  };

  const fmt = d => new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' });
  const fmtT = d => new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });

  return (
    <div style={{minHeight:'100vh', background:'#f5f0e8'}}>
      <div style={{background:'#1a3a2a', color:'#fff', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <Link to="/" style={{color:'#fcd116', textDecoration:'none', fontWeight:700, fontSize:'1.2rem'}}>🚌 busGO</Link>
          <span style={{color:'rgba(255,255,255,.4)'}}>›</span>
          <span style={{fontSize:'.85rem', opacity:.8}}>Mes voyages</span>
        </div>
        <button onClick={() => { localStorage.removeItem('busgo_token'); navigate('/connexion'); }} style={{background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', color:'#fff', padding:'7px 16px', borderRadius:8, cursor:'pointer', fontSize:'.8rem'}}>Déconnexion</button>
      </div>

      <div style={{maxWidth:780, margin:'0 auto', padding:'28px 16px'}}>
        <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.5rem', color:'#1a3a2a', marginBottom:24}}>Mes réservations</h2>

        {loading && <div style={{textAlign:'center', padding:80, color:'#8a7d6e'}}>Chargement…</div>}
        {err && <div style={{background:'#fef2f2', border:'1px solid #fca5a5', color:'#ce1126', padding:'12px 16px', borderRadius:12, marginBottom:16}}>{err} <Link to="/connexion" style={{color:'#ce1126', fontWeight:700}}>Se connecter</Link></div>}

        {!loading && !err && bookings.length === 0 && (
          <div style={{textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:16, border:'1.5px solid #e8e0d0'}}>
            <div style={{fontSize:'3rem', marginBottom:16}}>🎫</div>
            <h3 style={{color:'#1a3a2a', marginBottom:8}}>Aucune réservation</h3>
            <p style={{color:'#8a7d6e', marginBottom:20}}>Vous n'avez pas encore réservé de voyage.</p>
            <Link to="/" style={{padding:'10px 24px', background:'#007a5e', color:'#fff', borderRadius:10, textDecoration:'none', fontWeight:600}}>Réserver maintenant</Link>
          </div>
        )}

        {bookings.map(b => (
          <div key={b.id} style={{background:'#fff', borderRadius:16, border:'1.5px solid #e8e0d0', padding:'18px 22px', marginBottom:12, boxShadow:'0 2px 12px rgba(0,0,0,.05)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8}}>
              <div style={{flex:1}}>
                <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
                  <span style={{fontFamily:'monospace', fontWeight:700, color:'#1a3a2a', fontSize:'.95rem'}}>{b.reference}</span>
                  <span style={{padding:'2px 10px', borderRadius:20, background: `${STATUS_COLOR[b.status]}22`, color: STATUS_COLOR[b.status], fontSize:'.72rem', fontWeight:700}}>
                    {STATUS_LABEL[b.status] || b.status}
                  </span>
                </div>
                <div style={{color:'#4a4035', fontWeight:600, marginBottom:3}}>
                  {b.trip?.from?.city || '—'} → {b.trip?.to?.city || '—'}
                </div>
                <div style={{color:'#8a7d6e', fontSize:'.82rem'}}>
                  {b.trip?.departureTime ? `${fmt(b.trip.departureTime)} · ${fmtT(b.trip.departureTime)}` : '—'}
                  {' · '} {b.trip?.agency?.name || '—'}
                </div>
                <div style={{color:'#8a7d6e', fontSize:'.78rem', marginTop:4}}>
                  Siège(s) : {b.seatNumbers?.join(', ') || '—'} · {b.passengerCount || 1} pax
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontWeight:700, color:'#007a5e', fontSize:'1.1rem', marginBottom:4}}>
                  {b.totalPrice?.toLocaleString('fr-FR')} FCFA
                </div>
                {b.validationCode && b.status !== 'CANCELLED' && (
                  <div style={{background:'#1a3a2a', color:'#fcd116', padding:'4px 12px', borderRadius:8, fontSize:'.78rem', fontFamily:'monospace', fontWeight:700, marginBottom:8}}>
                    Code : {b.validationCode}
                  </div>
                )}
                {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                  <button onClick={() => cancel(b.id)} style={{padding:'6px 14px', background:'#fef2f2', color:'#ce1126', border:'1px solid #fca5a5', borderRadius:8, cursor:'pointer', fontSize:'.78rem', fontWeight:600}}>
                    Annuler
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
