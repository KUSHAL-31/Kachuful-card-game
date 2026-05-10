import React from 'react';
import { suitColor, suitSymbol } from '../utils/cardUtils';

const CARD_BACK_PATTERN = `
  <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'>
    <rect width='20' height='20' fill='%23071426'/>
    <circle cx='10' cy='10' r='5.5' fill='none' stroke='%23FFE08A' stroke-width='0.5' opacity='0.2'/>
    <line x1='0' y1='0' x2='20' y2='20' stroke='%23FFE08A' stroke-width='0.5' opacity='0.23'/>
    <line x1='20' y1='0' x2='0' y2='20' stroke='%23B86F42' stroke-width='0.5' opacity='0.18'/>
  </svg>
`;

function CardBack({ style, className }) {
  return (
    <div
      className={className}
      style={{
        borderRadius: 9,
        background: `linear-gradient(145deg, rgba(255,224,138,0.08), transparent), url("data:image/svg+xml,${CARD_BACK_PATTERN}") repeat`,
        border: '1.5px solid #D6A84F',
        boxShadow: '0 10px 22px rgba(0,0,0,0.42), inset 0 0 0 2px rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <span style={{
        fontFamily: 'Playfair Display, serif',
        color: '#FFE08A',
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
      ? { width: 48, height: 67 }
      : size === 'trick'
      ? { width: 82, height: 115 }
      : size === 'mobile'
      ? { width: 78, height: 109 }
      : { width: 68, height: 95 };
    return <CardBack style={{ ...dims, ...style }} />;
  }

  if (!card) return null;

  const color = suitColor(card.suit);
  const symbol = suitSymbol(card.suit);
  const isFaceCard = ['J', 'Q', 'K'].includes(card.rank);

  const dims = size === 'small'
    ? { width: 48, height: 67, cornerFontSize: '0.52rem', centerFontSize: '1.12rem', rankFontSize: '0.68rem' }
    : size === 'trick'
    ? { width: 82, height: 115, cornerFontSize: '0.7rem', centerFontSize: '1.9rem', rankFontSize: '0.96rem' }
    : size === 'mobile'
    ? { width: 78, height: 109, cornerFontSize: '0.66rem', centerFontSize: '1.66rem', rankFontSize: '0.84rem' }
    : { width: 68, height: 95, cornerFontSize: '0.62rem', centerFontSize: '1.54rem', rankFontSize: '0.78rem' };

  const isClickable = !!onClick && !disabled;

  const trumpGlow = isTrump && !disabled ? {
    boxShadow: `0 12px 24px rgba(0,0,0,0.34), 0 0 14px ${color}66`,
  } : {};

  const baseStyle = {
    width: dims.width,
    height: dims.height,
    borderRadius: 9,
    background: disabled
      ? 'linear-gradient(145deg, #ded8c8, #cfc6b2)'
      : 'linear-gradient(145deg, #fffdf7 0%, #fff7e6 58%, #f0dfb9 100%)',
    border: selected
      ? '2px solid #FFE08A'
      : '1px solid #E4D3AA',
    boxShadow: selected
      ? '0 16px 30px rgba(0,0,0,0.38), 0 0 0 2px rgba(255,224,138,0.85), 0 0 24px rgba(255,224,138,0.48)'
      : '0 10px 22px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.8)',
    ...trumpGlow,
    position: 'relative',
    cursor: isClickable ? 'pointer' : 'default',
    opacity: disabled ? 0.5 : 1,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease',
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
            e.currentTarget.style.boxShadow = '0 18px 28px rgba(0,0,0,0.46), 0 0 18px rgba(255,224,138,0.22)';
            e.currentTarget.style.filter = 'brightness(1.04)';
          }
        }}
        onMouseLeave={e => {
          if (isClickable && !selected) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 22px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.8)';
            e.currentTarget.style.filter = 'brightness(1)';
          }
        }}
      >
        {/* Top-left corner */}
        <div style={{
          position: 'absolute',
          top: 4,
          left: 5,
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
          bottom: 4,
          right: 5,
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
          fontSize: '0.7rem',
          color: '#D8C7A7',
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
