const express = require('express');
const { MAX_PLAYERS, MAX_ROOMS } = require('../config/appConfig');

function createRoomRouter(roomStore) {
  const router = express.Router();

  router.post('/room/create', (req, res) => {
    const { playerName } = req.body;
    if (!playerName || !playerName.trim()) {
      return res.status(400).json({ error: 'Player name required' });
    }
    if (roomStore.getRoomCount() >= MAX_ROOMS) {
      return res.status(503).json({ error: 'Maximum room creation limit reached. Please try after sometime.' });
    }

    const roomCode = generateAvailableRoomCode(roomStore);
    res.json({ roomCode });
  });

  router.get('/room/:code', (req, res) => {
    const room = roomStore.getRoom(req.params.code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status === 'playing') return res.status(400).json({ error: 'Game in progress' });
    if (room.players.length >= MAX_PLAYERS) return res.status(400).json({ error: 'Room full' });
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
