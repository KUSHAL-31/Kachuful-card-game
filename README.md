# Kachuful

Kachuful is a real-time multiplayer trick-taking card game built with a React client and a Node.js Socket.IO server. The game supports live rooms, host-controlled bot players, reconnect handling, round-by-round scoring, compulsory bidding rules, animated card play, and an AI bot engine that uses probabilistic simulations to make bidding and play decisions.

The project is designed as a server-authoritative multiplayer system: clients render state and submit player intent, while the backend validates every bid, validates every card play, resolves tricks, advances rounds, updates scores, schedules bots, and broadcasts public game state over sockets.

## Game Overview

Kachuful is a prediction-based trick-taking card game.

- Players join a room and sit in turn order.
- Each round deals a variable number of cards.
- A trump suit rotates by round.
- Players bid how many tricks they expect to win.
- The compulsory player bids last and cannot make the total bid count exactly equal to the number of tricks available.
- During play, players must follow the lead suit when possible.
- Trump cards beat non-trump cards.
- The highest card in the lead suit wins when no stronger trump is played.
- Exact bids score `10 + tricksWon`; missed bids score `0`.
- The compulsory player rotates each round.
- The game runs through an increasing/decreasing card schedule and ends after all configured rounds.

## Tech Stack

### Frontend

- React 18
- Vite 5
- Socket.IO Client
- CSS-driven responsive UI
- Browser APIs for invite sharing and clipboard fallback

### Backend

- Node.js
- Express
- Socket.IO
- HTTP server integration through Node's `http` module
- In-memory room store using `Map`
- Server-side game engine and validation
- Server-side bot engine with simulation-based decision making

### Tooling

- npm workspaces-style scripts at the repository root
- `concurrently` for running client and server together
- `nodemon` available for backend development

## Architecture

```text
React Client
    |
    | Socket.IO events
    v
Socket Gateway
    |
    | delegates room/game actions
    v
GameOrchestrator
    |
    | pure game transitions
    v
Game Engine
    |
    | optional automated actions
    v
Bot Engine
```

The backend is split into clear ownership boundaries:

- Socket handlers translate real-time events into backend actions.
- The room store owns room membership, host transfer, bot seating, reconnect mapping, and cleanup.
- The game engine owns deterministic card-game rules.
- The orchestrator owns side effects: socket broadcasts, delayed trick clearing, bot turn scheduling, round transitions, and game cleanup.
- Serializers control what state is public and prevent leaking private hands to other players.
- The bot engine evaluates imperfect-information game states without mutating the live game directly.

## Repository Structure

```text
.
|-- client/
|   |-- index.html
|   |-- package.json
|   |-- package-lock.json
|   |-- public/
|   |   `-- favicon.svg
|   |-- src/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   |-- index.css
|   |   |-- components/
|   |   |   |-- BidPanel.jsx
|   |   |   |-- Card.jsx
|   |   |   |-- Hand.jsx
|   |   |   |-- PlayerSeat.jsx
|   |   |   |-- RoundSummaryModal.jsx
|   |   |   |-- ScoreTable.jsx
|   |   |   |-- TrickArea.jsx
|   |   |   `-- TrumpIndicator.jsx
|   |   |-- config/
|   |   |   `-- gameConfig.js
|   |   |-- hooks/
|   |   |   `-- useSocket.js
|   |   |-- screens/
|   |   |   |-- GameScreen.jsx
|   |   |   |-- IntroScreen.jsx
|   |   |   |-- LandingScreen.jsx
|   |   |   |-- LobbyScreen.jsx
|   |   |   `-- ResultScreen.jsx
|   |   `-- utils/
|   |       `-- cardUtils.js
|   `-- vite.config.js
|-- server/
|   |-- index.js
|   |-- botEngine.js
|   |-- constants.js
|   |-- deckUtils.js
|   |-- gameEngine.js
|   |-- roomManager.js
|   |-- config/
|   |   `-- appConfig.js
|   |-- routes/
|   |   `-- roomRoutes.js
|   |-- serializers/
|   |   |-- gameSerializer.js
|   |   `-- playerSerializer.js
|   |-- services/
|   |   `-- gameOrchestrator.js
|   |-- sockets/
|   |   `-- registerGameSocketHandlers.js
|   `-- state/
|       `-- roomStore.js
|-- package.json
|-- package-lock.json
`-- progress.md
```

