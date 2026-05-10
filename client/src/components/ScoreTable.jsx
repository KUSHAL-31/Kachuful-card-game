import React from 'react';

export default function ScoreTable({ players, bids, tricksWon, scores, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 'min(280px, 90vw)',
      background: '#0F2544',
      borderLeft: '1px solid rgba(212,160,23,0.3)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 150,
      animation: 'slide-up 0.3s ease',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: '#F5F0E8' }}>
          Scores
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', color: '#A89B8C', fontSize: '1.2rem', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {[...players]
          .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
          .map((player, rank) => {
            const bid = bids?.[player.id];
            const won = tricksWon?.[player.id] ?? 0;
            const score = scores?.[player.id] ?? 0;
            const hasBid = bid !== undefined && bid !== null;
            const hitBid = hasBid && won === bid;

            return (
              <div key={player.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                gap: 10,
              }}>
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: rank === 0 ? '#D4A017' : 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: rank === 0 ? '#0F2544' : '#A89B8C',
                  flexShrink: 0,
                }}>
                  {rank + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#F5F0E8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {player.name}
                  </div>
                  {hasBid && (
                    <div style={{ fontSize: '0.6rem', color: '#A89B8C' }}>
                      Bid {bid} · Won {won}
                    </div>
                  )}
                </div>

                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#D4A017',
                  flexShrink: 0,
                }}>
                  {score}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
