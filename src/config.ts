import type { GapsConfig } from "./types.js";

export function loadConfig(): GapsConfig {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is required.\n" +
      "Get your key at https://console.anthropic.com/settings/keys"
    );
  }

  return {
    apiKey,
    architectModel: process.env.GAPS_ARCHITECT_MODEL ?? "claude-sonnet-4-6-20250514",
    agentModel: process.env.GAPS_AGENT_MODEL ?? "claude-sonnet-4-6-20250514",
    maxDesignRounds: Number(process.env.GAPS_MAX_DESIGN_ROUNDS ?? 4),
    maxReviewRounds: Number(process.env.GAPS_MAX_REVIEW_ROUNDS ?? 3),
    outputDir: ".gaps",
  };
}
