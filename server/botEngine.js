const { createDeck } = require('./deckUtils');
const { resolveTrick, getForbiddenBid } = require('./gameEngine');

const BID_SIMULATIONS = 140;
const PLAY_SIMULATIONS = 220;
const BID_TIME_BUDGET_MS = 350;
const PLAY_TIME_BUDGET_MS = 450;

function chooseBotBid(game, botId) {
  const playerIndex = game.players.findIndex(p => p.id === botId);
  const forbidden = playerIndex === game.compulsoryPlayerIndex
    ? getForbiddenBid(game.bids, game.cardsThisRound)
    : null;
  const possibleBids = Array.from({ length: game.cardsThisRound + 1 }, (_, bid) => bid)
    .filter(bid => bid !== forbidden);

  let bestBid = possibleBids[0] ?? 0;
  let bestScore = -Infinity;
  const startedAt = Date.now();
  const runsPerBid = Math.max(18, Math.floor(BID_SIMULATIONS / Math.max(1, possibleBids.length)));
  const handBidEstimate = estimateHandBid(game, botId);

  for (const bid of possibleBids) {
    let score = 0;
    let runs = 0;
    while (runs < runsPerBid && Date.now() - startedAt < BID_TIME_BUDGET_MS) {
      const sim = createSampledState(game, botId);
      sim.bids = {
        ...estimateMissingBids(sim, botId),
        ...game.bids,
        [botId]: bid,
      };
      sim.phase = 'playing';
      sim.currentTrick = [];
      sim.leadSuit = null;
      sim.currentTurnIndex = sim.trickLeaderIndex;
      const result = simulateRound(sim, botId);
      score += result.tricksWon === bid ? 1 : 0;
      score += Math.max(0, 0.08 - Math.abs(result.tricksWon - bid) * 0.025);
      runs++;
    }

    const normalized = runs > 0 ? score / runs : -Math.abs(bid - handBidEstimate);
    if (normalized > bestScore || (normalized === bestScore && Math.abs(bid - handBidEstimate) < Math.abs(bestBid - handBidEstimate))) {
      bestScore = normalized;
      bestBid = bid;
    }
  }

  return bestBid;
}

function chooseBotCard(game, botId) {
  const legalCards = getLegalCards(game, botId);
  if (legalCards.length <= 1) return legalCards[0];

  const targetBid = game.bids[botId] ?? estimateHandBid(game, botId);
  let bestCard = legalCards[0];
  let bestScore = -Infinity;
  const startedAt = Date.now();
  const sortedCards = [...legalCards].sort((a, b) => heuristicCardScore(game, botId, b) - heuristicCardScore(game, botId, a));
  const runsPerCard = Math.max(12, Math.floor(PLAY_SIMULATIONS / Math.max(1, sortedCards.length)));

  for (const card of sortedCards) {
    let score = 0;
    let runs = 0;
    while (runs < runsPerCard && Date.now() - startedAt < PLAY_TIME_BUDGET_MS) {
      const sim = createSampledState(game, botId);
      applyCard(sim, botId, card);
      const result = simulateRound(sim, botId);
      const diff = Math.abs(result.tricksWon - targetBid);
      score += diff === 0 ? 1 : Math.max(0, 0.18 - diff * 0.06);
      runs++;
    }

    const normalized = runs > 0 ? score / runs : heuristicCardScore(game, botId, card);
    if (normalized > bestScore) {
      bestScore = normalized;
      bestCard = card;
    }
  }

  return bestCard;
}

function simulateRound(state, focusId) {
  let guard = 0;
  while (!isRoundOver(state) && guard < 300) {
    const player = state.players[state.currentTurnIndex];
    const card = choosePolicyCard(state, player.id);
    applyCard(state, player.id, card);
    guard++;
  }
  return { tricksWon: state.tricksWon[focusId] || 0 };
}

function applyCard(state, playerId, card) {
  const seatIndex = state.players.findIndex(p => p.id === playerId);
  state.hands[playerId] = state.hands[playerId].filter(c => !sameCard(c, card));
  state.playedCards = [...(state.playedCards || []), card];
  state.currentTrick.push({ playerId, card, seatIndex });
  if (!state.leadSuit) state.leadSuit = card.suit;

  if (state.currentTrick.length < state.numPlayers) {
    state.currentTurnIndex = (state.currentTurnIndex + 1) % state.numPlayers;
    return;
  }

  const winnerId = resolveTrick(state.currentTrick, state.trumpSuit, state.leadSuit);
  const winnerIndex = state.players.findIndex(p => p.id === winnerId);
  state.tricksWon[winnerId] = (state.tricksWon[winnerId] || 0) + 1;
  state.currentTrick = [];
  state.leadSuit = null;
  state.currentTurnIndex = winnerIndex;
  state.trickLeaderIndex = winnerIndex;
}

