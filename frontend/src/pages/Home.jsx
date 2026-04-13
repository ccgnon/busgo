import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchTrips, getTrip } from '../services/api';
import { useStore } from '../store';
import { useNotif } from '../components/NotificationSystem';

const FCFA   = n => Number(n||0).toLocaleString('fr-FR') + ' FCFA';
const fmtDur = min => { if(!min)return ''; const h=Math.floor(min/60),m=min%60; return m?`${h}h${String(m).padStart(2,'0')}`:`${h}h`; };

const HERO_IMG  = 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1400&q=80';
const CITY_IMGS = {
  'Yaoundé':   'https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=400&q=70',
  'Douala':    'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=400&q=70',
  'Bafoussam': 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=70',
  'Bamenda':   'https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?w=400&q=70',
  'Kribi':     'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70',
  'Limbe':     'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=70',
};

const STATIONS = ['Yaoundé','Douala','Bafoussam','Bamenda','Ngaoundéré','Garoua','Kribi','Buea','Ebolowa','Bertoua','Maroua','Limbé'];
const POPULAR  = [
  {from:'Yaoundé',to:'Douala',    price:3500,dur:'3h30'},
  {from:'Douala', to:'Bafoussam', price:4000,dur:'4h00'},
  {from:'Yaoundé',to:'Bafoussam', price:3800,dur:'4h30'},
  {from:'Douala', to:'Kribi',     price:3000,dur:'2h30'},
  {from:'Yaoundé',to:'Ngaoundéré',price:7500,dur:'7h00'},
  {from:'Douala', to:'Limbé',     price:2500,dur:'1h30'},
];

function Spinner(){ return <span style={{width:14,height:14,border:'2px solid rgba(255,255,255,.25)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 1s linear infinite',display:'inline-block'}}/> }

