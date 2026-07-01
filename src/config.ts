import { resolveStoredApiKey } from "./auth/oauth.js";
import {
  isCodexAvailable,
  resolveCodexAccessToken,
  readCodexModelPrefs,
} from "./auth/codex.js";
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
 *   1. ANTHROPIC_API_KEY / CLAUDE_CODE_OAUTH_TOKEN env vars
 *   2. ~/.warroom/credentials.json (from `warroom setup`)
 *   3. A logged-in Codex CLI (~/.codex/auth.json) — zero-config ChatGPT
 */
export async function loadConfig(opts: LoadConfigOptions = {}): Promise<GapsConfig> {
  const choice = opts.provider ?? "auto";
  const primary = await resolvePrimary(choice);

  const architectModel =
    process.env.WARROOM_ARCHITECT_MODEL ?? primary.model;
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

async function resolvePrimary(choice: ProviderChoice): Promise<ResolvedProvider> {
  if (choice === "codex") {
    const codex = await resolveCodex();
    if (!codex) throw codexError();
    return codex;
  }

  if (choice === "anthropic") {
    const anthropic = resolveAnthropic();
    if (!anthropic) throw anthropicError();
    return anthropic;
  }

  // auto: prefer an explicitly configured Anthropic key, then Codex CLI.
  return resolveAnthropic() ?? (await resolveCodex()) ?? throwNoAuth();
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

async function resolveCodex(): Promise<ResolvedProvider | null> {
  if (!isCodexAvailable()) return null;
  const token = await resolveCodexAccessToken();
  return {
    auth: { provider: "codex", method: "oauth-token", token },
    provider: "codex",
    model: readCodexModelPrefs().model,
  };
}

/** Build the opposing side for a cross-model debate. */
async function resolveVersus(primary: Provider): Promise<VersusConfig> {
  const opponentProvider: Provider = primary === "anthropic" ? "codex" : "anthropic";
  const opponent =
    opponentProvider === "codex" ? await resolveCodex() : resolveAnthropic();

  if (!opponent) {
    throw new Error(
      `--versus needs both providers authenticated, but ${opponentProvider} is not available.\n` +
        (opponentProvider === "codex"
          ? "Log in with `codex login` or `warroom setup --codex-login`."
          : "Set ANTHROPIC_API_KEY or run `warroom setup`."),
    );
  }

  return {
    auth: opponent.auth,
    model: opponent.model,
    roles: assignVersusRoles(),
  };
}

function throwNoAuth(): never {
  throw new Error(
    "No authentication found. Set up with one of:\n\n" +
      "  1. warroom setup --token <token>   (paste from `claude setup-token`)\n" +
      "  2. warroom setup --login           (browser OAuth for Claude)\n" +
      "  3. warroom setup --codex-login     (ChatGPT / Codex login)\n" +
      "  4. codex login                     (reuse the Codex CLI login)\n" +
      "  5. export ANTHROPIC_API_KEY=...    (API key)\n\n" +
      "Run `warroom setup` for options.",
  );
}

function anthropicError(): Error {
  return new Error(
    "No Anthropic credentials found. Set ANTHROPIC_API_KEY, run `warroom setup`, " +
      "or use `--provider codex`.",
  );
}

function codexError(): Error {
  return new Error(
    "No Codex login found. Log in with `codex login` or run `warroom setup --codex-login`.",
  );
}
