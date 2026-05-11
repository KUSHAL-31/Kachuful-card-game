const {
  MAX_PLAYERS,
  MAX_ROOMS,
  ROOM_CLEANUP_INTERVAL_MS,
  ROOM_EXPIRY_MS,
} = require('../config/appConfig');

const rooms = new Map();
const BOT_NAMES = [
  'Astra', 'Blitz', 'Cipher', 'Dynamo', 'Echo', 'Fable', 'Nexus',
  'Orion', 'Pixel', 'Quest', 'Raven', 'Sage', 'Titan', 'Vega',
];

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

  const room = {
    roomCode,
    hostId,
    players: [{
      id: hostId,
      name: hostName,
      seatIndex: 0,
      isConnected: true,
    }],
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
  if (room.players.length >= MAX_PLAYERS) return { error: 'Room is full' };

  const existingIndex = room.players.findIndex(player => player.name === playerName && !player.isConnected);
  if (existingIndex !== -1) {
    reconnectPlayer(room, existingIndex, playerId);
    return { room, player: room.players[existingIndex], rejoined: true };
  }

  const player = {
    id: playerId,
    name: playerName,
    seatIndex: room.players.length,
    isConnected: true,
  };

  room.players.push(player);
  touchRoom(room);
  return { room, player };
}

function setBotCount(roomCode, count) {
  const room = getRoom(roomCode);
  if (!room) return { error: 'Room not found' };
  if (room.status !== 'lobby') return { error: 'Bots can only be changed in lobby' };

  const humans = room.players.filter(player => !player.isBot);
  const safeCount = Math.max(0, Math.min(count, MAX_PLAYERS - humans.length));
  const existingBots = room.players.filter(player => player.isBot);
  const bots = existingBots.slice(0, safeCount);

  for (let i = bots.length; i < safeCount; i++) {
    bots.push(createBotPlayer(room.roomCode, i, [...humans, ...bots]));
  }

  room.players = reseatPlayers([...humans, ...bots]);
  touchRoom(room);
  return { room };
}

function getRoom(roomCode) {
  return rooms.get(roomCode?.toUpperCase()) || null;
}

function removePlayer(roomCode, playerId) {
  const room = getRoom(roomCode);
  if (!room) return null;

  room.players = reseatPlayers(room.players.filter(player => player.id !== playerId));
  touchRoom(room);

  if (room.players.length === 0) {
    rooms.delete(room.roomCode);
    return null;
  }

  if (room.hostId === playerId) {
    const nextHuman = room.players.find(player => !player.isBot);
    if (!nextHuman) {
      rooms.delete(room.roomCode);
      return null;
    }
    room.hostId = nextHuman.id;
  }

  return room;
}

function markDisconnected(roomCode, playerId) {
  const room = getRoom(roomCode);
  if (!room) return null;

  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.isConnected = false;
    touchRoom(room);
  }

  if (room.hostId === playerId) {
    const nextConnectedHuman = room.players.find(p => p.isConnected && !p.isBot && p.id !== playerId);
    if (nextConnectedHuman) {
      room.hostId = nextConnectedHuman.id;
    }
  }

  return room;
}

function reconnectPlayer(room, existingIndex, playerId) {
  const player = room.players[existingIndex];
  const oldId = player.id;
  player.id = playerId;
  player.isConnected = true;
  touchRoom(room);

  if (room.hostId === oldId) {
    room.hostId = playerId;
  }

  if (room.game?.hands) {
    const gamePlayer = room.game.players[existingIndex];
    if (gamePlayer?.id !== playerId) {
      gamePlayer.id = playerId;
      movePlayerKey(room.game.hands, oldId, playerId);
      movePlayerKey(room.game.bids, oldId, playerId);
      movePlayerKey(room.game.tricksWon, oldId, playerId);
      movePlayerKey(room.game.scores, oldId, playerId);
    }
  }
}

function movePlayerKey(container, oldId, newId) {
  if (!container || !(oldId in container)) return;
  container[newId] = container[oldId];
  delete container[oldId];
}

function roomExists(roomCode) {
  return rooms.has(roomCode?.toUpperCase());
}

function deleteRoom(roomCode) {
  rooms.delete(roomCode?.toUpperCase());
}

function getRoomCount() {
  return rooms.size;
}

function touchRoom(room) {
  room.lastActivity = Date.now();
}

function cleanupInactiveRooms() {
  const now = Date.now();
  for (const [roomCode, room] of rooms.entries()) {
    if (now - room.lastActivity >= ROOM_EXPIRY_MS) {
      rooms.delete(roomCode);
    }
  }
}

function reseatPlayers(players) {
  return players.map((player, seatIndex) => ({ ...player, seatIndex }));
}

function createBotPlayer(roomCode, index, existingPlayers) {
  const usedNames = new Set(existingPlayers.map(player => player.name));
  const availableNames = BOT_NAMES.filter(name => !usedNames.has(name));
  const name = availableNames.length > 0
    ? availableNames[Math.floor(Math.random() * availableNames.length)]
    : `Bot ${index + 1}`;

  return {
    id: `bot_${roomCode}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    seatIndex: existingPlayers.length,
    isConnected: true,
    isBot: true,
  };
}

const cleanupInterval = setInterval(cleanupInactiveRooms, ROOM_CLEANUP_INTERVAL_MS);
cleanupInterval.unref?.();

module.exports = {
  createRoom,
  joinRoom,
  getRoom,
  removePlayer,
  markDisconnected,
  roomExists,
  deleteRoom,
  getRoomCount,
  cleanupInactiveRooms,
  setBotCount,
  touchRoom,
};
