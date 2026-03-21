import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
  agencyMe, agencyStats, agencyTrips,
  agencyCreateTrip, agencyPatchTrip, agencyDeleteTrip,
  agencyBookings,
} from '../services/api';

const FCFA = n => Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
const STATIONS = ['Yaoundé','Douala','Bafoussam','Bamenda','Ngaoundéré','Garoua','Kribi','Buea','Ebolowa','Bertoua','Maroua','Limbé'];
const AMENITIES_OPT = ['ac','wifi','usb','snacks','toilet'];

function StatCard({ label, value, sub, color='var(--gold)' }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'16px 20px' }}>
      <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, fontFamily:'var(--font-display)', color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function Badge({ s }) {
  const map = {
    CONFIRMED:{ bg:'rgba(45,184,102,.15)', c:'var(--success)', l:'Confirmé' },
    CANCELLED:{ bg:'rgba(239,68,68,.12)', c:'var(--danger)', l:'Annulé' },
    VALIDATED:{ bg:'rgba(35,144,79,.15)', c:'var(--green-light)', l:'Validé' },
  };
  const x = map[s] || map.CONFIRMED;
  return <span style={{ background:x.bg, color:x.c, padding:'2px 10px', borderRadius:99, fontSize:11, fontWeight:600 }}>{x.l}</span>;
}

