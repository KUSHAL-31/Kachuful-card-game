import React from 'react';
import { suitSymbol, TRUMP_HINDI } from '../utils/cardUtils';

const SUIT_THEMES = {
  spades: {
    bg: 'linear-gradient(135deg, #111827 0%, #29324d 100%)',
    border: '#93a4ff',
    symbol: '#f4f6ff',
    label: '#b8c2ff',
    glow: 'rgba(108,122,224,0.5)',
  },
  clubs: {
    bg: 'linear-gradient(135deg, #06301f 0%, #15734d 100%)',
    border: '#6ee7b7',
    symbol: '#c8ffe8',
    label: '#93f2c8',
    glow: 'rgba(76,175,125,0.5)',
  },
  hearts: {
    bg: 'linear-gradient(135deg, #4c0715 0%, #a31d3a 100%)',
    border: '#ff8ca4',
    symbol: '#ffd3dc',
    label: '#ff9ab0',
    glow: 'rgba(240,96,128,0.5)',
  },
  diamonds: {
    bg: 'linear-gradient(135deg, #4a1700 0%, #a85318 100%)',
    border: '#ffb36f',
    symbol: '#ffe2c4',
    label: '#ffc18b',
    glow: 'rgba(240,112,48,0.5)',
  },
};

const SUIT_SYMBOL_SCALE = {
  spades: 1.12,
  clubs: 1.1,
  hearts: 0.94,
  diamonds: 0.9,
};

export default function TrumpIndicator({ trumpSuit, currentRound, totalRounds }) {
  if (!trumpSuit) return null;

  const theme = SUIT_THEMES[trumpSuit];
  const symbol = suitSymbol(trumpSuit);
  const hindi = TRUMP_HINDI[trumpSuit];

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      padding: 'clamp(6px, 1.2vh, 10px) clamp(10px, 2vw, 14px)',
      background: theme.bg,
      borderRadius: 12,
      border: `1.5px solid ${theme.border}`,
      boxShadow: `0 12px 26px rgba(0,0,0,0.28), 0 0 18px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.16)`,
      minWidth: 68,
    }}>
      <div style={{ fontSize: 'clamp(0.5rem, 1vh, 0.62rem)', color: theme.label, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
        TRUMP
      </div>
      <div style={{
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 'clamp(1.4rem, 6vh, 2.6rem)',
          color: theme.symbol,
          lineHeight: 1,
          textShadow: `0 0 10px ${theme.glow}`,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          display: 'inline-block',
          transform: `scale(${SUIT_SYMBOL_SCALE[trumpSuit] || 1})`,
        }}>
          {symbol}
        </span>
      </div>
      <div style={{ fontSize: 'clamp(0.56rem, 1vh, 0.66rem)', color: theme.label, fontWeight: 800, textAlign: 'center' }}>
        {hindi}
      </div>
      <div style={{ width: '100%', height: 1, background: `${theme.border}44`, margin: '2px 0' }} />
      <div style={{ fontSize: 'clamp(0.6rem, 1.1vh, 0.72rem)', color: '#FFF6E6', fontWeight: 800 }}>
        Round {currentRound}/{totalRounds}
      </div>
    </div>
  );
}
