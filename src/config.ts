import { resolveStoredApiKey } from "./auth/oauth.js";
import {
  isCodexAvailable,
  resolveCodexAccessToken,
  readCodexModelPrefs,
} from "./auth/codex.js";
import { resolveGlmAuth } from "./auth/glm.js";
import { assignVersusRoles } from "./orchestrator/versus.js";
import type { GapsConfig, GapsAuth, Provider, VersusConfig } from "./types.js";

export type ProviderChoice = Provider | "auto";

export interface LoadConfigOptions {
  /** Force a backend, or "auto" to detect one. Default "auto". */
  provider?: ProviderChoice;
  /** Cross-model debate: run some roles on the opposing provider. */
  versus?: boolean;
}

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";

/** Order tried in "auto" mode and when picking a cross-model opponent. */
const PROVIDER_ORDER: Provider[] = ["anthropic", "glm", "codex"];

interface ResolvedProvider {
  auth: GapsAuth;
  provider: Provider;
  /** Default model for this provider (architect + agents unless overridden). */
  model: string;
}

/**
 * Resolve authentication and models.
 *
 * Detection order in "auto" mode:
 *   1. ANTHROPIC_API_KEY / CLAUDE_CODE_OAUTH_TOKEN env, or ~/.warroom (Claude)
 *   2. ZAI_API_KEY env, or ~/.warroom/glm.json (Z.ai GLM coding plan)
 *   3. A logged-in Codex CLI (~/.codex/auth.json) — zero-config ChatGPT
 */
export async function loadConfig(opts: LoadConfigOptions = {}): Promise<GapsConfig> {
  const choice = opts.provider ?? "auto";
  const primary = await resolvePrimary(choice);

  const architectModel = process.env.WARROOM_ARCHITECT_MODEL ?? primary.model;
  const agentModel = process.env.WARROOM_AGENT_MODEL ?? primary.model;

  const versus = opts.versus ? await resolveVersus(primary.provider) : null;

  return {
    auth: primary.auth,
    provider: primary.provider,
    architectModel,
    agentModel,
    maxDesignRounds: Number(process.env.WARROOM_MAX_DESIGN_ROUNDS ?? 4),
    maxReviewRounds: Number(process.env.WARROOM_MAX_REVIEW_ROUNDS ?? 3),
    outputDir: ".warroom",
    versus,
  };
}

/** Resolve a single, concrete provider's credentials, or null if unavailable. */
async function resolveProvider(provider: Provider): Promise<ResolvedProvider | null> {
  switch (provider) {
    case "anthropic":
      return resolveAnthropic();
    case "glm":
      return resolveGlm();
    case "codex":
      return resolveCodex();
  }
}

async function resolvePrimary(choice: ProviderChoice): Promise<ResolvedProvider> {
  if (choice !== "auto") {
    const resolved = await resolveProvider(choice);
    if (!resolved) throw providerError(choice);
    return resolved;
  }

  for (const provider of PROVIDER_ORDER) {
    const resolved = await resolveProvider(provider);
    if (resolved) return resolved;
  }
  throw noAuthError();
}

function resolveAnthropic(): ResolvedProvider | null {
  const envKey = process.env.ANTHROPIC_API_KEY;
  const oauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN ?? process.env.ANTHROPIC_AUTH_TOKEN;
  const token = envKey ?? oauthToken ?? resolveStoredApiKey();
  if (!token) return null;

  return {
    auth: { provider: "anthropic", method: "api-key", token },
    provider: "anthropic",
    model: DEFAULT_ANTHROPIC_MODEL,
  };
}

function resolveGlm(): ResolvedProvider | null {
  const glm = resolveGlmAuth();
  if (!glm) return null;

  return {
    auth: { provider: "glm", method: "api-key", token: glm.token, baseUrl: glm.baseUrl },
    provider: "glm",
    model: glm.model,
  };
}

async function resolveCodex(): Promise<ResolvedProvider | null> {
  if (!isCodexAvailable()) return null;
  const token = await resolveCodexAccessToken();
  return {
    auth: { provider: "codex", method: "oauth-token", token },
    provider: "codex",
    model: readCodexModelPrefs().model,
  };
}

/** Build the opposing side for a cross-model debate: the first other provider available. */
async function resolveVersus(primary: Provider): Promise<VersusConfig> {
  for (const provider of PROVIDER_ORDER) {
    if (provider === primary) continue;
    const opponent = await resolveProvider(provider);
    if (opponent) {
      return { auth: opponent.auth, model: opponent.model, roles: assignVersusRoles() };
    }
  }

  throw new Error(
    "--versus needs a second provider authenticated (Claude, Codex, or GLM).\n" +
      "Add one: `codex login`, `warroom setup --codex-login`, " +
      "`warroom setup --glm-key <key>`, or export ANTHROPIC_API_KEY / ZAI_API_KEY.",
  );
}

function noAuthError(): Error {
  return new Error(
    "No authentication found. Set up with one of:\n\n" +
      "  1. warroom setup --token <token>   (paste from `claude setup-token`)\n" +
      "  2. warroom setup --login           (browser OAuth for Claude)\n" +
      "  3. warroom setup --codex-login     (ChatGPT / Codex login)\n" +
      "  4. warroom setup --glm-key <key>   (Z.ai GLM coding plan)\n" +
      "  5. codex login                     (reuse the Codex CLI login)\n" +
      "  6. export ANTHROPIC_API_KEY=...    (Claude API key)\n" +
      "  7. export ZAI_API_KEY=...          (Z.ai GLM key)\n\n" +
      "Run `warroom setup` for options.",
  );
}

function providerError(provider: Provider): Error {
  const hints: Record<Provider, string> = {
    anthropic:
      "Set ANTHROPIC_API_KEY, run `warroom setup`, or pick another provider.",
    codex: "Log in with `codex login` or run `warroom setup --codex-login`.",
    glm: "Set ZAI_API_KEY or run `warroom setup --glm-key <key>`.",
  };
  return new Error(`No ${provider} credentials found. ${hints[provider]}`);
}
