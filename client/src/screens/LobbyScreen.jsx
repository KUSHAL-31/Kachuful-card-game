import React, { useState } from 'react';

export default function LobbyScreen({ room, playerId, isHost, onStart, onLeave }) {
  const [copied, setCopied] = useState(false);
  const [invited, setInvited] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(room.roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const inviteUrl = `${window.location.origin}/?room=${room?.roomCode}`;

  const handleInvite = () => {
    const message = `🃏 Think you can outsmart everyone at the table? 😏\nA crazy Kachuful showdown is about to begin — where sharp minds, risky moves, and lucky cards decide the winner! 🔥✨\n\n🎮 Join here: *${window.location.origin}/?room=${room?.roomCode}*\nor use Room Code: *${room?.roomCode}*\n\nBring your best game face… and maybe a little luck 👀`;
    if (navigator.share) {
      navigator.share({
        title: 'Join my Kachuful game!',
        text: message,
      });
    } else {
      navigator.clipboard.writeText(message).then(() => {
        setInvited(true);
        setTimeout(() => setInvited(false), 2500);
      });
    }
  };

  const players = room?.players || [];
  const canStart = isHost && players.length >= 2;

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
      <div style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: '2rem',
        color: '#D4A017',
        marginBottom: 4,
        textAlign: 'center',
      }}>
        Kachuful
      </div>
      <div style={{ fontSize: '0.8rem', color: '#A89B8C', marginBottom: 32, textAlign: 'center' }}>
        Waiting for players...
      </div>

      <div style={{
        width: 'min(380px, 100%)',
        background: 'rgba(15,37,68,0.85)',
        borderRadius: 16,
        border: '1px solid rgba(212,160,23,0.3)',
        padding: '24px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        {/* Room code */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '0.65rem', color: '#A89B8C', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 8 }}>
            ROOM CODE
          </div>
          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontVariantNumeric: 'lining-nums',
            fontSize: '2.5rem',
            color: '#D4A017',
            letterSpacing: '0.3em',
            fontWeight: 700,
            lineHeight: 1,
          }}>
            {room?.roomCode}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            <button
              onClick={copyCode}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                border: copied ? '1px solid #22C55E' : '1px solid rgba(255,255,255,0.1)',
                color: copied ? '#22C55E' : '#A89B8C',
                fontSize: '0.7rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={handleInvite}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                background: invited ? 'rgba(34,197,94,0.15)' : 'rgba(212,160,23,0.15)',
                border: invited ? '1px solid #22C55E' : '1px solid rgba(212,160,23,0.5)',
                color: invited ? '#22C55E' : '#D4A017',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {invited ? '✓ Link Copied!' : '🔗 Send Invite'}
            </button>
          </div>
        </div>

        {/* Invite note */}
        {isHost && (
          <div style={{
            fontSize: '0.6rem',
            color: '#A89B8C',
            textAlign: 'center',
            padding: '6px 10px',
            marginBottom: 8,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 6,
            lineHeight: 1.5,
          }}>
            After sharing invite, return to this screen within 60s to keep the room active.
          </div>
        )}

        {/* Players list */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
            <span style={{ fontSize: '0.7rem', color: '#A89B8C', fontWeight: 600, letterSpacing: '0.08em' }}>
              PLAYERS
            </span>
            <span style={{ fontSize: '0.7rem', color: '#A89B8C' }}>
              {players.length} / 7
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((player, i) => (
              <div key={player.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: player.id === playerId
                  ? 'rgba(212,160,23,0.12)'
                  : 'rgba(255,255,255,0.04)',
                border: player.id === playerId
                  ? '1px solid rgba(212,160,23,0.3)'
                  : '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#D4A017',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#0F2544',
                  flexShrink: 0,
                }}>
                  {player.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F5F0E8' }}>
                    {player.name}
                    {player.id === playerId && (
                      <span style={{ marginLeft: 6, fontSize: '0.6rem', color: '#A89B8C' }}>(you)</span>
                    )}
                  </div>
                  {room?.hostId === player.id && (
                    <div style={{ fontSize: '0.6rem', color: '#D4A017', fontWeight: 600 }}>Host</div>
                  )}
                </div>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: player.isConnected ? '#22C55E' : '#EF4444',
                }} />
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 2 - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px dashed rgba(255,255,255,0.1)',
                color: '#A89B8C',
                fontSize: '0.75rem',
                textAlign: 'center',
              }}>
                Waiting for player...
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {isHost ? (
          <button
            onClick={onStart}
            disabled={!canStart}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 8,
              background: canStart ? '#D4A017' : 'rgba(212,160,23,0.2)',
              color: canStart ? '#0F2544' : '#888',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: canStart ? 'pointer' : 'not-allowed',
              border: 'none',
              marginBottom: 10,
              transition: 'all 0.2s',
            }}
          >
            {players.length < 2 ? 'Waiting for 2+ players...' : 'Start Game'}
          </button>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '12px',
            color: '#A89B8C',
            fontSize: '0.8rem',
            fontStyle: 'italic',
          }}>
            Waiting for host to start the game...
          </div>
        )}

        <button
          onClick={onLeave}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 8,
            background: 'transparent',
            color: '#A89B8C',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
