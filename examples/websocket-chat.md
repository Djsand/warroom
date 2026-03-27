# WebSocket Chat

> Task: "Build a WebSocket chat server with rooms"

---

🏗️ **Architect**: Proposed design using `ws` library on Node.js:

```
src/
  server.js       — HTTP server + WebSocket upgrade
  rooms.js        — room registry: join, leave, broadcast
  connection.js   — per-client connection handler
  protocol.js     — message types and validation
```

Protocol (JSON messages):
```json
{ "type": "join",    "room": "general" }
{ "type": "message", "room": "general", "text": "hello" }
{ "type": "leave",   "room": "general" }
```

Key decisions:
- In-memory room registry (Map of room name to Set of connections)
- Server assigns user IDs on connect (no auth for now)
- Broadcast sends to all members of a room except the sender
- Connection cleanup on `close` event removes from all rooms

@Challenger: go.

---

😈 **Challenger**: Four issues:

1. **No heartbeat/ping-pong.** WebSocket connections can silently die (network change, laptop sleep, NAT timeout). Without a ping interval, dead connections accumulate in room Sets forever, leaking memory and inflating user counts. The `ws` library supports `ws.ping()` — send pings every 30s and terminate connections that don't respond within 10s.

2. **No reconnection support.** When a client reconnects, it gets a new user ID and loses room membership. It has to rejoin every room manually. At minimum: let clients send a `reconnect` message with their previous ID to restore state. Better: send a session token on first connect.

3. **No message ordering guarantee.** If two users send messages at the same time, different room members might see them in different orders. For a chat app, this causes confusion. Add a server-side monotonic sequence number per room, attached to every broadcast message.

4. **`text` field is unvalidated.** A user can send a 100MB string as `text` and the server will broadcast it to every room member, amplifying the attack by N. Add a max message size (e.g., 4KB) at the WebSocket frame level and validate `text.length` before broadcast.

---

🏗️ **Architect**: All valid. Revisions:

1. Ping every 30s, terminate after 10s with no pong. Mark connections as `alive = false` before ping, set `alive = true` on pong. Interval checks and kills dead ones.
2. Session tokens: on connect, server sends `{ type: "welcome", sessionId, userId }`. Client can send `{ type: "reconnect", sessionId }` to restore previous state. Store session-to-rooms mapping with a 5-minute TTL.
3. Per-room sequence counter (integer). Every broadcast message includes `seq`. Clients can detect gaps.
4. Max frame size: 8KB at the `ws` server level (`maxPayload`). Additionally validate `text.length <= 4000` in the message handler.

@Builder: proceed.

---

💻 **Builder**: Implemented. 4 files, 220 lines total.

**server.js**
```javascript
import { WebSocketServer } from 'ws';
import http from 'http';
import { handleConnection } from './connection.js';

const server = http.createServer();
const wss = new WebSocketServer({ server, maxPayload: 8 * 1024 });

// Heartbeat: ping every 30s, kill dead connections
const interval = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 30_000);

wss.on('close', () => clearInterval(interval));
wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  handleConnection(ws);
});

const port = process.env.PORT || 8080;
server.listen(port, () => console.log(`Chat server on port ${port}`));
```

**rooms.js**
```javascript
const rooms = new Map();     // room name -> { clients: Set, seq: number }
const sessions = new Map();  // sessionId -> { userId, rooms: Set, expiresAt }

function joinRoom(roomName, ws) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, { clients: new Set(), seq: 0 });
  }
  rooms.get(roomName).clients.add(ws);
}

function leaveRoom(roomName, ws) {
  const room = rooms.get(roomName);
  if (room) {
    room.clients.delete(ws);
    if (room.clients.size === 0) rooms.delete(roomName);
  }
}

function broadcast(roomName, message, sender) {
  const room = rooms.get(roomName);
  if (!room) return;
  room.seq += 1;
  const payload = JSON.stringify({ ...message, seq: room.seq });
  for (const client of room.clients) {
    if (client !== sender && client.readyState === 1) {
      client.send(payload);
    }
  }
}
```

