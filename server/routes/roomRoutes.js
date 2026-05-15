const express = require('express');
const { MAX_PLAYERS, MAX_ROOMS } = require('../config/appConfig');
const logger = require('../utils/logger');

function createRoomRouter(roomStore) {
  const router = express.Router();

  router.post('/room/create', (req, res) => {
    const { playerName } = req.body;
    if (!playerName || !playerName.trim()) {
      logger.warn('CREATE_ROOM_REJECTED', { reason: 'missing_player_name', ip: req.ip });
      return res.status(400).json({ error: 'Player name required' });
    }
    if (roomStore.getRoomCount() >= MAX_ROOMS) {
      logger.warn('ROOM_LIMIT_REACHED', { totalRooms: roomStore.getRoomCount(), playerName: playerName.trim() });
      return res.status(503).json({ error: 'Maximum room creation limit reached. Please try after sometime.' });
    }

    const roomCode = generateAvailableRoomCode(roomStore);
    logger.info('ROOM_CODE_GENERATED', { roomCode, playerName: playerName.trim() });
    res.json({ roomCode });
  });

  router.get('/room/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = roomStore.getRoom(code);
    if (!room) {
      logger.warn('JOIN_REJECTED', { roomCode: code, reason: 'room_not_found', ip: req.ip });
      return res.status(404).json({ error: 'Room not found' });
    }
    if (room.status === 'playing') {
      logger.warn('JOIN_REJECTED', { roomCode: code, reason: 'game_in_progress', ip: req.ip });
      return res.status(400).json({ error: 'Game in progress' });
    }
    if (room.players.length >= MAX_PLAYERS) {
      logger.warn('JOIN_REJECTED', { roomCode: code, reason: 'room_full', playerCount: room.players.length, ip: req.ip });
      return res.status(400).json({ error: 'Room full' });
    }
    return res.json({ roomCode: room.roomCode, playerCount: room.players.length });
  });

  return router;
}

function generateAvailableRoomCode(roomStore) {
  let roomCode;
  do {
    roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (roomStore.roomExists(roomCode));
  return roomCode;
}

module.exports = { createRoomRouter };
