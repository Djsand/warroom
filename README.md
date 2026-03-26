# gaps

**AI agents that debate, build, and review your code. The conversation is the product.**

---

```
🏗️ Architect: I propose middleware-based auth. Each OAuth provider
   gets its own strategy module with a shared session layer...

😈 Challenger: Middleware handles HTTP fine, but what about WebSocket
   connections? Your approach has a gap. Also — JWT or server sessions?
   Each has real trade-offs.

🏗️ Architect: Good catch. Revising — adding connection-level auth hook.
   For sessions: short-lived JWTs with refresh rotation...

🔍 Reviewer: JWT has a revocation problem. User permissions change
   mid-session, stale tokens stay valid. Consider hybrid: 5-min JWTs
   + session store for revocation.

😈 Challenger: And refresh rotation has race conditions in distributed
   systems. Two tabs refreshing simultaneously will break this.

🏗️ Architect: You're both right. Revised: hybrid approach. Short-lived
   JWTs, token families for concurrency, session store for revocation.
   @Builder: proceed.

💻 Builder: Implemented. 12 files, 847 lines. Express sessions with
   Redis, Passport.js OAuth strategies, token family rotation table.
   @Reviewer @Breaker: ready for review.

🧪 Breaker: Found it: if Redis goes down, revocation check fails OPEN.
   All tokens pass. Need fail-CLOSED strategy.

💻 Builder: Fixed. Circuit breaker — Redis unreachable for >5s, reject
   all refreshes. Users re-prompted to login. Safe degradation.

🔍 Reviewer: LGTM. Clean implementation. Extract token family logic
   to its own module for reuse.

📊 5 agents · 23 messages · 3 revisions · 2 bugs caught · 12 files · 92% coverage · 47 min
```

---

## Quick start

```bash
npm install -g gaps
export ANTHROPIC_API_KEY=your-key
gaps run "Add user authentication with OAuth"
```

You get:

- `conversation.md` — the full agent discussion, readable and shareable
- `summary.md` — decisions made, trade-offs considered, bugs caught
- Code committed to a new branch, ready to review

---

## How it works

gaps runs your task through four phases:

1. **Design** — Architect proposes. Challenger attacks. They revise until the design holds.
2. **Build** — Builder implements the agreed design.
3. **Review** — Reviewer checks quality. Breaker tries to break it. Builder fixes what they find.
4. **Finalize** — Summary written. Conversation saved. Code on a branch.

---

## The 5 agents

| Agent | Role | Optimizes for |
|-------|------|---------------|
| 🏗️ Architect | Proposes designs, revises based on feedback | Elegance & maintainability |
| 😈 Challenger | Finds gaps, edge cases, attacks proposals | Robustness & completeness |
| 💻 Builder | Implements the agreed design | Simplicity & shipping |
| 🔍 Reviewer | Reviews code for quality and correctness | Quality & best practices |
| 🧪 Breaker | Tries to break everything, finds what others miss | Finding failures |

---

## Configuration

```bash
# Required
export ANTHROPIC_API_KEY=your-key

# Optional
export GAPS_ARCHITECT_MODEL=claude-sonnet-4-6-20250514
export GAPS_AGENT_MODEL=claude-sonnet-4-6-20250514
export GAPS_MAX_DESIGN_ROUNDS=4
export GAPS_MAX_REVIEW_ROUNDS=3
```

---

## Commands

```
gaps run <task>     # Assign a task to the agent team
gaps read           # Read the latest conversation
gaps status         # List all conversations
```

---

## License

MIT
