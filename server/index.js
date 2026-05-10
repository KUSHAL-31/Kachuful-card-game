require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const { createRoom, joinRoom, getRoom, removePlayer, markDisconnected, roomExists } = require('./roomManager');
const { initGame, startRound, placeBid, playCard, getForbiddenBid, getWinners } = require('./gameEngine');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// REST endpoints
app.post('/room/create', (req, res) => {
  const { playerName } = req.body;
  if (!playerName || !playerName.trim()) {
    return res.status(400).json({ error: 'Player name required' });
  }
  // We create the room with a placeholder ID — real ID comes from socket
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  res.json({ roomCode });
});

app.get('/room/:code', (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.status === 'playing') return res.status(400).json({ error: 'Game in progress' });
  if (room.players.length >= 7) return res.status(400).json({ error: 'Room full' });
  res.json({ roomCode: room.roomCode, playerCount: room.players.length });
});

// Map of socketId → roomCode for cleanup on disconnect
const socketRoomMap = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_room', ({ roomCode, playerName, isCreating = false }) => {
    if (!roomCode || !playerName) {
      return socket.emit('error', { message: 'Room code and player name required' });
    }

    const code = roomCode.toUpperCase().trim();
    let room;

    if (!roomExists(code)) {
      if (!isCreating) {
        return socket.emit('error', { message: 'Room not found. Ask the host to create a new room.' });
      }
      room = createRoom(socket.id, playerName.trim(), code);
    } else {
      const result = joinRoom(code, socket.id, playerName.trim());
      if (result.error) {
        return socket.emit('error', { message: result.error });
      }
      room = result.room;
    }

    socket.join(code);
    socketRoomMap.set(socket.id, code);

    const player = room.players.find(p => p.id === socket.id);

    socket.emit('room_joined', {
      room: sanitizeRoom(room),
      playerId: socket.id,
      isHost: room.hostId === socket.id,
    });

    socket.to(code).emit('room_updated', {
      players: room.players.map(p => ({ id: p.id, name: p.name, seatIndex: p.seatIndex, isConnected: p.isConnected })),
    });

    // If rejoining during a game, send full game state
    if (room.status === 'playing' && room.game) {
      sendGameState(socket, room, socket.id);
    }
  });

  socket.on('start_game', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Room not found' });
    if (room.hostId !== socket.id) return socket.emit('error', { message: 'Only host can start' });
    if (room.players.length < 2) return socket.emit('error', { message: 'Need at least 2 players' });
    if (room.status === 'playing') return socket.emit('error', { message: 'Game already started' });

    room.status = 'playing';
    room.game = initGame(room.players.map(p => ({ id: p.id, name: p.name, seatIndex: p.seatIndex })));
    room.game = startRound(room.game);

    // Send public game state to all
    io.to(roomCode).emit('game_started', { gameState: getPublicGameState(room.game) });

    // Send each player's private hand
    room.game.players.forEach(player => {
      const playerSocket = io.sockets.sockets.get(player.id);
      if (playerSocket) {
        playerSocket.emit('deal_hand', { hand: room.game.hands[player.id] });
      }
    });

    const firstBidderSeatIndex = room.game.biddingOrder[0];
    const firstBidder = room.game.players[firstBidderSeatIndex];
    const compulsoryPlayer = room.game.players[room.game.compulsoryPlayerIndex];

    io.to(roomCode).emit('bidding_start', {
      biddingOrder: room.game.biddingOrder.map(i => room.game.players[i].id),
      compulsoryPlayerId: compulsoryPlayer.id,
      currentBidderId: firstBidder.id,
      trumpSuit: room.game.trumpSuit,
      cardsThisRound: room.game.cardsThisRound,
      currentRound: room.game.currentRound,
      totalRounds: room.game.totalRounds,
      forbiddenBid: null,
    });
  });

  socket.on('place_bid', ({ roomCode, bid }) => {
    const room = getRoom(roomCode);
    if (!room || !room.game) return socket.emit('error', { message: 'Game not found' });
    if (room.game.phase !== 'bidding') return socket.emit('error', { message: 'Not bidding phase' });

    const result = placeBid(room.game, socket.id, bid);
    if (result.error) return socket.emit('error', { message: result.error });

    room.game = result.state;

    io.to(roomCode).emit('bid_placed', {
      playerId: socket.id,
      bid,
      bids: room.game.bids,
      nextBidderId: result.nextBidderId,
      forbiddenBid: result.forbiddenBid,
      biddingComplete: result.biddingComplete,
    });

    if (result.biddingComplete) {
      const firstPlayerId = room.game.players[room.game.trickLeaderIndex].id;
      io.to(roomCode).emit('playing_start', {
        bids: room.game.bids,
        firstPlayerId,
        currentRound: room.game.currentRound,
        trumpSuit: room.game.trumpSuit,
      });
    }
  });

  socket.on('play_card', ({ roomCode, card }) => {
    const room = getRoom(roomCode);
    if (!room || !room.game) return socket.emit('error', { message: 'Game not found' });
    if (room.game.phase !== 'playing') return socket.emit('error', { message: 'Not playing phase' });

    const result = playCard(room.game, socket.id, card);
    if (result.error) return socket.emit('error', { message: result.error });

    room.game = result.state;

    io.to(roomCode).emit('card_played', {
      playerId: socket.id,
      card,
      currentTrick: room.game.currentTrick,
      nextPlayerId: result.nextPlayerId || null,
      trickComplete: result.trickComplete,
    });

    if (result.trickComplete) {
      if (result.roundOver) {
        const winners = getWinners(room.game.scores);

        setTimeout(() => {
          io.to(roomCode).emit('round_complete', {
            roundResult: result.roundResult,
            scores: room.game.scores,
            players: room.game.players,
            nextRound: result.isLastRound ? null : room.game.currentRound + 1,
          });

          if (result.isLastRound) {
            room.status = 'finished';
            io.to(roomCode).emit('game_over', {
              scores: room.game.scores,
              roundHistory: room.game.roundHistory,
              winners,
              players: room.game.players,
            });
          } else {
            setTimeout(() => {
              room.game = startRound(room.game);

              io.to(roomCode).emit('game_started', { gameState: getPublicGameState(room.game) });

              room.game.players.forEach(player => {
                const playerSocket = io.sockets.sockets.get(player.id);
                if (playerSocket) {
                  playerSocket.emit('deal_hand', { hand: room.game.hands[player.id] });
                }
              });

              const firstBidderSeatIndex = room.game.biddingOrder[0];
              const firstBidder = room.game.players[firstBidderSeatIndex];
              const compulsoryPlayer = room.game.players[room.game.compulsoryPlayerIndex];

              io.to(roomCode).emit('bidding_start', {
                biddingOrder: room.game.biddingOrder.map(i => room.game.players[i].id),
                compulsoryPlayerId: compulsoryPlayer.id,
                currentBidderId: firstBidder.id,
                trumpSuit: room.game.trumpSuit,
                cardsThisRound: room.game.cardsThisRound,
                currentRound: room.game.currentRound,
                totalRounds: room.game.totalRounds,
                forbiddenBid: null,
              });
            }, 4000); // 4s to read round summary then next round starts
          }
        }, 1500); // 1.5s to see trick winner before clearing
      } else {
        // Trick done but round continues — clear trick after display delay
        setTimeout(() => {
          // Clear trick in server state
          room.game = {
            ...room.game,
            currentTrick: [],
            leadSuit: null,
          };
          io.to(roomCode).emit('trick_complete', {
            winnerId: result.winnerId,
            tricksWon: room.game.tricksWon,
            nextLeaderId: result.nextLeaderId,
            currentTrick: [],
          });
        }, 1500);
      }
    }
  });

  socket.on('restart_game', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Room not found' });
    if (room.hostId !== socket.id) return socket.emit('error', { message: 'Only host can restart' });

    room.status = 'lobby';
    room.game = null;

    io.to(roomCode).emit('room_updated', {
      players: room.players.map(p => ({ id: p.id, name: p.name, seatIndex: p.seatIndex, isConnected: p.isConnected })),
      status: 'lobby',
    });
  });

  socket.on('leave_room', ({ roomCode }) => {
    handleLeave(socket, roomCode, true);
  });

  socket.on('disconnect', () => {
    const roomCode = socketRoomMap.get(socket.id);
    if (roomCode) {
      handleLeave(socket, roomCode, false);
    }
    console.log('Client disconnected:', socket.id);
  });
});

