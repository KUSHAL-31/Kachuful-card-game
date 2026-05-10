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
  const [roundSummary, setRoundSummary] = useState(null);
  const [trickWinner, setTrickWinner] = useState(null);
  const [displayTrick, setDisplayTrick] = useState([]);

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

  const isMyTurn = currentPlayer?.id === playerId && phase === 'playing';
  const isMyBidTurn = currentBidder?.id === playerId && phase === 'bidding';

  const otherPlayers = players.filter(p => p.id !== playerId);

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

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(ellipse at center, #2D6A4F 0%, #1B4332 60%, #0a2618 100%)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(212,160,23,0.15)',
        flexShrink: 0,
      }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: '#D4A017' }}>
          Kachuful
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            padding: '3px 10px',
            borderRadius: 20,
            background: phase === 'bidding'
              ? 'rgba(212,160,23,0.2)'
              : phase === 'playing'
              ? 'rgba(34,197,94,0.2)'
              : 'rgba(255,255,255,0.1)',
            border: `1px solid ${phase === 'bidding' ? '#D4A017' : phase === 'playing' ? '#22C55E' : 'rgba(255,255,255,0.2)'}`,
            fontSize: '0.6rem',
            fontWeight: 600,
            color: phase === 'bidding' ? '#D4A017' : phase === 'playing' ? '#22C55E' : '#A89B8C',
            textTransform: 'uppercase',
          }}>
            {phase === 'bidding' ? 'Bidding' : phase === 'playing' ? 'Playing' : phase}
          </div>
          <button
            onClick={() => setShowScores(s => !s)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#A89B8C',
              fontSize: '0.65rem',
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
        overflow: 'hidden',
        padding: '8px',
        gap: 8,
      }}>
        {/* Other players */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
          padding: '4px 8px',
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
              />
            );
          })}
        </div>

        {/* Center: trick area + trump */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
        }}>
          <div style={{ flex: 1, width: '100%', maxWidth: 440 }}>
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

        {/* My info + hand */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          paddingBottom: isMyBidTurn ? 180 : 8,
        }}>
          {/* My stats bar */}
          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            padding: '6px 14px',
            background: 'rgba(15,37,68,0.7)',
            borderRadius: 20,
            border: isMyTurn || isMyBidTurn
              ? '1.5px solid #FFD700'
              : '1px solid rgba(255,255,255,0.08)',
            animation: isMyTurn || isMyBidTurn ? 'glow-gold 1.5s ease infinite' : 'none',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F5F0E8' }}>
              {me?.name || 'You'}
            </span>
            {players.findIndex(p => p.id === playerId) === compulsoryPlayerIndex && (
              <span style={{ fontSize: '0.55rem', color: '#D4A017', fontWeight: 700 }}>DEALER</span>
            )}
            {bids[playerId] !== undefined && (
              <span style={{ fontSize: '0.65rem', color: '#A89B8C' }}>
                Bid: <strong style={{ color: '#F5F0E8' }}>{bids[playerId]}</strong>
              </span>
            )}
            {phase === 'playing' && tricksWon[playerId] !== undefined && (
              <span style={{ fontSize: '0.65rem', color: '#A89B8C' }}>
                Won: <strong style={{
                  color: tricksWon[playerId] === bids[playerId] ? '#22C55E' : '#F5F0E8',
                }}>{tricksWon[playerId]}</strong>
              </span>
            )}
            <span style={{ fontSize: '0.65rem', color: '#D4A017', fontWeight: 700 }}>
              {scores[playerId] || 0} pts
            </span>
          </div>

          {/* Hand */}
          <Hand
            hand={myHand}
            onPlayCard={(card) => emit('play_card', { roomCode, card })}
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
          background: 'rgba(15,37,68,0.9)',
          borderTop: '1px solid rgba(212,160,23,0.2)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#A89B8C',
        }}>
          {bids[playerId] !== undefined
            ? `You bid ${bids[playerId]}. Waiting for ${currentBidder?.name || 'others'}...`
            : `Waiting for ${currentBidder?.name || 'others'} to bid...`}
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
    </div>
  );
}
