import { resolveStoredApiKey } from "./auth/oauth.js";
import type { GapsConfig, GapsAuth } from "./types.js";

/**
 * Resolve auth. Checks in order:
 * 1. ANTHROPIC_API_KEY env var
 * 2. CLAUDE_CODE_OAUTH_TOKEN env var
 * 3. ~/.warroom/credentials.json (from `warroom setup`)
 *
 * All tokens are sent as X-Api-Key (same as OpenClaw).
 */
export function loadConfig(): GapsConfig {
  const auth = resolveAuth();

  return {
    auth,
    architectModel: process.env.GAPS_ARCHITECT_MODEL ?? "claude-sonnet-4-6",
    agentModel: process.env.GAPS_AGENT_MODEL ?? "claude-sonnet-4-6",
    maxDesignRounds: Number(process.env.GAPS_MAX_DESIGN_ROUNDS ?? 4),
    maxReviewRounds: Number(process.env.GAPS_MAX_REVIEW_ROUNDS ?? 3),
    outputDir: ".warroom",
  };
}

function resolveAuth(): GapsAuth {
  // 1. API key or setup token from env
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey) {
    return { method: "api-key", token: envKey };
  }

  // 2. OAuth token from env
  const oauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN ?? process.env.ANTHROPIC_AUTH_TOKEN;
  if (oauthToken) {
    return { method: "api-key", token: oauthToken };
  }

  // 3. Stored credentials from `warroom setup`
  const storedKey = resolveStoredApiKey();
  if (storedKey) {
    return { method: "api-key", token: storedKey };
  }

  throw new Error(
    "No authentication found. Set up with one of:\n\n" +
    "  1. warroom setup --token <token>   (paste from `claude setup-token`)\n" +
    "  2. warroom setup --login           (browser OAuth)\n" +
    "  3. export ANTHROPIC_API_KEY=...    (API key)\n\n" +
    "Run `warroom setup` for options."
  );
}
