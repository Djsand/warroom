import { describe, it, expect } from "vitest";
import { Thread } from "../../src/conversation/thread.js";
import { renderSummary } from "../../src/conversation/summary.js";

describe("renderSummary", () => {
  it("renders task name and result", () => {
    const thread = new Thread("Add user auth");
    thread.add({ role: "architect", content: "Design done", phase: "design" });

    const md = renderSummary(thread, "warroom/add-auth");
    expect(md).toContain("# warroom summary");
    expect(md).toContain("Add user auth");
    expect(md).toContain("COMPLETE");
  });

  it("includes stats section", () => {
    const thread = new Thread("Add auth");
    thread.add({ role: "architect", content: "Design", phase: "design" });
    thread.add({ role: "challenger", content: "Critique", phase: "design" });
    thread.add({
      role: "builder",
      content: "Built",
      phase: "build",
      codeChanges: [{ filePath: "src/auth.ts", content: "code", action: "create" }],
    });

    const md = renderSummary(thread, "warroom/add-auth");
    expect(md).toContain("3 messages");
    expect(md).toContain("1 files changed");
  });

  it("includes branch name", () => {
    const thread = new Thread("Add auth");
    const md = renderSummary(thread, "warroom/add-auth-2026-03-26");
    expect(md).toContain("warroom/add-auth-2026-03-26");
  });
});
