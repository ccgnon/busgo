import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
  agencyMe, agencyStats, agencyTrips,
  agencyCreateTrip, agencyPatchTrip, agencyDeleteTrip,
  agencyBookings,
} from '../services/api';

const FCFA = n => Number(n||0).toLocaleString('fr-FR') + ' FCFA';
const STATIONS = ['Yaoundé','Douala','Bafoussam','Bamenda','Ngaoundéré',
                  'Garoua','Kribi','Buea','Ebolowa','Bertoua','Maroua','Limbé'];
const AMENITIES = [
  { id:'ac',      label:'Climatisation', icon:'❄️' },
  { id:'wifi',    label:'WiFi',          icon:'📶' },
  { id:'usb',     label:'USB',           icon:'🔌' },
  { id:'snacks',  label:'Snacks',        icon:'🍪' },
  { id:'toilet',  label:'Toilettes',     icon:'🚻' },
];

function Icon({ d, size=16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}
const I = {
  chart:  'M3 3v18h18M7 16l4-4 4 4 4-4',
  bus:    'M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a4 4 0 0 1 4 4v6M13 17h6M17 21v-4m-8 4v-4M5 9h12M5 13h12',
  ticket: 'M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4Z',
  plus:   'M12 5v14M5 12h14',
  edit:   'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z',
  trash:  'M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2',
  x:      'M18 6 6 18M6 6l12 12',
  cash:   'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
};

function StatusBadge({ status }) {
  const map = {
    CONFIRMED:{ cls:'badge-green', label:'Confirmé' },
    VALIDATED:{ cls:'badge-green', label:'Validé' },
    CANCELLED:{ cls:'badge-red',   label:'Annulé' },
    EXPIRED:  { cls:'badge-muted', label:'Expiré' },
  };
  const { cls, label } = map[status] || { cls:'badge-muted', label: status };
  return <span className={`badge ${cls}`}>{label}</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-up" style={{ maxWidth:540 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800 }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
            <Icon d={I.x} size={20}/>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:5, fontWeight:500 }}>{label}</label>
      {children}
    </div>
  );
}

