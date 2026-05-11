const {
  ACTIVE_DISCONNECT_GRACE_MS,
  LOBBY_DISCONNECT_GRACE_MS,
} = require('../config/appConfig');
const { serializePlayers, sanitizeRoom } = require('../serializers/playerSerializer');
const { getPublicGameState } = require('../serializers/gameSerializer');

function registerGameSocketHandlers({ io, roomStore, gameOrchestrator }) {
  const socketRoomMap = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_room', ({ roomCode, playerName, isCreating = false }) => {
      if (!roomCode || !playerName) {
        return socket.emit('error', { message: 'Room code and player name required' });
      }

      const code = roomCode.toUpperCase().trim();
      const result = joinOrCreateRoom({ roomStore, code, socketId: socket.id, playerName, isCreating });
      if (result.error) return socket.emit('error', { message: result.error });

      const { room } = result;
      socket.join(code);
      socketRoomMap.set(socket.id, code);

      socket.emit('room_joined', {
        room: sanitizeRoom(room),
        playerId: socket.id,
        isHost: room.hostId === socket.id,
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
    });

    socket.on('set_bots', ({ roomCode, count }) => {
      const room = roomStore.getRoom(roomCode);
      if (!room) return socket.emit('error', { message: 'Room not found' });
      if (room.hostId !== socket.id) return socket.emit('error', { message: 'Only host can change bots' });
      if (room.status !== 'lobby') return socket.emit('error', { message: 'Bots can only be changed in lobby' });

      const result = roomStore.setBotCount(roomCode, Number(count) || 0);
      if (result.error) return socket.emit('error', { message: result.error });

      io.to(roomCode).emit('room_updated', {
        players: serializePlayers(result.room.players),
        status: result.room.status,
      });
    });

    socket.on('start_game', ({ roomCode }) => {
      const room = roomStore.getRoom(roomCode);
      if (!room) return socket.emit('error', { message: 'Room not found' });
      if (room.hostId !== socket.id) return socket.emit('error', { message: 'Only host can start' });
      if (room.players.length < 2) return socket.emit('error', { message: 'Need at least 2 players' });
      if (room.status === 'playing') return socket.emit('error', { message: 'Game already started' });

      gameOrchestrator.startGame(roomCode);
    });

    socket.on('place_bid', ({ roomCode, bid }) => {
      const room = roomStore.getRoom(roomCode);
      if (!room?.game) return socket.emit('error', { message: 'Game not found' });
      if (room.game.phase !== 'bidding') return socket.emit('error', { message: 'Not bidding phase' });

      const result = gameOrchestrator.handleBid(roomCode, socket.id, bid);
      if (result.error) return socket.emit('error', { message: result.error });
    });

    socket.on('play_card', ({ roomCode, card }) => {
      const room = roomStore.getRoom(roomCode);
      if (!room?.game) return socket.emit('error', { message: 'Game not found' });
      if (room.game.phase !== 'playing') return socket.emit('error', { message: 'Not playing phase' });

      const result = gameOrchestrator.handleCard(roomCode, socket.id, card);
      if (result.error) return socket.emit('error', { message: result.error });
    });

    socket.on('restart_game', ({ roomCode }) => {
      const room = roomStore.getRoom(roomCode);
      if (!room) return socket.emit('error', { message: 'Room not found' });
      if (room.hostId !== socket.id) return socket.emit('error', { message: 'Only host can restart' });

      room.status = 'lobby';
      room.game = null;
      roomStore.touchRoom(room);

      io.to(roomCode).emit('room_updated', {
        players: serializePlayers(room.players),
        status: 'lobby',
      });
    });

    socket.on('leave_room', ({ roomCode }) => {
      handleLeave({ socket, io, roomStore, gameOrchestrator, socketRoomMap, roomCode, explicit: true });
    });

    socket.on('disconnect', () => {
      const roomCode = socketRoomMap.get(socket.id);
      if (roomCode) {
        handleLeave({ socket, io, roomStore, gameOrchestrator, socketRoomMap, roomCode, explicit: false });
      }
      console.log('Client disconnected:', socket.id);
    });
  });
}

function joinOrCreateRoom({ roomStore, code, socketId, playerName, isCreating }) {
  if (!roomStore.roomExists(code)) {
    if (!isCreating) {
      return { error: 'Room not found. Ask the host to create a new room.' };
    }
    const created = roomStore.createRoom(socketId, playerName.trim(), code);
    if (created.error) return created;
    return { room: created };
  }

  const result = roomStore.joinRoom(code, socketId, playerName.trim());
  if (result.error) return result;
  return { room: result.room, rejoined: result.rejoined, oldId: result.oldId };
}

function handleLeave({ socket, io, roomStore, gameOrchestrator, socketRoomMap, roomCode, explicit }) {
  socketRoomMap.delete(socket.id);

  const room = roomStore.getRoom(roomCode);
  if (!room) return;

  const player = room.players.find(p => p.id === socket.id);
  if (!player) return;

  if (explicit) {
    roomStore.removePlayer(roomCode, socket.id);
    socket.leave(roomCode);
    if (roomStore.deleteRoomIfNoConnectedHumans(roomCode)) return;

    io.to(roomCode).emit('room_updated', {
      players: serializePlayers(roomStore.getRoom(roomCode)?.players || []),
    });
    return;
  }

  if (room.status === 'lobby') {
    roomStore.markDisconnected(roomCode, socket.id);
    scheduleDeleteIfNoConnectedHumans({ roomStore, roomCode, delayMs: LOBBY_DISCONNECT_GRACE_MS });

    io.to(roomCode).emit('room_updated', {
      players: serializePlayers(room.players),
    });
    setTimeout(() => removeDisconnectedLobbyPlayer({ io, roomStore, roomCode, playerId: socket.id }), LOBBY_DISCONNECT_GRACE_MS);
    return;
  }

  roomStore.markDisconnected(roomCode, socket.id);
  scheduleDeleteIfNoConnectedHumans({ roomStore, roomCode, delayMs: ACTIVE_DISCONNECT_GRACE_MS });

  io.to(roomCode).emit('player_disconnected', {
    playerId: socket.id,
    playerName: player.name,
    newHostId: room.hostId,
  });
  const connectedParticipantCount = room.players.filter(p => p.isConnected).length;
  if (connectedParticipantCount <= 1 && room.status === 'playing') {
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
