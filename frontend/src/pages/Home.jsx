import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STATIONS = [
  { id:'YDE', label:'Yaoundé — Mvan' },
  { id:'DLA', label:'Douala — Bonabéri' },
  { id:'BFT', label:'Bafoussam — Centre' },
  { id:'NGD', label:'Ngaoundéré — Gare' },
  { id:'LIM', label:'Limbé — Beach Rd' },
  { id:'BUE', label:'Buéa — Long St' },
  { id:'EDO', label:'Ébolowa — Gare' },
  { id:'BSG', label:'Bertoua — Terminus' },
];

export default function Home() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [from, setFrom] = useState('YDE');
  const [to,   setTo]   = useState('DLA');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [pax,  setPax]  = useState('1');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let t = 0, raf;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    const draw = () => {
      const W=canvas.width, H=canvas.height;
      ctx.clearRect(0,0,W,H);
      const sky=ctx.createLinearGradient(0,0,0,H*.65);
      sky.addColorStop(0,'#f97316'); sky.addColorStop(.3,'#fbbf24');
      sky.addColorStop(.6,'#4a90b8'); sky.addColorStop(1,'#1a3a5c');
      ctx.fillStyle=sky; ctx.fillRect(0,0,W,H*.65);
      // Sun
      const sg=ctx.createRadialGradient(W*.78,H*.15,4,W*.78,H*.15,70);
      sg.addColorStop(0,'rgba(255,240,150,1)'); sg.addColorStop(1,'rgba(255,150,50,0)');
      ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(W*.78,H*.15,70,0,Math.PI*2); ctx.fill();
      // Mountain
      ctx.fillStyle='rgba(45,20,10,.6)'; ctx.beginPath();
      ctx.moveTo(W*.55,H*.65); ctx.bezierCurveTo(W*.62,H*.25,W*.74,H*.17,W*.78,H*.15);
      ctx.bezierCurveTo(W*.84,H*.18,W*.94,H*.3,W,H*.44);
      ctx.lineTo(W,H*.65); ctx.closePath(); ctx.fill();
      // Forest
      ctx.fillStyle='#1a3a2a'; ctx.beginPath(); ctx.moveTo(0,H*.65);
      for(let x=0;x<=W;x+=20){ctx.lineTo(x,H*.58+Math.sin(x*.015+t*.008)*14+Math.sin(x*.03+t*.005)*8);}
      ctx.lineTo(W,H*.65); ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
      // Mid forest
      const fg=ctx.createLinearGradient(0,H*.6,0,H*.85);
      fg.addColorStop(0,'#2d5c3f'); fg.addColorStop(1,'#1a3a2a');
      ctx.fillStyle=fg; ctx.beginPath(); ctx.moveTo(0,H*.65);
      for(let x=0;x<=W;x+=14){ctx.lineTo(x,H*.64+Math.sin(x*.02+t*.006)*12+Math.sin(x*.045-t*.004)*6);}
      ctx.lineTo(W,H*.75); ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
      // Road
      ctx.fillStyle='#8a7360'; ctx.beginPath();
      ctx.moveTo(W*.32,H); ctx.lineTo(W*.45,H*.7); ctx.lineTo(W*.55,H*.7); ctx.lineTo(W*.68,H); ctx.closePath(); ctx.fill();
      // Bus
      const bx=W*.5-18+Math.sin(t*.04)*2, by=H*.75+Math.sin(t*.04)*1;
      ctx.fillStyle='#fcd116'; ctx.fillRect(bx,by,36,18);
      ctx.fillStyle='#007a5e'; ctx.fillRect(bx,by,36,5);
      ctx.fillStyle='#000'; ctx.fillRect(bx+2,by+12,7,6); ctx.fillRect(bx+27,by+12,7,6);
      ctx.fillStyle='#fff'; ctx.fillRect(bx+8,by+3,6,6); ctx.fillRect(bx+22,by+3,6,6);
      t++; raf=requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener('resize',resize);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize',resize); };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!from||!to||from===to) return;
    navigate(`/search?from=${from}&to=${to}&date=${date}&pax=${pax}`);
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      {/* Hero */}
      <div style={{position:'relative',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{position:'absolute',inset:0,zIndex:0}}/>
        <div style={{position:'absolute',inset:0,zIndex:1,background:'linear-gradient(to bottom,rgba(14,26,18,.5) 0%,rgba(14,26,18,.3) 40%,rgba(14,26,18,.85) 100%)'}}/>

        {/* Nav */}
        <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:10,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',height:64,background:'rgba(14,26,18,.85)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
          <a href="/" style={{fontFamily:'Georgia,serif',fontSize:'1.5rem',fontWeight:700,color:'#fff',textDecoration:'none'}}>
            🚌 busGO <span style={{background:'#fcd116',color:'#111',padding:'2px 8px',borderRadius:6,fontSize:'.7rem',fontWeight:700,letterSpacing:'.06em',marginLeft:6}}>CMR</span>
          </a>
          <div style={{display:'flex',gap:10}}>
            <a href="/connexion" style={{padding:'8px 18px',borderRadius:8,background:'rgba(255,255,255,.1)',color:'#fff',border:'1px solid rgba(255,255,255,.2)',textDecoration:'none',fontSize:'.85rem',fontWeight:600}}>Connexion</a>
            <a href="/inscription" style={{padding:'8px 18px',borderRadius:8,background:'#fcd116',color:'#111',textDecoration:'none',fontSize:'.85rem',fontWeight:700}}>S'inscrire</a>
          </div>
        </nav>

        {/* Content */}
        <div style={{position:'relative',zIndex:2,textAlign:'center',padding:'80px 20px 40px',width:'100%',maxWidth:760}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.12)',border:'1px solid rgba(255,255,255,.2)',color:'rgba(255,255,255,.9)',fontSize:'.8rem',fontWeight:600,letterSpacing:'.08em',padding:'6px 16px',borderRadius:50,marginBottom:24}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#fcd116',display:'inline-block'}}/>
            Plateforme #1 de réservation au Cameroun
          </div>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2.2rem,5.5vw,3.8rem)',fontWeight:700,color:'#fff',lineHeight:1.1,marginBottom:18}}>
            Voyagez à travers le<br/><em style={{fontStyle:'italic',color:'#fcd116'}}>Cameroun Magnifique</em>
          </h1>
          <p style={{color:'rgba(255,255,255,.75)',fontSize:'1.05rem',maxWidth:500,margin:'0 auto 36px'}}>
            Réservez vos billets en quelques clics. Sièges garantis, tarifs transparents, confirmation immédiate par SMS.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} style={{background:'#fff',borderRadius:20,padding:28,boxShadow:'0 12px 48px rgba(0,0,0,.25)',maxWidth:680,margin:'0 auto',textAlign:'left'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#8a7d6e',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:5}}>Départ</label>
                <select value={from} onChange={e=>setFrom(e.target.value)} style={{width:'100%',padding:'11px 14px',borderRadius:10,border:'1.5px solid #d4c9b5',fontSize:'.9rem',background:'#f8f4ee',appearance:'none',outline:'none'}}>
                  {STATIONS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#8a7d6e',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:5}}>Arrivée</label>
                <select value={to} onChange={e=>setTo(e.target.value)} style={{width:'100%',padding:'11px 14px',borderRadius:10,border:'1.5px solid #d4c9b5',fontSize:'.9rem',background:'#f8f4ee',appearance:'none',outline:'none'}}>
                  {STATIONS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <div>
                <label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#8a7d6e',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:5}}>Date</label>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                  style={{width:'100%',padding:'11px 14px',borderRadius:10,border:'1.5px solid #d4c9b5',fontSize:'.9rem',background:'#f8f4ee',outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:'.72rem',fontWeight:700,color:'#8a7d6e',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:5}}>Passagers</label>
                <select value={pax} onChange={e=>setPax(e.target.value)} style={{width:'100%',padding:'11px 14px',borderRadius:10,border:'1.5px solid #d4c9b5',fontSize:'.9rem',background:'#f8f4ee',appearance:'none',outline:'none'}}>
                  <option value="1">1 passager</option>
                  <option value="2">2 passagers</option>
                  <option value="3">3 passagers</option>
                  <option value="4">4 passagers</option>
                </select>
              </div>
            </div>
            <button type="submit" style={{width:'100%',padding:14,background:'#007a5e',color:'#fff',border:'none',borderRadius:12,fontSize:'1rem',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
              🔍 Rechercher les voyages disponibles
            </button>
          </form>
        </div>
      </div>

      {/* Footer simple */}
      <footer style={{background:'#1a3a2a',color:'rgba(255,255,255,.55)',textAlign:'center',padding:'32px 20px',fontSize:'.82rem'}}>
        <div style={{marginBottom:12,fontSize:'1.2rem'}}>🚌 busGO CMR</div>
        © 2026 busGO Technologies SARL — Yaoundé, Cameroun
      </footer>
    </div>
  );
}
