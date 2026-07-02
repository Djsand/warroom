import { describe, it, expect } from "vitest";
import { parseCodexModelPrefs, DEFAULT_CODEX_MODEL } from "../../src/auth/codex.js";

describe("parseCodexModelPrefs", () => {
  it("reads the top-level model and reasoning effort", () => {
    const toml = [
      '# Codex config',
      'model = "gpt-5.5"',
      'model_reasoning_effort = "xhigh"',
      '',
      '[history]',
      'persistence = "save-all"',
    ].join("\n");

    expect(parseCodexModelPrefs(toml)).toEqual({ model: "gpt-5.5", effort: "xhigh" });
  });

  it("falls back to the default model when unset", () => {
    expect(parseCodexModelPrefs("[history]\npersistence = \"none\"")).toEqual({
      model: DEFAULT_CODEX_MODEL,
      effort: undefined,
    });
  });

  it("does not pick up a model key nested in a section", () => {
    // A section-scoped `model =` sits after a header; the top-level anchor
    // still matches column-0 keys, so a leading-space key is ignored.
    const toml = '[providers.custom]\n  model = "nested-should-be-ignored"';
    expect(parseCodexModelPrefs(toml).model).toBe(DEFAULT_CODEX_MODEL);
  });
});
