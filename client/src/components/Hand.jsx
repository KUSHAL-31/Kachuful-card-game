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
  const availableWidth = Math.max(cardWidth, window.innerWidth - (isMobile ? 20 : 64));
  // Tighter natural spacing for larger hands so all cards stay on screen
  const naturalStep = isMobile
    ? (sorted.length > 8 ? 24 : sorted.length > 6 ? 30 : sorted.length > 4 ? 36 : 42)
    : (sorted.length > 8 ? 28 : sorted.length > 6 ? 32 : 38);
  const minStep = isMobile ? 16 : 20;
  const xStep = sorted.length > 1
    ? Math.min(naturalStep, Math.max(minStep, (availableWidth - cardWidth) / (sorted.length - 1)))
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
          // Fade only invalid cards when it's your turn — so the legal plays stand out.
          // When it's not your turn (or during bidding), show all cards at full brightness.
          const faded = isMyTurn && phase === 'playing' && !valid;
          const centerOffset = i - (sorted.length - 1) / 2;
          const rotateScale = sorted.length > 8 ? 3 : sorted.length > 6 ? 4 : 5.5;
          const rotate = Math.max(-18, Math.min(18, centerOffset * rotateScale));
          const curveScale = isMobile ? (sorted.length > 7 ? 2 : 3.2) : 2.6;
          const curveY = Math.abs(centerOffset) * curveScale;
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
                faded={faded}
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
