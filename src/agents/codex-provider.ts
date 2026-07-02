import { complete, type Model } from "@mariozechner/pi-ai";
import { extractCodeChanges, type CallAgentInput, type CallAgentResult } from "./shared.js";

/**
 * Codex (ChatGPT backend) agent calls, routed through pi-ai's
 * openai-codex-responses provider. The access token carries the account id, so
 * the provider only needs `apiKey`.
 */

// Reasoning effort for Codex agents. Debates make many calls, so default low
// for responsiveness; override with WARROOM_CODEX_EFFORT.
const DEFAULT_EFFORT = "low";

function codexModel(id: string): Model<"openai-codex-responses"> {
  return {
    id,
    name: `${id} (Codex)`,
    api: "openai-codex-responses",
    provider: "openai-codex",
    baseUrl: "https://chatgpt.com/backend-api",
    reasoning: true,
    input: ["text"],
    // ChatGPT subscriptions are not billed per token.
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 272_000,
    maxTokens: 128_000,
  };
}

export async function callCodexAgent(input: CallAgentInput): Promise<CallAgentResult> {
  const model = codexModel(input.model);
  const response = await complete(
    model,
    {
      systemPrompt: input.systemPrompt,
      messages: [{ role: "user", content: input.conversationContext, timestamp: Date.now() }],
    },
    {
      apiKey: input.auth.token,
      reasoningEffort: process.env.WARROOM_CODEX_EFFORT ?? DEFAULT_EFFORT,
    },
  );

  if (response.stopReason === "error") {
    throw new Error(response.errorMessage || "Codex request failed");
  }

  const content = response.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return {
    content,
    codeChanges: extractCodeChanges(content),
    tokensUsed: response.usage?.totalTokens ?? 0,
  };
}
