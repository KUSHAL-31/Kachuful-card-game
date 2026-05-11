const { createDeck, shuffle, deal } = require('./deckUtils');
const {
  getTrumpForRound,
  getCardsForRound,
  getMaxCards,
  getTotalRounds,
  calculateScore,
} = require('./constants');

function initGame(players) {
  const numPlayers = players.length;
  const maxCards = getMaxCards(numPlayers);
  const totalRounds = getTotalRounds(maxCards);
  const compulsoryPlayerIndex = Math.floor(Math.random() * numPlayers);

  const scores = {};
  const tricksWon = {};
  players.forEach(p => {
    scores[p.id] = 0;
    tricksWon[p.id] = 0;
  });

  return {
    players,
    numPlayers,
    maxCards,
    totalRounds,
    currentRound: 0,
    cardsThisRound: 0,
    trumpSuit: null,
    compulsoryPlayerIndex,
    phase: 'roundStart',
    bids: {},
    biddingOrder: [],
    currentBidderIndex: 0,
    hands: {},
    currentTrick: [],
    playedCards: [],
    leadSuit: null,
    currentTurnIndex: 0,
    trickLeaderIndex: 0,
    tricksWon: {},
    scores,
    roundHistory: [],
  };
}

function startRound(gameState) {
  const { players, numPlayers, maxCards, compulsoryPlayerIndex } = gameState;
  const currentRound = gameState.currentRound + 1;
  const cardsThisRound = getCardsForRound(currentRound, maxCards);
  const trumpSuit = getTrumpForRound(currentRound);

  const deck = shuffle(createDeck());
  const dealtHands = deal(deck, numPlayers, cardsThisRound);

  const hands = {};
  const tricksWon = {};
  players.forEach((p, i) => {
    hands[p.id] = dealtHands[i];
    tricksWon[p.id] = 0;
  });

  // Bidding order: start from player left of compulsory (clockwise), compulsory bids last
  const biddingOrder = [];
  for (let i = 1; i <= numPlayers; i++) {
    biddingOrder.push((compulsoryPlayerIndex + i) % numPlayers);
  }

  const firstTrickLeaderIndex = (compulsoryPlayerIndex + 1) % numPlayers;

  return {
    ...gameState,
    currentRound,
    cardsThisRound,
    trumpSuit,
    phase: 'bidding',
    bids: {},
    biddingOrder,
    currentBidderIndex: 0,
    hands,
    currentTrick: [],
    playedCards: [],
    leadSuit: null,
    currentTurnIndex: firstTrickLeaderIndex,
    trickLeaderIndex: firstTrickLeaderIndex,
    tricksWon,
  };
}

function getForbiddenBid(bids, totalTricks) {
  const sumSoFar = Object.values(bids).reduce((a, b) => a + b, 0);
  const forbidden = totalTricks - sumSoFar;
  if (forbidden >= 0 && forbidden <= totalTricks) return forbidden;
  return null;
}

function placeBid(gameState, playerId, bid) {
  const { bids, biddingOrder, currentBidderIndex, cardsThisRound, compulsoryPlayerIndex, players } = gameState;

  const currentBidderSeatIndex = biddingOrder[currentBidderIndex];
  const currentBidder = players[currentBidderSeatIndex];

  if (currentBidder.id !== playerId) {
    return { error: 'Not your turn to bid' };
  }

  if (!Number.isInteger(bid) || bid < 0 || bid > cardsThisRound) {
    return { error: `Bid must be between 0 and ${cardsThisRound}` };
  }

  // Check if this is the compulsory player's bid (last to bid)
  const isCompulsoryPlayer = currentBidderSeatIndex === compulsoryPlayerIndex;
  if (isCompulsoryPlayer) {
    const forbidden = getForbiddenBid(bids, cardsThisRound);
    if (forbidden !== null && bid === forbidden) {
      return { error: `Forbidden bid: ${forbidden} (Compulsory player rule)` };
    }
  }

  const newBids = { ...bids, [playerId]: bid };
  const nextBidderIndex = currentBidderIndex + 1;
  const biddingComplete = nextBidderIndex >= biddingOrder.length;

  let nextBidderId = null;
  let forbiddenBid = null;

  if (!biddingComplete) {
    const nextSeatIndex = biddingOrder[nextBidderIndex];
    const nextPlayer = players[nextSeatIndex];
    nextBidderId = nextPlayer.id;

    // Check if next player is compulsory
    if (nextSeatIndex === compulsoryPlayerIndex) {
      forbiddenBid = getForbiddenBid(newBids, cardsThisRound);
    }
  }

  const newState = {
    ...gameState,
    bids: newBids,
    currentBidderIndex: nextBidderIndex,
    phase: biddingComplete ? 'playing' : 'bidding',
  };

  return { state: newState, nextBidderId, forbiddenBid, biddingComplete };
}

function validateCardPlay(gameState, playerId, card) {
  const { players, currentTurnIndex, hands, currentTrick, leadSuit, trumpSuit } = gameState;
  const currentPlayer = players[currentTurnIndex];

  if (currentPlayer.id !== playerId) {
    return 'Not your turn to play';
  }

  const hand = hands[playerId];
  const cardInHand = hand.find(c => c.suit === card.suit && c.rank === card.rank);
  if (!cardInHand) {
    return 'Card not in hand';
  }

  // Follow-suit rule: if lead suit is set and player has that suit, must play it
  if (leadSuit && card.suit !== leadSuit) {
    const hasSuit = hand.some(c => c.suit === leadSuit);
    if (hasSuit) {
      return `Must follow suit: ${leadSuit}`;
    }
  }

  return null; // valid
}

