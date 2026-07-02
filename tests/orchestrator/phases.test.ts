import { describe, it, expect, vi } from "vitest";
import { runDesignPhase, agentFor, type PhaseConfig } from "../../src/orchestrator/phases.js";
import { Thread } from "../../src/conversation/thread.js";
import type { GapsAuth } from "../../src/types.js";

vi.mock("../../src/agents/call.js", () => ({
  callAgent: vi.fn()
    .mockResolvedValueOnce({
      content: "I propose REST API with JWT auth.",
      codeChanges: [],
      tokensUsed: 100,
    })
    .mockResolvedValueOnce({
      content: "What about token refresh? Found 2 issues.",
      codeChanges: [],
      tokensUsed: 80,
    })
    .mockResolvedValueOnce({
      content: "Revised: add refresh tokens. @Builder: proceed with this design",
      codeChanges: [],
      tokensUsed: 120,
    })
    .mockResolvedValueOnce({
      content: "Design approved.",
      codeChanges: [],
      tokensUsed: 60,
    }),
}));

describe("runDesignPhase", () => {
  it("produces architect and challenger messages", async () => {
    const thread = new Thread("Add auth");
    await runDesignPhase(thread, {
      auth: { method: "api-key" as const, token: "test" },
      architectModel: "claude-sonnet-4-6-20250514",
      agentModel: "claude-sonnet-4-6-20250514",
      maxRounds: 4,
      projectContext: "",
    });

    const messages = thread.messagesForPhase("design");
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages.some((m) => m.role === "architect")).toBe(true);
    expect(messages.some((m) => m.role === "challenger")).toBe(true);
  });
});

describe("agentFor", () => {
  const anthropic: GapsAuth = { provider: "anthropic", method: "api-key", token: "claude" };
  const codex: GapsAuth = { provider: "codex", method: "oauth-token", token: "gpt" };

  const base: PhaseConfig = {
    auth: anthropic,
    architectModel: "claude-arch",
    agentModel: "claude-agent",
    maxRounds: 4,
    projectContext: "",
    versus: { auth: codex, model: "gpt-5.5", roles: ["challenger", "breaker"] },
  };

  it("routes opposing roles to the versus provider/model", () => {
    expect(agentFor("challenger", base)).toEqual({ auth: codex, model: "gpt-5.5" });
    expect(agentFor("breaker", base)).toEqual({ auth: codex, model: "gpt-5.5" });
  });

  it("keeps the remaining roles on the primary provider", () => {
    expect(agentFor("architect", base)).toEqual({ auth: anthropic, model: "claude-arch" });
    expect(agentFor("builder", base)).toEqual({ auth: anthropic, model: "claude-agent" });
    expect(agentFor("reviewer", base)).toEqual({ auth: anthropic, model: "claude-agent" });
  });

  it("uses one provider for everyone when versus is off", () => {
    const single: PhaseConfig = { ...base, versus: null };
    expect(agentFor("challenger", single)).toEqual({ auth: anthropic, model: "claude-agent" });
    expect(agentFor("architect", single)).toEqual({ auth: anthropic, model: "claude-arch" });
  });
});
