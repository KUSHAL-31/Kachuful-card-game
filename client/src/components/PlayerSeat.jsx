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

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '8px 10px',
    borderRadius: 12,
    background: isActive
      ? 'rgba(255,215,0,0.12)'
      : isMe
      ? 'rgba(212,160,23,0.1)'
      : 'rgba(15,37,68,0.6)',
    border: isActive
      ? '1.5px solid #FFD700'
      : isMe
      ? '1.5px solid rgba(212,160,23,0.6)'
      : '1px solid rgba(255,255,255,0.08)',
    minWidth: 80,
    maxWidth: 110,
    transition: 'all 0.3s ease',
    animation: isActive ? 'glow-gold 1.5s ease infinite' : 'none',
    position: 'relative',
  };

  return (
    <div style={containerStyle}>
      {isCompulsory && (
        <div style={{
          position: 'absolute',
          top: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#D4A017',
          color: '#0F2544',
          fontSize: '0.45rem',
          fontWeight: 700,
          padding: '1px 5px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          letterSpacing: '0.05em',
        }}>
          DEALER
        </div>
      )}

      {/* Player name */}
      <div style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        color: isActive ? '#FFD700' : isMe ? '#D4A017' : '#F5F0E8',
        textAlign: 'center',
        maxWidth: 90,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {player.name}
        {isMe && (
          <span style={{ fontSize: '0.5rem', color: '#A89B8C', marginLeft: 3 }}>(you)</span>
        )}
      </div>

      {/* Thinking indicator */}
      {isActive && (
        <div style={{
          fontSize: '0.55rem',
          color: '#FFD700',
          animation: 'pulse 1s ease infinite',
          fontWeight: 600,
        }}>
          {phase === 'bidding' ? 'BIDDING...' : 'THINKING...'}
        </div>
      )}

      {/* Bid / Tricks info */}
      {phase !== 'bidding' || hasBid ? (
        <div style={{
          display: 'flex',
          gap: 8,
          fontSize: '0.6rem',
          color: '#A89B8C',
        }}>
          {hasBid && (
            <span>Bid: <strong style={{ color: '#F5F0E8' }}>{bid}</strong></span>
          )}
          {phase === 'playing' && tricksWon !== undefined && (
            <span>Won: <strong style={{
              color: tricksWon === bid ? '#22C55E' : '#F5F0E8',
            }}>{tricksWon}</strong></span>
          )}
        </div>
      ) : null}
    </div>
  );
}
