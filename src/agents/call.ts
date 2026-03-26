import Anthropic from "@anthropic-ai/sdk";
import type { AgentRole, CodeChange, GapsAuth } from "../types.js";

export interface CallAgentInput {
  role: AgentRole;
  systemPrompt: string;
  conversationContext: string;
  auth: GapsAuth;
  model: string;
}

export interface CallAgentResult {
  content: string;
  codeChanges: CodeChange[];
  tokensUsed: number;
}

function isOAuthToken(token: string): boolean {
  return token.includes("sk-ant-oat");
}

export async function callAgent(input: CallAgentInput): Promise<CallAgentResult> {
  let client: Anthropic;

  if (isOAuthToken(input.auth.token)) {
    // OAuth tokens need Bearer auth + Claude Code identity headers
    // (same approach as OpenClaw / pi-ai)
    client = new Anthropic({
      apiKey: null,
      authToken: input.auth.token,
      defaultHeaders: {
        "anthropic-beta": "claude-code-20250219,oauth-2025-04-20,fine-grained-tool-streaming-2025-05-14",
        "user-agent": "claude-cli/2.1.75",
        "x-app": "cli",
        "accept": "application/json",
      },
    });
  } else {
    // Standard API key
    client = new Anthropic({ apiKey: input.auth.token });
  }

  const response = await client.messages.create({
    model: input.model,
    max_tokens: 4096,
    system: input.systemPrompt,
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

function extractCodeChanges(text: string): CodeChange[] {
  const changes: CodeChange[] = [];
  const fileBlockRegex = /FILE:\s*([\w/.\\-]+)\s*\n```[\w]*\n([\s\S]*?)```/g;
  let match;
  while ((match = fileBlockRegex.exec(text)) !== null) {
    changes.push({
      filePath: match[1].trim(),
      content: match[2].trim(),
      action: "create",
    });
  }
  return changes;
}
