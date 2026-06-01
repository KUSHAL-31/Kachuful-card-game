require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const logger = require('./utils/logger');
const roomStore = require('./state/roomStore');
const { createRoomRouter } = require('./routes/roomRoutes');
const { GameOrchestrator } = require('./services/gameOrchestrator');
const { registerGameSocketHandlers } = require('./sockets/registerGameSocketHandlers');

// ── Global error safety nets ──────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.fatal('UNCAUGHT_EXCEPTION', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal('UNHANDLED_REJECTION', {
    error: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  process.exit(1);
});

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
const ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN || '*';
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// HTTP request logging middleware
app.use((req, res, next) => {
  const startMs = Date.now();
  res.on('finish', () => {
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('HTTP_REQUEST', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startMs,
      ip: req.ip,
    });
  });
  next();
});

app.use(createRoomRouter(roomStore));

// ── Health endpoint ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const rooms = roomStore.getAllRooms();
  const activeRooms = rooms.filter(r => r.status === 'playing').length;
  const totalPlayers = rooms.reduce((sum, r) => sum + r.players.filter(p => !p.isBot && p.isConnected).length, 0);
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    activeRooms,
    lobbyRooms: rooms.filter(r => r.status === 'lobby').length,
    connectedPlayers: totalPlayers,
    totalRooms: rooms.length,
  });
});

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGIN, methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const gameOrchestrator = new GameOrchestrator({ io, roomStore });
registerGameSocketHandlers({ io, roomStore, gameOrchestrator });

// ── Periodic health snapshot ──────────────────────────────────────────────────
const HEALTH_SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;
const healthInterval = setInterval(() => {
  const rooms = roomStore.getAllRooms();
  logger.info('HEALTH_SNAPSHOT', {
    totalRooms: rooms.length,
    activeGames: rooms.filter(r => r.status === 'playing').length,
    lobbyRooms: rooms.filter(r => r.status === 'lobby').length,
    connectedPlayers: rooms.reduce((sum, r) => sum + r.players.filter(p => !p.isBot && p.isConnected).length, 0),
    uptimeSeconds: Math.floor(process.uptime()),
  });
}, HEALTH_SNAPSHOT_INTERVAL_MS);
healthInterval.unref();

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function shutdown(signal) {
  const rooms = roomStore.getAllRooms();
  logger.warn('SHUTDOWN', {
    signal,
    activeRooms: rooms.length,
    activeGames: rooms.filter(r => r.status === 'playing').length,
    roomCodes: rooms.map(r => r.roomCode),
  });
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info('SERVER_STARTED', { port: PORT, nodeEnv: process.env.NODE_ENV || 'development', logLevel: process.env.LOG_LEVEL || 'info' });
});
