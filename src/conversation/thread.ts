import type { AgentRole, Phase, ConversationMessage, CodeChange, ConversationStats } from "../types.js";
import { AGENT_LABEL, AGENT_EMOJI } from "../types.js";

interface AddMessageInput {
  role: AgentRole;
  content: string;
  phase: Phase;
  codeChanges?: CodeChange[];
}

export class Thread {
  readonly task: string;
  readonly messages: ConversationMessage[] = [];
  readonly startedAt: Date;

  constructor(task: string) {
    this.task = task;
    this.startedAt = new Date();
  }

  add(input: AddMessageInput): ConversationMessage {
    const message: ConversationMessage = {
      role: input.role,
      content: input.content,
      phase: input.phase,
      timestamp: new Date(),
      codeChanges: input.codeChanges,
    };
    this.messages.push(message);
    return message;
  }

  messagesForPhase(phase: Phase): ConversationMessage[] {
    return this.messages.filter((m) => m.phase === phase);
  }

  toPromptContext(): string {
    return this.messages
      .map((m) => `**${AGENT_EMOJI[m.role]} ${AGENT_LABEL[m.role]}:** ${m.content}`)
      .join("\n\n");
  }

  getStats(): ConversationStats {
    const allCodeChanges = this.messages.flatMap((m) => m.codeChanges ?? []);
    const totalLines = allCodeChanges.reduce(
      (sum, c) => sum + c.content.split("\n").length,
      0
    );

    return {
      totalMessages: this.messages.length,
      designRevisions: this.messagesForPhase("design").filter((m) => m.role === "architect").length,
      bugsCaught: this.messagesForPhase("review").filter(
        (m) => m.content.toLowerCase().includes("bug") ||
               m.content.toLowerCase().includes("issue") ||
               m.content.toLowerCase().includes("found")
      ).length,
      filesChanged: allCodeChanges.length,
      linesAdded: totalLines,
      durationMs: Date.now() - this.startedAt.getTime(),
    };
  }
}
