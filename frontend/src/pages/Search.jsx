import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const CITY = { YDE:'Yaoundé', DLA:'Douala', BFT:'Bafoussam', NGD:'Ngaoundéré', LIM:'Limbé', BUE:'Buéa', EDO:'Ébolowa', BSG:'Bertoua' };

export default function Search() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const from = params.get('from') || '';
  const to   = params.get('to')   || '';
  const date = params.get('date') || '';
  const pax  = params.get('pax')  || '1';

  useEffect(() => {
    if (!from || !to) { setLoading(false); return; }
    setLoading(true); setErr('');
    axios.get('/api/trips/search', { params: { from, to, date, pax } })
      .then(r => setTrips(r.data.trips || r.data || []))
      .catch(() => setErr('Erreur lors de la recherche. Vérifiez votre connexion.'))
      .finally(() => setLoading(false));
  }, [from, to, date, pax]);

  const fmt = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });

  const cardStyle = {
    background:'#fff', borderRadius:16, border:'1.5px solid #e8e0d0',
    padding:'20px 24px', marginBottom:12,
    boxShadow:'0 2px 12px rgba(0,0,0,.06)', transition:'box-shadow .2s',
    display:'flex', alignItems:'center', justifyContent:'space-between', gap:16,
    flexWrap:'wrap'
  };

  return (
    <div style={{minHeight:'100vh', background:'#f5f0e8'}}>
      {/* Header */}
      <div style={{background:'#1a3a2a', color:'#fff', padding:'16px 24px', display:'flex', alignItems:'center', gap:16}}>
        <Link to="/" style={{color:'#fcd116', textDecoration:'none', fontWeight:700, fontSize:'1.2rem'}}>🚌 busGO</Link>
        <span style={{color:'rgba(255,255,255,.4)'}}>›</span>
        <span style={{fontSize:'.9rem', opacity:.8}}>
          {CITY[from] || from} → {CITY[to] || to} · {date ? fmtDate(date+'T12:00:00') : ''} · {pax} pax
        </span>
      </div>

      <div style={{maxWidth:780, margin:'0 auto', padding:'28px 16px'}}>
        <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.5rem', color:'#1a3a2a', marginBottom:6}}>
          Voyages disponibles
        </h2>
        <p style={{color:'#8a7d6e', fontSize:'.88rem', marginBottom:24}}>
          {loading ? 'Recherche en cours…' : err ? err : `${trips.length} voyage(s) trouvé(s)`}
        </p>

        {loading && (
          <div style={{textAlign:'center', padding:'48px 0', color:'#8a7d6e'}}>
            <div style={{fontSize:'2rem', marginBottom:12, animation:'spin 1s linear infinite', display:'inline-block'}}>⏳</div>
            <p>Recherche des voyages…</p>
          </div>
        )}

        {!loading && !err && trips.length === 0 && (
          <div style={{textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:16, border:'1.5px solid #e8e0d0'}}>
            <div style={{fontSize:'3rem', marginBottom:16}}>🔍</div>
            <h3 style={{color:'#1a3a2a', marginBottom:8}}>Aucun voyage trouvé</h3>
            <p style={{color:'#8a7d6e', marginBottom:20}}>Essayez une autre date ou d'autres villes.</p>
            <Link to="/" style={{padding:'10px 24px', background:'#007a5e', color:'#fff', borderRadius:10, textDecoration:'none', fontWeight:600}}>Nouvelle recherche</Link>
          </div>
        )}

        {trips.map(trip => (
          <div key={trip.id} style={cardStyle}>
            {/* Agency */}
            <div style={{minWidth:120}}>
              <div style={{fontWeight:700, color:'#1a3a2a', fontSize:'.95rem'}}>{trip.agency?.name || 'Agency'}</div>
              <div style={{fontSize:'.75rem', color:'#8a7d6e', marginTop:2}}>🚌 {trip.busType || 'Confort'} · {trip.busNumber || ''}</div>
            </div>
            {/* Times */}
            <div style={{display:'flex', alignItems:'center', gap:12, flex:1, justifyContent:'center'}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:'1.5rem', fontWeight:700, color:'#1a3a2a'}}>{fmt(trip.departureTime)}</div>
                <div style={{fontSize:'.75rem', color:'#8a7d6e'}}>{CITY[trip.from?.code] || trip.from?.city || from}</div>
              </div>
              <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
                <div style={{fontSize:'.72rem', color:'#8a7d6e'}}>
                  {trip.durationMinutes ? `${Math.floor(trip.durationMinutes/60)}h${String(trip.durationMinutes%60).padStart(2,'0')}` : '—'}
                </div>
                <div style={{height:2, background:'linear-gradient(to right,#007a5e,#fcd116)', width:'100%', borderRadius:2}}/>
                <div style={{fontSize:'.65rem', color:'#8a7d6e'}}>{trip.availableSeats} places</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:'1.5rem', fontWeight:700, color:'#1a3a2a'}}>{fmt(trip.arrivalTime)}</div>
                <div style={{fontSize:'.75rem', color:'#8a7d6e'}}>{CITY[trip.to?.code] || trip.to?.city || to}</div>
              </div>
            </div>
            {/* Price & CTA */}
            <div style={{textAlign:'right', minWidth:120}}>
              <div style={{fontSize:'1.4rem', fontWeight:700, color:'#007a5e'}}>{trip.price?.toLocaleString('fr-FR')} FCFA</div>
              <div style={{fontSize:'.72rem', color:'#8a7d6e', marginBottom:10}}>par personne</div>
              <button
                onClick={() => navigate(`/book/${trip.id}?pax=${pax}`)}
                disabled={trip.availableSeats < 1}
                style={{padding:'9px 20px', background: trip.availableSeats > 0 ? '#007a5e' : '#ccc', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor: trip.availableSeats > 0 ? 'pointer' : 'not-allowed', fontSize:'.85rem'}}
              >
                {trip.availableSeats > 0 ? 'Réserver →' : 'Complet'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
