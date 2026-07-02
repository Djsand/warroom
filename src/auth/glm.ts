import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

/**
 * Z.ai GLM coding plan.
 *
 * Z.ai exposes an Anthropic-compatible endpoint, so GLM runs through warroom's
 * existing Anthropic path with a custom base URL and a Bearer key — the same
 * setup Claude Code uses (ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN).
 */

export const GLM_BASE_URL = "https://api.z.ai/api/anthropic";

// The flagship coding-plan model the user asked for. GLM-5.2 spends 2–3× quota;
// set WARROOM_AGENT_MODEL=glm-4.7 (or glm-5-turbo) for lighter routine runs.
export const DEFAULT_GLM_MODEL = "glm-5.2";

const WARROOM_DIR = join(homedir(), ".warroom");
const GLM_STORE_PATH = join(WARROOM_DIR, "glm.json");

interface GlmStore {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface GlmAuth {
  token: string;
  baseUrl: string;
  model: string;
  source: "env" | "warroom";
}

function readStore(): GlmStore | null {
  if (!existsSync(GLM_STORE_PATH)) return null;
  try {
    const data = JSON.parse(readFileSync(GLM_STORE_PATH, "utf-8")) as GlmStore;
    return data.apiKey ? data : null;
  } catch {
    return null;
  }
}

/** Z.ai API key from the environment, under any of the common names. */
function envKey(): string | null {
  return (
    process.env.ZAI_API_KEY ??
    process.env.Z_AI_API_KEY ??
    process.env.GLM_API_KEY ??
    process.env.ZHIPU_API_KEY ??
    null
  );
}

/**
 * Resolve GLM credentials: an explicit env key wins, otherwise a key stored by
 * `warroom setup --glm-key`. Returns null when no GLM key is configured.
 */
export function resolveGlmAuth(): GlmAuth | null {
  const fromEnv = envKey();
  if (fromEnv) {
    return {
      token: fromEnv,
      baseUrl: process.env.ZAI_BASE_URL ?? GLM_BASE_URL,
      model: process.env.WARROOM_AGENT_MODEL ?? DEFAULT_GLM_MODEL,
      source: "env",
    };
  }

  const store = readStore();
  if (store) {
    return {
      token: store.apiKey,
      baseUrl: store.baseUrl ?? GLM_BASE_URL,
      model: store.model ?? DEFAULT_GLM_MODEL,
      source: "warroom",
    };
  }

  return null;
}

export function isGlmAvailable(): boolean {
  return resolveGlmAuth() !== null;
}

/** One-line summary for `warroom status` / `warroom setup`. */
export function glmAccountLabel(): string | null {
  const auth = resolveGlmAuth();
  if (!auth) return null;
  const where = auth.source === "env" ? "env" : "warroom";
  return `Z.ai GLM · ${auth.model} · via ${where}`;
}

/** Persist a Z.ai API key (and optional base URL / model) to ~/.warroom/glm.json. */
export function storeGlmKey(apiKey: string, opts: { baseUrl?: string; model?: string } = {}): void {
  mkdirSync(WARROOM_DIR, { recursive: true });
  const store: GlmStore = {
    apiKey,
    ...(opts.baseUrl ? { baseUrl: opts.baseUrl } : {}),
    ...(opts.model ? { model: opts.model } : {}),
  };
  const tmp = `${GLM_STORE_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(store, null, 2), { encoding: "utf-8", mode: 0o600 });
  renameSync(tmp, GLM_STORE_PATH);
}