## Important Files

### `server/index.js`

Bootstraps the backend:

- Loads environment variables.
- Creates the Express app.
- Registers JSON parsing and CORS.
- Mounts REST room routes.
- Creates the HTTP server.
- Attaches Socket.IO with WebSocket support.
- Instantiates `GameOrchestrator`.
- Registers real-time socket handlers.

### `server/gameEngine.js`

Contains the core game rules and state transitions:

- `initGame(players)`
- `startRound(gameState)`
- `placeBid(gameState, playerId, bid)`
- `playCard(gameState, playerId, card)`
- `validateCardPlay(gameState, playerId, card)`
- `resolveTrick(trick, trumpSuit, leadSuit)`
- `getForbiddenBid(bids, totalTricks)`
- `getWinners(scores)`

This module is intentionally independent from Socket.IO. It receives plain objects, returns new state plus transition metadata, and is responsible for enforcing turn order, bid range checks, compulsory bid restrictions, follow-suit validation, trick resolution, round scoring, and game-end detection.

### `server/services/gameOrchestrator.js`

Coordinates game flow around the pure game engine:

- Starts games and rounds.
- Emits public game state.
- Sends private hands only to the owning socket.
- Applies bid results and card results.
- Schedules bot turns.
- Delays trick clearing so clients can animate completed tricks.
- Emits round summaries and game-over payloads.
- Compacts finished game state before room cleanup.

This layer keeps side effects out of the game engine while still centralizing the real-time flow.

### `server/botEngine.js`

Implements automated players. This is one of the most advanced parts of the project.

The bot is not a simple random player. It uses a hybrid decision model:

- Legal-move filtering based on the same follow-suit rules as humans.
- Hand-strength estimation for bid prediction.
- Missing-bid estimation for opponents.
- Imperfect-information state sampling.
- Monte Carlo style simulations within time budgets.
- Heuristic fallback scoring when simulations are constrained.
- Pool-aware bid adjustment to avoid unrealistic over-claiming.
- Exact-bid optimization instead of always maximizing trick count.

The bot tries to play toward its bid, not merely win every trick.

### `server/sockets/registerGameSocketHandlers.js`

Defines the Socket.IO event contract:

- Room creation/join flow
- Bot count updates
- Host-only start and restart actions
- Bid submission
- Card submission
- Explicit leave handling
- Disconnect handling
- Reconnect handling
- Mid-game state restoration

It also separates lobby disconnect behavior from active-game disconnect behavior.

### `server/state/roomStore.js`

Stores active rooms in memory and owns:

- Room code generation
- Room creation and joining
- Seat indexing
- Bot creation and reseating
- Host migration
- Player disconnect state
- Reconnection by player name
- Socket id remapping inside active game state
- Room cleanup when no connected humans remain
- Inactive lobby expiry

### `client/src/App.jsx`

Owns top-level client state and socket event subscriptions:

- Screen routing across intro, landing, lobby, game, and result states.
- Single Socket.IO connection.
- Reconnection re-registration.
- Public game state hydration.
- Private hand updates.
- Toast-style error display.
- Client-side response to real-time game events.

### `client/src/screens/GameScreen.jsx`

Renders the live game table:

- Player seats
- Current trick
- Trump indicator
- Bidding panel
- Player hand
- Score table
- Rules overlay
- Round summary modal
- Card-flight animation for submitted cards

## Implemented Features

### Multiplayer Rooms

