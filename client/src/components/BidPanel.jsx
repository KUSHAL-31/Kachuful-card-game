import React, { useState } from 'react';

export default function BidPanel({ cardsThisRound, onBid, forbiddenBid, trumpSuit, currentRound }) {
  const [selected, setSelected] = useState(null);

  const bids = Array.from({ length: cardsThisRound + 1 }, (_, i) => i);
  const cols = bids.length <= 6 ? bids.length : Math.ceil(bids.length / 2);
  // Cap grid width so each column ≈ button height → square buttons on all screens
  const gridMaxWidth = cols * 44 + (cols - 1) * 5;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(180deg, rgba(16,39,67,0.96), rgba(6,16,30,0.98))',
      borderTop: '2px solid #D6A84F',
      borderRadius: '16px 16px 0 0',
      padding: 'clamp(8px, 1.4vh, 14px) 12px clamp(10px, 1.8vh, 16px)',
      animation: 'slide-up 0.35s ease',
      zIndex: 200,
      boxShadow: '0 -18px 44px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
      backdropFilter: 'blur(14px)',
    }}>
      <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#C8BA9D', marginBottom: 'clamp(8px, 1.4vh, 14px)', fontWeight: 700 }}>
        Round {currentRound} · {cardsThisRound} trick{cardsThisRound !== 1 ? 's' : ''} · Place your bid
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 5,
        marginBottom: 'clamp(10px, 1.6vh, 16px)',
        maxWidth: gridMaxWidth,
        margin: '0 auto clamp(10px, 1.6vh, 16px)',
      }}>
        {bids.map(bid => {
          const isForbidden = bid === forbiddenBid;
          const isSelected = selected === bid;
          return (
            <button
              key={bid}
              onClick={() => !isForbidden && setSelected(bid)}
              title={isForbidden ? 'Not allowed — Compulsory player rule' : ''}
              style={{
                width: '100%',
                height: 'clamp(26px, 4.6vh, 42px)',
                borderRadius: 8,
                fontSize: 'clamp(0.82rem, 2.2vw, 1.1rem)',
                fontWeight: 700,
                cursor: isForbidden ? 'not-allowed' : 'pointer',
                background: isSelected
                  ? 'linear-gradient(180deg, #FFE08A, #D6A84F 62%, #AD7B2F)'
                  : isForbidden
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(255,255,255,0.09)',
                color: isSelected ? '#091626' : isForbidden ? '#555' : '#FFF6E6',
                border: isSelected
                  ? '2px solid #FFE08A'
                  : isForbidden
                  ? '1px dashed #555'
                  : '1px solid rgba(255,255,255,0.15)',
                opacity: isForbidden ? 0.5 : 1,
                transition: 'all 0.15s ease',
                position: 'relative',
                boxShadow: isSelected ? '0 8px 18px rgba(214,168,79,0.26), inset 0 1px 0 rgba(255,255,255,0.55)' : 'none',
              }}
            >
              {bid}
              {isForbidden && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#EF4444',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {forbiddenBid !== null && forbiddenBid !== undefined && (
        <div style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          color: '#C8BA9D',
          marginBottom: 'clamp(4px, 0.7vh, 8px)',
        }}>
          Bid <strong style={{ color: '#EF4444' }}>{forbiddenBid}</strong> is forbidden (you are the Dealer)
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          disabled={selected === null}
          onClick={() => { if (selected !== null) onBid(selected); }}
          style={{
            background: selected !== null ? 'linear-gradient(180deg, #FFE08A, #D6A84F 58%, #AD7B2F)' : 'rgba(255,255,255,0.1)',
            color: selected !== null ? '#091626' : '#6F665A',
            fontWeight: 700,
            fontSize: 'clamp(0.82rem, 2vw, 1rem)',
            padding: 'clamp(5px, 0.9vh, 10px) 28px',
            borderRadius: 8,
            cursor: selected !== null ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            border: selected !== null ? '1px solid rgba(255,224,138,0.68)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: selected !== null ? '0 10px 24px rgba(214,168,79,0.24), inset 0 1px 0 rgba(255,255,255,0.55)' : 'none',
          }}
        >
          Confirm Bid {selected !== null ? `— ${selected}` : ''}
        </button>
      </div>
    </div>
  );
}
