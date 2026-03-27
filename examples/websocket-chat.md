# WebSocket Chat

> Task: "Build a WebSocket chat server with rooms"

---

🏗️ **Architect**: Proposed design:

```
src/
  server.ts       — HTTP server + WebSocket upgrade
  rooms.ts        — room management (join, leave, broadcast)
  connection.ts   — per-client connection handler
  protocol.ts     — message types and validation
```

Protocol (JSON messages):
```json
{ "type": "join",    "room": "general" }
{ "type": "leave",   "room": "general" }
{ "type": "message", "room": "general", "text": "hello" }
{ "type": "broadcast", "room": "general", "from": "user123", "text": "hello" }
```

Key decisions:
- In-memory room map: `Map<string, Set<WebSocket>>` — simple, no Redis needed for v1
- No authentication for v1 — username from query param on connect
- Broadcast to room = iterate Set, skip sender
- Heartbeat every 30s to detect dead connections

@Challenger?

---

😈 **Challenger**: Four issues:

1. **No heartbeat/reconnection.** You mentioned heartbeat but it's not in the file list. Without ping/pong, connections that drop silently (mobile network switch, laptop sleep) stay in the room Set forever. After a few days, you're broadcasting to thousands of dead sockets. Memory leak AND wasted CPU.

2. **No message size limit.** A client can send a 500MB JSON message. `JSON.parse` will block the event loop for seconds, freezing all other connections. Set `maxPayload` on the WebSocket server (e.g., 64KB).

3. **Room name injection.** If room names are user-controlled with no validation, a user can create rooms named `__proto__`, `constructor`, or `toString`. Depending on how you store them, this can cause prototype pollution. Use a `Map` (not a plain object) and validate room names against a pattern like `/^[a-z0-9-]{1,50}$/`.

4. **No message ordering guarantee.** WebSocket guarantees ordering per-connection, but if the server processes messages from two users concurrently (e.g., with async handlers), broadcast order isn't deterministic. For chat, users might see messages in different orders. Acceptable for v1, but document it.

---

🏗️ **Architect**: Revisions:

1. Add ping/pong heartbeat: server sends ping every 30s, client must respond within 10s. Dead connections get terminated and removed from all rooms.
2. Set `maxPayload: 65536` (64KB) on the WebSocket server config. Reject oversized messages at the transport layer before parsing.
3. Room names validated: `/^[a-z0-9-]{1,50}$/`. Reject anything else with an error message. Store in `Map`, never plain objects.
4. Documented. Single-threaded event loop means broadcast is sequential within a room, so ordering is actually consistent for v1. Only becomes an issue with clustering.

@Builder: proceed.

---

💻 **Builder**: Implemented. 4 files.

**src/rooms.ts**
```typescript
const rooms = new Map<string, Set<WebSocket>>();

const ROOM_PATTERN = /^[a-z0-9-]{1,50}$/;

export function validateRoom(name: string): boolean {
  return ROOM_PATTERN.test(name);
}

export function join(room: string, ws: WebSocket): void {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(ws);
}

export function leave(room: string, ws: WebSocket): void {
  rooms.get(room)?.delete(ws);
  if (rooms.get(room)?.size === 0) rooms.delete(room);
}

export function broadcast(room: string, message: string, exclude?: WebSocket): void {
  const members = rooms.get(room);
  if (!members) return;
  for (const ws of members) {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

export function removeFromAll(ws: WebSocket): void {
  for (const [room, members] of rooms) {
    members.delete(ws);
    if (members.size === 0) rooms.delete(room);
  }
}
```

**src/server.ts**
```typescript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({
  port: Number(process.env.PORT) || 8080,
  maxPayload: 65536,
});

// Heartbeat: ping every 30s, terminate after 10s without pong
const alive = new WeakMap<WebSocket, boolean>();

const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!alive.get(ws)) { ws.terminate(); continue; }
    alive.set(ws, false);
    ws.ping();
  }
}, 30_000);

wss.on('connection', (ws) => {
  alive.set(ws, true);
  ws.on('pong', () => alive.set(ws, true));
  ws.on('close', () => removeFromAll(ws));
  ws.on('message', (data) => handleMessage(ws, data));
});

wss.on('close', () => clearInterval(heartbeat));
```

@Reviewer @Breaker: ready for review.

---

🔍 **Reviewer**: Implementation is clean. The `WeakMap` for heartbeat state is a nice touch — no manual cleanup needed when connections close.

One critical issue: **no input sanitization on message text.** The server re-broadcasts `text` exactly as received. If a client sends `<img src=x onerror=alert(1)>` as their message, every other client renders it. Classic stored XSS.

The fix depends on where rendering happens:
- If clients render as plain text (`textContent`): safe, no server fix needed
- If clients render as HTML (`innerHTML`): server must escape `<`, `>`, `&`, `"`, `'`
- Best: server strips HTML tags, clients use `textContent`. Defense in depth.

Don't assume the client is safe. Sanitize on the server.

---

🧪 **Breaker**: Stress-testing:

1. **10,000 concurrent connections.** Node's default `ulimit` is 1024 open file descriptors. At connection 1025, the server throws `EMFILE` and crashes — not a graceful rejection, a full process crash. Fix: set `server.maxConnections` or handle the `EMFILE` error, returning a 503.

2. **Message flooding.** A single client sends 10,000 messages/second to a room with 100 members. That's 1M `ws.send()` calls/second. The event loop blocks, heartbeats stop, and legitimate connections get terminated. Fix: rate limit per-connection (e.g., 10 messages/second), drop excess with a warning.

3. **Room exhaustion.** A client joins 100,000 unique rooms. Each room creates a new `Set` in the Map. With no limit on rooms per connection or total rooms, a single client can exhaust server memory. Fix: cap rooms per connection (e.g., 10) and total active rooms (e.g., 10,000).

4. **Binary frame injection.** Client sends a binary WebSocket frame instead of text. `JSON.parse` on a Buffer works differently than on a string in some Node versions. Verify `data.toString()` is called before parsing, or set `ws.binaryType` to reject binary frames.

Bug 1 is critical — it's a denial of service with a single curl command. Bug 2 is high — one bad client takes down the whole server.

---

📊 **5 agents** · 6 messages · 1 revision · 4 bugs caught · 4 files · 100s
