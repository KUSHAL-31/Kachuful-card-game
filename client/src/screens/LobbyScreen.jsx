import React, { useState } from 'react';

export default function LobbyScreen({ room, playerId, isHost, onStart, onLeave }) {
  const [copied, setCopied] = useState(false);
  const [inviteStatus, setInviteStatus] = useState('idle');

  const copyToClipboard = async (text) => {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const copiedText = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (!copiedText) {
      throw new Error('Clipboard copy failed');
    }
  };

  const copyCode = () => {
    copyToClipboard(room.roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleInvite = async () => {
    const joinUrl = `${window.location.origin}/?room=${room?.roomCode}`;
    const message = `🃏 Think you can outsmart everyone at the table? 😏\nA crazy Kachuful showdown is about to begin — where sharp minds, risky moves, and lucky cards decide the winner! 🔥✨\n\n🎮 Join here: *${joinUrl}*\nor use Room Code: *${room?.roomCode}*\n\nBring your best game face… and maybe a little luck 👀`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join my Kachuful game!',
          text: message,
          url: joinUrl,
        });
        setInviteStatus('shared');
      } else {
        await copyToClipboard(message);
        setInviteStatus('copied');
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      try {
        await copyToClipboard(message);
        setInviteStatus('copied');
      } catch {
        setInviteStatus('failed');
      }
    }

    setTimeout(() => setInviteStatus('idle'), 2500);
  };

  const players = room?.players || [];
  const canStart = isHost && players.length >= 2;

  return (
    <div className="premium-table" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: '2.5rem',
        color: '#FFE08A',
        textShadow: '0 4px 18px rgba(0,0,0,0.55), 0 0 18px rgba(214,168,79,0.28)',
        marginBottom: 4,
        textAlign: 'center',
      }}>
        Kachuful
      </div>
      <div style={{ fontSize: '0.95rem', color: '#D8C7A7', marginBottom: 30, textAlign: 'center', fontWeight: 700 }}>
        Waiting for players...
      </div>

      <div className="glass-panel" style={{
        width: 'min(440px, 100%)',
        borderRadius: 16,
        padding: '24px 20px',
      }}>
        {/* Room code */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '0.78rem', color: '#C8BA9D', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>
            ROOM CODE
          </div>
          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontVariantNumeric: 'lining-nums',
            fontSize: '3rem',
            color: '#FFE08A',
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
                background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.075)',
                border: copied ? '1px solid #22C55E' : '1px solid rgba(255,255,255,0.1)',
                color: copied ? '#22C55E' : '#C8BA9D',
                fontSize: '0.8rem',
                fontWeight: 800,
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
                background: inviteStatus === 'copied' || inviteStatus === 'shared'
                  ? 'rgba(34,197,94,0.15)'
                  : inviteStatus === 'failed'
                  ? 'rgba(239,68,68,0.15)'
                  : 'rgba(255,224,138,0.14)',
                border: inviteStatus === 'copied' || inviteStatus === 'shared'
                  ? '1px solid #22C55E'
                  : inviteStatus === 'failed'
                  ? '1px solid #EF4444'
                  : '1px solid rgba(255,224,138,0.45)',
                color: inviteStatus === 'copied' || inviteStatus === 'shared'
                  ? '#22C55E'
                  : inviteStatus === 'failed'
                  ? '#EF4444'
                  : '#FFE08A',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {inviteStatus === 'shared'
                ? '✓ Shared!'
                : inviteStatus === 'copied'
                ? '✓ Invite Copied!'
                : inviteStatus === 'failed'
                ? 'Copy Failed'
                : '🔗 Send Invite'}
            </button>
          </div>
        </div>

        {/* Invite note */}
        {isHost && (
          <div style={{
            fontSize: '0.72rem',
            color: '#C8BA9D',
            textAlign: 'center',
            padding: '6px 10px',
            marginBottom: 8,
            background: 'rgba(255,255,255,0.055)',
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
            <span style={{ fontSize: '0.8rem', color: '#C8BA9D', fontWeight: 800, letterSpacing: '0.08em' }}>
              PLAYERS
            </span>
            <span style={{ fontSize: '0.82rem', color: '#C8BA9D', fontWeight: 800 }}>
              {players.length} / 7
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((player, i) => (
              <div key={player.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                background: player.id === playerId
                  ? 'rgba(255,224,138,0.13)'
                  : 'rgba(255,255,255,0.055)',
                border: player.id === playerId
                  ? '1px solid rgba(255,224,138,0.38)'
                  : '1px solid rgba(255,255,255,0.08)',
                boxShadow: player.id === playerId ? '0 8px 18px rgba(0,0,0,0.18)' : 'none',
              }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'linear-gradient(180deg, #FFE08A, #D6A84F)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#091626',
                  flexShrink: 0,
                }}>
                  {player.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FFF6E6' }}>
                    {player.name}
                    {player.id === playerId && (
                      <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#C8BA9D' }}>(you)</span>
                    )}
                  </div>
                  {room?.hostId === player.id && (
                    <div style={{ fontSize: '0.72rem', color: '#FFE08A', fontWeight: 800 }}>Host</div>
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
                color: '#C8BA9D',
                fontSize: '0.86rem',
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
              padding: '15px',
              borderRadius: 8,
              background: canStart ? 'linear-gradient(180deg, #FFE08A, #D6A84F 58%, #AD7B2F)' : 'rgba(214,168,79,0.18)',
              color: canStart ? '#091626' : '#8C806D',
              fontWeight: 700,
              fontSize: '1.08rem',
              cursor: canStart ? 'pointer' : 'not-allowed',
              border: canStart ? '1px solid rgba(255,224,138,0.68)' : '1px solid rgba(255,224,138,0.12)',
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
            color: '#C8BA9D',
            fontSize: '0.92rem',
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
            color: '#C8BA9D',
            fontWeight: 600,
            fontSize: '0.9rem',
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
