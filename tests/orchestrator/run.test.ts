import { describe, it, expect, vi } from "vitest";
import { runGaps } from "../../src/orchestrator/run.js";

vi.mock("../../src/orchestrator/phases.js", () => ({
  runDesignPhase: vi.fn(async (thread: any) => {
    thread.add({ role: "architect", content: "Design proposal", phase: "design" });
    thread.add({ role: "challenger", content: "Design approved.", phase: "design" });
  }),
  runBuildPhase: vi.fn(async (thread: any) => {
    thread.add({
      role: "builder", content: "Built it.", phase: "build",
      codeChanges: [{ filePath: "src/app.ts", content: "code", action: "create" }],
    });
    return [{ filePath: "src/app.ts", content: "code", action: "create" }];
  }),
  runReviewPhase: vi.fn(async (thread: any) => {
    thread.add({ role: "reviewer", content: "LGTM", phase: "review" });
    thread.add({ role: "breaker", content: "Passed adversarial review.", phase: "review" });
    return true;
  }),
}));

describe("runGaps", () => {
  it("produces a complete result with conversation and summary", async () => {
    const result = await runGaps({
      task: "Add auth",
      auth: { method: "api-key" as const, token: "test" },
      projectDir: "/tmp/test",
      projectContext: "",
    });

    expect(result.task).toBe("Add auth");
    expect(result.messages.length).toBeGreaterThan(0);
    expect(result.stats.totalMessages).toBeGreaterThan(0);
    expect(result.conversationMd).toContain("warroom conversation");
    expect(result.summaryMd).toContain("warroom summary");
  });
});
