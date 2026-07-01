import { describe, it, expect, vi, beforeEach } from "vitest";
import { callCodexAgent } from "../../src/agents/codex-provider.js";
import type { CallAgentInput } from "../../src/agents/shared.js";

const complete = vi.hoisted(() => vi.fn());

vi.mock("@mariozechner/pi-ai", () => ({ complete }));

function input(): CallAgentInput {
  return {
    role: "architect",
    systemPrompt: "You are the Architect.",
    conversationContext: "Task: add auth",
    auth: { provider: "codex", method: "oauth-token", token: "access-token" },
    model: "gpt-5.5",
  };
}

describe("callCodexAgent", () => {
  beforeEach(() => complete.mockReset());

  it("maps text content and token usage from a completed response", async () => {
    complete.mockResolvedValue({
      stopReason: "stop",
      content: [
        { type: "thinking", thinking: "hmm" },
        { type: "text", text: "I propose a clean design." },
      ],
      usage: { totalTokens: 321 },
    });

    const result = await callCodexAgent(input());

    expect(result.content).toBe("I propose a clean design.");
    expect(result.tokensUsed).toBe(321);

    // The Codex model + ChatGPT backend are wired up, auth passed as apiKey.
    const [model, context, options] = complete.mock.calls[0];
    expect(model).toMatchObject({
      id: "gpt-5.5",
      api: "openai-codex-responses",
      baseUrl: "https://chatgpt.com/backend-api",
    });
    expect(context.systemPrompt).toBe("You are the Architect.");
    expect(options.apiKey).toBe("access-token");
  });

  it("extracts FILE code blocks from the response", async () => {
    complete.mockResolvedValue({
      stopReason: "stop",
      content: [{ type: "text", text: "FILE: src/a.ts\n```ts\nexport const a = 1;\n```" }],
      usage: { totalTokens: 10 },
    });

    const result = await callCodexAgent({ ...input(), role: "builder" });

    expect(result.codeChanges).toHaveLength(1);
    expect(result.codeChanges[0].filePath).toBe("src/a.ts");
  });

  it("throws with the provider's error message on failure", async () => {
    complete.mockResolvedValue({
      stopReason: "error",
      errorMessage: "You have hit your ChatGPT usage limit (plus plan).",
      content: [],
      usage: { totalTokens: 0 },
    });

    await expect(callCodexAgent(input())).rejects.toThrow(/usage limit/);
  });
});
