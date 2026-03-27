---
name: warroom
description: "5 AI agents enter the war room. They debate, build, and review your code. Run /warroom with a task description to start a multi-agent conversation where 5 agents design, challenge, implement, review, and try to break your feature. Produces a readable conversation.md showing the full debate."
user_invocable: true
---

# warroom — Multi-Agent Debate, Build & Review

You are orchestrating 5 AI agents to accomplish a coding task. The CONVERSATION between agents is the core product — it must be fascinating, readable, and shareable.

## Before starting

Read key project files to understand the codebase context (package.json, README, main source files). You'll pass this context to agents.

## Phase 1: Design (Architect + Challenger debate)

Dispatch the **warroom-architect** agent with:
- The user's task
- Relevant project context (framework, key files, patterns)

Read the Architect's design proposal, then dispatch the **warroom-challenger** agent with the proposal. The Challenger MUST find at least 2 issues.

If issues are found, dispatch the Architect again with the critique. Continue for up to 4 rounds or until Challenger says "DESIGN APPROVED".

**Save every agent response** — you are building the conversation log.

## Phase 2: Build

Dispatch the **warroom-builder** agent with the final agreed design and project context. The Builder writes actual files.

Save the Builder's response for the conversation log.

## Phase 3: Review

Dispatch the **warroom-reviewer** agent to review the written code (tell it which files to read).

Dispatch the **warroom-breaker** agent to try to break the code with adversarial scenarios.

If either finds issues, have the Builder fix them and re-review (up to 3 rounds).

Save all responses for the conversation log.

## Phase 4: Write the Conversation

Create `.warroom/conversations/` directory. Write **conversation.md** with every agent message formatted as:

```markdown
# warroom conversation — "Task Description"

## Participants
- 🏗️ **Architect**
- 😈 **Challenger**
- 💻 **Builder**
- 🔍 **Reviewer**
- 🧪 **Breaker**

## Phase 1: Design

**🏗️ Architect:** [their full response]

**😈 Challenger:** [their full response]

[all design messages...]

## Phase 2: Build

**💻 Builder:** [their full response]

## Phase 3: Review

**🔍 Reviewer:** [their full response]

**🧪 Breaker:** [their full response]

---

📊 5 agents · N messages · N design revisions · N issues caught
```

Write **summary.md** with: what was built, key debates, issues caught, files changed.

Tell the user: "Conversation saved to `.warroom/conversations/conversation.md`"

## Critical Rules

- The Challenger MUST disagree (if it rubber-stamps, the product fails)
- The Breaker MUST try adversarial scenarios
- Write real code, not pseudocode
- Capture EVERY agent response for the conversation log
- The conversation must be fascinating and educational
