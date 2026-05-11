const {
  BOT_ACTION_DELAY_MAX_MS,
  BOT_ACTION_DELAY_MIN_MS,
  FINISHED_ROOM_CLEANUP_MS,
} = require('../config/appConfig');
const { initGame, startRound, placeBid, playCard, getWinners } = require('../gameEngine');
const { chooseBotBid, chooseBotCard } = require('../botEngine');
const { getPublicGameState } = require('../serializers/gameSerializer');

class GameOrchestrator {
  constructor({ io, roomStore }) {
    this.io = io;
    this.roomStore = roomStore;
  }

  startGame(roomCode) {
    const room = this.roomStore.getRoom(roomCode);
    room.status = 'playing';
    this.roomStore.touchRoom(room);
    room.game = initGame(room.players.map(player => ({
      id: player.id,
      name: player.name,
      seatIndex: player.seatIndex,
      isBot: !!player.isBot,
      isConnected: player.isConnected !== false,
    })));
    room.game = startRound(room.game);

    this.emitRoundStart(roomCode, room);
  }

  handleBid(roomCode, playerId, bid) {
    const room = this.roomStore.getRoom(roomCode);
    const result = placeBid(room.game, playerId, bid);
    if (result.error) return result;

    this.applyBidResult(roomCode, room, playerId, bid, result);
    this.scheduleBotTurn(roomCode);
    return { ok: true };
  }

  handleCard(roomCode, playerId, card) {
    const room = this.roomStore.getRoom(roomCode);
    const result = playCard(room.game, playerId, card);
    if (result.error) return result;

    this.applyCardResult(roomCode, room, playerId, card, result);
    return { ok: true };
  }

  emitRoundStart(roomCode, room) {
    this.io.to(roomCode).emit('game_started', { gameState: getPublicGameState(room.game) });

    room.game.players.forEach(player => {
      if (player.isBot) return;
      const playerSocket = this.io.sockets.sockets.get(player.id);
      if (playerSocket) {
        playerSocket.emit('deal_hand', { hand: room.game.hands[player.id] });
      }
    });

    const firstBidderSeatIndex = room.game.biddingOrder[0];
    const firstBidder = room.game.players[firstBidderSeatIndex];
    const compulsoryPlayer = room.game.players[room.game.compulsoryPlayerIndex];

    this.io.to(roomCode).emit('bidding_start', {
      biddingOrder: room.game.biddingOrder.map(i => room.game.players[i].id),
      compulsoryPlayerId: compulsoryPlayer.id,
      currentBidderId: firstBidder.id,
      trumpSuit: room.game.trumpSuit,
      cardsThisRound: room.game.cardsThisRound,
      currentRound: room.game.currentRound,
      totalRounds: room.game.totalRounds,
      forbiddenBid: null,
    });

    // Only kick off the bot chain here if the first bidder is a bot.
    // If a human bids first, handleBid will start the chain — preventing
    // duplicate parallel chains that accumulate over multiple rounds.
    if (firstBidder?.isBot) {
      this.scheduleBotTurn(roomCode);
    }
  }

  applyBidResult(roomCode, room, playerId, bid, result) {
    this.roomStore.touchRoom(room);
    room.game = result.state;

    this.io.to(roomCode).emit('bid_placed', {
      playerId,
      bid,
      bids: room.game.bids,
      nextBidderId: result.nextBidderId,
      forbiddenBid: result.forbiddenBid,
      biddingComplete: result.biddingComplete,
    });

    if (result.biddingComplete) {
      const firstPlayerId = room.game.players[room.game.trickLeaderIndex].id;
      this.io.to(roomCode).emit('playing_start', {
        bids: room.game.bids,
        firstPlayerId,
        currentRound: room.game.currentRound,
        trumpSuit: room.game.trumpSuit,
      });
    }
  }

  applyCardResult(roomCode, room, playerId, card, result) {
    this.roomStore.touchRoom(room);
    room.game = result.state;

    this.io.to(roomCode).emit('card_played', {
      playerId,
      card,
      currentTrick: room.game.currentTrick,
      nextPlayerId: result.nextPlayerId || null,
      trickComplete: result.trickComplete,
    });

    if (!result.trickComplete) {
      this.scheduleBotTurn(roomCode);
      return;
    }

    if (result.roundOver) {
      this.finishRoundAfterDelay(roomCode, result);
      return;
    }

    this.clearTrickAfterDelay(roomCode, result);
  }

