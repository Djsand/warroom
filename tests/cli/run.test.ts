import { describe, it, expect } from "vitest";
import { formatStats } from "../../src/cli/run.js";
import type { ConversationStats, ConversationMessage } from "../../src/types.js";

function makeMessage(role: ConversationMessage["role"], phase: ConversationMessage["phase"]): ConversationMessage {
  return { role, content: "test", phase, timestamp: new Date() };
}

describe("formatStats", () => {
  it("returns a single-line summary with correct counts", () => {
    const stats: ConversationStats = {
      totalMessages: 8,
      designRevisions: 2,
      bugsCaught: 3,
      filesChanged: 6,
      linesAdded: 200,
      durationMs: 120_000,
    };

    const messages: ConversationMessage[] = [
      makeMessage("architect", "design"),
      makeMessage("challenger", "design"),
      makeMessage("builder", "build"),
      makeMessage("reviewer", "review"),
      makeMessage("breaker", "review"),
    ];

    const output = formatStats(stats, messages);

    expect(output).toContain("5 agents");
    expect(output).toContain("8 messages");
    expect(output).toContain("2 revisions");
    expect(output).toContain("3 bugs caught");
    expect(output).toContain("6 files");
    expect(output).toContain("120s");
  });

  it("counts unique agents correctly when roles repeat", () => {
    const stats: ConversationStats = {
      totalMessages: 4,
      designRevisions: 1,
      bugsCaught: 0,
      filesChanged: 2,
      linesAdded: 50,
      durationMs: 30_000,
    };

    const messages: ConversationMessage[] = [
      makeMessage("architect", "design"),
      makeMessage("architect", "design"),
      makeMessage("builder", "build"),
      makeMessage("builder", "build"),
    ];

    const output = formatStats(stats, messages);

    expect(output).toContain("2 agents");
  });

  it("rounds duration to nearest second", () => {
    const stats: ConversationStats = {
      totalMessages: 1,
      designRevisions: 0,
      bugsCaught: 0,
      filesChanged: 0,
      linesAdded: 0,
      durationMs: 1_500,
    };

    const messages: ConversationMessage[] = [
      makeMessage("architect", "design"),
    ];

    const output = formatStats(stats, messages);

    expect(output).toContain("2s");
  });
});
