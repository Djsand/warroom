import type { CodeChange, GapsAuth } from "../types.js";
import { callAgent } from "../agents/call.js";
import { getSystemPrompt } from "../agents/prompts.js";
import type { Thread } from "../conversation/thread.js";
import { phaseHeader, waitingFor, doneAgent } from "../cli/ui.js";

export interface PhaseConfig {
  auth: GapsAuth;
  architectModel: string;
  agentModel: string;
  maxRounds: number;
  projectContext: string;
}

export async function runDesignPhase(thread: Thread, config: PhaseConfig): Promise<void> {
  console.log(phaseHeader("Phase 1: Design"));
  const task = thread.task;

  for (let round = 0; round < config.maxRounds; round++) {
    console.log(waitingFor("architect"));
    const architectResult = await callAgent({
      role: "architect",
      systemPrompt: getSystemPrompt("architect", task, config.projectContext),
      conversationContext: thread.toPromptContext() || `Task: ${task}`,
      auth: config.auth,
      model: config.architectModel,
    });
    thread.add({ role: "architect", content: architectResult.content, phase: "design" });
    console.log(doneAgent("architect", architectResult.content));

    if (architectResult.content.toLowerCase().includes("@builder")) {
      console.log(waitingFor("challenger"));
      const challengerFinalResult = await callAgent({
        role: "challenger",
        systemPrompt: getSystemPrompt("challenger", task, config.projectContext),
        conversationContext: thread.toPromptContext(),
        auth: config.auth,
        model: config.agentModel,
      });
      thread.add({ role: "challenger", content: challengerFinalResult.content, phase: "design" });
      console.log(doneAgent("challenger", challengerFinalResult.content));
      break;
    }

    console.log(waitingFor("challenger"));
    const challengerResult = await callAgent({
      role: "challenger",
      systemPrompt: getSystemPrompt("challenger", task, config.projectContext),
      conversationContext: thread.toPromptContext(),
      auth: config.auth,
      model: config.agentModel,
    });
    thread.add({ role: "challenger", content: challengerResult.content, phase: "design" });
    console.log(doneAgent("challenger", challengerResult.content));

    if (challengerResult.content.toLowerCase().includes("design approved")) break;
  }
}

export async function runBuildPhase(thread: Thread, config: PhaseConfig): Promise<CodeChange[]> {
  console.log(phaseHeader("Phase 2: Build"));
  console.log(waitingFor("builder"));
  const builderResult = await callAgent({
    role: "builder",
    systemPrompt: getSystemPrompt("builder", thread.task, config.projectContext),
    conversationContext:
      thread.toPromptContext() +
      "\n\nIMPORTANT: Output every file using the format:\nFILE: path/to/file.ext\n```language\n// code here\n```",
    auth: config.auth,
    model: config.agentModel,
  });
  thread.add({ role: "builder", content: builderResult.content, phase: "build", codeChanges: builderResult.codeChanges });
  console.log(doneAgent("builder", builderResult.content));
  const fileCount = builderResult.codeChanges.length;
  console.log(`  ${fileCount} file${fileCount === 1 ? "" : "s"} written`);
  return builderResult.codeChanges;
}

export async function runReviewPhase(thread: Thread, config: PhaseConfig): Promise<boolean> {
  console.log(phaseHeader("Phase 3: Review"));

  console.log(waitingFor("reviewer"));
  const reviewerResult = await callAgent({
    role: "reviewer",
    systemPrompt: getSystemPrompt("reviewer", thread.task, config.projectContext),
    conversationContext: thread.toPromptContext(),
    auth: config.auth,
    model: config.agentModel,
  });
  thread.add({ role: "reviewer", content: reviewerResult.content, phase: "review" });
  console.log(doneAgent("reviewer", reviewerResult.content));

  console.log(waitingFor("breaker"));
  const breakerResult = await callAgent({
    role: "breaker",
    systemPrompt: getSystemPrompt("breaker", thread.task, config.projectContext),
    conversationContext: thread.toPromptContext(),
    auth: config.auth,
    model: config.agentModel,
  });
  thread.add({ role: "breaker", content: breakerResult.content, phase: "review" });
  console.log(doneAgent("breaker", breakerResult.content));

  const reviewerApproved = reviewerResult.content.toLowerCase().includes("lgtm");
  const breakerApproved = breakerResult.content.toLowerCase().includes("passed");
  return reviewerApproved && breakerApproved;
}
