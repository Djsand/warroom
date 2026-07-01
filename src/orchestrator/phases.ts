import type { AgentAssignment, AgentRole, CodeChange, GapsAuth, VersusConfig } from "../types.js";
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
  /** When set, listed roles run on the opposing provider/model. */
  versus?: VersusConfig | null;
}

/** Decide which credentials + model a given role runs on. */
export function agentFor(role: AgentRole, config: PhaseConfig): AgentAssignment {
  if (config.versus && config.versus.roles.includes(role)) {
    return { auth: config.versus.auth, model: config.versus.model };
  }
  const model = role === "architect" ? config.architectModel : config.agentModel;
  return { auth: config.auth, model };
}

/** Short model tag to display next to an agent — only shown in cross-model runs. */
function tagFor(role: AgentRole, config: PhaseConfig): string | undefined {
  if (!config.versus) return undefined;
  return agentFor(role, config).model;
}

async function runAgent(role: AgentRole, thread: Thread, config: PhaseConfig, context: string) {
  const assignment = agentFor(role, config);
  const tag = tagFor(role, config);
  console.log(waitingFor(role, tag));
  const result = await callAgent({
    role,
    systemPrompt: getSystemPrompt(role, thread.task, config.projectContext),
    conversationContext: context,
    auth: assignment.auth,
    model: assignment.model,
  });
  console.log(doneAgent(role, result.content, tag));
  return result;
}

export async function runDesignPhase(thread: Thread, config: PhaseConfig): Promise<void> {
  console.log(phaseHeader("Phase 1: Design"));
  const task = thread.task;

  for (let round = 0; round < config.maxRounds; round++) {
    const architectResult = await runAgent(
      "architect",
      thread,
      config,
      thread.toPromptContext() || `Task: ${task}`,
    );
    thread.add({ role: "architect", content: architectResult.content, phase: "design" });

    const challengerResult = await runAgent("challenger", thread, config, thread.toPromptContext());
    thread.add({ role: "challenger", content: challengerResult.content, phase: "design" });

    if (architectResult.content.toLowerCase().includes("@builder")) break;
    if (challengerResult.content.toLowerCase().includes("design approved")) break;
  }
}

export async function runBuildPhase(thread: Thread, config: PhaseConfig): Promise<CodeChange[]> {
  console.log(phaseHeader("Phase 2: Build"));
  const builderResult = await runAgent(
    "builder",
    thread,
    config,
    thread.toPromptContext() +
      "\n\nIMPORTANT: Output every file using the format:\nFILE: path/to/file.ext\n```language\n// code here\n```",
  );
  thread.add({
    role: "builder",
    content: builderResult.content,
    phase: "build",
    codeChanges: builderResult.codeChanges,
  });
  const fileCount = builderResult.codeChanges.length;
  console.log(`  ${fileCount} file${fileCount === 1 ? "" : "s"} written`);
  return builderResult.codeChanges;
}

export async function runReviewPhase(thread: Thread, config: PhaseConfig): Promise<boolean> {
  console.log(phaseHeader("Phase 3: Review"));

  const reviewerResult = await runAgent("reviewer", thread, config, thread.toPromptContext());
  thread.add({ role: "reviewer", content: reviewerResult.content, phase: "review" });

  const breakerResult = await runAgent("breaker", thread, config, thread.toPromptContext());
  thread.add({ role: "breaker", content: breakerResult.content, phase: "review" });

  const reviewerApproved = reviewerResult.content.toLowerCase().includes("lgtm");
  const breakerApproved = breakerResult.content.toLowerCase().includes("passed");
  return reviewerApproved && breakerApproved;
}
