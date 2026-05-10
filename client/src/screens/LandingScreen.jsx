import React, { useState } from 'react';

export default function LandingScreen({ onJoined }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isMobile = window.innerWidth < 768;

  // Pre-fill room code and switch to join tab if ?room= is in the URL
  const params = new URLSearchParams(window.location.search);
  const prefilledCode = params.get('room')?.toUpperCase() || '';
  const [joinCode, setJoinCode] = useState(prefilledCode);
  const [tab, setTab] = useState(prefilledCode ? 'join' : 'create');

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
    } catch {
      setError('Cannot connect to server');
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
    } catch {
      setError('Cannot connect to server');
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
      padding: '24px 24px 86px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 34 }}>
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(3rem, 8.5vw, 4.7rem)',
          color: '#FFE08A',
          lineHeight: 1,
          textShadow: '0 4px 18px rgba(0,0,0,0.55), 0 0 22px rgba(214,168,79,0.32)',
        }}>
          Kachuful
        </div>
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(1rem, 4vw, 1.4rem)',
          color: '#D8C7A7',
          marginTop: 6,
        }}>
          काचूफूल
        </div>
        <div style={{
          marginTop: 10,
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          fontSize: '1.5rem',
          color: '#FFE08A',
          opacity: 0.82,
        }}>
          ♠ ♦ ♣ ♥
        </div>
        <div style={{ marginTop: 10, fontSize: '0.9rem', color: '#D8C7A7', fontWeight: 700 }}>
          Sharp minds, risky moves & lucky cards · 2–7 players
        </div>
      </div>

      {/* Card */}
      <div className="glass-panel" style={{
        width: 'min(440px, 100%)',
        borderRadius: 16,
        padding: '30px 26px',
      }}>
        {/* Name input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', color: '#C8BA9D', marginBottom: 7, fontWeight: 800, letterSpacing: '0.08em' }}>
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
              padding: '13px 15px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.075)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#FFF6E6',
              fontSize: '1.06rem',
              boxShadow: 'inset 0 1px 8px rgba(0,0,0,0.18)',
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {['create', 'join'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 8,
                fontSize: '0.92rem',
                fontWeight: 800,
                background: tab === t ? 'linear-gradient(180deg, #FFE08A, #D6A84F 62%, #AD7B2F)' : 'rgba(255,255,255,0.07)',
                color: tab === t ? '#091626' : '#C8BA9D',
                border: tab === t ? '1px solid rgba(255,224,138,0.75)' : '1px solid rgba(255,255,255,0.10)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: tab === t ? '0 8px 18px rgba(214,168,79,0.22), inset 0 1px 0 rgba(255,255,255,0.55)' : 'none',
              }}
            >
              {t === 'create' ? 'Create Room' : 'Join Room'}
            </button>
          ))}
        </div>

        {tab === 'join' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#C8BA9D', marginBottom: 7, fontWeight: 800, letterSpacing: '0.08em' }}>
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
                padding: '13px 15px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.075)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#FFF6E6',
                fontSize: '1.06rem',
                letterSpacing: '0.2em',
                fontWeight: 700,
                textAlign: 'center',
              }}
            />
          </div>
        )}

        {error && (
          <div style={{
            marginBottom: 16,
            padding: '8px 12px',
            borderRadius: 6,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#EF4444',
            fontSize: '0.86rem',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={tab === 'create' ? handleCreate : handleJoin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: 8,
            background: loading ? 'rgba(214,168,79,0.35)' : 'linear-gradient(180deg, #FFE08A, #D6A84F 58%, #AD7B2F)',
            color: '#091626',
            fontWeight: 700,
            fontSize: '1.08rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            border: '1px solid rgba(255,224,138,0.68)',
            transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 10px 24px rgba(214,168,79,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          {loading ? 'Connecting...' : tab === 'create' ? 'Create Room' : 'Join Room'}
        </button>
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed',
        left: '50%',
        bottom: 'calc(14px + env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)',
        zIndex: 5,
        width: isMobile ? 'calc(100vw - 32px)' : 'auto',
        maxWidth: '440px',
        textAlign: 'center',
        padding: isMobile ? '9px 12px' : '10px 16px',
        background: 'rgba(7,20,38,0.48)',
        borderRadius: 999,
        border: '1px solid rgba(255,224,138,0.18)',
        boxShadow: '0 12px 26px rgba(0,0,0,0.18)',
        color: '#D8C7A7',
        fontSize: isMobile ? '0.84rem' : '0.92rem',
        fontWeight: 800,
        backdropFilter: 'blur(12px)',
        whiteSpace: isMobile ? 'normal' : 'nowrap',
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