  finishRoundAfterDelay(roomCode, result) {
    const room = this.roomStore.getRoom(roomCode);
    const winners = getWinners(room.game.scores);

    setTimeout(() => {
      const currentRoom = this.roomStore.getRoom(roomCode);
      if (!currentRoom?.game || currentRoom.status !== 'playing') return;

      this.io.to(roomCode).emit('round_complete', {
        roundResult: result.roundResult,
        scores: currentRoom.game.scores,
        players: currentRoom.game.players,
        nextRound: result.isLastRound ? null : currentRoom.game.currentRound + 1,
      });

      if (result.isLastRound) {
        currentRoom.status = 'finished';
        this.io.to(roomCode).emit('game_over', {
          scores: currentRoom.game.scores,
          roundHistory: currentRoom.game.roundHistory,
          winners,
          players: currentRoom.game.players,
        });
        this.compactFinishedGame(currentRoom);
        this.scheduleFinishedRoomCleanup(roomCode);
        return;
      }

      setTimeout(() => {
        const nextRoom = this.roomStore.getRoom(roomCode);
        if (!nextRoom?.game || nextRoom.status !== 'playing') return;
        nextRoom.game = startRound(nextRoom.game);
        this.emitRoundStart(roomCode, nextRoom);
      }, 4000);
    }, 1500);
  }

  clearTrickAfterDelay(roomCode, result) {
    setTimeout(() => {
      const room = this.roomStore.getRoom(roomCode);
      if (!room?.game || room.status !== 'playing') return;

      room.game.currentTrick = [];
      room.game.leadSuit = null;

      this.io.to(roomCode).emit('trick_complete', {
        winnerId: result.winnerId,
        tricksWon: room.game.tricksWon,
        nextLeaderId: result.nextLeaderId,
        currentTrick: [],
      });
      this.scheduleBotTurn(roomCode);
    }, 1500);
  }

  scheduleBotTurn(roomCode) {
    setTimeout(() => this.processBotTurn(roomCode), getRandomBotDelayMs());
  }

  processBotTurn(roomCode) {
    const room = this.roomStore.getRoom(roomCode);
    if (!room?.game || room.status !== 'playing') return;

    if (room.game.phase === 'bidding') {
      const seatIndex = room.game.biddingOrder[room.game.currentBidderIndex];
      const player = room.game.players[seatIndex];
      if (!player?.isBot) return;

      const bid = chooseBotBid(room.game, player.id);
      const result = placeBid(room.game, player.id, bid);
      if (result.error) {
        console.error(`Bot bid failed for ${player.name}: ${result.error}`);
        return;
      }
      this.applyBidResult(roomCode, room, player.id, bid, result);
      this.scheduleBotTurn(roomCode);
      return;
    }

    if (room.game.phase === 'playing') {
      if (room.game.currentTrick.length >= room.game.numPlayers) return;
      const player = room.game.players[room.game.currentTurnIndex];
      if (!player?.isBot) return;

      const card = chooseBotCard(room.game, player.id);
      const result = playCard(room.game, player.id, card);
      if (result.error) {
        console.error(`Bot play failed for ${player.name}: ${result.error}`);
        return;
      }
      this.applyCardResult(roomCode, room, player.id, card, result);
    }
  }

  scheduleFinishedRoomCleanup(roomCode) {
    setTimeout(() => {
      const room = this.roomStore.getRoom(roomCode);
      if (room?.status === 'finished') {
        this.roomStore.deleteRoom(roomCode);
        console.log(`Deleted finished room ${roomCode} after cleanup timeout`);
      }
    }, FINISHED_ROOM_CLEANUP_MS);
  }

  compactFinishedGame(room) {
    if (!room?.game) return;
    room.game = {
      players: room.game.players,
      scores: room.game.scores,
      roundHistory: room.game.roundHistory,
      phase: 'gameEnd',
    };
  }

  sendGameState(socket, room, playerId) {
    // game_started already carries the complete state (phase, currentBidderIndex,
    // currentTurnIndex, leadSuit, currentTrick, bids, etc.) via getPublicGameState.
    // Sending bidding_start / playing_start here would reset currentBidderIndex to 0
    // and wipe leadSuit / currentTrick on the client, causing "Not your turn" errors.
    socket.emit('game_started', { gameState: getPublicGameState(room.game) });
    socket.emit('deal_hand', { hand: room.game.hands[playerId] || [] });
  }
}

function getRandomBotDelayMs() {
  return BOT_ACTION_DELAY_MIN_MS + Math.floor(Math.random() * (BOT_ACTION_DELAY_MAX_MS - BOT_ACTION_DELAY_MIN_MS + 1));
}

module.exports = { GameOrchestrator };
