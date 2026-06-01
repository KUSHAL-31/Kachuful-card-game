const {
  ACTIVE_DISCONNECT_GRACE_MS,
  LOBBY_DISCONNECT_GRACE_MS,
} = require('../config/appConfig');
const { serializePlayers, sanitizeRoom } = require('../serializers/playerSerializer');
const { getPublicGameState } = require('../serializers/gameSerializer');
const logger = require('../utils/logger');

const MAX_CHAT_MESSAGE_LENGTH = 200;

// Wraps a socket event handler so any unexpected throw is caught, logged, and
// reported back to the client rather than crashing the process.
function safeHandler(event, socketId, fn) {
  return (...args) => {
    try {
      fn(...args);
    } catch (err) {
      logger.error('SOCKET_HANDLER_ERROR', {
        event,
        socketId,
        error: err.message,
        stack: err.stack,
      });
    }
  };
}

const MAX_PLAYER_NAME_LENGTH = 20;
const RATE_LIMIT_WINDOW_MS = 2000;
const RATE_LIMIT_MAX_EVENTS = 10;

function makeRateLimiter() {
  let count = 0;
  let windowStart = Date.now();
  return function isAllowed() {
    const now = Date.now();
    if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
      count = 0;
      windowStart = now;
    }
    count++;
    return count <= RATE_LIMIT_MAX_EVENTS;
  };
}

