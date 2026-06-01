import React, { useRef, useState, useEffect, useCallback } from 'react';
import Hand from '../components/Hand';
import TrickArea from '../components/TrickArea';
import PlayerSeat from '../components/PlayerSeat';
import Card from '../components/Card';
import BidPanel from '../components/BidPanel';
import TrumpIndicator from '../components/TrumpIndicator';
import ScoreTable from '../components/ScoreTable';
import RoundSummaryModal from '../components/RoundSummaryModal';

// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel({ messages, playerId, onSend, onClose }) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexShrink: 0 }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', color: '#FFE08A', fontWeight: 700 }}>
          Room Chat
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#C8BA9D', fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        paddingRight: 2,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(200,186,157,0.45)', fontSize: '0.78rem', marginTop: 40, lineHeight: 1.7 }}>
            No messages yet.<br />Say something!
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === playerId;
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && (
                <div style={{ fontSize: '0.68rem', color: '#FFE08A', fontWeight: 700, marginBottom: 3, paddingLeft: 2 }}>
                  {msg.senderName}
                </div>
              )}
              <div style={{
                maxWidth: '85%',
                padding: '7px 11px',
                borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: isMe
                  ? 'linear-gradient(135deg, rgba(214,168,79,0.28), rgba(255,224,138,0.18))'
                  : 'rgba(255,255,255,0.07)',
                border: isMe
                  ? '1px solid rgba(214,168,79,0.35)'
                  : '1px solid rgba(255,255,255,0.1)',
                color: isMe ? '#FFE08A' : '#D8C7A7',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}>
                {msg.text}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(200,186,157,0.45)', marginTop: 3, paddingLeft: 2, paddingRight: 2 }}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        marginTop: 12,
        flexShrink: 0,
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingTop: 12,
      }}>
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 200))}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Type a message…"
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,224,138,0.2)',
            borderRadius: 10,
            padding: '8px 11px',
            color: '#E8D9B5',
            fontSize: '0.8rem',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.45,
            maxHeight: 80,
            overflowY: 'auto',
          }}
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            background: draft.trim() ? 'rgba(214,168,79,0.85)' : 'rgba(255,255,255,0.06)',
            border: 'none',
            color: draft.trim() ? '#1a1000' : 'rgba(200,186,157,0.4)',
            fontSize: '0.9rem',
            cursor: draft.trim() ? 'pointer' : 'default',
            transition: 'background 0.18s, color 0.18s',
            flexShrink: 0,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}


