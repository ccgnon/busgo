// components/ChatWidget.jsx
// Widget de chat IA — intégrable dans toutes les pages busGO
import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';

const AGENT_URL = import.meta.env.VITE_AGENT_URL || 'http://localhost:4006';

// ID de session unique par onglet
const SESSION_ID = Math.random().toString(36).slice(2);

const SUGGESTIONS = [
  '🚌 Chercher un trajet',
  '📋 Mes réservations',
  '🌤️ Météo à Douala',
  '💱 Taux EUR → FCFA',
  '🛣️ Route Yaoundé-Douala',
];

/* ── Spinner ─────────────────────────────────────────────────────────────── */
function Dots() {
  return (
    <div style={{ display:'flex', gap:4, padding:'2px 0' }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width:7, height:7, borderRadius:'50%',
          background:'var(--c-green-400)',
          animation:`dotBounce 1.2s ${i*0.2}s infinite ease-in-out`,
          display:'inline-block',
        }}/>
      ))}
    </div>
  );
}

/* ── Message ─────────────────────────────────────────────────────────────── */
function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display:'flex', gap:8, marginBottom:12,
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems:'flex-end',
    }}>
      {/* Avatar */}
      <div style={{
        width:28, height:28, borderRadius:'50%', flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:13,
        background: isUser ? 'var(--c-green-700)' : 'var(--bg-elevated)',
        border: `1px solid ${isUser ? 'var(--c-green-500)' : 'var(--border-md)'}`,
      }}>
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Bulle */}
      <div style={{
        maxWidth:'78%', padding:'10px 14px', borderRadius:isUser?'18px 18px 4px 18px':'18px 18px 18px 4px',
        background: isUser
          ? 'linear-gradient(135deg,var(--c-green-500),var(--c-green-600))'
          : 'var(--bg-elevated)',
        border: isUser ? 'none' : '1px solid var(--border-md)',
        color: isUser ? '#fff' : 'var(--text-primary)',
        fontSize:13, lineHeight:1.55, wordBreak:'break-word',
        boxShadow: isUser ? '0 2px 8px rgba(35,144,79,.3)' : '0 2px 8px rgba(0,0,0,.2)',
      }}>
        {/* Formater le texte avec markdown basique */}
        <MiniMarkdown text={msg.content}/>
        <div style={{ fontSize:10, opacity:.6, marginTop:4, textAlign:isUser?'right':'left' }}>
          {new Date(msg.time).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}
        </div>
      </div>
    </div>
  );
}

