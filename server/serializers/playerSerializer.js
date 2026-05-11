function serializePlayers(players = []) {
  return players.map(player => ({
    id: player.id,
    name: player.name,
    seatIndex: player.seatIndex,
    isConnected: player.isConnected,
    isBot: !!player.isBot,
  }));
}

function sanitizeRoom(room) {
  return {
    roomCode: room.roomCode,
    hostId: room.hostId,
    players: serializePlayers(room.players),
    status: room.status,
  };
}

module.exports = { serializePlayers, sanitizeRoom };
