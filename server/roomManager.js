const rooms = new Map();
const ROOM_EXPIRY_MS = 45 * 60 * 1000; // 45 minutes
const ROOM_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const MAX_ROOMS = 3;

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createRoom(hostId, hostName, customCode) {
  if (rooms.size >= MAX_ROOMS) {
    return { error: 'Maximum room creation limit reached. Please try after sometime.' };
  }

  let roomCode = customCode || null;
  if (!roomCode) {
    do {
      roomCode = generateRoomCode();
    } while (rooms.has(roomCode));
  }

  const player = {
    id: hostId,
    name: hostName,
    seatIndex: 0,
    isConnected: true,
  };

  const room = {
    roomCode,
    hostId,
    players: [player],
    status: 'lobby',
    game: null,
    lastActivity: Date.now(),
  };

  rooms.set(roomCode, room);
  return room;
}

function joinRoom(roomCode, playerId, playerName) {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) return { error: 'Room not found' };
  if (room.status === 'playing') return { error: 'Game already in progress' };
  if (room.players.length >= 7) return { error: 'Room is full' };

  // Check if player is rejoining (same name reconnect attempt)
  const existingIndex = room.players.findIndex(p => p.name === playerName && !p.isConnected);
  if (existingIndex !== -1) {
    const oldId = room.players[existingIndex].id;
    room.players[existingIndex].id = playerId;
    room.players[existingIndex].isConnected = true;
    room.lastActivity = Date.now();

    // If this player was the host, update hostId to new socket ID
    if (room.hostId === oldId) {
      room.hostId = playerId;
    }

    // Update hands key in game state if game is running
    if (room.game && room.game.hands) {
      const oldId = room.game.players[existingIndex].id;
      if (oldId !== playerId) {
        room.game.players[existingIndex].id = playerId;
        room.game.hands[playerId] = room.game.hands[oldId];
        delete room.game.hands[oldId];
        room.game.bids[playerId] = room.game.bids[oldId];
        delete room.game.bids[oldId];
        room.game.tricksWon[playerId] = room.game.tricksWon[oldId];
        delete room.game.tricksWon[oldId];
        room.game.scores[playerId] = room.game.scores[oldId];
        delete room.game.scores[oldId];
      }
    }
    return { room, player: room.players[existingIndex], rejoined: true };
  }

  const player = {
    id: playerId,
    name: playerName,
    seatIndex: room.players.length,
    isConnected: true,
  };

  room.players.push(player);
  room.lastActivity = Date.now();
  return { room, player };
}

function getRoom(roomCode) {
  return rooms.get(roomCode?.toUpperCase()) || null;
}

function removePlayer(roomCode, playerId) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  room.players = room.players.filter(p => p.id !== playerId);
  room.lastActivity = Date.now();

  if (room.players.length === 0) {
    rooms.delete(roomCode);
    return null;
  }

  // Transfer host if needed
  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
  }

  return room;
}

function markDisconnected(roomCode, playerId) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.isConnected = false;
    room.lastActivity = Date.now();
  }

  // Transfer host if disconnected player was host
  if (room.hostId === playerId) {
    const nextConnected = room.players.find(p => p.isConnected && p.id !== playerId);
    if (nextConnected) {
      room.hostId = nextConnected.id;
    }
  }

  return room;
}

function roomExists(roomCode) {
  return rooms.has(roomCode?.toUpperCase());
}

function cleanupInactiveRooms() {
  const now = Date.now();
  for (const [roomCode, room] of rooms.entries()) {
    if (now - room.lastActivity >= ROOM_EXPIRY_MS) {
      rooms.delete(roomCode);
    }
  }
}

setInterval(cleanupInactiveRooms, ROOM_CLEANUP_INTERVAL_MS);

function deleteRoom(roomCode) {
  rooms.delete(roomCode);
}

function getRoomCount() {
  return rooms.size;
}

module.exports = { createRoom, joinRoom, getRoom, removePlayer, markDisconnected, roomExists, deleteRoom, getRoomCount, cleanupInactiveRooms };