/* ── Mini renderer markdown ──────────────────────────────────────────────── */
function MiniMarkdown({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*|`[^`]+`)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*'))
          return <strong key={i}>{part.slice(1,-1)}</strong>;
        if (part.startsWith('`') && part.endsWith('`'))
          return <code key={i} style={{ fontFamily:'var(--font-mono)', fontSize:11, background:'rgba(255,255,255,.1)', padding:'1px 5px', borderRadius:3 }}>{part.slice(1,-1)}</code>;
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   WIDGET PRINCIPAL
════════════════════════════════════════════════════════════════════════════ */
export default function ChatWidget() {
  const { user } = useStore();
  const [open,      setOpen]      = useState(false);
  const [messages,  setMessages]  = useState([{
    role:    'assistant',
    content: `👋 Bonjour ! Je suis **BusBot**, votre assistant busGO.\n\nComment puis-je vous aider ?`,
    time:    Date.now(),
  }]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [unread,    setUnread]    = useState(0);
  const [error,     setError]     = useState(null);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, loading]);

  // Focus input quand ouvert
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role:'user', content:msg, time:Date.now() }]);
    setLoading(true);

    try {
      const res = await fetch(`${AGENT_URL}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          sessionId: SESSION_ID,
          message:   msg,
          platform:  'web',
          userName:  user?.name,
          userPhone: user?.phone,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const reply = data.response || 'Désolé, je n\'ai pas pu répondre.';
      setMessages(prev => [...prev, { role:'assistant', content:reply, time:Date.now() }]);

      if (!open) setUnread(n => n + 1);
    } catch (err) {
      setError('Connexion à l\'agent impossible. Vérifiez que l\'agent IA est démarré.');
      setMessages(prev => [...prev, {
        role:'assistant',
        content:'⚠️ Je ne suis pas disponible pour le moment. Réessayez dans quelques instants.',
        time:Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, open, user]);

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  async function resetChat() {
    await fetch(`${AGENT_URL}/api/chat/reset`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ sessionId: SESSION_ID }),
    }).catch(() => {});
    setMessages([{ role:'assistant', content:'🔄 Nouvelle conversation. Comment puis-je vous aider ?', time:Date.now() }]);
    setError(null);
  }

  return (
    <>
      {/* ── Bouton flottant ── */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position:'fixed', bottom:24, right:24, zIndex:500,
          width:56, height:56, borderRadius:'50%', border:'none', cursor:'pointer',
          background:'linear-gradient(135deg,var(--c-green-400),var(--c-green-600))',
          boxShadow:'0 4px 20px rgba(35,144,79,.5), 0 0 0 4px rgba(35,144,79,.15)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:24, transition:'all .25s',
          transform: open ? 'scale(0.9) rotate(15deg)' : 'scale(1)',
        }}>
        {open ? '✕' : '🤖'}
        {!open && unread > 0 && (
          <span style={{
            position:'absolute', top:-4, right:-4,
            background:'var(--c-red-400)', color:'#fff',
            borderRadius:'var(--r-full)', fontSize:9, fontWeight:800,
            padding:'2px 5px', border:'2px solid var(--bg)',
            minWidth:16, textAlign:'center',
          }}>{unread}</span>
        )}
      </button>

      {/* ── Fenêtre de chat ── */}
      {open && (
        <div style={{
          position:'fixed', bottom:92, right:24, zIndex:500,
          width:'min(380px, calc(100vw - 32px))',
          height:'min(580px, calc(100vh - 120px))',
          background:'var(--bg-card)', border:'1px solid var(--border-md)',
          borderRadius:'var(--r-xl)', overflow:'hidden',
          boxShadow:'var(--shadow-xl), var(--glow-green)',
          display:'flex', flexDirection:'column',
          animation:'fadeUp .3s var(--ease-spring)',
        }}>

          {/* Header */}
          <div style={{
            display:'flex', alignItems:'center', gap:10, padding:'14px 16px',
            background:'linear-gradient(135deg,var(--c-green-700),var(--c-green-800))',
            borderBottom:'1px solid var(--border-md)',
            flexShrink:0,
          }}>
            <div style={{
              width:36, height:36, borderRadius:'50%',
              background:'linear-gradient(135deg,var(--c-green-400),var(--c-green-600))',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
              boxShadow:'0 2px 8px rgba(35,144,79,.4)',
            }}>🤖</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800 }}>BusBot</div>
              <div style={{ fontSize:10, color:'var(--c-green-200)', display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:'pulse-dot 2s infinite' }}/>
                Assistant busGO · En ligne
              </div>
            </div>
            <button onClick={resetChat} title="Nouvelle conversation"
              style={{ background:'rgba(255,255,255,.1)', border:'none', color:'rgba(255,255,255,.7)', cursor:'pointer', padding:'5px 8px', borderRadius:'var(--r-sm)', fontSize:11 }}>
              🔄
            </button>
            <button onClick={() => setOpen(false)}
              style={{ background:'none', border:'none', color:'rgba(255,255,255,.7)', cursor:'pointer', fontSize:18, lineHeight:1, padding:4 }}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px', scrollbarWidth:'thin' }}>
            {messages.map((msg, i) => <Message key={i} msg={msg}/>)}
            {loading && (
              <div style={{ display:'flex', alignItems:'flex-end', gap:8, marginBottom:12 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--bg-elevated)', border:'1px solid var(--border-md)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>🤖</div>
                <div style={{ padding:'10px 14px', background:'var(--bg-elevated)', border:'1px solid var(--border-md)', borderRadius:'18px 18px 18px 4px' }}>
                  <Dots/>
                </div>
              </div>
            )}
            {error && (
              <div style={{ fontSize:11, color:'var(--c-red-400)', textAlign:'center', padding:'6px 10px', background:'rgba(192,57,43,.1)', borderRadius:'var(--r-sm)', marginBottom:8 }}>
                {error}
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Suggestions (si peu de messages) */}
          {messages.length <= 2 && !loading && (
            <div style={{ padding:'0 12px 8px', display:'flex', gap:6, flexWrap:'wrap', flexShrink:0 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)} style={{
                  padding:'4px 10px', borderRadius:'var(--r-full)', fontSize:11, fontWeight:500,
                  background:'var(--bg-elevated)', border:'1px solid var(--border-md)',
                  color:'var(--text-secondary)', cursor:'pointer', transition:'all .12s',
                  whiteSpace:'nowrap',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--c-green-700)'; e.currentTarget.style.color='var(--c-green-100)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='var(--bg-elevated)'; e.currentTarget.style.color='var(--text-secondary)'; }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            display:'flex', gap:8, padding:'10px 12px',
            borderTop:'1px solid var(--border)', flexShrink:0,
            background:'var(--bg-raised)',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Votre message…"
              rows={1}
              disabled={loading}
              style={{
                flex:1, background:'var(--bg-elevated)', border:'1px solid var(--border-md)',
                borderRadius:'var(--r-md)', padding:'9px 12px', color:'var(--text-primary)',
                fontSize:13, outline:'none', resize:'none', lineHeight:1.5,
                fontFamily:'var(--font-body)', maxHeight:100, overflow:'auto',
                transition:'border-color .2s',
              }}
              onFocus={e => { e.target.style.borderColor='var(--c-green-400)'; }}
              onBlur={e => { e.target.style.borderColor='var(--border-md)'; }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width:38, height:38, borderRadius:'var(--r-md)', border:'none',
                background: input.trim() && !loading ? 'var(--c-green-400)' : 'var(--bg-elevated)',
                color: input.trim() && !loading ? '#fff' : 'var(--text-muted)',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
                transition:'all .15s', flexShrink:0,
              }}>
              {loading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dotBounce {
          0%,80%,100% { transform:translateY(0); opacity:.4; }
          40%          { transform:translateY(-5px); opacity:1; }
        }
      `}</style>
    </>
  );
}
