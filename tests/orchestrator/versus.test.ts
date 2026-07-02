import { describe, it, expect, afterEach } from "vitest";
import { assignVersusRoles } from "../../src/orchestrator/versus.js";

const ORIGINAL = process.env.WARROOM_VERSUS_ROLES;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.WARROOM_VERSUS_ROLES;
  else process.env.WARROOM_VERSUS_ROLES = ORIGINAL;
});

describe("assignVersusRoles", () => {
  it("defaults to the adversarial roles", () => {
    delete process.env.WARROOM_VERSUS_ROLES;
    expect(assignVersusRoles()).toEqual(["challenger", "breaker"]);
  });

  it("honors a comma-separated override", () => {
    process.env.WARROOM_VERSUS_ROLES = "architect, builder";
    expect(assignVersusRoles()).toEqual(["architect", "builder"]);
  });

  it("ignores unknown role names", () => {
    process.env.WARROOM_VERSUS_ROLES = "architect, wizard, breaker";
    expect(assignVersusRoles()).toEqual(["architect", "breaker"]);
  });

  it("falls back to the default when the override has no valid roles", () => {
    process.env.WARROOM_VERSUS_ROLES = "wizard, goblin";
    expect(assignVersusRoles()).toEqual(["challenger", "breaker"]);
  });
});
