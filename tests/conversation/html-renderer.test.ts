import { describe, it, expect } from "vitest";
import { Thread } from "../../src/conversation/thread.js";
import { renderConversationHtml } from "../../src/conversation/html-renderer.js";

describe("renderConversationHtml", () => {
  it("renders a valid standalone HTML document", () => {
    const thread = new Thread("Add auth");
    const html = renderConversationHtml(thread);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
    expect(html).toContain("<style>");
    expect(html).toContain("Add auth");
  });

  it("includes no external resource references", () => {
    const thread = new Thread("Add auth");
    thread.add({ role: "architect", content: "Design plan.", phase: "design" });
    const html = renderConversationHtml(thread);
    expect(html).not.toContain("<link");
    expect(html).not.toContain("<script");
  });

  it("renders participant badges with correct colors", () => {
    const thread = new Thread("Add auth");
    thread.add({ role: "architect", content: "Plan.", phase: "design" });
    thread.add({ role: "challenger", content: "Challenge.", phase: "design" });
    thread.add({ role: "builder", content: "Build.", phase: "build" });

    const html = renderConversationHtml(thread);
    expect(html).toContain("#3b82f6"); // architect blue
    expect(html).toContain("#f97316"); // challenger orange
    expect(html).toContain("#22c55e"); // builder green
    expect(html).toContain("Architect");
    expect(html).toContain("Challenger");
    expect(html).toContain("Builder");
  });

  it("renders messages grouped by phase", () => {
    const thread = new Thread("Add auth");
    thread.add({ role: "architect", content: "I propose middleware.", phase: "design" });
    thread.add({ role: "builder", content: "Built it.", phase: "build" });
    thread.add({ role: "reviewer", content: "Looks good.", phase: "review" });

    const html = renderConversationHtml(thread);
    expect(html).toContain("Phase 1: Design");
    expect(html).toContain("Phase 2: Build");
    expect(html).toContain("Phase 3: Review");
    expect(html).toContain("I propose middleware.");
    expect(html).toContain("Built it.");
    expect(html).toContain("Looks good.");
  });

  it("renders code blocks with dark background", () => {
    const thread = new Thread("Add auth");
    thread.add({
      role: "builder",
      content: "Here is the code:\n```typescript\nconst x = 1;\n```\nDone.",
      phase: "build",
    });

    const html = renderConversationHtml(thread);
    expect(html).toContain("code-block");
    expect(html).toContain("const x = 1;");
    expect(html).toContain("typescript");
    expect(html).toContain("#1e293b"); // dark background color
  });

  it("escapes HTML in message content", () => {
    const thread = new Thread("XSS test");
    thread.add({
      role: "architect",
      content: '<script>alert("xss")</script>',
      phase: "design",
    });

    const html = renderConversationHtml(thread);
    expect(html).not.toContain('<script>alert("xss")</script>');
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders reviewer and breaker with correct colors", () => {
    const thread = new Thread("Test colors");
    thread.add({ role: "reviewer", content: "Review.", phase: "review" });
    thread.add({ role: "breaker", content: "Break.", phase: "review" });

    const html = renderConversationHtml(thread);
    expect(html).toContain("#a855f7"); // reviewer purple
    expect(html).toContain("#eab308"); // breaker amber
  });

  it("includes stats footer", () => {
    const thread = new Thread("Stats test");
    thread.add({ role: "architect", content: "Design.", phase: "design" });
    thread.add({ role: "builder", content: "Build.", phase: "build" });

    const html = renderConversationHtml(thread);
    expect(html).toContain("2 agents");
    expect(html).toContain("2 messages");
  });

  it("renders responsive viewport meta tag", () => {
    const thread = new Thread("Responsive");
    const html = renderConversationHtml(thread);
    expect(html).toContain('name="viewport"');
    expect(html).toContain("width=device-width");
  });
});
