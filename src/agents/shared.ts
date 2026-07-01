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

/** Parse `FILE: path` + fenced code blocks out of an agent's response. */
export function extractCodeChanges(text: string): CodeChange[] {
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
