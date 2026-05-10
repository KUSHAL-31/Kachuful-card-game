import React, { useState } from 'react';

export default function LandingScreen({ onJoined }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'radial-gradient(ellipse at center, #2D6A4F 0%, #1B4332 60%, #0a2618 100%)',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(2.5rem, 8vw, 4rem)',
          color: '#D4A017',
          lineHeight: 1,
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>
          Kachuful
        </div>
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(1rem, 4vw, 1.4rem)',
          color: '#A89B8C',
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
          color: '#D4A017',
          opacity: 0.7,
        }}>
          ♠ ♦ ♣ ♥
        </div>
        <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#A89B8C' }}>
          Trick-taking card game · 2–7 players
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: 'min(380px, 100%)',
        background: 'rgba(15,37,68,0.85)',
        borderRadius: 16,
        border: '1px solid rgba(212,160,23,0.3)',
        padding: '28px 24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        {/* Name input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#A89B8C', marginBottom: 6, fontWeight: 600 }}>
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
              padding: '11px 14px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#F5F0E8',
              fontSize: '1rem',
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
                padding: '8px 0',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 600,
                background: tab === t ? '#D4A017' : 'rgba(255,255,255,0.06)',
                color: tab === t ? '#0F2544' : '#A89B8C',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t === 'create' ? 'Create Room' : 'Join Room'}
            </button>
          ))}
        </div>

        {tab === 'join' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#A89B8C', marginBottom: 6, fontWeight: 600 }}>
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
                padding: '11px 14px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F5F0E8',
                fontSize: '1rem',
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
            fontSize: '0.75rem',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={tab === 'create' ? handleCreate : handleJoin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 8,
            background: loading ? 'rgba(212,160,23,0.4)' : '#D4A017',
            color: '#0F2544',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            border: 'none',
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Connecting...' : tab === 'create' ? 'Create Room' : 'Join Room'}
        </button>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 28,
        textAlign: 'center',
        padding: '14px 20px',
        background: 'rgba(15,37,68,0.6)',
        borderRadius: 12,
        border: '1px solid rgba(212,160,23,0.2)',
        width: 'min(380px, 100%)',
      }}>
        <div style={{ fontSize: '0.65rem', color: '#A89B8C', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 4 }}>
          DEVELOPED BY
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F5F0E8', marginBottom: 6 }}>
          Kushal Soni
        </div>
        <div style={{ fontSize: '0.75rem', color: '#A89B8C' }}>
          To know more:{' '}
          <a
            href="https://github.com/KUSHAL-31"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#D4A017',
              textDecoration: 'none',
              fontWeight: 600,
              borderBottom: '1px solid rgba(212,160,23,0.4)',
              paddingBottom: 1,
            }}
          >
            github.com/KUSHAL-31
          </a>
        </div>
      </div>
    </div>
  );
}
