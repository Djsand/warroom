import Anthropic from "@anthropic-ai/sdk";
import {
  extractCodeChanges,
  type CallAgentInput,
  type CallAgentResult,
} from "./shared.js";
import { callCodexAgent } from "./codex-provider.js";

export type { CallAgentInput, CallAgentResult } from "./shared.js";

function isOAuthToken(token: string): boolean {
  return token.includes("sk-ant-oat");
}

export async function callAgent(input: CallAgentInput): Promise<CallAgentResult> {
  if (input.auth.provider === "codex") {
    return callCodexAgent(input);
  }
  return callAnthropicAgent(input);
}

async function callAnthropicAgent(input: CallAgentInput): Promise<CallAgentResult> {
  const isOAuth = isOAuthToken(input.auth.token);
  const isGlm = input.auth.provider === "glm";
  const baseURL = input.auth.baseUrl;

  let client: Anthropic;

  if (isOAuth) {
    // Anthropic OAuth tokens need Bearer auth + Claude Code identity headers
    // (same approach as OpenClaw / pi-ai)
    client = new Anthropic({
      apiKey: null,
      authToken: input.auth.token,
      ...(baseURL ? { baseURL } : {}),
      defaultHeaders: {
        "anthropic-beta": "claude-code-20250219,oauth-2025-04-20,fine-grained-tool-streaming-2025-05-14",
        "user-agent": "claude-cli/2.1.75",
        "x-app": "cli",
        "accept": "application/json",
      },
    });
  } else if (isGlm) {
    // Z.ai GLM: Anthropic-compatible endpoint, key sent as a Bearer token.
    client = new Anthropic({ authToken: input.auth.token, baseURL });
  } else {
    // Standard Anthropic API key (x-api-key), optionally against a custom base.
    client = new Anthropic({ apiKey: input.auth.token, ...(baseURL ? { baseURL } : {}) });
  }

  // Anthropic OAuth requires Claude Code identity in the system prompt; GLM and
  // plain API keys do not.
  const system = isOAuth
    ? [
        { type: "text" as const, text: "You are Claude Code, Anthropic's official CLI for Claude." },
        { type: "text" as const, text: input.systemPrompt },
      ]
    : input.systemPrompt;

  const response = await client.messages.create({
    model: input.model,
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: input.conversationContext }],
  });

  const textContent = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const codeChanges = extractCodeChanges(textContent);
  const tokensUsed =
    (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

  return { content: textContent, codeChanges, tokensUsed };
}
