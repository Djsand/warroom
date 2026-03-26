import { describe, it, expect } from "vitest";
import { Thread } from "../../src/conversation/thread.js";
import { renderConversation } from "../../src/conversation/renderer.js";

describe("renderConversation", () => {
  it("renders empty thread", () => {
    const thread = new Thread("Add auth");
    const md = renderConversation(thread);
    expect(md).toContain("# warroom conversation");
    expect(md).toContain("Add auth");
  });

  it("renders messages grouped by phase", () => {
    const thread = new Thread("Add auth");
    thread.add({ role: "architect", content: "I propose middleware auth.", phase: "design" });
    thread.add({ role: "challenger", content: "What about WebSockets?", phase: "design" });
    thread.add({ role: "builder", content: "Built it.", phase: "build" });

    const md = renderConversation(thread);
    expect(md).toContain("## Phase 1: Design");
    expect(md).toContain("## Phase 2: Build");
    expect(md).toContain("Architect");
    expect(md).toContain("I propose middleware auth.");
    expect(md).toContain("Challenger");
    expect(md).toContain("What about WebSockets?");
  });

  it("includes stats footer", () => {
    const thread = new Thread("Add auth");
    thread.add({ role: "architect", content: "Design", phase: "design" });
    thread.add({ role: "builder", content: "Code", phase: "build" });

    const md = renderConversation(thread);
    expect(md).toContain("agents");
    expect(md).toContain("messages");
  });
});
