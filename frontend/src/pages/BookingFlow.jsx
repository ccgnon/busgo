import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const CITY = { YDE:'Yaoundé', DLA:'Douala', BFT:'Bafoussam', NGD:'Ngaoundéré', LIM:'Limbé', BUE:'Buéa', EDO:'Ébolowa', BSG:'Bertoua' };

const STEPS = ['Voyage', 'Passagers', 'Paiement', 'Confirmation'];

export default function BookingFlow() {
  const { tripId } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const pax = parseInt(sp.get('pax') || '1');
  const token = localStorage.getItem('busgo_token');

  const [step, setStep] = useState(1);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);

  const [passengers, setPassengers] = useState(
    Array.from({ length: pax }, () => ({ name: '', phone: '', idNumber: '' }))
  );
  const [payMethod, setPayMethod] = useState('momo');
  const [payPhone, setPayPhone] = useState('');

  useEffect(() => {
    if (!token) { navigate('/connexion'); return; }
    axios.get(`/api/trips/${tripId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setTrip(r.data.trip || r.data))
      .catch(() => setErr('Impossible de charger ce voyage.'))
      .finally(() => setLoading(false));
  }, [tripId, token, navigate]);

  const updatePassenger = (i, k, v) => {
    setPassengers(p => p.map((ps, idx) => idx === i ? { ...ps, [k]: v } : ps));
  };

  const step1Valid = trip != null;
  const step2Valid = passengers.every(p => p.name.trim().length >= 2);
  const step3Valid = payPhone.length >= 9;

  const confirm = async () => {
    setSubmitting(true); setErr('');
    try {
      const res = await axios.post('/api/bookings', {
        tripId,
        passengers,
        seats: pax,
        paymentMethod: payMethod,
        paymentPhone: payPhone,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setBooking(res.data.booking || res.data);
      setStep(4);
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur lors de la réservation. Réessayez.');
    } finally { setSubmitting(false); }
  };

  const fmt = d => new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  const fmtDate = d => new Date(d).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
  const duration = m => m ? `${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}` : '—';

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 11, border: '2px solid #e8e0d0', fontSize: '.9rem', background: '#fafaf8', outline: 'none', boxSizing: 'border-box', color: '#1a3a2a', transition: 'border .2s' };
  const labelStyle = { display: 'block', fontSize: '.68rem', fontWeight: 800, color: '#8a7d6e', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 };

  return (
    <div style={{ minHeight: '100vh', background: '#f0ece4', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <Navbar />

      {/* Progress header */}
      <div style={{ background: 'linear-gradient(135deg,#1a3a2a,#2d5c3f)', paddingTop: 64 }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px clamp(16px,4vw,32px) 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            {STEPS.map((s, i) => {
              const num = i + 1;
              const done = num < step;
              const active = num === step;
              return (
                <React.Fragment key={s}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.8rem', background: done ? '#007a5e' : active ? '#fcd116' : 'rgba(255,255,255,.15)', color: done ? '#fff' : active ? '#1a3a2a' : 'rgba(255,255,255,.5)', transition: 'all .3s' }}>
                      {done ? '✓' : num}
                    </div>
                    <span style={{ fontSize: '.65rem', fontWeight: 700, color: active ? '#fcd116' : done ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.35)', letterSpacing: '.05em' }}>
                      {s.toUpperCase()}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: done ? '#007a5e' : 'rgba(255,255,255,.15)', marginBottom: 18, borderRadius: 1, transition: 'background .3s' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px clamp(16px,4vw,32px)' }}>
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #e8e0d0', borderTopColor: '#007a5e', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#8a7d6e' }}>Chargement du voyage…</p>
          </div>
        )}

        {err && step !== 4 && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#b91c1c', padding: '14px 18px', borderRadius: 12, marginBottom: 20 }}>⚠️ {err}</div>
        )}

        {/* ── STEP 1: Trip summary ── */}
        {!loading && step === 1 && trip && (
          <div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.5rem', color: '#1a3a2a', marginBottom: 20 }}>Votre voyage</h2>
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e8e0d0', overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 14px rgba(0,0,0,.05)' }}>
              {/* Agency bar */}
              <div style={{ padding: '14px 20px', background: '#f8f4ee', borderBottom: '1px solid #e8e0d0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#007a5e,#00a87d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🚌</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1a3a2a' }}>{trip.agency?.name || 'Agence'}</div>
                  <div style={{ fontSize: '.75rem', color: '#8a7d6e' }}>{trip.busType || 'Confort'}</div>
                </div>
              </div>

              {/* Route */}
              <div style={{ padding: '28px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1a3a2a' }}>{fmt(trip.departureTime)}</div>
                  <div style={{ fontWeight: 700, color: '#007a5e' }}>{CITY[trip.from?.code] || trip.from?.city || '—'}</div>
                  <div style={{ fontSize: '.75rem', color: '#8a7d6e' }}>{fmtDate(trip.departureTime)}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '.78rem', color: '#8a7d6e', marginBottom: 6 }}>{duration(trip.durationMinutes)}</div>
                  <div style={{ height: 3, background: 'linear-gradient(to right,#007a5e,#fcd116)', borderRadius: 3 }} />
                  <div style={{ fontSize: '.72rem', color: '#8a7d6e', marginTop: 6 }}>Direct</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1a3a2a' }}>{fmt(trip.arrivalTime)}</div>
                  <div style={{ fontWeight: 700, color: '#007a5e' }}>{CITY[trip.to?.code] || trip.to?.city || '—'}</div>
                  <div style={{ fontSize: '.75rem', color: '#8a7d6e' }}>{fmtDate(trip.arrivalTime)}</div>
                </div>
              </div>

              {/* Summary row */}
              <div style={{ padding: '16px 20px', background: '#f0fdf4', borderTop: '1px solid #d1fae5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontSize: '.85rem', color: '#065f46' }}>
                  <strong>{pax} passager{pax > 1 ? 's' : ''}</strong> · {trip.price?.toLocaleString('fr-FR')} FCFA / pers.
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#007a5e' }}>
                  {(trip.price * pax)?.toLocaleString('fr-FR')} FCFA
                </div>
              </div>
            </div>

            <button onClick={() => setStep(2)}
              style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg,#007a5e,#00a87d)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 16px rgba(0,122,94,.35)' }}>
              Continuer → Informations passagers
            </button>
          </div>
        )}

        {/* ── STEP 2: Passenger info ── */}
        {!loading && step === 2 && (
          <div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.5rem', color: '#1a3a2a', marginBottom: 20 }}>
              Informations passagers
            </h2>
            {passengers.map((p, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #e8e0d0', padding: '20px', marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#007a5e,#00a87d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '.85rem' }}>{i + 1}</div>
                  <div style={{ fontWeight: 700, color: '#1a3a2a' }}>Passager {i + 1}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={labelStyle}>Nom complet *</label>
                    <input required type="text" placeholder="Jean Dupont" value={p.name}
                      onChange={e => updatePassenger(i, 'name', e.target.value)} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#007a5e'}
                      onBlur={e => e.target.style.borderColor = '#e8e0d0'} />
                  </div>
                  <div>
                    <label style={labelStyle}>Téléphone</label>
                    <input type="tel" placeholder="+237 6XX" value={p.phone}
                      onChange={e => updatePassenger(i, 'phone', e.target.value)} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#007a5e'}
                      onBlur={e => e.target.style.borderColor = '#e8e0d0'} />
                  </div>
                  <div>
                    <label style={labelStyle}>CNI / Passeport</label>
                    <input type="text" placeholder="Ex: 1234567890" value={p.idNumber}
                      onChange={e => updatePassenger(i, 'idNumber', e.target.value)} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#007a5e'}
                      onBlur={e => e.target.style.borderColor = '#e8e0d0'} />
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', background: '#f0ece4', color: '#6b5d4f', border: 'none', borderRadius: 14, fontWeight: 700, cursor: 'pointer' }}>← Retour</button>
              <button onClick={() => { if (step2Valid) setStep(3); }} disabled={!step2Valid}
                style={{ flex: 2, padding: '14px', background: step2Valid ? 'linear-gradient(135deg,#007a5e,#00a87d)' : '#d1d5db', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, cursor: step2Valid ? 'pointer' : 'not-allowed', fontSize: '1rem', boxShadow: step2Valid ? '0 4px 16px rgba(0,122,94,.35)' : 'none' }}>
                Continuer → Paiement
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Payment ── */}
        {!loading && step === 3 && (
          <div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.5rem', color: '#1a3a2a', marginBottom: 20 }}>Paiement</h2>

            {/* Payment method */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #e8e0d0', padding: '20px', marginBottom: 16 }}>
              <label style={{ ...labelStyle, marginBottom: 14 }}>Mode de paiement</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { id: 'momo', name: 'MTN MoMo', emoji: '🟡', desc: 'Mobile Money MTN' },
                  { id: 'om', name: 'Orange Money', emoji: '🟠', desc: 'Orange Money CM' },
                  { id: 'card', name: 'Carte bancaire', emoji: '💳', desc: 'Visa / Mastercard' },
                  { id: 'cash', name: 'Espèces en agence', emoji: '💵', desc: 'Paiement sur place' },
                ].map(m => (
                  <div key={m.id} onClick={() => setPayMethod(m.id)}
                    style={{ padding: '14px 16px', borderRadius: 12, border: `2px solid ${payMethod === m.id ? '#007a5e' : '#e8e0d0'}`, background: payMethod === m.id ? '#f0fdf4' : '#fafaf8', cursor: 'pointer', transition: 'all .2s' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{m.emoji}</div>
                    <div style={{ fontWeight: 700, color: '#1a3a2a', fontSize: '.88rem' }}>{m.name}</div>
                    <div style={{ fontSize: '.72rem', color: '#8a7d6e' }}>{m.desc}</div>
                  </div>
                ))}
              </div>

              {(payMethod === 'momo' || payMethod === 'om') && (
                <div>
                  <label style={labelStyle}>Numéro {payMethod === 'momo' ? 'MTN MoMo' : 'Orange Money'} *</label>
                  <input type="tel" placeholder="+237 6XX XXX XXX" value={payPhone}
                    onChange={e => setPayPhone(e.target.value)} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#007a5e'}
                    onBlur={e => e.target.style.borderColor = '#e8e0d0'} />
                  <p style={{ fontSize: '.75rem', color: '#8a7d6e', marginTop: 6 }}>Vous recevrez une demande de confirmation sur ce numéro.</p>
                </div>
              )}
              {payMethod === 'cash' && (
                <div style={{ background: '#fffbeb', border: '1px solid #fcd116', borderRadius: 10, padding: '12px 14px', fontSize: '.82rem', color: '#92400e' }}>
                  ℹ️ Présentez-vous à l'agence <strong>{trip?.agency?.name}</strong> au moins 30 min avant le départ pour régler votre billet.
                </div>
              )}
              {payMethod === 'card' && (
                <input type="tel" placeholder="Numéro de téléphone pour le reçu" value={payPhone}
                  onChange={e => setPayPhone(e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#007a5e'}
                  onBlur={e => e.target.style.borderColor = '#e8e0d0'} />
              )}
            </div>

            {/* Order summary */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #e8e0d0', padding: '20px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: '#1a3a2a', marginBottom: 14 }}>Récapitulatif</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#6b5d4f', fontSize: '.88rem' }}>
                <span>{pax} × billet {CITY[trip?.from?.code]} → {CITY[trip?.to?.code]}</span>
                <span>{((trip?.price || 0) * pax).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div style={{ height: 1, background: '#e8e0d0', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#007a5e', fontSize: '1.1rem' }}>
                <span>Total à payer</span>
                <span>{((trip?.price || 0) * pax).toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: '14px', background: '#f0ece4', color: '#6b5d4f', border: 'none', borderRadius: 14, fontWeight: 700, cursor: 'pointer' }}>← Retour</button>
              <button onClick={confirm} disabled={submitting || (!step3Valid && (payMethod === 'momo' || payMethod === 'om'))}
                style={{ flex: 2, padding: '14px', background: submitting ? '#9ca3af' : 'linear-gradient(135deg,#007a5e,#00a87d)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '1rem', boxShadow: submitting ? 'none' : '0 4px 16px rgba(0,122,94,.35)' }}>
                {submitting ? '⏳ Réservation en cours…' : '🎫 Confirmer la réservation'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Confirmation ── */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#007a5e,#00a87d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(0,122,94,.3)' }}>
              ✅
            </div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem', color: '#1a3a2a', marginBottom: 8 }}>Voyage réservé !</h2>
            <p style={{ color: '#6b5d4f', marginBottom: 28 }}>Votre réservation a été confirmée avec succès.</p>

            {booking && (
              <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e8e0d0', padding: '24px', marginBottom: 24, boxShadow: '0 2px 14px rgba(0,0,0,.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Référence', value: booking.reference || booking.id?.slice(0, 8).toUpperCase() },
                    { label: 'Code validation', value: booking.validationCode || '—', highlight: true },
                  ].map(d => (
                    <div key={d.label} style={{ background: d.highlight ? '#f0fdf4' : '#f8f4ee', borderRadius: 12, padding: '14px 16px', border: d.highlight ? '1px solid #86efac' : 'none' }}>
                      <div style={{ fontSize: '.68rem', fontWeight: 800, color: '#8a7d6e', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{d.label}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800, color: d.highlight ? '#166534' : '#1a3a2a', letterSpacing: '.06em' }}>{d.value}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '.8rem', color: '#8a7d6e', marginTop: 14 }}>
                  Présentez ce code à l'agence le jour du départ.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/mes-voyages" style={{ padding: '12px 24px', background: '#007a5e', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700, boxShadow: '0 4px 16px rgba(0,122,94,.25)' }}>
                🎫 Mes réservations
              </Link>
              <Link to="/" style={{ padding: '12px 24px', background: '#f0ece4', color: '#6b5d4f', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>
                🔍 Nouveau voyage
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg) } } * { box-sizing:border-box }`}</style>
    </div>
  );
}
