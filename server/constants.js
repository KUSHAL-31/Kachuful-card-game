const TRUMP_ORDER = ['spades', 'diamonds', 'clubs', 'hearts'];

const TRUMP_SYMBOLS = {
  spades: '♠',
  diamonds: '♦',
  clubs: '♣',
  hearts: '♥',
};

const TRUMP_HINDI = {
  spades: 'Kali (काली)',
  diamonds: 'Charkat (चरखत)',
  clubs: 'Falai (फलाई)',
  hearts: 'Laal (लाल)',
};

const SUIT_COLORS = {
  spades: 'black',
  clubs: 'black',
  diamonds: 'red',
  hearts: 'red',
};

function getTrumpForRound(roundNumber) {
  return TRUMP_ORDER[(roundNumber - 1) % 4];
}

function getCardsForRound(roundNumber, maxCards) {
  if (roundNumber <= maxCards) return roundNumber;
  return maxCards * 2 - roundNumber;
}

function getMaxCards(numPlayers) {
  return Math.floor(52 / numPlayers);
}

function getTotalRounds(maxCards) {
  return maxCards * 2 - 1;
}

function calculateScore(bid, tricksWon) {
  if (bid === tricksWon) return 10 + tricksWon;
  return 0;
}

module.exports = {
  TRUMP_ORDER,
  TRUMP_SYMBOLS,
  TRUMP_HINDI,
  SUIT_COLORS,
  getTrumpForRound,
  getCardsForRound,
  getMaxCards,
  getTotalRounds,
  calculateScore,
};
