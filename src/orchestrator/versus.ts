import type { AgentRole } from "../types.js";

/**
 * Cross-model debate ("--versus"): warroom runs the five agents across TWO
 * different model providers (e.g. Claude and GPT) so the disagreement is not
 * just role-vs-role but model-vs-model. The roles listed here run on the
 * *opposing* provider; everyone else stays on the primary provider.
 *
 * Which roles should switch sides is a genuine design choice with real
 * trade-offs, so it lives in one small function you can tune:
 *
 *   - Adversaries switch (default): the Challenger and Breaker — the agents
 *     whose whole job is to disagree — run on the other lab's model. You get a
 *     real "Claude proposes, GPT attacks" dynamic, and the debate can't
 *     collapse into one model agreeing with itself.
 *
 *   - Designers switch: put the Architect (and maybe Builder) on the opposing
 *     model instead, so the *proposals* come from the other lab and your
 *     primary model does the critiquing.
 *
 *   - Split the pipeline: e.g. design on one model, review on the other.
 *
 * Override at runtime with WARROOM_VERSUS_ROLES (comma-separated role names),
 * or edit the default below.
 */

const ALL_ROLES: readonly AgentRole[] = [
  "architect",
  "challenger",
  "builder",
  "reviewer",
  "breaker",
];

/** Roles that run on the opposing provider when no override is set. */
const DEFAULT_OPPOSING_ROLES: AgentRole[] = ["challenger", "breaker"];

export function assignVersusRoles(): AgentRole[] {
  const override = process.env.WARROOM_VERSUS_ROLES;
  if (!override) return DEFAULT_OPPOSING_ROLES;

  const parsed = override
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .filter((r): r is AgentRole => (ALL_ROLES as readonly string[]).includes(r));

  return parsed.length > 0 ? parsed : DEFAULT_OPPOSING_ROLES;
}