function handleLeave(socket, roomCode, explicit) {
  const room = getRoom(roomCode);
  if (!room) return;

  const player = room.players.find(p => p.id === socket.id);
  if (!player) return;

  socketRoomMap.delete(socket.id);

  if (explicit || room.status === 'lobby') {
    removePlayer(roomCode, socket.id);
    socket.leave(roomCode);
    io.to(roomCode).emit('room_updated', {
      players: (getRoom(roomCode)?.players || []).map(p => ({
        id: p.id, name: p.name, seatIndex: p.seatIndex, isConnected: p.isConnected,
      })),
    });
  } else {
    // Mid-game disconnect — mark disconnected, wait for reconnect
    markDisconnected(roomCode, socket.id);
    io.to(roomCode).emit('player_disconnected', {
      playerId: socket.id,
      playerName: player.name,
      newHostId: room.hostId,
    });

    // Check if only 1 player remains connected
    const connectedCount = room.players.filter(p => p.isConnected).length;
    if (connectedCount <= 1 && room.status === 'playing') {
      room.status = 'finished';
      io.to(roomCode).emit('game_over', {
        scores: room.game?.scores || {},
        roundHistory: room.game?.roundHistory || [],
        winners: [],
        players: room.game?.players || [],
        reason: 'Not enough players',
      });
    }
  }
}

