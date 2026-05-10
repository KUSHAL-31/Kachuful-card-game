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
  const cardWidth = isMobile ? 78 : 80;
  const overlapOffset = isMobile ? 45 : 36;
  const totalWidth = sorted.length > 1
    ? (sorted.length - 1) * overlapOffset + cardWidth
    : cardWidth;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {isMyTurn && phase === 'playing' && (
        <div style={{
          color: '#FFE08A',
          fontSize: '0.88rem',
          fontWeight: 800,
          letterSpacing: '0.05em',
          animation: 'pulse 1.5s ease infinite',
        }}>
          {selectedCard ? 'Click again to confirm' : 'Your turn — click a card to play'}
        </div>
      )}

      <div style={{
        position: 'relative',
        width: Math.min(totalWidth, window.innerWidth - 32),
        height: isMobile ? 146 : 142,
        paddingTop: 16,
        overflowX: totalWidth > window.innerWidth - 32 ? 'auto' : 'visible',
        overflowY: 'visible',
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
                top: 16,
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
        fontSize: '0.78rem',
        color: '#C8BA9D',
      }}>
        {selectedCard && isMyTurn && (
          <button
            onClick={() => setSelectedCard(null)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#FFF6E6',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '3px 10px',
              borderRadius: 4,
              fontSize: '0.78rem',
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
