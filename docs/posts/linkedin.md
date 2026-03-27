# LinkedIn

**Post:**

What if code review happened before the code was written?

I built an open-source CLI called warroom where 5 AI agents with different objectives debate your code architecture before building it.

The agents genuinely disagree -- that's by design. Each one optimizes for something different: elegance, robustness, shipping speed, quality, and failure detection.

In a test with a simple Express server, the "Breaker" agent found 2 real bugs that the other 4 agents missed: a port reporting error with ephemeral ports and an unhandled synchronous exception that bypasses the async error handler.

The insight is simple: one AI agent agrees with itself. Five agents with competing objectives don't.

The conversation transcript is more useful than the generated code -- you can see every tradeoff being weighed.

Open source, MIT licensed: https://github.com/Djsand/warroom

#OpenSource #AI #DeveloperTools #SoftwareEngineering