function sendGameState(socket, room, playerId) {
  socket.emit('game_started', { gameState: getPublicGameState(room.game) });
  socket.emit('deal_hand', { hand: room.game.hands[playerId] || [] });

  if (room.game.phase === 'bidding') {
    const compulsoryPlayer = room.game.players[room.game.compulsoryPlayerIndex];
    const currentBidderSeatIndex = room.game.biddingOrder[room.game.currentBidderIndex];
    const currentBidder = room.game.players[currentBidderSeatIndex];
    socket.emit('bidding_start', {
      biddingOrder: room.game.biddingOrder.map(i => room.game.players[i].id),
      compulsoryPlayerId: compulsoryPlayer.id,
      currentBidderId: currentBidder.id,
      trumpSuit: room.game.trumpSuit,
      cardsThisRound: room.game.cardsThisRound,
      currentRound: room.game.currentRound,
      totalRounds: room.game.totalRounds,
      bids: room.game.bids,
    });
  } else if (room.game.phase === 'playing') {
    const currentPlayer = room.game.players[room.game.currentTurnIndex];
    socket.emit('playing_start', {
      bids: room.game.bids,
      firstPlayerId: currentPlayer.id,
      currentRound: room.game.currentRound,
      trumpSuit: room.game.trumpSuit,
    });
  }
}

function getPublicGameState(game) {
  return {
    players: game.players,
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
      game.players.map(p => [p.id, (game.hands[p.id] || []).length])
    ),
    biddingOrder: game.biddingOrder,
    currentBidderIndex: game.currentBidderIndex,
  };
}

function sanitizeRoom(room) {
  return {
    roomCode: room.roomCode,
    hostId: room.hostId,
    players: room.players.map(p => ({ id: p.id, name: p.name, seatIndex: p.seatIndex, isConnected: p.isConnected })),
    status: room.status,
  };
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Kachuful server running on port ${PORT}`);
});