- Create a room with a short room code.
- Join an existing room by code.
- Invite link support through `?room=<ROOM_CODE>`.
- Host detection.
- Host-only game start.
- Host-only bot configuration.
- Host migration when the host disconnects.
- Room cleanup after inactivity.

### Real-Time Gameplay

- WebSocket-only Socket.IO transport from the client.
- Server-authoritative turn handling.
- Live room updates.
- Live bid updates.
- Live card updates.
- Current trick synchronization.
- Round transition events.
- Game-over events.
- Reconnect restoration for active games.

### Game Rules

- 52-card deck.
- 2 to 10 players.
- Dynamic max cards based on player count, capped at 10.
- Total rounds calculated as `maxCards * 2 - 1`.
- Cards per round increase up to the max, then decrease.
- Rotating trump suit order:
  - spades
  - diamonds
  - clubs
  - hearts
- Compulsory bidder rotates clockwise.
- Compulsory player bids last.
- Compulsory player cannot make total bids equal available tricks.
- Follow-suit validation.
- Trump-based trick resolution.
- Exact bid scoring.
- Round history tracking.

### Bot Players

- Host can add bots in the lobby.
- Bot count is constrained by the max player limit.
- Bots receive stable seat positions like human players.
- Bots are flagged with `isBot`.
- Bots are excluded from private hand socket emissions.
- Bot actions are delayed by a configurable random interval to feel more natural.
- Bots participate in both bidding and play phases.
- Bot chains are scheduled carefully to avoid duplicate parallel bot turns.

### Reconnect and Disconnect Handling

- Client automatically re-registers on socket reconnect.
- Server supports rejoining an active game by matching disconnected player names.
- Active game state remaps old socket ids to new socket ids.
- Player-specific containers are updated during reconnect:
  - hands
  - bids
  - tricks won
  - scores
  - current trick ownership
  - trick winner
- Lobby disconnects receive a shorter cleanup window.
- Active-game disconnects receive a longer grace period.
- If too few connected players remain during a game, the game is ended gracefully.

### Client Experience

- Responsive game table.
- Animated card movement toward the trick area.
- Score and rules overlays.
- Round summary modal.
- Result screen with winners and round history.
- Clipboard fallback for room codes and invite messages.
- Web Share API support where available.
- Toast errors for rejected actions.

## Bot Engine Design

The bot engine is built around incomplete-information decision making. A bot only knows its own hand, the public trick state, the cards already played, current bids, trump suit, and turn order. Opponent hands are sampled from the unknown remaining deck.

### Bid Selection

`chooseBotBid(game, botId)` evaluates possible bids for the bot.

The process:

1. Determine the bot's seat index.
2. Calculate the forbidden bid if the bot is currently the compulsory player.
3. Generate every legal bid from `0` to `cardsThisRound`.
4. Estimate hand strength using high cards, trump cards, and short suits.
5. Estimate missing opponent bids when needed.
6. For each candidate bid:
   - Create sampled game states.
   - Fill unknown opponent hands from the remaining deck.
   - Simulate the rest of the round.
   - Score the candidate by how often it lands exactly on the target bid.
7. Apply pool-awareness:
   - If previous players have already claimed all tricks, bidding high is penalized.
   - If a candidate bid exceeds the unclaimed trick pool, it receives a moderate penalty.
8. Choose the bid with the best normalized score.

Important constants:

```js
const BID_SIMULATIONS = 140;
const BID_TIME_BUDGET_MS = 350;
```

The bot balances simulation quality with real-time responsiveness by bounding both iteration count and wall-clock time.

### Card Selection

`chooseBotCard(game, botId)` chooses a legal card during the play phase.

The process:

1. Get all legal cards using follow-suit rules.
2. Infer the target bid from actual bids or hand estimation.
3. Sort legal cards by a heuristic score.
4. For each candidate card:
   - Sample hidden opponent hands.
   - Apply the candidate move to the sampled state.
   - Simulate the rest of the round.
   - Score the candidate by how close the final trick count is to the target bid.
