import type { CodeChange, GapsAuth } from "../types.js";
import { callAgent } from "../agents/call.js";
import { getSystemPrompt } from "../agents/prompts.js";
import { AGENT_EMOJI, AGENT_LABEL } from "../types.js";
import type { AgentRole } from "../types.js";
import type { Thread } from "../conversation/thread.js";

function logAgent(role: AgentRole, content: string): void {
  const emoji = AGENT_EMOJI[role];
  const label = AGENT_LABEL[role];
  const short = content.replace(/\n/g, " ").slice(0, 80);
  console.log(`  ${emoji} ${label}: ${short}${content.length > 80 ? "..." : ""}`);
}

function logPhase(name: string): void {
  console.log(`\n  --- ${name} ---\n`);
}

export interface PhaseConfig {
  auth: GapsAuth;
  architectModel: string;
  agentModel: string;
  maxRounds: number;
  projectContext: string;
}

export async function runDesignPhase(thread: Thread, config: PhaseConfig): Promise<void> {
  logPhase("Phase 1: Design");
  const task = thread.task;

  for (let round = 0; round < config.maxRounds; round++) {
    console.log(`  Waiting for Architect...`);
    const architectResult = await callAgent({
      role: "architect",
      systemPrompt: getSystemPrompt("architect", task, config.projectContext),
      conversationContext: thread.toPromptContext() || `Task: ${task}`,
      auth: config.auth,
      model: config.architectModel,
    });
    thread.add({ role: "architect", content: architectResult.content, phase: "design" });
    logAgent("architect", architectResult.content);

    if (architectResult.content.toLowerCase().includes("@builder")) {
      console.log(`  Waiting for Challenger (final review)...`);
      const challengerFinalResult = await callAgent({
        role: "challenger",
        systemPrompt: getSystemPrompt("challenger", task, config.projectContext),
        conversationContext: thread.toPromptContext(),
        auth: config.auth,
        model: config.agentModel,
      });
      thread.add({ role: "challenger", content: challengerFinalResult.content, phase: "design" });
      logAgent("challenger", challengerFinalResult.content);
      break;
    }

    console.log(`  Waiting for Challenger...`);
    const challengerResult = await callAgent({
      role: "challenger",
      systemPrompt: getSystemPrompt("challenger", task, config.projectContext),
      conversationContext: thread.toPromptContext(),
      auth: config.auth,
      model: config.agentModel,
    });
    thread.add({ role: "challenger", content: challengerResult.content, phase: "design" });
    logAgent("challenger", challengerResult.content);

    if (challengerResult.content.toLowerCase().includes("design approved")) break;
  }
}

export async function runBuildPhase(thread: Thread, config: PhaseConfig): Promise<CodeChange[]> {
  logPhase("Phase 2: Build");
  console.log(`  Waiting for Builder...`);
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
  logAgent("builder", builderResult.content);
  console.log(`  Files: ${builderResult.codeChanges.length}`);
  return builderResult.codeChanges;
}

export async function runReviewPhase(thread: Thread, config: PhaseConfig): Promise<boolean> {
  logPhase("Phase 3: Review");

  console.log(`  Waiting for Reviewer...`);
  const reviewerResult = await callAgent({
    role: "reviewer",
    systemPrompt: getSystemPrompt("reviewer", thread.task, config.projectContext),
    conversationContext: thread.toPromptContext(),
    auth: config.auth,
    model: config.agentModel,
  });
  thread.add({ role: "reviewer", content: reviewerResult.content, phase: "review" });
  logAgent("reviewer", reviewerResult.content);

  console.log(`  Waiting for Breaker...`);
  const breakerResult = await callAgent({
    role: "breaker",
    systemPrompt: getSystemPrompt("breaker", thread.task, config.projectContext),
    conversationContext: thread.toPromptContext(),
    auth: config.auth,
    model: config.agentModel,
  });
  thread.add({ role: "breaker", content: breakerResult.content, phase: "review" });
  logAgent("breaker", breakerResult.content);

  const reviewerApproved = reviewerResult.content.toLowerCase().includes("lgtm");
  const breakerApproved = breakerResult.content.toLowerCase().includes("passed");
  return reviewerApproved && breakerApproved;
}
