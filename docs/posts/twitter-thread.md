# Twitter/X Thread

## Thread A -- The hook

**Tweet 1:**
I built a CLI where 5 AI agents argue about your code before writing it.

One designs it.
One attacks the design.
One builds it.
One reviews it.
One tries to break it.

The conversation is more interesting than the code.

[attach demo GIF or video]

**Tweet 2:**
Here's what happens when you ask it to build an Express server.

Architect proposes server.js/index.js split.

Challenger immediately finds 2 issues: no "main" in package.json (npm start broken on fresh clone) and no EADDRINUSE handler.

They debate. Architect revises.

[screenshot of Phase 1 terminal output]

**Tweet 3:**
Builder implements the agreed design. 4 files.

Then Breaker tries to destroy it:

"PORT=0 -- kernel assigns ephemeral port but you log 'port 0' instead of the actual port."

"PORT=99999 -- throws synchronous RangeError that bypasses your async error handler."

Both real bugs. In a hello world.

**Tweet 4:**
The key insight: a single AI agent agrees with itself.

5 agents with different objectives don't.

- Architect optimizes for elegance
- Challenger optimizes for robustness
- Builder optimizes for shipping
- Reviewer optimizes for quality
- Breaker optimizes for finding failures

**Tweet 5:**
The conversation gets saved as markdown. Reading how 5 agents debate the tradeoffs of your architecture is genuinely useful.

Try it:
npx warroom run "your task here"

Or as a Claude Code plugin:
/warroom "your task"

MIT licensed, ~1000 lines of TypeScript.

github.com/Djsand/warroom

---

## Thread B -- Technical deep dive (post day 2-3)

**Tweet 1:**
How warroom works under the hood -- a thread on building a multi-agent debate system with Claude.

The architecture is simple. The prompts are where the magic is.

**Tweet 2:**
Each agent has a system prompt with strict constraints:

Challenger MUST find at least 2 issues with every proposal. It's not allowed to say "looks good." This forces it to think adversarially even when the design seems fine.

Breaker MUST design 3+ specific adversarial test scenarios. Not vague -- concrete inputs.

**Tweet 3:**
The debate runs in phases:

Phase 1: Design (2-4 rounds)
Architect proposes. Challenger attacks. They loop until the design survives.

Phase 2: Build
Builder implements the agreed design.

Phase 3: Review
Reviewer + Breaker examine the code. If they find issues, Builder rebuilds.

**Tweet 4:**
The model choice matters.

All 5 agents run on Claude Sonnet. Fast enough for the back-and-forth, smart enough to catch real issues.

The total cost of a session is usually $0.05-0.15. Way cheaper than you'd expect for 5 agents debating.

**Tweet 5:**
What surprised me most: the Breaker agent finds real bugs in almost every session.

Not "what if the server is down" generic stuff. Specific, testable edge cases that slip past the other 4 agents.

Adversarial agents > agreeable agents.

Code: github.com/Djsand/warroom

---

## Tags to use:
@AnthropicAI @alexalbert__

#AI #Claude #DevTools #OpenSource
