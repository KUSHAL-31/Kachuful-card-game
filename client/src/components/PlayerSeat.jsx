import React from 'react';
import Card from './Card';

export default function PlayerSeat({
  player,
  bid,
  tricksWon,
  handSize,
  isCompulsory,
  isCurrentTurn,
  isCurrentBidder,
  phase,
  position,
  isMe,
}) {
  const isActive = isCurrentTurn || isCurrentBidder;
  const hasBid = bid !== undefined && bid !== null;
  const isBot = !!player.isBot;
  const isDesktop = window.innerWidth >= 768;

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '11px 14px',
    borderRadius: 14,
    background: isActive
      ? isBot
        ? 'linear-gradient(145deg, rgba(125,92,255,0.28), rgba(17,34,64,0.9))'
        : 'linear-gradient(145deg, rgba(255,224,138,0.18), rgba(7,20,38,0.78))'
      : isBot
      ? 'linear-gradient(145deg, rgba(42,61,105,0.88), rgba(12,22,44,0.78))'
      : 'linear-gradient(145deg, rgba(16,39,67,0.72), rgba(7,20,38,0.58))',
    border: isActive
      ? isBot ? '1.5px solid #A7B7FF' : '1.5px solid #FFE08A'
      : isBot ? '1px solid rgba(167,183,255,0.34)' : '1px solid rgba(255,255,255,0.10)',
    boxShadow: isActive
      ? isBot
        ? isDesktop ? '0 5px 12px rgba(0,0,0,0.18), 0 0 14px rgba(125,92,255,0.24)' : '0 12px 26px rgba(0,0,0,0.3), 0 0 20px rgba(125,92,255,0.34)'
        : isDesktop ? '0 5px 12px rgba(0,0,0,0.18)' : '0 12px 26px rgba(0,0,0,0.3)'
      : isBot
      ? isDesktop ? '0 3px 8px rgba(0,0,0,0.14), inset 0 0 14px rgba(99,179,237,0.06)' : '0 8px 18px rgba(0,0,0,0.2), inset 0 0 18px rgba(99,179,237,0.08)'
      : isDesktop ? '0 3px 8px rgba(0,0,0,0.12)' : '0 8px 18px rgba(0,0,0,0.18)',
    minWidth: 104,
    maxWidth: 142,
    flex: '0 0 auto',
    transition: 'all 0.3s ease',
    animation: isActive ? 'glow-gold 1.5s ease infinite' : 'none',
    position: 'relative',
  };

  return (
    <div style={containerStyle}>
      {isCompulsory && (
        <div style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(180deg, #FFE08A, #D6A84F)',
          color: '#091626',
          fontSize: '0.55rem',
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: 5,
          whiteSpace: 'nowrap',
          letterSpacing: '0.05em',
        }}>
          DEALER
        </div>
      )}

      {/* Player name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        fontSize: '0.86rem',
        fontWeight: 800,
        color: isActive ? (isBot ? '#C7D2FE' : '#FFE08A') : '#F4F7FF',
        textAlign: 'center',
        maxWidth: 124,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {isBot && (
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#A7B7FF',
            flexShrink: 0,
          }} />
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</span>
        {isMe && (
          <span style={{ fontSize: '0.62rem', color: '#C8BA9D', marginLeft: 4 }}>(you)</span>
        )}
      </div>

      {/* Thinking indicator */}
      {isActive && (
        <div style={{
          fontSize: '0.66rem',
          color: isBot ? '#C7D2FE' : '#FFE08A',
          animation: 'pulse 1s ease infinite',
          fontWeight: 800,
        }}>
          {phase === 'bidding' ? 'BIDDING...' : 'THINKING...'}
        </div>
      )}

      {/* Bid / Tricks info */}
      {phase !== 'bidding' || hasBid ? (
        <div style={{
          display: 'flex',
          gap: 10,
          fontSize: '0.72rem',
          color: '#C8BA9D',
        }}>
          {hasBid && (
            <span>Bid: <strong style={{ color: '#FFF6E6' }}>{bid}</strong></span>
          )}
          {phase === 'playing' && tricksWon !== undefined && (
            <span>Won: <strong style={{
              color: tricksWon === bid ? '#6EE7B7' : '#FFF6E6',
            }}>{tricksWon}</strong></span>
          )}
        </div>
      ) : null}
    </div>
  );
}
