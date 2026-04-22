import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking, submitReview, getLoyalty } from '../services/api';
import { useStore } from '../store';
import { useNotif } from '../components/NotificationSystem';

const FCFA = n => Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
const API  = (import.meta.env?.VITE_API_URL || '/api').replace('/api', '');

const STATUS = {
  CONFIRMED: { label:'Confirmé', icon:'✅', color:'var(--c-green-300)', bg:'rgba(45,184,102,.12)', border:'rgba(45,184,102,.25)' },
  VALIDATED: { label:'Validé',   icon:'✔️', color:'#22c55e',            bg:'rgba(34,197,94,.12)',  border:'rgba(34,197,94,.25)' },
  CANCELLED: { label:'Annulé',   icon:'❌', color:'var(--c-red-400)',   bg:'rgba(192,57,43,.12)', border:'rgba(192,57,43,.2)' },
  EXPIRED:   { label:'Expiré',   icon:'⏰', color:'var(--text-muted)',  bg:'rgba(90,130,100,.1)', border:'var(--border)' },
};

/* ── Modal de confirmation d'annulation ──────────────────────────────────── */
function CancelModal({ booking, onConfirm, onClose, loading }) {
  if (!booking) return null;
  const hours = booking.travelDate
    ? Math.floor((new Date(`${booking.travelDate}T${booking.trip?.dep || '08:00'}`) - Date.now()) / 3600000)
    : null;

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal scale-in" style={{ maxWidth: 440 }}>
        {/* Icône warning */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
            background: 'rgba(192,57,43,.12)', border: '1px solid rgba(192,57,43,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
            Annuler cette réservation ?
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Cette action est <strong style={{ color: 'var(--c-red-400)' }}>irréversible</strong>.
            Le siège sera libéré immédiatement.
          </p>
        </div>

        {/* Récap billet */}
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-md)',
          borderRadius: 'var(--r-lg)', padding: '16px 18px', marginBottom: 20,
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, marginBottom: 10 }}>
            {booking.trip?.from} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>→</span> {booking.trip?.to}
          </div>
          {[
            ['Date',      booking.travelDate],
            ['Départ',    booking.trip?.dep || booking.trip?.depTime || '—'],
            ['Siège',     `N° ${booking.seatNum}`],
            ['Total payé', FCFA(booking.totalPrice)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Avertissement délai */}
        {hours !== null && (
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--r-md)', marginBottom: 18, fontSize: 12,
            ...(hours < 2
              ? { background: 'rgba(192,57,43,.1)', border: '1px solid rgba(192,57,43,.3)', color: 'var(--c-red-400)' }
              : { background: 'rgba(232,160,32,.08)', border: '1px solid rgba(232,160,32,.25)', color: 'var(--c-gold-300)' }),
          }}>
            {hours < 2
              ? `⚠️ Départ dans moins de 2h — le remboursement ne sera pas garanti.`
              : `ℹ️ Départ dans ${hours}h. Remboursement traité sous 48-72h ouvrables.`}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
            Garder mon billet
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 'var(--r-md)', border: 'none',
              background: 'var(--c-red-500)', color: '#fff', fontWeight: 700, fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1,
              transition: 'all .15s',
            }}>
            {loading
              ? <><Spinner color="#fff"/> Annulation…</>
              : '❌ Confirmer l\'annulation'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Spinner ─────────────────────────────────────────────────────────────── */
function Spinner({ color = '#fff', size = 14 }) {
  return <span style={{ display:'inline-block', width:size, height:size, border:`2px solid rgba(255,255,255,.25)`, borderTopColor:color, borderRadius:'50%', animation:'spin 1s linear infinite' }}/>;
}

/* ── Copier dans le presse-papier ───────────────────────────────────────── */
function CopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      title="Copier"
      style={{
        background: copied ? 'rgba(35,144,79,.2)' : 'rgba(255,255,255,.07)',
        border: `1px solid ${copied ? 'rgba(35,144,79,.4)' : 'rgba(255,255,255,.1)'}`,
        borderRadius: 'var(--r-sm)', padding: '3px 10px', fontSize: 11, fontWeight: 600,
        color: copied ? 'var(--c-green-300)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all .2s',
      }}>
      {copied ? '✓ Copié' : (label || 'Copier')}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE MES BILLETS
════════════════════════════════════════════════════════════════════════════ */
export default function Bookings() {
  const { user, currentBooking } = useStore();
  const navigate  = useNavigate();
  const { success, error: notifError, info } = useNotif();

  const [bookings,     setBookings]     = useState([]);
  const [loyalty,      setLoyalty]      = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);  // booking à annuler
  const [cancelling,   setCancelling]   = useState(false);
  const [reviewModal,  setReview]       = useState(null);
  const [rating,       setRating]       = useState(5);
  const [comment,      setComment]      = useState('');
  const [reviewLoading,setRevLoading]   = useState(false);
  const [filter,       setFilter]       = useState('all');
  const [expanded,     setExpanded]     = useState(null);   // id du billet ouvert (mobile)

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [bookingsData, loyaltyData] = await Promise.allSettled([
        getMyBookings(),
        getLoyalty(),
      ]);
      if (bookingsData.status === 'fulfilled') setBookings(bookingsData.value.bookings || []);
      if (loyaltyData.status  === 'fulfilled') setLoyalty(loyaltyData.value);
    } catch (e) {
      notifError('Erreur de chargement des billets');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Annulation ── */
  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelBooking(cancelTarget.id);
      setBookings(bs => bs.map(b => b.id === cancelTarget.id ? { ...b, status: 'CANCELLED', cancelledAt: new Date().toISOString() } : b));
      success(`Réservation ${cancelTarget.id} annulée`, { title: 'Annulation confirmée' });
      setCancelTarget(null);
    } catch (e) {
      notifError(e.error || 'Erreur lors de l\'annulation');
    } finally {
      setCancelling(false);
    }
  }

  /* ── Avis ── */
  async function handleReview() {
    setRevLoading(true);
    try {
      await submitReview({ bookingId: reviewModal.id, rating, comment });
      setReview(null);
      success('Merci pour votre avis ! Il aide les autres voyageurs.', { title: 'Avis enregistré' });
    } catch (e) {
      notifError(e.error || 'Erreur lors de l\'envoi de l\'avis');
    } finally {
      setRevLoading(false);
    }
  }

  const displayed = user
    ? bookings.filter(b => filter === 'all' || b.status === filter)
    : currentBooking ? [currentBooking] : [];

  const counts = {
    all:       bookings.length,
    CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
    VALIDATED: bookings.filter(b => b.status === 'VALIDATED').length,
    CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length,
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px 80px' }}>

      {/* ── Header ── */}
      <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,5vw,32px)', fontWeight: 900, marginBottom: 6 }}>
            Mes billets
          </h1>
          <div style={{ height: 3, width: 50, background: 'linear-gradient(90deg,var(--c-green-400),var(--c-gold-400))', borderRadius: 'var(--r-full)' }}/>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ padding: '10px 20px', fontSize: 13 }}>
          + Réserver un billet
        </button>
      </div>

      {/* ── Non connecté ── */}
      {!user && !currentBooking && (
        <div className="card fade-up" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: .2 }}>🎫</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>Connectez-vous pour voir vos billets</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>Tous vos billets sont sauvegardés dans votre compte</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Se connecter</button>
        </div>
      )}

      {/* ── Carte fidélité ── */}
      {loyalty && (
        <div className="fade-up delay-1" style={{
          background: 'linear-gradient(135deg,var(--c-green-800) 0%,var(--c-green-700) 50%,rgba(200,134,10,.2) 100%)',
          border: '1px solid var(--border-md)', borderRadius: 'var(--r-xl)',
          padding: '20px 24px', marginBottom: 24,
          boxShadow: 'var(--glow-green)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 10, color: 'var(--c-green-200)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, fontWeight: 700 }}>
                Programme fidélité
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,4vw,22px)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>{loyalty.tierBadge}</span>
                <span>{loyalty.tierLabel}</span>
                <span style={{ color: 'var(--c-gold-400)' }}>· {loyalty.points} pts</span>
              </div>
              {loyalty.nextTier && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--c-green-200)', marginBottom: 4 }}>
                    <span>{loyalty.points} pts</span>
                    <span>{loyalty.nextTier.needed} pts restants → {loyalty.nextTier.name}</span>
                  </div>
                  <div className="progress-bar" style={{ maxWidth: 260 }}>
                    <div className="progress-fill" style={{ width: `${Math.min(100, (loyalty.points / (loyalty.points + loyalty.nextTier.needed)) * 100)}%` }}/>
                  </div>
                </div>
              )}
              {loyalty.discount > 0 && (
                <div style={{ marginTop: 10, display: 'inline-block', background: 'rgba(232,160,32,.15)', border: '1px solid rgba(232,160,32,.3)', borderRadius: 'var(--r-full)', padding: '3px 12px', fontSize: 11, fontWeight: 700, color: 'var(--c-gold-300)' }}>
                  🎁 {(loyalty.discount * 100).toFixed(0)}% de réduction active
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--c-green-200)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Code parrainage</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(16px,3vw,20px)', fontWeight: 700, color: 'var(--c-gold-400)', letterSpacing: 3 }}>
                {loyalty.referralCode}
              </div>
              <div style={{ fontSize: 11, color: 'var(--c-green-200)', marginTop: 4 }}>
                {loyalty.referrals} parrainage{loyalty.referrals !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Filtres ── */}
      {bookings.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }} className="fade-up delay-2">
          {[['all','Tous'],['CONFIRMED','Confirmés'],['VALIDATED','Validés'],['CANCELLED','Annulés']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: '7px 14px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600,
              border: filter === k ? '1px solid var(--c-green-400)' : '1px solid var(--border-md)',
              background: filter === k ? 'var(--c-green-700)' : 'var(--bg-elevated)',
              color: filter === k ? 'var(--c-green-100)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all .12s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {l}
              {counts[k] > 0 && (
                <span style={{ background: filter === k ? 'rgba(255,255,255,.2)' : 'var(--border-md)', borderRadius: 'var(--r-full)', padding: '1px 7px', fontSize: 10 }}>
                  {counts[k]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Skeletons ── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--r-lg)' }}/>)}
        </div>
      )}

      {/* ── Aucun billet ── */}
      {!loading && user && displayed.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: .3 }}>🎫</div>
          <div style={{ fontSize: 15, marginBottom: 16 }}>
            {filter === 'all' ? 'Vous n\'avez aucun billet pour le moment' : `Aucun billet "${filter.toLowerCase()}" trouvé`}
          </div>
          {filter === 'all' && (
            <button className="btn btn-primary" onClick={() => navigate('/')}>Réserver maintenant →</button>
          )}
        </div>
      )}

      {/* ── Liste des billets ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {displayed.map((b, i) => {
          const st       = STATUS[b.status] || STATUS.CONFIRMED;
          const isActive = b.status === 'CONFIRMED';
          const isOpen   = expanded === b.id;

          return (
            <div key={b.id} className={`fade-up delay-${Math.min(i + 1, 5)}`}
              style={{
                background: 'var(--bg-card)', borderRadius: 'var(--r-lg)',
                border: `1px solid ${isActive ? 'var(--border-md)' : 'var(--border)'}`,
                overflow: 'hidden',
                opacity: b.status === 'CANCELLED' ? .65 : 1,
                transition: 'all .2s',
              }}>

              {/* Barre de statut colorée */}
              <div style={{ height: 3, background: `linear-gradient(90deg,${st.color} 0%,transparent 100%)` }}/>

              {/* ── Header billet (toujours visible) ── */}
              <div
                style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}
                onClick={() => setExpanded(isOpen ? null : b.id)}>

                {/* Trajet + compagnie */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(15px,3vw,19px)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    {b.trip?.from || '—'}
                    <span style={{ color: 'var(--c-gold-400)', fontSize: 14 }}>→</span>
                    {b.trip?.to || '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                    {b.trip?.company || '—'} · {b.travelDate} · {b.trip?.dep || b.trip?.depTime || '—'}
                  </div>
                </div>

                {/* Prix + statut + chevron */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{
                    background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                    padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {st.icon} {st.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,3vw,18px)', fontWeight: 900, color: 'var(--c-gold-400)' }}>
                    {FCFA(b.totalPrice)}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, transition: 'transform .2s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                    ▼
                  </span>
                </div>
              </div>

              {/* ── Détails dépliants ── */}
              {isOpen && (
                <div style={{ padding: '0 18px 18px', animation: 'fadeUp .25s ease' }}>
                  <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }}/>

                  {/* Grid infos */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8, marginBottom: 16 }}>
                    {[
                      ['🗓️ Date',      b.travelDate],
                      ['🕐 Départ',    b.trip?.dep || b.trip?.depTime || '—'],
                      ['💺 Siège',     `N° ${b.seatNum || b.seat || '—'}`],
                      ['👥 Passagers', `${b.pax || 1}`],
                      ['💳 Paiement',  b.paymentMethod?.replace('_',' ') || '—'],
                      ...(b.pax > 1 ? [['💵 Prix unitaire', FCFA((b.totalPrice - 500) / (b.pax || 1))]] : []),
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600 }}>{k}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Code validation */}
                  {(isActive || b.status === 'VALIDATED') && b.validationCode && (
                    <div style={{
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-md)',
                      borderRadius: 'var(--r-lg)', padding: '14px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 12, flexWrap: 'wrap', marginBottom: 14,
                    }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>
                          Code de validation — à présenter au contrôleur
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(22px,5vw,30px)', fontWeight: 700, letterSpacing: 8, color: 'var(--c-green-300)' }}>
                            {b.validationCode}
                          </div>
                          <CopyBtn text={b.validationCode} label="Copier"/>
                        </div>
                      </div>
                      {b.loyaltyEarned > 0 && (
                        <div style={{ background: 'rgba(232,160,32,.1)', border: '1px solid rgba(232,160,32,.2)', borderRadius: 'var(--r-md)', padding: '8px 14px', textAlign: 'center', flexShrink: 0 }}>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Points gagnés</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-gold-400)' }}>+{b.loyaltyEarned}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Référence */}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{b.id}</span>
                    <CopyBtn text={b.id} label="Copier la référence"/>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {b.pdfUrl && (
                      <a href={`${API}${b.pdfUrl}`} target="_blank" rel="noreferrer"
                        className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 12 }}>
                        📄 Télécharger le billet PDF
                      </a>
                    )}
                    {(isActive || b.status === 'VALIDATED') && (
                      <button className="btn btn-ghost"
                        style={{ padding: '8px 16px', fontSize: 12, color: 'var(--c-gold-400)', borderColor: 'rgba(232,160,32,.3)' }}
                        onClick={() => { setReview(b); setRating(5); setComment(''); }}>
                        ⭐ Laisser un avis
                      </button>
                    )}
                    {isActive && (
                      <button
                        onClick={() => setCancelTarget(b)}
                        style={{
                          padding: '8px 16px', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 600,
                          background: 'transparent', color: 'var(--c-red-400)',
                          border: '1px solid rgba(192,57,43,.35)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        ❌ Annuler la réservation
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Modal confirmation annulation ── */}
      <CancelModal
        booking={cancelTarget}
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelTarget(null)}
      />

      {/* ── Modal avis ── */}
      {reviewModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setReview(null)}>
          <div className="modal scale-in" style={{ maxWidth: 440 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                ⭐ Notez votre voyage
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {reviewModal.trip?.from} → {reviewModal.trip?.to} · {reviewModal.travelDate}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)} style={{
                  fontSize: 32, background: 'none', border: 'none', cursor: 'pointer',
                  filter: n <= rating ? 'none' : 'grayscale(1) opacity(.35)',
                  transform: n <= rating ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all .15s',
                }}>⭐</button>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .7, fontWeight: 700 }}>
                Commentaire (optionnel)
              </label>
              <textarea className="input" value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Partagez votre expérience : confort, ponctualité, service…"
                rows={4} style={{ resize: 'vertical' }}/>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setReview(null)} style={{ flex: 1, justifyContent: 'center' }}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={handleReview} disabled={reviewLoading}
                style={{ flex: 1, justifyContent: 'center' }}>
                {reviewLoading ? <><Spinner/> Envoi…</> : 'Envoyer mon avis'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
