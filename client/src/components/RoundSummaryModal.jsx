import React from 'react';
import { suitSymbol } from '../utils/cardUtils';

export default function RoundSummaryModal({ roundResult, players, scores, onNext }) {
  if (!roundResult) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 300,
      padding: 16,
    }}>
      <div style={{
        background: '#0F2544',
        border: '1px solid #D4A017',
        borderRadius: 16,
        padding: '24px 20px',
        width: 'min(380px, 100%)',
        animation: 'fade-in 0.3s ease',
      }}>
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '1.2rem',
          textAlign: 'center',
          color: '#D4A017',
          marginBottom: 4,
        }}>
          Round {roundResult.roundNumber} Complete
        </div>
        <div style={{
          textAlign: 'center',
          fontSize: '0.7rem',
          color: '#A89B8C',
          marginBottom: 16,
        }}>
          Trump: {suitSymbol(roundResult.trumpSuit)} · {roundResult.cardsDealt} cards
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr style={{ color: '#A89B8C', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600 }}>Player</th>
              <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 600 }}>Bid</th>
              <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 600 }}>Won</th>
              <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 600 }}>Points</th>
              <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => {
              const bid = roundResult.bids[player.id] ?? '-';
              const won = roundResult.tricksWon[player.id] ?? 0;
              const points = roundResult.pointsEarned[player.id] ?? 0;
              const total = scores[player.id] ?? 0;
              const hit = bid !== '-' && bid === won;

              return (
                <tr key={player.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '6px 8px', color: '#F5F0E8', fontWeight: 500 }}>
                    {player.name}
                  </td>
                  <td style={{ textAlign: 'center', padding: '6px 8px', color: '#A89B8C' }}>{bid}</td>
                  <td style={{ textAlign: 'center', padding: '6px 8px', color: '#A89B8C' }}>{won}</td>
                  <td style={{
                    textAlign: 'center',
                    padding: '6px 8px',
                    color: points > 0 ? '#22C55E' : '#EF4444',
                    fontWeight: 700,
                  }}>
                    {points > 0 ? `+${points}` : '0'}
                  </td>
                  <td style={{
                    textAlign: 'right',
                    padding: '6px 8px',
                    color: '#D4A017',
                    fontWeight: 700,
                  }}>
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {onNext && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={onNext}
              style={{
                background: '#D4A017',
                color: '#0F2544',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '10px 28px',
                borderRadius: 8,
                cursor: 'pointer',
                border: 'none',
              }}
            >
              Next Round →
            </button>
          </div>
        )}

        {!onNext && (
          <div style={{
            textAlign: 'center',
            marginTop: 16,
            fontSize: '0.65rem',
            color: '#A89B8C',
            animation: 'pulse 1s ease infinite',
          }}>
            Next round starting soon...
          </div>
        )}
      </div>
    </div>
  );
}