export default function AgencyPortal() {
  const { user } = useStore();
  const navigate  = useNavigate();
  const [tab,     setTab]     = useState('dashboard');
  const [agency,  setAgency]  = useState(null);
  const [stats,   setStats]   = useState(null);
  const [trips,   setTrips]   = useState([]);
  const [bookings,setBookings]= useState([]);
  const [loading, setLoading] = useState(false);
  const [modal,   setModal]   = useState(null);
  const [editTrip,setEditTrip]= useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await agencyMe();
      setAgency(me);
      if (tab === 'dashboard') { const r = await agencyStats(); setStats(r); }
      if (tab === 'trips')     { const r = await agencyTrips(); setTrips(r.trips || []); }
      if (tab === 'bookings')  { const r = await agencyBookings(); setBookings(r.bookings || []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  if (!user) {
    navigate('/login');
    return null;
  }
  if (!['AGENCY','ADMIN'].includes(user.role)) return (
    <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--muted)' }}>
      <div style={{ fontSize:48, opacity:.2, marginBottom:16 }}>🏢</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:8 }}>Portail Agence</div>
      <div style={{ fontSize:13, marginBottom:20 }}>Votre compte ({user.role}) n'est pas un compte agence.</div>
      <button onClick={() => navigate('/login')} style={btnPrimary}>Se connecter avec un compte Agence</button>
    </div>
  );

  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'28px 24px', position:'relative', zIndex:1 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,var(--green-mid),var(--gold))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏢</div>
            <div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, margin:0 }}>
                {agency?.name || 'Portail Agence'}
              </h1>
              <div style={{ fontSize:11, color:'var(--muted)' }}>{agency?.email}</div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[['dashboard','📊 Tableau de bord'],['trips','🚌 Mes trajets'],['bookings','🎫 Réservations']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              ...btnGhost,
              background: tab===k ? 'var(--green-glow)' : 'transparent',
              borderColor: tab===k ? 'var(--green-mid)' : 'var(--border)',
              color: tab===k ? 'var(--green-light)' : 'var(--muted)',
              fontWeight: tab===k ? 600 : 400,
            }}>{l}</button>
          ))}
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', color:'var(--muted)', padding:32 }}>⏳ Chargement...</div>}

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && stats && (
        <div className="fade-in">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
            <StatCard label="Trajets actifs"  value={stats.trips?.active}    sub={`${stats.trips?.total} au total`} color="var(--green-light)" />
            <StatCard label="Recettes FCFA"   value={FCFA(stats.revenue?.total)} sub={`${stats.revenue?.bookings} réservations`} />
            <StatCard label="Panier moyen"    value={FCFA(stats.revenue?.average)} color="var(--muted)" />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Réservations récentes */}
            <div style={card}>
              <div style={secTitle}>Réservations récentes</div>
              {(stats.recentBookings||[]).length === 0 && (
                <div style={{ color:'var(--muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucune réservation</div>
              )}
              {(stats.recentBookings||[]).map(b => (
                <div key={b.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                  <div>
                    <div style={{ fontFamily:'monospace', fontSize:11, color:'var(--green-light)' }}>{b.id}</div>
                    <div style={{ color:'var(--muted)', fontSize:11 }}>{b.trip?.from} → {b.trip?.to} · {b.travelDate}</div>
                    {b.passengerName && <div style={{ fontSize:11 }}>{b.passengerName}</div>}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <Badge s={b.status} />
                    <div style={{ color:'var(--gold)', fontSize:11, marginTop:2 }}>{FCFA(b.totalPrice)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info agence */}
            <div style={card}>
              <div style={secTitle}>Mon agence</div>
              {agency && (
                <div style={{ fontSize:13 }}>
                  {[
                    ['Nom',        agency.name],
                    ['Email',      agency.email],
                    ['Téléphone',  agency.phone || '—'],
                    ['Statut',     agency.active ? '✅ Active' : '❌ Inactive'],
                    ['Vérifiée',   agency.verified ? '✅ Oui' : '⏳ En attente'],
                    ['Trajets',    agency._count?.trips || '—'],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ color:'var(--muted)' }}>{k}</span>
                      <span style={{ fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MES TRAJETS ── */}
      {tab === 'trips' && (
        <div className="fade-in">
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
            <button onClick={() => setModal('newTrip')} style={btnPrimary}>+ Ajouter un trajet</button>
          </div>

          {trips.length === 0 && !loading && (
            <div style={{ ...card, textAlign:'center', padding:'48px 20px' }}>
              <div style={{ fontSize:48, opacity:.2, marginBottom:12 }}>🚌</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:18, marginBottom:8 }}>Aucun trajet</div>
              <div style={{ color:'var(--muted)', fontSize:13, marginBottom:16 }}>Ajoutez vos premiers trajets</div>
              <button onClick={() => setModal('newTrip')} style={btnPrimary}>+ Ajouter un trajet</button>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
            {trips.map(t => (
              <div key={t.id} style={{ ...card, padding:'16px 20px', opacity: t.active ? 1 : .6 }}>
                {/* Bande statut */}
                <div style={{ height:3, background: t.active ? 'linear-gradient(90deg,var(--green-mid),var(--gold))' : 'var(--border)', borderRadius:99, marginBottom:14 }} />

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:17 }}>
                      {t.from} → {t.to}
                    </div>
                    <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{t.company}</div>
                  </div>
                  <span style={{ background: t.active ? 'rgba(45,184,102,.15)' : 'rgba(239,68,68,.1)', color: t.active ? 'var(--success)' : 'var(--danger)', padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600 }}>
                    {t.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                  {[
                    ['Départ',   t.depTime],
                    ['Arrivée',  t.arrTime],
                    ['Prix',     FCFA(t.price)],
                    ['Sièges',   `${t.freeSeats}/${t.totalSeats} libres`],
                    ['Réservations', t.bookings],
                  ].map(([k,v]) => (
                    <div key={k} style={{ background:'var(--bg)', borderRadius:8, padding:'7px 10px' }}>
                      <div style={{ fontSize:9, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.5px' }}>{k}</div>
                      <div style={{ fontSize:13, fontWeight:600, marginTop:2, color: k==='Prix' ? 'var(--gold)' : 'var(--text)' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {t.amenities?.length > 0 && (
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:12 }}>
                    {t.amenities.map(a => (
                      <span key={a} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:99, fontSize:10, padding:'2px 8px', color:'var(--muted)' }}>
                        {a === 'ac' ? '❄️ Clim' : a === 'wifi' ? '📶 WiFi' : a === 'usb' ? '🔌 USB' : a}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => { setEditTrip(t); setModal('editTrip'); }}
                    style={{ ...btnGhost, flex:1, fontSize:11, padding:'5px 0' }}>✏️ Modifier</button>
                  <button onClick={async () => { await agencyPatchTrip(t.id, { active: !t.active }); load(); }}
                    style={{ ...btnGhost, flex:1, fontSize:11, padding:'5px 0' }}>
                    {t.active ? '⏸ Désactiver' : '▶️ Activer'}
                  </button>
                  <button onClick={async () => { if (confirm('Supprimer ce trajet ?')) { await agencyDeleteTrip(t.id); load(); } }}
                    style={{ ...btnGhost, fontSize:11, padding:'5px 10px', color:'var(--danger)', borderColor:'rgba(239,68,68,.3)' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RÉSERVATIONS ── */}
      {tab === 'bookings' && (
        <div className="fade-in" style={card}>
          <div style={secTitle}>Réservations de mes trajets ({bookings.length})</div>
          {bookings.length === 0 && !loading && (
            <div style={{ textAlign:'center', color:'var(--muted)', padding:'32px 0', fontSize:13 }}>Aucune réservation pour vos trajets</div>
          )}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Référence','Trajet','Passager','Téléphone','Date','Siège','Total','Code','Statut'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:'var(--muted)', fontWeight:500, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={td}><span style={{ fontFamily:'monospace', fontSize:11 }}>{b.id}</span></td>
                    <td style={td}>{b.trip?.from} → {b.trip?.to}</td>
                    <td style={td}>{b.passengerName || '—'}</td>
                    <td style={td}>{b.passengerPhone || '—'}</td>
                    <td style={td}>{b.travelDate}</td>
                    <td style={td}>{b.seatNum}</td>
                    <td style={{ ...td, color:'var(--gold)', fontWeight:600 }}>{FCFA(b.totalPrice)}</td>
                    <td style={td}><span style={{ fontFamily:'monospace', fontSize:11, color:'var(--green-light)' }}>{b.validationCode}</span></td>
                    <td style={td}><Badge s={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL nouveau trajet ── */}
      {(modal === 'newTrip' || modal === 'editTrip') && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}
          onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:'var(--radius-xl)', padding:28, width:500, maxWidth:'92vw', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, marginBottom:20 }}>
              {modal === 'editTrip' ? '✏️ Modifier le trajet' : '+ Nouveau trajet'}
            </div>
            <TripForm
              initial={editTrip}
              onSave={async d => {
                if (modal === 'editTrip') await agencyPatchTrip(editTrip.id, d);
                else await agencyCreateTrip(d);
                setModal(null); setEditTrip(null); load();
              }}
              onCancel={() => { setModal(null); setEditTrip(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TripForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    fromCity:    initial?.from    || '',
    toCity:      initial?.to      || '',
    depTime:     initial?.depTime || '',
    arrTime:     initial?.arrTime || '',
    durationMin: initial?.durationMin || '',
    price:       initial?.price   || '',
    totalSeats:  initial?.totalSeats || 70,
    stops:       initial?.stops   || 0,
    amenities:   initial?.amenities || [],
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleAmenity = a => setForm(f => ({
    ...f,
    amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
  }));
  const [err, setErr] = useState('');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[['fromCity','Ville de départ *','select'],['toCity','Ville d\'arrivée *','select']].map(([k,l,t]) => (
          <div key={k}>
            <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:4 }}>{l}</label>
            <select value={form[k]} onChange={set(k)} style={inputStyle}>
              <option value="">— Choisir —</option>
              {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
        {[
          ['depTime','Heure départ *','time'],
          ['arrTime','Heure arrivée *','time'],
          ['durationMin','Durée (min)','number'],
          ['price','Prix (FCFA) *','number'],
          ['totalSeats','Nombre de sièges','number'],
          ['stops','Nombre d\'arrêts','number'],
        ].map(([k,l,t]) => (
          <div key={k}>
            <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:4 }}>{l}</label>
            <input type={t} value={form[k]} onChange={set(k)} style={inputStyle} />
          </div>
        ))}
      </div>

      <div>
        <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:8 }}>Équipements</label>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {AMENITIES_OPT.map(a => (
            <button key={a} type="button" onClick={() => toggleAmenity(a)} style={{
              padding:'5px 14px', borderRadius:99, fontSize:12, cursor:'pointer',
              border:`1px solid ${form.amenities.includes(a) ? 'var(--gold)' : 'var(--border)'}`,
              background: form.amenities.includes(a) ? 'var(--gold-glow)' : 'transparent',
              color: form.amenities.includes(a) ? 'var(--gold)' : 'var(--muted)',
            }}>
              {a === 'ac' ? '❄️ Climatisation' : a === 'wifi' ? '📶 WiFi' : a === 'usb' ? '🔌 USB' : a === 'snacks' ? '🍪 Snacks' : '🚻 Toilettes'}
            </button>
          ))}
        </div>
      </div>

      {err && <div style={{ color:'var(--danger)', fontSize:13 }}>{err}</div>}

      <div style={{ display:'flex', gap:8, marginTop:4 }}>
        <button onClick={() => {
          if (!form.fromCity || !form.toCity || !form.depTime || !form.arrTime || !form.price) {
            setErr('Veuillez remplir tous les champs obligatoires *'); return;
          }
          if (form.fromCity === form.toCity) { setErr('Départ et arrivée doivent être différents'); return; }
          onSave(form);
        }} style={{ ...btnPrimary, flex:1 }}>
          {initial ? 'Enregistrer les modifications' : 'Créer le trajet'}
        </button>
        <button onClick={onCancel} style={{ ...btnGhost, flex:1 }}>Annuler</button>
      </div>
    </div>
  );
}

const card    = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:20 };
const secTitle= { fontSize:13, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:14 };
const td      = { padding:'8px 10px', verticalAlign:'middle' };
const inputStyle = { width:'100%', background:'var(--bg)', border:'1px solid var(--border2)', borderRadius:8, padding:'9px 12px', color:'var(--text)', fontSize:13, outline:'none' };
const btnPrimary = { background:'linear-gradient(135deg,var(--green-mid),var(--green-light))', color:'#fff', border:'none', borderRadius:8, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer' };
const btnGhost   = { background:'transparent', color:'var(--muted)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 14px', fontSize:13, cursor:'pointer' };
