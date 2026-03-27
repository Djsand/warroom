# r/programming

**Title:** Warroom: a CLI where 5 AI agents with opposing objectives debate your code before building it

**Body:**

I've been experimenting with multi-agent systems where each agent has a fundamentally different goal. Instead of one AI writing code and saying "here you go," warroom runs 5 agents through a structured debate:

```
────────────────────────────────────────────
Phase 1: Design
────────────────────────────────────────────
[ARC] Architect  I propose splitting server.js from index.js. The app...
[CHL] Challenger  Two real issues. No main in package.json -- npm start...
[ARC] Architect  Both valid. Adding start script and error handler...
[CHL] Challenger  Design approved.

────────────────────────────────────────────
Phase 2: Build
────────────────────────────────────────────
[BLD] Builder  Implemented. 4 files written.

────────────────────────────────────────────
Phase 3: Review
────────────────────────────────────────────
[REV] Reviewer  LGTM. server.js/index.js split is correct.
[BRK] Breaker  Two real bugs. PORT=0 reports "port 0" instead of
               actual port. PORT=99999 throws synchronous RangeError
               that bypasses the async error handler.
```

The key idea is that each agent optimizes for something different: Architect for elegance, Challenger for robustness, Builder for shipping, Reviewer for quality, Breaker for finding failures. They disagree by design.

The full conversation gets saved as markdown. Honestly, the conversation transcript is more valuable than the generated code -- you can see every tradeoff being debated.

GitHub: https://github.com/Djsand/warroom

Install: `npx warroom run "your task"` or as a Claude Code plugin.

~1000 lines of TypeScript, MIT licensed. The agent prompts are in plaintext markdown files so you can see exactly how each personality works.
