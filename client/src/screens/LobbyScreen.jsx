import React, { useState } from 'react';
import { MAX_PLAYERS } from '../config/gameConfig';

export default function LobbyScreen({ room, playerId, isHost, onStart, onSetBots, onLeave }) {
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
    const message = `🃏 Think you can outsmart everyone at the table? 😏\nA crazy Kachuful showdown is about to begin — where sharp minds, risky moves, and bold cards decide the winner! 🔥✨\n\n🎮 Join here: *${joinUrl}*\nor use Room Code: *${room?.roomCode}*\n\nBring your best game face and maybe a little luck 👀`;

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
  const realPlayers = players.filter(player => !player.isBot);
  const humanCount = players.filter(player => !player.isBot).length;
  const botCount = players.filter(player => player.isBot).length;
  const maxBots = Math.max(0, MAX_PLAYERS - humanCount);
  const canStart = isHost && players.length >= 2;
  const isMobile = window.innerWidth < 768;
  const visibleLobbyRows = realPlayers.length + (botCount > 0 ? 1 : 0);

  return (
    <div className="premium-table" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: isMobile ? '16px 14px 78px' : '24px 24px 82px',
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'hidden',
    }}>
      <div style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: isMobile ? '2.1rem' : '2.5rem',
        color: '#FFE08A',
        textShadow: '0 4px 18px rgba(0,0,0,0.55), 0 0 18px rgba(214,168,79,0.28)',
        marginTop: isMobile ? 0 : 8,
        marginBottom: 4,
        textAlign: 'center',
        flexShrink: 0,
      }}>
        Kachuful
      </div>
      <div style={{ fontSize: '0.95rem', color: '#D8C7A7', marginBottom: isMobile ? 14 : 30, textAlign: 'center', fontWeight: 700, flexShrink: 0 }}>
        Waiting for players...
      </div>

      <div className="glass-panel" style={{
        width: 'min(440px, 100%)',
        borderRadius: 16,
        padding: isMobile ? '18px 16px' : '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: isMobile ? 'calc(100dvh - 174px)' : 'calc(100dvh - 210px)',
        minHeight: 0,
        overflow: 'hidden',
      }}>
        {/* Room code */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 16 : 24, flexShrink: 0 }}>
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

        {isHost && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 12px',
            marginBottom: 14,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.055)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#FFF6E6',
              fontSize: '0.9rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={botCount > 0}
                onChange={e => onSetBots(e.target.checked ? Math.min(1, maxBots) : 0)}
                disabled={maxBots === 0}
                style={{ accentColor: '#D6A84F' }}
              />
              Add Bots
            </label>

            <select
              value={botCount}
              onChange={e => onSetBots(Number(e.target.value))}
              disabled={maxBots === 0 || botCount === 0}
              style={{
                minWidth: 92,
                padding: '7px 10px',
                borderRadius: 8,
                background: 'rgba(7,20,38,0.78)',
                border: '1px solid rgba(255,224,138,0.26)',
                color: botCount > 0 ? '#FFE08A' : '#8C806D',
                fontWeight: 800,
                fontSize: '0.86rem',
              }}
            >
              <option value={0}>0 Bots</option>
              {Array.from({ length: maxBots }, (_, i) => i + 1).map(count => (
                <option key={count} value={count}>
                  {count} Bot{count !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Players list */}
        <div style={{
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}>
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
              {players.length} / {MAX_PLAYERS}
            </span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            paddingRight: 4,
            paddingBottom: 4,
            WebkitOverflowScrolling: 'touch',
          }}>
            {realPlayers.map((player) => (
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

            {botCount > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'linear-gradient(145deg, rgba(42,61,105,0.58), rgba(12,22,44,0.48))',
                border: '1px solid rgba(167,183,255,0.22)',
              }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'linear-gradient(180deg, #C7D2FE, #7D5CFF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  color: '#071426',
                  flexShrink: 0,
                }}>
                  +{botCount}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#F4F7FF' }}>
                    {botCount} bot opponent{botCount !== 1 ? 's' : ''} ready
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#C7D2FE', fontWeight: 700 }}>
                    Names reveal when the game starts
                  </div>
                </div>
                <div style={{
                  padding: '2px 7px',
                  borderRadius: 5,
                  background: 'rgba(167,183,255,0.14)',
                  border: '1px solid rgba(167,183,255,0.24)',
                  color: '#C7D2FE',
                  fontSize: '0.58rem',
                  fontWeight: 900,
                }}>
                  AI
                </div>
              </div>
            )}

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
        <div style={{
          flexShrink: 0,
          paddingTop: isMobile ? 10 : 12,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          {isHost ? (
            <div style={{
              display: 'flex',
              gap: 8,
              alignItems: 'stretch',
            }}>
              <button
                onClick={onStart}
                disabled={!canStart}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: isMobile ? '11px 10px' : '15px',
                  borderRadius: 8,
                  background: canStart ? 'linear-gradient(180deg, #FFE08A, #D6A84F 58%, #AD7B2F)' : 'rgba(214,168,79,0.18)',
                  color: canStart ? '#091626' : '#8C806D',
                  fontWeight: 800,
                  fontSize: isMobile ? '0.94rem' : '1.08rem',
                  cursor: canStart ? 'pointer' : 'not-allowed',
                  border: canStart ? '1px solid rgba(255,224,138,0.68)' : '1px solid rgba(255,224,138,0.12)',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {players.length < 2 ? 'Need 2+' : 'Start Game'}
              </button>

              <button
                onClick={onLeave}
                style={{
                  flex: isMobile ? '0 0 108px' : '0 0 128px',
                  padding: isMobile ? '11px 8px' : '15px 10px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.045)',
                  color: '#C8BA9D',
                  fontWeight: 800,
                  fontSize: isMobile ? '0.9rem' : '0.96rem',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.09)',
                  whiteSpace: 'nowrap',
                }}
              >
                Leave Room
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
              <div style={{
                flex: 1,
                minWidth: 0,
                textAlign: 'center',
                padding: isMobile ? '10px 8px' : '12px',
                color: '#C8BA9D',
                fontSize: isMobile ? '0.82rem' : '0.92rem',
                fontStyle: 'italic',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.045)',
                border: '1px solid rgba(255,255,255,0.08)',
                whiteSpace: isMobile ? 'normal' : 'nowrap',
              }}>
                Waiting for host...
              </div>

              <button
                onClick={onLeave}
                style={{
                  flex: isMobile ? '0 0 104px' : '0 0 128px',
                  padding: isMobile ? '10px 8px' : '12px 10px',
                  borderRadius: 8,
                  background: 'transparent',
                  color: '#C8BA9D',
                  fontWeight: 800,
                  fontSize: isMobile ? '0.86rem' : '0.9rem',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.08)',
                  whiteSpace: 'nowrap',
                }}
              >
                Leave Room
              </button>
            </div>
          )}
        </div>
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