function SeatGrid({total=70,taken=[],selected=[],maxSelect=1,onSelect}){
  const rows=[];
  for(let i=0;i<total;i+=4) rows.push([i+1,i+2,null,i+3,i+4].filter(n=>n===null||n<=total));
  const sel=Array.isArray(selected)?selected:(selected?[selected]:[]);
  return (
    <div>
      <div style={{display:'flex',gap:12,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        {[['var(--bg-elevated)','var(--border-md)','Disponible'],['var(--c-green-600)','var(--c-green-400)','Sélectionné'],['rgba(192,57,43,.2)','rgba(192,57,43,.4)','Occupé']].map(([bg,bd,lbl])=>(
          <div key={lbl} style={{display:'flex',alignItems:'center',gap:5}}>
            <div style={{width:14,height:14,borderRadius:3,background:bg,border:`1px solid ${bd}`}}/>
            <span style={{fontSize:11,color:'var(--text-muted)'}}>{lbl}</span>
          </div>
        ))}
        <span style={{marginLeft:'auto',fontSize:11,color:'var(--c-gold-400)',fontWeight:600}}>{sel.length}/{maxSelect} siège{maxSelect>1?'s':''}</span>
      </div>
      <div style={{background:'var(--bg-raised)',border:'1px solid var(--border-md)',borderRadius:'var(--r-lg)',padding:'16px 22px',display:'inline-block'}}>
        <div style={{textAlign:'center',fontSize:10,color:'var(--text-muted)',paddingBottom:8,marginBottom:8,borderBottom:'1px dashed var(--border)'}}>🧑‍✈️ Conducteur</div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {rows.map((row,ri)=>(
            <div key={ri} style={{display:'flex',gap:4}}>
              {row.map((n,ci)=>n===null?<div key={`g-${ci}`} style={{width:30,height:30}}/>:(
                <SeatBtn key={n} num={n} isTaken={taken.includes(n)} isSelected={sel.includes(n)} canSelect={sel.length<maxSelect||sel.includes(n)} onSelect={()=>onSelect(n)}/>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SeatBtn({num,isTaken,isSelected,canSelect,onSelect}){
  const [h,setH]=useState(false);
  return (
    <button type="button" disabled={isTaken||(!canSelect&&!isSelected)} onClick={onSelect}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{width:30,height:30,borderRadius:5,fontSize:10,fontWeight:600,transition:'all .1s',cursor:isTaken||(!canSelect&&!isSelected)?'not-allowed':'pointer',
        border:isSelected?'2px solid var(--c-green-400)':isTaken?'1px solid rgba(192,57,43,.3)':h&&canSelect?'1px solid var(--c-green-400)':'1px solid var(--border-md)',
        background:isSelected?'var(--c-green-600)':isTaken?'rgba(192,57,43,.12)':h&&canSelect?'rgba(35,144,79,.12)':'var(--bg-elevated)',
        color:isSelected?'var(--c-green-100)':isTaken?'rgba(192,57,43,.4)':'var(--text-muted)',
        transform:isSelected?'scale(1.08)':'scale(1)'}}>
      {num}
    </button>
  );
}

export default function Home(){
  const navigate=useNavigate();
  const {user,selectedTrip,selectedSeats,selectTrip,toggleSeat,searchParams,setSearchParams}=useStore();
  const {success:notifSuccess,error:notifError,info}=useNotif();
  const seats=selectedSeats||[];
  const [step,setStep]=useState(0);
  const [results,setResults]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [tripDetail,setTripDetail]=useState(null);
  const [filter,setFilter]=useState('all');
  const {from='',to='',date=new Date().toISOString().split('T')[0],pax=1}=searchParams;

  function swap(){setSearchParams({from:to,to:from});}

  async function handleSearch(e){
    e.preventDefault();
    if(!from||!to){setError('Veuillez sélectionner départ et arrivée');return;}
    if(from===to){setError('Départ et arrivée doivent être différents');return;}
    setLoading(true);setError(null);setResults(null);selectTrip(null);
    try{
      const data=await searchTrips(from,to,date,pax);
      setResults(data);setStep(0);
      info(`${data.trips?.length||0} trajet${(data.trips?.length||0)>1?'s':''} trouvé${(data.trips?.length||0)>1?'s':''}`,{title:'Recherche'});
    }catch(err){setError(err.error||'Aucun résultat trouvé');}
    finally{setLoading(false);}
  }

  async function handleSelectTrip(trip){
    selectTrip(trip);setStep(1);
    try{const d=await getTrip(trip.id);setTripDetail(d);}
    catch{setTripDetail(trip);}
  }

  function handleGoToPayment(){
    if(seats.length<pax){notifError(`Sélectionnez ${pax-seats.length} siège${pax-seats.length>1?'s':''} supplémentaire${pax-seats.length>1?'s':''}`);return;}
    notifSuccess('Passage au paiement…');
    navigate('/payment');
  }

  let trips=results?.trips||[];
  if(filter==='cheap')trips=[...trips].sort((a,b)=>(a.unitPrice||a.price)-(b.unitPrice||b.price));
  if(filter==='fast') trips=[...trips].sort((a,b)=>a.durationMin-b.durationMin);

  const takenSeats=tripDetail?.takenSeats||[];
  const totalSeats=tripDetail?.totalSeats||70;

  return (
    <div style={{maxWidth:1160,margin:'0 auto',padding:'0 24px 80px'}}>

      {/* HERO */}
      <div className="hero-section fade-up" style={{marginBottom:36}}>
        <img src={HERO_IMG} alt="bus" className="hero-img-bg" onError={e=>e.target.style.display='none'}/>
        <div className="hero-bg"/>
        <div className="hero-content">
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'5px 14px',borderRadius:'var(--r-full)',background:'rgba(35,144,79,.2)',border:'1px solid rgba(35,144,79,.3)',marginBottom:18}}>
            <span>🇨🇲</span><span style={{fontSize:11,fontWeight:600,color:'var(--c-green-200)',letterSpacing:'.5px'}}>Cameroun · 12 villes desservies</span>
          </div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(28px,5vw,50px)',fontWeight:900,lineHeight:1.1,marginBottom:12,maxWidth:640}}>
            Voyagez à travers<br/><span style={{color:'var(--c-gold-400)',fontStyle:'italic'}}>le Cameroun</span> en toute sérénité
          </h1>
          <p style={{fontSize:15,color:'var(--text-secondary)',maxWidth:480,lineHeight:1.7,marginBottom:28}}>
            Réservez vos billets de bus interurbains · MTN MoMo · Orange Money · PDF instantané
          </p>
          <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
            {[['12','Villes'],['50+','Compagnies'],['24/7','Réservation'],['100%','Remboursement']].map(([v,l])=>(
              <div key={l}><div style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:900,color:'var(--c-green-300)'}}>{v}</div><div style={{fontSize:11,color:'var(--text-muted)',marginTop:1}}>{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* RECHERCHE */}
      <div className="card-premium fade-up delay-1" style={{marginBottom:32}}>
        <div style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.8px',marginBottom:16,fontWeight:700}}>🔍 Trouver mon billet</div>
        <form onSubmit={handleSearch}>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr 140px 100px auto',gap:10,alignItems:'end'}}>
            <div>
              <label style={{fontSize:10,color:'var(--text-muted)',display:'block',marginBottom:5,fontWeight:700,letterSpacing:'.5px',textTransform:'uppercase'}}>Départ</label>
              <select className="input" value={from} onChange={e=>setSearchParams({from:e.target.value})}>
                <option value="">Ville de départ…</option>
                {STATIONS.filter(s=>s!==to).map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button type="button" onClick={swap} title="Inverser" style={{width:40,height:42,borderRadius:'var(--r-md)',background:'var(--bg-elevated)',border:'1px solid var(--border-md)',color:'var(--text-muted)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s',fontSize:16}}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--c-green-700)';e.currentTarget.style.color='var(--c-green-200)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='var(--bg-elevated)';e.currentTarget.style.color='var(--text-muted)'}}>
              ⇅
            </button>
            <div>
              <label style={{fontSize:10,color:'var(--text-muted)',display:'block',marginBottom:5,fontWeight:700,letterSpacing:'.5px',textTransform:'uppercase'}}>Arrivée</label>
              <select className="input" value={to} onChange={e=>setSearchParams({to:e.target.value})}>
                <option value="">Ville d'arrivée…</option>
                {STATIONS.filter(s=>s!==from).map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:10,color:'var(--text-muted)',display:'block',marginBottom:5,fontWeight:700,letterSpacing:'.5px',textTransform:'uppercase'}}>Date</label>
              <input type="date" className="input" value={date} min={new Date().toISOString().split('T')[0]} onChange={e=>setSearchParams({date:e.target.value})} style={{fontSize:13}}/>
            </div>
            <div>
              <label style={{fontSize:10,color:'var(--text-muted)',display:'block',marginBottom:5,fontWeight:700,letterSpacing:'.5px',textTransform:'uppercase'}}>Passagers</label>
              <select className="input" value={pax} onChange={e=>setSearchParams({pax:parseInt(e.target.value)})} style={{fontSize:13}}>
                {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} pers.</option>)}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{height:42,padding:'0 20px',fontSize:13}}>
              {loading?<Spinner/>:'🔍'} {loading?'Recherche…':'Rechercher'}
            </button>
          </div>
        </form>
        {error&&<div style={{marginTop:12,padding:'10px 14px',background:'rgba(192,57,43,.1)',border:'1px solid rgba(192,57,43,.25)',borderRadius:'var(--r-md)',fontSize:13,color:'var(--c-red-400)'}}>⚠️ {error}</div>}
      </div>

      {/* RÉSULTATS */}
      {trips.length>0&&step===0&&(
        <div className="fade-in" style={{marginBottom:32}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
            <div>
              <span style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:800}}>{from} <span style={{color:'var(--text-muted)',fontWeight:400}}>→</span> {to}</span>
              <span style={{marginLeft:10,fontSize:12,color:'var(--text-muted)'}}>· {trips.length} trajet{trips.length>1?'s':''}</span>
            </div>
            <div style={{display:'flex',gap:6}}>
              {[['all','Tous'],['cheap','Moins cher'],['fast','Plus rapide']].map(([v,l])=>(
                <button key={v} onClick={()=>setFilter(v)} style={{padding:'5px 12px',borderRadius:'var(--r-full)',fontSize:11,fontWeight:600,border:filter===v?'1px solid var(--c-green-400)':'1px solid var(--border-md)',background:filter===v?'var(--c-green-700)':'var(--bg-elevated)',color:filter===v?'var(--c-green-100)':'var(--text-muted)',cursor:'pointer',transition:'all .12s'}}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {trips.map((trip,i)=><TripCard key={trip.id} trip={trip} index={i} pax={pax} onSelect={handleSelectTrip}/>)}
          </div>
        </div>
      )}

      {/* SIÈGES */}
      {step===1&&selectedTrip&&(
        <div className="fade-in" style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:22,marginBottom:32,alignItems:'start'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
              <button onClick={()=>{setStep(0);selectTrip(null);}} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:13}}>← Retour</button>
              <span style={{color:'var(--border-md)'}}>|</span>
              <span style={{fontSize:14,fontWeight:600}}>Choisissez {pax} siège{pax>1?'s':''}</span>
            </div>
            <div className="card-premium" style={{marginBottom:14}}>
              <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.8px',fontWeight:700,marginBottom:14}}>Plan du véhicule</div>
              {!tripDetail?<div style={{height:180}} className="skeleton"/>:(
                <SeatGrid total={totalSeats} taken={takenSeats} selected={seats} maxSelect={pax} onSelect={s=>toggleSeat(s,pax)}/>
              )}
              {seats.length>0&&(
                <div style={{marginTop:18,padding:'12px 16px',background:'rgba(35,144,79,.1)',border:'1px solid rgba(35,144,79,.25)',borderRadius:'var(--r-md)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{fontSize:13}}>Sièges : {seats.map(s=><strong key={s} style={{color:'var(--c-green-300)',marginLeft:4}}>N°{s}</strong>)}</div>
                  <button className="btn btn-primary" onClick={handleGoToPayment} style={{padding:'9px 20px',fontSize:13}} disabled={seats.length<pax}>
                    {seats.length<pax?`${pax-seats.length} restant${pax-seats.length>1?'s':''}`:' Payer →'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{position:'sticky',top:80}}>
            <div className="card-premium">
              <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.8px',fontWeight:700,marginBottom:14}}>Récapitulatif</div>
              {[['Trajet',`${selectedTrip.from} → ${selectedTrip.to}`],['Compagnie',selectedTrip.company],['Départ',selectedTrip.dep||selectedTrip.depTime],['Passagers',`${pax}`],['Sièges',seats.length>0?seats.map(s=>`N°${s}`).join(', '):'—']].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                  <span style={{color:'var(--text-muted)'}}>{k}</span><span style={{fontWeight:600,textAlign:'right'}}>{v}</span>
                </div>
              ))}
              <div style={{padding:'10px 0',fontSize:13,borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between'}}>
                <span style={{color:'var(--text-muted)'}}>Prix × {pax}</span><span>{FCFA((selectedTrip.unitPrice||selectedTrip.price||0)*pax)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0 8px',alignItems:'center'}}>
                <span style={{fontWeight:700}}>TOTAL</span>
                <span style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:900,color:'var(--c-gold-400)'}}>{FCFA((selectedTrip.unitPrice||selectedTrip.price||0)*pax+500)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESTINATIONS (si pas de recherche) */}
      {!results&&(
        <>
          <div style={{marginBottom:32}}>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:800,marginBottom:6}}>Destinations populaires</h2>
            <p style={{color:'var(--text-muted)',fontSize:13,marginBottom:18}}>Les villes les plus réservées au Cameroun</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
              {Object.entries(CITY_IMGS).map(([city,img],i)=>(
                <div key={city} className={`city-card fade-up delay-${(i%6)+1}`} onClick={()=>setSearchParams({to:city})}>
                  <img src={img} alt={city} className="city-card-img" onError={e=>e.target.src='https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=60'}/>
                  <div className="city-card-overlay"/>
                  <div className="city-card-info">
                    <div style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:800,color:'#fff'}}>{city}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,.6)'}}>🇨🇲 Cameroun</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{marginBottom:32}}>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:800,marginBottom:16}}>Trajets du moment</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10}}>
              {POPULAR.map((r,i)=>(
                <button key={i} onClick={()=>setSearchParams({from:r.from,to:r.to,date,pax})} className={`fade-up delay-${(i%6)+1}`}
                  style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'16px 18px',cursor:'pointer',textAlign:'left',transition:'all .18s',display:'block'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-md)';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='var(--glow-green)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                    <span style={{fontFamily:'var(--font-display)',fontSize:14,fontWeight:800}}>{r.from} → {r.to}</span>
                    <span style={{fontSize:11,color:'var(--text-muted)'}}>⏱ {r.dur}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontFamily:'var(--font-display)',fontSize:17,fontWeight:900,color:'var(--c-gold-400)'}}>dès {FCFA(r.price)}</span>
                    <span style={{fontSize:11,color:'var(--c-green-300)',fontWeight:600}}>Réserver →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
            {[['🔒','Paiement sécurisé','MTN MoMo · Orange Money · Carte'],['📱','Billet sur téléphone','PDF par SMS et email instantané'],['♻️','Remboursement garanti','Annulation 2h avant le départ'],['🤖','Assistance 24/7','Bot Telegram disponible en permanence']].map(([e,t,d])=>(
              <div key={t} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'18px',textAlign:'center'}}>
                <div style={{fontSize:28,marginBottom:10}}>{e}</div>
                <div style={{fontFamily:'var(--font-display)',fontSize:14,fontWeight:800,marginBottom:5}}>{t}</div>
                <div style={{fontSize:11,color:'var(--text-muted)',lineHeight:1.6}}>{d}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TripCard({trip,index,pax,onSelect}){
  const [h,setH]=useState(false);
  const price=trip.unitPrice||trip.price||0;
  return (
    <div className={`fade-up delay-${Math.min(index+1,6)}`} onClick={()=>onSelect(trip)}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:'var(--bg-card)',border:h?'1px solid var(--border-lg)':'1px solid var(--border-md)',borderRadius:'var(--r-lg)',padding:'16px 22px',cursor:'pointer',transition:'all .18s',transform:h?'translateY(-2px)':'none',boxShadow:h?'var(--glow-green)':'none'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap'}}>
        <div style={{flex:2,minWidth:160}}>
          <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:3,fontWeight:600}}>{trip.company}</div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:900}}>{trip.dep||trip.depTime}</span>
            <div style={{flex:1,display:'flex',alignItems:'center',gap:4}}>
              <div style={{flex:1,height:1,background:'var(--border-md)'}}/>
              {trip.durationMin&&<span style={{fontSize:10,color:'var(--text-muted)',flexShrink:0}}>{fmtDur(trip.durationMin)}</span>}
              <div style={{flex:1,height:1,background:'var(--border-md)'}}/>
              <span>🚌</span>
            </div>
            <span style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:900}}>{trip.arr||trip.arrTime}</span>
          </div>
        </div>
        <div style={{textAlign:'center',flexShrink:0}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:800,color:(trip.availableSeats||50)>10?'var(--c-green-300)':'var(--c-red-400)'}}>
            {trip.availableSeats??'—'}
          </div>
          <div style={{fontSize:10,color:'var(--text-muted)'}}>sièges libres</div>
        </div>
        <div style={{textAlign:'right',flexShrink:0}}>
          {pax>1&&<div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>{pax} × {FCFA(price)}</div>}
          <div style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:900,color:'var(--c-gold-400)'}}>{FCFA(price*pax)}</div>
          <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:6}}>+ 500 FCFA service</div>
          <div style={{display:'inline-block',padding:'6px 14px',borderRadius:'var(--r-md)',background:'var(--c-green-400)',color:'#fff',fontSize:11,fontWeight:700}}>Choisir →</div>
        </div>
      </div>
    </div>
  );
}
