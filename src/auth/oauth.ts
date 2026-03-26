import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import {
  refreshAnthropicToken,
  anthropicOAuthProvider,
  loginAnthropic,
  type OAuthCredentials,
} from "@mariozechner/pi-ai/oauth";

const GAPS_DIR = join(homedir(), ".gaps");
const CREDS_PATH = join(GAPS_DIR, "credentials.json");

interface StoredCredentials {
  setupToken: string;
  oauthCredentials?: OAuthCredentials;
  savedAt: string;
}

function loadStored(): StoredCredentials | null {
  if (!existsSync(CREDS_PATH)) return null;
  try {
    const data = JSON.parse(readFileSync(CREDS_PATH, "utf-8"));
    if (data.setupToken) return data as StoredCredentials;
    return null;
  } catch {
    return null;
  }
}

function saveStored(stored: StoredCredentials): void {
  mkdirSync(GAPS_DIR, { recursive: true });
  writeFileSync(CREDS_PATH, JSON.stringify(stored, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
}

/**
 * Exchange a setup token for an API key.
 * Caches the OAuth credentials and auto-refreshes when expired.
 */
export async function resolveApiKeyFromSetupToken(setupToken: string): Promise<string> {
  let stored = loadStored();

  // If we have cached credentials that aren't expired, use them
  if (stored?.oauthCredentials && Date.now() < stored.oauthCredentials.expires) {
    return anthropicOAuthProvider.getApiKey(stored.oauthCredentials);
  }

  // Refresh using the setup token (which IS the refresh token)
  const credentials = await refreshAnthropicToken(
    stored?.oauthCredentials?.refresh ?? setupToken
  );

  // Cache the new credentials
  saveStored({
    setupToken,
    oauthCredentials: credentials,
    savedAt: new Date().toISOString(),
  });

  return anthropicOAuthProvider.getApiKey(credentials);
}

/**
 * Interactive login flow — opens browser for OAuth
 */
export async function loginInteractive(): Promise<string> {
  const credentials = await loginAnthropic({
    onAuth: (info) => {
      console.log(`\nOpen this URL to authenticate:\n  ${info.url}\n`);
      if (info.instructions) console.log(info.instructions);
    },
    onPrompt: async (prompt) => {
      // For non-interactive, this won't be called in normal flow
      console.log(prompt.message);
      return "";
    },
    onProgress: (message) => {
      console.log(`  ${message}`);
    },
  });

  saveStored({
    setupToken: credentials.refresh,
    oauthCredentials: credentials,
    savedAt: new Date().toISOString(),
  });

  return credentials.refresh;
}

/**
 * Store a setup token from `claude setup-token`
 */
export function storeSetupToken(token: string): void {
  saveStored({
    setupToken: token,
    savedAt: new Date().toISOString(),
  });
}

/**
 * Check if we have stored credentials
 */
export function hasStoredCredentials(): boolean {
  return loadStored() !== null;
}

/**
 * Clear stored credentials
 */
export function clearCredentials(): void {
  if (existsSync(CREDS_PATH)) {
    writeFileSync(CREDS_PATH, "{}", "utf-8");
  }
}
