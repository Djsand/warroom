import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import {
  loginOpenAICodex,
  refreshOpenAICodexToken,
  type OAuthCredentials,
} from "@mariozechner/pi-ai/oauth";

/**
 * Codex CLI (OpenAI ChatGPT) authentication.
 *
 * The Codex CLI stores a ChatGPT OAuth session in ~/.codex/auth.json. warroom
 * reads that file directly so a user who is already logged in with `codex`
 * needs zero extra setup. The account id required by the ChatGPT backend is
 * encoded inside the access-token JWT, so the provider derives it per call —
 * we only ever persist the access + refresh tokens.
 */

const CODEX_DIR = join(homedir(), ".codex");
const CODEX_AUTH_PATH = join(CODEX_DIR, "auth.json");
const CODEX_CONFIG_PATH = join(CODEX_DIR, "config.toml");

// warroom's own copy, written by `warroom setup --codex-login` so we never
// clobber the real Codex CLI credentials.
const WARROOM_DIR = join(homedir(), ".warroom");
const WARROOM_CODEX_PATH = join(WARROOM_DIR, "codex.json");

/** Refresh a token this many ms before it actually expires. */
const EXPIRY_SKEW_MS = 60_000;

/** The default model when ~/.codex/config.toml can't be read. */
export const DEFAULT_CODEX_MODEL = "gpt-5.5";

interface CodexAuthFile {
  auth_mode?: string;
  OPENAI_API_KEY?: string | null;
  tokens?: {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    account_id?: string;
  };
  last_refresh?: string;
}

/** Where a set of Codex credentials came from, so refreshes write back correctly. */
type CredentialSource = "codex-cli" | "warroom";