function registerGameSocketHandlers({ io, roomStore, gameOrchestrator }) {
  const socketRoomMap = new Map();

  io.on('connection', (socket) => {
    logger.info('SOCKET_CONNECTED', { socketId: socket.id });
    const isRateLimited = makeRateLimiter();

    socket.on('join_room', safeHandler('join_room', socket.id, ({ roomCode, playerName, isCreating = false, token = null }) => {
      if (!isRateLimited()) return socket.emit('error', { message: 'Too many requests. Please slow down.' });
      if (!roomCode || !playerName) {
        logger.warn('JOIN_FAILED', { socketId: socket.id, reason: 'missing_room_code_or_player_name' });
        return socket.emit('error', { message: 'Room code and player name required' });
      }
      if (playerName.trim().length > MAX_PLAYER_NAME_LENGTH) {
        return socket.emit('error', { message: `Player name must be ${MAX_PLAYER_NAME_LENGTH} characters or fewer` });
      }

      const code = roomCode.toUpperCase().trim();
      const result = joinOrCreateRoom({ roomStore, code, socketId: socket.id, playerName, isCreating, token });
      if (result.error) {
        logger.warn('JOIN_FAILED', { roomCode: code, playerName: playerName.trim(), error: result.error });
        return socket.emit('error', { message: result.error });
      }

      const { room } = result;
      socket.join(code);
      socketRoomMap.set(socket.id, code);

      const humanPlayers = room.players.filter(p => !p.isBot);
      const botPlayers = room.players.filter(p => p.isBot);
      if (result.rejoined) {
        logger.info('PLAYER_REJOINED', {
          roomCode: code,
          playerName: playerName.trim(),
          playerId: socket.id,
          players: humanPlayers.map(p => p.name),
          botCount: botPlayers.length,
        });
      } else {
        logger.info('PLAYER_JOINED', {
          roomCode: code,
          playerName: playerName.trim(),
          playerId: socket.id,
          isHost: room.hostId === socket.id,
          players: humanPlayers.map(p => p.name),
          botCount: botPlayers.length,
        });
      }

      socket.emit('room_joined', {
        room: sanitizeRoom(room),
        playerId: socket.id,
        isHost: room.hostId === socket.id,
        token: result.token,
      });

      socket.to(code).emit('room_updated', {
        players: serializePlayers(room.players),
      });

      if (room.status === 'playing' && room.game) {
        gameOrchestrator.sendGameState(socket, room, socket.id);
        // Broadcast updated game state (with new player IDs) to everyone else in the room
        socket.to(code).emit('game_started', {
          gameState: getPublicGameState(room.game),
        });
        if (result.rejoined) {
          io.to(code).emit('player_reconnected', {
            oldPlayerId: result.oldId,
            playerId: socket.id,
          });
        }
      }
    }));

    socket.on('set_bots', safeHandler('set_bots', socket.id, ({ roomCode, count }) => {
      const room = roomStore.getRoom(roomCode);
      if (!room) return socket.emit('error', { message: 'Room not found' });
      if (room.hostId !== socket.id) return socket.emit('error', { message: 'Only host can change bots' });
      if (room.status !== 'lobby') return socket.emit('error', { message: 'Bots can only be changed in lobby' });

      const result = roomStore.setBotCount(roomCode, Number(count) || 0);
      if (result.error) return socket.emit('error', { message: result.error });

      logger.info('BOTS_SET', {
        roomCode,
        botCount: Number(count) || 0,
        setBy: room.players.find(p => p.id === socket.id)?.name,
      });

      io.to(roomCode).emit('room_updated', {
        players: serializePlayers(result.room.players),
        status: result.room.status,
      });
    }));

    socket.on('start_game', safeHandler('start_game', socket.id, ({ roomCode }) => {
      const room = roomStore.getRoom(roomCode);
      if (!room) return socket.emit('error', { message: 'Room not found' });
      if (room.hostId !== socket.id) return socket.emit('error', { message: 'Only host can start' });
      if (room.players.length < 2) return socket.emit('error', { message: 'Need at least 2 players' });
      if (room.status === 'playing') return socket.emit('error', { message: 'Game already started' });

      const humanNames = room.players.filter(p => !p.isBot).map(p => p.name);
      const botCount = room.players.filter(p => p.isBot).length;
      logger.info('GAME_STARTING', {
        roomCode,
        players: humanNames,
        botCount,
        totalPlayers: room.players.length,
        startedBy: room.players.find(p => p.id === socket.id)?.name,
      });

      gameOrchestrator.startGame(roomCode);
    }));

    socket.on('place_bid', safeHandler('place_bid', socket.id, ({ roomCode, bid }) => {
      if (!isRateLimited()) return socket.emit('error', { message: 'Too many requests. Please slow down.' });
      const room = roomStore.getRoom(roomCode);
      if (!room?.game) return socket.emit('error', { message: 'Game not found' });
      if (room.game.phase !== 'bidding') return socket.emit('error', { message: 'Not bidding phase' });

      const result = gameOrchestrator.handleBid(roomCode, socket.id, bid);
      if (result.error) {
        const playerName = room.game.players.find(p => p.id === socket.id)?.name;
        logger.warn('INVALID_BID', { roomCode, playerName, bid, error: result.error });
        return socket.emit('error', { message: result.error });
      }
    }));

    socket.on('play_card', safeHandler('play_card', socket.id, ({ roomCode, card }) => {
      if (!isRateLimited()) return socket.emit('error', { message: 'Too many requests. Please slow down.' });
      const room = roomStore.getRoom(roomCode);
      if (!room?.game) return socket.emit('error', { message: 'Game not found' });
      if (room.game.phase !== 'playing') return socket.emit('error', { message: 'Not playing phase' });

      const result = gameOrchestrator.handleCard(roomCode, socket.id, card);
      if (result.error) {
        const playerName = room.game.players.find(p => p.id === socket.id)?.name;
        logger.warn('INVALID_CARD', { roomCode, playerName, card, error: result.error });
        return socket.emit('error', { message: result.error });
      }
    }));

    socket.on('delete_room', safeHandler('delete_room', socket.id, ({ roomCode }) => {
      const room = roomStore.getRoom(roomCode);
      if (!room) return socket.emit('error', { message: 'Room not found' });
      if (room.hostId !== socket.id) return socket.emit('error', { message: 'Only host can delete the room' });

      logger.info('ROOM_DELETED_BY_HOST', {
        roomCode,
        hostName: room.players.find(p => p.id === socket.id)?.name,
        gameStatus: room.status,
      });

      io.to(roomCode).emit('game_over', {
        scores: room.game?.scores || {},
        roundHistory: room.game?.roundHistory || [],
        winners: [],
        players: room.game?.players || room.players || [],
        reason: 'Host ended the game',
      });
      roomStore.deleteRoom(roomCode);
    }));

    socket.on('restart_game', safeHandler('restart_game', socket.id, ({ roomCode }) => {
      const room = roomStore.getRoom(roomCode);
      if (!room) return socket.emit('error', { message: 'Room not found' });
      if (room.hostId !== socket.id) return socket.emit('error', { message: 'Only host can restart' });

      logger.info('PLAY_AGAIN', {
        roomCode,
        requestedBy: room.players.find(p => p.id === socket.id)?.name,
        players: room.players.filter(p => !p.isBot).map(p => p.name),
      });

      room.status = 'lobby';
      room.game = null;
      roomStore.touchRoom(room);

      io.to(roomCode).emit('room_updated', {
        players: serializePlayers(room.players),
        status: 'lobby',
      });
    }));

    socket.on('send_message', safeHandler('send_message', socket.id, ({ roomCode, text }) => {
      if (!isRateLimited()) return socket.emit('error', { message: 'Too many requests. Please slow down.' });
      const room = roomStore.getRoom(roomCode);
      if (!room) return socket.emit('error', { message: 'Room not found' });

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return socket.emit('error', { message: 'Player not found' });

      const trimmed = String(text || '').trim().slice(0, MAX_CHAT_MESSAGE_LENGTH);
      if (!trimmed) return;

      const message = {
        id: `${socket.id}-${Date.now()}`,
        senderId: socket.id,
        senderName: player.name,
        text: trimmed,
        timestamp: Date.now(),
      };

      roomStore.addChatMessage(roomCode, message);
      io.to(roomCode).emit('chat_message', message);
    }));

    socket.on('leave_room', safeHandler('leave_room', socket.id, ({ roomCode }) => {
      handleLeave({ socket, io, roomStore, gameOrchestrator, socketRoomMap, roomCode, explicit: true });
    }));

    socket.on('disconnect', safeHandler('disconnect', socket.id, () => {
      const roomCode = socketRoomMap.get(socket.id);
      if (roomCode) {
        handleLeave({ socket, io, roomStore, gameOrchestrator, socketRoomMap, roomCode, explicit: false });
      }
      logger.info('SOCKET_DISCONNECTED', { socketId: socket.id, roomCode: roomCode || null });
    }));
  });
}

