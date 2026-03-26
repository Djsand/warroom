import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { resolveApiKeyFromSetupToken } from "./auth/oauth.js";
import type { GapsConfig, GapsAuth } from "./types.js";

/**
 * Resolve auth credentials. Checks in order:
 * 1. ANTHROPIC_API_KEY env var (direct API key)
 * 2. ~/.gaps/credentials.json (setup token → OAuth → API key)
 * 3. Claude Code credential store
 */
export async function loadConfig(): Promise<GapsConfig> {
  const auth = await resolveAuth();

  return {
    auth,
    architectModel: process.env.GAPS_ARCHITECT_MODEL ?? "claude-sonnet-4-6-20250514",
    agentModel: process.env.GAPS_AGENT_MODEL ?? "claude-sonnet-4-6-20250514",
    maxDesignRounds: Number(process.env.GAPS_MAX_DESIGN_ROUNDS ?? 4),
    maxReviewRounds: Number(process.env.GAPS_MAX_REVIEW_ROUNDS ?? 3),
    outputDir: ".gaps",
  };
}

async function resolveAuth(): Promise<GapsAuth> {
  // 1. Direct API key (always works)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && !apiKey.startsWith("sk-ant-oat")) {
    return { method: "api-key", token: apiKey };
  }

  // 2. Setup token from env var — exchange for API key via OAuth
  const setupToken = apiKey?.startsWith("sk-ant-oat")
    ? apiKey
    : (process.env.CLAUDE_CODE_OAUTH_TOKEN ?? process.env.ANTHROPIC_AUTH_TOKEN);

  if (setupToken) {
    const resolvedKey = await resolveApiKeyFromSetupToken(setupToken);
    return { method: "oauth-token", token: resolvedKey };
  }

  // 3. Stored setup token from `gaps setup`
  const gapsCredsPath = join(homedir(), ".gaps", "credentials.json");
  if (existsSync(gapsCredsPath)) {
    try {
      const creds = JSON.parse(readFileSync(gapsCredsPath, "utf-8"));
      if (creds.setupToken) {
        const resolvedKey = await resolveApiKeyFromSetupToken(creds.setupToken);
        return { method: "oauth-token", token: resolvedKey };
      }
    } catch {
      // ignore
    }
  }

  // 4. Claude Code credential store
  const claudeCredsPath = join(homedir(), ".claude", ".credentials.json");
  if (existsSync(claudeCredsPath)) {
    try {
      const creds = JSON.parse(readFileSync(claudeCredsPath, "utf-8"));
      if (creds.refreshToken) {
        const resolvedKey = await resolveApiKeyFromSetupToken(creds.refreshToken);
        return { method: "oauth-token", token: resolvedKey };
      }
    } catch {
      // ignore
    }
  }

  throw new Error(
    "No authentication found. Set up with one of:\n\n" +
    "  1. gaps setup              (use your Claude subscription)\n" +
    "  2. export ANTHROPIC_API_KEY=your-key  (use an API key)\n\n" +
    "Run `gaps setup` for the easiest option."
  );
}
