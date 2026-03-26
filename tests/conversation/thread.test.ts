import { describe, it, expect } from "vitest";
import { Thread } from "../../src/conversation/thread.js";

describe("Thread", () => {
  it("starts empty", () => {
    const thread = new Thread("Add auth");
    expect(thread.messages).toEqual([]);
    expect(thread.task).toBe("Add auth");
  });

  it("adds messages", () => {
    const thread = new Thread("Add auth");
    thread.add({ role: "architect", content: "I propose...", phase: "design" });
    expect(thread.messages).toHaveLength(1);
    expect(thread.messages[0].role).toBe("architect");
    expect(thread.messages[0].timestamp).toBeInstanceOf(Date);
  });

  it("returns messages for a specific phase", () => {
    const thread = new Thread("Add auth");
    thread.add({ role: "architect", content: "Design A", phase: "design" });
    thread.add({ role: "builder", content: "Built it", phase: "build" });
    thread.add({ role: "reviewer", content: "Looks good", phase: "review" });

    const designMessages = thread.messagesForPhase("design");
    expect(designMessages).toHaveLength(1);
    expect(designMessages[0].role).toBe("architect");
  });

  it("formats thread as prompt context", () => {
    const thread = new Thread("Add auth");
    thread.add({ role: "architect", content: "I propose X", phase: "design" });
    thread.add({ role: "challenger", content: "What about Y?", phase: "design" });

    const context = thread.toPromptContext();
    expect(context).toContain("Architect");
    expect(context).toContain("I propose X");
    expect(context).toContain("Challenger");
    expect(context).toContain("What about Y?");
  });

  it("tracks stats", () => {
    const thread = new Thread("Add auth");
    thread.add({ role: "architect", content: "V1", phase: "design" });
    thread.add({ role: "challenger", content: "No", phase: "design" });
    thread.add({ role: "architect", content: "V2", phase: "design" });
    thread.add({
      role: "builder",
      content: "Built",
      phase: "build",
      codeChanges: [
        { filePath: "src/auth.ts", content: "code", action: "create" },
        { filePath: "src/session.ts", content: "code", action: "create" },
      ],
    });
    thread.add({ role: "reviewer", content: "Found bug: X", phase: "review" });

    const stats = thread.getStats();
    expect(stats.totalMessages).toBe(5);
    expect(stats.filesChanged).toBe(2);
  });
});
