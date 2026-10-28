import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';

const CITY = { YDE:'Yaoundé', DLA:'Douala', BFT:'Bafoussam', NGD:'Ngaoundéré', LIM:'Limbé', BUE:'Buéa', EDO:'Ébolowa', BSG:'Bertoua', GAR:'Garoua', MRU:'Maroua', BAM:'Bamenda', KMB:'Kumba' };
const STATIONS = Object.entries(CITY).map(([id, city]) => ({ id, label: city }));

export default function Search() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [sortBy, setSortBy] = useState('departure'); // departure | price | duration

  const from = params.get('from') || '';
  const to   = params.get('to')   || '';
  const date = params.get('date') || '';
  const pax  = params.get('pax')  || '1';

  useEffect(() => {
    if (!from || !to) { setLoading(false); return; }
    setLoading(true); setErr('');
    api.get('/api/trips/search', { params: { from, to, date, pax } })
      .then(r => setTrips(r.data.trips || r.data || []))
      .catch(() => setErr('Erreur lors de la recherche. Vérifiez votre connexion.'))
      .finally(() => setLoading(false));
  }, [from, to, date, pax]);

  const sorted = [...trips].sort((a, b) => {
    if (sortBy === 'price') return (a.price||0) - (b.price||0);
    if (sortBy === 'duration') return (a.durationMinutes||0) - (b.durationMinutes||0);
    return new Date(a.departureTime) - new Date(b.departureTime);
  });

  const fmt = d => new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  const fmtDate = d => new Date(d+'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
  const duration = m => m ? `${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}` : '—';

  return (
    <div style={{ minHeight:'100vh', background:'#f0ece4', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <Navbar />

      {/* ── Top bar ── */}
      <div style={{ background:'linear-gradient(135deg,#1a3a2a,#2d5c3f)', paddingTop:64 }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'28px clamp(16px,4vw,32px) 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <Link to="/" style={{ color:'#fcd116', textDecoration:'none', fontWeight:700, fontSize:'1.1rem' }}>🚌 busGO</Link>
            <span style={{ color:'rgba(255,255,255,.3)', fontSize:'1.2rem' }}>›</span>
            <span style={{ color:'#fff', fontSize:'.9rem', fontWeight:600 }}>
              {CITY[from]||from} → {CITY[to]||to}
            </span>
            {date && <span style={{ color:'rgba(255,255,255,.55)', fontSize:'.85rem' }}>· {fmtDate(date)}</span>}
            <span style={{ color:'rgba(255,255,255,.55)', fontSize:'.85rem' }}>· {pax} passager{pax>1?'s':''}</span>
          </div>

          {/* Quick modify form */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:8, marginTop:16, flexWrap:'wrap' }}>
            {[
              { label:'Départ', val:from, key:'from', type:'select' },
              { label:'Arrivée', val:to, key:'to', type:'select' },
              { label:'Date', val:date, key:'date', type:'date' },
              { label:'Pax', val:pax, key:'pax', type:'pax' },
            ].map(({ label, val, key, type }) => (
              <div key={key}>
                <div style={{ color:'rgba(255,255,255,.55)', fontSize:'.65rem', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
                {type === 'select' ? (
                  <select value={val} onChange={e => { const p = new URLSearchParams(params); p.set(key, e.target.value); setParams(p); }}
                    style={{ width:'100%', padding:'8px 10px', borderRadius:9, border:'none', background:'rgba(255,255,255,.12)', color:'#fff', fontSize:'.85rem', fontWeight:600, outline:'none', cursor:'pointer' }}>
                    {STATIONS.map(s => <option key={s.id} value={s.id} style={{ color:'#000' }}>{s.label}</option>)}
                  </select>
                ) : type === 'date' ? (
                  <input type="date" value={val} onChange={e => { const p = new URLSearchParams(params); p.set(key, e.target.value); setParams(p); }}
                    style={{ width:'100%', padding:'8px 10px', borderRadius:9, border:'none', background:'rgba(255,255,255,.12)', color:'#fff', fontSize:'.85rem', fontWeight:600, outline:'none', colorScheme:'dark' }} />
                ) : (
                  <select value={val} onChange={e => { const p = new URLSearchParams(params); p.set(key, e.target.value); setParams(p); }}
                    style={{ width:'100%', padding:'8px 10px', borderRadius:9, border:'none', background:'rgba(255,255,255,.12)', color:'#fff', fontSize:'.85rem', fontWeight:600, outline:'none', cursor:'pointer' }}>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n} style={{ color:'#000' }}>{n}</option>)}
                  </select>
                )}
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'flex-end' }}>
              <button onClick={() => { setLoading(true); /* trigger refetch */ }}
                style={{ padding:'9px 18px', background:'#fcd116', color:'#1a3a2a', border:'none', borderRadius:9, fontWeight:800, cursor:'pointer', fontSize:'.85rem', whiteSpace:'nowrap' }}>
                🔍 Chercher
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px clamp(16px,4vw,32px)' }}>

        {/* Sort & count */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <p style={{ color:'#6b5d4f', fontSize:'.9rem', margin:0, fontWeight:600 }}>
            {loading ? 'Recherche en cours…' : err ? '' : `${trips.length} voyage${trips.length>1?'s':''} disponible${trips.length>1?'s':''}`}
          </p>
          {!loading && trips.length > 0 && (
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <span style={{ fontSize:'.78rem', color:'#8a7d6e' }}>Trier :</span>
              {[['departure','Horaire'],['price','Prix'],['duration','Durée']].map(([val, lbl]) => (
                <button key={val} onClick={() => setSortBy(val)}
                  style={{ padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:'.78rem', fontWeight:700, background: sortBy===val ? '#007a5e' : '#e8e0d0', color: sortBy===val ? '#fff' : '#6b5d4f' }}>
                  {lbl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ width:48, height:48, border:'4px solid #e8e0d0', borderTopColor:'#007a5e', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 16px' }} />
            <p style={{ color:'#8a7d6e' }}>Recherche des voyages…</p>
          </div>
        )}

        {/* Error */}
        {!loading && err && (
          <div style={{ background:'#fef2f2', border:'1.5px solid #fca5a5', color:'#b91c1c', padding:'16px 20px', borderRadius:14, display:'flex', alignItems:'center', gap:10 }}>
            ⚠️ {err}
          </div>
        )}

        {/* Empty */}
        {!loading && !err && trips.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:20, border:'1.5px solid #e8e0d0', boxShadow:'0 2px 12px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:20 }}>🔍</div>
            <h3 style={{ color:'#1a3a2a', marginBottom:10, fontFamily:'Georgia,serif', fontSize:'1.4rem' }}>Aucun voyage trouvé</h3>
            <p style={{ color:'#8a7d6e', marginBottom:28, maxWidth:340, margin:'0 auto 28px' }}>Aucun trajet disponible pour cette date. Essayez un autre jour ou d'autres villes.</p>
            <Link to="/" style={{ padding:'12px 28px', background:'#007a5e', color:'#fff', borderRadius:12, textDecoration:'none', fontWeight:700 }}>← Nouvelle recherche</Link>
          </div>
        )}

        {/* Trip cards */}
        {sorted.map((trip, i) => {
          const seats = trip.availableSeats ?? trip.totalSeats;
          const isLow = seats > 0 && seats <= 5;
          const isFull = seats < 1;
          return (
            <div key={trip.id} style={{ background:'#fff', borderRadius:18, border:'1.5px solid #e8e0d0', marginBottom:14, overflow:'hidden', boxShadow:'0 2px 14px rgba(0,0,0,.05)', transition:'box-shadow .2s, transform .2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 28px rgba(0,0,0,.1)'; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 14px rgba(0,0,0,.05)'; e.currentTarget.style.transform='translateY(0)'; }}>

              {/* Top bar — agency */}
              <div style={{ padding:'12px 20px', borderBottom:'1px solid #f0ece4', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fafaf8' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#007a5e,#00a87d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.9rem' }}>🚌</div>
                  <div>
                    <div style={{ fontWeight:700, color:'#1a3a2a', fontSize:'.92rem' }}>{trip.agency?.name || 'Agence'}</div>
                    <div style={{ fontSize:'.72rem', color:'#8a7d6e' }}>{trip.busType || 'Confort'} {trip.busNumber ? '· '+trip.busNumber : ''}</div>
                  </div>
                </div>
                {i === 0 && trips.length > 1 && (
                  <span style={{ background:'rgba(0,122,94,.12)', color:'#007a5e', fontSize:'.7rem', fontWeight:800, padding:'3px 10px', borderRadius:50, letterSpacing:'.06em', textTransform:'uppercase' }}>
                    Meilleur prix
                  </span>
                )}
                {isLow && <span style={{ background:'rgba(206,17,38,.1)', color:'#ce1126', fontSize:'.7rem', fontWeight:800, padding:'3px 10px', borderRadius:50 }}>⚡ Plus que {seats} place{seats>1?'s':''}</span>}
              </div>

              {/* Main content */}
              <div style={{ padding:'20px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                {/* Departure */}
                <div style={{ textAlign:'center', minWidth:80 }}>
                  <div style={{ fontSize:'2rem', fontWeight:800, color:'#1a3a2a', letterSpacing:'-.02em' }}>{fmt(trip.departureTime)}</div>
                  <div style={{ fontSize:'.78rem', color:'#8a7d6e', fontWeight:600 }}>{CITY[trip.from?.code]||from}</div>
                </div>

                {/* Route line */}
                <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5, minWidth:80 }}>
                  <div style={{ fontSize:'.72rem', color:'#8a7d6e', fontWeight:600 }}>{duration(trip.durationMinutes)}</div>
                  <div style={{ position:'relative', width:'100%', height:4, background:'#f0ece4', borderRadius:4 }}>
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,#007a5e,#fcd116)', borderRadius:4 }} />
                    <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:14, height:14, borderRadius:'50%', background:'#fff', border:'3px solid #007a5e', boxShadow:'0 1px 4px rgba(0,0,0,.1)' }} />
                  </div>
                  <div style={{ fontSize:'.68rem', color: isLow ? '#ce1126' : isFull ? '#9ca3af' : '#007a5e', fontWeight:700 }}>
                    {isFull ? 'Complet' : `${seats} place${seats>1?'s':''} dispo.`}
                  </div>
                </div>

                {/* Arrival */}
                <div style={{ textAlign:'center', minWidth:80 }}>
                  <div style={{ fontSize:'2rem', fontWeight:800, color:'#1a3a2a', letterSpacing:'-.02em' }}>{fmt(trip.arrivalTime)}</div>
                  <div style={{ fontSize:'.78rem', color:'#8a7d6e', fontWeight:600 }}>{CITY[trip.to?.code]||to}</div>
                </div>

                {/* Price & CTA */}
                <div style={{ textAlign:'right', minWidth:130, marginLeft:'auto' }}>
                  <div style={{ fontSize:'1.6rem', fontWeight:800, color:'#007a5e', letterSpacing:'-.02em' }}>
                    {(trip.price * parseInt(pax)).toLocaleString('fr-FR')}
                  </div>
                  <div style={{ fontSize:'.73rem', color:'#8a7d6e', marginBottom:12 }}>
                    FCFA {parseInt(pax)>1 ? `(${trip.price?.toLocaleString('fr-FR')} × ${pax})` : 'par personne'}
                  </div>
                  <button onClick={() => navigate(`/book/${trip.id}?pax=${pax}`)}
                    disabled={isFull}
                    style={{ padding:'10px 22px', background: isFull ? '#d1d5db' : 'linear-gradient(135deg,#007a5e,#00a87d)', color:'#fff', border:'none', borderRadius:11, fontWeight:800, cursor: isFull ? 'not-allowed' : 'pointer', fontSize:'.88rem', boxShadow: isFull ? 'none' : '0 3px 12px rgba(0,122,94,.35)', width:'100%' }}>
                    {isFull ? 'Complet' : 'Réserver →'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        * { box-sizing:border-box }
      `}</style>
    </div>
  );
}
