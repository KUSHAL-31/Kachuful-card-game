export const SUIT_SYMBOLS = {
  spades: '♠',
  diamonds: '♦',
  clubs: '♣',
  hearts: '♥',
};

export const SUIT_COLORS = {
  spades: '#1A1A1A',
  clubs: '#1A1A1A',
  diamonds: '#CC2200',
  hearts: '#CC2200',
};

export const TRUMP_HINDI = {
  spades: 'Kali (काली)',
  diamonds: 'Charkat (चरखत)',
  clubs: 'Falai (फलाई)',
  hearts: 'Laal (लाल)',
};

export function suitColor(suit) {
  return SUIT_COLORS[suit] || '#1A1A1A';
}

export function suitSymbol(suit) {
  return SUIT_SYMBOLS[suit] || '?';
}

export function cardLabel(card) {
  if (!card) return '';
  return `${card.rank}${suitSymbol(card.suit)}`;
}

export function sortHand(hand) {
  const suitOrder = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };
  return [...hand].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return b.value - a.value;
  });
}

export function isValidPlay(card, hand, leadSuit) {
  if (!leadSuit) return true;
  if (card.suit === leadSuit) return true;
  const hasSuit = hand.some(c => c.suit === leadSuit);
  return !hasSuit;
}
