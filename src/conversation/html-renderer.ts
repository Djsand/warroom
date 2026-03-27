import type { AgentRole, Phase } from "../types.js";
import { AGENT_EMOJI, AGENT_LABEL } from "../types.js";
import type { Thread } from "./thread.js";

const PHASE_ORDER: Phase[] = ["design", "build", "review", "finalize"];

const PHASE_LABELS: Readonly<Record<Phase, string>> = {
  design: "Design",
  build: "Build",
  review: "Review",
  finalize: "Finalize",
};

const AGENT_COLORS: Readonly<Record<AgentRole, string>> = {
  architect: "#3b82f6",
  challenger: "#f97316",
  builder: "#22c55e",
  reviewer: "#a855f7",
  breaker: "#eab308",
};

const AGENT_BG_COLORS: Readonly<Record<AgentRole, string>> = {
  architect: "#eff6ff",
  challenger: "#fff7ed",
  builder: "#f0fdf4",
  reviewer: "#faf5ff",
  breaker: "#fefce8",
};

const WORDS_PER_MINUTE = 200;
const AVG_WORDS_PER_MESSAGE = 50;

function estimateMinutes(messageCount: number): number {
  return Math.max(1, Math.round((messageCount * AVG_WORDS_PER_MESSAGE) / WORDS_PER_MINUTE));
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMessageContent(content: string): string {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let result = "";
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index);
    if (before) {
      result += `<p>${escapeHtml(before).replace(/\n/g, "<br>")}</p>`;
    }

    const language = match[1] ?? "";
    const code = escapeHtml(match[2]);
    result += `<div class="code-block"><div class="code-lang">${escapeHtml(language)}</div><pre><code>${code}</code></pre></div>`;
    lastIndex = match.index + match[0].length;
  }

  const remaining = content.slice(lastIndex);
  if (remaining) {
    result += `<p>${escapeHtml(remaining).replace(/\n/g, "<br>")}</p>`;
  }

  return result;
}

function renderParticipants(roles: readonly AgentRole[]): string {
  return roles
    .map((role) => {
      const color = AGENT_COLORS[role];
      return `<span class="participant" style="border-color:${color};color:${color}">${AGENT_EMOJI[role]} ${AGENT_LABEL[role]}</span>`;
    })
    .join("");
}

function renderMessages(thread: Thread, phase: Phase): string {
  const messages = thread.messagesForPhase(phase);
  return messages
    .map((msg) => {
      const color = AGENT_COLORS[msg.role];
      const bgColor = AGENT_BG_COLORS[msg.role];
      const time = msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `<div class="message" style="border-left-color:${color};background:${bgColor}">
  <div class="message-header">
    <span class="avatar" style="background:${color}">${AGENT_EMOJI[msg.role]}</span>
    <strong>${escapeHtml(AGENT_LABEL[msg.role])}</strong>
    <time>${escapeHtml(time)}</time>
  </div>
  <div class="message-body">${renderMessageContent(msg.content)}</div>
</div>`;
    })
    .join("\n");
}

export function renderConversationHtml(thread: Thread): string {
  const uniqueRoles = [...new Set(thread.messages.map((m) => m.role))];
  const phasesPresent = PHASE_ORDER.filter(
    (phase) => thread.messagesForPhase(phase).length > 0
  );

  const stats = thread.getStats();
  const uniqueAgents = new Set(thread.messages.map((m) => m.role)).size;
  const totalMinutes = estimateMinutes(stats.totalMessages);

  let phaseSections = "";
  let phaseNumber = 1;
  for (const phase of phasesPresent) {
    const messages = thread.messagesForPhase(phase);
    const label = PHASE_LABELS[phase];
    const count = messages.length;
    const minutes = estimateMinutes(count);

    phaseSections += `
    <section class="phase">
      <h2>Phase ${phaseNumber}: ${escapeHtml(label)} <small>(${count} messages, ~${minutes} min)</small></h2>
      ${renderMessages(thread, phase)}
    </section>`;
    phaseNumber++;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>warroom — ${escapeHtml(thread.task)}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#1e293b;background:#f8fafc;padding:2rem 1rem}
.container{max-width:48rem;margin:0 auto}
h1{font-size:1.5rem;margin-bottom:0.25rem}
.subtitle{color:#64748b;margin-bottom:1.5rem}
.participants{display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:2rem}
.participant{display:inline-flex;align-items:center;gap:0.25rem;padding:0.25rem 0.75rem;border:2px solid;border-radius:9999px;font-size:0.875rem;font-weight:600}
.phase{margin-bottom:2rem}
.phase h2{font-size:1.125rem;margin-bottom:1rem;padding-bottom:0.5rem;border-bottom:1px solid #e2e8f0}
.phase h2 small{font-weight:400;color:#64748b;font-size:0.875rem}
.message{border-left:4px solid;border-radius:0.5rem;padding:1rem;margin-bottom:0.75rem}
.message-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem}
.avatar{width:1.75rem;height:1.75rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.875rem;flex-shrink:0}
.message-header strong{font-size:0.875rem}
.message-header time{margin-left:auto;font-size:0.75rem;color:#94a3b8}
.message-body p{margin-bottom:0.5rem}
.message-body p:last-child{margin-bottom:0}
.code-block{background:#1e293b;border-radius:0.5rem;margin:0.75rem 0;overflow-x:auto}
.code-lang{padding:0.25rem 0.75rem;font-size:0.7rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em}
.code-block pre{padding:0.75rem;margin:0}
.code-block code{color:#e2e8f0;font-family:"SF Mono",SFMono-Regular,Consolas,"Liberation Mono",Menlo,monospace;font-size:0.8125rem;line-height:1.5;white-space:pre;tab-size:2}
.stats{border-top:2px solid #e2e8f0;padding-top:1rem;margin-top:2rem;color:#64748b;font-size:0.875rem;text-align:center}
@media(max-width:640px){body{padding:1rem 0.5rem}.message{padding:0.75rem}}
</style>
</head>
<body>
<div class="container">
  <h1>warroom — "${escapeHtml(thread.task)}"</h1>
  <p class="subtitle">Conversation transcript</p>

  <div class="participants">
    ${renderParticipants(uniqueRoles)}
  </div>

  ${phaseSections}

  <footer class="stats">
    ${uniqueAgents} agents &middot; ${stats.totalMessages} messages &middot; ${stats.designRevisions} design revisions &middot; ${stats.bugsCaught} bugs caught &middot; ${stats.filesChanged} files &middot; ${stats.linesAdded} lines &middot; ~${totalMinutes} min
  </footer>
</div>
</body>
</html>`;
}
