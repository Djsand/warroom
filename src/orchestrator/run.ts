import type { GapsResult, GapsAuth } from "../types.js";
import { Thread } from "../conversation/thread.js";
import { renderConversation } from "../conversation/renderer.js";
import { renderSummary } from "../conversation/summary.js";
import { writeCodeChanges } from "../execution/code-writer.js";
import { runDesignPhase, runBuildPhase, runReviewPhase } from "./phases.js";

export interface RunGapsInput {
  task: string;
  auth: GapsAuth;
  projectDir: string;
  projectContext: string;
  architectModel?: string;
  agentModel?: string;
  maxDesignRounds?: number;
  maxReviewRounds?: number;
}

export interface RunGapsOutput extends GapsResult {
  conversationMd: string;
  summaryMd: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function runGaps(input: RunGapsInput): Promise<RunGapsOutput> {
  const {
    task,
    auth,
    projectDir,
    projectContext,
    architectModel = "claude-sonnet-4-6-20250514",
    agentModel = "claude-sonnet-4-6-20250514",
    maxDesignRounds = 4,
    maxReviewRounds = 2,
  } = input;

  const thread = new Thread(task);
  const startedAt = thread.startedAt;

  const branchName = `warroom/${slugify(task)}-${formatDate(startedAt)}`;

  const phaseConfig = {
    auth,
    architectModel,
    agentModel,
    maxRounds: maxDesignRounds,
    projectContext,
  };

  // Phase 1: Design
  await runDesignPhase(thread, phaseConfig);

  // Phase 2: Build
  let codeChanges = await runBuildPhase(thread, phaseConfig);

  if (codeChanges.length > 0) {
    writeCodeChanges(projectDir, codeChanges);
  }

  // Phase 3: Review loop
  for (let reviewRound = 0; reviewRound < maxReviewRounds; reviewRound++) {
    const approved = await runReviewPhase(thread, phaseConfig);
    if (approved) {
      break;
    }

    // Not approved — rebuild and try again (if not on last review round)
    if (reviewRound < maxReviewRounds - 1) {
      codeChanges = await runBuildPhase(thread, phaseConfig);
      if (codeChanges.length > 0) {
        writeCodeChanges(projectDir, codeChanges);
      }
    }
  }

  const finishedAt = new Date();
  const stats = thread.getStats();

  const conversationMd = renderConversation(thread);
  const summaryMd = renderSummary(thread, branchName);

  return {
    task,
    messages: thread.messages,
    branch: branchName,
    startedAt,
    finishedAt,
    stats,
    conversationMd,
    summaryMd,
  };
}
