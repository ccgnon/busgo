import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const STATIONS = [
  { id:'YDE', label:'Yaoundé — Mvan', city:'Yaoundé' },
  { id:'DLA', label:'Douala — Bonabéri', city:'Douala' },
  { id:'BFT', label:'Bafoussam — Centre', city:'Bafoussam' },
  { id:'NGD', label:'Ngaoundéré — Gare', city:'Ngaoundéré' },
  { id:'LIM', label:'Limbé — Beach Rd', city:'Limbé' },
  { id:'BUE', label:'Buéa — Long St', city:'Buéa' },
  { id:'EDO', label:'Ébolowa — Gare', city:'Ébolowa' },
  { id:'BSG', label:'Bertoua — Terminus', city:'Bertoua' },
];

const POPULAR = [
  { from:'YDE', to:'DLA', label:'Yaoundé → Douala', duration:'4h', price:'3500', emoji:'🌆' },
  { from:'DLA', to:'BFT', label:'Douala → Bafoussam', duration:'5h', price:'4000', emoji:'🏔️' },
  { from:'YDE', to:'NGD', label:'Yaoundé → Ngaoundéré', duration:'8h', price:'7000', emoji:'🌿' },
  { from:'DLA', to:'LIM', label:'Douala → Limbé', duration:'2h', price:'2500', emoji:'🌊' },
];

const FEATURES = [
  { icon:'🎫', title:'Réservation instantanée', desc:'Confirmez votre siège en 2 minutes depuis votre téléphone.' },
  { icon:'📱', title:'Paiement Mobile Money', desc:'MTN MoMo et Orange Money acceptés. Sûr et sans frais cachés.' },
  { icon:'📩', title:'Confirmation SMS', desc:'Recevez votre billet par SMS immédiatement après paiement.' },
  { icon:'🔄', title:'Annulation flexible', desc:'Annulez jusqu\'à 2h avant le départ et soyez remboursé.' },
];

