import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const STEP_LABELS = ['Siège', 'Passager', 'Paiement', 'Confirmation'];

export default function BookingFlow() {
  const { tripId } = useParams();
  const [sp]       = useSearchParams();
  const navigate   = useNavigate();
  const pax        = parseInt(sp.get('pax') || '1');

  const [trip,    setTrip]    = useState(null);
  const [seats,   setSeats]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [step,    setStep]    = useState(0);
  const [sel,     setSel]     = useState([]);
  const [form,    setForm]    = useState({ name:'', phone:'', email:'', nationalId:'' });
  const [payMethod, setPayMethod] = useState('MTN_MOMO');
  const [booking, setBooking] = useState(null);
  const [err,     setErr]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`/api/trips/${tripId}`),
      axios.get(`/api/trips/${tripId}/seats`)
    ]).then(([t, s]) => {
      setTrip(t.data.trip || t.data);
      setSeats(s.data.seats || s.data || []);
    }).catch(() => setErr('Voyage introuvable.')).finally(() => setLoading(false));
  }, [tripId]);

  const toggleSeat = (seatNum) => {
    if (seats.find(s => s.seatNumber === seatNum)?.status === 'TAKEN') return;
    setSel(prev =>
      prev.includes(seatNum)
        ? prev.filter(n => n !== seatNum)
        : prev.length < pax ? [...prev, seatNum] : prev
    );
  };

  const confirmBooking = async () => {
    setSubmitting(true); setErr('');
    try {
      const token = localStorage.getItem('busgo_token');
      const res = await axios.post('/api/bookings', {
        tripId, seatNumbers: sel, passengerName: form.name,
        passengerPhone: form.phone, passengerEmail: form.email,
        nationalId: form.nationalId, paymentMethod: payMethod,
        passengerCount: pax
      }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setBooking(res.data.booking || res.data);
      setStep(3);
    } catch(e) {
      setErr(e.response?.data?.error || 'Erreur lors de la réservation.');
    } finally { setSubmitting(false); }
  };

  const fmt = d => new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  const fmtDate = d => new Date(d).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const S = {
    wrap: { minHeight:'100vh', background:'#f5f0e8' },
    head: { background:'#1a3a2a', color:'#fff', padding:'16px 24px', display:'flex', alignItems:'center', gap:16 },
    inner: { maxWidth:680, margin:'0 auto', padding:'28px 16px' },
    card: { background:'#fff', borderRadius:16, border:'1.5px solid #e8e0d0', padding:24, marginBottom:16, boxShadow:'0 2px 12px rgba(0,0,0,.06)' },
    label: { display:'block', fontSize:'.72rem', fontWeight:700, color:'#8a7d6e', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:5 },
    input: { width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #d4c9b5', fontSize:'.9rem', background:'#f8f4ee', outline:'none', boxSizing:'border-box' },
    btn: { padding:'13px 28px', background:'#007a5e', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:'.95rem', width:'100%', marginTop:16 },
    seatFree: { width:36, height:36, borderRadius:8, border:'2px solid #007a5e', background:'#f0faf7', cursor:'pointer', fontSize:'.7rem', display:'flex', alignItems:'center', justifyContent:'center', color:'#007a5e', fontWeight:600 },
    seatSel: { width:36, height:36, borderRadius:8, border:'2px solid #007a5e', background:'#007a5e', cursor:'pointer', fontSize:'.7rem', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700 },
    seatTaken: { width:36, height:36, borderRadius:8, border:'2px solid #ddd', background:'#f0f0f0', cursor:'not-allowed', fontSize:'.7rem', display:'flex', alignItems:'center', justifyContent:'center', color:'#bbb' },
  };

  if (loading) return <div style={S.wrap}><div style={{...S.head}}><Link to="/" style={{color:'#fcd116', textDecoration:'none', fontWeight:700}}>🚌 busGO</Link></div><div style={{textAlign:'center', padding:80, color:'#8a7d6e'}}>Chargement…</div></div>;
  if (err && !trip) return <div style={S.wrap}><div style={S.head}><Link to="/" style={{color:'#fcd116', textDecoration:'none', fontWeight:700}}>🚌 busGO</Link></div><div style={{textAlign:'center', padding:80}}><p style={{color:'#ce1126', marginBottom:16}}>{err}</p><Link to="/" style={{color:'#007a5e'}}>← Retour</Link></div></div>;

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <Link to="/" style={{color:'#fcd116', textDecoration:'none', fontWeight:700, fontSize:'1.2rem'}}>🚌 busGO</Link>
        <span style={{color:'rgba(255,255,255,.4)'}}>›</span>
        <span style={{fontSize:'.85rem', opacity:.8}}>Réservation</span>
      </div>

      {/* Progress */}
      <div style={{background:'#fff', borderBottom:'1px solid #e8e0d0', padding:'12px 24px', display:'flex', gap:0, overflowX:'auto'}}>
        {STEP_LABELS.map((l,i) => (
          <div key={i} style={{display:'flex', alignItems:'center', flex:i<3?1:'auto'}}>
            <div style={{display:'flex', alignItems:'center', gap:8, padding:'4px 12px', borderRadius:20, background: i===step ? '#007a5e' : i<step ? '#e0f4ee' : 'transparent', color: i===step ? '#fff' : i<step ? '#007a5e' : '#8a7d6e', fontWeight:600, fontSize:'.82rem', whiteSpace:'nowrap'}}>
              <span style={{width:20, height:20, borderRadius:'50%', background: i<=step ? (i===step?'#fff':'#007a5e') : '#ddd', color: i===step?'#007a5e':'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.7rem', fontWeight:700}}>
                {i < step ? '✓' : i+1}
              </span>
              {l}
            </div>
            {i < 3 && <div style={{flex:1, height:2, background: i<step?'#007a5e':'#e8e0d0', margin:'0 4px'}}/>}
          </div>
        ))}
      </div>

      <div style={S.inner}>
        {/* Trip summary */}
        {trip && (
          <div style={{...S.card, background:'#1a3a2a', color:'#fff', marginBottom:20}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8}}>
              <div>
                <div style={{fontWeight:700, fontSize:'1.1rem'}}>{trip.agency?.name}</div>
                <div style={{opacity:.7, fontSize:'.8rem'}}>{trip.from?.city} → {trip.to?.city}</div>
                <div style={{opacity:.7, fontSize:'.8rem'}}>{fmtDate(trip.departureTime)}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'1.4rem', fontWeight:700, color:'#fcd116'}}>{fmt(trip.departureTime)}</div>
                <div style={{opacity:.7, fontSize:'.8rem'}}>{trip.price?.toLocaleString('fr-FR')} FCFA/pers</div>
              </div>
            </div>
          </div>
        )}

        {err && <div style={{background:'#fef2f2', border:'1px solid #fca5a5', color:'#ce1126', padding:'10px 16px', borderRadius:10, marginBottom:16, fontSize:'.88rem'}}>{err}</div>}

        {/* STEP 0: Seats */}
        {step === 0 && (
          <div style={S.card}>
            <h3 style={{fontFamily:'Georgia,serif', color:'#1a3a2a', marginBottom:4}}>Choisissez {pax === 1 ? 'votre siège' : `vos ${pax} sièges`}</h3>
            <p style={{color:'#8a7d6e', fontSize:'.83rem', marginBottom:20}}>{sel.length}/{pax} sélectionné(s)</p>
            {/* Legend */}
            <div style={{display:'flex', gap:16, marginBottom:16, fontSize:'.75rem', color:'#8a7d6e'}}>
              <span style={{display:'flex', alignItems:'center', gap:4}}><span style={{width:14, height:14, borderRadius:3, background:'#007a5e', display:'inline-block'}}/> Sélectionné</span>
              <span style={{display:'flex', alignItems:'center', gap:4}}><span style={{width:14, height:14, borderRadius:3, border:'2px solid #007a5e', display:'inline-block'}}/> Libre</span>
              <span style={{display:'flex', alignItems:'center', gap:4}}><span style={{width:14, height:14, borderRadius:3, background:'#ddd', display:'inline-block'}}/> Occupé</span>
            </div>
            {/* Driver */}
            <div style={{textAlign:'center', marginBottom:12}}>
              <div style={{display:'inline-block', background:'#1a3a2a', color:'#fcd116', padding:'6px 20px', borderRadius:8, fontSize:'.75rem', fontWeight:700}}>🚗 CONDUCTEUR</div>
            </div>
            {/* Grid */}
            <div style={{display:'flex', flexDirection:'column', gap:8, alignItems:'center'}}>
              {Array.from({length:Math.ceil(70/4)}, (_,row) => (
                <div key={row} style={{display:'flex', gap:6, alignItems:'center'}}>
                  {[0,1].map(col => {
                    const num = row*4+col+1;
                    if (num > 70) return null;
                    const s = seats.find(s => s.seatNumber === num);
                    const taken = s?.status === 'TAKEN';
                    const selected = sel.includes(num);
                    return (
                      <div key={num} onClick={() => toggleSeat(num)}
                        style={selected ? S.seatSel : taken ? S.seatTaken : S.seatFree}>
                        {num}
                      </div>
                    );
                  })}
                  <div style={{width:24, background:'transparent'}}/>
                  {[2,3].map(col => {
                    const num = row*4+col+1;
                    if (num > 70) return null;
                    const s = seats.find(s => s.seatNumber === num);
                    const taken = s?.status === 'TAKEN';
                    const selected = sel.includes(num);
                    return (
                      <div key={num} onClick={() => toggleSeat(num)}
                        style={selected ? S.seatSel : taken ? S.seatTaken : S.seatFree}>
                        {num}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} disabled={sel.length < pax} style={{...S.btn, opacity: sel.length < pax ? .5 : 1, cursor: sel.length < pax ? 'not-allowed' : 'pointer'}}>
              Continuer → Informations passager
            </button>
          </div>
        )}

        {/* STEP 1: Passenger */}
        {step === 1 && (
          <div style={S.card}>
            <h3 style={{fontFamily:'Georgia,serif', color:'#1a3a2a', marginBottom:20}}>Informations passager</h3>
            {['name','phone','email','nationalId'].map(field => (
              <div key={field} style={{marginBottom:14}}>
                <label style={S.label}>{field === 'name' ? 'Nom complet' : field === 'phone' ? 'Téléphone (MTN/Orange)' : field === 'email' ? 'Email (optionnel)' : 'CNI / Passeport'}</label>
                <input
                  type={field === 'email' ? 'email' : 'text'}
                  placeholder={field === 'phone' ? '6XXXXXXXX' : ''}
                  value={form[field]}
                  onChange={e => setForm(f => ({...f, [field]: e.target.value}))}
                  style={S.input}
                />
              </div>
            ))}
            <div style={{display:'flex', gap:10}}>
              <button onClick={() => setStep(0)} style={{...S.btn, background:'#e8e0d0', color:'#4a4035', marginTop:0, flex:1}}>← Retour</button>
              <button onClick={() => { if(form.name && form.phone) setStep(2); else setErr('Nom et téléphone requis.'); }} style={{...S.btn, marginTop:0, flex:2}}>Continuer → Paiement</button>
            </div>
          </div>
        )}

        {/* STEP 2: Payment */}
        {step === 2 && (
          <div style={S.card}>
            <h3 style={{fontFamily:'Georgia,serif', color:'#1a3a2a', marginBottom:20}}>Mode de paiement</h3>
            {[
              { id:'MTN_MOMO', label:'MTN Mobile Money', icon:'🟡', desc:'Paiement via MTN MoMo' },
              { id:'ORANGE_MONEY', label:'Orange Money', icon:'🟠', desc:'Paiement via Orange Money' },
              { id:'CARD', label:'Carte bancaire', icon:'💳', desc:'Visa / Mastercard' }
            ].map(m => (
              <div key={m.id} onClick={() => setPayMethod(m.id)}
                style={{padding:'14px 18px', borderRadius:12, border: payMethod===m.id ? '2px solid #007a5e' : '1.5px solid #e8e0d0', marginBottom:10, cursor:'pointer', display:'flex', alignItems:'center', gap:14, background: payMethod===m.id ? '#f0faf7' : '#fff'}}>
                <span style={{fontSize:'1.4rem'}}>{m.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700, color:'#1a3a2a', fontSize:'.9rem'}}>{m.label}</div>
                  <div style={{color:'#8a7d6e', fontSize:'.78rem'}}>{m.desc}</div>
                </div>
                <div style={{width:20, height:20, borderRadius:'50%', border: payMethod===m.id ? '6px solid #007a5e' : '2px solid #ccc', transition:'border .2s'}}/>
              </div>
            ))}
            <div style={{background:'#f8f4ee', borderRadius:12, padding:16, margin:'16px 0'}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'.88rem', color:'#4a4035', marginBottom:6}}>
                <span>Siège(s) {sel.join(', ')}</span>
                <span>{pax} × {trip?.price?.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div style={{borderTop:'1px solid #e8e0d0', paddingTop:10, display:'flex', justifyContent:'space-between', fontWeight:700, color:'#1a3a2a'}}>
                <span>Total</span>
                <span style={{color:'#007a5e', fontSize:'1.1rem'}}>{((trip?.price||0)*pax).toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
            <div style={{display:'flex', gap:10}}>
              <button onClick={() => setStep(1)} style={{...S.btn, background:'#e8e0d0', color:'#4a4035', marginTop:0, flex:1}}>← Retour</button>
              <button onClick={confirmBooking} disabled={submitting} style={{...S.btn, marginTop:0, flex:2, opacity: submitting?.5:1}}>
                {submitting ? 'Réservation…' : `✓ Confirmer — ${((trip?.price||0)*pax).toLocaleString('fr-FR')} FCFA`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 3 && booking && (
          <div style={{...S.card, textAlign:'center'}}>
            <div style={{fontSize:'3rem', marginBottom:12}}>🎉</div>
            <h2 style={{fontFamily:'Georgia,serif', color:'#007a5e', marginBottom:8}}>Réservation confirmée !</h2>
            <p style={{color:'#8a7d6e', marginBottom:24}}>Un SMS de confirmation a été envoyé au {form.phone}</p>
            <div style={{background:'#1a3a2a', color:'#fff', borderRadius:14, padding:20, marginBottom:20, display:'inline-block', minWidth:240}}>
              <div style={{fontSize:'.75rem', opacity:.6, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:6}}>Référence</div>
              <div style={{fontFamily:'monospace', fontSize:'1.4rem', fontWeight:700, letterSpacing:'.08em', color:'#fcd116'}}>{booking.reference}</div>
              <div style={{marginTop:12, fontSize:'.75rem', opacity:.6}}>Code validation</div>
              <div style={{fontFamily:'monospace', fontSize:'1.2rem', color:'#fcd116', letterSpacing:'.1em'}}>{booking.validationCode}</div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              <Link to="/mes-voyages" style={{padding:'12px 24px', background:'#007a5e', color:'#fff', borderRadius:12, textDecoration:'none', fontWeight:700}}>Voir mes voyages</Link>
              <Link to="/" style={{padding:'10px', color:'#007a5e', textDecoration:'none', fontSize:'.88rem'}}>← Retour à l'accueil</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
