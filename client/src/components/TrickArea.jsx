import React from 'react';
import Card from './Card';

export default function TrickArea({ currentTrick, players, trumpSuit, winnerId }) {
  if (!currentTrick || currentTrick.length === 0) {
    return (
      <div style={{
        width: '100%',
        minHeight: 160,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#D8C7A7',
        fontSize: '0.9rem',
        fontStyle: 'italic',
        background: 'radial-gradient(ellipse at center, rgba(255,224,138,0.08), rgba(0,0,0,0.18))',
        borderRadius: 12,
        border: '1px dashed rgba(255,224,138,0.34)',
        boxShadow: 'inset 0 1px 22px rgba(0,0,0,0.24)',
      }}>
        Waiting for first card...
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      minHeight: 160,
      background: 'radial-gradient(ellipse at center, rgba(255,224,138,0.08), rgba(0,0,0,0.22))',
      borderRadius: 12,
      border: '1px solid rgba(255,224,138,0.24)',
      boxShadow: 'inset 0 1px 24px rgba(0,0,0,0.26), 0 10px 24px rgba(0,0,0,0.18)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 16,
      padding: '16px 18px',
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
              outline: isWinner ? '2px solid #FFE08A' : 'none',
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
