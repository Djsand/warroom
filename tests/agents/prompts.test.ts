import { describe, it, expect } from "vitest";
import { getSystemPrompt } from "../../src/agents/prompts.js";

describe("getSystemPrompt", () => {
  it("returns architect prompt with task context", () => {
    const prompt = getSystemPrompt("architect", "Add user auth", "Express.js API");
    expect(prompt).toContain("Architect");
    expect(prompt).toContain("Add user auth");
    expect(prompt).toContain("Express.js");
    expect(prompt).toContain("elegance");
  });

  it("returns challenger prompt that is adversarial", () => {
    const prompt = getSystemPrompt("challenger", "Add auth", "");
    expect(prompt).toContain("Challenger");
    expect(prompt).toContain("disagree");
  });

  it("returns builder prompt focused on implementation", () => {
    const prompt = getSystemPrompt("builder", "Add auth", "");
    expect(prompt).toContain("Builder");
    expect(prompt).toContain("implement");
  });

  it("returns reviewer prompt focused on quality", () => {
    const prompt = getSystemPrompt("reviewer", "Add auth", "");
    expect(prompt).toContain("Reviewer");
    expect(prompt).toContain("quality");
  });

  it("returns breaker prompt focused on finding failures", () => {
    const prompt = getSystemPrompt("breaker", "Add auth", "");
    expect(prompt).toContain("Breaker");
    expect(prompt).toContain("break");
  });

  it("all prompts are substantial (over 200 chars)", () => {
    const roles = ["architect", "challenger", "builder", "reviewer", "breaker"] as const;
    for (const role of roles) {
      const prompt = getSystemPrompt(role, "task", "context");
      expect(prompt.length).toBeGreaterThan(200);
    }
  });
});
