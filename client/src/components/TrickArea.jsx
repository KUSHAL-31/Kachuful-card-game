import React from 'react';
import Card from './Card';

export default function TrickArea({ currentTrick, players, trumpSuit, winnerId }) {
  if (!currentTrick || currentTrick.length === 0) {
    return (
      <div style={{
        width: '100%',
        minHeight: 130,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#A89B8C',
        fontSize: '0.75rem',
        fontStyle: 'italic',
        background: 'rgba(0,0,0,0.15)',
        borderRadius: 12,
        border: '1px dashed rgba(212,160,23,0.3)',
      }}>
        Waiting for first card...
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      minHeight: 130,
      background: 'rgba(0,0,0,0.2)',
      borderRadius: 12,
      border: '1px solid rgba(212,160,23,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 12,
      padding: '12px 16px',
    }}>
      {currentTrick.map(({ playerId, card, seatIndex }) => {
        const player = players.find(p => p.id === playerId);
        const isWinner = winnerId && playerId === winnerId;

        return (
          <div key={playerId} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            animation: 'fade-in 0.3s ease',
          }}>
            <div style={{
              outline: isWinner ? '2px solid #FFD700' : 'none',
              outlineOffset: 3,
              borderRadius: 10,
              animation: isWinner ? 'glow-gold 0.8s ease infinite' : 'none',
            }}>
              <Card
                card={card}
                isTrump={card.suit === trumpSuit}
                size="trick"
                playerName={player?.name || 'Unknown'}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
