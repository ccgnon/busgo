import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchTrips, getTrip } from '../services/api';
import { useStore } from '../store';

const STATIONS = ['Yaoundé','Douala','Bafoussam','Bamenda','Ngaoundéré',
                  'Garoua','Kribi','Buea','Ebolowa','Bertoua','Maroua','Limbé'];

const PAY_METHODS = [
  { id:'mtn_momo',     label:'MTN MoMo',      color:'#FFCC02', bg:'rgba(255,204,2,.1)' },
  { id:'orange_money', label:'Orange Money',  color:'#FF6600', bg:'rgba(255,102,0,.1)' },
  { id:'card',         label:'Carte bancaire', color:'var(--c-green-300)', bg:'rgba(45,184,102,.1)' },
  { id:'paypal',       label:'PayPal',        color:'#0070BA', bg:'rgba(0,112,186,.1)' },
];

const FCFA = n => Number(n||0).toLocaleString('fr-FR') + ' FCFA';
const fmtDur = min => {
  if (!min) return '';
  const h = Math.floor(min/60), m = min%60;
  return m ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`;
};

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user, selectedTrip, selectedSeats, selectTrip, toggleSeat,
          searchParams, setSearchParams } = useStore();
  const seats = selectedSeats || [];

  const [step, setStep]             = useState(0);
  const [results, setResults]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [tripDetail, setTripDetail] = useState(null);
  const [filter, setFilter]         = useState('all');

  const { from, to, date, pax } = searchParams;

  function swapCities() {
    setSearchParams({ from: to, to: from });
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (from === to) { setError('Départ et arrivée doivent être différents'); return; }
    setLoading(true); setError(null); setResults(null);
    try {
      const data = await searchTrips(from, to, date, pax);
      setResults(data);
      setStep(0);
      selectTrip(null);
    } catch (err) {
      setError(err.error || 'Aucun résultat trouvé');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectTrip(trip) {
    selectTrip(trip); selectSeat(null); setStep(1);
    try {
      const d = await getTrip(trip.id);
      setTripDetail(d);
    } catch {
      setTripDetail(trip);
    }
  }

  function handleGoToPayment() {
    if (seats.length === 0) return;
    navigate('/payment');
  }

  let trips = results?.trips || [];
  if (filter === 'direct') trips = trips.filter(t => t.stops === 0);
  if (filter === 'cheap')  trips = [...trips].sort((a,b) => (a.unitPrice||a.price) - (b.unitPrice||b.price));
  if (filter === 'fast')   trips = [...trips].sort((a,b) => a.durationMin - b.durationMin);

  const takenSeats = tripDetail?.takenSeats || [];
  const totalSeats = tripDetail?.totalSeats || 70;

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 24px 80px' }}>

      {/* ── Hero ── */}
      <div className="fade-up" style={{ textAlign:'center', marginBottom:48 }}>
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:20 }}>
          {['var(--c-green-400)','var(--c-red-500)','var(--c-gold-400)'].map((c,i) => (
            <div key={i} style={{ width:32, height:3, background:c, borderRadius:'var(--r-full)' }}/>
          ))}
        </div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(36px,6vw,64px)', fontWeight:900, lineHeight:1.05, marginBottom:16 }}>
          Voyagez à travers le{' '}
          <span style={{
            background:'linear-gradient(135deg,var(--c-green-300),var(--c-gold-400))',
            WebkitBackgroundClip:'text',
            WebkitTextFillColor:'transparent',
          }}>Cameroun</span>
        </h1>
        <p style={{ fontSize:16, color:'var(--text-muted)', maxWidth:500, margin:'0 auto' }}>
          Réservez vos billets de bus interurbains · 12 villes · Prix en FCFA
        </p>
      </div>

      {/* ── Formulaire de recherche ── */}
      <div className="fade-up delay-1" style={{
        background:'var(--bg-card)',
        border:'1px solid var(--border-md)',
        borderRadius:'var(--r-xl)',
        padding:28,
        marginBottom:32,
        boxShadow:'var(--glow-green)',
      }}>
        {/* Indicateur étapes */}
        <div style={{ display:'flex', gap:8, marginBottom:24 }}>
          {['Rechercher','Choisir les sièges','Continuer'].map((s,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, opacity: i <= step ? 1 : .35 }}>
              <div style={{
                width:22, height:22, borderRadius:'50%',
                background: i < step ? 'var(--c-green-400)' : i === step ? 'var(--c-green-700)' : 'var(--bg-elevated)',
                border: i === step ? '2px solid var(--c-green-400)' : '1px solid var(--border-md)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, fontWeight:700,
                color: i < step ? '#fff' : i === step ? 'var(--c-green-300)' : 'var(--text-muted)',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize:12, color: i === step ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400 }}>
                {s}
              </span>
              {i < 3 && <div style={{ flex:1, minWidth:16, height:1, background:'var(--border)' }}/>}
            </div>
          ))}
        </div>

        {/* ── ÉTAPE 0 : Recherche ── */}
        {step === 0 && (
          <form onSubmit={handleSearch}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr 1fr auto', gap:12, alignItems:'end' }}>
              {/* Départ */}
              <div>
                <label style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>
                  🚩 Départ
                </label>
                <select className="input" value={from}
                  onChange={e => setSearchParams({ from: e.target.value })}>
                  {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Swap */}
              <button type="button" onClick={swapCities} style={{
                width:36, height:40, borderRadius:'var(--r-md)',
                background:'var(--bg-elevated)', border:'1px solid var(--border-md)',
                color:'var(--text-muted)', display:'flex', alignItems:'center',
                justifyContent:'center', cursor:'pointer', flexShrink:0,
                transition:'all .15s',
              }}>
                <SwapIcon/>
              </button>

              {/* Arrivée */}
              <div>
                <label style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>
                  📍 Arrivée
                </label>
                <select className="input" value={to}
                  onChange={e => setSearchParams({ to: e.target.value })}>
                  {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Date */}
              <div>
                <label style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>
                  📅 Date
                </label>
                <input type="date" className="input" value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSearchParams({ date: e.target.value })}/>
              </div>

              {/* Rechercher */}
              <button className="btn btn-primary" type="submit" disabled={loading}
                style={{ height:44, paddingLeft:20, paddingRight:20, whiteSpace:'nowrap' }}>
                {loading ? (
                  <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin 1s linear infinite' }}/>
                    Recherche…
                  </span>
                ) : (
                  <><span>Rechercher</span><ArrowIcon/></>
                )}
              </button>
            </div>

            {/* Passagers */}
            <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:12, color:'var(--text-muted)' }}>👥 Passagers :</span>
              <div style={{ display:'flex', gap:6 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setSearchParams({ pax: n })}
                    style={{
                      width:32, height:32, borderRadius:'var(--r-sm)',
                      background: pax === n ? 'var(--c-green-600)' : 'var(--bg-elevated)',
                      border: pax === n ? '1px solid var(--c-green-400)' : '1px solid var(--border)',
                      color: pax === n ? 'var(--c-green-100)' : 'var(--text-muted)',
                      fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .1s',
                    }}>{n}</button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(192,57,43,.1)', border:'1px solid rgba(192,57,43,.2)', borderRadius:'var(--r-md)', fontSize:13, color:'var(--c-red-400)' }}>
                {error}
              </div>
            )}
          </form>
        )}

        {/* ── ÉTAPE 1 : Résultats ── */}
        {step === 0 && results && (
          <div style={{ marginTop:28 }}>
            {/* Header résultats */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800 }}>
                  {results.count} trajet{results.count > 1 ? 's' : ''}
                </span>
                <span style={{ fontSize:13, color:'var(--text-muted)', marginLeft:8 }}>
                  {from} → {to} · {new Date(date+'T12:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}
                </span>
              </div>
              <div className="tabs" style={{ padding:3 }}>
                {[['all','Tous'],['direct','Direct'],['cheap','Moins cher'],['fast','Plus rapide']].map(([k,l]) => (
                  <button key={k} className={`tab ${filter===k?'active':''}`}
                    onClick={() => setFilter(k)}>{l}</button>
                ))}
              </div>
            </div>

            {trips.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px', color:'var(--text-muted)', fontSize:14 }}>
                Aucun trajet avec ce filtre
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {trips.map((trip, i) => (
                  <TripCard key={trip.id} trip={trip} index={i} onSelect={() => handleSelectTrip(trip)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ÉTAPE 1 : Sièges ── */}
        {step === 1 && selectedTrip && (
          <div className="fade-in">
            <button onClick={() => setStep(0)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:6, marginBottom:20 }}>
              ← Retour aux résultats
            </button>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:24 }}>
              {/* Plan des sièges */}
              <div>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, marginBottom:16 }}>
                  Choisissez votre siège
                </h3>
                <SeatGrid
                  total={totalSeats}
                  taken={takenSeats}
                  selected={seats}
                  maxSelect={pax}
                  onSelect={s => toggleSeat(s, pax)}
                />
                {seats.length > 0 && (
                  <div style={{ marginTop:20 }}>
                    <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:10 }}>
                      {seats.length} siège{seats.length>1?'s':''} sélectionné{seats.length>1?'s':''} : {seats.map(s=>`N°${s}`).join(', ')}
                    </div>
                    <button className="btn btn-primary" onClick={handleGoToPayment}
                      disabled={seats.length < pax}
                      style={{ opacity: seats.length < pax ? .5 : 1 }}>
                      {seats.length < pax
                        ? `Sélectionner encore ${pax - seats.length} siège${pax-seats.length>1?'s':''}`
                        : `Continuer vers le paiement →`}
                    </button>
                  </div>
                )}
              </div>
              {/* Récap trajet */}
              <div className="card" style={{ height:'fit-content' }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Récapitulatif</div>
                {[
                  ['Trajet',     `${selectedTrip.from || from} → ${selectedTrip.to || to}`],
                  ['Compagnie',  selectedTrip.company],
                  ['Départ',     selectedTrip.dep || selectedTrip.depTime],
                  ['Arrivée',    selectedTrip.arr || selectedTrip.arrTime],
                  ['Durée',      fmtDur(selectedTrip.durationMin)],
                  ['Passagers',  `${pax}`],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                    <span style={{ color:'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight:500 }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop:16, padding:'12px 14px', background:'var(--bg-elevated)', borderRadius:'var(--r-md)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>Total estimé</span>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:20, color:'var(--c-gold-400)', fontWeight:800 }}>
                    {FCFA((selectedTrip.unitPrice || selectedTrip.price) * pax + 500)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {step === 3 && (
          <ConfirmationView
            booking={useStore.getState().currentBooking}
            onNew={() => { setStep(0); setResults(null); useStore.getState().resetBookingFlow(); }}
            onMyTickets={() => navigate('/bookings')}
          />
        )}
      </div>

      {/* ── Raccourcis populaires ── */}
      {!results && step === 0 && (
        <div className="fade-up delay-2">
          <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12, textTransform:'uppercase', letterSpacing:1 }}>
            Trajets populaires
          </p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[
              ['Yaoundé','Douala'],['Douala','Bafoussam'],['Yaoundé','Kribi'],
              ['Bafoussam','Bamenda'],['Douala','Limbé'],['Yaoundé','Ngaoundéré'],
            ].map(([f,t]) => (
              <button key={f+t}
                onClick={() => { setSearchParams({ from:f, to:t }); }}
                style={{
                  padding:'7px 14px', borderRadius:'var(--r-full)',
                  background:'var(--bg-elevated)', border:'1px solid var(--border-md)',
                  color:'var(--text-secondary)', fontSize:12, cursor:'pointer',
                  transition:'all .15s',
                }}>
                {f} → {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── Composant carte trajet ── */
function TripCard({ trip, index, onSelect }) {
  const [hover, setHover] = useState(false);
  const price = trip.unitPrice || trip.price;
  const available = trip.availableSeats;
  const isLow = available <= 5;

  return (
    <div
      className={`fade-up delay-${Math.min(index+1,4)}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onSelect}
      style={{
        background: hover ? 'var(--bg-elevated)' : 'var(--bg-raised)',
        border: `1px solid ${hover ? 'var(--border-md)' : 'var(--border)'}`,
        borderRadius:'var(--r-lg)',
        padding:'18px 22px',
        cursor:'pointer',
        transition:'all .2s var(--ease)',
        transform: hover ? 'translateY(-1px)' : 'none',
        boxShadow: hover ? 'var(--glow-green)' : 'none',
        display:'grid',
        gridTemplateColumns:'1fr auto auto auto',
        alignItems:'center',
        gap:24,
      }}>

      {/* Info compagnie + horaires */}
      <div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, marginBottom:4 }}>
          {trip.company}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'var(--text-secondary)' }}>
          <span style={{ fontWeight:600, fontSize:15 }}>{trip.dep || trip.depTime}</span>
          <div style={{ flex:1, height:1, background:'var(--border-md)', position:'relative', minWidth:40 }}>
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:9, color:'var(--text-muted)', background:'var(--bg-raised)', padding:'0 4px' }}>
              {trip.durationMin ? fmtDur(trip.durationMin) : '—'}
            </div>
          </div>
          <span style={{ fontWeight:600, fontSize:15 }}>{trip.arr || trip.arrTime}</span>
          {trip.stops === 0 && <span className="badge badge-green">Direct</span>}
        </div>
        {trip.amenities?.length > 0 && (
          <div style={{ display:'flex', gap:6, marginTop:8 }}>
            {trip.amenities.map(a => (
              <span key={a} style={{ fontSize:11, color:'var(--text-muted)', padding:'2px 8px', background:'var(--bg-elevated)', borderRadius:'var(--r-full)', border:'1px solid var(--border)' }}>
                {a === 'ac' ? '❄️' : a === 'wifi' ? '📶' : a === 'usb' ? '🔌' : a}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Note */}
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:13, color:'var(--c-gold-400)', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}>
          ★ {trip.rating?.toFixed(1) || '4.0'}
        </div>
        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{trip.ratingCount || 0} avis</div>
      </div>

      {/* Places */}
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:13, fontWeight:600, color: isLow ? 'var(--c-red-400)' : 'var(--text-secondary)' }}>
          {available} place{available > 1 ? 's' : ''}
        </div>
        {isLow && <div style={{ fontSize:11, color:'var(--c-red-400)' }}>Presque complet</div>}
      </div>

      {/* Prix + bouton */}
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, color:'var(--c-gold-400)' }}>
          {Number(price).toLocaleString('fr-FR')}
        </div>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:10 }}>FCFA / pers.</div>
        <button className="btn btn-primary" style={{ fontSize:12, padding:'8px 16px' }}>
          Choisir
        </button>
      </div>
    </div>
  );
}