export default function Agency() {
  const { user } = useStore();
  const navigate  = useNavigate();
  const [tab,      setTab]     = useState('dashboard');
  const [agency,   setAgency]  = useState(null);
  const [stats,    setStats]   = useState(null);
  const [trips,    setTrips]   = useState([]);
  const [bookings, setBookings]= useState([]);
  const [loading,  setLoading] = useState(false);
  const [modal,    setModal]   = useState(null);
  const [editTrip, setEditTrip]= useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAgency(await agencyMe());
      if (tab === 'dashboard') setStats(await agencyStats());
      if (tab === 'trips')     setTrips((await agencyTrips()).trips || []);
      if (tab === 'bookings')  setBookings((await agencyBookings()).bookings || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  if (!user) { navigate('/login'); return null; }
  if (!['AGENCY','ADMIN'].includes(user.role)) return (
    <div style={{ maxWidth:480, margin:'120px auto', textAlign:'center', padding:'0 24px' }}>
      <div style={{ fontSize:48, marginBottom:16, opacity:.3 }}>🏢</div>
      <h2 style={{ fontFamily:'var(--font-display)', marginBottom:8 }}>Portail Agence</h2>
      <p style={{ color:'var(--text-muted)', marginBottom:24 }}>Votre compte n'est pas un compte agence.</p>
      <button className="btn btn-primary" onClick={() => navigate('/login')}>Se connecter avec un compte agence</button>
    </div>
  );

  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'32px 24px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
            <div style={{ width:44, height:44, borderRadius:'var(--r-md)', background:'var(--bg-elevated)', border:'1px solid var(--border-md)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
              🏢
            </div>
            <div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, lineHeight:1 }}>
                {agency?.name || 'Portail Agence'}
              </h1>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>{agency?.email}</div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {agency?.verified && <span className="badge badge-green">Vérifié ✓</span>}
          <span className={`badge ${agency?.active ? 'badge-green' : 'badge-red'}`}>
            {agency?.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:28 }}>
        {[
          { id:'dashboard', label:'Tableau de bord', icon:I.chart },
          { id:'trips',     label:'Mes trajets',     icon:I.bus },
          { id:'bookings',  label:'Réservations',    icon:I.ticket },
        ].map(t => (
          <button key={t.id} className={`tab ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}
            style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Icon d={t.icon} size={13}/>{t.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && stats && !loading && (
        <div className="fade-in">
          <div className="grid-3" style={{ marginBottom:24 }}>
            {[
              { label:'Trajets actifs',  value:stats.trips?.active,              sub:`${stats.trips?.total} au total`,          color:'var(--c-green-300)', icon:I.bus },
              { label:'Recettes FCFA',   value:FCFA(stats.revenue?.total),       sub:`${stats.revenue?.bookings} réservations`, color:'var(--c-gold-400)',  icon:I.cash },
              { label:'Panier moyen',    value:FCFA(stats.revenue?.average),     sub:'par réservation',                         color:'var(--text-muted)',  icon:I.ticket },
            ].map(c => (
              <div key={c.label} className="stat-card fade-up" style={{ borderTop:`2px solid ${c.color}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div className="stat-label">{c.label}</div>
                  <div style={{ color:c.color, opacity:.7 }}><Icon d={c.icon} size={18}/></div>
                </div>
                <div className="stat-value" style={{ color:c.color }}>{c.value}</div>
                <div className="stat-sub">{c.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            <div className="card fade-up delay-1">
              <div className="card-header"><span className="card-title">Réservations récentes</span></div>
              {(stats.recentBookings||[]).length === 0 && (
                <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'24px 0' }}>
                  Aucune réservation pour le moment
                </p>
              )}
              {(stats.recentBookings||[]).map(b => (
                <div key={b.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--c-green-200)', marginBottom:2 }}>{b.id}</div>
                    <div style={{ color:'var(--text-muted)' }}>{b.trip?.from} → {b.trip?.to} · {b.travelDate}</div>
                    {b.passengerName && <div style={{ marginTop:1 }}>{b.passengerName}</div>}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <StatusBadge status={b.status}/>
                    <div style={{ color:'var(--c-gold-400)', marginTop:3 }}>{FCFA(b.totalPrice)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card fade-up delay-2">
              <div className="card-header"><span className="card-title">Informations agence</span></div>
              {agency && [
                ['Nom',        agency.name],
                ['Email',      agency.email],
                ['Téléphone',  agency.phone||'—'],
                ['Commission', `${(agency.commission*100).toFixed(0)}%`],
                ['Trajets',    agency._count?.trips||'—'],
                ['Agents',     agency._count?.users||'—'],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <span style={{ color:'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MES TRAJETS ── */}
      {tab === 'trips' && !loading && (
        <div className="fade-in">
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
            <button className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:6 }}
              onClick={() => { setEditTrip(null); setModal('trip'); }}>
              <Icon d={I.plus} size={14}/> Ajouter un trajet
            </button>
          </div>

          {trips.length === 0 && (
            <div className="card" style={{ textAlign:'center', padding:'60px 24px' }}>
              <div style={{ fontSize:48, marginBottom:16, opacity:.2 }}>🚌</div>
              <h3 style={{ fontFamily:'var(--font-display)', marginBottom:8 }}>Aucun trajet</h3>
              <p style={{ color:'var(--text-muted)', marginBottom:20 }}>Ajoutez vos premiers trajets pour commencer à vendre des billets.</p>
              <button className="btn btn-primary" onClick={() => { setEditTrip(null); setModal('trip'); }}>
                + Ajouter un trajet
              </button>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
            {trips.map(t => (
              <div key={t.id} className="card" style={{ opacity: t.active ? 1 : .6 }}>
                <div style={{ height:2, background: t.active ? 'linear-gradient(90deg,var(--c-green-400),var(--c-gold-400))' : 'var(--border)', borderRadius:'var(--r-full)', marginBottom:16 }}/>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:800 }}>
                      {t.from} → {t.to}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{t.company}</div>
                  </div>
                  <span className={`badge ${t.active ? 'badge-green' : 'badge-red'}`}>
                    {t.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:12 }}>
                  {[
                    ['Départ',   t.depTime],
                    ['Arrivée',  t.arrTime],
                    ['Prix',     FCFA(t.price)],
                    [`${t.freeSeats}/${t.totalSeats}`, 'places libres'],
                    [t.bookings, 'réservations'],
                  ].slice(0,3).map(([v,k]) => (
                    <div key={k} style={{ background:'var(--bg-elevated)', borderRadius:'var(--r-sm)', padding:'8px 10px' }}>
                      <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:2 }}>{k}</div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{v}</div>
                    </div>
                  ))}
                </div>

                {t.amenities?.length > 0 && (
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:12 }}>
                    {t.amenities.map(a => {
                      const am = AMENITIES.find(x => x.id === a);
                      return (
                        <span key={a} className="badge badge-muted">{am?.icon} {am?.label||a}</span>
                      );
                    })}
                  </div>
                )}

                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-ghost" style={{ flex:1, fontSize:11, padding:'6px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}
                    onClick={() => { setEditTrip(t); setModal('trip'); }}>
                    <Icon d={I.edit} size={12}/> Modifier
                  </button>
                  <button className="btn btn-ghost" style={{ flex:1, fontSize:11, padding:'6px 0' }}
                    onClick={async () => { await agencyPatchTrip(t.id, { active: !t.active }); load(); }}>
                    {t.active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button className="btn btn-ghost" style={{ padding:'6px 10px', color:'var(--c-red-400)', borderColor:'rgba(192,57,43,.3)' }}
                    onClick={async () => { if(confirm('Supprimer ce trajet ?')) { await agencyDeleteTrip(t.id); load(); } }}>
                    <Icon d={I.trash} size={12}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RÉSERVATIONS ── */}
      {tab === 'bookings' && !loading && (
        <div className="card fade-in">
          <div className="card-header">
            <span className="card-title">Réservations de mes trajets ({bookings.length})</span>
          </div>
          {bookings.length === 0 && (
            <p style={{ textAlign:'center', color:'var(--text-muted)', padding:'32px 0', fontSize:13 }}>
              Aucune réservation pour vos trajets
            </p>
          )}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>{['Référence','Trajet','Passager','Téléphone','Date','Siège','Total','Code','Statut'].map(h=><th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td><span className="text-mono" style={{ fontSize:11, color:'var(--c-green-200)' }}>{b.id}</span></td>
                    <td style={{ fontSize:12 }}>{b.trip?.from} → {b.trip?.to}</td>
                    <td style={{ fontSize:12 }}>{b.passengerName||'—'}</td>
                    <td style={{ fontSize:11, color:'var(--text-muted)' }}>{b.passengerPhone||'—'}</td>
                    <td style={{ fontSize:12 }}>{b.travelDate}</td>
                    <td style={{ textAlign:'center' }}>{b.seatNum}</td>
                    <td style={{ color:'var(--c-gold-400)', fontWeight:600, fontSize:12 }}>{FCFA(b.totalPrice)}</td>
                    <td><span className="text-mono" style={{ fontSize:11, color:'var(--c-green-300)' }}>{b.validationCode}</span></td>
                    <td><StatusBadge status={b.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal trajet ── */}
      {modal === 'trip' && (
        <Modal title={editTrip ? '✏️ Modifier le trajet' : '+ Nouveau trajet'} onClose={() => setModal(null)}>
          <TripForm
            initial={editTrip}
            onSave={async d => {
              if (editTrip) await agencyPatchTrip(editTrip.id, d);
              else await agencyCreateTrip(d);
              setModal(null); setEditTrip(null); load();
            }}
            onCancel={() => { setModal(null); setEditTrip(null); }}
          />
        </Modal>
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
    amenities:   initial?.amenities || [],
  });
  const [err, setErr] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleAmenity = id => setForm(f => ({
    ...f,
    amenities: f.amenities.includes(id) ? f.amenities.filter(x=>x!==id) : [...f.amenities, id],
  }));

  return (
    <div>
      <div className="grid-2">
        <Field label="Ville de départ *">
          <select className="input" value={form.fromCity} onChange={set('fromCity')}>
            <option value="">— Choisir —</option>
            {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Ville d'arrivée *">
          <select className="input" value={form.toCity} onChange={set('toCity')}>
            <option value="">— Choisir —</option>
            {STATIONS.filter(s => s !== form.fromCity).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Heure départ *">
          <input className="input" type="time" value={form.depTime} onChange={set('depTime')}/>
        </Field>
        <Field label="Heure arrivée *">
          <input className="input" type="time" value={form.arrTime} onChange={set('arrTime')}/>
        </Field>
        <Field label="Durée (minutes)">
          <input className="input" type="number" value={form.durationMin} onChange={set('durationMin')} placeholder="240"/>
        </Field>
        <Field label="Prix (FCFA) *">
          <input className="input" type="number" value={form.price} onChange={set('price')} placeholder="5000"/>
        </Field>
        <Field label="Nombre de sièges">
          <input className="input" type="number" value={form.totalSeats} onChange={set('totalSeats')}/>
        </Field>
      </div>

      <Field label="Équipements">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {AMENITIES.map(a => (
            <button key={a.id} type="button"
              onClick={() => toggleAmenity(a.id)}
              style={{
                padding:'6px 14px',
                borderRadius:'var(--r-full)',
                fontSize:12,
                cursor:'pointer',
                border:`1px solid ${form.amenities.includes(a.id) ? 'var(--c-gold-400)' : 'var(--border-md)'}`,
                background: form.amenities.includes(a.id) ? 'rgba(232,160,32,.1)' : 'transparent',
                color: form.amenities.includes(a.id) ? 'var(--c-gold-300)' : 'var(--text-muted)',
                transition:'all .15s',
              }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </Field>

      {err && <p style={{ color:'var(--c-red-400)', fontSize:13, marginBottom:12 }}>{err}</p>}

      <div style={{ display:'flex', gap:8, marginTop:20 }}>
        <button className="btn btn-primary" style={{ flex:1 }} onClick={() => {
          if (!form.fromCity || !form.toCity || !form.depTime || !form.price) {
            setErr('Veuillez remplir tous les champs obligatoires *'); return;
          }
          if (form.fromCity === form.toCity) { setErr('Départ et arrivée doivent être différents'); return; }
          onSave(form);
        }}>
          {initial ? 'Enregistrer' : 'Créer le trajet'}
        </button>
        <button className="btn btn-ghost" style={{ flex:1 }} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}
