import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchTrips, getTrip, createBooking } from '../services/api';
import { useStore } from '../store';
import StepIndicator from '../components/StepIndicator';
import SeatMap from '../components/SeatMap';

const STATIONS = ['Yaoundé','Douala','Bafoussam','Bamenda','Ngaoundéré','Garoua','Kribi','Buea','Ebolowa','Bertoua','Maroua','Limbé'];
const PAY_METHODS = [
  { id: 'mtn_momo',     icon: '🟡', label: 'MTN MoMo' },
  { id: 'orange_money', icon: '🟠', label: 'Orange Money' },
  { id: 'card',         icon: '💳', label: 'Carte bancaire' },
  { id: 'paypal',       icon: '🅿️', label: 'PayPal' },
];

function fmtFCFA(n) {
  return Number(n).toLocaleString('fr-FR') + ' FCFA';
}
function fmtDur(min) {
  const h = Math.floor(min/60), m = min%60;
  return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`;
}

/* ── Étoile camerounaise SVG ── */
function CMStar({ size = 14, color = '#f5c842' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { selectedTrip, selectedSeat, selectTrip, selectSeat, setCurrentBooking, searchParams, setSearchParams, currentBooking } = useStore();

  const [step, setStep] = useState(0);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [tripDetail, setTripDetail] = useState(null);
  const [payMethod, setPayMethod] = useState('card');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  const { from, to, date, pax } = searchParams;

  async function handleSearch(e) {
    e.preventDefault();
    if (from === to) { setError('Départ et arrivée doivent être différents'); return; }
    setLoading(true); setError(null);
    try {
      const data = await searchTrips(from, to, date, pax);
      setResults(data); setStep(0); selectTrip(null);
    } catch (err) { setError(err.error || 'Erreur lors de la recherche'); }
    finally { setLoading(false); }
  }

  async function handleSelectTrip(trip) {
    selectTrip(trip); selectSeat(null); setStep(1);
    try { const d = await getTrip(trip.id); setTripDetail(d); }
    catch { setTripDetail(trip); }
  }

  async function handlePay(e) {
    e.preventDefault();
    if (!selectedSeat) { setBookingError('Veuillez sélectionner un siège'); return; }
    setBookingLoading(true); setBookingError(null);
    try {
      const res = await createBooking({ tripId: selectedTrip.id, seat: selectedSeat, pax, paymentMethod: payMethod, date });
      setCurrentBooking(res.booking); setStep(3);
    } catch (err) { setBookingError(err.error || 'Erreur lors du paiement'); }
    finally { setBookingLoading(false); }
  }

  let filtered = results?.trips || [];
  if (filter === 'direct') filtered = filtered.filter(t => t.stops === 0);
  if (filter === 'cheap')  filtered = [...filtered].sort((a, b) => a.unitPrice - b.unitPrice);
  if (filter === 'fast')   filtered = [...filtered].sort((a, b) => (a.dur||a.durationMin) - (b.dur||b.durationMin));

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 1 }}>

      {/* ── Hero banner ── */}
      {!results && (
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          {/* Bande drapeau décorative */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
            {['var(--green)', 'var(--red)', 'var(--gold)'].map((c, i) => (
              <div key={i} style={{ width: 40, height: 4, background: c, borderRadius: 99 }} />
            ))}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 12,
          }}>
            Voyagez à travers le<br />
            <span style={{
              background: 'linear-gradient(90deg, var(--green-light), var(--gold))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>🇨🇲 Cameroun</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
            Réservez vos billets de bus interurbains en toute simplicité.<br />
            12 villes · 10 compagnies · Prix en FCFA
          </p>
          {/* Villes populaires */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 20 }}>
            {['Yaoundé → Douala', 'Douala → Bafoussam', 'Yaoundé → Kribi', 'Bafoussam → Bamenda'].map(r => (
              <button key={r} onClick={() => {
                const [f, t] = r.split(' → ');
                setSearchParams({ from: f, to: t });
              }} style={{
                padding: '6px 14px', borderRadius: 99,
                border: '1px solid var(--border2)',
                background: 'var(--surface)', color: 'var(--text2)',
                fontSize: 13, cursor: 'pointer',
                transition: '.2s',
              }}>
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      <StepIndicator current={step} />

      <div style={{ display: 'grid', gridTemplateColumns: results ? '1fr 380px' : '1fr', gap: 24, alignItems: 'start' }}>

        {/* ══ LEFT ══ */}
        <div>
          {/* Formulaire de recherche */}
          <div style={{
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
            border: '1px solid var(--border2)',
            borderRadius: 'var(--radius-xl)',
            padding: 24,
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Décoration coin */}
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 120, height: 120,
              background: 'radial-gradient(circle, var(--green-glow) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <CMStar size={16} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text2)' }}>
                Rechercher un trajet
              </span>
            </div>

            <form onSubmit={handleSearch}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
                {[['from','🏁 Départ'],['to','📍 Arrivée']].map(([k, lbl]) => (
                  <div key={k}>
                    <label style={labelStyle}>{lbl}</label>
                    <select value={searchParams[k]} onChange={e => setSearchParams({ [k]: e.target.value })} style={selectStyle}>
                      {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>📅 Date</label>
                  <input type="date" value={date} onChange={e => setSearchParams({ date: e.target.value })} style={selectStyle} />
                </div>
                <button type="submit" disabled={loading} style={{
                  background: loading ? 'var(--border2)' : 'linear-gradient(135deg, var(--green-mid), var(--green-light))',
                  color: '#fff', border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '0 24px', height: 44,
                  fontSize: 14, fontWeight: 700,
                  whiteSpace: 'nowrap',
                  transition: '.2s',
                  boxShadow: loading ? 'none' : '0 4px 16px var(--green-glow)',
                }}>
                  {loading ? '⏳' : '🔍 Rechercher'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
                <label style={{ fontSize: 13, color: 'var(--muted)' }}>👥 Passagers :</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setSearchParams({ pax: n })} style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: `1.5px solid ${pax === n ? 'var(--gold)' : 'var(--border)'}`,
                      background: pax === n ? 'var(--gold-glow)' : 'transparent',
                      color: pax === n ? 'var(--gold)' : 'var(--muted)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>{n}</button>
                  ))}
                </div>
              </div>
              {error && <div style={{ marginTop: 10, color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
            </form>
          </div>

          {/* Résultats */}
          {results && (
            <div className="fade-in">
              {/* Header résultats */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>
                    {from} <span style={{ color: 'var(--gold)' }}>→</span> {to}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                    {new Date(date + 'T12:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })} · {pax} passager{pax>1?'s':''}
                  </div>
                </div>
                <div style={{
                  background: 'var(--green-glow)', color: 'var(--green-light)',
                  border: '1px solid var(--border2)',
                  padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                }}>
                  {results.count} trajet{results.count > 1 ? 's' : ''}
                </div>
              </div>

              {/* Filtres */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {[['all','Tous'],['direct','Direct'],['cheap','Moins cher'],['fast','Plus rapide']].map(([k,l]) => (
                  <button key={k} onClick={() => setFilter(k)} style={{
                    padding: '6px 16px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
                    border: `1.5px solid ${filter===k ? 'var(--gold)' : 'var(--border)'}`,
                    background: filter===k ? 'var(--gold-glow)' : 'transparent',
                    color: filter===k ? 'var(--gold)' : 'var(--muted)',
                    fontWeight: filter===k ? 600 : 400,
                    transition: '.15s',
                  }}>{l}</button>
                ))}
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign:'center', color:'var(--muted)', padding:'48px 0', fontSize:14 }}>Aucun trajet pour ce filtre.</div>
              )}

              {/* Cartes trajets */}
              {filtered.map((trip, idx) => {
                const isSelected = selectedTrip?.id === trip.id;
                const dur = trip.dur || trip.durationMin;
                return (
                  <div key={trip.id}
                    className={idx === 0 ? 'fade-in' : ''}
                    onClick={() => handleSelectTrip(trip)}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(35,144,79,.12), rgba(232,160,32,.06))'
                        : 'var(--surface)',
                      border: `1.5px solid ${isSelected ? 'var(--green-mid)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      marginBottom: 12,
                      cursor: 'pointer',
                      transition: '.2s',
                      boxShadow: isSelected ? '0 0 24px var(--green-glow)' : 'none',
                    }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
                      <div>
                        {/* Horaires */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{trip.dep || trip.depTime}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{from}</div>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{fmtDur(dur)}</div>
                            <div style={{ position: 'relative', height: 2, background: 'var(--border)' }}>
                              <div style={{
                                position: 'absolute', left: '50%', top: '50%',
                                transform: 'translate(-50%,-50%)',
                                background: 'var(--bg)',
                                padding: '0 4px',
                              }}>
                                <CMStar size={10} color={isSelected ? 'var(--gold)' : 'var(--border2)'} />
                              </div>
                            </div>
                            {trip.stops > 0 && (
                              <div style={{ fontSize: 10, color: 'var(--warn)', marginTop: 4 }}>{trip.stops} arrêt{trip.stops>1?'s':''}</div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{trip.arr || trip.arrTime}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{to}</div>
                          </div>
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={badge('var(--green-glow)', 'var(--green-light)')}>{trip.company}</span>
                          <span style={badge(trip.stops===0 ? 'rgba(45,184,102,.12)' : 'rgba(232,160,32,.12)', trip.stops===0 ? 'var(--success)' : 'var(--warn)')}>
                            {trip.stops===0 ? '✓ Direct' : `${trip.stops} arrêt${trip.stops>1?'s':''}`}
                          </span>
                          <span style={badge('rgba(255,255,255,.04)', 'var(--muted)')}>{trip.availableSeats} sièges libres</span>
                          {trip.amenities?.includes('wifi') && <span style={badge('rgba(255,255,255,.04)', 'var(--muted)')}>📶 WiFi</span>}
                          {trip.amenities?.includes('ac') && <span style={badge('rgba(255,255,255,.04)', 'var(--muted)')}>❄️ Clim</span>}
                        </div>
                      </div>

                      {/* Prix */}
                      <div style={{ textAlign: 'right', minWidth: 120 }}>
                        <div style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 22, fontWeight: 900,
                          color: 'var(--gold)',
                          lineHeight: 1,
                        }}>
                          {fmtFCFA(trip.unitPrice * pax)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                          {pax > 1 ? `${fmtFCFA(trip.unitPrice)}/pers.` : 'par personne'}
                        </div>
                        <div style={{
                          display: 'inline-block', marginTop: 10,
                          background: isSelected
                            ? 'linear-gradient(135deg,var(--green-mid),var(--green-light))'
                            : 'var(--surface2)',
                          color: isSelected ? '#fff' : 'var(--text2)',
                          border: `1px solid ${isSelected ? 'transparent' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 16px', fontSize: 13, fontWeight: 700,
                          transition: '.2s',
                        }}>
                          {isSelected ? '✓ Sélectionné' : 'Choisir →'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* État vide */}
          {!results && !loading && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16, opacity: .25 }}>🚌</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                Où souhaitez-vous voyager ?
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>Renseignez votre trajet et lancez la recherche</div>
              {/* Carte Cameroun stylisée */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32, flexWrap: 'wrap',
              }}>
                {STATIONS.map(s => (
                  <div key={s} style={{
                    padding: '4px 12px', borderRadius: 99,
                    border: '1px solid var(--border)',
                    fontSize: 12, color: 'var(--muted)',
                    background: 'var(--surface)',
                  }}>{s}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT — panneau récapitulatif ══ */}
        {results && (
          <div style={{ position: 'sticky', top: 80 }} className="slide-in">
            {!selectedTrip ? (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: '40px 24px',
                textAlign: 'center',
                color: 'var(--muted)',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: .25 }}>🎫</div>
                <div style={{ fontSize: 14 }}>Sélectionnez un trajet pour continuer</div>
              </div>

            ) : step === 3 && currentBooking ? (
              /* ── CONFIRMATION ── */
              <div className="fade-in" style={{
                background: 'linear-gradient(160deg, var(--surface) 0%, var(--surface2) 100%)',
                border: '1px solid var(--green-mid)',
                borderRadius: 'var(--radius-xl)',
                padding: 24,
                textAlign: 'center',
                boxShadow: '0 0 40px var(--green-glow)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 12 }}>
                  {[0,1,2].map(i => <CMStar key={i} size={18} color="var(--gold)" />)}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, marginBottom: 6, color: 'var(--green-light)' }}>
                  Réservation confirmée !
                </div>
                {/* Billet */}
                <div style={{
                  background: 'var(--bg)',
                  border: '1px dashed var(--border2)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 20, margin: '16px 0',
                }}>
                  <div className="flag-stripe" style={{ marginBottom: 14 }} />
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 28, fontWeight: 900,
                    color: 'var(--gold)',
                    letterSpacing: 2,
                    marginBottom: 14,
                  }}>
                    {currentBooking.id}
                  </div>
                  {/* Barcode décoratif */}
                  <div style={{
                    height: 40, width: '80%', margin: '0 auto 14px',
                    background: 'repeating-linear-gradient(90deg,var(--text) 0,var(--text) 2px,transparent 2px,transparent 5px)',
                    borderRadius: 3, opacity: .5,
                  }} />
                  {[
                    ['Trajet', `${currentBooking.trip?.from || from} → ${currentBooking.trip?.to || to}`],
                    ['Compagnie', currentBooking.trip?.company || selectedTrip?.company],
                    ['Départ', currentBooking.trip?.dep || selectedTrip?.dep],
                    ['Siège', `N° ${currentBooking.seat}`],
                    ['Passagers', currentBooking.pax],
                    ['Total', fmtFCFA(currentBooking.totalPrice)],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ color:'var(--muted)' }}>{k}</span>
                      <span style={{ fontWeight:600, color: k==='Total' ? 'var(--gold)' : 'var(--text)' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/bookings')} style={{
                  width: '100%', background: 'linear-gradient(135deg,var(--green-mid),var(--green-light))',
                  color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                  padding: 14, fontWeight: 700, fontSize: 14,
                  boxShadow: '0 4px 20px var(--green-glow)',
                }}>
                  Voir mes billets 🎫
                </button>
              </div>

            ) : (
              /* ── RÉCAP + SIÈGE + PAIEMENT ── */
              <div className="fade-in">
                {/* Récap trajet */}
                <div style={{
                  background: 'linear-gradient(135deg,var(--surface),var(--surface2))',
                  border: '1px solid var(--border2)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 20, marginBottom: 14,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14 }}>
                    <CMStar size={14} />
                    <span style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700 }}>{from} → {to}</span>
                  </div>
                  {[
                    ['Départ', selectedTrip.dep || selectedTrip.depTime],
                    ['Arrivée', selectedTrip.arr || selectedTrip.arrTime],
                    ['Durée', fmtDur(selectedTrip.dur || selectedTrip.durationMin)],
                    ['Compagnie', selectedTrip.company],
                    ['Passagers', pax],
                    ['Siège', selectedSeat ? `N° ${selectedSeat}` : '—'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ color:'var(--muted)' }}>{k}</span>
                      <span style={{ fontWeight:600, color: k==='Siège' ? 'var(--gold)' : 'var(--text)' }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:800, paddingTop:12, marginTop:4 }}>
                    <span style={{ fontFamily:'var(--font-display)' }}>Total</span>
                    <span style={{ color:'var(--gold)' }}>{fmtFCFA(selectedTrip.unitPrice * pax + 500)}</span>
                  </div>
                  <div style={{ fontSize:11, color:'var(--muted)', textAlign:'right', marginTop:4 }}>frais de service inclus (500 FCFA)</div>
                </div>

                {/* Plan de sièges */}
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 20, marginBottom: 14,
                }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:14 }}>
                    Choisir un siège
                  </div>
                  <SeatMap
                    takenSeats={(tripDetail || selectedTrip).takenSeats || []}
                    selectedSeat={selectedSeat}
                    onSelect={seat => { selectSeat(seat); setStep(2); }}
                  />
                </div>

                {/* Paiement */}
                {selectedSeat && (
                  <form className="fade-in" onSubmit={handlePay} style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 20,
                  }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:14 }}>
                      Mode de paiement
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                      {PAY_METHODS.map(m => (
                        <div key={m.id} onClick={() => setPayMethod(m.id)} style={{
                          padding: 12,
                          border: `1.5px solid ${payMethod===m.id ? 'var(--gold)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-md)',
                          textAlign: 'center', cursor: 'pointer',
                          background: payMethod===m.id ? 'var(--gold-glow)' : 'transparent',
                          transition: '.15s',
                          animation: payMethod===m.id ? 'pulse-gold 1.5s infinite' : 'none',
                        }}>
                          <div style={{ fontSize:22, marginBottom:4 }}>{m.icon}</div>
                          <div style={{ fontSize:11, fontWeight:500, color: payMethod===m.id ? 'var(--gold)' : 'var(--muted)' }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                    {bookingError && <div style={{ color:'var(--danger)', fontSize:13, marginBottom:10 }}>{bookingError}</div>}
                    <button type="submit" disabled={bookingLoading} style={{
                      width: '100%',
                      background: bookingLoading ? 'var(--border)' : 'linear-gradient(135deg, var(--green-mid), var(--green-light))',
                      color: '#fff', border: 'none',
                      borderRadius: 'var(--radius-md)',
                      padding: 16, fontSize: 15, fontWeight: 800,
                      boxShadow: bookingLoading ? 'none' : '0 6px 24px var(--green-glow)',
                      transition: '.2s',
                      fontFamily: 'var(--font-display)',
                    }}>
                      {bookingLoading ? '⏳ Traitement…' : `Réserver — ${fmtFCFA(selectedTrip.unitPrice * pax + 500)}`}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers styles ── */
const labelStyle = {
  display: 'block', fontSize: 12, color: 'var(--muted)',
  fontWeight: 500, marginBottom: 6, letterSpacing: '.3px',
};
const selectStyle = {
  width: '100%', background: 'var(--bg)',
  border: '1px solid var(--border2)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px', color: 'var(--text)',
  fontSize: 14, outline: 'none',
  transition: '.15s',
};
const badge = (bg, color) => ({
  padding: '3px 9px', borderRadius: 99, fontSize: 11,
  background: bg, color, fontWeight: 500,
  border: `1px solid ${color}33`,
});
