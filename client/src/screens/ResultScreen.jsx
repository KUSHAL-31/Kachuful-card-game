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
      color: ['#D4A017', '#22C55E', '#CC2200', '#F5F0E8', '#FFD700'][Math.floor(Math.random() * 5)],
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
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '24px 16px',
      background: 'radial-gradient(ellipse at center, #2D6A4F 0%, #1B4332 60%, #0a2618 100%)',
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
            color: '#D4A017',
          }}>
            Game Over!
          </div>
          {winners.length > 0 && (
            <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#A89B8C' }}>
              {winners.length === 1
                ? `${players.find(p => p.id === winners[0])?.name} wins!`
                : `${winners.map(id => players.find(p => p.id === id)?.name).join(' & ')} share the win!`}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div style={{
          background: 'rgba(15,37,68,0.85)',
          borderRadius: 16,
          border: '1px solid rgba(212,160,23,0.3)',
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontFamily: 'Playfair Display, serif',
            fontSize: '0.9rem',
            color: '#D4A017',
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
                background: isWinner ? 'rgba(212,160,23,0.08)' : 'transparent',
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isWinner ? '#D4A017' : 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isWinner ? '1rem' : '0.75rem',
                  color: isWinner ? '#0F2544' : '#A89B8C',
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
                    color: isWinner ? '#D4A017' : '#F5F0E8',
                  }}>
                    {player.name}
                  </div>
                </div>
                <div style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: isWinner ? '#D4A017' : '#F5F0E8',
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
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#A89B8C',
            fontSize: '0.8rem',
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          {showHistory ? '▲ Hide Round History' : '▼ Show Round History'}
        </button>

        {showHistory && roundHistory && roundHistory.length > 0 && (
          <div style={{
            background: 'rgba(15,37,68,0.85)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 16,
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <th style={{ padding: '8px', color: '#A89B8C', textAlign: 'left', whiteSpace: 'nowrap' }}>Rnd</th>
                    <th style={{ padding: '8px', color: '#A89B8C', textAlign: 'center' }}>Trump</th>
                    {players.map(p => (
                      <th key={p.id} style={{ padding: '8px', color: '#A89B8C', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roundHistory.map(rnd => (
                    <tr key={rnd.roundNumber} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '6px 8px', color: '#A89B8C' }}>{rnd.roundNumber}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: ['hearts','diamonds'].includes(rnd.trumpSuit) ? '#CC2200' : '#F5F0E8' }}>
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
                            <span style={{ color: '#A89B8C', fontSize: '0.55rem' }}>{bid}/{won}</span>
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
                background: '#D4A017',
                color: '#0F2544',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                border: 'none',
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
              color: '#A89B8C',
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
