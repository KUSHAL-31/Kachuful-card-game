import React from 'react';

function ScoreList({ players, bids, tricksWon, scores }) {
  const rankedPlayers = [...players]
    .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
    .reduce((ranked, player, index) => {
      const score = scores?.[player.id] ?? 0;
      const previous = ranked[index - 1];
      const displayRank = previous && score === previous.score ? previous.displayRank : (previous ? previous.displayRank + 1 : 1);
      ranked.push({ player, score, displayRank });
      return ranked;
    }, []);

  return (
    <div style={{ padding: '8px 0' }}>
      {rankedPlayers.map(({ player, score, displayRank }) => {
        const bid = bids?.[player.id];
        const won = tricksWon?.[player.id] ?? 0;
        const hasBid = bid !== undefined && bid !== null;

        return (
          <div key={player.id} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 4px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            gap: 10,
          }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#C8BA9D',
              flexShrink: 0,
            }}>
              {displayRank}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#FFF6E6',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {player.name}
              </div>
              {hasBid && (
                <div style={{ fontSize: '0.74rem', color: '#C8BA9D' }}>
                  Bid {bid} · Won {won}
                </div>
              )}
            </div>

            <div style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#FFE08A',
              flexShrink: 0,
            }}>
              {score}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ScoreTable({ players, bids, tricksWon, scores, onClose, inline = false }) {
  if (inline) {
    return <ScoreList players={players} bids={bids} tricksWon={tricksWon} scores={scores} />;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 'min(280px, 90vw)',
      background: 'linear-gradient(180deg, rgba(16,39,67,0.98), rgba(6,16,30,0.98))',
      borderLeft: '1px solid rgba(255,224,138,0.28)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 150,
      animation: 'slide-in-right 0.3s ease',
      boxShadow: '-18px 0 48px rgba(0,0,0,0.42)',
      backdropFilter: 'blur(14px)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.18rem', color: '#FFF6E6' }}>
          Scores
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#C8BA9D', fontSize: '1.2rem', cursor: 'pointer' }}>
          ✕
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <ScoreList players={players} bids={bids} tricksWon={tricksWon} scores={scores} />
      </div>
    </div>
  );
}
