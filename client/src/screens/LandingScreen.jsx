import React, { useState } from 'react';

const RULES = [
  { title: '🎯 Objective', body: 'Predict exactly how many tricks you will win each round. Score points only if your prediction is correct.' },
  { title: '🃏 The Deck & Deal', body: 'A standard 52-card deck is used. Cards dealt per round follow a pyramid: 1 card in round 1, increasing by 1 each round up to the max, then decreasing back to 1. With 2–5 players the max is 10 cards; with 6–10 players it scales down to fit the deck.' },
  { title: '♠ Trump Suit', body: 'Each round has a trump suit that rotates in order: Spades → Diamonds → Clubs → Hearts, then repeats. Trump cards beat all non-trump cards regardless of rank.' },
  { title: '📢 Bidding', body: 'Starting from the player left of the dealer, each player bids how many tricks they expect to win (0 to cards dealt). The dealer bids last and has a restriction — their bid cannot make the total bids equal the number of cards dealt. This keeps at least one player from winning their bid.' },
  { title: '🤚 Playing a Trick', body: "The player who won the last trick leads first. You must follow the led suit if you have it. If you don't have the led suit, you can play any card including trump. The highest trump wins the trick; if no trump is played, the highest card of the led suit wins." },
  { title: '🏆 Scoring', body: 'If you win exactly as many tricks as you bid: score = 10 + tricks won.\nIf you win more or fewer tricks than you bid: score = 0 for that round.\nBid 0 and win 0 → score 10. Bid 3 and win 3 → score 13.' },
  { title: '🔄 Rounds', body: 'The game runs through all rounds of the pyramid. After the final round the player with the highest total score wins. If scores are tied, all tied players share the win.' },
  { title: '👑 Dealer (Compulsory Player)', body: 'The dealer rotates each round. The dealer badge shows who it is. The dealer always bids last and faces the forbidden bid restriction.' },
];

