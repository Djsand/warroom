export type AgentRole = "architect" | "challenger" | "builder" | "reviewer" | "breaker";

export type Phase = "design" | "build" | "review" | "finalize";

export const AGENT_EMOJI: Record<AgentRole, string> = {
  architect: "\u{1F3D7}\uFE0F",
  challenger: "\u{1F608}",
  builder: "\u{1F4BB}",
  reviewer: "\u{1F50D}",
  breaker: "\u{1F9EA}",
};

export const AGENT_LABEL: Record<AgentRole, string> = {
  architect: "Architect",
  challenger: "Challenger",
  builder: "Builder",
  reviewer: "Reviewer",
  breaker: "Breaker",
};

export interface ConversationMessage {
  role: AgentRole;
  content: string;
  phase: Phase;
  timestamp: Date;
  codeChanges?: CodeChange[];
}

export interface CodeChange {
  filePath: string;
  content: string;
  action: "create" | "modify";
}

export interface GapsConfig {
  apiKey: string;
  architectModel: string;
  agentModel: string;
  maxDesignRounds: number;
  maxReviewRounds: number;
  outputDir: string;
}

export interface GapsResult {
  task: string;
  messages: ConversationMessage[];
  branch: string;
  startedAt: Date;
  finishedAt: Date;
  stats: ConversationStats;
}

export interface ConversationStats {
  totalMessages: number;
  designRevisions: number;
  bugsCaught: number;
  filesChanged: number;
  linesAdded: number;
  durationMs: number;
}
