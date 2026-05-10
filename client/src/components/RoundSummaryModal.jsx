import React from 'react';
import { suitSymbol } from '../utils/cardUtils';

export default function RoundSummaryModal({ roundResult, players, scores, onNext }) {
  if (!roundResult) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.72)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 300,
      padding: 16,
    }}>
      <div style={{
        background: 'linear-gradient(145deg, rgba(16,39,67,0.98), rgba(6,16,30,0.98))',
        border: '1px solid #D6A84F',
        borderRadius: 16,
        padding: '24px 20px',
        width: 'min(380px, 100%)',
        animation: 'fade-in 0.3s ease',
        boxShadow: '0 24px 70px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}>
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '1.36rem',
          textAlign: 'center',
          color: '#FFE08A',
          marginBottom: 4,
        }}>
          Round {roundResult.roundNumber} Complete
        </div>
        <div style={{
          textAlign: 'center',
          fontSize: '0.84rem',
          color: '#C8BA9D',
          marginBottom: 16,
        }}>
          Trump: {suitSymbol(roundResult.trumpSuit)} · {roundResult.cardsDealt} cards
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ color: '#C8BA9D', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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
                  <td style={{ padding: '6px 8px', color: '#FFF6E6', fontWeight: 600 }}>
                    {player.name}
                  </td>
                  <td style={{ textAlign: 'center', padding: '6px 8px', color: '#C8BA9D' }}>{bid}</td>
                  <td style={{ textAlign: 'center', padding: '6px 8px', color: '#C8BA9D' }}>{won}</td>
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
                    color: '#FFE08A',
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
                background: 'linear-gradient(180deg, #FFE08A, #D6A84F 58%, #AD7B2F)',
                color: '#091626',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '10px 28px',
                borderRadius: 8,
                cursor: 'pointer',
                border: '1px solid rgba(255,224,138,0.68)',
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
            fontSize: '0.78rem',
            color: '#C8BA9D',
            animation: 'pulse 1s ease infinite',
          }}>
            Next round starting soon...
          </div>
        )}
      </div>
    </div>
  );
}