function playCard(gameState, playerId, card) {
  const validationError = validateCardPlay(gameState, playerId, card);
  if (validationError) {
    return { error: validationError };
  }

  const { players, currentTurnIndex, hands, currentTrick, leadSuit, trickLeaderIndex, tricksWon, scores, numPlayers, cardsThisRound, trumpSuit, bids, currentRound, totalRounds, roundHistory, playedCards = [] } = gameState;

  const newHand = hands[playerId].filter(c => !(c.suit === card.suit && c.rank === card.rank));
  const newHands = { ...hands, [playerId]: newHand };
  const newPlayedCards = [...playedCards, card];

  const newTrick = [...currentTrick, {
    playerId,
    card,
    seatIndex: currentTurnIndex,
  }];

  const newLeadSuit = currentTrick.length === 0 ? card.suit : leadSuit;
  const nextTurnIndex = (currentTurnIndex + 1) % numPlayers;
  const trickComplete = newTrick.length === numPlayers;

  if (!trickComplete) {
    return {
      state: {
        ...gameState,
        hands: newHands,
        playedCards: newPlayedCards,
        currentTrick: newTrick,
        leadSuit: newLeadSuit,
        currentTurnIndex: nextTurnIndex,
      },
      trickComplete: false,
      nextPlayerId: players[nextTurnIndex].id,
    };
  }

  // Resolve the trick
  const winnerId = resolveTrick(newTrick, trumpSuit, newLeadSuit);
  const winnerSeatIndex = players.findIndex(p => p.id === winnerId);
  const newTricksWon = { ...tricksWon, [winnerId]: (tricksWon[winnerId] || 0) + 1 };

  // Check if round is over (no cards left)
  const roundOver = newHand.length === 0 && newTrick.length === numPlayers;

  if (roundOver) {
    // Calculate scores for this round
    const pointsEarned = {};
    const newScores = { ...scores };
    players.forEach(p => {
      const bid = bids[p.id] !== undefined ? bids[p.id] : 0;
      const won = newTricksWon[p.id] || 0;
      const points = calculateScore(bid, won);
      pointsEarned[p.id] = points;
      newScores[p.id] = (newScores[p.id] || 0) + points;
    });

    const roundResult = {
      roundNumber: currentRound,
      cardsDealt: cardsThisRound,
      trumpSuit,
      bids: { ...bids },
      tricksWon: { ...newTricksWon },
      pointsEarned,
    };

    const newRoundHistory = [...roundHistory, roundResult];
    const isLastRound = currentRound >= totalRounds;

    // Rotate compulsory player clockwise for next round
    const newCompulsoryPlayerIndex = (gameState.compulsoryPlayerIndex + 1) % numPlayers;

    return {
      state: {
        ...gameState,
        hands: newHands,
        playedCards: newPlayedCards,
        currentTrick: newTrick,
        leadSuit: newLeadSuit,
        tricksWon: newTricksWon,
        scores: newScores,
        roundHistory: newRoundHistory,
        phase: isLastRound ? 'gameEnd' : 'roundEnd',
        compulsoryPlayerIndex: newCompulsoryPlayerIndex,
        trickWinner: winnerId,
      },
      trickComplete: true,
      roundOver: true,
      isLastRound,
      winnerId,
      roundResult,
      newScores,
      newRoundHistory,
    };
  }

  // Store completed trick for display; caller will clear after timeout
  return {
    state: {
      ...gameState,
      hands: newHands,
      playedCards: newPlayedCards,
      currentTrick: newTrick,
      leadSuit: newLeadSuit,
      tricksWon: newTricksWon,
      currentTurnIndex: winnerSeatIndex,
      trickLeaderIndex: winnerSeatIndex,
    },
    trickComplete: true,
    roundOver: false,
    winnerId,
    nextLeaderId: winnerId,
  };
}

function resolveTrick(trick, trumpSuit, leadSuit) {
  let winner = trick[0];
  for (let i = 1; i < trick.length; i++) {
    const challenger = trick[i];
    const winCard = winner.card;
    const chalCard = challenger.card;

    const winIsTrump = winCard.suit === trumpSuit;
    const chalIsTrump = chalCard.suit === trumpSuit;
    const chalIsLead = chalCard.suit === leadSuit;

    if (chalIsTrump) {
      if (!winIsTrump || chalCard.value > winCard.value) {
        winner = challenger;
      }
    } else if (chalIsLead && !winIsTrump) {
      if (chalCard.value > winCard.value) {
        winner = challenger;
      }
    }
  }
  return winner.playerId;
}

function getWinners(scores) {
  const maxScore = Math.max(...Object.values(scores));
  return Object.entries(scores)
    .filter(([, score]) => score === maxScore)
    .map(([id]) => id);
}

module.exports = {
  initGame,
  startRound,
  placeBid,
  playCard,
  getForbiddenBid,
  getWinners,
  resolveTrick,
};
