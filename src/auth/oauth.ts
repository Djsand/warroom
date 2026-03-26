import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import {
  loginAnthropic,
  anthropicOAuthProvider,
  type OAuthCredentials,
} from "@mariozechner/pi-ai/oauth";

const WARROOM_DIR = join(homedir(), ".warroom");
const CREDS_PATH = join(WARROOM_DIR, "credentials.json");

interface StoredCredentials {
  token: string;
  type: "setup-token" | "api-key" | "oauth";
  oauthCredentials?: OAuthCredentials;
  savedAt: string;
}

function loadStored(): StoredCredentials | null {
  if (!existsSync(CREDS_PATH)) return null;
  try {
    const data = JSON.parse(readFileSync(CREDS_PATH, "utf-8"));
    if (data.token) return data as StoredCredentials;
    return null;
  } catch {
    return null;
  }
}

function saveStored(stored: StoredCredentials): void {
  mkdirSync(WARROOM_DIR, { recursive: true });
  writeFileSync(CREDS_PATH, JSON.stringify(stored, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
}

/**
 * Get the API key to use. Setup tokens are sent directly as X-Api-Key
 * (same as OpenClaw does — no OAuth exchange needed).
 */
export function resolveStoredApiKey(): string | null {
  const stored = loadStored();
  if (!stored) return null;

  // Setup tokens and API keys are sent directly as X-Api-Key
  if (stored.type === "setup-token" || stored.type === "api-key") {
    return stored.token;
  }

  // OAuth credentials from browser login — use the access token
  if (stored.type === "oauth" && stored.oauthCredentials) {
    return anthropicOAuthProvider.getApiKey(stored.oauthCredentials);
  }

  return stored.token;
}

/**
 * Interactive login flow — opens browser for OAuth
 */
export async function loginInteractive(): Promise<void> {
  const credentials = await loginAnthropic({
    onAuth: (info) => {
      console.log(`\nOpen this URL to authenticate:\n  ${info.url}\n`);
      if (info.instructions) console.log(info.instructions);
    },
    onPrompt: async (prompt) => {
      console.log(prompt.message);
      return "";
    },
    onProgress: (message) => {
      console.log(`  ${message}`);
    },
  });

  saveStored({
    token: credentials.access,
    type: "oauth",
    oauthCredentials: credentials,
    savedAt: new Date().toISOString(),
  });
}

/**
 * Store a setup token from `claude setup-token`.
 * The token is used directly as X-Api-Key (same as OpenClaw).
 */
export function storeSetupToken(token: string): void {
  saveStored({
    token,
    type: "setup-token",
    savedAt: new Date().toISOString(),
  });
}

export function hasStoredCredentials(): boolean {
  return loadStored() !== null;
}

export function clearCredentials(): void {
  if (existsSync(CREDS_PATH)) {
    writeFileSync(CREDS_PATH, "{}", "utf-8");
  }
}
