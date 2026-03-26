import { AGENT_EMOJI, AGENT_LABEL } from "../types.js";
import type { Thread } from "./thread.js";

export function renderSummary(thread: Thread, branchName: string): string {
  const lines: string[] = [];
  const stats = thread.getStats();

  lines.push(`# gaps summary — "${thread.task}"`);
  lines.push("");

  lines.push("## Result: COMPLETE");
  lines.push("");

  // What agents debated — challenger and reviewer messages
  const debateMessages = thread.messages.filter(
    (m) => m.role === "challenger" || m.role === "reviewer"
  );

  if (debateMessages.length > 0) {
    lines.push("## Debate Highlights");
    lines.push("");
    for (const msg of debateMessages) {
      const emoji = AGENT_EMOJI[msg.role];
      const label = AGENT_LABEL[msg.role];
      const excerpt = msg.content.length > 120 ? msg.content.slice(0, 120) + "…" : msg.content;
      lines.push(`- **${emoji} ${label}:** ${excerpt}`);
    }
    lines.push("");
  }

  // Stats section
  lines.push("## Stats");
  lines.push("");
  lines.push(`- ${stats.totalMessages} messages`);
  lines.push(`- ${stats.designRevisions} design revisions`);
  lines.push(`- ${stats.bugsCaught} bugs caught`);
  lines.push(`- ${stats.filesChanged} files changed`);
  lines.push(`- ${stats.linesAdded} lines added`);
  lines.push("");

  // Branch name
  lines.push("## Branch");
  lines.push("");
  lines.push(`\`${branchName}\``);

  return lines.join("\n");
}
