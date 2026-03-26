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

export async function callAgent(input: CallAgentInput): Promise<CallAgentResult> {
  const clientOptions: ConstructorParameters<typeof Anthropic>[0] = {};

  if (input.auth.method === "api-key") {
    clientOptions.apiKey = input.auth.token;
  } else {
    // OAuth token — send ONLY as Bearer auth, suppress X-Api-Key
    clientOptions.authToken = input.auth.token;
    clientOptions.apiKey = null;
  }

  const client = new Anthropic(clientOptions);

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
