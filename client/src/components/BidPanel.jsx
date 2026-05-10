import React, { useState } from 'react';

export default function BidPanel({ cardsThisRound, onBid, forbiddenBid, trumpSuit, currentRound }) {
  const [selected, setSelected] = useState(null);

  const bids = Array.from({ length: cardsThisRound + 1 }, (_, i) => i);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(180deg, rgba(16,39,67,0.96), rgba(6,16,30,0.98))',
      borderTop: '2px solid #D6A84F',
      borderRadius: '16px 16px 0 0',
      padding: '20px 16px 28px',
      animation: 'slide-up 0.35s ease',
      zIndex: 200,
      boxShadow: '0 -18px 44px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
      backdropFilter: 'blur(14px)',
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: 12,
        fontFamily: 'Playfair Display, serif',
        fontSize: '1.1rem',
        color: '#FFF6E6',
      }}>
        Place Your Bid
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.84rem', color: '#C8BA9D', marginBottom: 16, fontWeight: 700 }}>
        Round {currentRound} · {cardsThisRound} trick{cardsThisRound !== 1 ? 's' : ''} available
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        marginBottom: 16,
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
                width: 48,
                height: 48,
                borderRadius: 8,
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: isForbidden ? 'not-allowed' : 'pointer',
                background: isSelected
                  ? 'linear-gradient(180deg, #FFE08A, #D6A84F 62%, #AD7B2F)'
                  : isForbidden
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(255,255,255,0.09)',
                color: isSelected
                  ? '#091626'
                  : isForbidden
                  ? '#555'
                  : '#FFF6E6',
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
                  width: 8,
                  height: 8,
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
          fontSize: '0.76rem',
          color: '#C8BA9D',
          marginBottom: 12,
        }}>
          Bid <strong style={{ color: '#EF4444' }}>{forbiddenBid}</strong> is forbidden (you are the Dealer)
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          disabled={selected === null}
          onClick={() => {
            if (selected !== null) onBid(selected);
          }}
          style={{
            background: selected !== null ? 'linear-gradient(180deg, #FFE08A, #D6A84F 58%, #AD7B2F)' : 'rgba(255,255,255,0.1)',
            color: selected !== null ? '#091626' : '#6F665A',
            fontWeight: 700,
            fontSize: '1rem',
            padding: '10px 40px',
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
