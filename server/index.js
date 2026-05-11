require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const roomStore = require('./state/roomStore');
const { createRoomRouter } = require('./routes/roomRoutes');
const { GameOrchestrator } = require('./services/gameOrchestrator');
const { registerGameSocketHandlers } = require('./sockets/registerGameSocketHandlers');

const app = express();
app.use(cors());
app.use(express.json());
app.use(createRoomRouter(roomStore));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const gameOrchestrator = new GameOrchestrator({ io, roomStore });
registerGameSocketHandlers({ io, roomStore, gameOrchestrator });

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Kachuful server running on port ${PORT}`);
});
