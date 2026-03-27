<div align="center">

# warroom

### 5 AI agents enter the war room.
### They debate, build, and review your code.

[![npm](https://img.shields.io/npm/v/warroom)](https://www.npmjs.com/package/warroom)
[![CI](https://github.com/Djsand/warroom/actions/workflows/ci.yml/badge.svg)](https://github.com/Djsand/warroom/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/Djsand/warroom)](LICENSE)

</div>

---

> Give it a task. Five agents argue about the design, implement it, review each other's work, and try to break it. You get finished code **and a conversation showing exactly how they got there.**

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
   on the server instance (not the app) is the right API. Ship it.

🧪 Breaker: Two real bugs. PORT=0 — kernel assigns ephemeral port but
   log reports "port 0" instead of actual port. PORT=99999 — throws
   synchronous RangeError that bypasses the async error handler entirely.

📊 5 agents · 5 messages · 1 revision · 2 bugs caught · 4 files · 70s
```

*Real output from `warroom run "Add a hello world Express server"`*

---

## Install

### Claude Code plugin (recommended)

```bash
claude plugin marketplace add https://github.com/Djsand/warroom
claude plugin install warroom
```

Then:

```
/warroom "Add user authentication with OAuth"
```

No API key needed. Uses your Claude Code subscription.

### Standalone CLI

```bash
npx warroom setup --token $(claude setup-token)
npx warroom run "Add user authentication with OAuth"
```

Or with an API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npx warroom run "Add user authentication with OAuth"
```

---

## How it works

```
         ┌─────────────┐
         │  Your task   │
         └──────┬───────┘
                │
    ┌───────────▼───────────┐
    │   Phase 1: DESIGN     │  Architect proposes.
    │   Architect + Challenger  Challenger attacks.
    │   debate 2-4 rounds   │  They revise until
    │                       │  the design holds.
    └───────────┬───────────┘
                │
    ┌───────────▼───────────┐
    │   Phase 2: BUILD      │  Builder implements
    │   Builder writes code │  the agreed design.
    └───────────┬───────────┘
                │
    ┌───────────▼───────────┐
    │   Phase 3: REVIEW     │  Reviewer checks quality.
    │   Reviewer + Breaker  │  Breaker tries to
    │   examine the code    │  break everything.
    └───────────┬───────────┘
                │
    ┌───────────▼───────────┐
    │   Phase 4: FINALIZE   │  conversation.md
    │   Save conversation   │  summary.md
    │   and summary         │  code on branch
    └───────────────────────┘
```

---

## The 5 Agents

| | Agent | What it does | Optimizes for |
|---|-------|-------------|---------------|
| 🏗️ | **Architect** | Proposes designs, revises based on critique | Elegance and maintainability |
| 😈 | **Challenger** | Finds gaps and edge cases, attacks every proposal | Robustness and completeness |
| 💻 | **Builder** | Implements the agreed design | Simplicity and shipping |
| 🔍 | **Reviewer** | Reviews code for bugs and quality issues | Quality and best practices |
| 🧪 | **Breaker** | Tries to break everything with adversarial tests | Finding failures |

Each agent has a different objective function. They genuinely disagree. That's what makes the conversations interesting.

---

## What you get

```
.warroom/conversations/
├── conversation.md    ← Full agent debate (shareable)
└── summary.md         ← What was built, decisions made, bugs caught
```

The conversation is the product. Screenshot it. Share it. Learn from it.

---

## Commands

```
warroom run <task>       Assign a task to the agent team
warroom setup            Authenticate (setup token or API key)
warroom setup --login    Browser-based OAuth login
warroom read             Read the latest conversation
warroom status           List all conversations
```

---

## Auth (standalone only)

The plugin mode needs no configuration.

```bash
# Use your Claude subscription (recommended)
warroom setup --token <paste from `claude setup-token`>

# Or use an API key
export ANTHROPIC_API_KEY=sk-ant-...
```

---

## Examples

Real conversations from warroom sessions — each one shows the agents debating, catching bugs, and refining code:

- [Express Server](examples/express-server.md) — 2 bugs caught in a simple hello world
- [JWT Authentication](examples/auth-system.md) — 3 security issues found by Breaker
- [CSV to JSON CLI](examples/cli-tool.md) — streaming architecture stress-tested

Want to add your own? See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT
