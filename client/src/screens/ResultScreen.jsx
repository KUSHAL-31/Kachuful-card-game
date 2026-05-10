import React, { useEffect, useRef, useState } from 'react';
import { suitSymbol } from '../utils/cardUtils';

function Confetti() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      r: Math.random() * 6 + 3,
      d: Math.random() * 100 + 10,
      color: ['#D6A84F', '#6EE7B7', '#C51F38', '#FFF6E6', '#FFE08A'][Math.floor(Math.random() * 5)],
      tilt: Math.random() * 10 - 5,
      tiltAngle: 0,
      tiltAngleInc: Math.random() * 0.1 + 0.05,
      speed: Math.random() * 3 + 1,
    }));

    let frame;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 5);
        ctx.stroke();
        p.tiltAngle += p.tiltAngleInc;
        p.y += p.speed;
        p.tilt = Math.sin(p.tiltAngle) * 15;
        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
      });
      frame = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  );
}

export default function ResultScreen({ scores, roundHistory, winners, players, isHost, onRestart, onLeave }) {
  const [showHistory, setShowHistory] = useState(false);

  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const maxScore = Math.max(...players.map(p => scores[p.id] || 0));

  const getRank = (player) => {
    const score = scores[player.id] || 0;
    if (score === maxScore) return 1;
    const higherCount = players.filter(p => (scores[p.id] || 0) > score).length;
    return higherCount + 1;
  };

  return (
    <div className="premium-table" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '24px 16px',
      overflowY: 'auto',
      position: 'relative',
    }}>
      <Confetti />

      <div style={{ position: 'relative', zIndex: 1, width: 'min(440px, 100%)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 4 }}>🏆</div>
          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '2rem',
            color: '#FFE08A',
            textShadow: '0 4px 18px rgba(0,0,0,0.55), 0 0 18px rgba(214,168,79,0.28)',
          }}>
            Game Over!
          </div>
          {winners.length > 0 && (
            <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#D8C7A7' }}>
              {winners.length === 1
                ? `${players.find(p => p.id === winners[0])?.name} wins!`
                : `${winners.map(id => players.find(p => p.id === id)?.name).join(' & ')} share the win!`}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(16,39,67,0.92), rgba(6,16,30,0.84))',
          borderRadius: 16,
          border: '1px solid rgba(255,224,138,0.28)',
          overflow: 'hidden',
          marginBottom: 16,
          boxShadow: '0 24px 70px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.08)',
          backdropFilter: 'blur(14px)',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontFamily: 'Playfair Display, serif',
            fontSize: '0.9rem',
            color: '#FFE08A',
          }}>
            Final Leaderboard
          </div>
          {sorted.map((player, i) => {
            const rank = getRank(player);
            const isWinner = rank === 1;
            return (
              <div key={player.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: isWinner ? 'rgba(255,224,138,0.10)' : 'transparent',
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isWinner ? 'linear-gradient(180deg, #FFE08A, #D6A84F)' : 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isWinner ? '1rem' : '0.75rem',
                  color: isWinner ? '#091626' : '#C8BA9D',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginRight: 12,
                }}>
                  {isWinner ? '🏆' : rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: isWinner ? '#FFE08A' : '#FFF6E6',
                  }}>
                    {player.name}
                  </div>
                </div>
                <div style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: isWinner ? '#FFE08A' : '#FFF6E6',
                }}>
                  {scores[player.id] || 0}
                </div>
              </div>
            );
          })}
        </div>

        {/* Round history toggle */}
        <button
          onClick={() => setShowHistory(h => !h)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.075)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#C8BA9D',
            fontSize: '0.8rem',
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          {showHistory ? '▲ Hide Round History' : '▼ Show Round History'}
        </button>

        {showHistory && roundHistory && roundHistory.length > 0 && (
          <div style={{
            background: 'rgba(7,20,38,0.82)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 16,
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <th style={{ padding: '8px', color: '#C8BA9D', textAlign: 'left', whiteSpace: 'nowrap' }}>Rnd</th>
                    <th style={{ padding: '8px', color: '#C8BA9D', textAlign: 'center' }}>Trump</th>
                    {players.map(p => (
                      <th key={p.id} style={{ padding: '8px', color: '#C8BA9D', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roundHistory.map(rnd => (
                    <tr key={rnd.roundNumber} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '6px 8px', color: '#C8BA9D' }}>{rnd.roundNumber}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: ['hearts','diamonds'].includes(rnd.trumpSuit) ? '#C51F38' : '#FFF6E6' }}>
                        {suitSymbol(rnd.trumpSuit)}
                      </td>
                      {players.map(p => {
                        const bid = rnd.bids[p.id] ?? '-';
                        const won = rnd.tricksWon[p.id] ?? 0;
                        const pts = rnd.pointsEarned[p.id] ?? 0;
                        const hit = bid !== '-' && bid === won;
                        return (
                          <td key={p.id} style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <span style={{ color: hit ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                              {pts > 0 ? `+${pts}` : '0'}
                            </span>
                            <br />
                            <span style={{ color: '#C8BA9D', fontSize: '0.55rem' }}>{bid}/{won}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isHost && (
            <button
              onClick={onRestart}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 8,
                background: 'linear-gradient(180deg, #FFE08A, #D6A84F 58%, #AD7B2F)',
                color: '#091626',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                border: '1px solid rgba(255,224,138,0.68)',
                boxShadow: '0 10px 24px rgba(214,168,79,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
              }}
            >
              Play Again
            </button>
          )}
          <button
            onClick={onLeave}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 8,
              background: 'transparent',
              color: '#C8BA9D',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
