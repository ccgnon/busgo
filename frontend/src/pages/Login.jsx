import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { useNotif } from '../components/NotificationSystem';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register: doRegister, authLoading, authError, clearAuthError, user } = useStore();

  const initMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode]         = useState(initMode);
  const [portalMode, setPortal] = useState('user'); // 'user' | 'admin' | 'agency'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { clearAuthError(); }, [mode]);

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN')  navigate('/admin');
      else if (user.role === 'AGENCY') navigate('/agency');
      else navigate('/');
    }
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    clearAuthError();
    let ok;
    if (mode === 'register') {
      ok = await doRegister(email, password, name);
    } else {
      ok = await login(email, password);
    }
    if (ok) {
      const u = useStore.getState().user;
      if (u?.role === 'ADMIN')  navigate('/admin');
      else if (u?.role === 'AGENCY') navigate('/agency');
      else navigate('/');
    }
  }

  const isAdmin  = portalMode === 'admin';
  const isAgency = portalMode === 'agency';

  return (
    <div style={{ minHeight:'90vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div className="fade-up" style={{ width:'100%', maxWidth:440 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:16 }}>
            {['var(--c-green-400)','var(--c-red-500)','var(--c-gold-400)'].map((c,i) => (
              <div key={i} style={{ width:28, height:3, background:c, borderRadius:'var(--r-full)' }}/>
            ))}
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:40, fontWeight:900, lineHeight:1 }}>
            <span style={{ color:'var(--c-green-300)' }}>bus</span>
            <span style={{ color:'var(--c-gold-400)' }}>GO</span>
          </div>
          <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:3, textTransform:'uppercase', marginTop:4 }}>
            Cameroun
          </div>
        </div>

        {/* Portail sélection */}
        <div style={{ display:'flex', gap:6, background:'var(--bg-raised)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:5, marginBottom:24 }}>
          {[
            ['user',   '🚌 Voyageur'],
            ['admin',  '⚙️ Admin'],
            ['agency', '🏢 Agence'],
          ].map(([k,l]) => (
            <button key={k} type="button"
              onClick={() => { setPortal(k); setMode('login'); }}
              style={{
                flex:1, padding:'9px 6px', borderRadius:'var(--r-md)',
                border: portalMode===k ? '1px solid var(--border-md)' : 'none',
                background: portalMode===k
                  ? 'var(--bg-elevated)'
                  : 'transparent',
                color: portalMode===k ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .15s',
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* Carte */}
        <div style={{
          background:'var(--bg-card)',
          border:'1px solid var(--border-md)',
          borderRadius:'var(--r-xl)',
          padding:32,
          boxShadow: isAdmin ? '0 0 50px rgba(192,57,43,.08)' : isAgency ? 'var(--glow-gold)' : 'var(--glow-green)',
        }}>
          {/* Tabs login/register (voyageur seulement) */}
          {portalMode === 'user' && (
            <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
              {[['login','Connexion'],['register','Créer un compte']].map(([k,l]) => (
                <button key={k} type="button"
                  onClick={() => setMode(k)}
                  style={{
                    flex:1, padding:'10px 0',
                    background:'none', border:'none',
                    borderBottom: mode===k ? '2px solid var(--c-green-400)' : '2px solid transparent',
                    color: mode===k ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize:14, fontWeight:600, cursor:'pointer', transition:'all .15s',
                    marginBottom:-1,
                  }}>
                  {l}
                </button>
              ))}
            </div>
          )}

          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, marginBottom:20 }}>
            {portalMode === 'admin' ? 'Espace Administrateur' :
             portalMode === 'agency' ? 'Portail Agence' :
             mode === 'login' ? 'Bienvenue !' : 'Créer votre compte'}
          </h2>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {mode === 'register' && (
              <div>
                <label style={labelStyle}>Nom complet</label>
                <input className="input" type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Votre nom" required />
              </div>
            )}

            <div>
              <label style={labelStyle}>Adresse email</label>
              <input className="input" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={
                  portalMode === 'admin' ? 'admin@busgo.cm' :
                  portalMode === 'agency' ? 'agence@compagnie.cm' :
                  'votre@email.cm'
                }
                required autoFocus />
            </div>

            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <label style={{ ...labelStyle, marginBottom:0 }}>Mot de passe</label>
                {mode === 'login' && (
                  <button type="button" style={{ background:'none', border:'none', fontSize:12, color:'var(--c-green-300)', cursor:'pointer' }}>
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div style={{ position:'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={8}
                  style={{ paddingRight:42 }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:14 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {authError && (
              <div style={{ padding:'10px 14px', background:'rgba(192,57,43,.1)', border:'1px solid rgba(192,57,43,.25)', borderRadius:'var(--r-md)', fontSize:13, color:'var(--c-red-400)' }}>
                ❌ {authError}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={authLoading}
              style={{ width:'100%', justifyContent:'center', height:46, marginTop:4, fontSize:15 }}>
              {authLoading ? (
                <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin 1s linear infinite' }}/>
                  Connexion…
                </span>
              ) : (
                mode === 'register' ? 'Créer mon compte' : 'Se connecter'
              )}
            </button>
          </form>

          {/* Comptes démo */}
          {(isAdmin || isAgency) && (
            <div style={{ marginTop:20, padding:'14px', background:'var(--bg-elevated)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>
                Compte de démo
              </div>
              <div style={{ fontSize:12, display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:'var(--text-muted)' }}>Email</span>
                  <button type="button"
                    onClick={() => setEmail('demo@busgo.cm')}
                    style={{ fontFamily:'var(--font-mono)', background:'none', border:'none', color:'var(--c-green-300)', cursor:'pointer', fontSize:12 }}>
                    demo@busgo.cm
                  </button>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:'var(--text-muted)' }}>Mot de passe</span>
                  <button type="button"
                    onClick={() => setPassword('demo1234')}
                    style={{ fontFamily:'var(--font-mono)', background:'none', border:'none', color:'var(--c-green-300)', cursor:'pointer', fontSize:12 }}>
                    demo1234
                  </button>
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                  ⚠️ Promouvoir en ADMIN via pgAdmin :<br/>
                  <code style={{ fontSize:10, color:'var(--c-gold-300)' }}>
                    UPDATE "User" SET role='ADMIN' WHERE email='demo@busgo.cm';
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:16 }}>
          <button onClick={() => navigate('/')} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:13, cursor:'pointer' }}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const labelStyle = { fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:6, fontWeight:500 };
