import React, { useState } from 'react';

export default function IntroScreen({ onPlay }) {
  const [showRules, setShowRules] = useState(false);
  const isMobile = window.innerWidth < 768;
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
      padding: '24px 24px 86px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setShowRules(true)}
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          zIndex: 3,
          padding: '9px 15px',
          borderRadius: 999,
          background: 'rgba(7,20,38,0.62)',
          color: '#FFE08A',
          fontSize: '0.9rem',
          fontWeight: 900,
          border: '1px solid rgba(255,224,138,0.28)',
          boxShadow: '0 12px 26px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        Rules
      </button>

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
            <div className="intro-card-corner intro-card-corner-top">
              <span>{card.rank}</span>
              <small>{card.suit}</small>
            </div>
            <strong>{card.suit}</strong>
            <div className="intro-card-corner intro-card-corner-bottom">
              <span>{card.rank}</span>
              <small>{card.suit}</small>
            </div>
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
          2-10 Players
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

      <div style={{
        position: 'fixed',
        left: '50%',
        bottom: 'calc(14px + env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)',
        zIndex: 5,
        width: isMobile ? 'calc(100vw - 32px)' : 'auto',
        maxWidth: '480px',
        padding: isMobile ? '10px 14px' : '11px 18px',
        borderRadius: 999,
        background: 'rgba(7,20,38,0.48)',
        border: '1px solid rgba(255,224,138,0.18)',
        color: '#D8C7A7',
        fontSize: '1rem',
        fontWeight: 800,
        boxShadow: '0 12px 26px rgba(0,0,0,0.18)',
        textAlign: 'center',
        whiteSpace: isMobile ? 'normal' : 'nowrap',
        backdropFilter: 'blur(12px)',
      }}>
        Developed by <span style={{ color: '#FFF6E6' }}>Kushal Soni</span>
        <span style={{ color: '#FFE08A', margin: '0 8px' }}>·</span>
        <a
          href="https://github.com/KUSHAL-31"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#FFE08A', textDecoration: 'none', borderBottom: '1px solid rgba(255,224,138,0.42)' }}
        >
          GitHub
        </a>
      </div>

      {showRules && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <div onClick={() => setShowRules(false)} style={{ flex: 1 }} />
          <div style={{
            width: 'min(360px, 92vw)',
            height: '100%',
            background: 'rgba(6,16,30,0.98)',
            borderLeft: '1px solid rgba(255,224,138,0.25)',
            boxShadow: '-18px 0 48px rgba(0,0,0,0.42)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '20px 18px',
            gap: 18,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.18rem', color: '#FFE08A', fontWeight: 700 }}>
                How to Play
              </div>
              <button onClick={() => setShowRules(false)} style={{ background: 'none', border: 'none', color: '#C8BA9D', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
            </div>

            {[
              {
                title: '🎯 Objective',
                body: 'Predict exactly how many tricks you will win each round. Score points only if your prediction is correct.',
              },
              {
                title: '🃏 The Deck & Deal',
                body: 'A standard 52-card deck is used. Cards dealt per round follow a pyramid: 1 card in round 1, increasing by 1 each round up to the max, then decreasing back to 1. With 2–5 players the max is 10 cards; with 6–10 players it scales down to fit the deck.',
              },
              {
                title: '♠ Trump Suit',
                body: 'Each round has a trump suit that rotates in order: Spades → Diamonds → Clubs → Hearts, then repeats. Trump cards beat all non-trump cards regardless of rank.',
              },
              {
                title: '📢 Bidding',
                body: 'Starting from the player left of the dealer, each player bids how many tricks they expect to win (0 to cards dealt). The dealer bids last and has a restriction — their bid cannot make the total bids equal the number of cards dealt. This keeps at least one player from winning their bid.',
              },
              {
                title: '🤚 Playing a Trick',
                body: 'The player who won the last trick leads first. You must follow the led suit if you have it. If you don\'t have the led suit, you can play any card including trump. The highest trump wins the trick; if no trump is played, the highest card of the led suit wins.',
              },
              {
                title: '🏆 Scoring',
                body: 'If you win exactly as many tricks as you bid: score = 10 + tricks won.\nIf you win more or fewer tricks than you bid: score = 0 for that round.\nBid 0 and win 0 → score 10. Bid 3 and win 3 → score 13.',
              },
              {
                title: '🔄 Rounds',
                body: 'The game runs through all rounds of the pyramid. After the final round the player with the highest total score wins. If scores are tied, all tied players share the win.',
              },
              {
                title: '👑 Dealer (Compulsory Player)',
                body: 'The dealer rotates each round. The dealer badge shows who it is. The dealer always bids last and faces the forbidden bid restriction.',
              },
            ].map(({ title, body }) => (
              <div key={title} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 14 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFE08A', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: '0.86rem', color: '#D8C7A7', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