export default function Home() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [from, setFrom] = useState('YDE');
  const [to, setTo] = useState('DLA');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [pax, setPax] = useState('1');
  const [swapping, setSwapping] = useState(false);

  // Animated canvas — Cameroonian landscape
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let t = 0, raf;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Sky gradient — warm sunset
      const sky = ctx.createLinearGradient(0, 0, 0, H * .68);
      sky.addColorStop(0, '#0d1f2d');
      sky.addColorStop(.25, '#1a3a5c');
      sky.addColorStop(.55, '#4a7fa8');
      sky.addColorStop(.8, '#f97316');
      sky.addColorStop(1, '#fbbf24');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * .68);

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      for (let i = 0; i < 80; i++) {
        const sx = (i * 137.5 * W / 80) % W;
        const sy = (i * 97.3 * H * .4 / 80) % (H * .4);
        const r = .5 + Math.sin(t * .03 + i) * .3;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      }

      // Sun glow
      const sg = ctx.createRadialGradient(W * .72, H * .18, 0, W * .72, H * .18, 90);
      sg.addColorStop(0, 'rgba(255,220,100,1)');
      sg.addColorStop(.4, 'rgba(249,115,22,.6)');
      sg.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(W * .72, H * .18, 90, 0, Math.PI * 2); ctx.fill();

      // Mount Cameroon silhouette
      ctx.fillStyle = 'rgba(26,15,8,.75)';
      ctx.beginPath();
      ctx.moveTo(W * .45, H * .68);
      ctx.bezierCurveTo(W * .52, H * .38, W * .64, H * .22, W * .72, H * .18);
      ctx.bezierCurveTo(W * .8, H * .22, W * .9, H * .36, W, H * .52);
      ctx.lineTo(W, H * .68); ctx.closePath(); ctx.fill();

      // Secondary hills
      ctx.fillStyle = 'rgba(20,35,20,.65)';
      ctx.beginPath();
      ctx.moveTo(0, H * .68);
      ctx.bezierCurveTo(W * .15, H * .5, W * .28, H * .44, W * .4, H * .55);
      ctx.bezierCurveTo(W * .5, H * .62, W * .55, H * .68, W * .6, H * .68);
      ctx.lineTo(0, H * .68); ctx.closePath(); ctx.fill();

      // Dark forest base
      ctx.fillStyle = '#0e1c10';
      ctx.fillRect(0, H * .67, W, H * .33);

      // Tree canopy animation
      const drawForest = (yBase, ampX, ampY, color, speed, detail) => {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(0, H);
        ctx.lineTo(0, yBase);
        for (let x = 0; x <= W; x += detail) {
          const y = yBase + Math.sin(x * .012 + t * speed) * ampY + Math.sin(x * .027 - t * speed * .7) * (ampY * .5);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      };
      drawForest(H * .75, 5, 18, '#1a3a2a', .004, 16);
      drawForest(H * .71, 4, 12, '#1e4d30', .005, 12);
      drawForest(H * .68, 3, 10, '#163524', .006, 10);

      // Road perspective
      ctx.fillStyle = '#6b5d4f';
      ctx.beginPath();
      ctx.moveTo(W * .3, H); ctx.lineTo(W * .44, H * .73);
      ctx.lineTo(W * .56, H * .73); ctx.lineTo(W * .7, H);
      ctx.closePath(); ctx.fill();
      // Road markings
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([18, 14]); ctx.lineWidth = 1.5;
      ctx.globalAlpha = .25;
      ctx.beginPath();
      ctx.moveTo(W * .5, H); ctx.lineTo(W * .5, H * .73);
      ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;

      // Animated bus — moves slightly side to side and bounces
      const busX = W * .5 - 28 + Math.sin(t * .025) * 3;
      const busY = H * .745 + Math.sin(t * .05) * 1.5;
      const bw = 56, bh = 28;

      // Bus shadow
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath();
      ctx.ellipse(busX + bw / 2, busY + bh + 3, bw * .45, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bus body
      const bodyGrad = ctx.createLinearGradient(busX, busY, busX, busY + bh);
      bodyGrad.addColorStop(0, '#fcd116');
      bodyGrad.addColorStop(.4, '#f5c510');
      bodyGrad.addColorStop(1, '#c9a20e');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.roundRect(busX, busY, bw, bh, [6, 6, 3, 3]);
      ctx.fill();

      // Green stripe
      ctx.fillStyle = '#007a5e';
      ctx.fillRect(busX, busY + 5, bw, 7);

      // Windows
      ctx.fillStyle = 'rgba(180,230,255,.85)';
      [[10, 2, 10, 10], [24, 2, 10, 10], [38, 2, 10, 10]].forEach(([x, y, w, h]) => {
        ctx.beginPath(); ctx.roundRect(busX + x, busY + y, w, h, 2); ctx.fill();
      });

      // Wheels
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(busX + 10, busY + bh, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(busX + bw - 10, busY + bh, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#555';
      ctx.beginPath(); ctx.arc(busX + 10, busY + bh, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(busX + bw - 10, busY + bh, 3, 0, Math.PI * 2); ctx.fill();

      // Red rear light
      ctx.fillStyle = '#ce1126';
      ctx.fillRect(busX + bw - 4, busY + 8, 4, 5);

      // Headlight
      const headGlow = ctx.createRadialGradient(busX, busY + 15, 0, busX - 5, busY + 15, 20);
      headGlow.addColorStop(0, 'rgba(255,255,180,.6)');
      headGlow.addColorStop(1, 'rgba(255,255,180,0)');
      ctx.fillStyle = headGlow;
      ctx.beginPath(); ctx.arc(busX - 5, busY + 15, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffb0';
      ctx.fillRect(busX, busY + 10, 4, 6);

      t++;
      raf = requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  const swap = () => {
    setSwapping(true);
    setTimeout(() => { setFrom(to); setTo(from); setSwapping(false); }, 200);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!from || !to || from === to) return;
    navigate(`/search?from=${from}&to=${to}&date=${date}&pax=${pax}`);
  };

  const quickSearch = (f, t) => {
    navigate(`/search?from=${f}&to=${t}&date=${date}&pax=1`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0e1c10', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <Navbar transparent />

      {/* ── HERO ── */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(10,20,14,.55) 0%, rgba(10,20,14,.2) 35%, rgba(10,20,14,.8) 80%, #0e1c10 100%)' }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '100px clamp(16px,4vw,40px) 60px', width: '100%', maxWidth: 820, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(252,209,22,.15)', border: '1px solid rgba(252,209,22,.35)', color: '#fcd116', fontSize: '.78rem', fontWeight: 700, letterSpacing: '.1em', padding: '6px 18px', borderRadius: 50, marginBottom: 28, textTransform: 'uppercase' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fcd116', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Plateforme N°1 de bus au Cameroun
          </div>

          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(2rem,5.5vw,3.8rem)', fontWeight: 700, color: '#fff', lineHeight: 1.12, marginBottom: 20, textShadow: '0 2px 20px rgba(0,0,0,.4)' }}>
            Voyagez à travers le<br />
            <em style={{ fontStyle: 'italic', color: '#fcd116' }}>Cameroun Magnifique</em> 🇨🇲
          </h1>
          <p style={{ color: 'rgba(255,255,255,.72)', fontSize: 'clamp(.95rem,2vw,1.1rem)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Réservez vos billets de bus en quelques clics. Sièges garantis, tarifs transparents, confirmation immédiate par SMS.
          </p>

          {/* ── Search Card ── */}
          <form onSubmit={handleSearch} style={{ background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: 'clamp(20px,3vw,32px)', boxShadow: '0 24px 80px rgba(0,0,0,.35)', maxWidth: 720, margin: '0 auto', textAlign: 'left' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginBottom: 12, alignItems: 'end' }}>
              {/* From */}
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 800, color: '#007a5e', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>🛫 Départ</label>
                <select value={from} onChange={e => setFrom(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '2px solid #e8e0d0', fontSize: '.92rem', background: '#fafaf8', outline: 'none', appearance: 'none', cursor: 'pointer', fontWeight: 600, color: '#1a3a2a' }}>
                  {STATIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              {/* Swap button */}
              <button type="button" onClick={swap} style={{ width: 42, height: 42, borderRadius: '50%', background: '#007a5e', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,122,94,.4)', transform: swapping ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0, marginBottom: 1 }}>⇄</button>

              {/* To */}
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 800, color: '#ce1126', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>🛬 Arrivée</label>
                <select value={to} onChange={e => setTo(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '2px solid #e8e0d0', fontSize: '.92rem', background: '#fafaf8', outline: 'none', appearance: 'none', cursor: 'pointer', fontWeight: 600, color: '#1a3a2a' }}>
                  {STATIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 800, color: '#8a7d6e', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>📅 Date de voyage</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '2px solid #e8e0d0', fontSize: '.92rem', background: '#fafaf8', outline: 'none', boxSizing: 'border-box', color: '#1a3a2a', fontWeight: 600 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 800, color: '#8a7d6e', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>👥 Passagers</label>
                <select value={pax} onChange={e => setPax(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '2px solid #e8e0d0', fontSize: '.92rem', background: '#fafaf8', outline: 'none', appearance: 'none', cursor: 'pointer', fontWeight: 600, color: '#1a3a2a' }}>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} passager{n>1?'s':''}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" style={{ width: '100%', padding: '15px 24px', background: 'linear-gradient(135deg,#007a5e,#00a87d)', color: '#fff', border: 'none', borderRadius: 14, fontSize: '1rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,122,94,.4)', letterSpacing: '.02em' }}>
              🔍 Rechercher les voyages disponibles
            </button>
          </form>

          {/* Popular routes */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
            <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '.8rem', display: 'flex', alignItems: 'center' }}>Populaires :</span>
            {POPULAR.map(r => (
              <button key={r.from+r.to} onClick={() => quickSearch(r.from, r.to)}
                style={{ padding: '6px 14px', borderRadius: 50, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.85)', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600, transition: 'all .2s' }}>
                {r.emoji} {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.45)', fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          <span>Défiler</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(255,255,255,.4), transparent)' }} />
        </div>
      </div>

      {/* ── POPULAR ROUTES ── */}
      <div style={{ background: '#0e1c10', padding: 'clamp(48px,6vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ color: '#fcd116', fontSize: '.78rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>TRAJETS LES PLUS DEMANDÉS</div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', color: '#fff', fontWeight: 700 }}>Voyages populaires</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
            {POPULAR.map(r => (
              <button key={r.from+r.to} onClick={() => quickSearch(r.from, r.to)}
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '24px 20px', cursor: 'pointer', textAlign: 'left', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.borderColor = 'rgba(252,209,22,.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'; }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{r.emoji}</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{r.label}</div>
                <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.8rem', marginBottom: 16 }}>Durée : {r.duration}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#fcd116', fontWeight: 800, fontSize: '1.1rem' }}>dès {r.price} FCFA</span>
                  <span style={{ color: '#007a5e', fontSize: '1.2rem' }}>→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ background: '#111f14', padding: 'clamp(48px,6vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ color: '#007a5e', fontSize: '.78rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>POURQUOI NOUS CHOISIR</div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', color: '#fff', fontWeight: 700 }}>Simple, rapide et fiable</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 24 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ padding: '28px 24px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20 }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.85rem', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA BAND ── */}
      <div style={{ background: 'linear-gradient(135deg,#007a5e 0%,#00a87d 50%,#005c47 100%)', padding: 'clamp(48px,6vw,72px) clamp(16px,4vw,40px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: 20 }}>🚌</div>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.5rem,3vw,2.2rem)', color: '#fff', fontWeight: 700, marginBottom: 14 }}>
            Prêt pour votre prochain voyage ?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '1rem', marginBottom: 32, lineHeight: 1.7 }}>
            Rejoignez des milliers de voyageurs qui font confiance à busGO chaque jour pour leurs déplacements au Cameroun.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/inscription" style={{ padding: '14px 32px', background: '#fcd116', color: '#1a3a2a', borderRadius: 14, fontWeight: 800, textDecoration: 'none', fontSize: '1rem', boxShadow: '0 4px 20px rgba(252,209,22,.35)' }}>
              Créer un compte gratuit →
            </Link>
            <Link to="/search" style={{ padding: '14px 32px', background: 'rgba(255,255,255,.15)', color: '#fff', borderRadius: 14, fontWeight: 700, textDecoration: 'none', fontSize: '1rem', border: '1px solid rgba(255,255,255,.3)' }}>
              Voir les voyages
            </Link>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#060f08', color: 'rgba(255,255,255,.4)', padding: 'clamp(32px,4vw,48px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.2rem', color: '#fff', fontWeight: 700, marginBottom: 10 }}>🚌 busGO CMR</div>
            <p style={{ fontSize: '.82rem', lineHeight: 1.7, margin: 0 }}>Réservation de bus intercité au Cameroun. Simple, rapide, fiable.</p>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '.85rem', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>Navigation</div>
            {[['/', 'Accueil'], ['/search', 'Trouver un voyage'], ['/connexion', 'Connexion'], ['/inscription', "S'inscrire"]].map(([to, label]) => (
              <div key={to}><Link to={to} style={{ color: 'rgba(255,255,255,.45)', textDecoration: 'none', fontSize: '.83rem', lineHeight: 2.2 }}>{label}</Link></div>
            ))}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '.85rem', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>Villes</div>
            {['Yaoundé', 'Douala', 'Bafoussam', 'Ngaoundéré', 'Limbé'].map(c => (
              <div key={c} style={{ color: 'rgba(255,255,255,.45)', fontSize: '.83rem', lineHeight: 2.2 }}>{c}</div>
            ))}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '.85rem', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>Contact</div>
            <div style={{ fontSize: '.83rem', lineHeight: 2.2 }}>📍 Yaoundé, Cameroun</div>
            <div style={{ fontSize: '.83rem', lineHeight: 2.2 }}>📞 +237 6XX XXX XXX</div>
            <div style={{ fontSize: '.83rem', lineHeight: 2.2 }}>✉️ support@busgo.cm</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 20, textAlign: 'center', fontSize: '.78rem' }}>
          © 2026 busGO Technologies SARL — Yaoundé, Cameroun. Tous droits réservés.
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        * { box-sizing: border-box; }
        select:focus, input:focus { border-color: #007a5e !important; box-shadow: 0 0 0 3px rgba(0,122,94,.15); }
      `}</style>
    </div>
  );
}
