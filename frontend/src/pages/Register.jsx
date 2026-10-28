import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', referralCode:'' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setErr('Le mot de passe doit faire au moins 6 caractères.'); return; }
    setErr(''); setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', form);
      localStorage.setItem('busgo_token', res.data.token);
      navigate('/mes-voyages');
    } catch(e) {
      setErr(e.response?.data?.error || 'Erreur lors de l\'inscription.');
    } finally { setLoading(false); }
  };

  const S = {
    page: { minHeight:'100vh', background:'linear-gradient(135deg,#1a3a2a 0%,#2d5c3f 50%,#1a3a2a 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
    card: { background:'#fff', borderRadius:24, padding:'40px 36px', width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,0,0,.3)' },
    label: { display:'block', fontSize:'.72rem', fontWeight:700, color:'#8a7d6e', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:5 },
    input: { width:'100%', padding:'12px 14px', borderRadius:10, border:'1.5px solid #d4c9b5', fontSize:'.92rem', background:'#f8f4ee', outline:'none', boxSizing:'border-box' },
    btn: { width:'100%', padding:14, background:'#007a5e', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:'1rem', marginTop:20 },
  };

  const field = (key, label, type='text', ph='', required=false) => (
    <div style={{marginBottom:14}}>
      <label style={S.label}>{label}{required && ' *'}</label>
      <input type={type} placeholder={ph} required={required} value={form[key]}
        onChange={e => setForm(f => ({...f, [key]: e.target.value}))} style={S.input}/>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{textAlign:'center', marginBottom:28}}>
          <Link to="/" style={{fontFamily:'Georgia,serif', fontSize:'1.8rem', fontWeight:700, color:'#1a3a2a', textDecoration:'none'}}>
            🚌 busGO
          </Link>
          <p style={{color:'#8a7d6e', fontSize:'.88rem', marginTop:6}}>Créer votre compte voyageur</p>
        </div>

        {err && <div style={{background:'#fef2f2', border:'1px solid #fca5a5', color:'#ce1126', padding:'10px 14px', borderRadius:10, marginBottom:16, fontSize:'.86rem'}}>{err}</div>}

        <form onSubmit={submit}>
          {field('name',     'Nom complet',         'text',     'Jean Kouam',           true)}
          {field('email',    'Adresse email',        'email',    'vous@exemple.com',     true)}
          {field('phone',    'Téléphone',            'tel',      '6XXXXXXXX',            true)}
          {field('password', 'Mot de passe',         'password', '6 caractères minimum', true)}
          {field('referralCode', 'Code de parrainage (optionnel)', 'text', 'CODE123')}

          <button type="submit" disabled={loading} style={{...S.btn, opacity: loading?.7:1}}>
            {loading ? 'Inscription…' : 'Créer mon compte →'}
          </button>
        </form>

        <div style={{borderTop:'1px solid #e8e0d0', marginTop:24, paddingTop:20, textAlign:'center'}}>
          <p style={{color:'#8a7d6e', fontSize:'.85rem'}}>
            Déjà inscrit ? <Link to="/connexion" style={{color:'#007a5e', fontWeight:700, textDecoration:'none'}}>Se connecter</Link>
          </p>
        </div>

        <div style={{marginTop:16, padding:12, background:'#f0faf7', borderRadius:10, border:'1px solid #b6e8d8', fontSize:'.78rem', color:'#007a5e'}}>
          🎁 Parrainez un ami et gagnez 500 points de fidélité !
        </div>
      </div>
    </div>
  );
}
