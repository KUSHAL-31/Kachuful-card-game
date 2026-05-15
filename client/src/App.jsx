import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import IntroScreen from './screens/IntroScreen';
import LandingScreen from './screens/LandingScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import ResultScreen from './screens/ResultScreen';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const REJOIN_KEY = 'kachuful_session';
function saveSession(roomCode, playerName, token) {
  try { localStorage.setItem(REJOIN_KEY, JSON.stringify({ roomCode, playerName, token })); } catch {}
}
function loadSession() {
  try { return JSON.parse(localStorage.getItem(REJOIN_KEY)); } catch { return null; }
}
function clearSession() {
  try { localStorage.removeItem(REJOIN_KEY); } catch {}
}

let socket = null;
function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
    });
  }
  return socket;
}

export default function App() {
  const hasInviteRoom = Boolean(new URLSearchParams(window.location.search).get('room'));
  const savedSession = loadSession();
  const [screen, setScreen] = useState(hasInviteRoom ? 'landing' : savedSession ? 'landing' : 'intro'); // intro | landing | lobby | game | result
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [myHand, setMyHand] = useState([]);
  const [gameResult, setGameResult] = useState(null);

  const roomCodeRef = useRef(savedSession?.roomCode || null);
  const playerNameRef = useRef(savedSession?.playerName || null);

  const emit = useCallback((event, data) => {
    getSocket().emit(event, data);
  }, []);

  useEffect(() => {
    const s = getSocket();

    s.on('connect', () => {
      // Re-register with server after reconnect using token if available
      const session = loadSession();
      const roomCode = roomCodeRef.current || session?.roomCode;
      const playerName = playerNameRef.current || session?.playerName;
      const token = session?.token;
      if (roomCode && playerName) {
        s.emit('join_room', { roomCode, playerName, isCreating: false, token });
      }
    });

    s.on('room_joined', ({ room, playerId: pid, isHost: host, token }) => {
      setRoom(room);
      setPlayerId(pid);
      setIsHost(host);
      roomCodeRef.current = room.roomCode;
      if (token) saveSession(room.roomCode, playerNameRef.current, token);
      // Don't navigate to lobby if reconnecting mid-game; game_started will restore the game screen
      if (room.status !== 'playing') {
        setScreen('lobby');
      }
    });

    s.on('room_updated', ({ players, status }) => {
      setRoom(prev => {
        if (!prev) return prev;
        const updated = { ...prev, players };
        if (status) updated.status = status;
        return updated;
      });
      if (status === 'lobby') {
        setScreen('lobby');
        setGameState(null);
        setMyHand([]);
        setGameResult(null);
      }
    });

    s.on('game_started', ({ gameState: gs }) => {
      setGameState(gs);
      setScreen('game');
    });

    s.on('deal_hand', ({ hand }) => {
      setMyHand(hand);
    });

    s.on('bidding_start', ({ biddingOrder, compulsoryPlayerId, currentBidderId, trumpSuit, cardsThisRound, currentRound, totalRounds, bids, forbiddenBid }) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          phase: 'bidding',
          trumpSuit,
          cardsThisRound,
          currentRound,
          totalRounds,
          bids: bids || {},
          currentBidderIndex: 0,
        };
      });
    });

    s.on('bid_placed', ({ playerId: pId, bid, bids, nextBidderId, forbiddenBid, biddingComplete }) => {
      setGameState(prev => {
        if (!prev) return prev;
        const nextBidderSeatIndex = nextBidderId
          ? prev.players.findIndex(p => p.id === nextBidderId)
          : prev.currentBidderIndex + 1;
        const nextBidderOrderIndex = prev.biddingOrder.findIndex(seatIdx => prev.players[seatIdx]?.id === nextBidderId);
        return {
          ...prev,
          bids,
          currentBidderIndex: biddingComplete ? prev.biddingOrder.length : (nextBidderOrderIndex >= 0 ? nextBidderOrderIndex : prev.currentBidderIndex + 1),
          phase: biddingComplete ? 'playing' : 'bidding',
        };
      });
    });

    s.on('playing_start', ({ bids, firstPlayerId }) => {
      setGameState(prev => {
        if (!prev) return prev;
        const firstPlayerIndex = prev.players.findIndex(p => p.id === firstPlayerId);
        return {
          ...prev,
          phase: 'playing',
          bids,
          currentTurnIndex: firstPlayerIndex,
          currentTrick: [],
          leadSuit: null,
        };
      });
    });

    s.on('card_played', ({ playerId: pId, card, currentTrick, nextPlayerId, trickComplete }) => {
      setGameState(prev => {
        if (!prev) return prev;
        const nextTurnIndex = nextPlayerId ? prev.players.findIndex(p => p.id === nextPlayerId) : prev.currentTurnIndex;
        const newLeadSuit = currentTrick.length === 1 ? currentTrick[0].card.suit : prev.leadSuit;
        return {
          ...prev,
          currentTrick,
          leadSuit: trickComplete ? prev.leadSuit : newLeadSuit,
          currentTurnIndex: nextTurnIndex,
          handSizes: {
            ...prev.handSizes,
            [pId]: Math.max(0, (prev.handSizes[pId] || 0) - 1),
          },
        };
      });
      // Update my hand
      setMyHand(prev => prev.filter(c => !(c.suit === card.suit && c.rank === card.rank)));
    });

    s.on('trick_complete', ({ tricksWon, nextLeaderId, currentTrick: cleared }) => {
      window.dispatchEvent(new CustomEvent('game-event', { detail: { type: 'trick_cleared' } }));
      setGameState(prev => {
        if (!prev) return prev;
        const nextLeaderIndex = prev.players.findIndex(p => p.id === nextLeaderId);
        return {
          ...prev,
          currentTrick: [],
          leadSuit: null,
          tricksWon,
          currentTurnIndex: nextLeaderIndex,
          trickLeaderIndex: nextLeaderIndex,
        };
      });
    });

    s.on('round_complete', ({ roundResult, scores, players, nextRound }) => {
      setGameState(prev => prev ? { ...prev, scores, tricksWon: roundResult.tricksWon } : prev);
      window.dispatchEvent(new CustomEvent('game-event', {
        detail: {
          type: 'round_complete',
          data: { roundResult, scores, nextRound },
        },
      }));

      // Auto-dismiss after 4s if next round is coming
      if (nextRound) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('game-event', { detail: { type: 'round_dismissed' } }));
        }, 4000);
      }
    });

    s.on('game_over', ({ scores, roundHistory, winners, players, reason }) => {
      clearSession();
      setGameResult({ scores, roundHistory, winners, players, reason });
      setScreen('result');
    });

    s.on('player_disconnected', ({ playerId: pId, playerName, newHostId }) => {
      if (newHostId) {
        setIsHost(s.id === newHostId);
        setRoom(prev => prev ? { ...prev, hostId: newHostId } : prev);
      }
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map(p => p.id === pId ? { ...p, isConnected: false } : p),
        };
      });
    });

    s.on('player_reconnected', ({ playerId: pId }) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map(p => p.id === pId ? { ...p, isConnected: true } : p),
        };
      });
    });

    s.on('error', ({ message }) => {
      console.error('Game error:', message);
      // If rejoin failed (room gone), clear stale session and drop to landing
      if (loadSession() && !roomCodeRef.current) {
        clearSession();
        roomCodeRef.current = null;
        playerNameRef.current = null;
        setScreen('landing');
      }
      showToast(message, 'error');
      // Let GameScreen know a play was rejected so it can release the card lock
      window.dispatchEvent(new CustomEvent('game-play-rejected'));
    });

    return () => {
      s.off('connect');
      s.off('room_joined');
      s.off('room_updated');
      s.off('game_started');
      s.off('deal_hand');
      s.off('bidding_start');
      s.off('bid_placed');
      s.off('playing_start');
      s.off('card_played');
      s.off('trick_complete');
      s.off('round_complete');
      s.off('game_over');
      s.off('player_disconnected');
      s.off('player_reconnected');
      s.off('error');
    };
  }, []);

  const [toast, setToast] = useState(null);
  function showToast(message, type = 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const handleJoined = ({ roomCode, playerName, isCreating }) => {
    playerNameRef.current = playerName;
    roomCodeRef.current = roomCode;
    const session = loadSession();
    const token = session?.roomCode === roomCode ? session?.token : null;
    getSocket().emit('join_room', { roomCode, playerName, isCreating, token });
  };

  const handleStart = () => {
    emit('start_game', { roomCode: roomCodeRef.current });
  };

  const handleSetBots = (count) => {
    emit('set_bots', { roomCode: roomCodeRef.current, count });
  };

  const handleLeave = () => {
    if (roomCodeRef.current) {
      emit('leave_room', { roomCode: roomCodeRef.current });
    }
    clearSession();
    roomCodeRef.current = null;
    playerNameRef.current = null;
    setRoom(null);
    setPlayerId(null);
    setGameState(null);
    setMyHand([]);
    setGameResult(null);
    setIsHost(false);
    setScreen('landing');
  };

  const handleRestart = () => {
    emit('restart_game', { roomCode: roomCodeRef.current });
  };

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      {screen === 'intro' && (
        <IntroScreen onPlay={() => setScreen('landing')} />
      )}

      {screen === 'landing' && (
        <LandingScreen onJoined={handleJoined} />
      )}

      {screen === 'lobby' && room && (
        <LobbyScreen
          room={room}
          playerId={playerId}
          isHost={isHost}
          onStart={handleStart}
          onSetBots={handleSetBots}
          onLeave={handleLeave}
        />
      )}

      {screen === 'game' && gameState && (
        <GameScreen
          gameState={gameState}
          myHand={myHand}
          playerId={playerId}
          roomCode={roomCodeRef.current}
          isHost={isHost}
          emit={emit}
        />
      )}

      {screen === 'result' && gameResult && (
        <ResultScreen
          scores={gameResult.scores}
          roundHistory={gameResult.roundHistory}
          winners={gameResult.winners}
          players={gameResult.players}
          isHost={isHost}
          onRestart={handleRestart}
          onLeave={handleLeave}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)',
          color: '#fff',
          padding: '8px 20px',
          borderRadius: 8,
          fontSize: '0.8rem',
          fontWeight: 600,
          zIndex: 9999,
          animation: 'fade-in 0.3s ease',
          maxWidth: 320,
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
