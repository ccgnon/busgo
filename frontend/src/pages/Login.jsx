import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email:'', password:'' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', form);
      localStorage.setItem('busgo_token', res.data.token);
      if (res.data.user?.role === 'ADMIN') navigate('/admin');
      else navigate('/mes-voyages');
    } catch(e) {
      setErr(e.response?.data?.error || 'Email ou mot de passe incorrect.');
    } finally { setLoading(false); }
  };

  const S = {
    page: { minHeight:'100vh', background:'linear-gradient(135deg,#1a3a2a 0%,#2d5c3f 50%,#1a3a2a 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
    card: { background:'#fff', borderRadius:24, padding:'40px 36px', width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,.3)' },
    label: { display:'block', fontSize:'.72rem', fontWeight:700, color:'#8a7d6e', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:5 },
    input: { width:'100%', padding:'12px 14px', borderRadius:10, border:'1.5px solid #d4c9b5', fontSize:'.92rem', background:'#f8f4ee', outline:'none', boxSizing:'border-box', transition:'border .2s' },
    btn: { width:'100%', padding:14, background:'#007a5e', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:'1rem', marginTop:20 },
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{textAlign:'center', marginBottom:28}}>
          <Link to="/" style={{fontFamily:'Georgia,serif', fontSize:'1.8rem', fontWeight:700, color:'#1a3a2a', textDecoration:'none'}}>
            🚌 busGO
          </Link>
          <p style={{color:'#8a7d6e', fontSize:'.88rem', marginTop:6}}>Connexion à votre compte</p>
        </div>

        {err && <div style={{background:'#fef2f2', border:'1px solid #fca5a5', color:'#ce1126', padding:'10px 14px', borderRadius:10, marginBottom:16, fontSize:'.86rem'}}>{err}</div>}

        <form onSubmit={submit}>
          <div style={{marginBottom:16}}>
            <label style={S.label}>Email</label>
            <input type="email" required placeholder="vous@exemple.com" value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))} style={S.input}/>
          </div>
          <div style={{marginBottom:4}}>
            <label style={S.label}>Mot de passe</label>
            <input type="password" required placeholder="••••••••" value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))} style={S.input}/>
          </div>
          <button type="submit" disabled={loading} style={{...S.btn, opacity: loading?.7:1}}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div style={{borderTop:'1px solid #e8e0d0', marginTop:24, paddingTop:20, textAlign:'center'}}>
          <p style={{color:'#8a7d6e', fontSize:'.85rem'}}>
            Pas encore de compte ? <Link to="/inscription" style={{color:'#007a5e', fontWeight:700, textDecoration:'none'}}>S'inscrire</Link>
          </p>
        </div>

        <div style={{marginTop:16, padding:12, background:'#f8f4ee', borderRadius:10, fontSize:'.75rem', color:'#8a7d6e'}}>
          <strong style={{color:'#4a4035'}}>Comptes de test :</strong><br/>
          admin@busgo.cm / busgo2026 (Admin)<br/>
          test@busgo.cm / busgo2026 (Utilisateur)
        </div>
      </div>
    </div>
  );
}
