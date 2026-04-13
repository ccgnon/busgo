import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking, submitReview, getLoyalty } from '../services/api';
import { useStore } from '../store';
import { useNotif } from '../components/NotificationSystem';

const FCFA = n => Number(n||0).toLocaleString('fr-FR') + ' FCFA';
const API  = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:4000';

const STATUS_MAP = {
  CONFIRMED: { label:'Confirmé', color:'var(--c-green-300)', bg:'rgba(45,184,102,.12)' },
  VALIDATED: { label:'Validé',   color:'#22c55e',            bg:'rgba(34,197,94,.12)' },
  CANCELLED: { label:'Annulé',   color:'var(--c-red-400)',   bg:'rgba(192,57,43,.12)' },
  EXPIRED:   { label:'Expiré',   color:'var(--text-muted)',  bg:'rgba(90,130,100,.1)' },
};

export default function Bookings() {
  const { user, currentBooking } = useStore();
  const navigate = useNavigate();
  const [bookings,  setBookings]  = useState([]);
  const [loyalty,   setLoyalty]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [reviewModal, setReview]  = useState(null);
  const [rating,    setRating]    = useState(5);
  const [comment,   setComment]   = useState('');
  const [filter,    setFilter]    = useState('all');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      getMyBookings().then(d => setBookings(d.bookings || [])),
      getLoyalty().then(setLoyalty).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  async function handleCancel(id) {
    if (!confirm('Annuler cette réservation ?')) return;
    await cancelBooking(id);
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status:'CANCELLED' } : b));
  }

  async function handleReview() {
    await submitReview({ bookingId: reviewModal.id, rating, comment });
    setReview(null);
    alert('Merci pour votre avis !');
  }

  const displayed = user
    ? bookings.filter(b => filter === 'all' || b.status === filter)
    : currentBooking ? [currentBooking] : [];

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'40px 24px 80px' }}>

      {/* ── Header ── */}
      <div className="fade-up" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:32 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:900, marginBottom:8 }}>
            Mes billets
          </h1>
          <div style={{ height:3, width:60, background:'linear-gradient(90deg,var(--c-green-400),var(--c-gold-400))', borderRadius:'var(--r-full)' }}/>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          + Réserver
        </button>
      </div>

      {/* ── Carte fidélité ── */}
      {loyalty && (
        <div className="fade-up delay-1" style={{
          background:'linear-gradient(135deg,var(--c-green-800) 0%,var(--c-green-700) 50%,rgba(200,134,10,.2) 100%)',
          border:'1px solid var(--border-md)',
          borderRadius:'var(--r-xl)',
          padding:'24px 28px',
          marginBottom:28,
          display:'grid',
          gridTemplateColumns:'1fr auto',
          alignItems:'center',
          gap:16,
          boxShadow:'var(--glow-green)',
        }}>
          <div>
            <div style={{ fontSize:11, color:'var(--c-green-200)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>
              Programme fidélité busGO
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, display:'flex', alignItems:'center', gap:10 }}>
              <span>{loyalty.tierBadge}</span>
              <span>{loyalty.tierLabel}</span>
              <span style={{ color:'var(--c-gold-400)' }}>· {loyalty.points} pts</span>
            </div>
            {loyalty.nextTier && (
              <div style={{ marginTop:8 }}>
                <div style={{ height:4, background:'rgba(255,255,255,.1)', borderRadius:'var(--r-full)', overflow:'hidden', maxWidth:240 }}>
                  <div style={{
                    height:'100%',
                    width: `${Math.min(100, (loyalty.points / loyalty.nextTier.points) * 100)}%`,
                    background:'linear-gradient(90deg,var(--c-green-400),var(--c-gold-400))',
                    borderRadius:'var(--r-full)',
                    transition:'width .5s',
                  }}/>
                </div>
                <div style={{ fontSize:12, color:'var(--c-green-200)', marginTop:6 }}>
                  {loyalty.nextTier.needed} pts pour {loyalty.nextTier.name}
                </div>
              </div>
            )}
            {loyalty.discount > 0 && (
              <div style={{ marginTop:10, display:'inline-block', background:'rgba(232,160,32,.15)', border:'1px solid rgba(232,160,32,.3)', borderRadius:'var(--r-full)', padding:'4px 12px', fontSize:12, fontWeight:600, color:'var(--c-gold-300)' }}>
                🎁 {(loyalty.discount*100).toFixed(0)}% de réduction active
              </div>
            )}
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:'var(--c-green-200)', marginBottom:4 }}>Code parrainage</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:20, fontWeight:700, color:'var(--c-gold-400)', letterSpacing:3 }}>
              {loyalty.referralCode}
            </div>
            <div style={{ fontSize:11, color:'var(--c-green-200)', marginTop:4 }}>
              {loyalty.referrals} parrainage{loyalty.referrals !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* ── Filtres ── */}
      {bookings.length > 0 && (
        <div className="tabs fade-up delay-2" style={{ marginBottom:20 }}>
          {[['all','Tous'],['CONFIRMED','Confirmés'],['VALIDATED','Validés'],['CANCELLED','Annulés']].map(([k,l]) => (
            <button key={k} className={`tab ${filter===k?'active':''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      )}

      {/* ── Liste billets ── */}
      {!user && !currentBooking && (
        <div className="card fade-up" style={{ textAlign:'center', padding:'60px 24px' }}>
          <div style={{ fontSize:48, marginBottom:16, opacity:.2 }}>🎫</div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, marginBottom:8 }}>
            Connectez-vous pour voir vos billets
          </h2>
          <p style={{ color:'var(--text-muted)', marginBottom:24, fontSize:14 }}>
            Tous vos billets sont sauvegardés dans votre compte
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Se connecter
          </button>
        </div>
      )}

      {loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:140, borderRadius:'var(--r-lg)' }}/>)}
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {displayed.map((b, i) => {
          const st = STATUS_MAP[b.status] || STATUS_MAP.CONFIRMED;
          const isActive = b.status === 'CONFIRMED';

          return (
            <div key={b.id} className={`fade-up delay-${Math.min(i+1,4)}`} style={{
              background:'var(--bg-card)',
              border:`1px solid ${isActive ? 'var(--border-md)' : 'var(--border)'}`,
              borderRadius:'var(--r-xl)',
              overflow:'hidden',
              opacity: b.status === 'CANCELLED' ? .7 : 1,
            }}>
              {/* Barre statut */}
              <div style={{ height:3, background:`linear-gradient(90deg,${st.color},transparent)` }}/>

              <div style={{ padding:'20px 24px' }}>
                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, display:'flex', alignItems:'center', gap:8 }}>
                      {b.trip?.from || b.from}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-gold-400)" strokeWidth="2" strokeLinecap="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                      {b.trip?.to || b.to}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
                      {b.trip?.company || b.company}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ background:st.bg, color:st.color, padding:'4px 12px', borderRadius:'var(--r-full)', fontSize:11, fontWeight:700 }}>
                      {st.label}
                    </span>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color:'var(--c-gold-400)' }}>
                      {FCFA(b.totalPrice)}
                    </div>
                  </div>
                </div>

                {/* Détails grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
                  {[
                    ['📅 Date',   b.travelDate],
                    ['🕐 Départ', b.trip?.dep || b.trip?.depTime || '—'],
                    ['💺 Siège',  `N° ${b.seatNum || b.seat}`],
                    ['👥 Pax',    b.pax],
                  ].map(([k,v]) => (
                    <div key={k} style={{ background:'var(--bg-elevated)', borderRadius:'var(--r-md)', padding:'10px 12px', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:3 }}>{k}</div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Code de validation */}
                {(isActive || b.status === 'VALIDATED') && b.validationCode && (
                  <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-md)', borderRadius:'var(--r-lg)', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <div>
                      <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>
                        Code de validation
                      </div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:26, fontWeight:700, letterSpacing:6, color:'var(--c-green-300)' }}>
                        {b.validationCode}
                      </div>
                    </div>
                    {b.loyaltyEarned > 0 && (
                      <div style={{ background:'rgba(232,160,32,.1)', border:'1px solid rgba(232,160,32,.2)', borderRadius:'var(--r-md)', padding:'8px 14px', textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'var(--text-muted)' }}>Points gagnés</div>
                        <div style={{ fontSize:18, fontWeight:800, color:'var(--c-gold-400)' }}>+{b.loyaltyEarned}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer actions */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>
                    {b.id}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    {b.pdfUrl && (
                      <a href={`${API}${b.pdfUrl}`} target="_blank" rel="noreferrer"
                        className="btn btn-ghost" style={{ padding:'7px 14px', fontSize:12 }}>
                        📄 Billet PDF
                      </a>
                    )}
                    {(isActive || b.status === 'VALIDATED') && (
                      <button className="btn btn-ghost" style={{ padding:'7px 14px', fontSize:12, color:'var(--c-gold-400)', borderColor:'rgba(232,160,32,.3)' }}
                        onClick={() => { setReview(b); setRating(5); setComment(''); }}>
                        ⭐ Noter
                      </button>
                    )}
                    {isActive && (
                      <button className="btn btn-danger" style={{ padding:'7px 14px', fontSize:12 }}
                        onClick={() => handleCancel(b.id)}>
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal avis ── */}
      {reviewModal && (
        <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && setReview(null)}>
          <div className="modal">
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, marginBottom:6 }}>
              ⭐ Noter votre voyage
            </h2>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>
              {reviewModal.trip?.from} → {reviewModal.trip?.to} · {reviewModal.travelDate}
            </p>

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:10 }}>Note</div>
              <div style={{ display:'flex', gap:8 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setRating(n)}
                    style={{ fontSize:28, background:'none', border:'none', cursor:'pointer', filter: n <= rating ? 'none' : 'grayscale(1) opacity(.4)', transition:'all .1s', transform: n <= rating ? 'scale(1.1)' : 'scale(1)' }}>
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Commentaire (optionnel)</label>
              <textarea className="input" value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Partagez votre expérience…"
                style={{ resize:'vertical', minHeight:80 }}/>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-primary" onClick={handleReview} style={{ flex:1, justifyContent:'center' }}>
                Envoyer
              </button>
              <button className="btn btn-ghost" onClick={() => setReview(null)} style={{ flex:1, justifyContent:'center' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
