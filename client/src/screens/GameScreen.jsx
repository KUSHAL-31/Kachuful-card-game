import React, { useRef, useState, useEffect } from 'react';
import Hand from '../components/Hand';
import TrickArea from '../components/TrickArea';
import PlayerSeat from '../components/PlayerSeat';
import Card from '../components/Card';
import BidPanel from '../components/BidPanel';
import TrumpIndicator from '../components/TrumpIndicator';
import ScoreTable from '../components/ScoreTable';
import RoundSummaryModal from '../components/RoundSummaryModal';

export default function GameScreen({ gameState, myHand, playerId, roomCode, isHost, emit }) {
  const [showScores, setShowScores] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roundSummary, setRoundSummary] = useState(null);
  const [trickWinner, setTrickWinner] = useState(null);
  const [displayTrick, setDisplayTrick] = useState([]);
  const [cardSubmitted, setCardSubmitted] = useState(false);
  const [flyingCards, setFlyingCards] = useState([]);
  const trickTargetRef = useRef(null);
  const cardSubmitTimerRef = useRef(null);
  const lastPlayedCardRef = useRef(null);

  const {
    players = [],
    currentRound,
    totalRounds,
    cardsThisRound,
    trumpSuit,
    compulsoryPlayerIndex,
    phase,
    bids = {},
    currentTrick = [],
    leadSuit,
    currentTurnIndex,
    tricksWon = {},
    scores = {},
    handSizes = {},
    biddingOrder = [],
    currentBidderIndex = 0,
  } = gameState || {};

  const me = players.find(p => p.id === playerId);
  const currentPlayer = players[currentTurnIndex];
  const currentBidderSeatIndex = biddingOrder[currentBidderIndex];
  const currentBidder = players[currentBidderSeatIndex];

  const isMyTurn = currentPlayer?.id === playerId && phase === 'playing' && !cardSubmitted;
  const isMyBidTurn = currentBidder?.id === playerId && phase === 'bidding';

  const otherPlayers = players;

  const getForbiddenBid = () => {
    if (currentBidder?.id !== playerId) return null;
    if (currentBidderSeatIndex !== compulsoryPlayerIndex) return null;
    const sum = Object.values(bids).reduce((a, b) => a + b, 0);
    const forbidden = cardsThisRound - sum;
    if (forbidden >= 0 && forbidden <= cardsThisRound) return forbidden;
    return null;
  };

  useEffect(() => {
    if (currentTrick.length > 0) {
      setDisplayTrick(currentTrick);
      setTrickWinner(null);
    }
  }, [currentTrick]);

  // Unlock card interactions once the server confirms the play (turn advances)
  useEffect(() => {
    if (cardSubmitTimerRef.current) clearTimeout(cardSubmitTimerRef.current);
    lastPlayedCardRef.current = null;
    setCardSubmitted(false);
  }, [currentTurnIndex, currentTrick.length]);

  // Release the lock immediately if the server rejects the play (error event)
  // or after 5s as a safety net for silent failures
  useEffect(() => {
    const handler = () => {
      if (cardSubmitTimerRef.current) clearTimeout(cardSubmitTimerRef.current);
      setCardSubmitted(false);
    };
    window.addEventListener('game-play-rejected', handler);
    return () => window.removeEventListener('game-play-rejected', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.type === 'trick_cleared') {
        setDisplayTrick([]);
        setTrickWinner(null);
      }
      if (e.detail?.type === 'round_complete') {
        setRoundSummary(e.detail.data);
        setDisplayTrick([]);
        setTrickWinner(null);
      }
      if (e.detail?.type === 'round_dismissed') setRoundSummary(null);
    };
    window.addEventListener('game-event', handler);
    return () => window.removeEventListener('game-event', handler);
  }, []);

  const isMobile = window.innerWidth < 768;
  const isMobileBidding = isMobile && phase === 'bidding';
  const shouldScrollSeats = players.length > (isMobile ? 2 : 4);

  const animateCardToTable = (card, sourceRect) => {
    const targetRect = trickTargetRef.current?.getBoundingClientRect?.();
    if (!card || !sourceRect || !targetRect) return;

    const id = `${card.suit}-${card.rank}-${Date.now()}`;
    const targetX = targetRect.left + targetRect.width / 2 - sourceRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2 - sourceRect.height / 2;
    const cardFlight = {
      id,
      card,
      from: {
        left: sourceRect.left,
        top: sourceRect.top,
        width: sourceRect.width,
        height: sourceRect.height,
      },
      deltaX: targetX - sourceRect.left,
      deltaY: targetY - sourceRect.top,
      active: false,
    };

    setFlyingCards(prev => [...prev, cardFlight]);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlyingCards(prev => prev.map(item => (
          item.id === id ? { ...item, active: true } : item
        )));
      });
    });
  };

  const removeFlyingCard = (id) => {
    setFlyingCards(prev => prev.filter(card => card.id !== id));
  };

  return (
    <div className="premium-table" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'clamp(7px, 1.2vh, 10px) 14px',
        background: 'linear-gradient(180deg, rgba(6,16,30,0.86), rgba(6,16,30,0.55))',
        borderBottom: '1px solid rgba(255,224,138,0.18)',
        boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.18rem', color: '#FFE08A', textShadow: '0 0 14px rgba(214,168,79,0.35)' }}>
          Kachuful
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isHost && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.4)',
                color: '#F87171',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              End
            </button>
          )}
          <button
            onClick={() => { setShowRules(s => !s); setShowScores(false); }}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.075)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#C8BA9D',
              fontSize: '0.76rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Rules
          </button>
          <button
            onClick={() => { setShowScores(s => !s); setShowRules(false); }}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.075)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#C8BA9D',
              fontSize: '0.76rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Scores
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        overflowY: 'hidden',
        padding: isMobile ? '8px 8px 10px' : '10px',
        gap: isMobile ? 8 : 10,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Other players */}
        <div style={{
          flexShrink: 0,
          width: '100%',
          maxWidth: '100%',
          display: 'flex',
          flexWrap: 'nowrap',
          gap: isMobile ? 8 : 10,
          justifyContent: isMobile && shouldScrollSeats ? 'flex-start' : 'center',
          alignItems: 'stretch',
          padding: isMobile ? 'clamp(10px, 1.5vh, 14px) 4px clamp(4px, 0.8vh, 6px)' : '14px 8px 6px',
          minHeight: isMobile ? 'clamp(78px, 13.5vh, 98px)' : 98,
          overflowX: shouldScrollSeats ? 'auto' : 'hidden',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: shouldScrollSeats ? 'x proximity' : 'none',
        }}>
          {otherPlayers.map((player) => {
            const seatIdx = players.findIndex(p => p.id === player.id);
            return (
              <PlayerSeat
                key={player.id}
                player={player}
                bid={bids[player.id]}
                tricksWon={tricksWon[player.id]}
                handSize={handSizes[player.id] || 0}
                isCompulsory={seatIdx === compulsoryPlayerIndex}
                isCurrentTurn={seatIdx === currentTurnIndex && phase === 'playing'}
                isCurrentBidder={seatIdx === currentBidderSeatIndex && phase === 'bidding'}
                phase={phase}
                isMe={player.id === playerId}
              />
            );
          })}
        </div>

        {/* Center: trick area + trump */}
        <div style={{
          flex: isMobileBidding ? '0 0 auto' : 1,
          display: 'flex',
          flexDirection: isMobile ? (isMobileBidding ? 'row' : 'column') : 'row',
          gap: isMobileBidding ? 8 : 12,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
          overflow: 'hidden',
          paddingTop: isMobileBidding ? 'clamp(6px, 1.2vh, 18px)' : (isMobile ? 10 : 0),
        }}>
          <div style={{
            flex: isMobile ? '0 0 auto' : 1,
            width: '100%',
            maxWidth: 520,
            display: isMobileBidding ? 'none' : 'block',
            position: 'relative',
          }}>
            <div ref={trickTargetRef}>
              <TrickArea
                currentTrick={displayTrick}
                players={players}
                trumpSuit={trumpSuit}
                winnerId={trickWinner}
              />
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <TrumpIndicator
              trumpSuit={trumpSuit}
              currentRound={currentRound}
              totalRounds={totalRounds}
              cardsThisRound={cardsThisRound}
            />
          </div>
        </div>

        {/* Hand */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          paddingBottom: isMyBidTurn ? 'clamp(130px, 25vh, 210px)' : (phase === 'playing' ? 58 : 6),
        }}>

          {/* Hand */}
          <Hand
            hand={myHand}
            onPlayCard={(card, meta = {}) => {
              animateCardToTable(card, meta.sourceRect);
              setCardSubmitted(true);
              lastPlayedCardRef.current = card;
              if (cardSubmitTimerRef.current) clearTimeout(cardSubmitTimerRef.current);
              cardSubmitTimerRef.current = setTimeout(() => {
                // Auto-retry once if no server confirmation after 5s
                if (lastPlayedCardRef.current) {
                  emit('play_card', { roomCode, card: lastPlayedCardRef.current });
                }
                setCardSubmitted(false);
              }, 5000);
              emit('play_card', { roomCode, card });
            }}
            isMyTurn={isMyTurn}
            leadSuit={leadSuit}
            trumpSuit={trumpSuit}
            phase={phase}
          />
        </div>
      </div>

      {flyingCards.map(item => (
        <div
          key={item.id}
          onTransitionEnd={() => removeFlyingCard(item.id)}
          style={{
            position: 'fixed',
            left: item.from.left,
            top: item.from.top,
            width: item.from.width,
            height: item.from.height,
            zIndex: 260,
            pointerEvents: 'none',
            transform: item.active
              ? `translate3d(${item.deltaX}px, ${item.deltaY}px, 0) rotate(-4deg) scale(1.04)`
              : 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
            opacity: item.active ? 0.92 : 1,
            transition: 'transform 260ms cubic-bezier(0.18, 0.82, 0.24, 1), opacity 260ms ease',
            filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.34))',
            willChange: 'transform, opacity',
          }}
        >
          <Card
            card={item.card}
            isTrump={item.card.suit === trumpSuit}
            size={item.from.width > 74 ? 'mobile' : 'normal'}
            style={{ width: item.from.width, height: item.from.height }}
          />
        </div>
      ))}

      {/* Bid panel */}
      {isMyBidTurn && (
        <BidPanel
          cardsThisRound={cardsThisRound}
          onBid={(bid) => emit('place_bid', { roomCode, bid })}
          forbiddenBid={getForbiddenBid()}
        />
      )}

      {/* Waiting for others to bid */}
      {phase === 'bidding' && !isMyBidTurn && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px',
          background: 'rgba(7,20,38,0.94)',
          borderTop: '1px solid rgba(255,224,138,0.22)',
          textAlign: 'center',
          fontSize: '0.86rem',
          fontWeight: 700,
          color: '#C8BA9D',
          boxShadow: '0 -12px 30px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(12px)',
          zIndex: 190,
        }}>
          {bids[playerId] !== undefined
            ? `You bid ${bids[playerId]}. Waiting for ${currentBidder?.name || 'others'}...`
            : `Waiting for ${currentBidder?.name || 'others'} to bid...`}
        </div>
      )}

      {/* Playing phase status bar */}
      {phase === 'playing' && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px',
          background: isMyTurn ? 'rgba(12,52,28,0.96)' : 'rgba(7,20,38,0.94)',
          borderTop: isMyTurn ? '1px solid rgba(110,231,183,0.35)' : '1px solid rgba(255,224,138,0.22)',
          textAlign: 'center',
          fontSize: '0.86rem',
          fontWeight: 700,
          color: isMyTurn ? '#6EE7B7' : '#C8BA9D',
          boxShadow: '0 -12px 30px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(12px)',
          zIndex: 190,
        }}>
          {isMyTurn ? 'Your turn to play!' : `Waiting for ${currentPlayer?.name || 'player'} to play...`}
        </div>
      )}

      {showScores && (
        <ScoreTable
          players={players}
          bids={bids}
          tricksWon={tricksWon}
          scores={scores}
          onClose={() => setShowScores(false)}
        />
      )}

      {roundSummary && (
        <RoundSummaryModal
          roundResult={roundSummary.roundResult}
          players={players}
          scores={roundSummary.scores}
          onNext={roundSummary.nextRound ? null : undefined}
        />
      )}

      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 300,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'rgba(10,20,40,0.98)',
            border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: 14,
            padding: '28px 24px 22px',
            width: 'min(320px, 88vw)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: '1.5rem' }}>🛑</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', color: '#FFE08A', fontWeight: 700, textAlign: 'center' }}>
              End the Game?
            </div>
            <div style={{ fontSize: '0.82rem', color: '#C8BA9D', textAlign: 'center', lineHeight: 1.55 }}>
              This will immediately end the game for all players and delete the room.
            </div>
            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: '#C8BA9D',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  emit('delete_room', { roomCode });
                  setShowDeleteConfirm(false);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  background: 'rgba(220,38,38,0.85)',
                  border: '1px solid rgba(220,38,38,0.6)',
                  color: '#fff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                End Game
              </button>
            </div>
          </div>
        </div>
      )}

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
            width: 'min(340px, 92vw)',
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
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#FFE08A', fontWeight: 700 }}>
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
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFE08A', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: '0.84rem', color: '#D8C7A7', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