/* ── Grille des sièges ── */
function SeatGrid({ total, taken, selected = [], maxSelect = 1, onSelect }) {
  const rows = [];
  for (let i = 0; i < total; i += 4) {
    rows.push([i+1, i+2, null, i+3, i+4].filter(n => n === null || n <= total));
  }

  return (
    <div>
      <div style={{ display:'flex', gap:16, marginBottom:16, fontSize:12 }}>
        {[['var(--bg-elevated)','Disponible'],['var(--c-green-600)','Sélectionné'],['var(--bg-raised)','Occupé']].map(([bg,l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:16, height:16, borderRadius:4, background:bg, border:'1px solid var(--border-md)' }}/>
            <span style={{ color:'var(--text-muted)' }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Bus shape */}
      <div style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'24px 32px', maxWidth:320 }}>
        {/* Chauffeur */}
        <div style={{ textAlign:'center', marginBottom:16, fontSize:12, color:'var(--text-muted)', borderBottom:'1px solid var(--border)', paddingBottom:12 }}>
          🧑‍✈️ Chauffeur
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display:'flex', gap:6, justifyContent:'center' }}>
              {row.map((n, ci) => n === null ? (
                <div key={`gap-${ci}`} style={{ width:32, height:32 }}/>
              ) : (
                <button key={n} type="button"
                  disabled={taken.includes(n)}
                  onClick={() => onSelect(n)}
                  style={{
                    width:32, height:32,
                    borderRadius:6,
                    border: (Array.isArray(selected)?selected:selected?[selected]:[]).includes(n) ? '2px solid var(--c-green-400)' : '1px solid var(--border-md)',
                    background: taken.includes(n) ? 'var(--bg)' : (Array.isArray(selected)?selected:selected?[selected]:[]).includes(n) ? 'var(--c-green-600)' : 'var(--bg-elevated)',
                    color: taken.includes(n) ? 'var(--border-md)' : (Array.isArray(selected)?selected:selected?[selected]:[]).includes(n) ? 'var(--c-green-100)' : 'var(--text-muted)',
                    fontSize:10, fontWeight:600,
                    cursor: taken.includes(n) ? 'not-allowed' : 'pointer',
                    transition:'all .1s',
                  }}>
                  {n}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Confirmation ── */
function ConfirmationView({ booking, onNew, onMyTickets }) {
  if (!booking) return null;
  return (
    <div className="fade-in" style={{ textAlign:'center', padding:'20px 0' }}>
      <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--c-green-700)', border:'2px solid var(--c-green-400)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 20px', animation:'pulse-ring 2s infinite' }}>
        ✓
      </div>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, marginBottom:8 }}>
        Réservation confirmée !
      </h2>
      <p style={{ color:'var(--text-muted)', marginBottom:28 }}>
        Votre billet a été généré. Présentez le code ci-dessous au contrôleur.
      </p>

      <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-md)', borderRadius:'var(--r-xl)', padding:'28px', maxWidth:380, margin:'0 auto 28px', display:'inline-block', width:'100%' }}>
        <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Référence</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:700, color:'var(--c-green-300)', letterSpacing:2, marginBottom:20 }}>
          {booking.id}
        </div>
        <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Code de validation</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:36, fontWeight:700, color:'var(--c-gold-400)', letterSpacing:8 }}>
          {booking.validationCode}
        </div>
        {booking.loyaltyEarned > 0 && (
          <div style={{ marginTop:20, padding:'10px', background:'rgba(232,160,32,.1)', border:'1px solid rgba(232,160,32,.2)', borderRadius:'var(--r-md)', fontSize:13, color:'var(--c-gold-300)' }}>
            🏆 +{booking.loyaltyEarned} points fidélité gagnés !
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
        <button className="btn btn-primary" onClick={onMyTickets}>Voir mes billets</button>
        <button className="btn btn-ghost" onClick={onNew}>Nouvelle recherche</button>
      </div>
    </div>
  );
}
