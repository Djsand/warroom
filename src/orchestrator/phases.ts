import type { CodeChange } from "../types.js";
import { callAgent } from "../agents/call.js";
import { getSystemPrompt } from "../agents/prompts.js";
import type { Thread } from "../conversation/thread.js";

export interface PhaseConfig {
  apiKey: string;
  architectModel: string;
  agentModel: string;
  maxRounds: number;
  projectContext: string;
}

export async function runDesignPhase(thread: Thread, config: PhaseConfig): Promise<void> {
  const task = thread.task;

  for (let round = 0; round < config.maxRounds; round++) {
    // Architect turn
    const architectResult = await callAgent({
      role: "architect",
      systemPrompt: getSystemPrompt("architect", task, config.projectContext),
      conversationContext: thread.toPromptContext() || `Task: ${task}`,
      apiKey: config.apiKey,
      model: config.architectModel,
    });

    thread.add({
      role: "architect",
      content: architectResult.content,
      phase: "design",
    });

    // Stop if Architect signals Builder to proceed
    if (architectResult.content.toLowerCase().includes("@builder")) {
      // Give Challenger one final say
      const challengerFinalResult = await callAgent({
        role: "challenger",
        systemPrompt: getSystemPrompt("challenger", task, config.projectContext),
        conversationContext: thread.toPromptContext(),
        apiKey: config.apiKey,
        model: config.agentModel,
      });

      thread.add({
        role: "challenger",
        content: challengerFinalResult.content,
        phase: "design",
      });

      break;
    }

    // Challenger turn
    const challengerResult = await callAgent({
      role: "challenger",
      systemPrompt: getSystemPrompt("challenger", task, config.projectContext),
      conversationContext: thread.toPromptContext(),
      apiKey: config.apiKey,
      model: config.agentModel,
    });

    thread.add({
      role: "challenger",
      content: challengerResult.content,
      phase: "design",
    });

    // Stop if Challenger approves
    if (challengerResult.content.toLowerCase().includes("design approved")) {
      break;
    }
  }
}

export async function runBuildPhase(thread: Thread, config: PhaseConfig): Promise<CodeChange[]> {
  const task = thread.task;

  const builderResult = await callAgent({
    role: "builder",
    systemPrompt: getSystemPrompt("builder", task, config.projectContext),
    conversationContext:
      thread.toPromptContext() +
      "\n\nIMPORTANT: Output every file using the format:\nFILE: path/to/file.ext\n```language\n// code here\n```",
    apiKey: config.apiKey,
    model: config.agentModel,
  });

  thread.add({
    role: "builder",
    content: builderResult.content,
    phase: "build",
    codeChanges: builderResult.codeChanges,
  });

  return builderResult.codeChanges;
}

export async function runReviewPhase(thread: Thread, config: PhaseConfig): Promise<boolean> {
  const task = thread.task;

  // Reviewer turn
  const reviewerResult = await callAgent({
    role: "reviewer",
    systemPrompt: getSystemPrompt("reviewer", task, config.projectContext),
    conversationContext: thread.toPromptContext(),
    apiKey: config.apiKey,
    model: config.agentModel,
  });

  thread.add({
    role: "reviewer",
    content: reviewerResult.content,
    phase: "review",
  });

  // Breaker turn
  const breakerResult = await callAgent({
    role: "breaker",
    systemPrompt: getSystemPrompt("breaker", task, config.projectContext),
    conversationContext: thread.toPromptContext(),
    apiKey: config.apiKey,
    model: config.agentModel,
  });

  thread.add({
    role: "breaker",
    content: breakerResult.content,
    phase: "review",
  });

  const reviewerApproved = reviewerResult.content.toLowerCase().includes("lgtm");
  const breakerApproved = breakerResult.content.toLowerCase().includes("passed");

  return reviewerApproved && breakerApproved;
}
