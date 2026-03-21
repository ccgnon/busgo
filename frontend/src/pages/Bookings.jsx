import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking, submitReview, getLoyalty } from '../services/api';
import { useStore } from '../store';

const FCFA = n => Number(n||0).toLocaleString('fr-FR') + ' FCFA';
const API  = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function StarRating({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:4 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} onClick={() => onChange && onChange(n)}
          style={{ fontSize:22, cursor:onChange?'pointer':'default', color: n<=value ? 'var(--gold)' : 'var(--border2)' }}>★</span>
      ))}
    </div>
  );
}

function CMStar({ size=12, color='var(--gold)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

export default function Bookings() {
  const { user, currentBooking } = useStore();
  const [bookings,  setBookings]  = useState([]);
  const [loyalty,   setLoyalty]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm,  setReviewForm]  = useState({ rating:5, comment:'' });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      getMyBookings().then(d => setBookings(d.bookings || [])),
      getLoyalty().then(d => setLoyalty(d)).catch(() => {}),
    ])
    .catch(e => setError(e.error))
    .finally(() => setLoading(false));
  }, [user]);

  async function handleCancel(id) {
    if (!confirm('Annuler cette réservation ?')) return;
    try {
      await cancelBooking(id);
      setBookings(b => b.map(x => x.id===id ? {...x, status:'CANCELLED'} : x));
    } catch (e) { alert(e.error||'Erreur'); }
  }

  async function handleReview() {
    try {
      await submitReview({ bookingId: reviewModal.id, ...reviewForm });
      setReviewModal(null);
      alert('Merci pour votre avis !');
    } catch (e) { alert(e.error||'Erreur'); }
  }

  const displayed = user ? bookings : (currentBooking ? [currentBooking] : []);

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px', position:'relative', zIndex:1 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <CMStar size={16} />
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:900, margin:0 }}>Mes billets</h1>
          </div>
          <div className="flag-stripe" style={{ width:80 }} />
        </div>
        <button onClick={() => navigate('/')} style={{
          background:'linear-gradient(135deg,var(--green-mid),var(--green-light))',
          color:'#fff', border:'none', borderRadius:'var(--radius-md)',
          padding:'10px 20px', fontWeight:700, fontSize:14,
          boxShadow:'0 4px 16px var(--green-glow)',
        }}>+ Nouveau billet</button>
      </div>

      {/* Carte fidélité */}
      {loyalty && (
        <div style={{
          background:'linear-gradient(135deg,var(--green) 0%,var(--green-mid) 100%)',
          borderRadius:'var(--radius-xl)', padding:'20px 24px', marginBottom:24,
          display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:16,
        }}>
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.7)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:4 }}>
              Programme fidélité busGO
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, color:'#fff' }}>
              {loyalty.tierBadge} {loyalty.tierLabel} — {loyalty.points} pts
            </div>
            {loyalty.nextTier && (
              <div style={{ fontSize:12, color:'rgba(255,255,255,.75)', marginTop:4 }}>
                Encore {loyalty.nextTier.needed} pts pour atteindre {loyalty.nextTier.name}
              </div>
            )}
            {loyalty.discount > 0 && (
              <div style={{ marginTop:6, display:'inline-block', background:'var(--gold)', color:'#412402', padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:700 }}>
                {(loyalty.discount*100).toFixed(0)}% de réduction sur vos trajets
              </div>
            )}
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.7)', marginBottom:4 }}>Code parrainage</div>
            <div style={{ fontFamily:'monospace', fontSize:18, fontWeight:900, color:'var(--gold)', letterSpacing:3 }}>
              {loyalty.referralCode}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', marginTop:2 }}>
              {loyalty.referrals} parrainages
            </div>
          </div>
        </div>
      )}

      {!user && !currentBooking && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:'60px 24px', textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16, opacity:.25 }}>🎫</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, marginBottom:8 }}>
            Connectez-vous pour voir vos billets
          </div>
          <button onClick={() => navigate('/')} style={{
            background:'var(--green-mid)', color:'#fff', border:'none',
            borderRadius:'var(--radius-md)', padding:'12px 28px', fontWeight:700,
          }}>Retour à l'accueil</button>
        </div>
      )}

      {loading && <div style={{ textAlign:'center', color:'var(--muted)', padding:40 }}>⏳ Chargement…</div>}
      {error   && <div style={{ color:'var(--danger)', marginBottom:16 }}>{error}</div>}

      {displayed.map(b => {
        const confirmed = b.status==='CONFIRMED'||b.status==='confirmed';
        const validated = b.status==='VALIDATED';
        const cancelled = b.status==='CANCELLED'||b.status==='cancelled';
        const statusColor = confirmed?'var(--success)': validated?'var(--green-light)': cancelled?'var(--danger)':'var(--muted)';
        const statusBg    = confirmed?'rgba(45,184,102,.15)': validated?'rgba(35,144,79,.15)': cancelled?'rgba(239,68,68,.12)':'rgba(139,154,179,.12)';
        const statusLabel = confirmed?'✓ Confirmé': validated?'✅ Validé': cancelled?'✗ Annulé':'Expiré';

        return (
          <div key={b.id} className="fade-in" style={{
            background: confirmed||validated
              ? 'linear-gradient(135deg,var(--surface),var(--surface2))'
              : 'rgba(239,68,68,.04)',
            border: `1.5px solid ${confirmed||validated ? 'var(--border2)' : 'rgba(239,68,68,.2)'}`,
            borderRadius:'var(--radius-xl)', marginBottom:16, overflow:'hidden',
          }}>
            {(confirmed||validated) && <div className="flag-stripe" />}

            <div style={{ padding:'20px 24px' }}>
              {/* En-tête */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, lineHeight:1 }}>
                    {b.trip?.from||b.from} <span style={{ color:'var(--gold)' }}>→</span> {b.trip?.to||b.to}
                  </div>
                  <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{b.trip?.company||b.company}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                  <span style={{ background:statusBg, color:statusColor, padding:'4px 12px', borderRadius:99, fontSize:11, fontWeight:700 }}>
                    {statusLabel}
                  </span>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--gold)' }}>
                    {FCFA(b.totalPrice)}
                  </div>
                </div>
              </div>

              {/* Détails */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
                {[
                  ['📅 Date',    b.travelDate],
                  ['🕐 Départ',  b.trip?.dep||b.trip?.depTime||'—'],
                  ['💺 Siège',   `N° ${b.seatNum||b.seat}`],
                  ['👥 Pax',     b.pax],
                ].map(([k,v]) => (
                  <div key={k} style={{ background:'var(--bg)', borderRadius:'var(--radius-md)', padding:'10px 14px', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:10, color:'var(--muted)', marginBottom:4 }}>{k}</div>
                    <div style={{ fontSize:14, fontWeight:700 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Code de validation */}
              {(confirmed||validated) && b.validationCode && (
                <div style={{
                  background:'rgba(35,144,79,.1)', border:'1px solid var(--border2)',
                  borderRadius:'var(--radius-md)', padding:'10px 16px',
                  display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12,
                }}>
                  <div>
                    <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:2 }}>Code de validation</div>
                    <div style={{ fontFamily:'monospace', fontSize:22, fontWeight:900, letterSpacing:5, color:'var(--green-light)' }}>
                      {b.validationCode}
                    </div>
                  </div>
                  {b.loyaltyEarned > 0 && (
                    <div style={{ background:'var(--gold-glow)', border:'1px solid var(--gold)', borderRadius:8, padding:'6px 12px', textAlign:'center' }}>
                      <div style={{ fontSize:10, color:'var(--muted)' }}>Points gagnés</div>
                      <div style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>+{b.loyaltyEarned}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Référence + actions */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                <div style={{ fontFamily:'monospace', fontSize:12, color:'var(--muted)' }}>
                  Réf : <strong style={{ color:'var(--text)' }}>{b.id}</strong>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {b.pdfUrl && (
                    <a href={`${API}${b.pdfUrl}`} target="_blank" rel="noreferrer"
                      style={{ background:'var(--green-glow)', color:'var(--green-light)', border:'1px solid var(--border2)', borderRadius:'var(--radius-sm)', padding:'6px 14px', fontSize:12, fontWeight:600, textDecoration:'none' }}>
                      📄 Billet PDF
                    </a>
                  )}
                  {(confirmed||validated) && (
                    <button onClick={() => { setReviewModal(b); setReviewForm({rating:5,comment:''}); }}
                      style={{ background:'var(--gold-glow)', color:'var(--gold)', border:'1px solid rgba(232,160,32,.3)', borderRadius:'var(--radius-sm)', padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      ⭐ Noter
                    </button>
                  )}
                  {confirmed && (
                    <button onClick={() => handleCancel(b.id)}
                      style={{ background:'transparent', color:'var(--danger)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'var(--radius-sm)', padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Modal avis */}
      {reviewModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}
          onClick={e => e.target===e.currentTarget && setReviewModal(null)}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:'var(--radius-xl)', padding:28, width:400, maxWidth:'90vw' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, marginBottom:16 }}>
              ⭐ Notez votre voyage
            </div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16 }}>
              {reviewModal.trip?.from} → {reviewModal.trip?.to} · {reviewModal.travelDate}
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>Note</div>
              <StarRating value={reviewForm.rating} onChange={r => setReviewForm(f=>({...f,rating:r}))} />
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6 }}>Commentaire (optionnel)</div>
              <textarea value={reviewForm.comment} onChange={e => setReviewForm(f=>({...f,comment:e.target.value}))}
                placeholder="Décrivez votre expérience..."
                style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 12px', color:'var(--text)', fontSize:13, outline:'none', resize:'vertical', minHeight:80, boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleReview} style={{ flex:1, background:'linear-gradient(135deg,var(--green-mid),var(--green-light))', color:'#fff', border:'none', borderRadius:8, padding:12, fontWeight:700, fontSize:14, cursor:'pointer' }}>
                Envoyer l'avis
              </button>
              <button onClick={() => setReviewModal(null)} style={{ flex:1, background:'transparent', color:'var(--muted)', border:'1px solid var(--border)', borderRadius:8, padding:12, cursor:'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
