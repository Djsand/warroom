import { describe, it, expect, vi } from "vitest";
import { callAgent, type CallAgentInput } from "../../src/agents/call.js";

const mockCreate = vi.fn().mockResolvedValue({
  content: [{ type: "text", text: "I propose a clean architecture." }],
  usage: { input_tokens: 100, output_tokens: 50 },
});

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

describe("callAgent", () => {
  it("returns agent response text", async () => {
    const input: CallAgentInput = {
      role: "architect",
      systemPrompt: "You are the Architect.",
      conversationContext: "Task: add auth",
      apiKey: "test-key",
      model: "claude-sonnet-4-6-20250514",
    };

    const result = await callAgent(input);
    expect(result.content).toBe("I propose a clean architecture.");
    expect(result.tokensUsed).toBe(150);
  });

  it("extracts code changes from FILE: blocks", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: "Here is my implementation:\n\nFILE: src/auth.ts\n```typescript\nexport const auth = true;\n```\n\nFILE: src/index.ts\n```typescript\nimport { auth } from './auth';\n```",
        },
      ],
      usage: { input_tokens: 200, output_tokens: 80 },
    });

    const input: CallAgentInput = {
      role: "builder",
      systemPrompt: "You are the Builder.",
      conversationContext: "Task: implement auth",
      apiKey: "test-key",
      model: "claude-sonnet-4-6-20250514",
    };

    const result = await callAgent(input);

    expect(result.codeChanges).toHaveLength(2);
    expect(result.codeChanges[0].filePath).toBe("src/auth.ts");
    expect(result.codeChanges[0].content).toBe("export const auth = true;");
    expect(result.codeChanges[1].filePath).toBe("src/index.ts");
  });
});