function joinOrCreateRoom({ roomStore, code, socketId, playerName, isCreating, token }) {
  if (!roomStore.roomExists(code)) {
    if (!isCreating) {
      return { error: 'Room not found. Ask the host to create a new room.' };
    }
    const created = roomStore.createRoom(socketId, playerName.trim(), code);
    if (created.error) return created;
    // token for the host is on their player object
    const hostToken = created.players[0].token;
    return { room: created, token: hostToken };
  }

  const result = roomStore.joinRoom(code, socketId, playerName.trim(), token);
  if (result.error) return result;
  return { room: result.room, rejoined: result.rejoined, oldId: result.oldId, token: result.token };
}

function handleLeave({ socket, io, roomStore, gameOrchestrator, socketRoomMap, roomCode, explicit }) {
  socketRoomMap.delete(socket.id);

  const room = roomStore.getRoom(roomCode);
  if (!room) return;

  const player = room.players.find(p => p.id === socket.id);
  if (!player) return;

  if (explicit) {
    logger.info('PLAYER_LEFT', {
      roomCode,
      playerName: player.name,
      playerId: socket.id,
      gameStatus: room.status,
      remainingPlayers: room.players.filter(p => p.id !== socket.id && !p.isBot).map(p => p.name),
    });

    const hostBefore = room.hostId;
    roomStore.removePlayer(roomCode, socket.id);
    socket.leave(roomCode);
    if (roomStore.deleteRoomIfNoConnectedHumans(roomCode)) return;

    const updatedRoom = roomStore.getRoom(roomCode);
    if (updatedRoom && updatedRoom.hostId !== hostBefore) {
      const newHost = updatedRoom.players.find(p => p.id === updatedRoom.hostId);
      logger.info('HOST_TRANSFERRED', {
        roomCode,
        fromName: player.name,
        toName: newHost?.name,
        reason: 'player_left',
      });
    }

    io.to(roomCode).emit('room_updated', {
      players: serializePlayers(updatedRoom?.players || []),
    });
    return;
  }

  if (room.status === 'lobby') {
    logger.warn('PLAYER_DISCONNECTED_LOBBY', {
      roomCode,
      playerName: player.name,
      playerId: socket.id,
    });

    roomStore.markDisconnected(roomCode, socket.id);
    scheduleDeleteIfNoConnectedHumans({ roomStore, roomCode, delayMs: LOBBY_DISCONNECT_GRACE_MS });

    io.to(roomCode).emit('room_updated', {
      players: serializePlayers(room.players),
    });
    setTimeout(() => removeDisconnectedLobbyPlayer({ io, roomStore, roomCode, playerId: socket.id }), LOBBY_DISCONNECT_GRACE_MS);
    return;
  }

  logger.warn('PLAYER_DISCONNECTED_INGAME', {
    roomCode,
    playerName: player.name,
    playerId: socket.id,
    round: room.game?.currentRound ?? null,
  });

  const hostBefore = room.hostId;
  roomStore.markDisconnected(roomCode, socket.id);
  scheduleDeleteIfNoConnectedHumans({ roomStore, roomCode, delayMs: ACTIVE_DISCONNECT_GRACE_MS });

  if (room.hostId !== hostBefore) {
    const newHost = room.players.find(p => p.id === room.hostId);
    logger.info('HOST_TRANSFERRED', {
      roomCode,
      fromName: player.name,
      toName: newHost?.name,
      reason: 'player_disconnected',
    });
  }

  io.to(roomCode).emit('player_disconnected', {
    playerId: socket.id,
    playerName: player.name,
    newHostId: room.hostId,
  });
  const connectedParticipantCount = room.players.filter(p => p.isConnected).length;
  if (connectedParticipantCount <= 1 && room.status === 'playing') {
    logger.warn('GAME_ABORTED', {
      roomCode,
      reason: 'Not enough players connected',
      round: room.game?.currentRound ?? null,
      durationMs: room.game?.startedAt ? Date.now() - room.game.startedAt : null,
    });

    room.status = 'finished';
    io.to(roomCode).emit('game_over', {
      scores: room.game?.scores || {},
      roundHistory: room.game?.roundHistory || [],
      winners: [],
      players: room.game?.players || [],
      reason: 'Not enough players',
    });
    gameOrchestrator.compactFinishedGame(room);
    gameOrchestrator.scheduleFinishedRoomCleanup(roomCode);
  }
}

function removeDisconnectedLobbyPlayer({ io, roomStore, roomCode, playerId }) {
  const room = roomStore.getRoom(roomCode);
  if (!room) return;

  const player = room.players.find(p => p.id === playerId);
  if (!player || player.isConnected) return;

  logger.info('PLAYER_REMOVED_AFTER_GRACE', {
    roomCode,
    playerName: player.name,
  });

  roomStore.removePlayer(roomCode, playerId);
  if (roomStore.deleteRoomIfNoConnectedHumans(roomCode)) return;

  io.to(roomCode).emit('room_updated', {
    players: serializePlayers(roomStore.getRoom(roomCode)?.players || []),
  });
}

function scheduleDeleteIfNoConnectedHumans({ roomStore, roomCode, delayMs }) {
  setTimeout(() => {
    roomStore.deleteRoomIfNoConnectedHumans(roomCode);
  }, delayMs);
}

module.exports = { registerGameSocketHandlers };
