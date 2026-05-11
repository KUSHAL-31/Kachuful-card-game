import React, { useState, useEffect } from 'react';
import Hand from '../components/Hand';
import TrickArea from '../components/TrickArea';
import PlayerSeat from '../components/PlayerSeat';
import BidPanel from '../components/BidPanel';
import TrumpIndicator from '../components/TrumpIndicator';
import ScoreTable from '../components/ScoreTable';
import RoundSummaryModal from '../components/RoundSummaryModal';

export default function GameScreen({ gameState, myHand, playerId, roomCode, emit }) {
  const [showScores, setShowScores] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [roundSummary, setRoundSummary] = useState(null);
  const [trickWinner, setTrickWinner] = useState(null);
  const [displayTrick, setDisplayTrick] = useState([]);
  const [cardSubmitted, setCardSubmitted] = useState(false);

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
    setCardSubmitted(false);
  }, [currentTurnIndex, currentTrick.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.type === 'trick_winner') setTrickWinner(e.detail.winnerId);
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
        padding: '10px 14px',
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
          padding: isMobile ? '14px 4px 6px' : '14px 8px 6px',
          minHeight: isMobile ? 92 : 98,
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
          justifyContent: isMobile && !isMobileBidding ? 'flex-start' : 'center',
          minHeight: 0,
          overflow: 'hidden',
          paddingTop: isMobileBidding ? 18 : (isMobile ? 14 : 0),
        }}>
          <div style={{
            flex: 1,
            width: '100%',
            maxWidth: 520,
            display: isMobileBidding ? 'none' : 'block',
          }}>
            <TrickArea
              currentTrick={displayTrick}
              players={players}
              trumpSuit={trumpSuit}
              winnerId={trickWinner}
            />
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
          paddingBottom: isMyBidTurn ? 320 : (phase === 'playing' && !isMyTurn ? 58 : 8),
        }}>

          {/* Hand */}
          <Hand
            hand={myHand}
            onPlayCard={(card) => {
              setCardSubmitted(true);
              emit('play_card', { roomCode, card });
            }}
            isMyTurn={isMyTurn}
            leadSuit={leadSuit}
            trumpSuit={trumpSuit}
            phase={phase}
          />
        </div>
      </div>

      {/* Bid panel */}
      {isMyBidTurn && (
        <BidPanel
          cardsThisRound={cardsThisRound}
          onBid={(bid) => emit('place_bid', { roomCode, bid })}
          forbiddenBid={getForbiddenBid()}
          trumpSuit={trumpSuit}
          currentRound={currentRound}
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

      {/* Waiting for player to play */}
      {phase === 'playing' && !isMyTurn && currentPlayer && (
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
          Waiting for {currentPlayer.name || 'player'} to play...
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