5. Select the card with the best normalized expected result.

Important constants:

```js
const PLAY_SIMULATIONS = 220;
const PLAY_TIME_BUDGET_MS = 450;
```

This makes the bot strategically different from a naive trick-taking bot. It may intentionally avoid winning if it has already reached its bid, and it may take aggressive winning lines when it still needs tricks.

### Opponent Modeling

The bot does not have perfect information. `createSampledState()` builds a plausible hidden state:

- Keeps the bot's actual hand fixed.
- Treats already played cards as known.
- Reconstructs the unknown deck.
- Shuffles the unknown cards.
- Deals sampled hands to opponents using their current hand sizes.

This allows simulations to approximate likely outcomes without leaking private data from the real game state.

### Simulation Policy

During simulations, non-focus players use `choosePolicyCard()`:

- If a player needs tricks, prefer projected winning cards.
- If a player has already met their bid, prefer cards that avoid winning.
- If a player must win all remaining tricks to hit the bid, heavily prioritize winning.
- Penalize plays that would push a player above their bid.
- Randomly choose among the top scored candidates to avoid deterministic simulation bias.

### Bot Safety

Bot actions are processed through the same public game engine functions as humans:

- Bot bids call `placeBid()`.
- Bot cards call `playCard()`.
- Invalid bot actions are rejected by the same validation path.
- The orchestrator checks the current phase and current player before processing a bot.

This prevents bots from bypassing rules or mutating state directly.

## Socket.IO Design

The socket layer uses event-driven synchronization. Clients submit intents; the server validates and broadcasts resulting state.

### Client to Server Events

| Event | Payload | Purpose |
| --- | --- | --- |
| `join_room` | `{ roomCode, playerName, isCreating }` | Create or join a room. |
| `set_bots` | `{ roomCode, count }` | Host-only bot count update in lobby. |
| `start_game` | `{ roomCode }` | Host-only game start. |
| `place_bid` | `{ roomCode, bid }` | Submit a bid during bidding phase. |
| `play_card` | `{ roomCode, card }` | Submit a card during playing phase. |
| `restart_game` | `{ roomCode }` | Host-only reset back to lobby. |
| `leave_room` | `{ roomCode }` | Explicit room leave. |

### Server to Client Events

| Event | Payload | Purpose |
| --- | --- | --- |
| `room_joined` | `{ room, playerId, isHost }` | Confirms successful room entry. |
| `room_updated` | `{ players, status }` | Broadcasts lobby/player changes. |
| `game_started` | `{ gameState }` | Sends public game state. |
| `deal_hand` | `{ hand }` | Sends private hand to one player only. |
| `bidding_start` | round and bidding metadata | Starts bidding UI for a round. |
| `bid_placed` | bid result metadata | Updates bids and next bidder. |
| `playing_start` | `{ bids, firstPlayerId, currentRound, trumpSuit }` | Moves clients into play phase. |
| `card_played` | card result metadata | Updates trick and hand sizes. |
| `trick_complete` | trick winner metadata | Clears completed trick after animation delay. |
| `round_complete` | round result and scores | Shows round summary. |
| `game_over` | final scores and winners | Moves clients to result screen. |
| `player_disconnected` | disconnected player metadata | Marks a player disconnected. |
| `player_reconnected` | new player id metadata | Restores a reconnected player. |
| `error` | `{ message }` | Reports rejected actions. |

### State Privacy

The server uses `getPublicGameState()` before broadcasting shared state. Public state includes hand sizes but not actual cards for other players.

Private hands are emitted separately through `deal_hand` to the owning socket:

```js
const playerSocket = this.io.sockets.sockets.get(player.id);
if (playerSocket) {
  playerSocket.emit('deal_hand', { hand: room.game.hands[player.id] });
}
```

This keeps the shared socket channel from leaking hidden cards.

### Reconnect Model