function choosePolicyCard(state, playerId) {
  const legalCards = getLegalCards(state, playerId);
  const bid = state.bids[playerId] ?? estimateHandBid(state, playerId);
  const won = state.tricksWon[playerId] || 0;
  const remaining = state.hands[playerId].length;
  const needsTricks = won < bid;
  const mustStillWin = bid - won >= remaining;

  const scored = legalCards.map(card => {
    const projected = wouldWinCurrentTrick(state, playerId, card);
    const strength = cardStrength(card, state.trumpSuit);
    let score = 0;

    if (state.currentTrick.length === 0) {
      score = needsTricks ? strength : -strength;
      if (mustStillWin) score += strength * 0.7;
    } else if (needsTricks) {
      score = projected ? 100 + strength : -strength;
      if (mustStillWin && projected) score += 60;
    } else {
      score = projected ? -100 - strength : -strength;
    }

    const exactNow = won + (projected && state.currentTrick.length === state.numPlayers - 1 ? 1 : 0);
    if (exactNow > bid) score -= 160;
    return { card, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.min(2, scored.length));
  return top[Math.floor(Math.random() * top.length)].card;
}

function createSampledState(game, focusId) {
  const players = game.players.map(p => ({ ...p }));
  const focusHand = cloneCards(game.hands[focusId] || []);
  const knownCards = [
    ...focusHand,
    ...(game.playedCards || []),
  ];
  const unknownDeck = shuffle(createDeck().filter(card => !knownCards.some(known => sameCard(known, card))));
  const hands = { [focusId]: focusHand };
  let cursor = 0;

  for (const player of players) {
    if (player.id === focusId) continue;
    const actualSize = (game.hands[player.id] || []).length;
    hands[player.id] = unknownDeck.slice(cursor, cursor + actualSize);
    cursor += actualSize;
  }

  return {
    ...game,
    players,
    hands,
    bids: { ...game.bids },
    tricksWon: { ...game.tricksWon },
    currentTrick: (game.currentTrick || []).map(t => ({ ...t, card: { ...t.card } })),
  };
}

function estimateMissingBids(state, focusId) {
  const bids = {};
  for (const player of state.players) {
    if (player.id === focusId) continue;
    bids[player.id] = state.bids[player.id] ?? estimateHandBid(state, player.id);
  }
  return bids;
}

function estimateHandBid(state, playerId) {
  const hand = state.hands[playerId] || [];
  if (hand.length === 0) return 0;
  let score = 0;
  const suits = {};

  for (const card of hand) {
    suits[card.suit] = (suits[card.suit] || 0) + 1;
    if (card.value === 14) score += 0.75;
    else if (card.value === 13) score += 0.48;
    else if (card.value === 12) score += 0.28;
    if (card.suit === state.trumpSuit) score += 0.38 + Math.max(0, card.value - 10) * 0.08;
  }

  const shortSuitCount = Object.values(suits).filter(count => count === 1).length;
  score += shortSuitCount * 0.16;
  return Math.max(0, Math.min(hand.length, Math.round(score)));
}

function getLegalCards(state, playerId) {
  const hand = state.hands[playerId] || [];
  if (!state.leadSuit) return hand;
  const suitCards = hand.filter(card => card.suit === state.leadSuit);
  return suitCards.length > 0 ? suitCards : hand;
}

function wouldWinCurrentTrick(state, playerId, card) {
  const trick = [
    ...state.currentTrick,
    { playerId, card, seatIndex: state.currentTurnIndex },
  ];
  const leadSuit = state.leadSuit || card.suit;
  return resolveTrick(trick, state.trumpSuit, leadSuit) === playerId;
}

function heuristicCardScore(state, playerId, card) {
  const bid = state.bids[playerId] ?? estimateHandBid(state, playerId);
  const won = state.tricksWon[playerId] || 0;
  const projected = wouldWinCurrentTrick(state, playerId, card);
  if (won >= bid) return projected ? -100 - cardStrength(card, state.trumpSuit) : -cardStrength(card, state.trumpSuit);
  return projected ? 100 + cardStrength(card, state.trumpSuit) : cardStrength(card, state.trumpSuit);
}

function cardStrength(card, trumpSuit) {
  return card.value + (card.suit === trumpSuit ? 20 : 0);
}

function isRoundOver(state) {
  return state.players.every(player => (state.hands[player.id] || []).length === 0) && state.currentTrick.length === 0;
}

function cloneCards(cards) {
  return cards.map(card => ({ ...card }));
}

function sameCard(a, b) {
  return a?.suit === b?.suit && a?.rank === b?.rank;
}

function shuffle(cards) {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

module.exports = { chooseBotBid, chooseBotCard };
