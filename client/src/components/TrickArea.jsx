import React from 'react';
import Card from './Card';

export default function TrickArea({ currentTrick, players, trumpSuit, winnerId }) {
  const isMobile = window.innerWidth < 768;
  const tableHeight = isMobile ? 184 : 176;
  const cardCount = currentTrick?.length || 0;
  const overlap = isMobile
    ? cardCount >= 8 ? -58 : cardCount >= 6 ? -54 : -46
    : cardCount >= 8 ? -48 : cardCount >= 6 ? -42 : -34;
  const fanWidth = cardCount > 0
    ? 82 + Math.max(0, cardCount - 1) * (82 + overlap)
    : 0;

  if (!currentTrick || currentTrick.length === 0) {
    return (
      <div style={{
        width: '100%',
        minHeight: isMobile ? 150 : 160,
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
      height: tableHeight,
      minHeight: tableHeight,
      maxHeight: tableHeight,
      background: 'radial-gradient(ellipse at center, rgba(255,224,138,0.08), rgba(0,0,0,0.22))',
      borderRadius: 12,
      border: '1px solid rgba(255,224,138,0.24)',
      boxShadow: 'inset 0 1px 24px rgba(0,0,0,0.26), 0 10px 24px rgba(0,0,0,0.18)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'nowrap',
      padding: isMobile ? '16px 12px' : '16px 18px',
      overflowX: 'hidden',
      overflowY: 'hidden',
    }}>
      <div style={{
        width: Math.min(fanWidth, isMobile ? 310 : 460),
        maxWidth: '100%',
        height: isMobile ? 160 : 148,
        position: 'relative',
      }}>
      {currentTrick.map(({ playerId, card, seatIndex }, index) => {
        const player = players.find(p => p.id === playerId);
        const isWinner = winnerId && playerId === winnerId;
        const centerOffset = index - (cardCount - 1) / 2;
        const xStep = cardCount >= 8 ? (isMobile ? 25 : 34) : cardCount >= 6 ? (isMobile ? 28 : 38) : (isMobile ? 35 : 48);
        const rotate = Math.max(-16, Math.min(16, centerOffset * (cardCount > 6 ? 4 : 6)));
        const yOffset = Math.abs(centerOffset) * (isMobile ? 2.5 : 3);

        return (
          <div key={playerId} style={{
            position: 'absolute',
            left: `calc(50% + ${centerOffset * xStep}px)`,
            top: `calc(50% + ${yOffset}px)`,
            transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
            transformOrigin: 'center center',
            zIndex: isWinner ? 50 : index + 1,
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
              />
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
