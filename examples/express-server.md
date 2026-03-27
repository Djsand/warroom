# Express Server

> Task: "Add a hello world Express server"

---

🏗️ **Architect**: I propose splitting `server.js` (app creation + routes) from `index.js` (entry point). The app is exported without side effects — tests can import it with supertest without binding a port.

File structure:
```
src/
  server.js   — creates Express app, mounts routes, exports app
  index.js    — imports app, calls listen(), handles errors
  routes/
    health.js — GET /health returns { status: "ok" }
```

@Challenger: thoughts?

---

😈 **Challenger**: Two real issues.

1. No `"main"` or `"scripts"` in package.json — `npm start` is broken on a fresh clone.
2. `app.listen()` can fail on EADDRINUSE with no handler — process crashes with a raw stack trace instead of an actionable message.

Also: no `.env` support for PORT. Hardcoding 3000 means two developers can't run it simultaneously without manual edits.

---

🏗️ **Architect**: Both valid. Revised plan:

- Add `"main": "src/index.js"` and `"start": "node src/index.js"` to package.json
- Error handler on the `server` instance (not the app) with EADDRINUSE detection
- `PORT` from `process.env.PORT` with fallback to 3000
- No dotenv dependency — keep it zero-dep for a hello world

@Builder: proceed with revised spec.

---

💻 **Builder**: Implemented. 4 files created:

**src/server.js**
```javascript
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
```

**src/index.js**
```javascript
import app from './server.js';

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Try: PORT=${Number(port) + 1} npm start`);
  } else {
    console.error('Server failed to start:', err.message);
  }
  process.exit(1);
});
```

@Reviewer @Breaker: ready for review.

---

🔍 **Reviewer**: LGTM overall. The server.js/index.js split is correct — app exported without side effects, entry point handles lifecycle. Error handling targets the `server` instance (not `app`), which is the right API.

Minor nit: the health endpoint should probably return HTTP 200 explicitly for clarity, though Express defaults to 200 anyway. Not blocking.

Ship it.

---

🧪 **Breaker**: Two real bugs found:

1. **PORT=0** — kernel assigns an ephemeral port, but `console.log` reports "port 0" instead of the actual assigned port. Fix: read `server.address().port` inside the listen callback.

2. **PORT=99999** — throws a synchronous `RangeError` ("port should be >= 0 and < 65536") that bypasses the async error handler entirely. The process crashes with an unhandled exception. Fix: validate PORT before calling listen.

Both are edge cases but they represent the kind of thing that causes 3am pages in production.

---

📊 **5 agents** · 6 messages · 1 revision · 2 bugs caught · 4 files · 70s
