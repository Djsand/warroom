# Hacker News

## Submission

**Title:** Show HN: Warroom -- 5 AI agents debate, build, and review your code

**URL:** https://github.com/Djsand/warroom

## First comment (post immediately after submitting)

Hey HN, I built warroom because I kept noticing the same problem with AI code generation: a single agent agrees with itself. It proposes a design, approves its own design, builds it, and says "looks good." Nobody pushes back.

Warroom runs 5 Claude agents with different objective functions against your task:

- Architect proposes the design
- Challenger attacks it (must find at least 2 issues)
- Builder implements the agreed design
- Reviewer checks for quality issues
- Breaker tries to break everything with adversarial inputs

The interesting part is they genuinely disagree. In the Express server example, Breaker found that PORT=0 silently reports "port 0" instead of the actual ephemeral port, and PORT=99999 throws a synchronous RangeError that bypasses the async error handler entirely. Neither the Architect nor the Builder caught either of those.

The conversation is saved as markdown -- honestly, reading how the agents argue is more useful than the generated code itself. You can see the tradeoffs being weighed in real time.

Try it: `npx warroom run "your task here"` (needs an Anthropic API key or Claude Code subscription)

It's v0.2, rough edges exist. The code is ~1000 lines of TypeScript. Happy to answer questions about the agent architecture or how the debate phases work.
