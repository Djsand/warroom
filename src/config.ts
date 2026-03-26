import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { GapsConfig, GapsAuth } from "./types.js";

/**
 * Resolve auth credentials. Checks in order:
 * 1. ANTHROPIC_API_KEY env var (direct API key)
 * 2. CLAUDE_CODE_OAUTH_TOKEN env var (setup token)
 * 3. ~/.gaps/credentials.json (stored from `gaps setup`)
 * 4. Claude Code's credential store (~/.claude/.credentials.json)
 */
function resolveAuth(): GapsAuth {
  // 1. Direct API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return { method: "api-key", token: apiKey };
  }

  // 2. Claude Code OAuth token env var
  const oauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN;
  if (oauthToken) {
    return { method: "oauth-token", token: oauthToken };
  }

  // 3. gaps credentials file
  const gapsCredsPath = join(homedir(), ".gaps", "credentials.json");
  if (existsSync(gapsCredsPath)) {
    try {
      const creds = JSON.parse(readFileSync(gapsCredsPath, "utf-8"));
      if (creds.token) {
        return { method: creds.method ?? "oauth-token", token: creds.token };
      }
    } catch {
      // ignore malformed file
    }
  }

  // 4. Claude Code's credential store
  const claudeCredsPath = join(homedir(), ".claude", ".credentials.json");
  if (existsSync(claudeCredsPath)) {
    try {
      const creds = JSON.parse(readFileSync(claudeCredsPath, "utf-8"));
      if (creds.accessToken) {
        return { method: "claude-credentials", token: creds.accessToken };
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

export function loadConfig(): GapsConfig {
  const auth = resolveAuth();

  return {
    auth,
    architectModel: process.env.GAPS_ARCHITECT_MODEL ?? "claude-sonnet-4-6-20250514",
    agentModel: process.env.GAPS_AGENT_MODEL ?? "claude-sonnet-4-6-20250514",
    maxDesignRounds: Number(process.env.GAPS_MAX_DESIGN_ROUNDS ?? 4),
    maxReviewRounds: Number(process.env.GAPS_MAX_REVIEW_ROUNDS ?? 3),
    outputDir: ".gaps",
  };
}
