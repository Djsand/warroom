import { describe, it, expect, vi } from "vitest";
import { runDesignPhase } from "../../src/orchestrator/phases.js";
import { Thread } from "../../src/conversation/thread.js";

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
