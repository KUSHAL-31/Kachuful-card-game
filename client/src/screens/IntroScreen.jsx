import React from 'react';

export default function IntroScreen({ onPlay }) {
  const floatingCards = [
    { rank: 'A', suit: '♠', left: '11%', top: '18%', rotate: '-16deg', delay: '0s' },
    { rank: 'K', suit: '♥', left: '78%', top: '16%', rotate: '14deg', delay: '0.5s' },
    { rank: 'Q', suit: '♦', left: '16%', top: '69%', rotate: '11deg', delay: '0.9s' },
    { rank: 'J', suit: '♣', left: '76%', top: '70%', rotate: '-12deg', delay: '1.3s' },
  ];

  return (
    <div className="premium-table intro-screen" style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {floatingCards.map(card => {
        const isRed = card.suit === '♥' || card.suit === '♦';
        return (
          <div
            key={`${card.rank}-${card.suit}`}
            className="intro-floating-card"
            style={{
              left: card.left,
              top: card.top,
              transform: `rotate(${card.rotate})`,
              animationDelay: card.delay,
              color: isRed ? '#c51f38' : '#17171d',
            }}
          >
            <span>{card.rank}</span>
            <strong>{card.suit}</strong>
          </div>
        );
      })}

      <div style={{
        width: 'min(760px, 100%)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '7px 14px',
          borderRadius: 999,
          background: 'rgba(7,20,38,0.62)',
          border: '1px solid rgba(255,224,138,0.22)',
          color: '#D8C7A7',
          fontSize: '0.82rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
        }}>
          2-7 Players
          <span style={{ color: '#FFE08A' }}>♠ ♦ ♣ ♥</span>
          Real-Time
        </div>

        <div>
          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(4.2rem, 13vw, 8.6rem)',
            fontWeight: 700,
            lineHeight: 0.86,
            color: '#FFE08A',
            textShadow: '0 12px 34px rgba(0,0,0,0.58), 0 0 42px rgba(214,168,79,0.36)',
          }}>
            Kachuful
          </div>
          <div style={{
            marginTop: 8,
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(1.3rem, 4.6vw, 2.2rem)',
            color: '#D8C7A7',
            textShadow: '0 4px 18px rgba(0,0,0,0.44)',
          }}>
            काचूफूल
          </div>
        </div>

        <p style={{
          maxWidth: 620,
          color: '#FFF6E6',
          fontSize: 'clamp(1.02rem, 2.5vw, 1.26rem)',
          lineHeight: 1.65,
          fontWeight: 600,
          textShadow: '0 3px 12px rgba(0,0,0,0.36)',
        }}>
          Predict your tricks, read the table, and outplay your friends in a classy multiplayer card battle of nerve, memory, and timing.
        </p>

        <button
          onClick={onPlay}
          className="intro-play-button"
          style={{
            marginTop: 8,
            minWidth: 220,
            padding: '15px 34px',
            borderRadius: 999,
            background: 'linear-gradient(180deg, #FFE08A, #D6A84F 58%, #AD7B2F)',
            color: '#091626',
            fontSize: '1.08rem',
            fontWeight: 900,
            letterSpacing: '0.02em',
            border: '1px solid rgba(255,224,138,0.78)',
            boxShadow: '0 18px 34px rgba(214,168,79,0.34), inset 0 1px 0 rgba(255,255,255,0.68)',
          }}
        >
          Play Now
        </button>
      </div>
    </div>
  );
}
