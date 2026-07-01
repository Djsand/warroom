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

export const AGENT_TAG: Record<AgentRole, string> = {
  architect: "ARC",
  challenger: "CHL",
  builder: "BLD",
  reviewer: "REV",
  breaker: "BRK",
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

export type AuthMethod = "api-key" | "oauth-token" | "claude-credentials";

/** Which model backend an agent talks to. */
export type Provider = "anthropic" | "codex" | "glm";

export interface GapsAuth {
  /** Which backend this token is for. Defaults to "anthropic" when omitted. */
  provider?: Provider;
  method: AuthMethod;
  token: string;
  /**
   * Override the API endpoint. Used by Anthropic-compatible backends such as
   * the Z.ai GLM coding plan (https://api.z.ai/api/anthropic).
   */
  baseUrl?: string;
}

/** How a single agent should be run: which credentials and which model. */
export interface AgentAssignment {
  auth: GapsAuth;
  model: string;
}

export interface GapsConfig {
  auth: GapsAuth;
  provider: Provider;
  architectModel: string;
  agentModel: string;
  maxDesignRounds: number;
  maxReviewRounds: number;
  outputDir: string;
  /**
   * Optional cross-model debate. When set, the listed roles run on a second
   * provider/model while the rest run on the primary one — Claude vs GPT in
   * the same war room.
   */
  versus?: VersusConfig | null;
}

export interface VersusConfig {
  /** Credentials for the opposing side. */
  auth: GapsAuth;
  /** Model the opposing side argues with. */
  model: string;
  /** Roles that switch to the opposing side. */
  roles: AgentRole[];
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
