import { describe, it, expect, vi, beforeEach } from "vitest";
import { callAgent, type CallAgentInput } from "../../src/agents/call.js";

const ctorArgs = vi.hoisted(() => ({ last: null as any }));
const create = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    content: [{ type: "text", text: "GLM here." }],
    usage: { input_tokens: 5, output_tokens: 7 },
  }),
);

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create };
    constructor(opts: any) {
      ctorArgs.last = opts;
    }
  },
}));

function glmInput(overrides: Partial<CallAgentInput> = {}): CallAgentInput {
  return {
    role: "architect",
    systemPrompt: "You are the Architect.",
    conversationContext: "Task: add auth",
    auth: {
      provider: "glm",
      method: "api-key",
      token: "zai-key",
      baseUrl: "https://api.z.ai/api/anthropic",
    },
    model: "glm-5.2",
    ...overrides,
  };
}

describe("callAgent — GLM (Z.ai)", () => {
  beforeEach(() => {
    create.mockClear();
    ctorArgs.last = null;
  });

  it("uses Bearer auth against the Z.ai base URL", async () => {
    await callAgent(glmInput());
    expect(ctorArgs.last.authToken).toBe("zai-key");
    expect(ctorArgs.last.baseURL).toBe("https://api.z.ai/api/anthropic");
    // GLM must NOT be sent as an x-api-key.
    expect(ctorArgs.last.apiKey).toBeUndefined();
  });

  it("does not inject the Claude Code identity into the system prompt", async () => {
    await callAgent(glmInput());
    const sentSystem = create.mock.calls[0][0].system;
    expect(sentSystem).toBe("You are the Architect.");
    expect(JSON.stringify(sentSystem)).not.toContain("Claude Code");
  });

  it("passes the GLM model id through", async () => {
    await callAgent(glmInput());
    expect(create.mock.calls[0][0].model).toBe("glm-5.2");
  });
});
