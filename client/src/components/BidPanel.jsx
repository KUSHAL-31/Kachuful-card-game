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
      background: '#0F2544',
      borderTop: '2px solid #D4A017',
      borderRadius: '16px 16px 0 0',
      padding: '20px 16px 28px',
      animation: 'slide-up 0.35s ease',
      zIndex: 200,
      boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: 12,
        fontFamily: 'Playfair Display, serif',
        fontSize: '1.1rem',
        color: '#F5F0E8',
      }}>
        Place Your Bid
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#A89B8C', marginBottom: 16 }}>
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
                  ? '#D4A017'
                  : isForbidden
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(255,255,255,0.1)',
                color: isSelected
                  ? '#0F2544'
                  : isForbidden
                  ? '#555'
                  : '#F5F0E8',
                border: isSelected
                  ? '2px solid #FFD700'
                  : isForbidden
                  ? '1px dashed #555'
                  : '1px solid rgba(255,255,255,0.15)',
                opacity: isForbidden ? 0.5 : 1,
                transition: 'all 0.15s ease',
                position: 'relative',
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
          fontSize: '0.6rem',
          color: '#A89B8C',
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
            background: selected !== null ? '#D4A017' : 'rgba(255,255,255,0.1)',
            color: selected !== null ? '#0F2544' : '#555',
            fontWeight: 700,
            fontSize: '1rem',
            padding: '10px 40px',
            borderRadius: 8,
            cursor: selected !== null ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            border: 'none',
          }}
        >
          Confirm Bid {selected !== null ? `— ${selected}` : ''}
        </button>
      </div>
    </div>
  );
}