The client keeps the last room code and player name in refs. On socket reconnect, it emits `join_room` again. The server then:

- Finds a disconnected player with the same name.
- Replaces the old socket id with the new socket id.
- Updates room host id if needed.
- Moves game-state keys from old id to new id.
- Sends the current public game state.
- Sends the player's private hand.
- Broadcasts a `player_reconnected` event to the room.

This approach makes the game resilient to refreshes and transient network drops without needing a database or authentication system.

## REST API

The project also exposes lightweight REST endpoints for room discovery and room-code creation.

### `POST /room/create`

Request:

```json
{
  "playerName": "Kushal"
}
```

Response:

```json
{
  "roomCode": "ABC123"
}
```

### `GET /room/:code`

Returns room metadata if the room exists and is joinable.

Response:

```json
{
  "roomCode": "ABC123",
  "playerCount": 3
}
```

## Game State Model

The central game object tracks:

- `players`
- `numPlayers`
- `maxCards`
- `totalRounds`
- `currentRound`
- `cardsThisRound`
- `trumpSuit`
- `compulsoryPlayerIndex`
- `phase`
- `bids`
- `biddingOrder`
- `currentBidderIndex`
- `hands`
- `currentTrick`
- `playedCards`
- `leadSuit`
- `currentTurnIndex`
- `trickLeaderIndex`
- `tricksWon`
- `scores`
- `roundHistory`

Phases:

```text
roundStart -> bidding -> playing -> roundEnd -> bidding ... -> gameEnd
```

## Configuration

Server configuration is centralized in `server/config/appConfig.js`.

```js
const MAX_ROOMS = 10;
const MAX_PLAYERS = 10;
const ROOM_EXPIRY_MS = 10 * 60 * 1000;
const ROOM_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const FINISHED_ROOM_CLEANUP_MS = 5 * 60 * 1000;
const LOBBY_DISCONNECT_GRACE_MS = 30 * 1000;
const ACTIVE_DISCONNECT_GRACE_MS = 60 * 1000;
const BOT_ACTION_DELAY_MIN_MS = 3 * 1000;
const BOT_ACTION_DELAY_MAX_MS = 7 * 1000;
```

Client server URL:

```text
VITE_SERVER_URL=http://localhost:3001
```

If `VITE_SERVER_URL` is not provided, the client defaults to `http://localhost:3001`.

## Local Development

### Install dependencies

```bash
npm run install:all
```

### Run client and server together

```bash
npm run dev
```

### Run backend only

```bash
npm run server
```

Backend default:

```text
http://localhost:3001
```

### Run frontend only

```bash
npm run client
```

Vite default:

```text
http://localhost:5173
```

### Build frontend

```bash
cd client
npm run build
```

## Engineering Highlights

- Server-authoritative multiplayer state machine.
- Pure game engine separated from socket side effects.
- Socket.IO event contract for real-time synchronization.
- Private hand delivery separated from public state broadcast.
- Bot engine based on sampled hidden-information simulations.
- Bounded bot decision time for responsive multiplayer pacing.
- Reconnect support with socket id remapping across active game state.
- Configurable room limits, cleanup windows, and bot delays.
- Round history and deterministic score calculation.
- Responsive React UI with game-specific components and animation.

## Current Limitations

- Rooms are stored in memory, so active rooms are lost when the server restarts.
- There is no persistent user identity; reconnects rely on player name matching inside the room.
- The backend does not currently include an automated test suite.
- Horizontal scaling would require a shared room store and a Socket.IO adapter such as Redis.

## Scaling Considerations

For production-scale deployment, the current architecture can be extended with:

- Redis-backed Socket.IO adapter for multi-instance fanout.
- Persistent room/game snapshots in Redis or PostgreSQL.
- Authenticated player sessions instead of name-based reconnect.
- Server-side rate limiting for socket events.
- Automated tests around `gameEngine.js` and `botEngine.js`.
- Structured logging for room lifecycle and game transitions.
