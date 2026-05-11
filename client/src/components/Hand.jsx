import React, { useRef, useState } from 'react';
import Card from './Card';
import { sortHand, isValidPlay } from '../utils/cardUtils';

export default function Hand({ hand, onPlayCard, isMyTurn, leadSuit, trumpSuit, phase }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [dragState, setDragState] = useState(null);
  const dragRef = useRef(null);

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

  const startDrag = (event, card, disabled) => {
    if (disabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const nextState = {
      card,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: 0,
      y: 0,
      moved: false,
    };
    dragRef.current = nextState;
    setDragState(nextState);
  };

  const moveDrag = (event) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;

    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    const nextState = {
      ...current,
      x: dx,
      y: dy,
      moved: current.moved || Math.abs(dx) > 6 || Math.abs(dy) > 6,
    };
    dragRef.current = nextState;
    setDragState(nextState);
  };

  const endDrag = (event, card) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
    setDragState(null);

    if (current.moved && current.y < (isMobile ? -64 : -72)) {
      onPlayCard(card);
      setSelectedCard(null);
      return;
    }

    if (!current.moved) {
      handleCardClick(card);
    }
  };

  const cancelDrag = () => {
    dragRef.current = null;
    setDragState(null);
  };

  const isMobile = window.innerWidth < 768;
  const cardWidth = isMobile ? 78 : 80;
  const availableWidth = Math.max(cardWidth, window.innerWidth - (isMobile ? 24 : 64));
  const naturalStep = isMobile ? 42 : 38;
  const xStep = sorted.length > 1
    ? Math.min(naturalStep, Math.max(isMobile ? 24 : 28, (availableWidth - cardWidth) / (sorted.length - 1)))
    : 0;
  const fanWidth = sorted.length > 1
    ? (sorted.length - 1) * xStep + cardWidth
    : cardWidth;
  const handWidth = Math.min(availableWidth, fanWidth);

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
          {selectedCard ? 'Click again to confirm' : 'Tap twice or drag a card up'}
        </div>
      )}

      {selectedCard && isMyTurn && (
        <button
          onClick={() => setSelectedCard(null)}
          style={{
            background: 'rgba(7,20,38,0.86)',
            color: '#FFF6E6',
            border: '1px solid rgba(255,255,255,0.16)',
            padding: isMobile ? '7px 18px' : '4px 12px',
            borderRadius: 999,
            fontSize: isMobile ? '0.88rem' : '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 10px 22px rgba(0,0,0,0.24)',
          }}
        >
          Cancel
        </button>
      )}

      <div style={{
        position: 'relative',
        width: handWidth,
        height: isMobile ? 164 : 152,
        paddingTop: 18,
        overflowX: 'visible',
        overflowY: 'visible',
      }}>
        {sorted.map((card, i) => {
          const isSelected = selectedCard?.suit === card.suit && selectedCard?.rank === card.rank;
          const valid = isMyTurn && phase === 'playing' ? isValidPlay(card, hand, leadSuit) : true;
          const disabled = !isMyTurn || phase !== 'playing' || !valid;
          const centerOffset = i - (sorted.length - 1) / 2;
          const rotate = Math.max(-18, Math.min(18, centerOffset * (sorted.length > 7 ? 4 : 5.5)));
          const curveY = Math.abs(centerOffset) * (isMobile ? 3.2 : 2.6);
          const left = (handWidth - fanWidth) / 2 + i * xStep;
          const isDragging = dragState?.card?.suit === card.suit && dragState?.card?.rank === card.rank;
          const dragTransform = isDragging
            ? `translate(${dragState.x}px, ${dragState.y}px) rotate(${rotate}deg) scale(1.04)`
            : `rotate(${rotate}deg)`;

          return (
            <div
              key={`${card.suit}-${card.rank}`}
              onPointerDown={(event) => startDrag(event, card, disabled)}
              onPointerMove={moveDrag}
              onPointerUp={(event) => endDrag(event, card)}
              onPointerCancel={cancelDrag}
              style={{
                position: 'absolute',
                left,
                top: 18 + curveY,
                zIndex: isDragging ? 200 : isSelected ? 100 : i + 1,
                transform: dragTransform,
                transformOrigin: '50% 92%',
                transition: isDragging ? 'none' : 'left 0.2s ease, top 0.2s ease, transform 0.2s ease',
                touchAction: disabled ? 'auto' : 'none',
              }}
            >
              <Card
                card={card}
                disabled={disabled}
                selected={isSelected}
                isTrump={card.suit === trumpSuit}
                size={isMobile ? 'mobile' : 'normal'}
                style={{ cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab' }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ minHeight: 1 }} />
    </div>
  );
}
