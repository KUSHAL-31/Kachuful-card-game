import React, { useState } from 'react';
import Card from './Card';
import { sortHand, isValidPlay } from '../utils/cardUtils';

export default function Hand({ hand, onPlayCard, isMyTurn, leadSuit, trumpSuit, phase }) {
  const [selectedCard, setSelectedCard] = useState(null);

  if (!hand || hand.length === 0) return null;

  const sorted = sortHand(hand);

  const handleCardClick = (card) => {
    if (!isMyTurn || phase !== 'playing') return;
    const valid = isValidPlay(card, hand, leadSuit);
    if (!valid) return;

    if (selectedCard && selectedCard.suit === card.suit && selectedCard.rank === card.rank) {
      // Second click confirms play
      onPlayCard(card);
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  const isMobile = window.innerWidth < 768;
  const overlapOffset = isMobile ? 28 : 32;
  const totalWidth = sorted.length > 1
    ? (sorted.length - 1) * overlapOffset + (isMobile ? 60 : 75)
    : isMobile ? 60 : 75;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {isMyTurn && phase === 'playing' && (
        <div style={{
          color: '#FFD700',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          animation: 'pulse 1.5s ease infinite',
        }}>
          {selectedCard ? 'Click again to confirm' : 'Your turn — click a card to play'}
        </div>
      )}

      <div style={{
        position: 'relative',
        width: Math.min(totalWidth, window.innerWidth - 32),
        height: isMobile ? 95 : 110,
        overflowX: totalWidth > window.innerWidth - 32 ? 'auto' : 'visible',
      }}>
        {sorted.map((card, i) => {
          const isSelected = selectedCard?.suit === card.suit && selectedCard?.rank === card.rank;
          const valid = isMyTurn && phase === 'playing' ? isValidPlay(card, hand, leadSuit) : true;
          const disabled = !isMyTurn || phase !== 'playing' || !valid;

          return (
            <div
              key={`${card.suit}-${card.rank}`}
              style={{
                position: 'absolute',
                left: i * overlapOffset,
                top: 0,
                zIndex: isSelected ? 100 : i + 1,
                transition: 'left 0.2s ease',
              }}
            >
              <Card
                card={card}
                onClick={() => handleCardClick(card)}
                disabled={disabled}
                selected={isSelected}
                isTrump={card.suit === trumpSuit}
                size={isMobile ? 'mobile' : 'normal'}
              />
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        fontSize: '0.65rem',
        color: '#A89B8C',
      }}>
        {selectedCard && isMyTurn && (
          <button
            onClick={() => setSelectedCard(null)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#F5F0E8',
              padding: '3px 10px',
              borderRadius: 4,
              fontSize: '0.65rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
