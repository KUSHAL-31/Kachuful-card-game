import React from 'react';
import { suitColor, suitSymbol } from '../utils/cardUtils';

const CARD_BACK_PATTERN = `
  <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'>
    <rect width='20' height='20' fill='%230F2544'/>
    <line x1='0' y1='0' x2='20' y2='20' stroke='%23D4A017' stroke-width='0.5' opacity='0.25'/>
    <line x1='20' y1='0' x2='0' y2='20' stroke='%23D4A017' stroke-width='0.5' opacity='0.25'/>
  </svg>
`;

function CardBack({ style, className }) {
  return (
    <div
      className={className}
      style={{
        borderRadius: 8,
        background: `url("data:image/svg+xml,${CARD_BACK_PATTERN}") repeat`,
        border: '1.5px solid #D4A017',
        boxShadow: '2px 4px 12px rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <span style={{
        fontFamily: 'Playfair Display, serif',
        color: '#D4A017',
        fontSize: '1.2rem',
        fontWeight: 700,
        opacity: 0.7,
        userSelect: 'none',
      }}>K</span>
    </div>
  );
}

export default function Card({
  card,
  faceDown = false,
  onClick,
  disabled = false,
  selected = false,
  isTrump = false,
  playerName,
  size = 'normal',
  style = {},
}) {
  if (faceDown) {
    const dims = size === 'small'
      ? { width: 42, height: 59 }
      : size === 'trick'
      ? { width: 70, height: 98 }
      : size === 'mobile'
      ? { width: 72, height: 101 }
      : { width: 62, height: 87 };
    return <CardBack style={{ ...dims, ...style }} />;
  }

  if (!card) return null;

  const color = suitColor(card.suit);
  const symbol = suitSymbol(card.suit);
  const isFaceCard = ['J', 'Q', 'K'].includes(card.rank);

  const dims = size === 'small'
    ? { width: 42, height: 59, cornerFontSize: '0.45rem', centerFontSize: '1rem', rankFontSize: '0.6rem' }
    : size === 'trick'
    ? { width: 70, height: 98, cornerFontSize: '0.6rem', centerFontSize: '1.6rem', rankFontSize: '0.8rem' }
    : size === 'mobile'
    ? { width: 72, height: 101, cornerFontSize: '0.6rem', centerFontSize: '1.5rem', rankFontSize: '0.75rem' }
    : { width: 62, height: 87, cornerFontSize: '0.55rem', centerFontSize: '1.4rem', rankFontSize: '0.7rem' };

  const isClickable = !!onClick && !disabled;

  const trumpGlow = isTrump && !disabled ? {
    boxShadow: `2px 4px 12px rgba(0,0,0,0.35), 0 0 8px ${color}66`,
  } : {};

  const baseStyle = {
    width: dims.width,
    height: dims.height,
    borderRadius: 8,
    background: disabled ? '#E8E4DC' : '#FFFDF5',
    border: selected
      ? '2px solid #FFD700'
      : '1px solid #D4C9B0',
    boxShadow: selected
      ? '2px 4px 12px rgba(0,0,0,0.35), 0 0 0 2px #FFD700'
      : '2px 4px 12px rgba(0,0,0,0.35)',
    ...trumpGlow,
    position: 'relative',
    cursor: isClickable ? 'pointer' : 'default',
    opacity: disabled ? 0.5 : 1,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    userSelect: 'none',
    flexShrink: 0,
    transform: selected ? 'translateY(-12px)' : 'translateY(0)',
    ...style,
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={baseStyle}
        onClick={isClickable ? onClick : undefined}
        onMouseEnter={e => {
          if (isClickable && !selected) {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '2px 8px 18px rgba(0,0,0,0.5)';
          }
        }}
        onMouseLeave={e => {
          if (isClickable && !selected) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '2px 4px 12px rgba(0,0,0,0.35)';
          }
        }}
      >
        {/* Top-left corner */}
        <div style={{
          position: 'absolute',
          top: 3,
          left: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 1,
          color,
        }}>
          <span style={{ fontSize: dims.rankFontSize, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
            {card.rank}
          </span>
          <span style={{ fontSize: dims.cornerFontSize }}>{symbol}</span>
        </div>

        {/* Center */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color,
          fontSize: dims.centerFontSize,
          lineHeight: 1,
        }}>
          {isFaceCard ? (
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: `calc(${dims.centerFontSize} * 0.7)` }}>
              {card.rank}
              <br />
              <span style={{ fontSize: dims.cornerFontSize }}>{symbol}</span>
            </span>
          ) : (
            symbol
          )}
        </div>

        {/* Bottom-right corner (rotated) */}
        <div style={{
          position: 'absolute',
          bottom: 3,
          right: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 1,
          color,
          transform: 'rotate(180deg)',
        }}>
          <span style={{ fontSize: dims.rankFontSize, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
            {card.rank}
          </span>
          <span style={{ fontSize: dims.cornerFontSize }}>{symbol}</span>
        </div>
      </div>

      {playerName && (
        <span style={{
          marginTop: 4,
          fontSize: '0.6rem',
          color: '#A89B8C',
          textAlign: 'center',
          maxWidth: dims.width,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {playerName}
        </span>
      )}
    </div>
  );
}
