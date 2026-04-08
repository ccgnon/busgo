import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
  adminStats, adminBookings, adminUsers, adminPatchUser,
  adminAgencies, adminCreateAgency, adminPatchAgency,
  adminTrips, adminPatchTrip,
} from '../services/api';

const FCFA = n => Number(n||0).toLocaleString('fr-FR') + ' FCFA';
const dt   = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';

/* ── Icons ── */
function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}
const I = {
  chart:   'M3 3v18h18M7 16l4-4 4 4 4-4',
  ticket:  'M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4Z',
  bus:     'M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a4 4 0 0 1 4 4v6M13 17h6M17 21v-4m-8 4v-4M5 9h12M5 13h12',
  users:   'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  building:'M3 21h18M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2M3 21V7m18 14V7M8 21v-5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v5M3 7h18',
  cash:    'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  check:   'M20 6 9 17l-5-5',
  x:       'M18 6 6 18M6 6l12 12',
  plus:    'M12 5v14M5 12h14',
  edit:    'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z',
};

/* ── Status badge ── */
function StatusBadge({ status }) {
  const map = {
    CONFIRMED: { cls:'badge-green',  label:'Confirmé' },
    VALIDATED: { cls:'badge-green',  label:'Validé' },
    CANCELLED: { cls:'badge-red',    label:'Annulé' },
    EXPIRED:   { cls:'badge-muted',  label:'Expiré' },
  };
  const { cls, label } = map[status] || { cls:'badge-muted', label: status };
  return <span className={`badge ${cls}`}>{label}</span>;
}

