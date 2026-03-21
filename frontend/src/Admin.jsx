import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
  adminStats, adminBookings, adminUsers, adminPatchUser,
  adminAgencies, adminCreateAgency, adminPatchAgency,
  adminTrips, adminPatchTrip, adminDeleteTrip,
} from '../services/api';

const FCFA = n => Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
const dt   = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function StatCard({ label, value, sub, color = 'var(--green-mid)' }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'16px 20px' }}>
      <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:800, fontFamily:'var(--font-display)', color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function Badge({ s }) {
  const map = {
    CONFIRMED:{ bg:'rgba(45,184,102,.15)', c:'var(--success)', l:'Confirmé' },
    CANCELLED:{ bg:'rgba(239,68,68,.12)',  c:'var(--danger)',  l:'Annulé' },
    VALIDATED:{ bg:'rgba(35,144,79,.15)',  c:'var(--green-light)', l:'Validé' },
    EXPIRED:  { bg:'rgba(139,154,179,.15)',c:'var(--muted)',   l:'Expiré' },
  };
  const x = map[s] || map.CONFIRMED;
  return <span style={{ background:x.bg, color:x.c, padding:'2px 10px', borderRadius:99, fontSize:11, fontWeight:600 }}>{x.l}</span>;
}

export default function Admin() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [tab,  setTab]  = useState('dashboard');
  const [data, setData] = useState(null);
  const [bookings, setBookings]   = useState([]);
  const [users,    setUsers]      = useState([]);
  const [agencies, setAgencies]   = useState([]);
  const [trips,    setTrips]      = useState([]);
  const [loading,  setLoading]    = useState(false);
  const [modal,    setModal]      = useState(null); // {type, data}

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'dashboard') { const r = await adminStats();    setData(r); }
      if (tab === 'bookings')  { const r = await adminBookings(); setBookings(r.bookings || []); }
      if (tab === 'users')     { const r = await adminUsers();    setUsers(r); }
      if (tab === 'agencies')  { const r = await adminAgencies(); setAgencies(r); }
      if (tab === 'trips')     { const r = await adminTrips();    setTrips(r.trips || []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  if (!user) {
    navigate('/login');
    return null;
  }
  if (user.role !== 'ADMIN') return (
    <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--muted)' }}>
      <div style={{ fontSize:48, marginBottom:16, opacity:.2 }}>🔐</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:8 }}>Accès réservé aux administrateurs</div>
      <div style={{ fontSize:13, marginBottom:20, color:'var(--muted)' }}>Votre compte ({user.role}) n'a pas les droits nécessaires.</div>
      <button onClick={() => navigate('/login')} style={btnPrimary}>Se connecter avec un compte Admin</button>
    </div>
  );

  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'28px 24px', position:'relative', zIndex:1 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:900, margin:0 }}>
            Dashboard Admin
          </h1>
          <div style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>busGO Cameroun — Panneau d'administration</div>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[
            ['dashboard','📊 Dashboard'],
            ['bookings', '🎫 Réservations'],
            ['trips',    '🚌 Trajets'],
            ['agencies', '🏢 Agences'],
            ['users',    '👥 Utilisateurs'],
          ].map(([k,l]) => (
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

      {loading && <div style={{ textAlign:'center', color:'var(--muted)', padding:40 }}>⏳ Chargement...</div>}

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && data && (
        <div className="fade-in">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
            <StatCard label="Réservations" value={data.bookings?.confirmed} sub={`${data.bookings?.total} total`} />
            <StatCard label="Recettes FCFA" value={FCFA(data.revenue?.total)} sub={`Moy: ${FCFA(data.revenue?.average)}`} color="var(--gold)" />
            <StatCard label="Trajets actifs" value={data.trips?.active} sub={`${data.trips?.total} total`} />
            <StatCard label="Utilisateurs" value={data.users} sub={`${data.agencies} agences`} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Réservations récentes */}
            <div style={card}>
              <div style={secTitle}>Réservations récentes</div>
              {(data.recentBookings||[]).map(b => (
                <div key={b.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:12, fontFamily:'monospace' }}>{b.id}</div>
                    <div style={{ color:'var(--muted)', fontSize:11 }}>{b.trip?.from} → {b.trip?.to} · {b.trip?.company}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <Badge s={b.status} />
                    <div style={{ fontSize:11, color:'var(--gold)', marginTop:2 }}>{FCFA(b.totalPrice)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top compagnies */}
            <div style={card}>
              <div style={secTitle}>Top compagnies</div>
              {(data.topCompanies||[]).map((c,i) => (
                <div key={c.company} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:24, height:24, borderRadius:6, background:'var(--green-glow)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--green-light)' }}>{i+1}</div>
                  <div style={{ flex:1, fontSize:13 }}>{c.company}</div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>{c.trips} trajets</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RÉSERVATIONS ── */}
      {tab === 'bookings' && (
        <div className="fade-in" style={card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={secTitle}>Toutes les réservations ({bookings.length})</div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Référence','Trajet','Passager','Date','Siège','Total','Paiement','Statut','Code'].map(h => (
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
                    <td style={td}>{b.travelDate}</td>
                    <td style={td}>{b.seatNum}</td>
                    <td style={{ ...td, color:'var(--gold)', fontWeight:600 }}>{FCFA(b.totalPrice)}</td>
                    <td style={td}>{b.paymentMethod}</td>
                    <td style={td}><Badge s={b.status} /></td>
                    <td style={td}><span style={{ fontFamily:'monospace', fontSize:11, color:'var(--green-light)' }}>{b.validationCode}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TRAJETS ── */}
      {tab === 'trips' && (
        <div className="fade-in" style={card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={secTitle}>Tous les trajets ({trips.length})</div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Trajet','Compagnie','Agence','Départ','Arrivée','Prix','Sièges','Réservations','Statut','Actions'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:'var(--muted)', fontWeight:500, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trips.map(t => (
                  <tr key={t.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={td}>{t.from} → {t.to}</td>
                    <td style={td}>{t.company}</td>
                    <td style={td}>{t.agency || <span style={{ color:'var(--muted)' }}>—</span>}</td>
                    <td style={td}>{t.depTime}</td>
                    <td style={td}>{t.arrTime}</td>
                    <td style={{ ...td, color:'var(--gold)' }}>{FCFA(t.price)}</td>
                    <td style={td}>{t.totalSeats}</td>
                    <td style={td}>{t.bookings}</td>
                    <td style={td}>
                      <span style={{ background: t.active ? 'rgba(45,184,102,.15)' : 'rgba(239,68,68,.12)', color: t.active ? 'var(--success)' : 'var(--danger)', padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600 }}>
                        {t.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={td}>
                      <button onClick={async () => { await adminPatchTrip(t.id, { active: !t.active }); load(); }}
                        style={{ ...btnGhost, padding:'3px 10px', fontSize:11 }}>
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
      {tab === 'agencies' && (
        <div className="fade-in">
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button onClick={() => setModal({ type:'newAgency' })} style={btnPrimary}>+ Nouvelle agence</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
            {agencies.map(a => (
              <div key={a.id} style={{ ...card, padding:'16px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:16 }}>{a.name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{a.email}</div>
                  </div>
                  <div style={{ display:'flex', gap:4' }}>
                    {a.verified && <span style={{ background:'rgba(45,184,102,.15)', color:'var(--success)', padding:'2px 8px', borderRadius:99, fontSize:10', fontWeight:600 }}>Vérifié</span>}
                    <span style={{ background: a.active ? 'rgba(35,144,79,.12)' : 'rgba(239,68,68,.1)', color: a.active ? 'var(--green-light)' : 'var(--danger)', padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600 }}>{a.active ? 'Actif' : 'Inactif'}</span>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12, marginBottom:12 }}>
                  <div style={{ background:'var(--bg)', borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ color:'var(--muted)', fontSize:10 }}>TRAJETS</div>
                    <div style={{ fontWeight:700, fontSize:16 }}>{a.trips}</div>
                  </div>
                  <div style={{ background:'var(--bg)', borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ color:'var(--muted)', fontSize:10 }}>AGENTS</div>
                    <div style={{ fontWeight:700, fontSize:16 }}>{a.users}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={async () => { await adminPatchAgency(a.id, { active: !a.active }); load(); }}
                    style={{ ...btnGhost, fontSize:11, padding:'4px 12px', flex:1 }}>
                    {a.active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button onClick={async () => { await adminPatchAgency(a.id, { verified: !a.verified }); load(); }}
                    style={{ ...btnGhost, fontSize:11, padding:'4px 12px', flex:1 }}>
                    {a.verified ? 'Retirer vérif.' : 'Vérifier'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── UTILISATEURS ── */}
      {tab === 'users' && (
        <div className="fade-in" style={card}>
          <div style={secTitle}>Utilisateurs ({users.length})</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Nom','Email','Rôle','Agence','Réservations','Inscrit le','Action'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:'var(--muted)', fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={td}>{u.name}</td>
                    <td style={td}>{u.email}</td>
                    <td style={td}>
                      <span style={{
                        background: u.role==='ADMIN' ? 'rgba(192,57,43,.15)' : u.role==='AGENCY' ? 'rgba(35,144,79,.15)' : 'rgba(139,154,179,.12)',
                        color: u.role==='ADMIN' ? 'var(--danger)' : u.role==='AGENCY' ? 'var(--green-light)' : 'var(--muted)',
                        padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:600,
                      }}>{u.role}</span>
                    </td>
                    <td style={td}>{u.agency || '—'}</td>
                    <td style={td}>{u.bookings}</td>
                    <td style={td}>{dt(u.createdAt)}</td>
                    <td style={td}>
                      <select value={u.role} onChange={async e => { await adminPatchUser(u.id, { role: e.target.value }); load(); }}
                        style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:6, padding:'3px 8px', color:'var(--text)', fontSize:11 }}>
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

      {/* ── MODAL nouvelle agence ── */}
      {modal?.type === 'newAgency' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}
          onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:'var(--radius-xl)', padding:28, width:420, maxWidth:'90vw' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, marginBottom:20 }}>Nouvelle agence</div>
            <AgencyForm onSave={async d => { await adminCreateAgency(d); setModal(null); load(); }} onCancel={() => setModal(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function AgencyForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name:'', email:'', phone:'', description:'' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {[['name','Nom de l\'agence *'],['email','Email *'],['phone','Téléphone'],['description','Description']].map(([k,l]) => (
        <div key={k}>
          <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:4 }}>{l}</label>
          <input value={form[k]} onChange={set(k)}
            style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border2)', borderRadius:8, padding:'9px 12px', color:'var(--text)', fontSize:13, outline:'none' }} />
        </div>
      ))}
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        <button onClick={() => onSave(form)} style={{ ...btnPrimary, flex:1 }}>Créer l'agence</button>
        <button onClick={onCancel} style={{ ...btnGhost, flex:1 }}>Annuler</button>
      </div>
    </div>
  );
}

const card     = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:20 };
const secTitle = { fontSize:13, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:14 };
const td       = { padding:'8px 10px', verticalAlign:'middle' };
const btnPrimary = { background:'linear-gradient(135deg,var(--green-mid),var(--green-light))', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer' };
const btnGhost   = { background:'transparent', color:'var(--muted)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 14px', fontSize:13, cursor:'pointer' };