export default function LandingScreen({ onJoined }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isMobile = window.innerWidth < 768;

  const params = new URLSearchParams(window.location.search);
  const prefilledCode = params.get('room')?.toUpperCase() || '';
  const [joinCode, setJoinCode] = useState(prefilledCode);
  const [tab, setTab] = useState(prefilledCode ? 'join' : 'create');
  const [showRules, setShowRules] = useState(false);

  const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

  const handleCreate = async () => {
    if (!name.trim()) return setError('Enter your name');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${SERVER}/room/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Failed to create room');
      onJoined({ roomCode: data.roomCode, playerName: name.trim(), isCreating: true });
    } catch (e) {
      setError('Cannot connect to server. Check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) return setError('Enter your name');
    if (!joinCode.trim() || joinCode.trim().length !== 6) return setError('Enter a 6-character room code');
    setLoading(true);
    setError('');
    try {
      const code = joinCode.trim().toUpperCase();
      const res = await fetch(`${SERVER}/room/${code}`);
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Room not found');
      onJoined({ roomCode: code, playerName: name.trim(), isCreating: false });
    } catch (e) {
      setError('Cannot connect to server. Check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-table" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile
        ? 'clamp(12px, 2vh, 24px) 16px clamp(72px, 13vh, 106px)'
        : '24px 24px 106px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Rules button */}
      <button
        onClick={() => setShowRules(true)}
        style={{
          position: 'absolute',
          top: isMobile ? 12 : 18,
          right: isMobile ? 12 : 18,
          zIndex: 3,
          padding: isMobile ? '7px 12px' : '9px 15px',
          borderRadius: 999,
          background: 'rgba(7,20,38,0.62)',
          color: '#FFE08A',
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          fontWeight: 900,
          border: '1px solid rgba(255,224,138,0.28)',
          boxShadow: '0 12px 26px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          cursor: 'pointer',
        }}
      >
        Rules
      </button>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 'clamp(12px, 2.5vh, 30px)' : 34 }}>
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: isMobile ? 'clamp(2rem, 5.5vh, 3.4rem)' : 'clamp(3rem, 8.5vw, 4.7rem)',
          color: '#FFE08A',
          lineHeight: 1,
          textShadow: '0 4px 18px rgba(0,0,0,0.55), 0 0 22px rgba(214,168,79,0.32)',
        }}>
          Kachuful
        </div>
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: isMobile ? 'clamp(0.8rem, 2.5vh, 1.2rem)' : 'clamp(1rem, 4vw, 1.4rem)',
          color: '#D8C7A7',
          marginTop: isMobile ? 4 : 6,
        }}>
          काचूफूल
        </div>
        <div style={{
          marginTop: isMobile ? 6 : 10,
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          fontSize: isMobile ? 'clamp(1rem, 3.5vh, 1.4rem)' : '1.5rem',
          color: '#FFE08A',
          opacity: 0.82,
        }}>
          {'♠︎'} {'♦︎'} {'♣︎'} {'♥︎'}
        </div>
        <div style={{ marginTop: isMobile ? 5 : 10, fontSize: 'clamp(0.7rem, 2.2vw, 0.9rem)', color: '#D8C7A7', fontWeight: 700 }}>
          Sharp minds, risky moves & lucky cards · 2–10 players
        </div>
      </div>

      {/* Card */}
      <div className="glass-panel" style={{
        width: 'min(440px, 100%)',
        borderRadius: 16,
        padding: isMobile ? 'clamp(14px, 2.5vh, 24px) clamp(14px, 4vw, 24px)' : '30px 26px',
      }}>
        {/* Slider toggle */}
        <div style={{
          position: 'relative',
          display: 'flex',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 10,
          padding: 4,
          marginBottom: isMobile ? 'clamp(12px, 2vh, 18px)' : 20,
        }}>
          <div style={{
            position: 'absolute',
            top: 4,
            left: tab === 'create' ? 4 : 'calc(50% + 2px)',
            width: 'calc(50% - 6px)',
            height: 'calc(100% - 8px)',
            borderRadius: 7,
            background: 'linear-gradient(180deg, #FFE08A, #D6A84F 62%, #AD7B2F)',
            boxShadow: '0 8px 18px rgba(214,168,79,0.22), inset 0 1px 0 rgba(255,255,255,0.55)',
            transition: 'left 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
          }} />
          {['create', 'join'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1,
                padding: isMobile ? 'clamp(7px, 1.2vh, 10px) 0' : '10px 0',
                borderRadius: 7,
                fontSize: isMobile ? '0.86rem' : '0.92rem',
                fontWeight: 800,
                background: 'transparent',
                color: tab === t ? '#091626' : '#C8BA9D',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 1,
                transition: 'color 0.22s ease',
              }}
            >
              {t === 'create' ? 'Create' : 'Join'}
            </button>
          ))}
        </div>

        {/* Name input */}
        <div style={{ marginBottom: isMobile ? 'clamp(10px, 1.8vh, 18px)' : 20 }}>
          <label style={{
            display: 'block',
            fontSize: isMobile ? '0.74rem' : '0.82rem',
            color: '#C8BA9D',
            marginBottom: isMobile ? 5 : 7,
            fontWeight: 800,
            letterSpacing: '0.08em',
          }}>
            YOUR NAME
          </label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            maxLength={20}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
            style={{
              width: '100%',
              padding: isMobile ? 'clamp(9px, 1.6vh, 12px) 12px' : '13px 15px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.075)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#FFF6E6',
              fontSize: isMobile ? '0.94rem' : '1.06rem',
              boxShadow: 'inset 0 1px 8px rgba(0,0,0,0.18)',
            }}
          />
        </div>

        {tab === 'join' && (
          <div style={{ marginBottom: isMobile ? 'clamp(10px, 1.8vh, 18px)' : 20 }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.74rem' : '0.82rem',
              color: '#C8BA9D',
              marginBottom: isMobile ? 5 : 7,
              fontWeight: 800,
              letterSpacing: '0.08em',
            }}>
              ROOM CODE
            </label>
            <input
              type="text"
              placeholder="6-character code"
              value={joinCode}
              maxLength={6}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              style={{
                width: '100%',
                padding: isMobile ? 'clamp(9px, 1.6vh, 12px) 12px' : '13px 15px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.075)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#FFF6E6',
                fontSize: isMobile ? '0.94rem' : '1.06rem',
                letterSpacing: '0.2em',
                fontWeight: 700,
                textAlign: 'center',
              }}
            />
          </div>
        )}

        {error && (
          <div style={{
            marginBottom: isMobile ? 10 : 16,
            padding: isMobile ? '6px 10px' : '8px 12px',
            borderRadius: 6,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#EF4444',
            fontSize: isMobile ? '0.8rem' : '0.86rem',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={tab === 'create' ? handleCreate : handleJoin}
          disabled={loading}
          style={{
            width: '100%',
            padding: isMobile ? 'clamp(10px, 1.8vh, 14px)' : '15px',
            borderRadius: 8,
            background: loading ? 'rgba(214,168,79,0.35)' : 'linear-gradient(180deg, #FFE08A, #D6A84F 58%, #AD7B2F)',
            color: '#091626',
            fontWeight: 700,
            fontSize: isMobile ? '0.96rem' : '1.08rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            border: '1px solid rgba(255,224,138,0.68)',
            transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 10px 24px rgba(214,168,79,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          {loading ? 'Connecting...' : tab === 'create' ? 'Create Room' : 'Join Room'}
        </button>
      </div>

      {showRules && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowRules(false)} style={{ flex: 1 }} />
          <div style={{
            width: 'min(360px, 92vw)',
            height: '100%',
            background: 'rgba(6,16,30,0.98)',
            borderLeft: '1px solid rgba(255,224,138,0.25)',
            boxShadow: '-18px 0 48px rgba(0,0,0,0.42)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '20px 18px',
            gap: 18,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.18rem', color: '#FFE08A', fontWeight: 700 }}>
                How to Play
              </div>
              <button onClick={() => setShowRules(false)} style={{ background: 'none', border: 'none', color: '#C8BA9D', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
            </div>
            {RULES.map(({ title, body }) => (
              <div key={title} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 14 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFE08A', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: '0.86rem', color: '#D8C7A7', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        position: 'fixed',
        left: '50%',
        bottom: 'calc(14px + env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)',
        zIndex: 5,
        width: isMobile ? 'calc(100vw - 32px)' : 'auto',
        maxWidth: '480px',
        textAlign: 'center',
        padding: isMobile ? '8px 14px' : '11px 18px',
        background: 'rgba(7,20,38,0.48)',
        borderRadius: 999,
        border: '1px solid rgba(255,224,138,0.18)',
        boxShadow: '0 12px 26px rgba(0,0,0,0.18)',
        color: '#D8C7A7',
        fontSize: isMobile ? '0.82rem' : '1rem',
        fontWeight: 800,
        backdropFilter: 'blur(12px)',
        whiteSpace: 'nowrap',
      }}>
        Developed by <span style={{ color: '#FFF6E6' }}>Kushal Soni</span>
        <span style={{ color: '#FFE08A', margin: '0 8px' }}>·</span>
        <a
          href="https://github.com/KUSHAL-31"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#FFE08A', textDecoration: 'none', borderBottom: '1px solid rgba(255,224,138,0.42)' }}
        >
          GitHub
        </a>
      </div>
    </div>
  );
}
