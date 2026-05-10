import React from 'react';
import { suitSymbol, TRUMP_HINDI } from '../utils/cardUtils';

const SUIT_THEMES = {
  spades: {
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d4a 100%)',
    border: '#6c7ae0',
    symbol: '#e8e8ff',
    label: '#a0a8f0',
    glow: 'rgba(108,122,224,0.5)',
  },
  clubs: {
    bg: 'linear-gradient(135deg, #0d3321 0%, #1a5c3a 100%)',
    border: '#4caf7d',
    symbol: '#9effd0',
    label: '#6fcfa0',
    glow: 'rgba(76,175,125,0.5)',
  },
  hearts: {
    bg: 'linear-gradient(135deg, #4a0a14 0%, #8b1a2e 100%)',
    border: '#f06080',
    symbol: '#ff9ab0',
    label: '#f06080',
    glow: 'rgba(240,96,128,0.5)',
  },
  diamonds: {
    bg: 'linear-gradient(135deg, #4a1a00 0%, #8b3a00 100%)',
    border: '#f07030',
    symbol: '#ffb080',
    label: '#f07030',
    glow: 'rgba(240,112,48,0.5)',
  },
};

export default function TrumpIndicator({ trumpSuit, currentRound, totalRounds, cardsThisRound }) {
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
      padding: '8px 12px',
      background: theme.bg,
      borderRadius: 10,
      border: `1.5px solid ${theme.border}`,
      boxShadow: `0 0 12px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
      minWidth: 72,
    }}>
      <div style={{ fontSize: '0.5rem', color: theme.label, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
        TRUMP
      </div>
      <div style={{
        fontSize: '2.2rem',
        color: theme.symbol,
        lineHeight: 1,
        textShadow: `0 0 10px ${theme.glow}`,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
      }}>
        {symbol}
      </div>
      <div style={{ fontSize: '0.55rem', color: theme.label, fontWeight: 600, textAlign: 'center' }}>
        {hindi}
      </div>
      <div style={{ width: '100%', height: 1, background: `${theme.border}44`, margin: '2px 0' }} />
      <div style={{ fontSize: '0.6rem', color: '#F5F0E8', fontWeight: 600 }}>
        Round {currentRound}/{totalRounds}
      </div>
      <div style={{ fontSize: '0.5rem', color: '#A89B8C' }}>
        {cardsThisRound} card{cardsThisRound !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
