import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { createBooking } from '../services/api';

const FCFA    = n => Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
const fmtDur  = min => { if (!min) return ''; const h = Math.floor(min/60), m = min%60; return m ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`; };

const PAY_METHODS = [
  { id:'mtn_momo',     label:'MTN MoMo',      emoji:'📱', color:'#FFCC02', bg:'rgba(255,204,2,.12)',   border:'rgba(255,204,2,.4)',   desc:'Paiement Mobile Money MTN' },
  { id:'orange_money', label:'Orange Money',  emoji:'🟠', color:'#FF6B00', bg:'rgba(255,107,0,.12)',   border:'rgba(255,107,0,.4)',   desc:'Paiement Orange Money' },
  { id:'card',         label:'Carte bancaire',emoji:'💳', color:'var(--c-green-300)', bg:'rgba(45,184,102,.1)', border:'rgba(45,184,102,.35)', desc:'Visa · Mastercard · CIB' },
  { id:'paypal',       label:'PayPal',        emoji:'🅿️', color:'#0070BA', bg:'rgba(0,112,186,.1)',   border:'rgba(0,112,186,.35)', desc:'Paiement PayPal sécurisé' },
];

/* ── Spinner ─────────────────────────────────────────────────────────────── */
function Spinner({ color='#fff', size=14 }) {
  return <span style={{ display:'inline-block', width:size, height:size, border:`2px solid rgba(255,255,255,.25)`, borderTopColor:color, borderRadius:'50%', animation:'spin 1s linear infinite' }} />;
}

/* ── Formulaire passager ─────────────────────────────────────────────────── */
function PassengerForm({ index, seat, data, onChange, isFirst }) {
  const field = (key, label, type='text', required=true, placeholder='', extraStyle={}) => (
    <div>
      <label style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.8, display:'block', marginBottom:5 }}>
        {label} {required && <span style={{ color:'var(--c-red-400)' }}>*</span>}
      </label>
      <input type={type} className="input" required={required} placeholder={placeholder}
        value={data[key]||''} onChange={e => onChange(key, e.target.value)}
        style={{ fontSize:14, ...extraStyle }} />
    </div>
  );

  return (
    <div style={{ background:'var(--bg-raised)', border:'1px solid var(--border-md)', borderRadius:'var(--r-lg)', overflow:'hidden', animation:'fadeUp .3s var(--ease) both', animationDelay:`${index*.08}s` }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)' }}>
        <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--c-green-700)', border:'1px solid var(--c-green-500)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, color:'var(--c-green-200)', flexShrink:0 }}>
          {index+1}
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600 }}>
            Passager {index+1}
            {isFirst && <span style={{ marginLeft:8, fontSize:11, color:'var(--c-gold-400)', fontWeight:500 }}>(contact principal)</span>}
          </div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
            🪑 Siège <strong style={{ color:'var(--c-green-300)' }}>{seat}</strong>
          </div>
        </div>
      </div>

      {/* Champs */}
      <div style={{ padding:'18px 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Genre */}
        <div style={{ gridColumn:'1 / -1' }}>
          <label style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.8, display:'block', marginBottom:8 }}>
            Genre <span style={{ color:'var(--c-red-400)' }}>*</span>
          </label>
          <div style={{ display:'flex', gap:8 }}>
            {[['M','👨','M.'],['F','👩','Mme'],['E','👶','Enfant']].map(([v,emoji,lbl]) => (
              <button key={v} type="button" onClick={() => onChange('gender',v)} style={{
                flex:1, padding:'10px 6px', borderRadius:'var(--r-md)',
                border: data.gender===v ? '2px solid var(--c-green-400)' : '1px solid var(--border-md)',
                background: data.gender===v ? 'var(--c-green-700)' : 'var(--bg-elevated)',
                color: data.gender===v ? 'var(--c-green-100)' : 'var(--text-muted)',
                fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .12s',
                display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              }}>
                <span style={{ fontSize:18 }}>{emoji}</span><span>{lbl}</span>
              </button>
            ))}
          </div>
        </div>

        {field('firstName','Prénom','text',true,'Jean')}
        {field('lastName','Nom','text',true,'Kamga')}

        {/* Téléphone */}
        <div style={{ gridColumn: isFirst ? '1/2' : '1/-1' }}>
          <label style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.8, display:'block', marginBottom:5 }}>
            Téléphone (+237) {isFirst && <span style={{ color:'var(--c-red-400)' }}>*</span>}
          </label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--text-muted)', pointerEvents:'none' }}>🇨🇲</span>
            <input type="tel" className="input" required={isFirst} placeholder="6XX XXX XXX"
              value={data.phone||''} onChange={e => onChange('phone',e.target.value)}
              style={{ paddingLeft:36, fontSize:14 }} />
          </div>
        </div>

        {/* Email (passager principal seulement) */}
        {isFirst && (
          <div>
            <label style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.8, display:'block', marginBottom:5 }}>Email (billet)</label>
            <input type="email" className="input" placeholder="jean@email.com"
              value={data.email||''} onChange={e => onChange('email',e.target.value)}
              style={{ fontSize:14 }} />
          </div>
        )}

        {/* CNI */}
        <div style={{ gridColumn: isFirst ? '1/-1' : undefined }}>
          <label style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.8, display:'block', marginBottom:5 }}>N° CNI / Passeport</label>
          <input type="text" className="input" placeholder="Ex: 123456789"
            value={data.idNumber||''} onChange={e => onChange('idNumber',e.target.value)}
            style={{ fontSize:14 }} />
        </div>
      </div>
    </div>
  );
}

/* ── Modal Mobile Money ──────────────────────────────────────────────────── */
function MobilePayModal({ method, amount, onConfirm, onClose, loading }) {
  const [pin, setPin]     = useState('');
  const [phone, setPhone] = useState('');
  const isMoMo  = method === 'mtn_momo';
  const color   = isMoMo ? '#FFCC02' : '#FF6B00';
  const name    = isMoMo ? 'MTN MoMo' : 'Orange Money';
  const valid   = phone.replace(/\s/g,'').length >= 9 && pin.length >= 4;

  return (
    <Overlay>
      <div style={{ width:'100%', maxWidth:400, background:'var(--bg-card)', border:`1px solid ${isMoMo?'rgba(255,204,2,.3)':'rgba(255,107,0,.3)'}`, borderRadius:'var(--r-xl)', overflow:'hidden', animation:'fadeUp .3s var(--ease-spring)', boxShadow:`0 40px 80px rgba(0,0,0,.5)` }}>
        <div style={{ background:color, padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:isMoMo?'#1a1200':'#fff' }}>{name}</div>
            <div style={{ fontSize:12, color:isMoMo?'rgba(0,0,0,.5)':'rgba(255,255,255,.7)', marginTop:2 }}>Confirmation de paiement</div>
          </div>
          <span style={{ fontSize:28 }}>{isMoMo?'🟡':'🟠'}</span>
        </div>
        <div style={{ padding:'24px' }}>
          <div style={{ textAlign:'center', padding:'14px', background:'var(--bg-elevated)', borderRadius:'var(--r-md)', marginBottom:18 }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Montant</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:900, color }}>{FCFA(amount)}</div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={lblStyle}>Numéro {name} *</label>
            <input className="input" type="tel" placeholder="6XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} style={{ fontSize:15, textAlign:'center', letterSpacing:2 }} />
          </div>
          <div style={{ marginBottom:22 }}>
            <label style={lblStyle}>Code PIN *</label>
            <input className="input" type="password" inputMode="numeric" maxLength={5} placeholder="• • • • •" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,''))} style={{ fontSize:24, textAlign:'center', letterSpacing:8 }} />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ flex:1, justifyContent:'center' }}>Annuler</button>
            <button className="btn" disabled={loading || !valid} onClick={() => onConfirm({phone,pin})}
              style={{ flex:2, justifyContent:'center', background:color, color:isMoMo?'#1a1200':'#fff', fontWeight:700, opacity:(!valid||loading)?.5:1 }}>
              {loading ? <><Spinner color={isMoMo?'#1a1200':'#fff'}/> Traitement…</> : `Payer ${FCFA(amount)}`}
            </button>
          </div>
          <p style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginTop:10 }}>🔒 Paiement sécurisé</p>
        </div>
      </div>
    </Overlay>
  );
}

/* ── Modal Carte bancaire ────────────────────────────────────────────────── */
function CardPayModal({ amount, onConfirm, onClose, loading }) {
  const [form, setForm] = useState({ number:'', expiry:'', cvv:'', name:'' });
  const u = (k) => (e) => {
    let v = e.target.value;
    if (k==='number') v = v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
    if (k==='expiry') v = v.replace(/\D/g,'').slice(0,4).replace(/^(\d{2})(\d)$/,'$1/$2');
    if (k==='cvv')    v = v.replace(/\D/g,'').slice(0,3);
    setForm(p => ({...p,[k]:v}));
  };
  const valid = form.number.replace(/\s/g,'').length===16 && form.expiry.length===5 && form.cvv.length===3 && form.name.length>2;

  return (
    <Overlay>
      <div style={{ width:'100%', maxWidth:420, background:'var(--bg-card)', border:'1px solid var(--border-md)', borderRadius:'var(--r-xl)', overflow:'hidden', animation:'fadeUp .3s var(--ease-spring)', boxShadow:'0 40px 80px rgba(0,0,0,.5)' }}>
        {/* Card visual */}
        <div style={{ background:'linear-gradient(135deg,var(--c-green-700) 0%,var(--c-green-900) 60%,#0a0f0b 100%)', padding:'24px 28px 20px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(35,144,79,.15)' }}/>
          <div style={{ position:'absolute', bottom:-30, left:40, width:80, height:80, borderRadius:'50%', background:'rgba(232,160,32,.08)' }}/>
          <div style={{ position:'relative' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <span style={{ fontSize:16, fontWeight:800, color:'#fff', fontFamily:'var(--font-display)' }}>busGO Pay</span>
              <span style={{ fontSize:22 }}>💳</span>
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:17, color:'rgba(255,255,255,.9)', letterSpacing:3, marginBottom:14 }}>
              {form.number||'•••• •••• •••• ••••'}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
              <div><div style={{ color:'rgba(255,255,255,.4)', letterSpacing:1, marginBottom:2 }}>TITULAIRE</div><div style={{ color:'#fff', fontWeight:600 }}>{form.name||'—'}</div></div>
              <div><div style={{ color:'rgba(255,255,255,.4)', letterSpacing:1, marginBottom:2 }}>EXPIRATION</div><div style={{ color:'#fff', fontWeight:600 }}>{form.expiry||'—/——'}</div></div>
              <div><div style={{ color:'rgba(255,255,255,.4)', letterSpacing:1, marginBottom:2 }}>TOTAL</div><div style={{ color:'var(--c-gold-400)', fontWeight:700 }}>{FCFA(amount)}</div></div>
            </div>
          </div>
        </div>
        <div style={{ padding:'22px 24px' }}>
          <div style={{ display:'grid', gap:12 }}>
            <div>
              <label style={lblStyle}>Numéro de carte</label>
              <input className="input" placeholder="1234 5678 9012 3456" value={form.number} onChange={u('number')} style={{ fontFamily:'var(--font-mono)', letterSpacing:2 }}/>
            </div>
            <div>
              <label style={lblStyle}>Titulaire</label>
              <input className="input" placeholder="JEAN KAMGA" value={form.name} onChange={u('name')} style={{ textTransform:'uppercase' }}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={lblStyle}>Expiration</label>
                <input className="input" placeholder="MM/AA" value={form.expiry} onChange={u('expiry')} style={{ fontFamily:'var(--font-mono)' }}/>
              </div>
              <div>
                <label style={lblStyle}>CVV</label>
                <input className="input" type="password" placeholder="•••" maxLength={3} value={form.cvv} onChange={u('cvv')} style={{ fontFamily:'var(--font-mono)', letterSpacing:4 }}/>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:18 }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ flex:1, justifyContent:'center' }}>Annuler</button>
            <button className="btn btn-primary" disabled={!valid||loading} onClick={() => onConfirm(form)} style={{ flex:2, justifyContent:'center', opacity:(!valid||loading)?.5:1 }}>
              {loading ? <><Spinner/> Traitement…</> : `Payer ${FCFA(amount)}`}
            </button>
          </div>
          <p style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginTop:10 }}>🔒 SSL 256 bits · Paiement sécurisé</p>
        </div>
      </div>
    </Overlay>
  );
}

/* ── Overlay ─────────────────────────────────────────────────────────────── */
function Overlay({ children }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(8,15,10,.9)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:'fadeIn .2s ease' }}>
      {children}
    </div>
  );
}

/* ── Confirmation ────────────────────────────────────────────────────────── */
function ConfirmationView({ bookings, passengers, onNew, onTickets }) {
  const total = bookings.reduce((s,b) => s + (b.totalPrice||0), 0);
  return (
    <div style={{ maxWidth:600, margin:'0 auto', padding:'40px 0', animation:'fadeUp .4s ease' }}>
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--c-green-700)', border:'2px solid var(--c-green-400)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto 20px', animation:'pulse-ring 2s infinite', boxShadow:'var(--glow-green)' }}>✓</div>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:900, marginBottom:8 }}>Réservation confirmée !</h2>
        <p style={{ color:'var(--text-muted)', fontSize:15 }}>{bookings.length} billet{bookings.length>1?'s':''} · SMS + Email envoyés</p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
        {bookings.map((b,i) => (
          <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border-md)', borderRadius:'var(--r-lg)', overflow:'hidden' }}>
            <div style={{ height:3, display:'flex' }}>
              <div style={{ flex:1, background:'var(--c-green-400)' }}/><div style={{ flex:1, background:'var(--c-red-500)' }}/><div style={{ flex:1, background:'var(--c-gold-400)' }}/>
            </div>
            <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--c-green-700)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:'var(--c-green-200)', flexShrink:0 }}>{i+1}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{passengers[i]?.firstName} {passengers[i]?.lastName}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                    Siège <strong style={{ color:'var(--c-green-300)' }}>{b.seatNum}</strong> · <span style={{ fontFamily:'var(--font-mono)' }}>{b.id}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1 }}>Code validation</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:800, color:'var(--c-gold-400)', letterSpacing:4 }}>{b.validationCode}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-md)', borderRadius:'var(--r-lg)', padding:'14px 20px', marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>Total payé</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, color:'var(--c-gold-400)' }}>{FCFA(total)}</div>
        </div>
        <div style={{ textAlign:'right', fontSize:12, color:'var(--text-muted)', lineHeight:1.8 }}>
          <div>📧 Billets envoyés par email</div>
          <div>📱 SMS de confirmation envoyé</div>
          <div>🎫 PDFs disponibles dans Mes billets</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-primary" onClick={onTickets} style={{ flex:2, justifyContent:'center' }}>🎫 Voir mes billets</button>
        <button className="btn btn-ghost" onClick={onNew} style={{ flex:1, justifyContent:'center' }}>Nouvelle recherche</button>
      </div>
    </div>
  );
}

const lblStyle = { fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.8, display:'block', marginBottom:5 };

/* ════════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
════════════════════════════════════════════════════════════════════════════ */
export default function PaymentPage() {
  const navigate = useNavigate();
  const { selectedTrip, selectedSeats, searchParams, setCurrentBooking, resetBookingFlow } = useStore();
  const { from, to, date, pax = 1 } = searchParams;
  const trip  = selectedTrip;
  const seats = selectedSeats || [];

  useEffect(() => { if (!trip || seats.length === 0) navigate('/'); }, []);

  const [step, setStep]             = useState(0);
  const [payMethod, setPayMethod]   = useState('mtn_momo');
  const [passengers, setPassengers] = useState(() =>
    Array.from({ length: Math.max(pax, seats.length) }, () =>
      ({ gender:'M', firstName:'', lastName:'', phone:'', email:'', idNumber:'' })
    )
  );
  const [showModal, setShowModal]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [bookings, setBookings]     = useState([]);

  if (!trip) return null;

  const unitPrice  = trip.unitPrice || trip.price || 0;
  const total      = unitPrice * passengers.length + 500;
  const selMethod  = PAY_METHODS.find(m => m.id === payMethod);
  const isMobile   = ['mtn_momo','orange_money'].includes(payMethod);

  const updPax = (i, k, v) => setPassengers(prev => prev.map((p, idx) => idx===i ? {...p,[k]:v} : p));

  function validate() {
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.gender)    { setError(`Passager ${i+1} : genre requis`); return false; }
      if (!p.firstName) { setError(`Passager ${i+1} : prénom requis`); return false; }
      if (!p.lastName)  { setError(`Passager ${i+1} : nom requis`); return false; }
      if (i===0 && !p.phone) { setError('Téléphone du passager principal requis'); return false; }
    }
    setError(null); return true;
  }

  async function processBookings() {
    setLoading(true); setError(null);
    try {
      const results = [];
      for (let i = 0; i < seats.length; i++) {
        const p = passengers[i];
        const res = await createBooking({
          tripId:        trip.id,
          seat:          seats[i],
          pax:           1,
          paymentMethod: payMethod,
          date,
          passengerName:  `${p.firstName} ${p.lastName}`,
          passengerPhone: p.phone || passengers[0].phone,
          passengerEmail: p.email || passengers[0].email,
        });
        results.push(res.booking);
      }
      setBookings(results);
      setCurrentBooking(results[0]);
      setStep(2);
      window.scrollTo({ top:0, behavior:'smooth' });
    } catch (err) {
      setError(err.error || 'Erreur lors de la réservation. Réessayez.');
    } finally {
      setLoading(false); setShowModal(false);
    }
  }

  return (
    <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 24px 80px' }}>

      {/* Retour */}
      {step < 2 && (
        <button onClick={() => step>0 ? setStep(step-1) : navigate('/')}
          style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:6, marginBottom:24 }}>
          ← {step===0 ? 'Retour' : 'Modifier les informations'}
        </button>
      )}

      {/* Steps */}
      {step < 2 && (
        <div style={{ display:'flex', alignItems:'center', marginBottom:28 }}>
          {[['👥','Informations passagers'],['💳','Paiement'],['✓','Confirmation']].map(([icon,label],i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', flex: i<2 ? 1 : 'none' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{
                  width:38, height:38, borderRadius:'50%',
                  background: i<step ? 'var(--c-green-500)' : i===step ? 'var(--c-green-700)' : 'var(--bg-elevated)',
                  border: i===step ? '2px solid var(--c-green-400)' : i<step ? 'none' : '1px solid var(--border-md)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize: i<step ? 14 : 17,
                  color: i<step ? '#fff' : i===step ? 'var(--c-green-200)' : 'var(--text-muted)',
                  transition:'all .3s',
                  boxShadow: i===step ? 'var(--glow-green)' : 'none',
                }}>{i<step ? '✓' : icon}</div>
                <span style={{ fontSize:11, fontWeight:i===step?600:400, color:i===step?'var(--text-primary)':'var(--text-muted)', whiteSpace:'nowrap' }}>{label}</span>
              </div>
              {i<2 && <div style={{ flex:1, height:1, margin:'0 10px', marginBottom:18, background:i<step?'var(--c-green-500)':'var(--border)', transition:'background .3s' }}/>}
            </div>
          ))}
        </div>
      )}

      {/* Récap trajet */}
      {step < 2 && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-md)', borderRadius:'var(--r-lg)', padding:'14px 20px', marginBottom:28, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800 }}>
              {trip.from||from} <span style={{ color:'var(--text-muted)', fontWeight:400 }}>→</span> {trip.to||to}
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
              {trip.company} · {trip.dep||trip.depTime} → {trip.arr||trip.arrTime}{trip.durationMin ? ` · ${fmtDur(trip.durationMin)}` : ''}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {seats.map(s => (
                <span key={s} style={{ padding:'3px 10px', borderRadius:'var(--r-full)', fontSize:12, fontWeight:600, background:'var(--c-green-700)', color:'var(--c-green-100)', border:'1px solid var(--c-green-500)' }}>
                  🪑 {s}
                </span>
              ))}
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color:'var(--c-gold-400)', flexShrink:0 }}>{FCFA(total)}</div>
          </div>
        </div>
      )}

      {/* ── ÉTAPE 0 : Formulaires passagers ── */}
      {step === 0 && (
        <form onSubmit={e => { e.preventDefault(); if (validate()) { setStep(1); window.scrollTo({top:0,behavior:'smooth'}); } }}>
          <div style={{ display:'grid', gridTemplateColumns: passengers.length>1 ? 'repeat(auto-fill,minmax(420px,1fr))' : '1fr', gap:20 }}>
            {passengers.map((p,i) => (
              <PassengerForm key={i} index={i} seat={seats[i]} data={p} onChange={(k,v) => updPax(i,k,v)} isFirst={i===0} />
            ))}
          </div>

          {error && (
            <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(192,57,43,.1)', border:'1px solid rgba(192,57,43,.25)', borderRadius:'var(--r-md)', fontSize:13, color:'var(--c-red-400)' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginTop:24, padding:'18px 20px', background:'var(--bg-elevated)', border:'1px solid var(--border-md)', borderRadius:'var(--r-lg)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{passengers.length} passager{passengers.length>1?'s':''} · {seats.length} siège{seats.length>1?'s':''}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, color:'var(--c-gold-400)' }}>{FCFA(total)}</div>
            </div>
            <button className="btn btn-primary" type="submit" style={{ padding:'12px 28px', fontSize:14 }}>
              Continuer vers le paiement →
            </button>
          </div>
        </form>
      )}

      {/* ── ÉTAPE 1 : Paiement ── */}
      {step === 1 && (
        <div className="fade-in" style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24, alignItems:'start' }}>
          {/* Modes de paiement */}
          <div>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, marginBottom:18 }}>Mode de paiement</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
              {PAY_METHODS.map(pm => (
                <button key={pm.id} type="button" onClick={() => setPayMethod(pm.id)} style={{
                  padding:'16px', borderRadius:'var(--r-lg)',
                  border: payMethod===pm.id ? `2px solid ${pm.border}` : '1px solid var(--border-md)',
                  background: payMethod===pm.id ? pm.bg : 'var(--bg-elevated)',
                  cursor:'pointer', textAlign:'left', transition:'all .15s',
                  transform: payMethod===pm.id ? 'scale(1.02)' : 'scale(1)',
                }}>
                  <div style={{ fontSize:22, marginBottom:8 }}>{pm.emoji}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:payMethod===pm.id?pm.color:'var(--text-primary)' }}>{pm.label}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{pm.desc}</div>
                  {payMethod===pm.id && <div style={{ marginTop:8, width:18, height:18, borderRadius:'50%', background:pm.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#000' }}>✓</div>}
                </button>
              ))}
            </div>

            {/* Résumé passagers */}
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', overflow:'hidden' }}>
              <div style={{ padding:'11px 16px', borderBottom:'1px solid var(--border)', fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.8 }}>
                Passagers confirmés
              </div>
              {passengers.map((p,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:i<passengers.length-1?'1px solid var(--border)':'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:18 }}>{p.gender==='F'?'👩':p.gender==='E'?'👶':'👨'}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{p.firstName||'—'} {p.lastName||'—'}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.phone||'—'}</div>
                    </div>
                  </div>
                  <span style={{ padding:'2px 10px', borderRadius:'var(--r-full)', background:'var(--c-green-700)', color:'var(--c-green-200)', fontSize:12, fontWeight:600 }}>
                    Siège {seats[i]}
                  </span>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ marginTop:14, padding:'12px 16px', background:'rgba(192,57,43,.1)', border:'1px solid rgba(192,57,43,.25)', borderRadius:'var(--r-md)', fontSize:13, color:'var(--c-red-400)' }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Récap sticky */}
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-md)', borderRadius:'var(--r-xl)', overflow:'hidden', position:'sticky', top:80 }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.8, marginBottom:12 }}>Récapitulatif</div>
              {[
                ['Trajet',    `${trip.from||from} → ${trip.to||to}`],
                ['Date',      new Date(date+'T12:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'long'})],
                ['Départ',    trip.dep||trip.depTime],
                ['Compagnie', trip.company],
                ['Sièges',    seats.join(', ')],
                ['Prix unitaire', FCFA(unitPrice)],
                ['Frais service', FCFA(500)],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <span style={{ color:'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight:500, textAlign:'right', maxWidth:160, wordBreak:'break-word' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:'14px 20px', background:'var(--bg-elevated)', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:13, fontWeight:600 }}>TOTAL</span>
              <span style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:900, color:'var(--c-gold-400)' }}>{FCFA(total)}</span>
            </div>
            <div style={{ padding:'16px 20px' }}>
              <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'14px', fontSize:15, fontWeight:700 }}
                onClick={() => setShowModal(true)} disabled={loading}>
                {loading ? <><Spinner/> Traitement…</> : <><span>{selMethod?.emoji}</span><span>Payer avec {selMethod?.label}</span></>}
              </button>
              <p style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginTop:8 }}>🔒 Paiement 100% sécurisé</p>
            </div>
          </div>
        </div>
      )}

      {/* ── ÉTAPE 2 : Confirmation ── */}
      {step === 2 && (
        <ConfirmationView bookings={bookings} passengers={passengers}
          onNew={() => { resetBookingFlow(); navigate('/'); }}
          onTickets={() => navigate('/bookings')} />
      )}

      {/* Modales */}
      {showModal && isMobile && (
        <MobilePayModal method={payMethod} amount={total} loading={loading}
          onConfirm={processBookings} onClose={() => setShowModal(false)} />
      )}
      {showModal && payMethod==='card' && (
        <CardPayModal amount={total} loading={loading}
          onConfirm={processBookings} onClose={() => setShowModal(false)} />
      )}
      {showModal && payMethod==='paypal' && (
        <Overlay>
          <div style={{ maxWidth:380, width:'100%', background:'var(--bg-card)', border:'1px solid var(--border-md)', borderRadius:'var(--r-xl)', padding:32, textAlign:'center', animation:'fadeUp .3s var(--ease-spring)' }}>
            <div style={{ fontSize:48, marginBottom:14 }}>🅿️</div>
            <h3 style={{ fontFamily:'var(--font-display)', marginBottom:8 }}>Redirection PayPal</h3>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>
              Vous allez être redirigé vers PayPal pour finaliser le paiement de <strong>{FCFA(total)}</strong>.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ flex:1, justifyContent:'center' }}>Annuler</button>
              <button className="btn btn-primary" onClick={processBookings} disabled={loading}
                style={{ flex:2, justifyContent:'center', background:'#0070BA', opacity:loading?.5:1 }}>
                {loading ? <><Spinner/> Traitement…</> : 'Continuer sur PayPal →'}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
