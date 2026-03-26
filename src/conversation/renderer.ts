import type { Phase } from "../types.js";
import { AGENT_EMOJI, AGENT_LABEL } from "../types.js";
import type { Thread } from "./thread.js";

const PHASE_ORDER: Phase[] = ["design", "build", "review", "finalize"];

const PHASE_LABELS: Record<Phase, string> = {
  design: "Design",
  build: "Build",
  review: "Review",
  finalize: "Finalize",
};

const WORDS_PER_MINUTE = 200;
const AVG_WORDS_PER_MESSAGE = 50;

function estimateMinutes(messageCount: number): number {
  return Math.max(1, Math.round((messageCount * AVG_WORDS_PER_MESSAGE) / WORDS_PER_MINUTE));
}

export function renderConversation(thread: Thread): string {
  const lines: string[] = [];

  lines.push(`# gaps conversation — "${thread.task}"`);
  lines.push("");

  // Participants section
  const uniqueRoles = [...new Set(thread.messages.map((m) => m.role))];
  if (uniqueRoles.length > 0) {
    lines.push("## Participants");
    lines.push("");
    for (const role of uniqueRoles) {
      lines.push(`- ${AGENT_EMOJI[role]} **${AGENT_LABEL[role]}**`);
    }
    lines.push("");
  }

  // Messages grouped by phase
  const phasesPresent = PHASE_ORDER.filter(
    (phase) => thread.messagesForPhase(phase).length > 0
  );

  let phaseNumber = 1;
  for (const phase of phasesPresent) {
    const messages = thread.messagesForPhase(phase);
    const label = PHASE_LABELS[phase];
    const count = messages.length;
    const minutes = estimateMinutes(count);

    lines.push(`## Phase ${phaseNumber}: ${label} (${count} messages, ~${minutes} min)`);
    lines.push("");

    for (const msg of messages) {
      const emoji = AGENT_EMOJI[msg.role];
      const label = AGENT_LABEL[msg.role];
      lines.push(`**${emoji} ${label}:** ${msg.content}`);
      lines.push("");
    }

    phaseNumber++;
  }

  // Stats footer
  const stats = thread.getStats();
  const uniqueAgents = new Set(thread.messages.map((m) => m.role)).size;
  const totalMinutes = estimateMinutes(stats.totalMessages);

  lines.push("---");
  lines.push(
    `${uniqueAgents} agents · ${stats.totalMessages} messages · ${stats.designRevisions} design revisions · ${stats.bugsCaught} bugs caught · ${stats.filesChanged} files · ${stats.linesAdded} lines · ~${totalMinutes} min`
  );

  return lines.join("\n");
}