// ─── More Dropdown ────────────────────────────────────────────────────────────
function MoreDropdown({ isHost, onRules, onEnd, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [
    { label: 'Rules', icon: '📖', action: onRules },
    ...(isHost ? [{ label: 'End Game', icon: '🛑', action: onEnd, danger: true }] : []),
  ];

  return (
    <div ref={ref} style={{
      position: 'absolute',
      top: 'calc(100% + 6px)',
      right: 0,
      background: 'rgba(8,20,38,0.98)',
      border: '1px solid rgba(255,224,138,0.2)',
      borderRadius: 10,
      boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      overflow: 'hidden',
      minWidth: 140,
      zIndex: 250,
    }}>
      {items.map((item, i) => (
        <button
          key={item.label}
          onClick={() => { item.action(); onClose(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            width: '100%',
            padding: '11px 16px',
            background: 'none',
            border: 'none',
            borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            color: item.danger ? '#F87171' : '#C8BA9D',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'left',
          }}
          onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Chat Icon SVG ────────────────────────────────────────────────────────────
function ChatIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ─── Game Screen ──────────────────────────────────────────────────────────────
export default function GameScreen({ gameState, myHand, playerId, roomCode, isHost, emit, chatMessages = [], onSendMessage }) {
  // sidebar: null | 'chat' | 'scores' | 'rules'
  const [sidebar, setSidebar] = useState(null);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roundSummary, setRoundSummary] = useState(null);
  const [trickWinner, setTrickWinner] = useState(null);
  const [displayTrick, setDisplayTrick] = useState([]);
  const [cardSubmitted, setCardSubmitted] = useState(false);
  const [flyingCards, setFlyingCards] = useState([]);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const unreadCount = sidebar === 'chat' ? 0 : Math.max(0, chatMessages.length - lastSeenCount);


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
  const trickIsComplete = players.length > 0 && displayTrick.length >= players.length;
  const isMyTurnVisible = isMyTurn && !trickIsComplete;
  const isMyBidTurn = currentBidder?.id === playerId && phase === 'bidding';

  const otherPlayers = players;

  // Mark all messages as seen whenever chat is open and new messages arrive
  useEffect(() => {
    if (sidebar === 'chat') {
      setLastSeenCount(chatMessages.length);
    }
  }, [chatMessages, sidebar]);

  const openChat = useCallback(() => {
    setSidebar('chat');
    setShowMoreDropdown(false);
  }, []);

  const humanCount = players.filter(p => !p.isBot).length;
  const chatDisabled = humanCount <= 1;

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
    if (displayTrick.length === 0 || players.length === 0 || displayTrick.length < players.length) return;
    const timer = setTimeout(() => {
      setDisplayTrick([]);
      setTrickWinner(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [displayTrick, players.length]);

  useEffect(() => {
    if (cardSubmitTimerRef.current) clearTimeout(cardSubmitTimerRef.current);
    lastPlayedCardRef.current = null;
    setCardSubmitted(false);
  }, [currentTurnIndex, currentTrick.length]);

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

  const closeSidebar = () => setSidebar(null);

  return (
    <div className="premium-table" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Chat button with unread badge */}
          <div style={{ position: 'relative', overflow: 'visible', zIndex: 3 }}>
            <button
              onClick={chatDisabled ? undefined : openChat}
              title={chatDisabled ? 'No other players to chat with' : 'Chat'}
              disabled={chatDisabled}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                background: chatDisabled ? 'rgba(255,255,255,0.03)' : sidebar === 'chat' ? 'rgba(214,168,79,0.22)' : 'rgba(255,255,255,0.075)',
                border: chatDisabled ? '1px solid rgba(255,255,255,0.07)' : sidebar === 'chat' ? '1px solid rgba(214,168,79,0.45)' : '1px solid rgba(255,255,255,0.14)',
                color: chatDisabled ? 'rgba(200,186,157,0.25)' : sidebar === 'chat' ? '#FFE08A' : '#C8BA9D',
                cursor: chatDisabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                transition: 'background 0.18s, border 0.18s',
              }}
            >
              <ChatIcon />
              <span style={{ fontSize: '0.76rem', fontWeight: 800 }}>Chat</span>
            </button>
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: '#EF4444',
                color: '#fff',
                borderRadius: '50%',
                minWidth: 20,
                height: 20,
                padding: '0 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 900,
                border: '2px solid #061020',
                pointerEvents: 'none',
                lineHeight: 1,
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(239,68,68,0.7)',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </div>

          {/* Scores button */}
          <button
            onClick={() => { setSidebar(s => s === 'scores' ? null : 'scores'); setShowMoreDropdown(false); }}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: sidebar === 'scores' ? 'rgba(214,168,79,0.22)' : 'rgba(255,255,255,0.075)',
              border: sidebar === 'scores' ? '1px solid rgba(214,168,79,0.45)' : '1px solid rgba(255,255,255,0.14)',
              color: sidebar === 'scores' ? '#FFE08A' : '#C8BA9D',
              fontSize: '0.76rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'background 0.18s, border 0.18s',
            }}
          >
            Scores
          </button>

          {/* More (⋯) button with dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMoreDropdown(s => !s)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                background: showMoreDropdown ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.075)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: '#C8BA9D',
                fontSize: '1.1rem',
                fontWeight: 900,
                cursor: 'pointer',
                lineHeight: 1,
                letterSpacing: '0.05em',
              }}
            >
              ···
            </button>
            {showMoreDropdown && (
              <MoreDropdown
                isHost={isHost}
                onRules={() => { setSidebar(s => s === 'rules' ? null : 'rules'); }}
                onEnd={() => { setShowDeleteConfirm(true); }}
                onClose={() => setShowMoreDropdown(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
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
          <Hand
            hand={myHand}
            onPlayCard={(card, meta = {}) => {
              animateCardToTable(card, meta.sourceRect);
              setCardSubmitted(true);
              lastPlayedCardRef.current = card;
              if (cardSubmitTimerRef.current) clearTimeout(cardSubmitTimerRef.current);
              cardSubmitTimerRef.current = setTimeout(() => {
                if (lastPlayedCardRef.current) {
                  emit('play_card', { roomCode, card: lastPlayedCardRef.current });
                }
                setCardSubmitted(false);
              }, 5000);
              emit('play_card', { roomCode, card });
            }}
            isMyTurn={isMyTurnVisible}
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
          {isMyTurnVisible
            ? 'Your turn to play!'
            : isMyTurn
            ? 'You won the trick!'
            : `Waiting for ${currentPlayer?.name || 'player'} to play...`}
        </div>
      )}

      {/* ── Right Sidebar ── */}
      {sidebar && (
        <div className="sidebar-overlay" style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          display: 'flex',
          justifyContent: 'flex-end',
          overflow: 'hidden',
        }}>
          <div onClick={closeSidebar} style={{ flex: 1 }} />
          <div style={{
            width: 'min(340px, 92vw)',
            height: '100dvh',
            maxHeight: '100dvh',
            background: 'rgba(6,16,30,0.98)',
            borderLeft: '1px solid rgba(255,224,138,0.25)',
            boxShadow: '-18px 0 48px rgba(0,0,0,0.42)',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 18px',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}>
            {sidebar === 'chat' && (
              <ChatPanel
                messages={chatMessages}
                playerId={playerId}
                onSend={onSendMessage}
                onClose={closeSidebar}
              />
            )}

            {sidebar === 'scores' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', color: '#FFE08A', fontWeight: 700 }}>Scores</div>
                  <button onClick={closeSidebar} style={{ background: 'none', border: 'none', color: '#C8BA9D', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <ScoreTable
                    players={players}
                    bids={bids}
                    tricksWon={tricksWon}
                    scores={scores}
                    onClose={closeSidebar}
                    inline
                  />
                </div>
              </div>
            )}

            {sidebar === 'rules' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', gap: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#FFE08A', fontWeight: 700 }}>
                    How to Play
                  </div>
                  <button onClick={closeSidebar} style={{ background: 'none', border: 'none', color: '#C8BA9D', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
                </div>

                {[
                  { title: '🎯 Objective', body: 'Predict exactly how many tricks you will win each round. Score points only if your prediction is correct.' },
                  { title: '🃏 The Deck & Deal', body: 'A standard 52-card deck is used. Cards dealt per round follow a pyramid: 1 card in round 1, increasing by 1 each round up to the max, then decreasing back to 1. With 2–5 players the max is 10 cards; with 6–10 players it scales down to fit the deck.' },
                  { title: '♠ Trump Suit', body: 'Each round has a trump suit that rotates in order: Spades → Diamonds → Clubs → Hearts, then repeats. Trump cards beat all non-trump cards regardless of rank.' },
                  { title: '📢 Bidding', body: 'Starting from the player left of the dealer, each player bids how many tricks they expect to win (0 to cards dealt). The dealer bids last and has a restriction — their bid cannot make the total bids equal the number of cards dealt. This keeps at least one player from winning their bid.' },
                  { title: '🤚 Playing a Trick', body: "The player who won the last trick leads first. You must follow the led suit if you have it. If you don't have the led suit, you can play any card including trump. The highest trump wins the trick; if no trump is played, the highest card of the led suit wins." },
                  { title: '🏆 Scoring', body: 'If you win exactly as many tricks as you bid: score = 10 + tricks won.\nIf you win more or fewer tricks than you bid: score = 0 for that round.\nBid 0 and win 0 → score 10. Bid 3 and win 3 → score 13.' },
                  { title: '🔄 Rounds', body: 'The game runs through all rounds of the pyramid. After the final round the player with the highest total score wins. If scores are tied, all tied players share the win.' },
                  { title: '👑 Dealer (Compulsory Player)', body: 'The dealer rotates each round. The dealer badge shows who it is. The dealer always bids last and faces the forbidden bid restriction.' },
                ].map(({ title, body }) => (
                  <div key={title} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 14 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFE08A', marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: '0.84rem', color: '#D8C7A7', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{body}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {roundSummary && (
        <RoundSummaryModal
          roundResult={roundSummary.roundResult}
          players={players}
          scores={roundSummary.scores}
          onNext={roundSummary.nextRound ? null : undefined}
        />
      )}

      {/* End game confirm */}
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
                  flex: 1, padding: '10px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
                  color: '#C8BA9D', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { emit('delete_room', { roomCode }); setShowDeleteConfirm(false); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  background: 'rgba(220,38,38,0.85)', border: '1px solid rgba(220,38,38,0.6)',
                  color: '#fff', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                End Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