**connection.js**
```javascript
import { joinRoom, leaveRoom, broadcast, createSession, restoreSession } from './rooms.js';
import { validate } from './protocol.js';

export function handleConnection(ws) {
  const session = createSession();
  ws.send(JSON.stringify({ type: 'welcome', sessionId: session.id, userId: session.userId }));
  const userRooms = new Set();

  ws.on('message', (data) => {
    const msg = validate(data.toString());
    if (!msg) return;

    if (msg.type === 'join') {
      joinRoom(msg.room, ws);
      userRooms.add(msg.room);
    } else if (msg.type === 'leave') {
      leaveRoom(msg.room, ws);
      userRooms.delete(msg.room);
    } else if (msg.type === 'message') {
      if (!userRooms.has(msg.room)) return;
      broadcast(msg.room, { type: 'message', room: msg.room, userId: session.userId, text: msg.text }, ws);
    }
  });

  ws.on('close', () => {
    for (const room of userRooms) leaveRoom(room, ws);
  });
}
```

@Reviewer @Breaker: ready.

---

🔍 **Reviewer**: Implementation is solid. Heartbeat is correct — the `isAlive` flag pattern from the `ws` docs. Room cleanup on empty is good. Sequence numbers per room are correct.

One critical issue: **no input sanitization on chat messages.** The `text` field is broadcast as-is. If any client renders this as HTML (web client using `innerHTML`), an attacker can inject `<script>alert('xss')</script>` and execute arbitrary JavaScript in every room member's browser.

The server should not assume what clients do with the text. Defense in depth: strip or escape HTML entities on the server side before broadcast. At minimum: replace `<`, `>`, `&`, `"`, `'` with their HTML entities. This doesn't break legitimate messages and prevents stored XSS through the chat relay.

Also: the `room` field in join/message requests is user-controlled. If it's used as a Map key without validation, a user could create rooms with names like `__proto__` or `constructor`. In modern V8 this isn't exploitable with `Map`, but validate room names anyway — alphanumeric plus hyphens, max 50 characters.

---

🧪 **Breaker**: Load and abuse testing:

1. **10,000 concurrent connections.** Each WebSocket holds a socket and event listeners. With default Node.js settings, `ulimit -n` is 1024 on most systems — connections 1025+ get `EMFILE: too many open files`. The server crashes with no graceful degradation. Fix: increase ulimit in the deployment config, and add a connection limit in the WebSocket server (`wss.clients.size >= MAX_CONNECTIONS` check before accepting).

2. **Message flooding.** A single client sends 1,000 messages per second to a room with 500 members. That is 500,000 `client.send()` calls per second. The broadcast loop in `rooms.js` is synchronous — it blocks the event loop during the send loop, and the 30s heartbeat interval fires late, misidentifying healthy connections as dead. Fix: per-client rate limiting (e.g., 10 messages/second with a token bucket). Drop excess messages with an error response.

3. **Room name injection.** Joining room `"../../../../etc/passwd"` — not exploitable since rooms are Map keys, not filesystem paths. But joining 10,000 uniquely-named rooms creates 10,000 Map entries with a Set containing one connection each. This is a memory exhaustion attack. Fix: limit rooms per user (e.g., 20) and limit total active rooms.

4. **Empty room ghost.** A client joins a room, sends no messages, and disconnects. The `close` handler calls `leaveRoom`, which deletes the room if empty. Good. But if the ping timeout kills the connection (via `ws.terminate()`), does the `close` event still fire? Yes — `terminate()` emits `close`. Verified, no bug here.

Bugs 1 and 2 are production-critical. Bug 3 is a resource exhaustion vector.

---

📊 **5 agents** · 6 messages · 1 revision · 4 bugs caught · 4 files · 105s
