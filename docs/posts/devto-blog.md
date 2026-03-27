---
title: "I let 5 AI agents argue about my code. Here's what happened."
tags: ai, programming, claude, opensource
---

# I let 5 AI agents argue about my code. Here's what happened.

There's a problem with AI code generation that nobody talks about: **a single AI agent agrees with itself.**

It proposes a design. It approves its own design. It builds it. It reviews its own work and says "looks good." Nobody pushes back. Nobody asks "what happens if the port is already in use?" or "what if the input is malformed?"

I wanted to see what would happen if AI agents had to defend their ideas against other AI agents who were specifically trying to find problems.

## The setup

I built [warroom](https://github.com/Djsand/warroom), a CLI that runs 5 Claude agents against your task. Each agent has a different objective function:

| Agent | Goal |
|-------|------|
| **Architect** | Design elegant, maintainable solutions |
| **Challenger** | Find gaps, edge cases, and weaknesses |
| **Builder** | Implement the agreed design |
| **Reviewer** | Check for bugs and quality issues |
| **Breaker** | Try to break everything with adversarial inputs |

The agents run in phases. Architect and Challenger debate until the design survives scrutiny. Builder implements it. Then Reviewer and Breaker examine the code -- and if they find issues, Builder has to rebuild.

The critical constraint: **Challenger must find at least 2 issues with every proposal.** It's not allowed to just agree. This forces genuine adversarial thinking.

## What happened

I asked warroom to build a hello world Express server. Here's the (abridged) conversation:

```
[ARC] Architect
I propose splitting server.js (app creation + routes) from index.js
(entry point). The app is exported without side effects -- tests can
import it with supertest without binding a port.

[CHL] Challenger
Two real issues:
1. No "main" or "scripts" in package.json -- npm start is broken
   on a fresh clone.
2. app.listen() can fail on EADDRINUSE with no handler -- process
   crashes with a raw stack trace.

[ARC] Architect
Both valid. Adding start script, main field, and error handler on
the server instance with EADDRINUSE detection. @Builder: proceed.

[BLD] Builder
Implemented. 4 files. server.js exports app without starting it.
index.js handles listen errors with actionable messages.

[REV] Reviewer
LGTM. server.js/index.js split is correct. Error handling on the
server instance (not the app) is the right API. Ship it.

[BRK] Breaker
Two real bugs:
1. PORT=0 -- kernel assigns ephemeral port but log reports "port 0"
   instead of actual port.
2. PORT=99999 -- throws synchronous RangeError that bypasses the
   async error handler entirely.
```

**Breaker found 2 real bugs in a hello world Express server that 4 other agents missed.**

These aren't hypothetical. PORT=0 is a legitimate use case (tests use it for dynamic port assignment), and the reported port being wrong is a real debugging nightmare. PORT=99999 causing an unhandled exception is the kind of thing that causes 3am pages.

## Why this works

A single AI agent has no incentive to find flaws in its own work. It's optimizing for one thing: completing the task.

Five agents with **competing objectives** create natural tension:

- Architect wants elegance; Challenger wants robustness
- Builder wants to ship; Reviewer wants quality
- Nobody wants to agree with Breaker, but Breaker is often right

This mirrors how good engineering teams actually work. The best code doesn't come from a single genius -- it comes from people with different perspectives pushing back on each other.

## The conversation IS the product

The surprising part: **reading the conversation transcript is more valuable than the generated code.**

When you read how Architect and Challenger debate whether to use dotenv or bare environment variables, you learn about the tradeoffs. When Breaker explains why your error handler doesn't catch synchronous exceptions, you learn something you can apply everywhere.

Warroom saves every conversation as a markdown file. You can read it, share it, learn from it.

## Try it

```bash
npx warroom run "Add user authentication with JWT"
```

Or install as a Claude Code plugin:

```bash
claude plugin marketplace add https://github.com/Djsand/warroom
/warroom "Add user authentication with JWT"
```

It's ~1000 lines of TypeScript, MIT licensed, and the agent prompts are plain markdown files so you can see exactly how each personality is defined.

**GitHub:** [github.com/Djsand/warroom](https://github.com/Djsand/warroom)

---

*The example conversations in the repo are worth reading even if you never use the tool. Check the [examples/](https://github.com/Djsand/warroom/tree/main/examples) directory.*