/* ── Stat card ── */
function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="stat-card fade-up" style={{ borderTop: `2px solid ${color}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div className="stat-label">{label}</div>
        <div style={{ color, opacity:.7 }}><Icon d={icon} size={18}/></div>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

/* ── Modal ── */
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-up">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
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

/* ── Field ── */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:5, fontWeight:500 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function Admin() {
  const { user } = useStore();
  const navigate  = useNavigate();
  const [tab,      setTab]     = useState('dashboard');
  const [data,     setData]    = useState(null);
  const [bookings, setBookings]= useState([]);
  const [users,    setUsers]   = useState([]);
  const [agencies, setAgencies]= useState([]);
  const [trips,    setTrips]   = useState([]);
  const [loading,  setLoading] = useState(false);
  const [modal,    setModal]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'dashboard') setData(await adminStats());
      if (tab === 'bookings')  setBookings((await adminBookings()).bookings || []);
      if (tab === 'users')     setUsers(await adminUsers());
      if (tab === 'agencies')  setAgencies(await adminAgencies());
      if (tab === 'trips')     setTrips((await adminTrips()).trips || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  if (!user) { navigate('/login'); return null; }
  if (user.role !== 'ADMIN') return (
    <div style={{ maxWidth:480, margin:'120px auto', textAlign:'center', padding:'0 24px' }}>
      <div style={{ fontSize:48, marginBottom:16, opacity:.3 }}>🔐</div>
      <h2 style={{ fontFamily:'var(--font-display)', marginBottom:8 }}>Accès réservé</h2>
      <p style={{ color:'var(--text-muted)', marginBottom:24 }}>Votre compte n'a pas les droits administrateur.</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Retour à l'accueil</button>
    </div>
  );

  const TABS = [
    { id:'dashboard', label:'Dashboard',    icon:I.chart },
    { id:'bookings',  label:'Réservations', icon:I.ticket },
    { id:'trips',     label:'Trajets',      icon:I.bus },
    { id:'agencies',  label:'Agences',      icon:I.building },
    { id:'users',     label:'Utilisateurs', icon:I.users },
  ];

  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'32px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, marginBottom:4 }}>
          Dashboard Admin
        </h1>
        <p style={{ color:'var(--text-muted)', fontSize:13 }}>
          busGO Cameroun — Panneau d'administration
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:28, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Icon d={t.icon} size={13}/>
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:100, borderRadius:'var(--r-lg)' }}/>)}
        </div>
      )}

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && data && !loading && (
        <div className="fade-in">
          <div className="grid-4" style={{ marginBottom:24 }}>
            <StatCard label="Réservations" value={data.bookings?.confirmed} sub={`${data.bookings?.total} total`} color="var(--c-green-300)" icon={I.ticket}/>
            <StatCard label="Recettes" value={FCFA(data.revenue?.total)} sub={`Moy. ${FCFA(data.revenue?.average)}`} color="var(--c-gold-400)" icon={I.cash}/>
            <StatCard label="Trajets actifs" value={data.trips?.active} sub={`${data.trips?.total} total`} color="var(--c-green-400)" icon={I.bus}/>
            <StatCard label="Utilisateurs" value={data.users} sub={`${data.agencies} agences`} color="var(--text-secondary)" icon={I.users}/>
          </div>

          <div className="grid-2">
            {/* Réservations récentes */}
            <div className="card fade-up delay-1">
              <div className="card-header">
                <span className="card-title">Réservations récentes</span>
              </div>
              {(data.recentBookings||[]).map(b => (
                <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--c-green-200)', marginBottom:2 }}>{b.id}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                      {b.trip?.from} → {b.trip?.to} · {b.trip?.company}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <StatusBadge status={b.status}/>
                    <div style={{ fontSize:12, color:'var(--c-gold-400)', marginTop:3 }}>{FCFA(b.totalPrice)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top compagnies */}
            <div className="card fade-up delay-2">
              <div className="card-header">
                <span className="card-title">Top compagnies</span>
              </div>
              {(data.topCompanies||[]).map((c,i) => (
                <div key={c.company} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:28, height:28, borderRadius:'var(--r-sm)', background:'var(--bg-elevated)', border:'1px solid var(--border-md)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--c-green-300)' }}>
                    {i+1}
                  </div>
                  <div style={{ flex:1, fontSize:13 }}>{c.company}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{c.trips} trajets</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RÉSERVATIONS ── */}
      {tab === 'bookings' && !loading && (
        <div className="card fade-in">
          <div className="card-header" style={{ marginBottom:0 }}>
            <span className="card-title">Toutes les réservations ({bookings.length})</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {['Référence','Trajet','Passager','Date','Siège','Total','Paiement','Statut','Code'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td><span className="text-mono" style={{ fontSize:11, color:'var(--c-green-200)' }}>{b.id}</span></td>
                    <td style={{ fontSize:12 }}>{b.trip?.from} → {b.trip?.to}</td>
                    <td style={{ fontSize:12 }}>{b.passengerName||'—'}</td>
                    <td style={{ fontSize:12 }}>{b.travelDate}</td>
                    <td style={{ textAlign:'center' }}>{b.seatNum}</td>
                    <td style={{ color:'var(--c-gold-400)', fontWeight:600, fontSize:12 }}>{FCFA(b.totalPrice)}</td>
                    <td style={{ fontSize:11 }}>{b.paymentMethod}</td>
                    <td><StatusBadge status={b.status}/></td>
                    <td><span className="text-mono" style={{ fontSize:11, color:'var(--c-green-300)' }}>{b.validationCode}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TRAJETS ── */}
      {tab === 'trips' && !loading && (
        <div className="card fade-in">
          <div className="card-header">
            <span className="card-title">Tous les trajets ({trips.length})</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {['Trajet','Compagnie','Agence','Départ','Prix','Sièges','Réservations','Statut','Action'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trips.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight:500, fontSize:13 }}>{t.from} → {t.to}</td>
                    <td style={{ fontSize:12 }}>{t.company}</td>
                    <td style={{ fontSize:12 }}>{t.agency||<span className="text-muted">—</span>}</td>
                    <td style={{ fontSize:12 }}>{t.depTime}</td>
                    <td style={{ color:'var(--c-gold-400)', fontSize:12 }}>{FCFA(t.price)}</td>
                    <td style={{ textAlign:'center', fontSize:12 }}>{t.totalSeats}</td>
                    <td style={{ textAlign:'center', fontSize:12 }}>{t.bookings}</td>
                    <td>
                      <span className={`badge ${t.active ? 'badge-green' : 'badge-red'}`}>
                        {t.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost" style={{ padding:'4px 12px', fontSize:11 }}
                        onClick={async () => { await adminPatchTrip(t.id, { active: !t.active }); load(); }}>
                        {t.active ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── AGENCES ── */}
      {tab === 'agencies' && !loading && (
        <div className="fade-in">
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
            <button className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:6 }}
              onClick={() => setModal('newAgency')}>
              <Icon d={I.plus} size={14}/> Nouvelle agence
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
            {agencies.map(a => (
              <div key={a.id} className="card" style={{ padding:'20px 22px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, marginBottom:2 }}>{a.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{a.email}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
                    {a.verified && <span className="badge badge-green">Vérifié</span>}
                    <span className={`badge ${a.active ? 'badge-green' : 'badge-red'}`}>{a.active ? 'Actif' : 'Inactif'}</span>
                  </div>
                </div>
                <div className="grid-2" style={{ gap:8, marginBottom:14 }}>
                  {[['Trajets', a.trips], ['Agents', a.users]].map(([k,v]) => (
                    <div key={k} style={{ background:'var(--bg-elevated)', borderRadius:'var(--r-md)', padding:'10px 12px' }}>
                      <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.5px' }}>{k}</div>
                      <div style={{ fontSize:18, fontWeight:700, fontFamily:'var(--font-display)', marginTop:2 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-ghost" style={{ flex:1, fontSize:11, padding:'6px 0' }}
                    onClick={async () => { await adminPatchAgency(a.id, { active: !a.active }); load(); }}>
                    {a.active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button className="btn btn-ghost" style={{ flex:1, fontSize:11, padding:'6px 0' }}
                    onClick={async () => { await adminPatchAgency(a.id, { verified: !a.verified }); load(); }}>
                    {a.verified ? 'Retirer vérif.' : 'Vérifier'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── UTILISATEURS ── */}
      {tab === 'users' && !loading && (
        <div className="card fade-in">
          <div className="card-header">
            <span className="card-title">Utilisateurs ({users.length})</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>{['Nom','Email','Rôle','Agence','Réservations','Inscrit','Action'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight:500, fontSize:13 }}>{u.name}</td>
                    <td style={{ fontSize:12, color:'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role==='ADMIN'?'badge-red':u.role==='AGENCY'?'badge-gold':'badge-muted'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize:12 }}>{u.agency||'—'}</td>
                    <td style={{ textAlign:'center', fontSize:12 }}>{u.bookings}</td>
                    <td style={{ fontSize:11, color:'var(--text-muted)' }}>{dt(u.createdAt)}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={async e => { await adminPatchUser(u.id, { role: e.target.value }); load(); }}
                        style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-md)', borderRadius:'var(--r-sm)', padding:'4px 8px', color:'var(--text-primary)', fontSize:11 }}>
                        <option value="USER">USER</option>
                        <option value="AGENCY">AGENCY</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal nouvelle agence ── */}
      {modal === 'newAgency' && (
        <Modal title="Nouvelle agence" onClose={() => setModal(null)}>
          <AgencyForm
            onSave={async d => { await adminCreateAgency(d); setModal(null); load(); }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

function AgencyForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name:'', email:'', phone:'', description:'' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div>
      <Field label="Nom de l'agence *">
        <input className="input" value={form.name} onChange={set('name')} placeholder="Bibilong Voyages" />
      </Field>
      <Field label="Email *">
        <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="contact@agence.cm" />
      </Field>
      <Field label="Téléphone">
        <input className="input" value={form.phone} onChange={set('phone')} placeholder="+237 6XX XXX XXX" />
      </Field>
      <Field label="Description">
        <textarea className="input" value={form.description} onChange={set('description')} rows={3} placeholder="Description de l'agence..." style={{ resize:'vertical' }}/>
      </Field>
      <div style={{ display:'flex', gap:8, marginTop:20 }}>
        <button className="btn btn-primary" style={{ flex:1 }} onClick={() => onSave(form)}>Créer l'agence</button>
        <button className="btn btn-ghost" style={{ flex:1 }} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}