interface LoadedCredentials {
  creds: OAuthCredentials;
  source: CredentialSource;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Read the access-token expiry (ms epoch) from its JWT `exp` claim. */
function tokenExpiry(accessToken: string): number {
  const payload = decodeJwtPayload(accessToken);
  const exp = payload && typeof payload.exp === "number" ? payload.exp : 0;
  return exp > 0 ? exp * 1000 : 0;
}

function readJsonFile<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

/** Turn a Codex auth.json into pi-ai OAuthCredentials, or null if not a ChatGPT session. */
function credentialsFromAuthFile(file: CodexAuthFile | null): OAuthCredentials | null {
  const tokens = file?.tokens;
  if (!tokens?.access_token || !tokens?.refresh_token) return null;
  return {
    access: tokens.access_token,
    refresh: tokens.refresh_token,
    expires: tokenExpiry(tokens.access_token),
  };
}

function loadCodexCliCredentials(): OAuthCredentials | null {
  return credentialsFromAuthFile(readJsonFile<CodexAuthFile>(CODEX_AUTH_PATH));
}

function loadWarroomCredentials(): OAuthCredentials | null {
  const stored = readJsonFile<OAuthCredentials>(WARROOM_CODEX_PATH);
  if (stored?.access && stored?.refresh) return stored;
  return null;
}

/**
 * Load Codex credentials, preferring the live Codex CLI login and falling back
 * to a warroom-owned copy from `warroom setup --codex-login`.
 */
function loadCredentials(): LoadedCredentials | null {
  const cli = loadCodexCliCredentials();
  if (cli) return { creds: cli, source: "codex-cli" };
  const warroom = loadWarroomCredentials();
  if (warroom) return { creds: warroom, source: "warroom" };
  return null;
}

/** True when any usable Codex login exists on this machine. */
export function isCodexAvailable(): boolean {
  return loadCredentials() !== null;
}

/** Persist refreshed tokens back to whichever store they came from, preserving unknown fields. */
function persistRefreshed(creds: OAuthCredentials, source: CredentialSource): void {
  if (source === "warroom") {
    mkdirSync(WARROOM_DIR, { recursive: true });
    writeAtomic(WARROOM_CODEX_PATH, JSON.stringify(creds, null, 2));
    return;
  }

  // codex-cli: keep the file shape the Codex CLI expects; only swap token fields.
  const existing = readJsonFile<CodexAuthFile>(CODEX_AUTH_PATH) ?? {};
  const updated: CodexAuthFile = {
    ...existing,
    tokens: {
      ...existing.tokens,
      access_token: creds.access,
      refresh_token: creds.refresh,
    },
    last_refresh: new Date().toISOString(),
  };
  writeAtomic(CODEX_AUTH_PATH, JSON.stringify(updated, null, 2));
}

function writeAtomic(path: string, contents: string): void {
  const tmp = `${path}.warroom.tmp`;
  writeFileSync(tmp, contents, { encoding: "utf-8", mode: 0o600 });
  renameSync(tmp, path);
}

/**
 * Return a valid Codex access token, refreshing it first if it is expired or
 * about to expire. Throws if no Codex login is present.
 */
export async function resolveCodexAccessToken(): Promise<string> {
  const loaded = loadCredentials();
  if (!loaded) {
    throw new Error(
      "No Codex login found. Log in with the Codex CLI (`codex login`) or run " +
        "`warroom setup --codex-login`.",
    );
  }

  const { creds, source } = loaded;
  const fresh = creds.expires > 0 && creds.expires - EXPIRY_SKEW_MS <= Date.now();
  if (!fresh) return creds.access;

  const refreshed = await refreshOpenAICodexToken(creds.refresh);
  persistRefreshed(refreshed, source);
  return refreshed.access;
}

export interface CodexModelPrefs {
  model: string;
  effort?: string;
}

/**
 * Read the model (and reasoning effort) the user's own Codex CLI is configured
 * with, so warroom debates on the same model they already use. Falls back to a
 * sensible default when config.toml is absent or unparseable.
 */
export function readCodexModelPrefs(): CodexModelPrefs {
  const fallback: CodexModelPrefs = { model: DEFAULT_CODEX_MODEL };
  if (!existsSync(CODEX_CONFIG_PATH)) return fallback;

  let toml: string;
  try {
    toml = readFileSync(CODEX_CONFIG_PATH, "utf-8");
  } catch {
    return fallback;
  }
  return parseCodexModelPrefs(toml);
}

/** Pure parser for the model prefs in a Codex config.toml. */
export function parseCodexModelPrefs(toml: string): CodexModelPrefs {
  // Top-level TOML keys sit at column 0; grab the first occurrence of each
  // before any [section] header would scope them.
  const model = matchTopLevel(toml, "model") ?? DEFAULT_CODEX_MODEL;
  const effort = matchTopLevel(toml, "model_reasoning_effort") ?? undefined;
  return { model, effort };
}

function matchTopLevel(toml: string, key: string): string | null {
  const re = new RegExp(`^${key}\\s*=\\s*"([^"]+)"`, "m");
  const m = toml.match(re);
  return m ? m[1] : null;
}

/** Email of the logged-in ChatGPT account, for display in `warroom status`. */
export function codexAccountLabel(): string | null {
  const loaded = loadCredentials();
  if (!loaded) return null;
  const payload = decodeJwtPayload(loaded.creds.access);
  const auth = payload?.["https://api.openai.com/auth"] as Record<string, unknown> | undefined;
  const plan = auth?.chatgpt_plan_type;
  const id = readJsonFile<CodexAuthFile>(CODEX_AUTH_PATH)?.tokens?.id_token;
  const email = id ? (decodeJwtPayload(id)?.email as string | undefined) : undefined;
  const source = loaded.source === "codex-cli" ? "Codex CLI" : "warroom";
  const bits = [email, typeof plan === "string" ? `${plan} plan` : null, `via ${source}`].filter(
    Boolean,
  );
  return bits.join(" · ");
}

/**
 * Run the ChatGPT OAuth flow and store the result in warroom's own credential
 * file (leaving any existing Codex CLI login untouched).
 */
export async function loginCodex(): Promise<void> {
  const creds = await loginOpenAICodex({
    originator: "warroom",
    onAuth: (info) => {
      console.log(`\nOpen this URL to authenticate with ChatGPT:\n  ${info.url}\n`);
      if (info.instructions) console.log(info.instructions);
    },
    onPrompt: async (prompt) => {
      console.log(prompt.message);
      return "";
    },
    onProgress: (message) => console.log(`  ${message}`),
  });

  mkdirSync(WARROOM_DIR, { recursive: true });
  writeAtomic(WARROOM_CODEX_PATH, JSON.stringify(creds, null, 2));
}
