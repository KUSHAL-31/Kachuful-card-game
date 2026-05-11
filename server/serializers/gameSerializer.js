function getPublicGameState(game) {
  return {
    players: game.players.map(p => ({
      id: p.id,
      name: p.name,
      seatIndex: p.seatIndex,
      isBot: p.isBot,
      isConnected: p.isConnected !== false, // default true for bots and pre-game players
    })),
    numPlayers: game.numPlayers,
    currentRound: game.currentRound,
    totalRounds: game.totalRounds,
    cardsThisRound: game.cardsThisRound,
    trumpSuit: game.trumpSuit,
    compulsoryPlayerIndex: game.compulsoryPlayerIndex,
    phase: game.phase,
    bids: game.bids,
    currentTrick: game.currentTrick,
    leadSuit: game.leadSuit,
    currentTurnIndex: game.currentTurnIndex,
    trickLeaderIndex: game.trickLeaderIndex,
    tricksWon: game.tricksWon,
    scores: game.scores,
    handSizes: Object.fromEntries(
      game.players.map(player => [player.id, (game.hands[player.id] || []).length])
    ),
    biddingOrder: game.biddingOrder,
    currentBidderIndex: game.currentBidderIndex,
  };
}

module.exports = { getPublicGameState };
