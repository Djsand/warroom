# r/ClaudeAI

**Title:** I built a multi-agent CLI where 5 Claude agents argue about your code -- Architect, Challenger, Builder, Reviewer, and Breaker

**Body:**

Built this as a Claude Code plugin (also works standalone). You give it a task and 5 agents run through a structured debate:

1. **Architect** proposes a design
2. **Challenger** attacks it -- forced to find at least 2 real issues
3. They go back and forth until the design holds up
4. **Builder** implements it
5. **Reviewer** checks quality
6. **Breaker** tries to break everything with adversarial inputs

Each agent has a system prompt that gives it a different objective function. Challenger isn't allowed to just say "looks good" -- it has to find specific, actionable issues. Breaker has to design adversarial test scenarios. They genuinely disagree.

The surprising result: in almost every session, Breaker finds at least one real bug that Architect and Builder both missed. In the Express server example, it caught that PORT=0 silently reports the wrong port and PORT=99999 throws an unhandled synchronous error.

Works with your Claude subscription (as a Claude Code plugin) or with an API key:

```
# Claude Code plugin
claude plugin marketplace add https://github.com/Djsand/warroom
/warroom "Add user authentication"

# Standalone
npx warroom run "Add user authentication"
```

The conversation gets saved as markdown + optional HTML export. Reading the debate transcripts is genuinely useful for learning about edge cases.

GitHub: https://github.com/Djsand/warroom

v0.2, feedback welcome. The agent prompts are plain markdown files in the `agents/` directory if you're curious about how the personalities are defined.
