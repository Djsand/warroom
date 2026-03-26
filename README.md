# warroom

**5 AI agents enter the war room. They debate, build, and review your code.**

---

```
🏗️ Architect: I propose splitting server.js (app creation + routes) from
   index.js (entry point). The app is exported without side effects — tests
   can import it with supertest without binding a port...

😈 Challenger: Two real issues. No "main" or "scripts" in package.json —
   npm start is broken on a fresh clone. And app.listen() can fail on
   EADDRINUSE with no handler — process crashes with a raw stack trace.

🏗️ Architect: Both valid. Adding start script, main field, and error
   handler on the server instance with EADDRINUSE detection.
   @Builder: proceed.

💻 Builder: Implemented. 4 files. server.js exports app without starting
   it. index.js handles listen errors with actionable messages.
   @Reviewer @Breaker: ready for review.

🔍 Reviewer: LGTM. server.js/index.js split is correct. Error handling
   on the server instance (not the app) is the right API. PORT env var
   handled correctly. Ship it.

🧪 Breaker: Two real bugs. PORT=0 — kernel assigns ephemeral port but
   log reports "port 0" instead of actual port. PORT=99999 — throws
   synchronous RangeError that bypasses the async error handler entirely.

📊 5 agents · 5 messages · 1 revision · 2 bugs caught · 4 files · 70s
```

*Real output from `warroom run "Add a hello world Express server"`*

---

## Quick start

### Claude Code plugin (no API key needed)

```bash
claude plugin add nicolai/warroom
```

```
/warroom "Add user authentication with OAuth"
```

### Standalone CLI

```bash
# Option 1: Setup token (uses your Claude subscription)
warroom setup --token $(claude setup-token)

# Option 2: API key
export ANTHROPIC_API_KEY=sk-ant-...

# Run
warroom run "Add user authentication with OAuth"
```

### What you get

```
.warroom/conversations/
  conversation.md   # Full agent debate (the viral artifact)
  summary.md        # Decisions, trade-offs, bugs caught
```

Plus code written to your project directory.

---

## How it works

1. **Design** — Architect proposes. Challenger attacks. They debate until the design holds.
2. **Build** — Builder implements the agreed design. Writes real files.
3. **Review** — Reviewer checks quality. Breaker tries to break it.
4. **Finalize** — Conversation and summary saved. Code ready to review.

---

## The 5 agents

| Agent | Role | Optimizes for |
|-------|------|---------------|
| 🏗️ Architect | Proposes designs, revises based on critique | Elegance and maintainability |
| 😈 Challenger | Finds gaps, edge cases, attacks every proposal | Robustness and completeness |
| 💻 Builder | Implements the agreed design | Simplicity and shipping |
| 🔍 Reviewer | Reviews code for bugs and quality | Quality and best practices |
| 🧪 Breaker | Tries to break everything with adversarial scenarios | Finding failures |

Each agent has a different objective. They genuinely disagree. That's what makes the conversations interesting.

---

## Authentication (standalone CLI)

The plugin mode needs no configuration.

```bash
# Recommended: use your Claude subscription
warroom setup --token <paste from `claude setup-token`>

# Or: direct API key
export ANTHROPIC_API_KEY=sk-ant-...

# Or: browser login
warroom setup --login
```

```bash
# Optional model override
export GAPS_ARCHITECT_MODEL=claude-sonnet-4-6
export GAPS_AGENT_MODEL=claude-sonnet-4-6
```

---

## Commands

```
warroom run <task>      Assign a task to the agent team
warroom setup           Authenticate (setup token, API key, or browser)
warroom read            Read the latest conversation
warroom status          List all conversations
```

---

## License

MIT
